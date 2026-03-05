"use client"

import { Minus, Plus, X, Check, ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useCart, type MenuItem } from "@/components/cart-provider"
import { cn } from "@/lib/utils"
import { getEidRequiredHeaters } from "@/lib/eid-packages"

interface ProductDrawerProps {
  product: MenuItem | null
  open: boolean
  onClose: () => void
}

const TRAY_ITEMS: { ar: string; en: string }[] = [
  { ar: "كبه", en: "Kibbeh" },
  { ar: "سبرنق رول", en: "Spring Roll" },
  { ar: "سمبوسة بطاطس", en: "Potato Samosa" },
  { ar: "معجنات جبن", en: "Cheese Pastry" },
  { ar: "ميني ساندوتش حلومي", en: "Mini Halloumi Sandwich" },
  { ar: "ميني شاورما", en: "Mini Shawarma" },
  { ar: "ورق عنب", en: "Grape Leaves" },
  { ar: "مطبق مغلف", en: "Wrapped Matazeez" },
  { ar: "معجنات زعتر", en: "Zaatar Pastry" },
  { ar: "ميني ساندوتش لبنه", en: "Mini Labneh Sandwich" },
  { ar: "مسخن", en: "Musakhan" },
  { ar: "ميني برجر", en: "Mini Burger" },
  { ar: "ميني تورتيلا", en: "Mini Tortilla" },
  { ar: "معجنات بيتزا", en: "Pizza Pastry" },
  { ar: "ميني ساندوتش ديك رومي", en: "Mini Turkey Sandwich" },
  { ar: "بف لحم", en: "Beef Puff" },
  { ar: "بف دجاج", en: "Chicken Puff" },
  { ar: "سمبوسة جبن", en: "Cheese Samosa" },
  { ar: "معجنات لبنه", en: "Labneh Pastry" },
  { ar: "ميني ساندوتش فلافل", en: "Mini Falafel Sandwich" },
]

