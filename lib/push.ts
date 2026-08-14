export interface PushSubscriptionRecord {
  endpoint: string
  keys: { p256dh: string; auth: string }
  label?: string
  addedAt: string
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : ""
}

export function normalizePushSubscriptions(raw: unknown): PushSubscriptionRecord[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item): PushSubscriptionRecord | null => {
      if (!item || typeof item !== "object") return null
      const data = item as Record<string, unknown>
      const keysData = (data.keys && typeof data.keys === "object" ? data.keys : {}) as Record<string, unknown>
      const endpoint = asString(data.endpoint).trim()
      const p256dh = asString(keysData.p256dh).trim()
      const auth = asString(keysData.auth).trim()
      if (!endpoint || !p256dh || !auth) return null
      return {
        endpoint,
        keys: { p256dh, auth },
        label: asString(data.label).trim() || undefined,
        addedAt: asString(data.addedAt) || new Date().toISOString(),
      }
    })
    .filter((sub): sub is PushSubscriptionRecord => sub !== null)
}

export interface NewOrderPushPayload {
  title: string
  body: string
  url: string
}

export function formatNewOrderPushPayload(input: {
  orderNumber: number
  customerName: string
  orderType: "pickup" | "delivery"
  total: number
}): NewOrderPushPayload {
  const orderTypeLabel = input.orderType === "pickup" ? "استلام" : "توصيل"
  const customerName = input.customerName.trim() || "عميل"
  return {
    title: `طلب جديد #${input.orderNumber}`,
    body: `${customerName} · ${orderTypeLabel} · ${input.total} SAR`,
    url: "/admin",
  }
}
