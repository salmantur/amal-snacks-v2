"use client"

import { useRouter } from "next/navigation"
import { ShoppingBag, ChevronLeft } from "lucide-react"
import { useState } from "react"
import { useCart } from "@/components/cart-provider"
import { OrderTypeModal } from "@/components/order-type-modal"

export function CartBar() {
  const { totalItems, totalPrice } = useCart()
  const [modalOpen, setModalOpen] = useState(false)
  const router = useRouter()

  if (totalItems === 0) return null

  const handleSelect = (type: "pickup" | "delivery") => {
    setModalOpen(false)
    router.push(`/checkout?type=${type}`)
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-8 z-40">
        <div className="bg-foreground rounded-full px-4 py-3 flex items-center justify-between text-background shadow-xl">
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-background text-foreground rounded-full px-4 py-2 font-medium hover:bg-background/90 transition-colors"
          >
            <span>تأكيد</span>
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3 text-left">
            <div>
              <p className="text-xs text-background/70">سلتك</p>
              <p className="font-bold">
                {totalItems} عنصر · {totalPrice} ر.س
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
        </div>
      </div>

      <OrderTypeModal
        open={modalOpen}
        onSelect={handleSelect}
        onClose={() => setModalOpen(false)}
      />
    </>
  )
}