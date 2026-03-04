import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"

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
})

interface MenuRow {
  id: string
  name: string
  name_en?: string | null
  price: number
}

interface DeliveryAreaRow {
  name: string
  price: number
  is_active: boolean
}

export async function POST(req: Request) {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: "Server is not configured" }, { status: 500 })
    }

    const parsed = orderPayloadSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid order payload", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const payload = parsed.data

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    const itemIds = Array.from(new Set(payload.items.map((item) => item.id)))
    const { data: menuRows, error: menuError } = await supabase
      .from("menu")
      .select("id,name,name_en,price")
      .in("id", itemIds)

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
      return {
        id: menuItem.id,
        name: menuItem.name,
        nameEn: menuItem.name_en ?? "",
        quantity: item.quantity,
        price: menuItem.price,
        selectedIngredients: item.selectedIngredients,
      }
    })

    const subtotal = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const total = subtotal + deliveryFee

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

    return NextResponse.json({
      id: insertedOrder.id,
      orderNumber: insertedOrder.order_number,
      subtotal,
      deliveryFee,
      total,
    })
  } catch {
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 })
  }
}
