export interface TelegramConfig {
  enabled: boolean
  notifyOnNewOrder: boolean
  botToken: string
  chatId: string
}

export const DEFAULT_TELEGRAM_CONFIG: TelegramConfig = {
  enabled: false,
  notifyOnNewOrder: true,
  botToken: "",
  chatId: "",
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

export function normalizeTelegramConfig(raw: unknown): TelegramConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_TELEGRAM_CONFIG
  const data = raw as Partial<TelegramConfig>
  return {
    enabled: Boolean(data.enabled),
    notifyOnNewOrder: data.notifyOnNewOrder !== false,
    botToken: asString(data.botToken),
    chatId: asString(data.chatId),
  }
}

export function canSendTelegram(config: TelegramConfig): boolean {
  return Boolean(config.enabled && config.botToken && config.chatId)
}

export async function sendTelegramMessage(config: TelegramConfig, text: string): Promise<boolean> {
  if (!canSendTelegram(config)) return false

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 7000)

  try {
    const response = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: config.chatId,
        text,
      }),
      signal: controller.signal,
    })

    return response.ok
  } catch {
    return false
  } finally {
    clearTimeout(timeout)
  }
}

export function formatNewOrderTelegramMessage(input: {
  orderNumber: number
  customerName: string
  orderType: "pickup" | "delivery"
  total: number
  itemsCount: number
  scheduledTime?: string | null
  area?: string
}): string {
  const orderTypeLabel = input.orderType === "pickup" ? "استلام" : "توصيل"
  const timeLabel = input.scheduledTime?.trim() ? input.scheduledTime : "في أقرب وقت"
  const areaLine = input.orderType === "delivery" && input.area ? `\nالمنطقة: ${input.area}` : ""

  return [
    "🛎️ طلب جديد",
    `رقم الطلب: #${input.orderNumber}`,
    `العميل: ${input.customerName}`,
    `النوع: ${orderTypeLabel}${areaLine}`,
    `العناصر: ${input.itemsCount}`,
    `الإجمالي: ${input.total} SAR`,
    `الموعد: ${timeLabel}`,
  ].join("\n")
}