const TRAY_REQUIRED = 7

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
    const selections = (isTray || isEidPackage)
      ? traySelections
      : selectedIngredients.length > 0
      ? selectedIngredients
      : undefined

    addItem(product, quantity, selections)
    setIsAddedFeedback(true)
    setTimeout(() => onClose(), 550)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg p-0 rounded-2xl overflow-hidden border-0 gap-0 max-h-[90vh] flex flex-col">
        <div className="p-6 pb-4 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 text-right pr-4">
              <DialogTitle className="text-2xl font-bold text-[#1e293b]">{product.name}</DialogTitle>
              <DialogDescription className="text-gray-500 mt-1">{product.description}</DialogDescription>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0" aria-label="إغلاق">
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6">
          {(() => {
            const allImgs = [product.image, ...(product.images || [])].filter(Boolean) as string[]
            const current = allImgs[imgIndex] || null
            return (
              <div className="-mx-6 mb-4 rounded-none overflow-hidden bg-[#f5f5f5] relative">
                {current ? (
                  <div className="relative w-full aspect-square">
                    <Image src={current} alt={product.name} fill className="object-cover" unoptimized />
                  </div>
                ) : (
                  <div className="w-full aspect-square flex items-center justify-center text-gray-400">لا توجد صورة</div>
                )}
                {allImgs.length > 1 ? (
                  <>
                    <button onClick={() => setImgIndex((i) => (i + 1) % allImgs.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center backdrop-blur-sm active:scale-95">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button onClick={() => setImgIndex((i) => (i - 1 + allImgs.length) % allImgs.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center backdrop-blur-sm active:scale-95">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                      {allImgs.map((imgUrl, i) => (
                        <button key={imgUrl || i} onClick={() => setImgIndex(i)} className="rounded-full transition-all" style={{ width: i === imgIndex ? 16 : 6, height: 6, background: i === imgIndex ? "white" : "rgba(255,255,255,0.5)" }} />
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
                <span className={cn("text-sm font-medium px-3 py-1 rounded-full", trayComplete ? "bg-[#1e5631]/10 text-[#1e5631]" : "bg-amal-yellow/20 text-foreground")}>
                  {traySelections.length} / {TRAY_REQUIRED}
                </span>
                <h3 className="font-bold text-[#1e293b]">اختر {TRAY_REQUIRED} أصناف</h3>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full mb-4">
                <div className={cn("h-2 rounded-full transition-all duration-300", trayComplete ? "bg-[#1e5631]" : "bg-amal-yellow")} style={{ width: `${(traySelections.length / TRAY_REQUIRED) * 100}%` }} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {TRAY_ITEMS.map((item) => {
                  const key = `${item.ar}||${item.en}`
                  const isSelected = traySelections.includes(key)
                  const isDisabled = !isSelected && traySelections.length >= TRAY_REQUIRED
                  return (
                    <button key={key} onClick={() => toggleTrayItem(item)} disabled={isDisabled} className={cn("flex items-center justify-between p-4 min-h-14 rounded-xl border-2 transition-all text-base text-right", isSelected ? "border-[#1e5631] bg-[#1e5631]/10 text-[#1e5631]" : "border-gray-200 bg-white text-[#1e293b]", isDisabled && "opacity-40 cursor-not-allowed")}>
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
                <span className="font-semibold text-sm text-right">بلاتر الاجبان</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className={cn("text-sm font-medium px-3 py-1 rounded-full", eidComplete ? "bg-[#1e5631]/10 text-[#1e5631]" : "bg-amal-yellow/20 text-foreground")}>
                  {traySelections.length} / {eidRequired}
                </span>
                <h3 className="font-bold text-[#1e293b]">اختر {eidRequired} سخانات</h3>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full mb-4">
                <div className={cn("h-2 rounded-full transition-all duration-300", eidComplete ? "bg-[#1e5631]" : "bg-amal-yellow")} style={{ width: `${(traySelections.length / eidRequired) * 100}%` }} />
              </div>
              <div className="grid grid-cols-1 gap-2">
                {EID_HEATER_ITEMS.map((item) => {
                  const key = `${item}||${item}`
                  const isSelected = traySelections.includes(key)
                  const isDisabled = !isSelected && traySelections.length >= eidRequired
                  return (
                    <button key={item} onClick={() => toggleTrayItem({ ar: item, en: item })} disabled={isDisabled} className={cn("flex items-center justify-between p-4 min-h-14 rounded-xl border-2 transition-all text-base text-right", isSelected ? "border-[#1e5631] bg-[#1e5631]/10 text-[#1e5631]" : "border-gray-200 bg-white text-[#1e293b]", isDisabled && "opacity-40 cursor-not-allowed")}>
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
                  return (
                    <button key={ingredient} onClick={() => toggleIngredient(ingredient)} disabled={isDisabled} className={cn("flex items-center justify-between p-4 min-h-14 rounded-xl border-2 transition-all text-base", isSelected ? "border-[#1e5631] bg-[#1e5631]/10 text-[#1e5631]" : "border-gray-200 bg-white text-[#1e293b]", isDisabled && "opacity-50 cursor-not-allowed")}>
                      {isSelected ? <Check className="h-4 w-4 flex-shrink-0" /> : null}
                      <span className="flex-1 text-right">{ingredient}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>

        <div className="px-6 pb-6 pt-3 border-t border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors" aria-label="تقليل الكمية">
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-xl font-bold w-8 text-center">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors" aria-label="زيادة الكمية">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <span className="text-xl font-bold text-[#1e293b]">{product.price * quantity} ر.س</span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={((isTray && !trayComplete) || (isEidPackage && !eidComplete)) || product.inStock === false || isAddedFeedback}
            className={cn(
              "w-full py-4 rounded-full text-lg font-medium transition-all duration-300",
              product.inStock === false
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : (isTray && !trayComplete) || (isEidPackage && !eidComplete)
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : isAddedFeedback
                ? "bg-[#1e5631] text-white scale-[1.02]"
                : "bg-[#1e5631] text-white hover:bg-[#174425]"
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
