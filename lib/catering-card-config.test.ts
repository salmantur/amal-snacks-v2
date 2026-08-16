import { describe, expect, it } from "vitest"
import { DEFAULT_CATERING_CARD_COLORS, normalizeCateringCardColors } from "@/lib/catering-card-config"

describe("normalizeCateringCardColors", () => {
  it("returns all defaults for non-object input", () => {
    expect(normalizeCateringCardColors(null)).toEqual(DEFAULT_CATERING_CARD_COLORS)
    expect(normalizeCateringCardColors(undefined)).toEqual(DEFAULT_CATERING_CARD_COLORS)
    expect(normalizeCateringCardColors("nope")).toEqual(DEFAULT_CATERING_CARD_COLORS)
  })

  it("accepts valid 6-digit hex colors for every field", () => {
    const result = normalizeCateringCardColors({
      background: "#111111",
      background_highlighted: "#222222",
      border: "#333333",
      text: "#444444",
      text_highlighted: "#555555",
      muted_text: "#666666",
      muted_text_highlighted: "#777777",
      accent: "#888888",
    })

    expect(result).toEqual({
      background: "#111111",
      background_highlighted: "#222222",
      border: "#333333",
      text: "#444444",
      text_highlighted: "#555555",
      muted_text: "#666666",
      muted_text_highlighted: "#777777",
      accent: "#888888",
    })
  })

  it("falls back to the default per-field for malformed or missing hex values", () => {
    const result = normalizeCateringCardColors({
      background: "not-a-color",
      accent: "#fff", // 3-digit shorthand is rejected, only 6-digit accepted
      border: 12345,
      // text, text_highlighted, muted_text, muted_text_highlighted, background_highlighted omitted entirely
    })

    expect(result).toEqual(DEFAULT_CATERING_CARD_COLORS)
  })

  it("is case-insensitive on hex digits", () => {
    const result = normalizeCateringCardColors({ accent: "#AbCdEf" })
    expect(result.accent).toBe("#AbCdEf")
  })
})
