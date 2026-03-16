"use client"

import { useRouter } from "next/navigation"
import { ShoppingBag, ChevronLeft, X } from "lucide-react"
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react"
import { useCart } from "@/components/cart-provider"
import { OrderTypeModal } from "@/components/order-type-modal"
import { PriceWithRiyalLogo } from "@/components/ui/price-with-riyal-logo"

function getFocusableElements(container: HTMLElement | null) {
  if (!container) return []

  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter(
    (element) =>
      !element.hasAttribute("disabled") &&
      element.getAttribute("aria-hidden") !== "true",
  )
}

function trapFocusOnTab(
  event: ReactKeyboardEvent<HTMLElement>,
  container: HTMLElement | null,
) {
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

export function CartBar() {
  const { items, totalItems, totalPrice, removeItem, updateQuantity } = useCart()
  const [modalOpen, setModalOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const cartTriggerRef = useRef<HTMLButtonElement | null>(null)
  const cartDialogRef = useRef<HTMLDivElement | null>(null)
  const cartCloseButtonRef = useRef<HTMLButtonElement | null>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const router = useRouter()

  const handleSelect = (type: "pickup" | "delivery") => {
    setModalOpen(false)
    router.push(`/checkout?type=${type}`)
  }

  useEffect(() => {
    if (!cartOpen) return

    const previousOverflow = document.body.style.overflow
    const previousTouchAction = document.body.style.touchAction
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : cartTriggerRef.current

    document.body.style.overflow = "hidden"
    document.body.style.touchAction = "none"

    const focusTimeout = window.setTimeout(() => {
      cartCloseButtonRef.current?.focus()
    }, 0)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCartOpen(false)
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.clearTimeout(focusTimeout)
      window.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = previousOverflow
      document.body.style.touchAction = previousTouchAction
      returnFocusRef.current?.focus()
    }
  }, [cartOpen])

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
            className="relative z-10 grid h-11 w-[104px] min-[390px]:w-[118px] shrink-0 grid-cols-[16px_1fr_16px] items-center rounded-full border border-white/60 bg-white/80 px-3 font-semibold text-foreground shadow-sm transition-colors active:scale-95 hover:bg-white/90"
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

      {cartOpen ? (
        <div className="fixed inset-0 z-50" onClick={() => setCartOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            id="cart-bar-dialog"
            ref={cartDialogRef}
            className="absolute bottom-0 left-0 right-0 flex max-h-[82dvh] flex-col rounded-t-3xl bg-background p-5"
            style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-bar-title"
            tabIndex={-1}
            onKeyDown={(event) => trapFocusOnTab(event, cartDialogRef.current)}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-200" />

            <div className="mb-4 flex items-center justify-between" dir="rtl">
              <button
                ref={cartCloseButtonRef}
                onClick={() => setCartOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-700 transition-transform active:scale-95"
                aria-label="إغلاق السلة"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="text-right">
                <h2 id="cart-bar-title" className="text-lg font-bold">
                  سلتك
                </h2>
                <span className="text-sm text-muted-foreground">
                  {totalItems} عنصر · <PriceWithRiyalLogo value={totalPrice} />
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto pb-2" dir="rtl">
              {items.map((item) => (
                <div
                  key={item.cartKey}
                  className="flex items-center gap-3 rounded-2xl bg-amal-grey p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    {item.selectedIngredients?.length ? (
                      <p className="truncate text-xs text-muted-foreground">
                        {item.selectedIngredients.join("، ")}
                      </p>
                    ) : null}
                    <p className="mt-0.5 text-sm font-bold text-primary">
                      <PriceWithRiyalLogo value={item.price * item.quantity} />
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() =>
                        item.quantity === 1
                          ? removeItem(item.cartKey)
                          : updateQuantity(item.cartKey, item.quantity - 1)
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-lg font-bold text-gray-700 transition-transform active:scale-95"
                      aria-label={
                        item.quantity === 1 ? "حذف العنصر" : "تقليل الكمية"
                      }
                    >
                      {item.quantity === 1 ? (
                        <X className="h-3.5 w-3.5 text-red-500" />
                      ) : (
                        "-"
                      )}
                    </button>
                    <span className="w-6 text-center text-sm font-bold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.cartKey, item.quantity + 1)
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-lg font-bold text-background transition-transform active:scale-95"
                      aria-label="زيادة الكمية"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-3 min-[400px]:flex-row">
              <button
                onClick={() => setCartOpen(false)}
                className="flex-1 rounded-2xl bg-amal-grey py-3 font-medium text-foreground transition-transform active:scale-95"
              >
                متابعة التسوق
              </button>
              <button
                onClick={() => {
                  setCartOpen(false)
                  setModalOpen(true)
                }}
                className="flex-1 rounded-2xl bg-foreground py-3 font-medium text-background transition-transform active:scale-95"
              >
                تأكيد الطلب
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <OrderTypeModal
        open={modalOpen}
        onSelect={handleSelect}
        onClose={() => setModalOpen(false)}
      />
    </>
  )
}
