import { createClient } from "@/lib/supabase/client"
import type { Order } from "@/lib/data"

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

  if (error || !data) return []

  return data.map(dbRowToOrder)
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
        onNewOrder(dbRowToOrder(payload.new))
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

function dbRowToOrder(row: any): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    customerPhone: row.customer_phone ?? "",
    customerAddress: row.customer_area ?? "",
    items: (row.items ?? []).map((item: { name: string; nameEn?: string; name_en?: string; quantity: number; price: number; selectedIngredients?: string[] }) => ({
      ...item,
      nameEn: item.nameEn || item.name_en || "",
    })),
    total: row.total,
    status: row.status,
    notes: row.notes ?? "",
    scheduledTime: row.scheduled_time ?? null,
    createdAt: new Date(row.created_at),
  }
}