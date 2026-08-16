import { describe, expect, it } from "vitest"
import { decodeMenuItems, decodePossibleMojibake } from "@/lib/text"
import type { MenuItem } from "@/components/cart-provider"

/** Simulates what actually lands in the DB when UTF-8 bytes get stored/read as Latin-1/Windows-1252. */
function toMojibake(value: string): string {
  const bytes = new TextEncoder().encode(value)
  return Array.from(bytes)
    .map((b) => String.fromCharCode(b))
    .join("")
}

describe("decodePossibleMojibake", () => {
  it("returns falsy input unchanged", () => {
    expect(decodePossibleMojibake("")).toBe("")
  })

  it("is a no-op on already-correct Arabic text (no mojibake marker present)", () => {
    const correct = "شاي بالنعناع"
    expect(decodePossibleMojibake(correct)).toBe(correct)
  })

  it("is a no-op on plain correct English text", () => {
    expect(decodePossibleMojibake("Croissant")).toBe("Croissant")
  })

  it("repairs genuine UTF-8-read-as-Latin1 mojibake back to the original Arabic text", () => {
    const original = "شاي بالنعناع"
    const mojibake = toMojibake(original)
    expect(decodePossibleMojibake(mojibake)).toBe(original)
  })

  it("leaves a string alone if it triggers the marker check but isn't valid mojibake", () => {
    // Contains "Ø" but reinterpreting the bytes produces an invalid UTF-8 sequence
    // (the replacement-character guard must prevent corrupting this further).
    const notMojibake = "café Ø random"
    expect(decodePossibleMojibake(notMojibake)).toBe(notMojibake)
  })
})

describe("decodeMenuItems", () => {
  function baseItem(overrides: Partial<MenuItem>): MenuItem {
    return {
      id: "1",
      name: "",
      description: "",
      price: 10,
      image: "",
      category: "snacks",
      ...overrides,
    }
  }

  it("decodes mojibake across name, nameEn, description, ingredients, and packageItems", () => {
    const original = "قهوة عربية"
    const mojibake = toMojibake(original)

    const items = [
      baseItem({
        name: mojibake,
        nameEn: "Arabic Coffee",
        description: mojibake,
        ingredients: [mojibake],
        packageItems: [{ label: mojibake, quantity: 1 }],
      }),
    ]

    const [decoded] = decodeMenuItems(items)
    expect(decoded.name).toBe(original)
    expect(decoded.description).toBe(original)
    expect(decoded.ingredients).toEqual([original])
    expect(decoded.packageItems?.[0].label).toBe(original)
  })

  it("passes through a non-array ingredients field unchanged", () => {
    const items = [baseItem({ name: "شاي", ingredients: undefined })]
    const [decoded] = decodeMenuItems(items)
    expect(decoded.ingredients).toBeUndefined()
  })

  it("preserves non-label fields on packageItems", () => {
    const items = [
      baseItem({
        name: "شاي",
        packageItems: [{ label: "كوب", quantity: 2, included: true }],
      }),
    ]
    const [decoded] = decodeMenuItems(items)
    expect(decoded.packageItems?.[0]).toEqual({ label: "كوب", quantity: 2, included: true })
  })
})
