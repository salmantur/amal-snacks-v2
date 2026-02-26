"use client"

import { Minus, Plus, X, Check, Search } from "lucide-react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useCart, type MenuItem } from "@/components/cart-provider"
import { cn } from "@/lib/utils"

interface ProductDrawerProps {
  product: MenuItem | null
  open: boolean
  onClose: () => void
}

const TRAY_ITEMS = [
  "كبه", "سبرنق رول", "سمبوسة بطاطس", "معجنات جبن",
  "ميني ساندوتش حلومي", "ميني شاورما", "ورق عنب", "مطبق مغلف",
  "معجنات زعتر", "ميني ساندوتش لبنه", "مسخن", "ميني برجر",
  "ميني تورتلا", "معجنات بيتزا", "ميني ساندوتش ديك رومي",
  "بف لحم", "بف دجاج", "سمبوسة جبن", "معجنات لبنه",
  "ميني ساندوتش فلافل",
]

const TRAY_REQUIRED = 7

export function ProductDrawer({ product, open, onClose }: ProductDrawerProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([])
  const [traySelections, setTraySelections] = useState<string[]>([])
  const [traySearch, setTraySearch] = useState("")
  const { addItem } = useCart()

  const isTray = product?.category === "trays"

  useEffect(() => {
    if (open) {
      setQuantity(1)
      setSelectedIngredients([])
      setTraySelections([])
      setTraySearch("")
    }
  }, [open])

  if (!product) return null

  const isPlatters = product.category === "platters"
  const hasIngredients = isPlatters && product.ingredients && product.ingredients.length > 0
  const maxSelections = product.limit || 0

  const toggleIngredient = (ingredient: string) => {
    setSelectedIngredients((prev) => {
      if (prev.includes(ingredient)) return prev.filter((i) => i !== ingredient)
      if (maxSelections > 0 && prev.length >= maxSelections) return prev
      return [...prev, ingredient]
    })
  }

  const toggleTrayItem = (item: string) => {
    setTraySelections((prev) => {
      if (prev.includes(item)) return prev.filter((i) => i !== item)
      if (prev.length >= TRAY_REQUIRED) return prev
      return [...prev, item]
    })
  }

  const trayComplete = traySelections.length === TRAY_REQUIRED
  const remaining = TRAY_REQUIRED - traySelections.length
  const filteredTrayItems = TRAY_ITEMS.filter(i => !traySearch || i.includes(traySearch))

  const handleAddToCart = () => {
    const selections = isTray
      ? traySelections
      : selectedIngredients.length > 0 ? selectedIngredients : undefined
    addItem(product, quantity, selections)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg p-0 rounded-2xl overflow-hidden border-0 gap-0 max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="p-5 pb-3 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 text-right pr-3">
              <DialogTitle className="text-xl font-bold text-[#1e293b] leading-tight">
                {product.name}
              </DialogTitle>
              <DialogDescription className="text-gray-500 mt-1 text-sm">{product.description}</DialogDescription>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Image — smaller for trays to leave more room for selection */}
        {!isTray && (
          <div className="mx-5 mb-3 p-3 bg-[#f5f5f5] rounded-2xl flex-shrink-0">
            <div className="flex justify-center">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  width={160}
                  height={160}
                  className="object-cover rounded-xl"
                  crossOrigin="anonymous"
                  priority
                />
              ) : (
                <div className="w-40 h-40 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-sm">
                  لا توجد صورة
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-5" style={{ WebkitOverflowScrolling: "touch" }}>

          {/* ── TRAY SELECTION ── */}
          {isTray && (
            <div className="pb-4 pt-1">

              {/* Progress header */}
              <div className="flex items-center justify-between mb-3">
                <span className={cn(
                  "text-sm font-bold px-3 py-1.5 rounded-full",
                  trayComplete
                    ? "bg-[#1e5631]/10 text-[#1e5631]"
                    : "bg-orange-50 text-orange-600"
                )}>
                  {trayComplete ? "اكتملت الاختيارات ✓" : `باقي ${remaining} أصناف`}
                </span>
                <h3 className="font-bold text-[#1e293b]">
                  {traySelections.length} / {TRAY_REQUIRED}
                </h3>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 bg-gray-200 rounded-full mb-4">
                <div
                  className={cn(
                    "h-2.5 rounded-full transition-all duration-300",
                    trayComplete ? "bg-[#1e5631]" : "bg-orange-400"
                  )}
                  style={{ width: `${(traySelections.length / TRAY_REQUIRED) * 100}%` }}
                />
              </div>

              {/* Selected chips — tap to remove */}
              {traySelections.length > 0 && (
                <div className="mb-4 p-3 bg-[#1e5631]/5 border border-[#1e5631]/10 rounded-2xl">
                  <p className="text-xs text-[#1e5631] font-medium mb-2 text-right">اختياراتك — اضغط لإزالة</p>
                  <div className="flex flex-wrap gap-1.5">
                    {traySelections.map((item) => (
                      <button
                        key={item}
                        onClick={() => toggleTrayItem(item)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-[#1e5631] text-white rounded-full text-xs font-medium active:scale-95 transition-transform"
                      >
                        {item}
                        <X className="h-3 w-3 opacity-70" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={traySearch}
                  onChange={(e) => setTraySearch(e.target.value)}
                  placeholder="ابحث عن صنف..."
                  className="w-full pr-9 pl-4 py-2.5 rounded-xl bg-gray-100 text-sm focus:outline-none text-right"
                />
              </div>

              {/* Items grid — larger tap targets */}
              <div className="grid grid-cols-2 gap-2">
                {filteredTrayItems.map((item) => {
                  const isSelected = traySelections.includes(item)
                  const isDisabled = !isSelected && trayComplete
                  return (
                    <button
                      key={item}
                      onClick={() => toggleTrayItem(item)}
                      disabled={isDisabled}
                      className={cn(
                        "flex items-center justify-between px-3.5 py-3.5 rounded-xl border-2 transition-all text-sm text-right active:scale-95",
                        isSelected
                          ? "border-[#1e5631] bg-[#1e5631]/10 text-[#1e5631] font-medium"
                          : "border-gray-200 bg-white text-[#1e293b]",
                        isDisabled && "opacity-35 cursor-not-allowed"
                      )}
                    >
                      <span className="flex-1 leading-snug">{item}</span>
                      {isSelected && <Check className="h-4 w-4 flex-shrink-0 ml-1" />}
                    </button>
                  )
                })}
                {filteredTrayItems.length === 0 && (
                  <div className="col-span-2 text-center py-6 text-gray-400 text-sm">
                    لا توجد نتائج
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── PLATTERS CUSTOMIZATION ── */}
          {hasIngredients && (
            <div className="pb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">
                  {maxSelections > 0 && `(${selectedIngredients.length}/${maxSelections})`}
                </span>
                <h3 className="font-bold text-[#1e293b]">تخصيص الطلب</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {product.ingredients?.map((ingredient) => {
                  const isSelected = selectedIngredients.includes(ingredient)
                  const isDisabled = !isSelected && maxSelections > 0 && selectedIngredients.length >= maxSelections
                  return (
                    <button
                      key={ingredient}
                      onClick={() => toggleIngredient(ingredient)}
                      disabled={isDisabled}
                      className={cn(
                        "flex items-center justify-between p-3.5 rounded-xl border-2 transition-all text-sm active:scale-95",
                        isSelected
                          ? "border-[#1e5631] bg-[#1e5631]/10 text-[#1e5631]"
                          : "border-gray-200 bg-white text-[#1e293b]",
                        isDisabled && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {isSelected && <Check className="h-4 w-4 flex-shrink-0" />}
                      <span className="flex-1 text-right">{ingredient}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Ingredients list for non-customizable */}
          {!isTray && !hasIngredients && product.ingredients && product.ingredients.length > 0 && (
            <p className="text-gray-600 text-sm mb-4 text-right leading-relaxed">
              {product.ingredients.join("، ")}
            </p>
          )}
        </div>

        {/* Fixed bottom */}
        <div className="px-5 pb-6 pt-3 border-t border-gray-100 flex-shrink-0" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-xl font-bold w-8 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <span className="text-xl font-bold text-[#1e293b]">{product.price * quantity} ر.س</span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isTray && !trayComplete}
            className={cn(
              "w-full py-4 rounded-full text-lg font-medium transition-all active:scale-[0.98]",
              isTray && !trayComplete
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-[#1e5631] text-white hover:bg-[#174425]"
            )}
          >
            {isTray && !trayComplete
              ? `اختر ${remaining} ${remaining === 1 ? "صنف آخر" : "أصناف أخرى"}`
              : "اطلب الآن"}
          </button>
        </div>

      </DialogContent>
    </Dialog>
  )
}