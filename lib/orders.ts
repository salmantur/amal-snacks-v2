import { createClient } from "@/lib/supabase/client"
import type { Order } from "@/lib/data"

type OrderItemRow = {
  name?: string
  nameEn?: string
  name_en?: string
  quantity?: number
  price?: number
  selectedIngredients?: string[]
}

export interface NewOrderPayload {
  customerName: string
  customerPhone: string
  customerArea: string
  orderType: "delivery" | "pickup"
  items: { name: string; nameEn?: string; quantity: number; price: number; selectedIngredients?: string[] }[]
  subtotal: number
  deliveryFee: number
  total: number
  notes: string
  scheduledTime: string | null
}

// Save a new order to Supabase and return the order number
export async function saveOrder(payload: NewOrderPayload): Promise<{ orderNumber: number; id: string } | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("orders")
    .insert({
      customer_name: payload.customerName,
      customer_phone: payload.customerPhone,
      customer_area: payload.customerArea,
      order_type: payload.orderType,
      items: payload.items,
      subtotal: payload.subtotal,
      delivery_fee: payload.deliveryFee,
      total: payload.total,
      notes: payload.notes,
      scheduled_time: payload.scheduledTime,
      status: "pending",
    })
    .select("id, order_number")
    .single()

  if (error) {
    console.error("Failed to save order:", error)
    return null
  }

  return { orderNumber: data.order_number, id: data.id }
}

// Update order status
export async function updateOrderStatus(id: string, status: Order["status"]): Promise<void> {
  const supabase = createClient()
  await supabase.from("orders").update({ status }).eq("id", id)
}

// Fetch recent orders (last 50, last 24h)
export async function fetchRecentOrders(): Promise<Order[]> {
  const supabase = createClient()
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(500)

  if (error) {
    throw new Error(`Unable to load orders: ${error.message}`)
  }

  if (!data) return []

  const orders: Order[] = []
  for (const row of data) {
    const order = dbRowToOrder(row)
    if (order) {
      orders.push(order)
      continue
    }

    console.warn("Skipping malformed order row", row)
  }

  return orders
}

// Subscribe to new orders in real-time
export function subscribeToOrders(
  onNewOrder: (order: Order) => void,
  onStatusUpdate: (id: string, status: Order["status"]) => void
) {
  const supabase = createClient()

  const channel = supabase
    .channel("orders-realtime")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "orders" },
      (payload) => {
        const order = dbRowToOrder(payload.new)
        if (order) {
          onNewOrder(order)
          return
        }

        console.warn("Skipping malformed realtime order payload", payload.new)
      }
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "orders" },
      (payload) => {
        onStatusUpdate(payload.new.id, payload.new.status)
      }
    )
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}

function dbRowToOrder(row: any): Order | null {
  if (!row || typeof row !== "object") return null

  const rawItems: unknown[] = Array.isArray(row.items) ? row.items : []
  const createdAt = new Date(row.created_at)
  if (!row.id || !Number.isFinite(Number(row.order_number)) || Number.isNaN(createdAt.getTime())) {
    return null
  }

  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    customerPhone: row.customer_phone ?? "",
    customerAddress: row.customer_area ?? "",
    orderType: row.order_type === "pickup" ? "pickup" : "delivery",
    items: rawItems
      .filter((item: unknown): item is OrderItemRow => Boolean(item && typeof item === "object"))
      .map((item: OrderItemRow) => ({
        name: String(item.name ?? ""),
        quantity: Number(item.quantity) || 0,
        price: Number(item.price) || 0,
        nameEn: item.nameEn || item.name_en || "",
        selectedIngredients: Array.isArray(item.selectedIngredients) ? item.selectedIngredients : [],
      }))
      .filter((item: { name: string; quantity: number }) => item.name && item.quantity > 0),
    total: Number(row.total) || 0,
    status: row.status === "preparing" || row.status === "ready" || row.status === "delivered" ? row.status : "pending",
    notes: row.notes ?? "",
    scheduledTime: row.scheduled_time ?? null,
    createdAt,
  }
}
