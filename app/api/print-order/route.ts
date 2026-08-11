import { NextRequest, NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { getSupabaseConfig } from "@/lib/supabase/config"
import { normalizePrinterConfig } from "@/lib/printer-config"
import { buildTicketXml, sendTicketToPrinter } from "@/lib/print-ticket-server"
import type { Order } from "@/lib/data"
import type { PrintMode, PrintDarkness } from "@/lib/print-ticket"

// Manual/admin print, routed through the server so no browser ever talks to
// the printer's self-signed HTTPS certificate directly (mirrors the network
// path api/webhook/print already uses for auto-print).

async function resolvePrinterIp(): Promise<string> {
  try {
    const { url, publishableKey } = getSupabaseConfig()
    const supabase = createServiceClient(url, publishableKey)
    const { data } = await supabase.from("app_settings").select("value").eq("key", "printer_config").single()
    const config = normalizePrinterConfig(data?.value)
    if (config.ip) return config.ip
  } catch (error) {
    console.error("Failed to load centralized printer config, falling back to env var", error)
  }
  return process.env.PRINTER_IP || "192.168.100.205"
}

type PrintOrderRequestBody = {
  order: Omit<Order, "createdAt"> & { createdAt: string | number | Date }
  ip?: string
  mode?: PrintMode
  darkness?: PrintDarkness
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await req.json()) as PrintOrderRequestBody
    if (!body?.order) {
      return NextResponse.json({ error: "Missing order" }, { status: 400 })
    }

    const order: Order = { ...body.order, createdAt: new Date(body.order.createdAt) }
    const ip = body.ip || (await resolvePrinterIp())
    const mode: PrintMode = body.mode ?? "readable"

    const xml = buildTicketXml(order, mode, body.darkness)
    await sendTicketToPrinter(xml, ip)

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("print-order failed", err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
