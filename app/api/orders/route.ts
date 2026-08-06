import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"
import { normalizeDiscountConfig, resolveDiscount } from "@/lib/discounts"
import { fetchDeliveryAreasFromSupabase } from "@/lib/delivery-areas"
import { getSupabaseConfig } from "@/lib/supabase/config"
import { formatNewOrderTelegramMessage, normalizeTelegramConfig, sendTelegramMessage } from "@/lib/telegram"

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
    if (xff) {
          return xff.split(",")[0]?.trim() || "unknown"
    }

  return req.headers.get("x-real-ip") || "unknown"
}

// Best-effort log of a checkout attempt that failed to save. The customer is
// still sent to WhatsApp regardless of whether this succeeds, so this must
// never throw or block the response — it only makes the failure visible in
// the admin dashboard instead of silently vanishing.
async function logFailedOrder(
    supabaseClient: any,
    entry: {
          reason: string
          statusCode: number
          customerName?: string
          customerPhone?: string
          customerArea?: string
          orderType?: string
          items?: unknown
          rawPayload?: unknown
    }
  ): Promise<void> {
    try {
          await supabaseClient.from("failed_orders").insert({
                  reason: entry.reason,
                  status_code: entry.statusCode,
                  customer_name: entry.customerName ?? null,
                  customer_phone: entry.customerPhone ?? null,
                  customer_area: entry.customerArea ?? null,
                  order_type: entry.orderType ?? null,
                  items: entry.items ?? null,
                  raw_payload: entry.rawPayload ?? null,
          })
    } catch (error) {
          console.error("Failed to log failed order:", error)
    }
}

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
          const supabase = createClient(url, publishableKey)

      const clientIp = extractClientIp(req)
          if (isRateLimited(clientIp)) {
                  await logFailedOrder(supabase, { reason: "rate_limited", statusCode: 429 })
                  return NextResponse.json({ error: "Too many requests" }, { status: 429 })
          }

      const rawBody = await req.json()
          const parsed = orderPayloadSchema.safeParse(rawBody)
          if (!parsed.success) {
                  await logFailedOrder(supabase, {
                            reason: "invalid_payload",
                            statusCode: 400,
                            customerName: typeof rawBody?.customerName === "string" ? rawBody.customerName : undefined,
                            customerPhone: typeof rawBody?.customerPhone === "string" ? rawBody.customerPhone : undefined,
                            rawPayload: rawBody,
                  })
                  return NextResponse.json(
                    { error: "Invalid order payload", details: parsed.error.flatten() },
                    { status: 400 }
                          )
          }

      const payload = parsed.data

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
              await logFailedOrder(supabase, {
                        reason: "menu_load_failed",
                        statusCode: 500,
                        customerName: payload.customerName,
                        customerPhone: payload.customerPhone,
                        customerArea: payload.customerArea,
                        orderType: payload.orderType,
                        items: payload.items,
              })
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
                  await logFailedOrder(supabase, {
                            reason: `unknown_menu_item:${missingItemId}`,
                            statusCode: 400,
                            customerName: payload.customerName,
                            customerPhone: payload.customerPhone,
                            customerArea: payload.customerArea,
                            orderType: payload.orderType,
                            items: payload.items,
                  })
                  return NextResponse.json({ error: `Unknown menu item: ${missingItemId}` }, { status: 400 })
          }

      let deliveryFee = 0
          if (payload.orderType === "delivery") {
                  const deliveryAreasResult = await fetchDeliveryAreasFromSupabase(supabase)
                  const areaRow = deliveryAreasResult.areas.find((area) => area.name === payload.customerArea && area.is_active)

            if (!areaRow) {
                      await logFailedOrder(supabase, {
                                  reason: "invalid_delivery_area",
                                  statusCode: 400,
                                  customerName: payload.customerName,
                                  customerPhone: payload.customerPhone,
                                  customerArea: payload.customerArea,
                                  orderType: payload.orderType,
                                  items: payload.items,
                      })
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

      const { data: rpcResult, error: insertError } = await supabase
            .rpc("create_order", {
                      p_customer_name: payload.customerName,
                      p_customer_phone: payload.customerPhone,
                      p_customer_area: payload.orderType === "pickup" ? "استلام من المحل" : payload.customerArea,
                      p_order_type: payload.orderType,
                      p_items: normalizedItems,
                      p_subtotal: subtotal,
                      p_delivery_fee: deliveryFee,
                      p_total: total,
                      p_notes: payload.notes,
                      p_scheduled_time: payload.scheduledTime ?? null,
            })
            .single()

      const insertedOrder = rpcResult as { id: string; order_number: number } | null

      if (insertError || !insertedOrder) {
              console.error("Failed to save order to Supabase", {
                        insertError,
                        orderType: payload.orderType,
                        customerArea: payload.customerArea,
                        itemsCount: payload.items.length,
              })
              await logFailedOrder(supabase, {
                        reason: `db_insert_failed:${insertError?.message ?? "unknown"}`,
                        statusCode: 500,
                        customerName: payload.customerName,
                        customerPhone: payload.customerPhone,
                        customerArea: payload.customerArea,
                        orderType: payload.orderType,
                        items: normalizedItems,
              })
              return NextResponse.json(
                {
                            error: "Failed to save order",
                            details: insertError?.message ?? null,
                },
                { status: 500 }
                      )
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
      } catch (telegramError) {
              console.error("Telegram notification failed", telegramError)
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
    } catch (error) {
          console.error("Unexpected /api/orders error", error)
          return NextResponse.json(
            {
                      error: "Unexpected server error",
                      details: error instanceof Error ? error.message : null,
            },
            { status: 500 }
                )
    }
}
