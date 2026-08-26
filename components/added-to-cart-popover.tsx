"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Check, X } from "lucide-react"
import { useCart } from "@/components/cart-provider"
import { PriceWithRiyalLogo } from "@/components/ui/price-with-riyal-logo"

const AUTO_DISMISS_MS = 4500

interface AddedToCartPopoverProps {
  /** Called when the user taps "إتمام الطلب" (continue to checkout). */
  onCheckout: () => void
  className?: string
}

/**
 * Small animated popover anchored to the cart icon. Appears whenever an
 * item is added to the cart (via CartProvider's `lastAdded`), and asks the
 * user whether they'd like to continue to checkout or keep browsing.
 */
export function AddedToCartPopover({ onCheckout, className }: AddedToCartPopoverProps) {
  const { lastAdded } = useCart()
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!lastAdded) return

    setVisible(true)

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setVisible(false), AUTO_DISMISS_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [lastAdded])

  if (!lastAdded || !visible) return null

  const { item, quantity } = lastAdded

  return (
    <div
      role="status"
      aria-live="polite"
      className={
        "absolute end-4 top-full z-50 mt-2.5 w-[min(20rem,calc(100vw-2rem))] " +
        "origin-top-left animate-pop-in motion-reduce:animate-none " +
        (className ?? "")
      }
    >
      {/* pointer arrow toward the cart icon */}
      <div className="absolute -top-1.5 end-5 h-3 w-3 rotate-45 rounded-[2px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.08)]" />

      <div
        dir="rtl"
        className="relative overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_16px_40px_rgba(0,0,0,0.18)]"
      >
        <button
          onClick={() => setVisible(false)}
          aria-label="إغلاق"
          className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/5 text-foreground/60 transition-colors hover:bg-black/10 active:scale-90"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="flex items-center gap-2 px-4 pt-3.5">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500">
            <Check className="h-3 w-3 text-white" strokeWidth={3.5} />
          </span>
          <p className="text-[13px] font-bold text-foreground">أُضيف إلى السلة</p>
        </div>

        <div className="flex items-center gap-3 px-4 py-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100">
            {item.image && (
              <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />
            )}
          </div>
          <div className="min-w-0 flex-1 text-right">
            <p className="truncate text-[13px] font-semibold text-foreground">{item.name}</p>
            <p className="text-xs text-foreground/60">
              {quantity} × <PriceWithRiyalLogo value={item.price} />
            </p>
          </div>
        </div>

        <div className="flex gap-2 px-4 pb-4 pt-1">
          <button
            onClick={() => setVisible(false)}
            className="flex-1 rounded-full border border-black/10 py-2.5 text-[12.5px] font-semibold text-foreground/70 transition-colors active:scale-95 hover:bg-black/5"
          >
            متابعة التسوق
          </button>
          <button
            onClick={() => {
              setVisible(false)
              onCheckout()
            }}
            className="flex-1 rounded-full bg-primary py-2.5 text-[12.5px] font-bold text-primary-foreground transition-transform active:scale-95 hover:opacity-90"
          >
            إتمام الطلب
          </button>
        </div>
      </div>
    </div>
  )
}
