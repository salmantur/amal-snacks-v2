// Shared data/helpers for the "build your own tray" flow: a tray-category
// product sized via `ingredients` (label::price size options), where the
// customer then picks TRAY_REQUIRED items out of TRAY_ITEMS. Used by both
// the dialog (components/product-drawer.tsx) and the standalone page
// (app/product/[id]/page.tsx) so the real menu data driving them can't drift.

export const TRAY_ITEMS: { ar: string; en: string }[] = [
  { ar: "كبة", en: "Kibbeh" },
  { ar: "سبرنق رول", en: "Spring Roll" },
  { ar: "سمبوسة بطاطس", en: "Potato Samosa" },
  { ar: "معجنات جبن", en: "Cheese Pastry" },
  { ar: "ميني ساندوتش حلومي", en: "Mini Halloumi Sandwich" },
  { ar: "ميني شاورما", en: "Mini Shawarma" },
  { ar: "ورق عنب", en: "Grape Leaves" },
  { ar: "مطبق مغلف", en: "Wrapped Matazeez" },
  { ar: "معجنات زعتر", en: "Zaatar Pastry" },
  { ar: "ميني ساندوتش لبنه", en: "Mini Labneh Sandwich" },
  { ar: "مسخن", en: "Musakhan" },
  { ar: "ميني برجر", en: "Mini Burger" },
  { ar: "ميني تورتيلا", en: "Mini Tortilla" },
  { ar: "معجنات بيتزا", en: "Pizza Pastry" },
  { ar: "ميني ساندوتش ديك رومي", en: "Mini Turkey Sandwich" },
  { ar: "بف لحم", en: "Beef Puff" },
  { ar: "بف دجاج", en: "Chicken Puff" },
  { ar: "سمبوسة جبن", en: "Cheese Samosa" },
  { ar: "معجنات لبنه", en: "Labneh Pastry" },
  { ar: "ميني ساندوتش فلافل", en: "Mini Falafel Sandwich" },
]

export const TRAY_REQUIRED = 7

export function parseVariantOption(raw: string, fallbackPrice: number): { label: string; price: number } {
  const value = (raw || "").trim()
  if (!value) return { label: "", price: fallbackPrice }
  const [labelPart, pricePart] = value.split("::")
  const label = (labelPart || value).trim()
  const parsedPrice = Number((pricePart || "").replace(/[^\d.]/g, ""))
  return {
    label,
    price: Number.isFinite(parsedPrice) && parsedPrice > 0 ? parsedPrice : fallbackPrice,
  }
}

export function getTraySizeChipLabel(label: string): string {
  const normalized = label.trim().toLowerCase()
  if (normalized.startsWith("صغير") || normalized.startsWith("small") || normalized.startsWith("s ")) return "صغير"
  if (normalized.startsWith("وسط") || normalized.startsWith("medium") || normalized.startsWith("m ")) return "وسط"
  if (normalized.startsWith("كبير") || normalized.startsWith("large") || normalized.startsWith("l ")) return "كبير"
  return label.split(/[\s(]/)[0] || label
}

export function getTraySizeOrder(label: string): number {
  const chip = getTraySizeChipLabel(label)
  if (chip === "صغير") return 0
  if (chip === "وسط") return 1
  if (chip === "كبير") return 2
  return 99
}

export function getMenuStorageBase(image: string): string {
  const marker = "/storage/v1/object/public/Menu/"
  const idx = image.indexOf(marker)
  if (idx === -1) return ""
  return image.slice(0, idx + marker.length)
}

export function normalizeMenuImageSrc(src: string, base: string): string | null {
  const value = (src || "").trim()
  if (!value) return null
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:") || value.startsWith("blob:")) {
    return value
  }
  if (value.startsWith("/")) return value
  return base ? `${base}${value}` : null
}

export function extractPieceCount(label: string): string {
  const match = label.match(/(\d+)/)
  return match ? match[1] : ""
}
