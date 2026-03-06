"use client"

import { useRouter } from "next/navigation"
import { ShoppingBag, ChevronLeft, X } from "lucide-react"
import { useState } from "react"
import { useCart } from "@/components/cart-provider"
import { OrderTypeModal } from "@/components/order-type-modal"
import { SaudiRiyalIcon } from "@/components/ui/saudi-riyal-icon"
function RiyalAmount({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span>{value}</span>
      <SaudiRiyalIcon className="h-[0.9em] w-[0.9em]" />
    </span>
  )
}

export function CartBar() {
  const { items, totalItems, totalPrice, removeItem, updateQuantity } = useCart()
  const [modalOpen, setModalOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const router = useRouter()

  if (totalItems === 0) return null

  const handleSelect = (type: "pickup" | "delivery") => {
    setModalOpen(false)
    router.push(`/checkout?type=${type}`)
  }

  return (
    <>
      <div className="fixed left-0 right-0 z-40 px-3 md:px-4" style={{ bottom: "calc(0.5rem + env(safe-area-inset-bottom))" }}>
        <div className="mx-auto max-w-3xl relative rounded-full px-3 py-2.5 md:px-4 md:py-3 flex items-center gap-2 text-foreground shadow-[0_10px_30px_rgba(0,0,0,0.18)] border border-white/40 backdrop-blur-2xl bg-gradient-to-br from-white/70 via-white/45 to-white/30 overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.8),transparent_45%),radial-gradient(circle_at_85%_80%,rgba(255,255,255,0.35),transparent_45%)]" />
          <div className="pointer-events-none absolute inset-[1px] rounded-full border border-white/35" />

          <button
            onClick={() => setModalOpen(true)}
            className="relative z-10 shrink-0 h-11 w-[118px] rounded-full px-3 bg-white/80 text-foreground font-semibold border border-white/60 shadow-sm hover:bg-white/90 transition-colors active:scale-95 grid grid-cols-[16px_1fr_16px] items-center"
            dir="rtl"
          >
            <span aria-hidden="true" className="w-4 h-4" />
            <span className="text-center leading-none">تأكيد</span>
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            onClick={() => setCartOpen(true)}
            className="relative z-10 flex-1 min-w-0 rounded-full px-2 py-1.5 active:opacity-80 transition-opacity"
            dir="rtl"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 text-right">
                <p className="text-[11px] leading-4 text-foreground/65">ملخص السلة</p>
                <p className="font-extrabold text-[15px] leading-5 truncate">
                  {totalItems} منتجات · <RiyalAmount value={totalPrice} />
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center border border-primary/30 shadow-sm shrink-0">
                <ShoppingBag className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
          </button>
        </div>
      </div>

      {cartOpen ? (
        <div className="fixed inset-0 z-50" onClick={() => setCartOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl p-5 max-h-[70vh] flex flex-col"
            style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-4" />

            <div className="flex items-center justify-between mb-4" dir="rtl">
              <h2 className="text-lg font-bold">سلتك</h2>
              <span className="text-sm text-muted-foreground">
                {totalItems} عنصر · <RiyalAmount value={totalPrice} />
              </span>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2 pb-2" dir="rtl">
              {items.map((item) => (
                <div key={item.cartKey} className="flex items-center gap-3 p-3 bg-amal-grey rounded-2xl">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    {item.selectedIngredients?.length ? <p className="text-xs text-muted-foreground truncate">{item.selectedIngredients.join("، ")}</p> : null}
                    <p className="text-sm font-bold text-primary mt-0.5">
                      <RiyalAmount value={item.price * item.quantity} />
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => (item.quantity === 1 ? removeItem(item.cartKey) : updateQuantity(item.cartKey, item.quantity - 1))}
                      className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center active:scale-95 transition-transform text-lg font-bold"
                    >
                      {item.quantity === 1 ? <X className="h-3.5 w-3.5 text-red-500" /> : "−"}
                    </button>
                    <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                      className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center active:scale-95 transition-transform text-lg font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-4">
              <button onClick={() => setCartOpen(false)} className="flex-1 py-3 rounded-2xl bg-amal-grey text-foreground font-medium active:scale-95 transition-transform">
                متابعة التسوق
              </button>
              <button
                onClick={() => {
                  setCartOpen(false)
                  setModalOpen(true)
                }}
                className="flex-1 py-3 rounded-2xl bg-foreground text-background font-medium active:scale-95 transition-transform"
              >
                تأكيد الطلب
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <OrderTypeModal open={modalOpen} onSelect={handleSelect} onClose={() => setModalOpen(false)} />
    </>
  )
}
