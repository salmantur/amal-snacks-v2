"use client"

/**
 * Minimal Editorial home preview — ports "Amal Snacks Redesign v1 - Minimal
 * Editorial.dc.html" from the Claude Design handoff into a real, data-wired
 * screen. Rendered only behind `?homeui=editorial`; it doesn't touch any of
 * the production header/product-card/cart-sheet components.
 */

import Image from "next/image"
import { useMemo, useState } from "react"
import { useCart, type MenuItem } from "@/components/cart-provider"
import { useCategories, type Category } from "@/hooks/use-categories"
import { useMenu } from "@/hooks/use-menu"
import { smartFilterMenuItems } from "@/lib/smart-search"

const INK = "oklch(16% 0.01 280)"
const ACCENT = "oklch(56% 0.17 28)"
const PAGE_BG = "oklch(94% 0.004 75)"
const PHONE_BG = "oklch(98% 0.003 75)"

const BEST_ID = "best_sellers"

function hueFor(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360
  return h
}

// Shown only when Supabase isn't configured (e.g. local preview without env vars) so the
// design can still be reviewed with content. Real menu items take priority whenever present.
const FALLBACK_ITEMS: MenuItem[] = [
  { id: "f1", name: "تمر محشي فاخر", description: "تمر سكري محشي بالمكسرات، تشكيلة راقية", price: 420, image: "", category: "stuffed_dates", isFeatured: true },
  { id: "f2", name: "ميني ساندوتش (25 قطعة)", description: "تشكيلة ساندوتشات صغيرة متنوعة للتقديم", price: 100, image: "", category: "sandwiches", isFeatured: true },
  { id: "f3", name: "فطاير مشكل", description: "فطاير جبن وزعتر ولحم طرية ومقرمشة", price: 130, image: "", category: "bakery", isFeatured: true },
  { id: "f4", name: "صينية تمر ملكي", description: "صينية تقديم فاخرة من أجود أنواع التمر", price: 500, image: "", category: "trays", isFeatured: true },
  { id: "f5", name: "تمر وتين محشي", description: "تمر محشي بالتين والمكسرات", price: 280, image: "", category: "stuffed_dates" },
  { id: "f6", name: "علبة سكري، عجوة، تين", description: "علبة هدية تمر سكري وعجوة وتين معمول", price: 120, image: "", category: "stuffed_dates" },
  { id: "f7", name: "صينية تقديم مشكلة", description: "تشكيلة متنوعة من المقبلات والحلويات", price: 350, image: "", category: "trays" },
  { id: "f8", name: "صينية ضيافة صغيرة", description: "صينية مثالية للتجمعات الصغيرة", price: 220, image: "", category: "trays" },
  { id: "f9", name: "سخانات مشكلة", description: "تشكيلة سخانات ساخنة جاهزة للتقديم", price: 180, image: "", category: "heaters" },
  { id: "f10", name: "سخان فطور", description: "سخان فطور دافئ بمكونات طازجة", price: 140, image: "", category: "breakfast_heaters" },
  { id: "f11", name: "ساندوتش حلومي", description: "ساندوتش حلومي مشوي بالخضار الطازجة", price: 90, image: "", category: "sandwiches" },
  { id: "f12", name: "كنافة بالقشطة", description: "كنافة ذهبية محشوة بالقشطة الطازجة", price: 150, image: "", category: "sweets" },
  { id: "f13", name: "أم علي", description: "حلى أم علي التقليدي بالمكسرات والقشطة", price: 110, image: "", category: "sweets" },
  { id: "f14", name: "كرواسون محشي", description: "كرواسون طري محشي بالجبن والزعتر", price: 95, image: "", category: "bakery" },
  { id: "f15", name: "باقة عيد فاخرة", description: "تشكيلة هدايا فاخرة لضيافة العيد", price: 320, image: "", category: "eid" },
  { id: "f16", name: "بلاتر مشكل", description: "بلاتر مقبلات وأجبان متنوعة", price: 260, image: "", category: "platters" },
]

