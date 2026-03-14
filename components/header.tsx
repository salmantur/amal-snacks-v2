"use client"

import { ShoppingBag, X, Sparkles, Menu, ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from "react"
import Link from "next/link"
import { useCart } from "@/components/cart-provider"
import { OrderTypeModal } from "@/components/order-type-modal"
import { useRouter } from "next/navigation"
import { useMenu } from "@/hooks/use-menu"
import { useCategories } from "@/hooks/use-categories"
import type { MenuItem } from "@/components/cart-provider"
import { PriceWithRiyalLogo } from "@/components/ui/price-with-riyal-logo"

function NewProductsTicker({ items }: { items: MenuItem[] }) {
  const newItems = items.filter((i) => i.isFeatured)
  if (newItems.length === 0) return null

  const doubled = [...newItems, ...newItems]

  return (
    <div className="overflow-hidden bg-primary h-7 flex items-center">
      <div
        className="flex gap-8 whitespace-nowrap"
        style={{
          animation: "ticker 20s linear infinite",
          willChange: "transform",
        }}
      >
        {doubled.map((item, i) => (
          <span key={`${item.id}-${i}`} className="text-primary-foreground text-xs font-medium flex items-center gap-1.5 flex-shrink-0">
            <Sparkles className="h-3 w-3 flex-shrink-0" />
            {item.name}
            <span className="opacity-70 mr-1">- <PriceWithRiyalLogo value={item.price} /></span>
          </span>
        ))}
      </div>
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}

function getFocusableElements(container: HTMLElement | null) {
  if (!container) return []

  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
  ).filter((element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true")
}

function trapFocusOnTab(event: ReactKeyboardEvent<HTMLElement>, container: HTMLElement | null) {
  if (event.key !== "Tab") return

  const focusable = getFocusableElements(container)
  if (focusable.length === 0) {
    event.preventDefault()
    return
  }

  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  const activeElement = document.activeElement

  if (event.shiftKey && activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

export function Header() {
  const [cartOpen, setCartOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [cartBounce, setCartBounce] = useState(false)
  const prevCount = useRef(0)
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null)
  const cartTriggerRef = useRef<HTMLButtonElement | null>(null)
  const cartDialogRef = useRef<HTMLDivElement | null>(null)
  const menuDialogRef = useRef<HTMLDivElement | null>(null)
  const cartCloseButtonRef = useRef<HTMLButtonElement | null>(null)
  const menuCloseButtonRef = useRef<HTMLButtonElement | null>(null)
  const cartReturnFocusRef = useRef<HTMLElement | null>(null)
  const menuReturnFocusRef = useRef<HTMLElement | null>(null)
  const router = useRouter()
  const { items, totalItems, totalPrice, removeItem, updateQuantity } = useCart()

  const { menuItems } = useMenu()
  const { categories } = useCategories()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    if (totalItems > prevCount.current) {
      setCartBounce(true)
      setTimeout(() => setCartBounce(false), 600)
    }
    prevCount.current = totalItems
  }, [totalItems])

  useEffect(() => {
    if (!cartOpen && !menuOpen) return

    const previousOverflow = document.body.style.overflow
    const previousTouchAction = document.body.style.touchAction

    document.body.style.overflow = "hidden"
    document.body.style.touchAction = "none"

    return () => {
      document.body.style.overflow = previousOverflow
      document.body.style.touchAction = previousTouchAction
    }
  }, [cartOpen, menuOpen])

  useEffect(() => {
    if (!cartOpen) return

    cartReturnFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : cartTriggerRef.current

    const focusTimeout = window.setTimeout(() => {
      cartCloseButtonRef.current?.focus()
    }, 0)

    return () => {
      window.clearTimeout(focusTimeout)
      cartReturnFocusRef.current?.focus()
    }
  }, [cartOpen])

  useEffect(() => {
    if (!menuOpen) return

    menuReturnFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : menuTriggerRef.current

    const focusTimeout = window.setTimeout(() => {
      menuCloseButtonRef.current?.focus()
    }, 0)

    return () => {
      window.clearTimeout(focusTimeout)
      menuReturnFocusRef.current?.focus()
    }
  }, [menuOpen])

  useEffect(() => {
    if (!cartOpen && !menuOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (cartOpen) setCartOpen(false)
        if (menuOpen) setMenuOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [cartOpen, menuOpen])

  const handleOrderSelect = (type: "pickup" | "delivery") => {
    setOrderModalOpen(false)
    setCartOpen(false)
    router.push(`/checkout?type=${type}`)
  }

  return (
    <>
      <NewProductsTicker items={menuItems} />

      <header
        className="sticky top-0 z-40 transition-all duration-200"
        style={{
          background: scrolled ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,1)",
          boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.08)" : "none",
          backdropFilter: scrolled ? "blur(12px)" : "none",
        }}
      >
        <div className="relative flex items-center justify-between px-4 py-3">
          <button
            ref={menuTriggerRef}
            onClick={() => setMenuOpen(true)}
            className="w-10 h-10 flex items-center justify-center active:opacity-60 transition-opacity"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            aria-controls="header-menu-dialog"
            aria-label="فتح القائمة"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>

          <Link href="/" className="absolute left-1/2 -translate-x-1/2 active:opacity-70 transition-opacity">
            <p className="text-xl font-black tracking-tight text-foreground" dir="rtl">أمل سناك</p>
          </Link>

          <button
            ref={cartTriggerRef}
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 rounded-full active:scale-95 transition-all duration-150"
            style={{
              background: totalItems > 0 ? "var(--foreground)" : "#f5f5f5",
              padding: totalItems > 0 ? "8px 14px 8px 10px" : "10px",
            }}
            aria-haspopup="dialog"
            aria-expanded={cartOpen}
            aria-controls="header-cart-dialog"
            aria-label="فتح السلة"
          >
            <ShoppingBag
              className="h-5 w-5 transition-transform duration-300"
              style={{
                color: totalItems > 0 ? "var(--background)" : "var(--foreground)",
                transform: cartBounce ? "scale(1.3)" : "scale(1)",
              }}
            />
            {totalItems > 0 && (
              <span className="text-sm font-bold transition-all" style={{ color: "var(--background)" }}>
                <PriceWithRiyalLogo value={totalPrice} />
              </span>
            )}
            {totalItems > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center shadow"
                style={{ transform: cartBounce ? "scale(1.4)" : "scale(1)", transition: "transform 0.3s" }}
              >
                {totalItems > 9 ? "9+" : totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      {cartOpen && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div
            id="header-cart-dialog"
            ref={cartDialogRef}
            className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl flex flex-col"
            style={{ maxHeight: "80vh", paddingBottom: "env(safe-area-inset-bottom)" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="header-cart-title"
            tabIndex={-1}
            onKeyDown={(event) => trapFocusOnTab(event, cartDialogRef.current)}
          >
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-b border-border/50 flex-shrink-0" dir="rtl">
                <h2 id="header-cart-title" className="text-lg font-bold">سلتك 🛍️</h2>
                <div className="flex items-center gap-3">
                {totalItems > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {totalItems} عنصر · <PriceWithRiyalLogo value={totalPrice} />
                  </span>
                )}
                  <button
                    ref={cartCloseButtonRef}
                    onClick={() => setCartOpen(false)}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:scale-95"
                    aria-label="إغلاق السلة"
                  >
                    <X className="h-4 w-4" />
                  </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2.5" dir="rtl">
              {items.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <ShoppingBag className="h-14 w-14 mx-auto mb-3 opacity-10" />
                  <p className="font-medium">سلتك فارغة</p>
                  <p className="text-xs mt-1 opacity-60">أضف أصناف من القائمة</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.cartKey} className="flex items-center gap-3 p-3 bg-[#f8f8f8] rounded-2xl">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{item.name}</p>
                      {item.selectedIngredients?.length ? (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {item.selectedIngredients
                            .map((s) => (s.includes("||") ? s.split("||")[0] : s))
                            .join("، ")}
                        </p>
                      ) : null}
                      <p className="text-sm font-bold text-primary mt-1">
                        <PriceWithRiyalLogo value={item.price * item.quantity} />
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => item.quantity === 1 ? removeItem(item.cartKey) : updateQuantity(item.cartKey, item.quantity - 1)}
                        className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center active:scale-95 text-base font-bold"
                      >
                        {item.quantity === 1 ? <X className="h-3 w-3 text-red-400" /> : "-"}
                      </button>
                      <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                        className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center active:scale-95 text-base font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="px-4 py-3 border-t border-border/30 flex-shrink-0">
                <div className="flex justify-between items-center mb-3 px-1" dir="rtl">
                  <span className="text-muted-foreground text-sm">المجموع</span>
                  <span className="font-black text-lg">
                    <PriceWithRiyalLogo value={totalPrice} />
                  </span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setCartOpen(false)}
                    className="py-3.5 px-5 rounded-2xl bg-[#f5f5f5] text-foreground font-medium active:scale-95 transition-transform text-sm"
                  >
                    تسوق أكثر
                  </button>
                  <button
                    onClick={() => { setCartOpen(false); setOrderModalOpen(true) }}
                    className="flex-1 py-3.5 rounded-2xl bg-foreground text-background font-bold active:scale-95 transition-transform text-sm flex items-center justify-center gap-2"
                  >
                    تأكيد الطلب
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {menuOpen && (
        <div className="fixed inset-0 z-[100]" dir="rtl">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div
            id="header-menu-dialog"
            ref={menuDialogRef}
            className="absolute top-0 right-0 bottom-0 w-72 bg-white flex flex-col shadow-2xl"
            style={{ borderRadius: "0 0 0 24px" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="header-menu-title"
            tabIndex={-1}
            onKeyDown={(event) => trapFocusOnTab(event, menuDialogRef.current)}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <button
                ref={menuCloseButtonRef}
                onClick={() => setMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:scale-95"
                aria-label="إغلاق القائمة"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <p id="header-menu-title" className="font-bold text-base">القائمة</p>
            </div>
            <div className="overflow-y-auto flex-1 py-3">
              {categories.filter((cat) => cat.isVisible).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setMenuOpen(false)
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent("selectCategory", { detail: cat.id }))
                    }, 100)
                  }}
                  className="w-full flex items-center justify-between px-5 py-3.5 active:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                >
                  <ChevronLeft className="h-4 w-4 text-gray-300 flex-shrink-0" />
                  <span className="font-medium text-[15px] text-gray-800">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <OrderTypeModal
        open={orderModalOpen}
        onSelect={handleOrderSelect}
        onClose={() => setOrderModalOpen(false)}
      />
    </>
  )
}
