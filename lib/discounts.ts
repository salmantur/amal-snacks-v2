export type DiscountType = "percent" | "fixed"

export interface DiscountCode {
  code: string
  type: DiscountType
  value: number
  active: boolean
  minOrder: number
}

export interface DiscountConfig {
  enabled: boolean
  autoDiscountEnabled: boolean
  autoDiscountType: DiscountType
  autoDiscountValue: number
  codes: DiscountCode[]
}

export interface ResolvedDiscount {
  autoDiscountAmount: number
  codeDiscountAmount: number
  codeApplied: string | null
  totalDiscount: number
  totalBeforeDiscount: number
  finalTotal: number
}

export const DEFAULT_DISCOUNT_CONFIG: DiscountConfig = {
  enabled: false,
  autoDiscountEnabled: false,
  autoDiscountType: "percent",
  autoDiscountValue: 0,
  codes: [],
}

function toMoney(value: number): number {
  return Math.round(Math.max(0, value) * 100) / 100
}

function sanitizeCode(value: string): string {
  return value.trim().toUpperCase()
}

function coerceNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function normalizeDiscountConfig(raw: unknown): DiscountConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_DISCOUNT_CONFIG
  const data = raw as Partial<DiscountConfig>
  const codes = Array.isArray(data.codes)
    ? data.codes
        .map((code) => {
          if (!code || typeof code !== "object") return null
          const row = code as Partial<DiscountCode>
          const normalizedCode = sanitizeCode(String(row.code ?? ""))
          if (!normalizedCode) return null
          const type: DiscountType = row.type === "fixed" ? "fixed" : "percent"
          return {
            code: normalizedCode,
            type,
            value: Math.max(0, coerceNumber(row.value, 0)),
            active: Boolean(row.active),
            minOrder: Math.max(0, coerceNumber(row.minOrder, 0)),
          } satisfies DiscountCode
        })
        .filter((code): code is DiscountCode => Boolean(code))
    : []

  return {
    enabled: Boolean(data.enabled),
    autoDiscountEnabled: Boolean(data.autoDiscountEnabled),
    autoDiscountType: data.autoDiscountType === "fixed" ? "fixed" : "percent",
    autoDiscountValue: Math.max(0, coerceNumber(data.autoDiscountValue, 0)),
    codes,
  }
}

export function calculateDiscountAmount(total: number, type: DiscountType, value: number): number {
  const amount = type === "percent" ? (Math.max(0, total) * Math.max(0, value)) / 100 : Math.max(0, value)
  return toMoney(Math.min(Math.max(0, total), amount))
}

export function resolveDiscount(input: {
  config: DiscountConfig
  subtotal: number
  deliveryFee: number
  couponCode?: string | null
}): ResolvedDiscount {
  const subtotal = toMoney(input.subtotal)
  const deliveryFee = toMoney(input.deliveryFee)
  const totalBeforeDiscount = toMoney(subtotal + deliveryFee)

  if (!input.config.enabled) {
    return {
      autoDiscountAmount: 0,
      codeDiscountAmount: 0,
      codeApplied: null,
      totalDiscount: 0,
      totalBeforeDiscount,
      finalTotal: totalBeforeDiscount,
    }
  }

  let autoDiscountAmount = 0
  if (input.config.autoDiscountEnabled && input.config.autoDiscountValue > 0) {
    autoDiscountAmount = calculateDiscountAmount(totalBeforeDiscount, input.config.autoDiscountType, input.config.autoDiscountValue)
  }

  let codeDiscountAmount = 0
  let codeApplied: string | null = null
  const normalizedCode = sanitizeCode(input.couponCode ?? "")
  if (normalizedCode) {
    const code = input.config.codes.find((row) => row.code === normalizedCode && row.active)
    if (code && (!code.minOrder || totalBeforeDiscount >= code.minOrder)) {
      const afterAuto = toMoney(totalBeforeDiscount - autoDiscountAmount)
      codeDiscountAmount = calculateDiscountAmount(afterAuto, code.type, code.value)
      codeApplied = code.code
    }
  }

  const totalDiscount = toMoney(autoDiscountAmount + codeDiscountAmount)
  const finalTotal = toMoney(Math.max(0, totalBeforeDiscount - totalDiscount))

  return {
    autoDiscountAmount,
    codeDiscountAmount,
    codeApplied,
    totalDiscount,
    totalBeforeDiscount,
    finalTotal,
  }
}