function ColorBlock({ id, style }: { id: string; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `oklch(91% 0.03 ${hueFor(id)})`,
        ...style,
      }}
    />
  )
}

function ProductPhoto({ item, sizes }: { item: MenuItem; sizes: string }) {
  if (item.image) {
    return (
      <Image
        src={item.image}
        alt={item.name}
        fill
        sizes={sizes}
        quality={72}
        className="object-cover"
      />
    )
  }
  return <ColorBlock id={item.id} />
}

export function EditorialPreview() {
  const { menuItems, isLoading } = useMenu()
  const { categories: rawCategories } = useCategories()
  const { items: cartItems, addItem, updateQuantity, totalItems, totalPrice } = useCart()

  const [selectedCategory, setSelectedCategory] = useState<string>(BEST_ID)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null)
  const [drawerQty, setDrawerQty] = useState(1)
  const [cartOpen, setCartOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [flashId, setFlashId] = useState<string | null>(null)

  const usingFallback = !isLoading && menuItems.length === 0
  const products = usingFallback ? FALLBACK_ITEMS : menuItems

  const categories = useMemo<Category[]>(() => {
    const visible = rawCategories.filter((c) => c.isVisible)
    const best: Category = { id: BEST_ID, label: "الأكثر طلبًا", dbCategories: [], isVisible: true, sortOrder: 0, isCustom: false }
    return visible.some((c) => c.id === BEST_ID) ? visible : [best, ...visible]
  }, [rawCategories])

  const activeCategory = categories.find((c) => c.id === selectedCategory) || categories[0]
  const isSearching = searchQuery.trim().length > 0

  const searchResults = useMemo(
    () => (isSearching ? smartFilterMenuItems(products, searchQuery.trim()) : []),
    [isSearching, products, searchQuery]
  )
  const bestSellers = useMemo(() => products.filter((p) => p.isFeatured), [products])
  const baseGrid = useMemo(
    () =>
      selectedCategory === BEST_ID
        ? bestSellers
        : products.filter((p) => (activeCategory?.dbCategories || []).includes(p.category)),
    [selectedCategory, bestSellers, products, activeCategory]
  )
  const gridItems = isSearching ? searchResults : baseGrid
  const isBestCategory = selectedCategory === BEST_ID && !isSearching

  const quickAdd = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation()
    addItem(item, 1)
    setFlashId(item.id)
    window.setTimeout(() => setFlashId((cur) => (cur === item.id ? null : cur)), 900)
  }

  const openProduct = (item: MenuItem) => {
    setSelectedProduct(item)
    setDrawerQty(1)
  }

  const addFromDrawer = () => {
    if (!selectedProduct) return
    addItem(selectedProduct, drawerQty)
    setSelectedProduct(null)
  }

  const jumpToCategory = (id: string) => {
    setSelectedCategory(id)
    setSearchQuery("")
    setMenuOpen(false)
  }

  const pillBase: React.CSSProperties = {
    flexShrink: 0,
    border: "none",
    borderRadius: 999,
    padding: "9px 16px",
    fontSize: 12.5,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "background 0.15s ease, color 0.15s ease",
    fontFamily: "inherit",
  }
  const addBtnBase: React.CSSProperties = {
    width: 26,
    height: 26,
    borderRadius: "50%",
    border: `1.5px solid ${INK}`,
    fontSize: 14,
    fontWeight: 900,
    lineHeight: 1,
    cursor: "pointer",
    background: "none",
  }

  const drawerTotal = selectedProduct ? selectedProduct.price * drawerQty : 0

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: PAGE_BG,
        padding: "36px 16px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          position: "relative",
          width: 390,
          height: 844,
          background: PHONE_BG,
          borderRadius: 32,
          overflow: "hidden",
          boxShadow: "0 40px 80px -30px rgba(20,15,10,0.4), 0 0 0 1px rgba(0,0,0,0.05)",
          display: "flex",
          flexDirection: "column",
          fontFamily: "var(--font-thmanyah-sans), Tajawal, system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            flexShrink: 0,
            background: PHONE_BG,
            padding: "18px 20px 10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            zIndex: 5,
          }}
        >
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="فتح القائمة"
            style={{ width: 34, height: 34, border: "none", background: "none", display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center", gap: 5, cursor: "pointer", padding: 0 }}
          >
            <span style={{ width: 18, height: 1.5, background: INK }} />
            <span style={{ width: 11, height: 1.5, background: INK }} />
          </button>

          <span style={{ fontFamily: "var(--font-thmanyah-serif-text), serif", fontWeight: 900, fontSize: 17, color: INK, letterSpacing: 0.2 }}>
            أمل سناك
          </span>

          <button
            onClick={() => setCartOpen(true)}
            aria-label="فتح السلة"
            style={{ position: "relative", width: 34, height: 34, border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
          >
            <span style={{ position: "relative", width: 17, height: 15, display: "inline-block" }}>
              <span style={{ position: "absolute", top: -5, left: 3.5, width: 9, height: 7, border: `1.6px solid ${INK}`, borderBottom: "none", borderRadius: "9px 9px 0 0", boxSizing: "border-box" }} />
              <span style={{ position: "absolute", bottom: 0, left: 0, width: 17, height: 12, border: `1.6px solid ${INK}`, boxSizing: "border-box" }} />
            </span>
            {totalItems > 0 ? (
              <span style={{ position: "absolute", top: -4, right: -4, minWidth: 15, height: 15, padding: "0 3px", borderRadius: 999, background: ACCENT, color: "#fff", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {totalItems}
              </span>
            ) : null}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch" }}>
          {/* Hero */}
          <div style={{ padding: "20px 20px 22px" }}>
            <span style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: ACCENT, textTransform: "uppercase", marginBottom: 10 }}>
              مأكولات وضيافة
            </span>
            <h1 style={{ margin: 0, fontFamily: "var(--font-thmanyah-serif-text), serif", fontWeight: 900, fontSize: 40, lineHeight: 1.05, color: INK }}>
              تُحضّر بحب
              <br />
              لمناسباتك
            </h1>
          </div>

          {/* Search */}
          <div style={{ margin: "0 20px 20px", position: "relative", borderBottom: `1.5px solid ${INK}`, paddingBottom: 10, display: "flex", alignItems: "center" }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن وجبتك المفضلة"
              style={{ flex: 1, border: "none", background: "none", fontSize: 15, color: INK, outline: "none", padding: 0, fontFamily: "inherit" }}
            />
            {isSearching ? (
              <button
                onClick={() => setSearchQuery("")}
                aria-label="مسح البحث"
                style={{ border: "none", background: "none", color: "oklch(55% 0.015 270)", fontSize: 16, fontWeight: 700, cursor: "pointer", padding: 0, lineHeight: 1 }}
              >
                ×
              </button>
            ) : null}
          </div>

          {isSearching ? (
            <div>
              <h2 style={{ margin: "0 20px 14px", textAlign: "right", fontSize: 13, fontWeight: 700, letterSpacing: 0.4, color: "oklch(45% 0.015 270)" }}>
                نتائج البحث ({gridItems.length})
              </h2>
              {gridItems.length === 0 ? (
                <div style={{ padding: "40px 24px", textAlign: "center", color: "oklch(55% 0.02 270)", fontSize: 13 }}>
                  لا توجد نتائج مطابقة لبحثك
                </div>
              ) : null}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 14px", padding: "0 20px 12px" }}>
                {gridItems.map((item) => (
                  <GridCard key={item.id} item={item} flashed={flashId === item.id} onOpen={() => openProduct(item)} onQuickAdd={(e) => quickAdd(item, e)} addBtnBase={addBtnBase} />
                ))}
              </div>
            </div>
          ) : (
            <div>
              {/* Category pills */}
              <div style={{ marginTop: 6, padding: "10px 0", position: "sticky", top: 0, zIndex: 6, background: "oklch(98% 0.003 75 / 0.92)", backdropFilter: "blur(8px)" }}>
                <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "0 20px 2px" }}>
                  {categories.map((cat) => {
                    const isActive = cat.id === selectedCategory
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        style={{ ...pillBase, background: isActive ? INK : "none", color: isActive ? "#fff" : "oklch(45% 0.015 270)" }}
                      >
                        {cat.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div style={{ marginTop: 10, padding: "0 20px 24px" }}>
                <h2 style={{ margin: "0 0 14px", textAlign: "right", fontSize: 13, fontWeight: 700, letterSpacing: 0.4, color: "oklch(45% 0.015 270)" }}>
                  {activeCategory?.label || ""}
                </h2>

                {isBestCategory ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    {gridItems.map((item) => (
                      <BestCard key={item.id} item={item} onOpen={() => openProduct(item)} />
                    ))}
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "22px 14px" }}>
                    {gridItems.map((item) => (
                      <GridCard key={item.id} item={item} flashed={flashId === item.id} onOpen={() => openProduct(item)} onQuickAdd={(e) => quickAdd(item, e)} addBtnBase={addBtnBase} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {totalItems > 0 ? <div style={{ height: 74, flexShrink: 0 }} /> : null}
        </div>

        {/* Floating cart bar */}
        {totalItems > 0 ? (
          <div style={{ position: "absolute", left: 16, right: 16, bottom: 18, zIndex: 20 }}>
            <button
              onClick={() => setCartOpen(true)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", border: "none", borderRadius: 14, padding: "16px 20px", cursor: "pointer", background: INK, boxShadow: "0 16px 30px -10px rgba(0,0,0,0.4)" }}
            >
              <span style={{ color: "#fff", fontSize: 14, fontWeight: 800 }}>{totalPrice} ر.س</span>
              <span style={{ color: "#fff", fontSize: 13, fontWeight: 600, opacity: 0.75 }}>عرض السلة ({totalItems}) ‹</span>
            </button>
          </div>
        ) : null}

        {/* Product drawer */}
        {selectedProduct ? (
          <div style={{ position: "absolute", inset: 0, zIndex: 50 }}>
            <div onClick={() => setSelectedProduct(null)} style={{ position: "absolute", inset: 0, background: "rgba(15,10,8,0.4)" }} />
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "88%", background: PHONE_BG, borderRadius: "24px 24px 0 0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ flex: 1, overflowY: "auto" }}>
                <div style={{ position: "relative" }}>
                  <div style={{ width: "100%", aspectRatio: "1.3", position: "relative", background: `oklch(91% 0.03 ${hueFor(selectedProduct.id)})`, overflow: "hidden" }}>
                    {selectedProduct.image ? <ProductPhoto item={selectedProduct} sizes="390px" /> : null}
                  </div>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    aria-label="إغلاق"
                    style={{ position: "absolute", top: 16, left: 16, width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.92)", border: "none", fontSize: 15, fontWeight: 700, color: INK, cursor: "pointer" }}
                  >
                    ×
                  </button>
                </div>
                <div style={{ padding: "22px 20px 4px", textAlign: "right" }}>
                  <h2 style={{ margin: 0, fontFamily: "var(--font-thmanyah-serif-text), serif", fontSize: 22, fontWeight: 900, color: INK }}>
                    {selectedProduct.name}
                  </h2>
                  <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.6, color: "oklch(48% 0.02 270)" }}>{selectedProduct.description}</p>
                  <p style={{ margin: "14px 0 0", fontSize: 19, fontWeight: 800, color: "oklch(45% 0.015 270)" }}>{selectedProduct.price} ر.س</p>
                </div>
              </div>
              <div style={{ flexShrink: 0, padding: "16px 20px 22px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, border: "1.5px solid oklch(90% 0.01 270)", borderRadius: 999, padding: "8px 16px" }}>
                  <button onClick={() => setDrawerQty((q) => q + 1)} aria-label="زيادة" style={{ border: "none", background: "none", fontSize: 18, fontWeight: 900, color: INK, cursor: "pointer" }}>+</button>
                  <span style={{ minWidth: 16, textAlign: "center", fontSize: 15, fontWeight: 800 }}>{drawerQty}</span>
                  <button onClick={() => setDrawerQty((q) => Math.max(1, q - 1))} aria-label="تقليل" style={{ border: "none", background: "none", fontSize: 18, fontWeight: 900, color: INK, cursor: "pointer" }}>–</button>
                </div>
                <button
                  onClick={addFromDrawer}
                  style={{ flex: 1, height: 50, border: "none", borderRadius: 999, background: INK, color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  أضف إلى السلة · {drawerTotal} ر.س
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Cart sheet */}
        {cartOpen ? (
          <div style={{ position: "absolute", inset: 0, zIndex: 50 }}>
            <div onClick={() => setCartOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(15,10,8,0.4)" }} />
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "82%", background: PHONE_BG, borderRadius: "24px 24px 0 0", display: "flex", flexDirection: "column" }}>
              <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 12px" }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: INK }}>سلتك</h2>
                <button onClick={() => setCartOpen(false)} aria-label="إغلاق" style={{ width: 30, height: 30, borderRadius: "50%", background: "none", border: "none", fontSize: 16, fontWeight: 700, cursor: "pointer", color: INK }}>×</button>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "6px 20px" }}>
                {cartItems.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {cartItems.map((ci) => (
                      <div key={ci.cartKey} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid oklch(93% 0.008 270)" }}>
                        <div style={{ flex: 1, textAlign: "right" }}>
                          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: INK }}>{ci.name}</p>
                          <p style={{ margin: "4px 0 0", fontSize: 12.5, fontWeight: 700, color: "oklch(45% 0.015 270)" }}>{ci.price * ci.quantity} ر.س</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <button onClick={() => updateQuantity(ci.cartKey, ci.quantity + 1)} style={{ border: "none", background: "none", fontSize: 14, fontWeight: 900, cursor: "pointer", color: INK }}>+</button>
                          <span style={{ minWidth: 14, textAlign: "center", fontSize: 13, fontWeight: 800 }}>{ci.quantity}</span>
                          <button onClick={() => updateQuantity(ci.cartKey, ci.quantity - 1)} style={{ border: "none", background: "none", fontSize: 14, fontWeight: 900, cursor: "pointer", color: INK }}>–</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: "50px 20px", textAlign: "center", color: "oklch(55% 0.02 270)", fontSize: 13 }}>سلتك فارغة، أضف شيئًا لذيذًا</div>
                )}
              </div>
              {cartItems.length > 0 ? (
                <div style={{ flexShrink: 0, padding: "14px 20px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <span style={{ fontSize: 13, color: "oklch(48% 0.02 270)" }}>المجموع</span>
                    <span style={{ fontSize: 17, fontWeight: 900, color: INK }}>{totalPrice} ر.س</span>
                  </div>
                  <button style={{ width: "100%", height: 50, border: "none", borderRadius: 999, background: INK, color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
                    تأكيد الطلب
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* Side menu */}
        {menuOpen ? (
          <div style={{ position: "absolute", inset: 0, zIndex: 60 }}>
            <div onClick={() => setMenuOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(15,10,8,0.35)" }} />
            <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "76%", maxWidth: 290, background: PHONE_BG, display: "flex", flexDirection: "column" }}>
              <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 16px" }}>
                <span style={{ fontFamily: "var(--font-thmanyah-serif-text), serif", fontWeight: 900, fontSize: 16, color: INK }}>القائمة</span>
                <button onClick={() => setMenuOpen(false)} aria-label="إغلاق" style={{ width: 30, height: 30, border: "none", background: "none", fontSize: 16, fontWeight: 700, cursor: "pointer", color: INK }}>×</button>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "0 20px" }}>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => jumpToCategory(cat.id)}
                    style={{ width: "100%", display: "block", border: "none", background: "none", padding: "14px 0", fontSize: 15, fontWeight: 600, color: "oklch(20% 0.01 280)", cursor: "pointer", textAlign: "right", borderBottom: "1px solid oklch(93% 0.008 270)" }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function GridCard({
  item,
  flashed,
  onOpen,
  onQuickAdd,
  addBtnBase,
}: {
  item: MenuItem
  flashed: boolean
  onOpen: () => void
  onQuickAdd: (e: React.MouseEvent) => void
  addBtnBase: React.CSSProperties
}) {
  return (
    <div onClick={onOpen} style={{ cursor: "pointer" }}>
      <div style={{ position: "relative", aspectRatio: "1", borderRadius: 14, overflow: "hidden", background: `oklch(91% 0.03 ${hueFor(item.id)})` }}>
        <ProductPhoto item={item} sizes="(max-width: 480px) 46vw, 175px" />
      </div>
      <div style={{ paddingTop: 10, textAlign: "right" }}>
        <h3 style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: INK, lineHeight: 1.3 }}>{item.name}</h3>
        <p style={{ margin: "5px 0 0", fontSize: 11.5, color: "oklch(52% 0.012 270)", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {item.description}
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "oklch(45% 0.015 270)" }}>{item.price} ر.س</span>
          <button
            onClick={onQuickAdd}
            aria-label="إضافة"
            style={{ ...addBtnBase, background: flashed ? INK : "none", color: flashed ? "#fff" : INK }}
          >
            {flashed ? "✓" : "+"}
          </button>
        </div>
      </div>
    </div>
  )
}

function BestCard({ item, onOpen }: { item: MenuItem; onOpen: () => void }) {
  return (
    <div
      onClick={onOpen}
      style={{ position: "relative", cursor: "pointer", padding: 9, borderRadius: 24, filter: "drop-shadow(0px 4px 4px rgba(0,0,0,0.15)) drop-shadow(0px 1px 1.5px rgba(0,0,0,0.3))" }}
    >
      <div style={{ position: "relative", width: "100%", aspectRatio: "0.78", background: `oklch(91% 0.03 ${hueFor(item.id)})`, borderRadius: 14, overflow: "hidden" }}>
        <ProductPhoto item={item} sizes="(max-width: 480px) 46vw, 175px" />
        <h3 style={{ position: "absolute", top: 14, right: 14, left: 14, margin: 0, textAlign: "right", fontFamily: "var(--font-thmanyah-serif-text), serif", fontSize: 15, fontWeight: 900, color: INK, lineHeight: 1.25 }}>
          {item.name}
        </h3>
        <div style={{ position: "absolute", left: 14, bottom: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "7px 13px", background: "rgba(255,255,255,0.65)", border: "1px solid #d7d2cf", borderRadius: 999, boxShadow: "0 10px 24px 0 rgba(0,0,0,0.1)" }}>
          <svg width="11" height="12" viewBox="0 0 24 24" style={{ flexShrink: 0, display: "block" }}>
            <path d="M5 3 L5 21 M5 9.5 L19 6 M5 16 L19 12.5" stroke="#212430" strokeWidth={2.3} fill="none" strokeLinecap="round" />
          </svg>
          <span style={{ fontFamily: "Tajawal, sans-serif", fontWeight: 800, fontSize: 15, lineHeight: 1, color: "#212430" }}>{item.price}</span>
        </div>
      </div>
    </div>
  )
}
