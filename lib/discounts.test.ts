import { describe, expect, it } from "vitest"
import {
  DEFAULT_DISCOUNT_CONFIG,
  calculateDiscountAmount,
  normalizeDiscountConfig,
  resolveDiscount,
  type DiscountConfig,
} from "@/lib/discounts"

describe("normalizeDiscountConfig", () => {
  it("returns the default config for non-object input", () => {
    expect(normalizeDiscountConfig(null)).toEqual(DEFAULT_DISCOUNT_CONFIG)
    expect(normalizeDiscountConfig(undefined)).toEqual(DEFAULT_DISCOUNT_CONFIG)
    expect(normalizeDiscountConfig("not an object")).toEqual(DEFAULT_DISCOUNT_CONFIG)
    expect(normalizeDiscountConfig(42)).toEqual(DEFAULT_DISCOUNT_CONFIG)
  })

  it("coerces booleans, clamps negative numeric values to zero, and defaults an invalid type to percent", () => {
    const result = normalizeDiscountConfig({
      enabled: "yes",
      autoDiscountEnabled: 1,
      autoDiscountType: "bogus",
      autoDiscountValue: -10,
      codes: [],
    })

    expect(result.enabled).toBe(true)
    expect(result.autoDiscountEnabled).toBe(true)
    expect(result.autoDiscountType).toBe("percent")
    expect(result.autoDiscountValue).toBe(0)
  })

  it("preserves an explicit fixed autoDiscountType", () => {
    const result = normalizeDiscountConfig({ autoDiscountType: "fixed" })
    expect(result.autoDiscountType).toBe("fixed")
  })

  it("drops codes with an empty/whitespace code, and uppercases valid ones", () => {
    const result = normalizeDiscountConfig({
      codes: [
        { code: "welcome10", type: "percent", value: 10, active: true, minOrder: 0 },
        { code: "   ", type: "percent", value: 10, active: true, minOrder: 0 },
        { code: "", type: "percent", value: 10, active: true, minOrder: 0 },
        null,
        "not-an-object",
      ],
    })

    expect(result.codes).toHaveLength(1)
    expect(result.codes[0].code).toBe("WELCOME10")
  })

  it("clamps negative code value/minOrder to zero and defaults an invalid type to percent", () => {
    const result = normalizeDiscountConfig({
      codes: [{ code: "x", type: "bogus", value: -5, active: "true", minOrder: -20 }],
    })

    expect(result.codes[0]).toEqual({
      code: "X",
      type: "percent",
      value: 0,
      active: true,
      minOrder: 0,
    })
  })

  it("ignores a non-array codes field", () => {
    const result = normalizeDiscountConfig({ codes: "not-an-array" })
    expect(result.codes).toEqual([])
  })
})

describe("calculateDiscountAmount", () => {
  it("computes a percent discount", () => {
    expect(calculateDiscountAmount(200, "percent", 10)).toBe(20)
  })

  it("computes a fixed discount", () => {
    expect(calculateDiscountAmount(200, "fixed", 30)).toBe(30)
  })

  it("caps the discount at the total (never goes negative)", () => {
    expect(calculateDiscountAmount(50, "fixed", 1000)).toBe(50)
    expect(calculateDiscountAmount(50, "percent", 500)).toBe(50)
  })

  it("treats a negative total or value as zero", () => {
    expect(calculateDiscountAmount(-100, "fixed", 10)).toBe(0)
    expect(calculateDiscountAmount(100, "fixed", -10)).toBe(0)
  })

  it("rounds to the nearest cent", () => {
    expect(calculateDiscountAmount(10, "percent", 33.333)).toBeCloseTo(3.33, 2)
  })
})

