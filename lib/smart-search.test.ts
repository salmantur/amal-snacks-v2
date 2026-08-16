import { describe, expect, it } from "vitest"
import { normalizeSearchText, smartFilterMenuItems } from "@/lib/smart-search"
import type { MenuItem } from "@/components/cart-provider"

function makeItem(overrides: Partial<MenuItem> & { id: string; name: string }): MenuItem {
  return {
    description: "",
    price: 10,
    image: "",
    category: "snacks",
    ingredients: [],
    ...overrides,
  }
}

describe("normalizeSearchText", () => {
  it("strips Arabic diacritics and tatweel", () => {
    expect(normalizeSearchText("مُحَمَّـد")).toBe("محمد")
  })

  it("collapses alef variants (أ إ آ ٱ) to bare alef", () => {
    expect(normalizeSearchText("أحمد")).toBe("احمد")
    expect(normalizeSearchText("إحسان")).toBe("احسان")
  })

  it("normalizes ta marbuta, alif maqsura, and hamza carriers", () => {
    expect(normalizeSearchText("قطة")).toBe("قطه")
    expect(normalizeSearchText("مقهى")).toBe("مقهي")
    expect(normalizeSearchText("مؤمن")).toBe("مومن")
    expect(normalizeSearchText("سئل")).toBe("سيل")
  })

  it("converts Arabic-Indic digits to Latin digits", () => {
    expect(normalizeSearchText("١٢٣")).toBe("123")
  })

  it("lowercases, strips punctuation, and collapses whitespace", () => {
    expect(normalizeSearchText("Hello   World!!")).toBe("hello world")
  })

  it("trims leading/trailing whitespace produced by stripped punctuation", () => {
    expect(normalizeSearchText("  !!سناك!!  ")).toBe("سناك")
  })
})

describe("smartFilterMenuItems", () => {
  it("returns an empty array for an empty/whitespace query", () => {
    const items = [makeItem({ id: "1", name: "شاي" })]
    expect(smartFilterMenuItems(items, "")).toEqual([])
    expect(smartFilterMenuItems(items, "   ")).toEqual([])
  })

  it("matches on an exact normalized name", () => {
    const tea = makeItem({ id: "1", name: "شاي" })
    const coffee = makeItem({ id: "2", name: "قهوة" })
    const result = smartFilterMenuItems([tea, coffee], "شاي")
    expect(result.map((i) => i.id)).toEqual(["1"])
  })

  it("ranks an exact match above a substring match above a token-fuzzy match", () => {
    const exact = makeItem({ id: "exact", name: "تمر" })
    const substring = makeItem({ id: "substring", name: "معجون تمر لذيذ" })
    const fuzzyOnly = makeItem({ id: "fuzzy", name: "تمار المدينة" }) // shares a fuzzy-close token, not a substring

    const result = smartFilterMenuItems([fuzzyOnly, substring, exact], "تمر")
    expect(result.map((i) => i.id)).toEqual(["exact", "substring", "fuzzy"])
  })

  it("matches via the English-keyboard-typed-as-Arabic remap", () => {
    // Typing "ahd" on an English layout produces the Arabic letters ش ا ي
    // (a->ش, h->ا, d->ي) when the intent was to type "شاي" on an Arabic layout.
    const tea = makeItem({ id: "1", name: "شاي" })
    const other = makeItem({ id: "2", name: "عصير" })
    const result = smartFilterMenuItems([tea, other], "ahd")
    expect(result.map((i) => i.id)).toContain("1")
  })

  it("matches on nameEn, description, and ingredients, not just name", () => {
    const byNameEn = makeItem({ id: "1", name: "بدون", nameEn: "Croissant" })
    const byDescription = makeItem({ id: "2", name: "بدون", description: "chocolate filled pastry" })
    const byIngredient = makeItem({ id: "3", name: "بدون", ingredients: ["جبن", "زيتون"] })

    expect(smartFilterMenuItems([byNameEn], "croissant").map((i) => i.id)).toEqual(["1"])
    expect(smartFilterMenuItems([byDescription], "chocolate").map((i) => i.id)).toEqual(["2"])
    expect(smartFilterMenuItems([byIngredient], "زيتون").map((i) => i.id)).toEqual(["3"])
  })

  it("tolerates small typos (Levenshtein distance) in longer tokens", () => {
    const item = makeItem({ id: "1", name: "سندويتش" })
    // one substituted character
    const result = smartFilterMenuItems([item], "سندوتش")
    expect(result.map((i) => i.id)).toEqual(["1"])
  })

  it("excludes items with no plausible match at all", () => {
    const item = makeItem({ id: "1", name: "بيتزا" })
    expect(smartFilterMenuItems([item], "xyzxyz123")).toEqual([])
  })

  it("is diacritic/hamza-insensitive when matching", () => {
    const item = makeItem({ id: "1", name: "قهوة" })
    const result = smartFilterMenuItems([item], "قهوه")
    expect(result.map((i) => i.id)).toEqual(["1"])
  })
})
