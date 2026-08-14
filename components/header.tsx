"use client"

import { ShoppingBag, Sparkles, Menu, MoreVertical, ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import Link from "next/link"
import { useCart } from "@/components/cart-provider"
import { useRouter } from "next/navigation"
import { useMenu } from "@/hooks/use-menu"
import { useCategories } from "@/hooks/use-categories"
import type { MenuItem } from "@/components/cart-provider"
import { PriceWithRiyalLogo } from "@/components/ui/price-with-riyal-logo"
import { CartSheet } from "@/components/cart-sheet"
import { trapFocusOnTab } from "@/lib/dialog-focus"
import { useHeaderConfig } from "@/hooks/use-header-config"
import { DEFAULT_HEADER_CONFIG, type HeaderConfig } from "@/lib/header-config"

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "")
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean
  const r = Number.parseInt(full.slice(0, 2), 16)
  const g = Number.parseInt(full.slice(2, 4), 16)
  const b = Number.parseInt(full.slice(4, 6), 16)
  if ([r, g, b].some((n) => Number.isNaN(n))) return `rgba(255,255,255,${alpha})`
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const OrderTypeModal = dynamic(
  () => import("@/components/order-type-modal").then((mod) => ({ default: mod.OrderTypeModal })),
  { ssr: false }
)

function NewProductsTicker({ items }: { items: MenuItem[] }) {
  const newItems = items.filter((i) => i.isFeatured)
  if (newItems.length === 0) return null

  const doubled = [...newItems, ...newItems]

  return (
    <div className="overflow-hidden bg-primary h-7 flex items-center">
      <div
        className="new-products-ticker-track flex gap-8 whitespace-nowrap"
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
        @media (prefers-reduced-motion: reduce) {
          .new-products-ticker-track {
            animation: none !important;
            transform: none !important;
            will-change: auto !important;
          }
        }
      `}</style>
    </div>
  )
}

export function Header({ configOverride }: { configOverride?: HeaderConfig } = {}) {
  const { config: storedConfig } = useHeaderConfig()
  const config = configOverride ?? storedConfig ?? DEFAULT_HEADER_CONFIG
  const [cartOpen, setCartOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [cartBounce, setCartBounce] = useState(false)
  const prevCount = useRef(0)
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null)
  const cartTriggerRef = useRef<HTMLButtonElement | null>(null)
  const menuDialogRef = useRef<HTMLDivElement | null>(null)
  const menuCloseButtonRef = useRef<HTMLButtonElement | null>(null)
  const menuReturnFocusRef = useRef<HTMLElement | null>(null)
  const router = useRouter()
  const { totalItems, totalPrice } = useCart()

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
    if (!menuOpen) return

    const previousOverflow = document.body.style.overflow
    const previousTouchAction = document.body.style.touchAction

    document.body.style.overflow = "hidden"
    document.body.style.touchAction = "none"

    return () => {
      document.body.style.overflow = previousOverflow
      document.body.style.touchAction = previousTouchAction
    }
  }, [menuOpen])

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
    if (!menuOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false)
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [menuOpen])

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
          background: scrolled ? hexToRgba(config.background_color, 0.97) : hexToRgba(config.background_color, 1),
          boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.08)" : "none",
          backdropFilter: scrolled ? "blur(12px)" : "none",
        }}
      >
        <div
          className="relative flex min-h-[4.5rem] items-center justify-between px-4 pb-3 pt-3 md:px-6"
          style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
        >
          {config.menu_icon_style === "hidden" ? (
            <div className="h-11 w-11" aria-hidden="true" />
          ) : (
            <button
              ref={menuTriggerRef}
              onClick={() => setMenuOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f8fafc] active:opacity-60 transition-opacity"
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              aria-controls="header-menu-dialog"
              aria-label="فتح القائمة"
            >
              {config.menu_icon_style === "dots" ? (
                <MoreVertical className="h-5 w-5" style={{ color: config.icon_color }} />
              ) : (
                <Menu className="h-5 w-5" style={{ color: config.icon_color }} />
              )}
            </button>
          )}

          <Link href="/" className="absolute left-1/2 -translate-x-1/2 active:opacity-70 transition-opacity">
            {config.logo_image_url ? (
              <Image src={config.logo_image_url} alt={config.logo_text} width={140} height={40} className="h-9 w-auto object-contain" priority />
            ) : (
              <p className="text-xl font-black tracking-tight text-foreground" dir="rtl">{config.logo_text}</p>
            )}
          </Link>

          <button
            ref={cartTriggerRef}
            onClick={() => setCartOpen(true)}
            className="relative flex min-h-11 items-center gap-2 rounded-full active:scale-95 transition-all duration-150"
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
                color: totalItems > 0 ? "var(--background)" : config.icon_color,
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

      <CartSheet
        id="header-cart-dialog"
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => {
          setCartOpen(false)
          setOrderModalOpen(true)
        }}
      />

      {menuOpen && (
        <div className="fixed inset-0 z-[100]" dir="rtl">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div
            id="header-menu-dialog"
            ref={menuDialogRef}
            className="absolute top-0 right-0 bottom-0 flex w-[min(92vw,24rem)] flex-col bg-white shadow-2xl"
            style={{
              borderRadius: "0 0 0 24px",
              paddingBottom: "env(safe-area-inset-bottom)",
              paddingTop: "env(safe-area-inset-top)",
            }}
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
                className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center active:scale-95"
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
                  className="flex min-h-12 w-full items-center justify-between border-b border-gray-50 px-5 py-3.5 transition-colors active:bg-gray-50 last:border-0"
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
