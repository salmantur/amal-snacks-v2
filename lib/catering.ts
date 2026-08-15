export interface CateringDish {
  name: string
  nameEn: string
  price: number
  image: string
}

export function getCateringDishImageUrl(dish: CateringDish): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/Menu/${dish.image}`
}

export type CateringTierId = "tier0" | "tier1" | "tier2" | "tier3"

export type CateringSideRule =
  | { type: "guided"; appetizerPool: CateringDish[]; saladPool: CateringDish[] }
  | { type: "open"; pool: CateringDish[]; min: number; max: number }

export interface CateringTier {
  id: CateringTierId
  label: string
  guestMin: number
  guestMax: number
  /** Overrides the default "{guestMin}–{guestMax}" display, for open-ended ranges like "10+". */
  guestLabel?: string
  price: number
  mainDishCount: number
  mainDishPool: CateringDish[]
  sideRule: CateringSideRule
  sweetsMode: "addon" | "included"
  disposablesIncluded: boolean
  features: string[]
  highlighted: boolean
}

// Full in-stock menu lists per category (not just the top-priced few) - safe to expose
// in full because every tier's flat price was already calculated from worst-case
// (top-priced) picks, so cheaper alternatives only improve margin, never hurt it.
export const CATERING_MAIN_DISHES: CateringDish[] = [
  { name: "برياني", nameEn: "Biryani", price: 300, image: "item-21-0.jpg" },
  { name: "محشي مشكل", nameEn: "Stuffed assorted", price: 280, image: "item-25-0.jpg" },
  { name: "رز صيني مع ايدام", nameEn: "Chinese rice with stew", price: 280, image: "item-11-0.jpg" },
  { name: "هريس", nameEn: "Harys", price: 280, image: "item-23-0.jpg" },
  { name: "كشري", nameEn: "Koshari", price: 260, image: "item-12-0.jpg" },
  { name: "لازانيا", nameEn: "Lasagna", price: 260, image: "item-20-0.jpg" },
  { name: "مكرونة البيتزا", nameEn: "pizza pasta", price: 250, image: "item-18-0.jpg" },
  { name: "مسقعه بالجبن", nameEn: "Moussaka with cheese", price: 250, image: "item-14-0.jpg" },
  { name: "رولات الباذنجان بالصوص", nameEn: "Eggplant rolls with sauce", price: 240, image: "item-24-0.jpg" },
  { name: "مسقعه", nameEn: "moussaka", price: 240, image: "item-13-0.jpg" },
  { name: "فوتتشيني", nameEn: "Fettuccine", price: 240, image: "item-16-0.jpg" },
  { name: "باستا بالدجاج", nameEn: "Chicken pasta", price: 240, image: "item-17-0.jpg" },
  { name: "مكرونة الباشميل", nameEn: "Bechamel pasta", price: 240, image: "item-19-0.jpg" },
  { name: "كرات البطاطس", nameEn: "potato balls", price: 240, image: "item-15-0.jpg" },
  { name: "جريش", nameEn: "Jyrish", price: 200, image: "item-22-0.jpg" },
]

export const CATERING_SALADS: CateringDish[] = [
  { name: "سلطة كريسبي", nameEn: "Crispy Salad", price: 170, image: "item-36-0.jpg" },
  { name: "سلطة المنجا", nameEn: "Mango salad", price: 160, image: "item-69-0.jpg" },
  { name: "سلطة كينوا", nameEn: "Quinoa salad", price: 150, image: "item-35-0.jpg" },
  { name: "فتة باذنجان", nameEn: "Eggplant Fatteh", price: 150, image: "item-34-0.jpg" },
  { name: "تبولة كينوا", nameEn: "quinoa tabbouleh", price: 150, image: "item-27-0.jpg" },
  { name: "سلطة الزعتر", nameEn: "thyme salad", price: 140, image: "item-68-0.jpg" },
  { name: "سلطة يونانية بالجبن", nameEn: "Greek salad with cheese", price: 140, image: "item-31-0.jpg" },
  { name: "سلطة سيزر", nameEn: "Caesar salad", price: 140, image: "item-29-0.jpg" },
  { name: "تبولة", nameEn: "Tabbouleh", price: 140, image: "item-26-0.jpg" },
  { name: "تبولة شمندر", nameEn: "Beetroot tabbouleh", price: 140, image: "item-28-0.jpg" },
  { name: "سلطة البافلو بالدجاج الحار", nameEn: "Buffalo salad with spicy chicken", price: 140, image: "item-33-0.jpg" },
  { name: "سلطة مكرونة", nameEn: "Pasta salad", price: 140, image: "item-32-0.jpg" },
  { name: "سلطة جرجير ورمان", nameEn: "Arugula and pomegranate salad", price: 120, image: "item-30-0.jpg" },
]

export const CATERING_APPETIZERS: CateringDish[] = [
  { name: "فتوش", nameEn: "Fattoush", price: 140, image: "item-39-0.jpg" },
  { name: "متبل", nameEn: "Mutabal", price: 130, image: "item-37-0.jpg" },
  { name: "حمص", nameEn: "hummus", price: 120, image: "item-38-0.jpg" },
  { name: "مسخن", nameEn: "Musakhan", price: 95, image: "item-42-0.jpg" },
  { name: "ملفوف", nameEn: "Malfuf", price: 90, image: "item-40-0.jpg" },
  { name: "ورق عنب", nameEn: "Waraq einab", price: 90, image: "item-41-0.jpg" },
  { name: "سمبوسه بف", nameEn: "Beef samosa", price: 3.5, image: "item-45-0.jpg" },
  { name: "سمبوسه شرائح", nameEn: "Sliced samosas", price: 3.5, image: "item-46-0.jpg" },
  { name: "كبه", nameEn: "kibbeh", price: 3.5, image: "item-44-0.jpg" },
  { name: "سبرنق رولز", nameEn: "Spring Rolls", price: 3, image: "item-43-0.jpg" },
]

export const CATERING_SIDES_POOL: CateringDish[] = [...CATERING_APPETIZERS, ...CATERING_SALADS]

export const CATERING_SWEETS: CateringDish[] = [
  { name: "ميني تارت بيكان", nameEn: "Mini Bacon Tart", price: 150, image: "item-56-0.jpg" },
  { name: "لقيمات", nameEn: "Luqaimat", price: 120, image: "item-67-0.jpg" },
  { name: "مكعبات قرص عقيل", nameEn: "Aqeel Disc Cubes", price: 120, image: "item-57-0.jpg" },
  { name: "ليمون بوبز كيك", nameEn: "Lemon Pops Cake", price: 100, image: "item-55-0.jpg" },
]

export const CATERING_TIERS: CateringTier[] = [
  {
    id: "tier0",
    label: "الباقة العائلية",
    guestMin: 10,
    guestMax: 10,
    guestLabel: "10+ ضيف",
    price: 1500,
    mainDishCount: 3,
    mainDishPool: CATERING_MAIN_DISHES,
    sideRule: { type: "guided", appetizerPool: CATERING_APPETIZERS, saladPool: CATERING_SALADS },
    sweetsMode: "addon",
    disposablesIncluded: false,
    features: ["3 أطباق رئيسية تختارها", "مقبل واحد وسلطة واحدة", "الأدوات والتغليف غير مشمولة", "تكفي 10+ ضيوف"],
    highlighted: false,
  },
  {
    id: "tier1",
    label: "الباقة الأولى",
    guestMin: 15,
    guestMax: 20,
    price: 2850,
    mainDishCount: 4,
    mainDishPool: CATERING_MAIN_DISHES,
    sideRule: { type: "guided", appetizerPool: CATERING_APPETIZERS, saladPool: CATERING_SALADS },
    sweetsMode: "addon",
    disposablesIncluded: true,
    features: ["4 أطباق رئيسية تختارها", "مقبل واحد وسلطة واحدة", "تكفي 15–20 ضيف"],
    highlighted: false,
  },
  {
    id: "tier2",
    label: "الباقة الثانية",
    guestMin: 30,
    guestMax: 40,
    price: 4260,
    mainDishCount: 5,
    mainDishPool: CATERING_MAIN_DISHES,
    sideRule: { type: "open", pool: CATERING_SIDES_POOL, min: 2, max: 3 },
    sweetsMode: "addon",
    disposablesIncluded: true,
    features: ["5 أطباق رئيسية تختارها", "2–3 مقبلات وسلطات حسب اختيارك", "تكفي 30–40 ضيف"],
    highlighted: true,
  },
  {
    id: "tier3",
    label: "الباقة الثالثة",
    guestMin: 50,
    guestMax: 60,
    price: 6640,
    mainDishCount: 6,
    mainDishPool: CATERING_MAIN_DISHES,
    sideRule: { type: "open", pool: CATERING_SIDES_POOL, min: 2, max: 3 },
    sweetsMode: "included",
    disposablesIncluded: true,
    features: ["6 أطباق رئيسية تختارها", "2–3 مقبلات وسلطات حسب اختيارك", "صنف حلا مجاني — تكفي 50–60 ضيف"],
    highlighted: false,
  },
]

export function getCateringTier(id: string): CateringTier | undefined {
  return CATERING_TIERS.find((tier) => tier.id === id)
}

export interface CateringSideSelection {
  appetizer?: string
  salad?: string
  items?: string[]
}

function findDish(pool: CateringDish[], name: string): CateringDish | undefined {
  return pool.find((dish) => dish.name === name)
}

export function validateMainDishes(tier: CateringTier, selected: string[]): string | null {
  const unique = new Set(selected)
  if (unique.size !== selected.length) return "لا يمكن اختيار نفس الطبق أكثر من مرة"
  if (selected.length !== tier.mainDishCount) return `يجب اختيار ${tier.mainDishCount} أطباق رئيسية بالضبط`
  if (!selected.every((name) => findDish(tier.mainDishPool, name))) return "أحد الأطباق المختارة غير متاح"
  return null
}

export function validateSides(tier: CateringTier, selection: CateringSideSelection): string | null {
  if (tier.sideRule.type === "guided") {
    if (!selection.appetizer || !findDish(tier.sideRule.appetizerPool, selection.appetizer)) return "اختر مقبلًا واحدًا"
    if (!selection.salad || !findDish(tier.sideRule.saladPool, selection.salad)) return "اختر سلطة واحدة"
    return null
  }

  const { pool, min, max } = tier.sideRule
  const items = selection.items ?? []
  const unique = new Set(items)
  if (unique.size !== items.length) return "لا يمكن اختيار نفس الصنف أكثر من مرة"
  if (items.length < min || items.length > max) {
    return `اختر من ${min} إلى ${max} أصناف`
  }
  if (!items.every((name) => findDish(pool, name))) return "أحد الأصناف المختارة غير متاح"
  return null
}

export function validateSweet(tier: CateringTier, sweet: string | null): string | null {
  if (tier.sweetsMode === "included") {
    if (!sweet || !findDish(CATERING_SWEETS, sweet)) return "اختر صنف حلا واحدًا (مجاني ضمن الباقة)"
    return null
  }
  if (sweet && !findDish(CATERING_SWEETS, sweet)) return "صنف الحلا غير متاح"
  return null
}

export function getSweetAddonPrice(tier: CateringTier, sweet: string | null): number {
  if (!sweet) return 0
  if (tier.sweetsMode === "included") return 0
  const dish = findDish(CATERING_SWEETS, sweet)
  return dish?.price ?? 0
}
