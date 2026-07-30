"use client"

import Image from "next/image"
import { ShoppingBag, X, ChevronLeft, Plus } from "lucide-react"
import { useEffect, useMemo, useRef } from "react"
import { useCart } from "@/components/cart-provider"
import type { MenuItem } from "@/components/cart-provider"
import { useMenu } from "@/hooks/use-menu"
import { PriceWithRiyalLogo } from "@/components/ui/price-with-riyal-logo"
import { trapFocusOnTab } from "@/lib/dialog-focus"

function needsConfiguration(item: MenuItem): boolean {
  return item.category === "trays" || item.category === "eid" || (item.ingredients?.length ?? 0) > 0
}

interface CartSheetProps {
  open: boolean
  onClose: () => void
  onCheckout: () => void
  /** DOM id for the sheet, so each trigger button can point aria-controls at it. */
  id?: string
}

/**
 * Shared cart drawer. Both the sticky header's cart button and the floating
 * cart bar open this same component so the cart UI is identical no matter
 * where it's triggered from.
 */
export function CartSheet({ open, onClose, onCheckout, id = "cart-sheet-dialog" }: CartSheetProps) {
  const { items, totalItems, totalPrice, removeItem, updateQuantity, addItem } = useCart()
  const { menuItems } = useMenu()
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  const recommendations = useMemo(
    () => menuItems.filter((item) => item.isFeatured && !needsConfiguration(item)).slice(0, 4),
    [menuItems],
  )

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    const previousTouchAction = document.body.style.touchAction
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null

    document.body.style.overflow = "hidden"
    document.body.style.touchAction = "none"

    const focusTimeout = window.setTimeout(() => {
      closeButtonRef.current?.focus()
    }, 0)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.clearTimeout(focusTimeout)
      window.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = previousOverflow
      document.body.style.touchAction = previousTouchAction
      returnFocusRef.current?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        id={id}
        ref={dialogRef}
        className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl flex flex-col"
        style={{ maxHeight: "min(88dvh, 48rem)", paddingBottom: "env(safe-area-inset-bottom)" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        tabIndex={-1}
        onKeyDown={(event) => trapFocusOnTab(event, dialogRef.current)}
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-b border-border/50 flex-shrink-0" dir="rtl">
          <h2 id={`${id}-title`} className="text-lg font-bold">
            سلتك 🛍️
          </h2>
          <div className="flex items-center gap-3">
            {totalItems > 0 && (
              <span className="text-sm text-muted-foreground">
                {totalItems} عنصر · <PriceWithRiyalLogo value={totalPrice} />
              </span>
            )}
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center active:scale-95"
              aria-label="إغلاق السلة"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2.5" dir="rtl">
          {items.length === 0 ? (
            <div className="py-6 text-center">
              <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-10" />
              <p className="font-medium text-muted-foreground">سلتك فارغة</p>

              {recommendations.length > 0 ? (
                <div className="mt-6 text-right">
                  <p className="mb-3 px-1 text-sm font-bold">الأكثر طلبًا</p>
                  <div className="space-y-2.5">
                    {recommendations.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-2.5 bg-[#f8f8f8] rounded-2xl">
                        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-black/5">
                          {item.image ? (
                            <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />
                          ) : null}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{item.name}</p>
                          <p className="text-sm font-bold text-primary mt-0.5">
                            <PriceWithRiyalLogo value={item.price} />
                          </p>
                        </div>
                        <button
                          onClick={() => addItem(item, 1)}
                          className="h-10 w-10 rounded-full bg-foreground text-background flex items-center justify-center active:scale-95 flex-shrink-0"
                          aria-label={`أضف ${item.name}`}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs mt-1 opacity-60">أضف أصناف من القائمة</p>
              )}
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
                    onClick={() =>
                      item.quantity === 1 ? removeItem(item.cartKey) : updateQuantity(item.cartKey, item.quantity - 1)
                    }
                    className="h-10 w-10 rounded-full bg-white border border-gray-200 flex items-center justify-center active:scale-95 text-base font-bold"
                    aria-label={item.quantity === 1 ? "حذف العنصر" : "تقليل الكمية"}
                  >
                    {item.quantity === 1 ? <X className="h-3 w-3 text-red-400" /> : "-"}
                  </button>
                  <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                    className="h-10 w-10 rounded-full bg-foreground text-background flex items-center justify-center active:scale-95 text-base font-bold"
                    aria-label="زيادة الكمية"
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
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={onClose}
                className="py-3.5 px-5 rounded-2xl bg-[#f5f5f5] text-foreground font-medium active:scale-95 transition-transform text-sm"
              >
                تسوق أكثر
              </button>
              <button
                onClick={onCheckout}
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
  )
}
