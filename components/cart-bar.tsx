"use client"

import { useRouter } from "next/navigation"
import { ShoppingBag, ChevronLeft } from "lucide-react"
import dynamic from "next/dynamic"
import { useRef, useState } from "react"
import { useCart } from "@/components/cart-provider"
import { PriceWithRiyalLogo } from "@/components/ui/price-with-riyal-logo"
import { CartSheet } from "@/components/cart-sheet"

const OrderTypeModal = dynamic(
  () => import("@/components/order-type-modal").then((mod) => ({ default: mod.OrderTypeModal })),
  { ssr: false }
)

export function CartBar() {
  const { totalItems, totalPrice } = useCart()
  const [modalOpen, setModalOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const cartTriggerRef = useRef<HTMLButtonElement | null>(null)
  const router = useRouter()

  const handleSelect = (type: "pickup" | "delivery") => {
    setModalOpen(false)
    router.push(`/checkout?type=${type}`)
  }

  if (totalItems === 0) return null

  return (
    <>
      <div
        className="fixed left-0 right-0 z-40 px-2.5 sm:px-3 md:px-4"
        style={{ bottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}
      >
        <div className="relative mx-auto flex max-w-3xl items-center gap-2 overflow-hidden rounded-full border border-white/40 bg-gradient-to-br from-white/70 via-white/45 to-white/30 px-3 py-2.5 text-foreground shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-2xl md:px-4 md:py-3">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.8),transparent_45%),radial-gradient(circle_at_85%_80%,rgba(255,255,255,0.35),transparent_45%)]" />
          <div className="pointer-events-none absolute inset-[1px] rounded-full border border-white/35" />

          <button
            onClick={() => setModalOpen(true)}
            className="relative z-10 grid h-11 w-auto min-w-[104px] shrink-0 grid-cols-[16px_1fr_16px] items-center rounded-full border border-white/60 bg-white/80 px-3 font-semibold text-foreground shadow-sm transition-colors active:scale-95 hover:bg-white/90"
            dir="rtl"
          >
            <span aria-hidden="true" className="h-4 w-4" />
            <span className="text-center leading-none">تأكيد</span>
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            ref={cartTriggerRef}
            onClick={() => setCartOpen(true)}
            className="relative z-10 min-w-0 flex-1 rounded-full px-2 py-1.5 transition-opacity active:opacity-80"
            dir="rtl"
            aria-haspopup="dialog"
            aria-expanded={cartOpen}
            aria-controls="cart-bar-dialog"
            aria-label="فتح السلة"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 text-right">
                <p className="text-[11px] leading-4 text-foreground/65">
                  ملخص السلة
                </p>
                <p className="truncate text-[15px] font-extrabold leading-5">
                  {totalItems} منتج · <PriceWithRiyalLogo value={totalPrice} />
                </p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/90 shadow-sm">
                <ShoppingBag className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
          </button>
        </div>
      </div>

      <CartSheet
        id="cart-bar-dialog"
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => {
          setCartOpen(false)
          setModalOpen(true)
        }}
      />

      <OrderTypeModal
        open={modalOpen}
        onSelect={handleSelect}
        onClose={() => setModalOpen(false)}
      />
    </>
  )
}
