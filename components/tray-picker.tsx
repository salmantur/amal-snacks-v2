"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Minus, Plus, ShoppingBag } from "lucide-react"
import { useCart, type MenuItem } from "@/components/cart-provider"
import { cn } from "@/lib/utils"
import { PriceWithRiyalLogo } from "@/components/ui/price-with-riyal-logo"
import { trackStorefrontEvent } from "@/lib/storefront-events"
import {
  TRAY_ITEMS,
  TRAY_REQUIRED,
  parseVariantOption,
  getTraySizeChipLabel,
  getTraySizeOrder,
  getMenuStorageBase,
  normalizeMenuImageSrc,
  extractPieceCount,
} from "@/lib/tray-configurator"

// Previously a standalone warm/cream palette (#181a22/#c15b3f/#f7f2ea/...),
// independent of the site theme. Now driven by the same theme tokens as
// the rest of the storefront, so an admin's color choices in
// /admin/appearance actually reach this flow too.
const INK = "hsl(var(--foreground))"
const INK_CONTRAST = "hsl(var(--background))"
const ACCENT = "hsl(var(--accent))"
const ACCENT_TINT = "hsl(var(--accent) / 0.1)"
const CREAM = "hsl(var(--background))"
const CREAM_DEEP = "hsl(var(--muted))"
const MUTED = "hsl(var(--muted-foreground))"
const BORDER = "hsl(var(--border))"
const SURFACE = "hsl(var(--card))"

interface TrayPickerProps {
  item: MenuItem
  onBack: () => void
  onAdded?: () => void
}

function getPreviousIndex(current: number, total: number): number {
  return (current - 1 + total) % total
}

function getNextIndex(current: number, total: number): number {
  return (current + 1) % total
}

