"use client"

import { Minus, Plus, X, Check, ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useCart, type MenuItem } from "@/components/cart-provider"
import { cn } from "@/lib/utils"
import { getEidRequiredHeaters } from "@/lib/eid-packages"
import { PriceWithRiyalLogo } from "@/components/ui/price-with-riyal-logo"
import { trackStorefrontEvent } from "@/lib/storefront-events"
import { parseVariantOption, getMenuStorageBase, normalizeMenuImageSrc, TRAY_ITEMS, TRAY_REQUIRED } from "@/lib/tray-configurator"

interface ProductDrawerProps {
  product: MenuItem | null
  open: boolean
  onClose: () => void
}

function getPreviousIndex(current: number, total: number): number {
  return (current - 1 + total) % total
}

function getNextIndex(current: number, total: number): number {
  return (current + 1) % total
}

const EID_HEATER_ITEMS = [
  "كروسون محشي بالبيض والمشروم والاجبان",
  "حمسة حلومي بالزيتون",
  "شعيرية / بلاليط",
  "بلاتر فلافل",
  "حمسة باذنجان",
  "فلافل سبشيل",
  "بيض تركي",
  "شكشوكة",
  "فاصوليا",
  "فول",
]

export function ProductDrawer({ product, open, onClose }: ProductDrawerProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([])
  const [traySelections, setTraySelections] = useState<string[]>([])
  const [imgIndex, setImgIndex] = useState(0)
  const [isAddedFeedback, setIsAddedFeedback] = useState(false)
  const { addItem } = useCart()

  const isTray = product?.category === "trays"
  const isEidPackage = product?.category === "eid"
  const hasIngredients = (product?.ingredients?.length || 0) > 0
  const maxSelections = product?.limit || 0

  useEffect(() => {
    if (!open) return
    setQuantity(1)
    setSelectedIngredients([])
    setTraySelections([])
    setImgIndex(0)
    setIsAddedFeedback(false)
  }, [open])

  useEffect(() => {
    if (!open || !product) return
    if (isTray || isEidPackage) return
    if (!hasIngredients || maxSelections !== 1 || !product.ingredients?.length) return
    setSelectedIngredients([product.ingredients[0]])
  }, [open, product, isTray, isEidPackage, hasIngredients, maxSelections])

  useEffect(() => {
    if (!open || !product) return

    trackStorefrontEvent("product_drawer_opened", {
      productId: product.id,
      category: product.category,
      hasOptions: (product.ingredients?.length || 0) > 0,
      inStock: product.inStock !== false,
    })
  }, [open, product])

  if (!product) return null

  const toggleIngredient = (ingredient: string) => {
    setSelectedIngredients((prev) => {
      if (prev.includes(ingredient)) return prev.filter((i) => i !== ingredient)
      if (maxSelections > 0 && prev.length >= maxSelections) return prev
      return [...prev, ingredient]
    })
  }

  const eidRequired = getEidRequiredHeaters(product)

  const toggleTrayItem = (item: { ar: string; en: string }) => {
    const key = `${item.ar}||${item.en}`
    setTraySelections((prev) => {
      if (prev.includes(key)) return prev.filter((i) => i !== key)
      const maxAllowed = isEidPackage ? eidRequired : TRAY_REQUIRED
      if (prev.length >= maxAllowed) return prev
      return [...prev, key]
    })
  }

  const trayComplete = traySelections.length === TRAY_REQUIRED
  const eidComplete = traySelections.length === eidRequired

  const handleAddToCart = () => {
    const selections =
      isEidPackage || isTray
        ? traySelections
        : selectedIngredients.length > 0
        ? selectedIngredients
        : undefined

    const displaySelections =
      isTray || isEidPackage
        ? selections
        : selections?.map((raw) => parseVariantOption(raw, product.price).label).filter(Boolean)
    const selectedVariantPrice =
      !isTray && !isEidPackage && maxSelections === 1 && selectedIngredients.length === 1
        ? parseVariantOption(selectedIngredients[0], product.price).price
        : product.price

    addItem({ ...product, price: selectedVariantPrice }, quantity, displaySelections)
    trackStorefrontEvent("product_added_to_cart", {
      productId: product.id,
      category: product.category,
      quantity,
      selectionsCount: displaySelections?.length ?? 0,
      totalPrice: selectedVariantPrice * quantity,
    })
    setIsAddedFeedback(true)
    setTimeout(() => onClose(), 550)
  }

  const selectedVariantPrice =
    !isTray && !isEidPackage && maxSelections === 1 && selectedIngredients.length === 1
      ? parseVariantOption(selectedIngredients[0], product.price).price
      : product.price
  const menuStorageBase = getMenuStorageBase(product.image || "")
  const allImages = Array.from(
    new Set(
      [product.image, ...(product.images || [])]
        .map((img) => normalizeMenuImageSrc(String(img || ""), menuStorageBase))
        .filter((img): img is string => Boolean(img))
    )
  )

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg p-0 rounded-2xl overflow-hidden border-0 gap-0 max-h-[90vh] flex flex-col">
        <div className="p-6 pb-4 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 text-right pr-4">
              <DialogTitle className="text-2xl font-bold text-[#1e293b]">{product.name}</DialogTitle>
              <DialogDescription className="text-gray-500 mt-1">{product.description}</DialogDescription>
            </div>
            <button type="button" onClick={onClose} className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0 touch-manipulation" aria-label="إغلاق">
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6">
          {(() => {
            const current = allImages[imgIndex] || null
            return (
              <div className="-mx-6 mb-4 rounded-none overflow-hidden bg-[#f5f5f5] relative">
                {current ? (
                  <div className="relative w-full aspect-square">
                    <Image src={current} alt={product.name} fill sizes="(max-width: 768px) 96vw, 560px" quality={76} className="object-cover" priority loading="eager" />
                  </div>
                ) : (
                  <div className="w-full aspect-square flex items-center justify-center text-gray-400">لا توجد صورة</div>
                )}
                {allImages.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setImgIndex((i) => getPreviousIndex(i, allImages.length))}
                      className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-transform active:scale-95 touch-manipulation"
                      aria-label="الصورة السابقة"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setImgIndex((i) => getNextIndex(i, allImages.length))}
                      className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-transform active:scale-95 touch-manipulation"
                      aria-label="الصورة التالية"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/35 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                      {imgIndex + 1} / {allImages.length}
                    </div>
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                      {allImages.map((imgUrl, i) => (
                        <button
                          type="button"
                          key={imgUrl || i}
                          onClick={() => setImgIndex(i)}
                          className="rounded-full transition-all touch-manipulation"
                          aria-label={`عرض الصورة ${i + 1}`}
                          style={{ width: i === imgIndex ? 16 : 8, height: 8, background: i === imgIndex ? "white" : "rgba(255,255,255,0.5)" }}
                        />
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            )
          })()}

          {isTray ? (
            <div className="pb-4">
              <div className="flex items-center justify-between mb-3">
                <span className={cn("text-sm font-medium px-3 py-1 rounded-full", trayComplete ? "bg-[#1e5631]/10 text-[var(--checkout-green)]" : "bg-amal-yellow/20 text-foreground")} aria-live="polite">
                  {traySelections.length} / {TRAY_REQUIRED}
                </span>
                <h3 className="font-bold text-[#1e293b]">اختر {TRAY_REQUIRED} أصناف</h3>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full mb-4">
                <div className={cn("h-2 rounded-full transition-all duration-300", trayComplete ? "bg-[var(--checkout-green)]" : "bg-amal-yellow")} style={{ width: `${(traySelections.length / TRAY_REQUIRED) * 100}%` }} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {TRAY_ITEMS.map((item) => {
                  const key = `${item.ar}||${item.en}`
                  const isSelected = traySelections.includes(key)
                  const isDisabled = !isSelected && traySelections.length >= TRAY_REQUIRED
                  return (
                    <button type="button" key={key} onClick={() => toggleTrayItem(item)} disabled={isDisabled} aria-pressed={isSelected} className={cn("flex items-center justify-between p-4 min-h-14 rounded-xl border-2 transition-all text-base text-right touch-manipulation", isSelected ? "border-[var(--checkout-green)] bg-[#1e5631]/10 text-[var(--checkout-green)]" : "border-gray-200 bg-white text-[#1e293b]", isDisabled && "opacity-40 cursor-not-allowed")}>
                      <span className="flex-1">{item.ar}</span>
                      {isSelected ? <Check className="h-4 w-4 flex-shrink-0 mr-1" /> : null}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          {isEidPackage ? (
            <div className="pb-4">
              <div className="flex items-center justify-between mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-2xl">
                <span className="text-xs bg-yellow-400 text-yellow-900 font-bold px-2 py-0.5 rounded-full">مشمول 🎁</span>
                <span className="font-semibold text-sm text-right">بلاتر الأجبان</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className={cn("text-sm font-medium px-3 py-1 rounded-full", eidComplete ? "bg-[#1e5631]/10 text-[var(--checkout-green)]" : "bg-amal-yellow/20 text-foreground")} aria-live="polite">
                  {traySelections.length} / {eidRequired}
                </span>
                <h3 className="font-bold text-[#1e293b]">اختر {eidRequired} سخانات</h3>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full mb-4">
                <div className={cn("h-2 rounded-full transition-all duration-300", eidComplete ? "bg-[var(--checkout-green)]" : "bg-amal-yellow")} style={{ width: `${(traySelections.length / eidRequired) * 100}%` }} />
              </div>
              <div className="grid grid-cols-1 gap-2">
                {EID_HEATER_ITEMS.map((item) => {
                  const key = `${item}||${item}`
                  const isSelected = traySelections.includes(key)
                  const isDisabled = !isSelected && traySelections.length >= eidRequired
                  return (
                    <button type="button" key={item} onClick={() => toggleTrayItem({ ar: item, en: item })} disabled={isDisabled} aria-pressed={isSelected} className={cn("flex items-center justify-between p-4 min-h-14 rounded-xl border-2 transition-all text-base text-right touch-manipulation", isSelected ? "border-[var(--checkout-green)] bg-[#1e5631]/10 text-[var(--checkout-green)]" : "border-gray-200 bg-white text-[#1e293b]", isDisabled && "opacity-40 cursor-not-allowed")}>
                      <span className="flex-1">{item}</span>
                      {isSelected ? <Check className="h-4 w-4 flex-shrink-0 mr-1" /> : null}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          {hasIngredients ? (
            <div className="pb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">{maxSelections > 0 ? `(${selectedIngredients.length}/${maxSelections})` : ""}</span>
                <h3 className="font-bold text-[#1e293b]">تخصيص الطلب</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {product.ingredients?.map((ingredient) => {
                  const isSelected = selectedIngredients.includes(ingredient)
                  const isDisabled = !isSelected && maxSelections > 0 && selectedIngredients.length >= maxSelections
                  const parsed = parseVariantOption(ingredient, product.price)
                  return (
                    <button type="button" key={ingredient} onClick={() => toggleIngredient(ingredient)} disabled={isDisabled} aria-pressed={isSelected} className={cn("flex items-center justify-between p-4 min-h-14 rounded-xl border-2 transition-all text-base touch-manipulation", isSelected ? "border-[var(--checkout-green)] bg-[#1e5631]/10 text-[var(--checkout-green)]" : "border-gray-200 bg-white text-[#1e293b]", isDisabled && "opacity-50 cursor-not-allowed")}>
                      {isSelected ? <Check className="h-4 w-4 flex-shrink-0" /> : null}
                      <div className="flex-1 text-right">
                        <div>{parsed.label}</div>
                        {ingredient.includes("::") ? (
                          <div className="text-xs text-gray-500 mt-0.5">
                            <PriceWithRiyalLogo value={parsed.price} />
                          </div>
                        ) : null}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>

        <div className="px-6 pb-6 pt-3 border-t border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between gap-3 mb-4 max-[380px]:flex-col max-[380px]:items-stretch">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors touch-manipulation" aria-label="تقليل الكمية">
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-xl font-bold w-8 text-center" aria-live="polite">{quantity}</span>
              <button type="button" onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors touch-manipulation" aria-label="زيادة الكمية">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <span className="text-xl font-bold text-[#1e293b]">
              <PriceWithRiyalLogo value={selectedVariantPrice * quantity} />
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={(isTray && !trayComplete) || (isEidPackage && !eidComplete) || product.inStock === false || isAddedFeedback}
            className={cn(
              "w-full py-4 rounded-full text-lg font-medium transition-all duration-300",
              product.inStock === false
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : (isTray && !trayComplete) || (isEidPackage && !eidComplete)
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : isAddedFeedback
                ? "bg-[var(--checkout-green)] text-white scale-[1.02]"
                : "bg-[var(--checkout-green)] text-white hover:bg-[#174425]"
            )}
          >
            {isAddedFeedback
              ? "تمت الإضافة ✓"
              : product.inStock === false
              ? "نفذت الكمية"
              : isTray && !trayComplete
              ? `اختر ${TRAY_REQUIRED - traySelections.length} أصناف أخرى`
              : isEidPackage && !eidComplete
              ? `اختر ${eidRequired - traySelections.length} سخانات`
              : "اطلب الآن"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
