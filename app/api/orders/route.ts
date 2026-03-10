import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"
import { normalizeDiscountConfig, resolveDiscount } from "@/lib/discounts"
import { getSupabaseConfig } from "@/lib/supabase/config"
import { formatNewOrderTelegramMessage, normalizeTelegramConfig, sendTelegramMessage } from "@/lib/telegram"

const orderItemSchema = z.object({
  id: z.string().min(1),
  quantity: z.number().int().min(1).max(100),
  selectedIngredients: z.array(z.string().max(120)).max(20).optional(),
})

const orderPayloadSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  customerPhone: z.string().trim().min(7).max(30),
  customerArea: z.string().trim().max(120),
  orderType: z.enum(["delivery", "pickup"]),
  items: z.array(orderItemSchema).min(1).max(50),
  notes: z.string().trim().max(1000).optional().default(""),
  scheduledTime: z.string().trim().max(60).nullable().optional(),
  couponCode: z.string().trim().max(40).optional().nullable(),
})

interface MenuRow {
  id: string
  name: string
  name_en?: string | null
  price: number
  ingredients?: string[] | string | null
  limit?: number | null
}

interface DeliveryAreaRow {
  name: string
  price: number
  is_active: boolean
}

interface AppSettingsRow {
  key?: string
  value: unknown
}

function parseMenuIngredientOptions(value: MenuRow["ingredients"]): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean)
  if (typeof value === "string") {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
  }
  return []
}

function parseVariantOption(raw: string, fallbackPrice: number): { label: string; price: number } {
  const value = (raw || "").trim()
  if (!value) return { label: "", price: fallbackPrice }
  const [labelPart, pricePart] = value.split("::")
  const label = (labelPart || value).trim()
  const parsedPrice = Number((pricePart || "").replace(/[^\d.]/g, ""))
  return {
    label,
    price: Number.isFinite(parsedPrice) && parsedPrice > 0 ? parsedPrice : fallbackPrice,
  }
}

export async function POST(req: Request) {
  try {
    const { url, publishableKey } = getSupabaseConfig()

    const parsed = orderPayloadSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid order payload", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const payload = parsed.data
    const supabase = createClient(url, publishableKey)

    const itemIds = Array.from(new Set(payload.items.map((item) => item.id)))
    const menuPromise = supabase
      .from("menu")
      .select("id,name,name_en,price,ingredients,limit")
      .in("id", itemIds)
    const settingsPromise = supabase
      .from("app_settings")
      .select("key,value")
      .in("key", ["discount_config", "telegram_alerts"])

    const [{ data: menuRows, error: menuError }, { data: settingsRows }] = await Promise.all([
      menuPromise,
      settingsPromise,
    ])

    if (menuError || !menuRows) {
      return NextResponse.json({ error: "Unable to load menu prices" }, { status: 500 })
    }

    const menuById = new Map<string, MenuRow>()
    for (const row of menuRows as MenuRow[]) {
      menuById.set(String(row.id), {
        id: String(row.id),
        name: String(row.name ?? ""),
        name_en: row.name_en ?? "",
        price: Number(row.price) || 0,
        ingredients: row.ingredients ?? null,
        limit: Number(row.limit) || 0,
      })
    }

    const missingItemId = itemIds.find((id) => !menuById.has(id))
    if (missingItemId) {
      return NextResponse.json({ error: `Unknown menu item: ${missingItemId}` }, { status: 400 })
    }

    let deliveryFee = 0
    if (payload.orderType === "delivery") {
      const { data: areaRow, error: areaError } = await supabase
        .from("delivery_areas")
        .select("name,price,is_active")
        .eq("name", payload.customerArea)
        .eq("is_active", true)
        .maybeSingle<DeliveryAreaRow>()

      if (areaError || !areaRow) {
        return NextResponse.json({ error: "Invalid delivery area" }, { status: 400 })
      }

      deliveryFee = Number(areaRow.price) || 0
    }

    const normalizedItems = payload.items.map((item) => {
      const menuItem = menuById.get(item.id)!
      const selectedIngredients = (item.selectedIngredients ?? []).map((v) => String(v).trim()).filter(Boolean)
      let unitPrice = menuItem.price

      if ((menuItem.limit || 0) === 1 && selectedIngredients.length === 1) {
        const selectedLabel = selectedIngredients[0]
        const options = parseMenuIngredientOptions(menuItem.ingredients).map((raw) => parseVariantOption(raw, menuItem.price))
        const matched = options.find((option) => option.label === selectedLabel)
        if (matched) unitPrice = matched.price
      }

      return {
        id: menuItem.id,
        name: menuItem.name,
        nameEn: menuItem.name_en ?? "",
        quantity: item.quantity,
        price: unitPrice,
        selectedIngredients,
      }
    })

    const subtotal = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const settingsMap = new Map<string, unknown>()
    for (const row of (settingsRows ?? []) as AppSettingsRow[]) {
      const key = typeof row.key === "string" ? row.key : ""
      if (key) settingsMap.set(key, row.value)
    }

    const discountConfig = normalizeDiscountConfig(settingsMap.get("discount_config"))
    const telegramConfig = normalizeTelegramConfig(settingsMap.get("telegram_alerts"))
    const discountResult = resolveDiscount({
      config: discountConfig,
      subtotal,
      deliveryFee,
      couponCode: payload.couponCode ?? null,
    })
    const total = discountResult.finalTotal

    const { data: insertedOrder, error: insertError } = await supabase
      .from("orders")
      .insert({
        customer_name: payload.customerName,
        customer_phone: payload.customerPhone,
        customer_area: payload.orderType === "pickup" ? "استلام من المحل" : payload.customerArea,
        order_type: payload.orderType,
        items: normalizedItems,
        subtotal,
        delivery_fee: deliveryFee,
        total,
        notes: payload.notes,
        scheduled_time: payload.scheduledTime ?? null,
        status: "pending",
      })
      .select("id, order_number")
      .single()

    if (insertError || !insertedOrder) {
      return NextResponse.json({ error: "Failed to save order" }, { status: 500 })
    }

    // Best-effort notification: never block order creation if Telegram fails.
    try {
      if (telegramConfig.enabled && telegramConfig.notifyOnNewOrder && telegramConfig.botToken && telegramConfig.chatId) {
        const telegramMessage = formatNewOrderTelegramMessage({
          orderNumber: insertedOrder.order_number,
          customerName: payload.customerName,
          customerPhone: payload.customerPhone,
          orderType: payload.orderType,
          total,
          subtotal,
          deliveryFee,
          discountAmount: discountResult.totalDiscount,
          discountCode: discountResult.codeApplied,
          itemsCount: normalizedItems.length,
          items: normalizedItems.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            selectedIngredients: item.selectedIngredients,
          })),
          notes: payload.notes,
          scheduledTime: payload.scheduledTime ?? null,
          area: payload.customerArea,
        })
        void sendTelegramMessage(telegramConfig, telegramMessage)
      }
    } catch {
      // Ignore notification errors.
    }

    return NextResponse.json({
      id: insertedOrder.id,
      orderNumber: insertedOrder.order_number,
      subtotal,
      deliveryFee,
      totalDiscount: discountResult.totalDiscount,
      codeApplied: discountResult.codeApplied,
      total,
    })
  } catch {
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 })
  }
}