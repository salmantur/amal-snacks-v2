"use client"

import { ShoppingBag, X, Sparkles, ChevronLeft } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useCart } from "@/components/cart-provider"
import { OrderTypeModal } from "@/components/order-type-modal"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import type { MenuItem } from "@/components/cart-provider"

const fetcher = (url: string) => fetch(url).then(r => r.json())

// ─── New Products Ticker ──────────────────────────────────────────────────────
function NewProductsTicker({ items }: { items: MenuItem[] }) {
  const newItems = items.filter(i => i.isFeatured)
  if (newItems.length === 0) return null

  // Duplicate for seamless loop
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
          <span key={i} className="text-primary-foreground text-xs font-medium flex items-center gap-1.5 flex-shrink-0">
            <Sparkles className="h-3 w-3 flex-shrink-0" />
            {item.name}
            <span className="opacity-70 mr-1">— {item.price} ر.س</span>
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

// ─── Main Header ──────────────────────────────────────────────────────────────
export function Header() {
  const [cartOpen, setCartOpen] = useState(false)
  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [cartBounce, setCartBounce] = useState(false)
  const prevCount = useRef(0)
  const router = useRouter()
  const { items, totalItems, totalPrice, removeItem, updateQuantity } = useCart()

  const { data: result } = useSWR<{ data: MenuItem[] }>("/api/menu", fetcher, {
    revalidateOnFocus: false, dedupingInterval: 300000,
  })
  const menuItems = result?.data || []

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Bounce cart icon when item added
  useEffect(() => {
    if (totalItems > prevCount.current) {
      setCartBounce(true)
      setTimeout(() => setCartBounce(false), 600)
    }
    prevCount.current = totalItems
  }, [totalItems])

  const handleOrderSelect = (type: "pickup" | "delivery") => {
    setOrderModalOpen(false)
    setCartOpen(false)
    router.push(`/checkout?type=${type}`)
  }

  return (
    <>
      {/* New products ticker */}
      <NewProductsTicker items={menuItems} />

      {/* Main header */}
      <header
        className="sticky top-0 z-40 transition-all duration-200"
        style={{
          background: scrolled ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,1)",
          boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.08)" : "none",
          backdropFilter: scrolled ? "blur(12px)" : "none",
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">

          {/* Logo / brand */}
          <Link href="/" className="flex items-center gap-2 active:opacity-70 transition-opacity">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground text-base font-black">أ</span>
            </div>
            <div dir="rtl">
              <p className="text-base font-black leading-none tracking-tight">أمل سناك</p>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Amal Snack</p>
            </div>
          </Link>

          {/* Right side actions */}
          <div className="flex items-center gap-2">

            {/* Working hours badge */}
            <div className="hidden sm:flex items-center gap-1.5 bg-green-50 border border-green-100 rounded-full px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
              <span className="text-xs font-medium text-green-700">8ص – 2ف</span>
            </div>

            {/* Cart button */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-2 rounded-full active:scale-95 transition-all duration-150"
              style={{
                background: totalItems > 0 ? "var(--foreground)" : "#f5f5f5",
                padding: totalItems > 0 ? "8px 14px 8px 10px" : "10px",
              }}
            >
              <ShoppingBag
                className="h-5 w-5 transition-transform duration-300"
                style={{
                  color: totalItems > 0 ? "var(--background)" : "var(--foreground)",
                  transform: cartBounce ? "scale(1.3)" : "scale(1)",
                }}
              />
              {totalItems > 0 && (
                <span
                  className="text-sm font-bold transition-all"
                  style={{ color: "var(--background)" }}
                >
                  {totalPrice} ر.س
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
        </div>
      </header>

      {/* Cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div
            className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl flex flex-col"
            style={{ maxHeight: "80vh", paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/50 flex-shrink-0" dir="rtl">
              <h2 className="text-lg font-bold">سلتك 🛍️</h2>
              <div className="flex items-center gap-3">
                {totalItems > 0 && (
                  <span className="text-sm text-muted-foreground">{totalItems} عنصر · {totalPrice} ر.س</span>
                )}
                <button
                  onClick={() => setCartOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:scale-95"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Items */}
            <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2.5" dir="rtl">
              {items.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <ShoppingBag className="h-14 w-14 mx-auto mb-3 opacity-10" />
                  <p className="font-medium">سلتك فارغة</p>
                  <p className="text-xs mt-1 opacity-60">أضف أصناف من القائمة</p>
                </div>
              ) : (
                items.map(item => (
                  <div key={item.cartKey} className="flex items-center gap-3 p-3 bg-[#f8f8f8] rounded-2xl">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{item.name}</p>
                      {item.selectedIngredients?.length ? (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {item.selectedIngredients
                            .map(s => s.includes("||") ? s.split("||")[0] : s)
                            .join("، ")}
                        </p>
                      ) : null}
                      <p className="text-sm font-bold text-primary mt-1">{item.price * item.quantity} ر.س</p>
                    </div>
                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => item.quantity === 1 ? removeItem(item.cartKey) : updateQuantity(item.cartKey, item.quantity - 1)}
                        className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center active:scale-95 text-base font-bold"
                      >
                        {item.quantity === 1 ? <X className="h-3 w-3 text-red-400" /> : "−"}
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

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-4 py-3 border-t border-border/30 flex-shrink-0">
                {/* Total */}
                <div className="flex justify-between items-center mb-3 px-1" dir="rtl">
                  <span className="text-muted-foreground text-sm">المجموع</span>
                  <span className="font-black text-lg">{totalPrice} ر.س</span>
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

      <OrderTypeModal
        open={orderModalOpen}
        onSelect={handleOrderSelect}
        onClose={() => setOrderModalOpen(false)}
      />
    </>
  )
}