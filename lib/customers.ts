import type { Order } from "@/lib/data"

export interface CustomerSummary {
  phone: string
  name: string
  orderCount: number
  totalSpent: number
  lastOrderAt: Date
  orders: Order[]
}

// Derived entirely from existing order history - no customers table, no schema
// changes. Phone number is the only stable identity we have (checkout is
// anonymous), so orders with no phone are skipped.
export function summarizeCustomers(orders: Order[]): CustomerSummary[] {
  const byPhone = new Map<string, CustomerSummary>()

  for (const order of orders) {
    const phone = order.customerPhone?.trim()
    if (!phone) continue

    const existing = byPhone.get(phone)
    if (existing) {
      existing.orderCount += 1
      existing.totalSpent += order.total
      existing.orders.push(order)
      if (order.createdAt > existing.lastOrderAt) {
        existing.lastOrderAt = order.createdAt
        existing.name = order.customerName || existing.name
      }
    } else {
      byPhone.set(phone, {
        phone,
        name: order.customerName || "بدون اسم",
        orderCount: 1,
        totalSpent: order.total,
        lastOrderAt: order.createdAt,
        orders: [order],
      })
    }
  }

  return Array.from(byPhone.values()).sort((a, b) => b.orderCount - a.orderCount)
}
