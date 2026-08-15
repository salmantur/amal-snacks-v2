import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"
import { getSupabaseConfig } from "@/lib/supabase/config"
import { formatNewOrderTelegramMessage, normalizeTelegramConfig, sendTelegramMessage } from "@/lib/telegram"
import {
  getCateringTier,
  getSweetAddonPrice,
  validateMainDishes,
  validateSides,
  validateSweet,
  type CateringSideSelection,
} from "@/lib/catering"

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 5

const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const existing = rateLimitStore.get(ip)

  if (!existing || now > existing.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }

  existing.count += 1
  return existing.count > RATE_LIMIT_MAX_REQUESTS
}

function extractClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0]?.trim() || "unknown"
  return req.headers.get("x-real-ip") || "unknown"
}

const payloadSchema = z.object({
  tierId: z.enum(["tier0", "tier1", "tier2", "tier3"]),
  customerName: z.string().trim().max(120).optional().default(""),
  customerPhone: z.string().trim().max(30).optional().default(""),
  guestCount: z.number().int().min(1).max(2000),
  eventDate: z.string().trim().max(20),
  deliveryArea: z.string().trim().min(1).max(120),
  mainDishes: z.array(z.string().trim().max(120)).max(10),
  sideSelection: z.object({
    appetizer: z.string().trim().max(120).optional(),
    salad: z.string().trim().max(120).optional(),
    items: z.array(z.string().trim().max(120)).max(10).optional(),
  }),
  sweet: z.string().trim().max(120).nullable(),
  notes: z.string().trim().max(1000).optional().default(""),
})

export async function POST(req: Request) {
  try {
    const { url, publishableKey } = getSupabaseConfig()
    const supabase = createClient(url, publishableKey)

    const clientIp = extractClientIp(req)
    if (isRateLimited(clientIp)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const rawBody = await req.json()
    const parsed = payloadSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid catering payload", details: parsed.error.flatten() }, { status: 400 })
    }

    const payload = parsed.data
    const tier = getCateringTier(payload.tierId)
    if (!tier) {
      return NextResponse.json({ error: "Unknown catering package" }, { status: 400 })
    }

    const sideSelection: CateringSideSelection = payload.sideSelection
    const mainDishError = validateMainDishes(tier, payload.mainDishes)
    const sidesError = validateSides(tier, sideSelection)
    const sweetError = validateSweet(tier, payload.sweet)
    const validationError = mainDishError || sidesError || sweetError
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const sweetAddonPrice = getSweetAddonPrice(tier, payload.sweet)
    const subtotal = tier.price + sweetAddonPrice
    const deliveryFee = 0
    const total = subtotal + deliveryFee

    const sideNames = tier.sideRule.type === "guided"
      ? [sideSelection.appetizer, sideSelection.salad].filter((v): v is string => Boolean(v))
      : sideSelection.items ?? []

    const items = [
      {
        id: `catering-${tier.id}`,
        name: `باقة كاتيرينج — ${tier.label}`,
        nameEn: "",
        quantity: 1,
        price: tier.price,
        selectedIngredients: [...payload.mainDishes, ...sideNames],
      },
      ...(payload.sweet
        ? [
            {
              id: "catering-sweet",
              name: tier.sweetsMode === "included" ? `حلا (ضمن الباقة) — ${payload.sweet}` : `إضافة حلا — ${payload.sweet}`,
              nameEn: "",
              quantity: 1,
              price: sweetAddonPrice,
              selectedIngredients: [] as string[],
            },
          ]
        : []),
    ]

    const notesLines = [
      "🎉 طلب كاتيرينج",
      `عدد الضيوف: ${payload.guestCount}`,
      `تاريخ المناسبة: ${payload.eventDate}`,
    ]
    if (!tier.disposablesIncluded) notesLines.push("⚠️ بدون أدوات/تغليف — غير مشمولة في هذه الباقة")
    if (payload.notes) notesLines.push(`ملاحظات: ${payload.notes}`)
    const notes = notesLines.join("\n")

    const { data: rpcResult, error: insertError } = await supabase
      .rpc("create_order", {
        p_customer_name: payload.customerName || "بدون اسم",
        p_customer_phone: payload.customerPhone || "بدون رقم",
        p_customer_area: payload.deliveryArea,
        p_order_type: "delivery",
        p_items: items,
        p_subtotal: subtotal,
        p_delivery_fee: deliveryFee,
        p_total: total,
        p_notes: notes,
        p_scheduled_time: null,
      })
      .single()

    const insertedOrder = rpcResult as { id: string; order_number: number } | null

    if (insertError || !insertedOrder) {
      console.error("Failed to save catering order", insertError)
      return NextResponse.json({ error: "Failed to save order", details: insertError?.message ?? null }, { status: 500 })
    }

    const { data: settingsRows } = await supabase
      .from("app_settings")
      .select("key,value")
      .in("key", ["telegram_alerts"])

    const settingsMap = new Map<string, unknown>()
    for (const row of (settingsRows ?? []) as { key?: string; value: unknown }[]) {
      if (row.key) settingsMap.set(row.key, row.value)
    }

    try {
      const telegramConfig = normalizeTelegramConfig(settingsMap.get("telegram_alerts"))
      if (telegramConfig.enabled && telegramConfig.notifyOnNewOrder && telegramConfig.botToken && telegramConfig.chatId) {
        const message = formatNewOrderTelegramMessage({
          orderNumber: insertedOrder.order_number,
          customerName: payload.customerName,
          customerPhone: payload.customerPhone,
          orderType: "delivery",
          total,
          subtotal,
          deliveryFee,
          itemsCount: items.length,
          items: items.map((item) => ({ name: item.name, quantity: item.quantity, price: item.price, selectedIngredients: item.selectedIngredients })),
          notes,
          area: payload.deliveryArea,
        })
        void sendTelegramMessage(telegramConfig, message)
      }
    } catch (telegramError) {
      console.error("Catering Telegram notification failed", telegramError)
    }

    return NextResponse.json({ id: insertedOrder.id, orderNumber: insertedOrder.order_number, total })
  } catch (error) {
    console.error("Unexpected /api/catering error", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: "Unexpected server error", details: errorMessage }, { status: 500 })
  }
}
