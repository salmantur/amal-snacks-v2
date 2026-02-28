"use client"

import { useRouter } from "next/navigation"
import { ShoppingBag, ChevronLeft, X } from "lucide-react"
import { useState } from "react"
import { useCart } from "@/components/cart-provider"
import { OrderTypeModal } from "@/components/order-type-modal"

export function CartBar() {
  const { items, totalItems, totalPrice, removeItem } = useCart()
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
      {/* Sticky cart bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-8 z-40">
        <div className="bg-foreground rounded-full px-4 py-3 flex items-center justify-between text-background shadow-xl">
          {/* Confirm button */}
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-background text-foreground rounded-full px-4 py-2 font-medium hover:bg-background/90 transition-colors active:scale-95"
          >
            <span>تأكيد</span>
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Cart summary — tap to open item list */}
          <button
            onClick={() => setCartOpen(true)}
            className="flex items-center gap-3 text-left active:opacity-70 transition-opacity"
          >
            <div>
              <p className="text-xs text-background/70">سلتك</p>
              <p className="font-bold">{totalItems} عنصر · {totalPrice} ر.س</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-primary-foreground" />
            </div>
          </button>
        </div>
      </div>

      {/* Cart item drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50" onClick={() => setCartOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl p-5 max-h-[70vh] flex flex-col"
            style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-4" />

            <div className="flex items-center justify-between mb-4" dir="rtl">
              <h2 className="text-lg font-bold">سلتك</h2>
              <span className="text-sm text-muted-foreground">{totalItems} عنصر · {totalPrice} ر.س</span>
            </div>

            {/* Items */}
            <div className="overflow-y-auto flex-1 space-y-2 pb-2" dir="rtl">
              {items.map(item => (
                <div key={item.cartKey} className="flex items-center gap-3 p-3 bg-amal-grey rounded-2xl">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    {item.selectedIngredients?.length ? (
                      <p className="text-xs text-muted-foreground truncate">{item.selectedIngredients.join("، ")}</p>
                    ) : null}
                    <p className="text-sm font-bold text-primary mt-0.5">{item.price * item.quantity} ر.س</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-medium bg-background px-2 py-0.5 rounded-full">×{item.quantity}</span>
                    <button
                      onClick={() => removeItem(item.cartKey)}
                      className="w-9 h-9 rounded-full bg-red-100 text-red-500 flex items-center justify-center active:scale-95 transition-transform"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setCartOpen(false)}
                className="flex-1 py-3 rounded-2xl bg-amal-grey text-foreground font-medium active:scale-95 transition-transform"
              >
                متابعة التسوق
              </button>
              <button
                onClick={() => { setCartOpen(false); setModalOpen(true) }}
                className="flex-1 py-3 rounded-2xl bg-foreground text-background font-medium active:scale-95 transition-transform"
              >
                تأكيد الطلب
              </button>
            </div>
          </div>
        </div>
      )}

      <OrderTypeModal
        open={modalOpen}
        onSelect={handleSelect}
        onClose={() => setModalOpen(false)}
      />
    </>
  )
}