export function TrayPicker({ item, onBack, onAdded }: TrayPickerProps) {
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [sizeIndex, setSizeIndex] = useState(0)
  const [picked, setPicked] = useState<Record<number, boolean>>({})
  const [pickedOpen, setPickedOpen] = useState(false)
  const [imgIndex, setImgIndex] = useState(0)
  const [addedFeedback, setAddedFeedback] = useState(false)

  const sizeOptions = useMemo(
    () =>
      (item.ingredients || [])
        .map((raw) => ({ raw, parsed: parseVariantOption(raw, item.price) }))
        .sort((a, b) => getTraySizeOrder(a.parsed.label) - getTraySizeOrder(b.parsed.label)),
    [item.ingredients, item.price]
  )

  const menuStorageBase = getMenuStorageBase(item.image || "")
  const allImages = Array.from(
    new Set(
      [item.image, ...(item.images || [])]
        .map((img) => normalizeMenuImageSrc(String(img || ""), menuStorageBase))
        .filter((img): img is string => Boolean(img))
    )
  )

  const safeSizeIndex = Math.min(sizeIndex, Math.max(0, sizeOptions.length - 1))
  const selectedSize = sizeOptions[safeSizeIndex]
  const piecesTotal = selectedSize ? extractPieceCount(selectedSize.parsed.label) : ""
  const piecesPerItem = piecesTotal ? Math.round(Number(piecesTotal) / TRAY_REQUIRED) : null

  const pickedCount = Object.values(picked).filter(Boolean).length
  const full = pickedCount >= TRAY_REQUIRED
  const remaining = Math.max(0, TRAY_REQUIRED - pickedCount)
  const addDisabled = pickedCount !== TRAY_REQUIRED || item.inStock === false

  const pickedLabels = TRAY_ITEMS.filter((_, i) => picked[i]).map((snack) => snack.ar)

  function togglePick(index: number) {
    setPicked((prev) => {
      const isOn = !!prev[index]
      if (isOn) {
        const next = { ...prev }
        delete next[index]
        return next
      }
      if (Object.values(prev).filter(Boolean).length >= TRAY_REQUIRED) return prev
      return { ...prev, [index]: true }
    })
  }

  function handleAddToCart() {
    if (addDisabled || addedFeedback) return
    const pickedKeys = TRAY_ITEMS.filter((_, i) => picked[i]).map((snack) => `${snack.ar}||${snack.en}`)
    const selections = [selectedSize?.parsed.label ?? "", ...pickedKeys].filter(Boolean)
    addItem({ ...item, price: selectedSize?.parsed.price ?? item.price }, quantity, selections)
    trackStorefrontEvent("product_added_to_cart", {
      productId: item.id,
      category: item.category,
      quantity,
      selectionsCount: selections.length,
      totalPrice: (selectedSize?.parsed.price ?? item.price) * quantity,
    })
    setAddedFeedback(true)
    window.setTimeout(() => onAdded?.(), 550)
  }

  const currentImage = allImages[imgIndex] || null

  return (
    <div dir="rtl" className="flex h-full min-h-0 flex-col font-sans" style={{ backgroundColor: CREAM }}>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="relative h-[240px] w-full" style={{ background: `linear-gradient(150deg, ${CREAM_DEEP}, ${BORDER})` }}>
          {currentImage ? (
            <Image src={currentImage} alt={item.name} fill sizes="480px" quality={78} className="object-cover" priority />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <ShoppingBag className="h-10 w-10" />
            </div>
          )}

          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
            <button
              type="button"
              onClick={onBack}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-card/85 text-foreground shadow-sm backdrop-blur-sm"
              aria-label="رجوع"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {allImages.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => setImgIndex((i) => getPreviousIndex(i, allImages.length))}
                className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm"
                aria-label="الصورة السابقة"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setImgIndex((i) => getNextIndex(i, allImages.length))}
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm"
                aria-label="الصورة التالية"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="absolute bottom-4 right-4 flex gap-1.5">
                {allImages.map((img, i) => (
                  <span
                    key={img || i}
                    className="rounded-full transition-all"
                    style={{ width: i === imgIndex ? 18 : 5, height: 5, background: i === imgIndex ? "hsl(var(--foreground) / 0.7)" : "hsl(var(--foreground) / 0.28)" }}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>

        <div className="relative -mt-5 rounded-t-3xl px-5 pt-6" style={{ backgroundColor: CREAM }}>
          <div className="flex items-center justify-between gap-3">
            {item.isFeatured ? (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10.5px] font-extrabold tracking-wide"
                style={{ backgroundColor: ACCENT_TINT, color: ACCENT }}
              >
                الأكثر طلبًا
              </span>
            ) : (
              <span />
            )}
            {item.inStock === false ? (
              <span className="text-[11px] font-bold text-destructive">نفذت الكمية</span>
            ) : null}
          </div>

          <h1 className="mt-3 font-serif-text text-[28px] font-black leading-[1.15]" style={{ color: INK }}>
            {item.name}
          </h1>
          {item.description ? (
            <p className="mt-2.5 text-[13.5px] leading-[1.8]" style={{ color: MUTED }}>
              {item.description}
            </p>
          ) : null}
        </div>

        {sizeOptions.length > 0 ? (
          <div className="px-5 pt-5">
            <span className="text-xs font-extrabold" style={{ color: INK }}>
              حدد الحجم
            </span>
            <div className="mt-2.5 flex gap-2">
              {sizeOptions.map((option, index) => {
                const on = index === safeSizeIndex
                const pieces = extractPieceCount(option.parsed.label)
                return (
                  <button
                    key={option.raw}
                    type="button"
                    onClick={() => setSizeIndex(index)}
                    className={cn(
                      "flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-2.5 transition-colors"
                    )}
                    style={{
                      border: `1.5px solid ${on ? INK : BORDER}`,
                      backgroundColor: on ? INK : SURFACE,
                      color: on ? INK_CONTRAST : INK,
                    }}
                  >
                    <span className="text-[13px] font-extrabold">{getTraySizeChipLabel(option.parsed.label)}</span>
                    <span className="text-[10px] font-semibold opacity-70">{pieces ? `${pieces} قطعة` : option.parsed.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}

        <div className="px-5 pt-6">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[12px] font-extrabold" style={{ color: full ? "#2e6b46" : ACCENT }}>
              {full ? `تم اختيار ${TRAY_REQUIRED} من ${TRAY_REQUIRED}` : `باقي ${remaining} من ${TRAY_REQUIRED}`}
            </span>
            <h2 className="text-[15px] font-black" style={{ color: INK }}>
              اختر الأصناف
            </h2>
          </div>
          <div className="mt-2.5 h-1 overflow-hidden rounded-full" style={{ backgroundColor: CREAM_DEEP }}>
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{ width: `${(pickedCount / TRAY_REQUIRED) * 100}%`, backgroundColor: ACCENT }}
            />
          </div>

          <div className="mt-3.5 grid grid-cols-3 gap-2">
            {TRAY_ITEMS.map((snack, index) => {
              const isOn = !!picked[index]
              const locked = full && !isOn
              return (
                <button
                  key={snack.en}
                  type="button"
                  onClick={() => togglePick(index)}
                  disabled={locked}
                  aria-pressed={isOn}
                  className={cn("relative flex min-h-[54px] items-center rounded-2xl px-2.5 py-1.5 text-right transition-all", locked && "opacity-40")}
                  style={{
                    backgroundColor: SURFACE,
                    border: `1.5px solid ${isOn ? ACCENT : BORDER}`,
                    boxShadow: isOn ? "0 6px 14px -10px hsl(var(--accent) / 0.55)" : "0 4px 10px -10px hsl(var(--foreground) / 0.3)",
                  }}
                >
                  {isOn ? (
                    <span
                      className="absolute -left-1.5 -top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full text-[9px] text-white"
                      style={{ backgroundColor: ACCENT }}
                    >
                      ✓
                    </span>
                  ) : null}
                  <span className="line-clamp-2 w-full text-[11px] font-extrabold leading-tight" style={{ color: INK }}>
                    {snack.ar}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="px-5 pt-6">
          <div className="overflow-hidden rounded-2xl" style={{ backgroundColor: CREAM_DEEP }}>
            <button
              type="button"
              onClick={() => setPickedOpen((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3.5 text-right"
            >
              <span className="text-[12px] transition-transform" style={{ color: MUTED, transform: pickedOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                ﹀
              </span>
              <span className="text-[13.5px] font-extrabold" style={{ color: INK }}>
                الأصناف المختارة ({pickedCount})
              </span>
            </button>
            {pickedOpen ? (
              <p className="px-4 pb-4 text-right text-[12.5px] leading-[1.8]" style={{ color: MUTED }}>
                {pickedLabels.length > 0 ? pickedLabels.join("، ") : "لم تختر أي صنف بعد."}
              </p>
            ) : null}
          </div>

          {piecesTotal ? (
            <div className="mt-2.5 flex gap-2.5">
              <div className="flex-1 rounded-2xl p-3.5 text-right" style={{ backgroundColor: CREAM_DEEP }}>
                <span className="block text-[11px] font-bold" style={{ color: MUTED }}>
                  إجمالي القطع
                </span>
                <span className="mt-1 block text-[12.5px] font-extrabold" style={{ color: INK }}>
                  {piecesTotal} قطعة
                </span>
              </div>
              <div className="flex-1 rounded-2xl p-3.5 text-right" style={{ backgroundColor: CREAM_DEEP }}>
                <span className="block text-[11px] font-bold" style={{ color: MUTED }}>
                  لكل صنف
                </span>
                <span className="mt-1 block text-[12.5px] font-extrabold" style={{ color: INK }}>
                  {piecesPerItem ?? "-"} قطعة
                </span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="h-6" />
      </div>

      <div
        className="flex-shrink-0 px-5 pb-4 pt-3"
        style={{ backgroundColor: CREAM, borderTop: "1px solid hsl(var(--foreground) / 0.08)", boxShadow: "0 -10px 22px -18px hsl(var(--foreground) / 0.35)" }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 rounded-full border px-2 py-1.5" style={{ borderColor: BORDER }}>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full"
              aria-label="زيادة الكمية"
              style={{ color: ACCENT }}
            >
              <Plus className="h-4 w-4" />
            </button>
            <span className="min-w-5 text-center text-[15px] font-extrabold" style={{ color: INK }} aria-live="polite">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full"
              aria-label="تقليل الكمية"
              style={{ color: ACCENT }}
            >
              <Minus className="h-4 w-4" />
            </button>
          </div>

          <div className="min-w-0 flex-1 text-right">
            <span className="block text-[10.5px] font-bold" style={{ color: MUTED }}>
              {selectedSize ? getTraySizeChipLabel(selectedSize.parsed.label) : ""}
            </span>
            <span className="block font-serif-text text-[19px] font-black" style={{ color: INK }}>
              <PriceWithRiyalLogo value={(selectedSize?.parsed.price ?? item.price) * quantity} />
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={addDisabled || addedFeedback}
            className="h-[54px] flex-shrink-0 rounded-full px-6 text-[14px] font-black transition-all"
            style={{
              // The success green on "added to cart" is a fixed semantic
              // color (same reasoning as the WhatsApp-green/discount-green
              // elsewhere in the storefront) - it signals success, not brand
              // identity, so it doesn't follow the theme.
              backgroundColor: item.inStock === false || addDisabled ? BORDER : addedFeedback ? "#2e6b46" : INK,
              color: item.inStock === false || addDisabled ? MUTED : INK_CONTRAST,
              cursor: item.inStock === false || addDisabled ? "not-allowed" : "pointer",
            }}
          >
            {addedFeedback
              ? "تمت الإضافة ✓"
              : item.inStock === false
              ? "نفذت الكمية"
              : !full
              ? `اختر ${remaining} أصناف`
              : "أضف إلى السلة"}
          </button>
        </div>
      </div>
    </div>
  )
}