describe("resolveDiscount", () => {
  const baseConfig: DiscountConfig = {
    enabled: true,
    autoDiscountEnabled: false,
    autoDiscountType: "percent",
    autoDiscountValue: 0,
    codes: [],
  }

  it("applies no discount when the config is disabled, regardless of auto/code settings", () => {
    const result = resolveDiscount({
      config: { ...baseConfig, enabled: false, autoDiscountEnabled: true, autoDiscountValue: 50 },
      subtotal: 100,
      deliveryFee: 10,
      couponCode: "ANYTHING",
    })

    expect(result).toEqual({
      autoDiscountAmount: 0,
      codeDiscountAmount: 0,
      codeApplied: null,
      totalDiscount: 0,
      totalBeforeDiscount: 110,
      finalTotal: 110,
    })
  })

  it("applies only the auto discount when no coupon code is supplied", () => {
    const result = resolveDiscount({
      config: { ...baseConfig, autoDiscountEnabled: true, autoDiscountType: "percent", autoDiscountValue: 10 },
      subtotal: 100,
      deliveryFee: 0,
    })

    expect(result.autoDiscountAmount).toBe(10)
    expect(result.codeDiscountAmount).toBe(0)
    expect(result.codeApplied).toBeNull()
    expect(result.finalTotal).toBe(90)
  })

  it("rejects an inactive coupon code", () => {
    const result = resolveDiscount({
      config: {
        ...baseConfig,
        codes: [{ code: "OFF10", type: "percent", value: 10, active: false, minOrder: 0 }],
      },
      subtotal: 100,
      deliveryFee: 0,
      couponCode: "OFF10",
    })

    expect(result.codeApplied).toBeNull()
    expect(result.codeDiscountAmount).toBe(0)
    expect(result.finalTotal).toBe(100)
  })

  it("rejects a code below its minOrder threshold", () => {
    const result = resolveDiscount({
      config: {
        ...baseConfig,
        codes: [{ code: "BIG50", type: "fixed", value: 50, active: true, minOrder: 200 }],
      },
      subtotal: 100,
      deliveryFee: 0,
      couponCode: "BIG50",
    })

    expect(result.codeApplied).toBeNull()
    expect(result.finalTotal).toBe(100)
  })

  it("applies a valid, active coupon at/above its minOrder threshold", () => {
    const result = resolveDiscount({
      config: {
        ...baseConfig,
        codes: [{ code: "BIG50", type: "fixed", value: 50, active: true, minOrder: 100 }],
      },
      subtotal: 100,
      deliveryFee: 0,
      couponCode: "big50",
    })

    expect(result.codeApplied).toBe("BIG50")
    expect(result.codeDiscountAmount).toBe(50)
    expect(result.finalTotal).toBe(50)
  })

  it("is case-insensitive and trims whitespace on the supplied coupon code", () => {
    const result = resolveDiscount({
      config: {
        ...baseConfig,
        codes: [{ code: "SAVE5", type: "fixed", value: 5, active: true, minOrder: 0 }],
      },
      subtotal: 50,
      deliveryFee: 0,
      couponCode: "  save5  ",
    })

    expect(result.codeApplied).toBe("SAVE5")
  })

  it("stacks the coupon discount on top of the auto discount, applying the code to the post-auto amount", () => {
    // total before discount = 100; auto 10% -> 10 off -> 90 remaining;
    // code is a further 10% off the post-auto amount (90) -> 9 off.
    const result = resolveDiscount({
      config: {
        ...baseConfig,
        autoDiscountEnabled: true,
        autoDiscountType: "percent",
        autoDiscountValue: 10,
        codes: [{ code: "EXTRA10", type: "percent", value: 10, active: true, minOrder: 0 }],
      },
      subtotal: 100,
      deliveryFee: 0,
      couponCode: "EXTRA10",
    })

    expect(result.autoDiscountAmount).toBe(10)
    expect(result.codeDiscountAmount).toBe(9)
    expect(result.totalDiscount).toBe(19)
    expect(result.finalTotal).toBe(81)
  })

  it("evaluates a coupon's minOrder against the pre-discount total, not the post-auto-discount total", () => {
    const result = resolveDiscount({
      config: {
        ...baseConfig,
        autoDiscountEnabled: true,
        autoDiscountType: "fixed",
        autoDiscountValue: 30,
        codes: [{ code: "MIN100", type: "fixed", value: 5, active: true, minOrder: 100 }],
      },
      // totalBeforeDiscount is exactly 100, satisfying minOrder even though
      // the post-auto amount (70) would not.
      subtotal: 100,
      deliveryFee: 0,
      couponCode: "MIN100",
    })

    expect(result.codeApplied).toBe("MIN100")
    expect(result.finalTotal).toBe(65)
  })

  it("never lets the final total go negative even if discounts exceed the order total", () => {
    const result = resolveDiscount({
      config: {
        ...baseConfig,
        autoDiscountEnabled: true,
        autoDiscountType: "fixed",
        autoDiscountValue: 1000,
      },
      subtotal: 20,
      deliveryFee: 0,
    })

    expect(result.finalTotal).toBe(0)
  })

  it("includes the delivery fee in totalBeforeDiscount and finalTotal", () => {
    const result = resolveDiscount({
      config: baseConfig,
      subtotal: 100,
      deliveryFee: 25,
    })

    expect(result.totalBeforeDiscount).toBe(125)
    expect(result.finalTotal).toBe(125)
  })
})
