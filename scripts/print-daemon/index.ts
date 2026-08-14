/**
 * Kitchen print daemon.
 *
 * Runs on a device physically on the same LAN as the thermal printer (e.g. a
 * Raspberry Pi at the counter). Subscribes to Supabase Realtime for new
 * orders and prints tickets directly to the printer over the LAN.
 *
 * This replaces the old flow where a Vercel-hosted webhook route pushed
 * print jobs to the printer over the internet, which required forwarding a
 * router port to the printer (via a No-IP dynamic DNS hostname) with no
 * authentication on the printer's own HTTP endpoint. Running this daemon
 * locally means the printer never needs to be reachable from the internet
 * again — this process only makes outbound connections to Supabase.
 *
 * Setup: see ./README.md
 */
import path from "path"
import { config as loadEnv } from "dotenv"
import { createClient, type RealtimeChannel } from "@supabase/supabase-js"
import { dbRowToOrder } from "@/lib/orders"
import { buildTicketXml, sendTicketToPrinter } from "@/lib/print-ticket-server"
import { normalizePrinterConfig } from "@/lib/printer-config"
import { normalizeTelegramConfig, sendTelegramMessage } from "@/lib/telegram"
import type { PrintMode, PrintDarkness } from "@/lib/print-ticket"

loadEnv({ path: path.join(process.cwd(), "scripts/print-daemon/.env") })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
const PRINT_MODE: PrintMode = process.env.PRINT_MODE === "compact" ? "compact" : "readable"
const PRINT_DARKNESS: PrintDarkness =
  process.env.PRINT_DARKNESS === "light" || process.env.PRINT_DARKNESS === "normal"
    ? process.env.PRINT_DARKNESS
    : "dark"

const HEARTBEAT_INTERVAL_MS = 5 * 60_000
const RECONNECT_DELAY_MS = 5_000

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. See scripts/print-daemon/.env.example")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function resolvePrinterIp(): Promise<string> {
  const { data } = await supabase.from("app_settings").select("value").eq("key", "printer_config").single()
  return normalizePrinterConfig(data?.value).ip
}

async function alert(text: string): Promise<void> {
  console.error(text)
  try {
    const { data } = await supabase.from("app_settings").select("value").eq("key", "telegram_alerts").single()
    await sendTelegramMessage(normalizeTelegramConfig(data?.value), text)
  } catch (err) {
    console.error("Failed to send Telegram alert", err)
  }
}

async function printOrder(row: unknown): Promise<void> {
  const order = dbRowToOrder(row)
  if (!order) {
    console.warn("Skipping malformed realtime order payload", row)
    return
  }

  try {
    const ip = await resolvePrinterIp()
    const xml = buildTicketXml(order, PRINT_MODE, PRINT_DARKNESS)
    await sendTicketToPrinter(xml, ip)
    console.log(`Printed order #${order.orderNumber}`)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await alert(`⚠️ فشل طباعة الطلب #${order.orderNumber} تلقائياً\n${msg}`)
  }
}

let channel: RealtimeChannel | null = null
let down = false
let reconnecting = false

function subscribe(): void {
  channel = supabase
    .channel("print-daemon-orders")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "orders" },
      (payload) => { void printOrder(payload.new) },
    )
    .subscribe((status) => {
      console.log(`Realtime status: ${status}`)

      if (status === "SUBSCRIBED") {
        if (down) void alert("✅ طابعة المطبخ: عاد الاتصال بالنظام")
        down = false
        reconnecting = false
        return
      }

      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        if (!down) {
          down = true
          void alert(`⚠️ طابعة المطبخ: انقطع الاتصال بالنظام (${status})`)
        }
        scheduleReconnect()
      }
    })
}

function scheduleReconnect(): void {
  if (reconnecting) return
  reconnecting = true
  setTimeout(() => {
    if (channel) supabase.removeChannel(channel)
    subscribe()
  }, RECONNECT_DELAY_MS)
}

// Independent liveness check, decoupled from order volume, so a quiet shop
// with no new orders for a while isn't mistaken for a dead connection.
setInterval(async () => {
  try {
    await supabase.from("app_settings").select("key").limit(1)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await alert(`⚠️ طابعة المطبخ: فشل فحص الاتصال الدوري\n${msg}`)
  }
}, HEARTBEAT_INTERVAL_MS)

subscribe()
console.log("Print daemon started, listening for new orders…")

function shutdown(): void {
  if (channel) supabase.removeChannel(channel)
  process.exit(0)
}
process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
