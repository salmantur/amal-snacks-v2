import { describe, expect, it } from "vitest"
import { DEFAULT_TELEGRAM_CONFIG, canSendTelegram, formatNewOrderTelegramMessage, normalizeTelegramConfig } from "@/lib/telegram"

describe("normalizeTelegramConfig", () => {
  it("returns the default config for non-object input", () => {
    expect(normalizeTelegramConfig(null)).toEqual(DEFAULT_TELEGRAM_CONFIG)
    expect(normalizeTelegramConfig(undefined)).toEqual(DEFAULT_TELEGRAM_CONFIG)
    expect(normalizeTelegramConfig("nope")).toEqual(DEFAULT_TELEGRAM_CONFIG)
  })

  it("coerces enabled to a boolean and trims string fields", () => {
    const result = normalizeTelegramConfig({ enabled: 1, botToken: "  abc  ", chatId: " 123 " })
    expect(result.enabled).toBe(true)
    expect(result.botToken).toBe("abc")
    expect(result.chatId).toBe("123")
  })

  it("defaults notifyOnNewOrder to true unless explicitly false", () => {
    expect(normalizeTelegramConfig({}).notifyOnNewOrder).toBe(true)
    expect(normalizeTelegramConfig({ notifyOnNewOrder: false }).notifyOnNewOrder).toBe(false)
    expect(normalizeTelegramConfig({ notifyOnNewOrder: "no" }).notifyOnNewOrder).toBe(true)
  })

  it("empties non-string botToken/chatId instead of throwing", () => {
    const result = normalizeTelegramConfig({ botToken: 12345, chatId: null })
    expect(result.botToken).toBe("")
    expect(result.chatId).toBe("")
  })
})

describe("canSendTelegram", () => {
  it("requires enabled, botToken, and chatId all to be present", () => {
    expect(canSendTelegram({ enabled: true, notifyOnNewOrder: true, botToken: "t", chatId: "c" })).toBe(true)
    expect(canSendTelegram({ enabled: false, notifyOnNewOrder: true, botToken: "t", chatId: "c" })).toBe(false)
    expect(canSendTelegram({ enabled: true, notifyOnNewOrder: true, botToken: "", chatId: "c" })).toBe(false)
    expect(canSendTelegram({ enabled: true, notifyOnNewOrder: true, botToken: "t", chatId: "" })).toBe(false)
  })
})

describe("formatNewOrderTelegramMessage", () => {
  const baseInput = {
    orderNumber: 42,
    customerName: "سلمان",
    customerPhone: "0500000000",
    orderType: "delivery" as const,
    total: 100,
    subtotal: 90,
    deliveryFee: 10,
    itemsCount: 1,
    items: [{ name: "شاي", quantity: 2, price: 15 }],
  }

  it("includes the area line only for delivery orders", () => {
    const delivery = formatNewOrderTelegramMessage({ ...baseInput, area: "الخبر" })
    expect(delivery).toContain("المنطقة: الخبر")

    const pickup = formatNewOrderTelegramMessage({ ...baseInput, orderType: "pickup", area: "الخبر" })
    expect(pickup).not.toContain("المنطقة:")
  })

  it("appends selected ingredients under an item line when present", () => {
    const message = formatNewOrderTelegramMessage({
      ...baseInput,
      items: [{ name: "عصير", quantity: 1, price: 10, selectedIngredients: ["كبير", "بدون سكر"] }],
    })
    expect(message).toContain("خيارات: كبير، بدون سكر")
  })

  it("shows 'في أقرب وقت' when no scheduled time is given", () => {
    const message = formatNewOrderTelegramMessage({ ...baseInput, scheduledTime: null })
    expect(message).toContain("في أقرب وقت")
  })

  it("uses the scheduled time when provided", () => {
    const message = formatNewOrderTelegramMessage({ ...baseInput, scheduledTime: "اليوم - 5:00 م" })
    expect(message).toContain("اليوم - 5:00 م")
  })

  it("includes a discount line only when a discount was applied", () => {
    const withDiscount = formatNewOrderTelegramMessage({ ...baseInput, discountAmount: 10, discountCode: "SAVE10" })
    expect(withDiscount).toContain("الخصم (SAVE10): -10 SAR")

    const withoutDiscount = formatNewOrderTelegramMessage({ ...baseInput, discountAmount: 0 })
    expect(withoutDiscount).not.toContain("الخصم")
  })

  it("omits the notes line when notes are empty/whitespace", () => {
    const withNotes = formatNewOrderTelegramMessage({ ...baseInput, notes: "  يرجى الاتصال قبل التوصيل  " })
    expect(withNotes).toContain("ملاحظات: يرجى الاتصال قبل التوصيل")

    const withoutNotes = formatNewOrderTelegramMessage({ ...baseInput, notes: "   " })
    expect(withoutNotes).not.toContain("ملاحظات:")
  })

  it("truncates messages longer than 3900 characters", () => {
    const manyItems = Array.from({ length: 400 }, (_, i) => ({
      name: `منتج رقم ${i} بوصف طويل جدا لملء المساحة`,
      quantity: 1,
      price: 10,
    }))
    const message = formatNewOrderTelegramMessage({ ...baseInput, items: manyItems, itemsCount: manyItems.length })
    expect(message.length).toBeLessThanOrEqual(3900)
    expect(message.endsWith("…")).toBe(true)
  })
})
