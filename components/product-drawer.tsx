"use client"

import { Minus, Plus, X, Check, ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useCart, type MenuItem } from "@/components/cart-provider"
import { cn } from "@/lib/utils"
import { getEidRequiredHeaters } from "@/lib/eid-packages"
import { PriceWithRiyalLogo } from "@/components/ui/price-with-riyal-logo"
import { loadCachedTheme } from "@/hooks/use-theme-config"

interface ProductDrawerProps {
  product: MenuItem | null
  open: boolean
  onClose: () => void
}

type TrayDesign = "design_c" | "floating_3"

function parseVariantOption(raw: string, fallbackPrice: number): { label: string; price: number } {
  const value = (raw || "").trim()
  if (!value) return { label: "", price: fallbackPrice }
  const [labelPart, pricePart] = value.split("::")
  const label = (labelPart || value).trim()
  const parsedPrice = Number((pricePart || "").replace(/[^\d.]/g, ""))
  return {
    label,
    price: Number.isFinite(parsedPrice) && parsedPrice > 0 ? parsedPrice : fallbackPrice,
  }
}

function getTraySizeChipLabel(label: string): string {
  const normalized = label.trim().toLowerCase()
  if (normalized.startsWith("صغير") || normalized.startsWith("small") || normalized.startsWith("s ")) return "صغير"
  if (normalized.startsWith("وسط") || normalized.startsWith("medium") || normalized.startsWith("m ")) return "وسط"
  if (normalized.startsWith("كبير") || normalized.startsWith("large") || normalized.startsWith("l ")) return "كبير"
  return label.split(/[\s(]/)[0] || label
}

function getTraySizeOrder(label: string): number {
  const chip = getTraySizeChipLabel(label)
  if (chip === "صغير") return 0
  if (chip === "وسط") return 1
  if (chip === "كبير") return 2
  return 99
}

function getMenuStorageBase(image: string): string {
  const marker = "/storage/v1/object/public/Menu/"
  const idx = image.indexOf(marker)
  if (idx === -1) return ""
  return image.slice(0, idx + marker.length)
}

function normalizeMenuImageSrc(src: string, base: string): string | null {
  const value = (src || "").trim()
  if (!value) return null
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:") || value.startsWith("blob:")) {
    return value
  }
  if (value.startsWith("/")) return value
  return base ? `${base}${value}` : null
}

function extractPieceCount(label: string): string {
  const match = label.match(/(\d+)/)
  return match ? match[1] : ""
}

function getTrayDesignFromTheme(): TrayDesign {
  const cached = loadCachedTheme()
  return cached?.tray_variant_design === "floating_3" ? "floating_3" : "design_c"
}

const TRAY_ITEMS: { ar: string; en: string }[] = [
  { ar: "كبة", en: "Kibbeh" },
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
  const [trayDesign, setTrayDesign] = useState<TrayDesign>("design_c")
  const [trayStep, setTrayStep] = useState<1 | 2>(1)
  const { addItem } = useCart()

  const isTray = product?.category === "trays"
  const isEidPackage = product?.category === "eid"
  const hasIngredients = (product?.ingredients?.length || 0) > 0
  const maxSelections = product?.limit || 0
  const isTraySizeVariant = isTray && maxSelections === 1 && hasIngredients && (product?.ingredients || []).some((i) => i.includes("::"))

  useEffect(() => {
    if (!open) return
    setQuantity(1)
    setSelectedIngredients([])
    setTraySelections([])
    setImgIndex(0)
    setIsAddedFeedback(false)
    setTrayDesign(getTrayDesignFromTheme())
    setTrayStep(1)
  }, [open])

  useEffect(() => {
    if (!open || !product) return
    if ((isTray && !isTraySizeVariant) || isEidPackage) return
    if (!hasIngredients || maxSelections !== 1 || !product.ingredients?.length) return
    setSelectedIngredients([product.ingredients[0]])
  }, [open, product, isTray, isTraySizeVariant, isEidPackage, hasIngredients, maxSelections])

  if (!product) return null

  const toggleIngredient = (ingredient: string) => {
    if (isTraySizeVariant) {
      setSelectedIngredients([ingredient])
      return
    }

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
      isEidPackage || (isTray && !isTraySizeVariant)
        ? traySelections
        : isTraySizeVariant
        ? [
            selectedIngredients.length > 0 ? parseVariantOption(selectedIngredients[0], product.price).label : "",
            ...traySelections,
          ].filter(Boolean)
        : selectedIngredients.length > 0
        ? selectedIngredients
        : undefined

    const displaySelections =
      (isTray && !isTraySizeVariant) || isEidPackage
        ? selections
        : isTraySizeVariant
        ? selections
        : selections?.map((raw) => parseVariantOption(raw, product.price).label).filter(Boolean)
    const selectedVariantPrice =
      ((isTray && isTraySizeVariant) || (!isTray && !isEidPackage)) && maxSelections === 1 && selectedIngredients.length === 1
        ? parseVariantOption(selectedIngredients[0], product.price).price
        : product.price

    addItem({ ...product, price: selectedVariantPrice }, quantity, displaySelections)
    setIsAddedFeedback(true)
    setTimeout(() => onClose(), 550)
  }

  const selectedVariantPrice =
    ((isTray && isTraySizeVariant) || (!isTray && !isEidPackage)) && maxSelections === 1 && selectedIngredients.length === 1
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
  const selectedVariantLabel = selectedIngredients.length === 1 ? parseVariantOption(selectedIngredients[0], product.price).label : ""
  const trayVariantOptions = isTraySizeVariant
    ? (product.ingredients || [])
        .map((ingredient, index) => ({
          raw: ingredient,
          parsed: parseVariantOption(ingredient, product.price),
          image: allImages[index] || allImages[0] || "",
        }))
        .sort((a, b) => getTraySizeOrder(a.parsed.label) - getTraySizeOrder(b.parsed.label))
    : []
  const selectedTrayIndex = Math.max(
    0,
    trayVariantOptions.findIndex((opt) => selectedIngredients.includes(opt.raw))
  )
  const showTrayDesignStep = isTraySizeVariant && trayStep === 1
  const showTrayOptionsStep = isTraySizeVariant && trayStep === 2

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className={cn("max-w-lg p-0 rounded-2xl overflow-hidden border-0 gap-0 max-h-[90vh] flex flex-col", isTraySizeVariant && "bg-[#f7f3f3]")}>
        <div className={cn("p-6 pb-4 flex-shrink-0", isTraySizeVariant && "pb-2")}>
          <div className={cn("flex items-start", isTraySizeVariant ? "justify-between" : "justify-between")}>
            {!isTraySizeVariant ? (
              <div className="flex-1 text-right pr-4">
                <DialogTitle className="text-2xl font-bold text-[#1e293b]">{product.name}</DialogTitle>
                <DialogDescription className="text-gray-500 mt-1">{product.description}</DialogDescription>
              </div>
            ) : (
              <div className="flex-1 pt-1">
                <div className="h-1" />
              </div>
            )}
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0" aria-label="إغلاق">
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className={cn("overflow-y-auto flex-1 px-6", isTraySizeVariant && "pb-2")}>
          {(() => {
            if (showTrayDesignStep) {
              if (trayDesign === "floating_3") {
                return (
                  <div className="-mx-2 mb-4">
                    <div className="relative mx-auto mb-3 h-[238px] w-[238px] md:h-[258px] md:w-[258px]">
                      <div className="absolute inset-0 rounded-full bg-[linear-gradient(140deg,#f6e0e7_0%,#f8f3ea_100%)] shadow-[0_8px_20px_rgba(0,0,0,0.08)]" />
                      <div className="absolute inset-[7px] rounded-full overflow-hidden">
                        <div className="absolute inset-0">
                          {[-1, 0, 1].map((offset) => {
                            const optionCount = trayVariantOptions.length || 1
                            const idx = (selectedTrayIndex + offset + optionCount) % optionCount
                            const option = trayVariantOptions[idx]
                            if (!option?.image) return null
                            const isCenter = offset === 0

                            return (
                              <button
                                key={`${option.raw}-${offset}`}
                                onClick={() => toggleIngredient(option.raw)}
                                className={cn(
                                  "absolute inset-y-0 overflow-hidden transition-all",
                                  isCenter
                                    ? "left-1/2 -translate-x-1/2 w-[42%] z-20 shadow-[0_6px_12px_rgba(0,0,0,0.2)]"
                                    : "w-[36%] z-10 opacity-95",
                                  offset === -1 && "left-0",
                                  offset === 1 && "right-0"
                                )}
                                aria-label={option.parsed.label}
                              >
                                <Image
                                  src={option.image}
                                  alt={option.parsed.label}
                                  fill
                                  sizes="160px"
                                  quality={76}
                                  className="object-cover"
                                />
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <div className="-mx-2 mb-4">
                  <div className="rounded-[30px] md:rounded-[38px] border border-[#efced7] bg-[linear-gradient(130deg,#f6dfe5_0%,#f7f4e8_100%)] px-4 md:px-5 pt-5 md:pt-6 pb-5 shadow-[0_10px_24px_rgba(155,117,133,0.15)]">
                    <div className="relative mx-auto mb-5 h-[168px] md:h-[190px] max-w-[330px]">
                      <div className="absolute inset-x-1 top-2 bottom-0 rounded-full bg-white/88 shadow-[0_8px_20px_rgba(0,0,0,0.08)]" />
                      {[-1, 0, 1].map((offset) => {
                        const optionCount = trayVariantOptions.length || 1
                        const idx = (selectedTrayIndex + offset + optionCount) % optionCount
                        const option = trayVariantOptions[idx]
                        if (!option?.image) return null
                        const isCenter = offset === 0

                        return (
                          <button
                            key={`${option.raw}-${offset}`}
                            onClick={() => toggleIngredient(option.raw)}
                            className={cn(
                              "absolute top-6 overflow-hidden rounded-2xl border border-white/80 shadow-md transition-all",
                              isCenter ? "h-[132px] w-[126px] md:h-[146px] md:w-[140px] left-1/2 -translate-x-1/2 z-20" : "h-[108px] w-[84px] md:h-[122px] md:w-[94px] z-10 opacity-85",
                              offset === -1 && "left-1",
                              offset === 1 && "right-1"
                            )}
                            aria-label={option.parsed.label}
                          >
                            <Image src={option.image} alt={option.parsed.label} fill sizes="140px" quality={76} className="object-cover" />
                          </button>
                        )
                      })}
                    </div>

                    <div className="h-2" />
                  </div>
                </div>
              )
            }

            if (showTrayOptionsStep) {
              return (
                <div className="mb-4 rounded-2xl border border-[#e8e2e4] bg-white/90 px-4 py-3 text-right">
                  <p className="text-xs text-[#8f959f]">الحجم المختار</p>
                  <p className="text-lg font-bold text-[#1f2333]">{selectedVariantLabel || "لم يتم اختيار الحجم"}</p>
                </div>
              )
            }

            const current = allImages[imgIndex] || null
            return (
              <div className="-mx-6 mb-4 rounded-none overflow-hidden bg-[#f5f5f5] relative">
                {current ? (
                  <div className="relative w-full aspect-square">
                    <Image src={current} alt={product.name} fill sizes="(max-width: 768px) 96vw, 560px" quality={76} className="object-cover" />
                  </div>
                ) : (
                  <div className="w-full aspect-square flex items-center justify-center text-gray-400">لا توجد صورة</div>
                )}
                {allImages.length > 1 ? (
                  <>
                    <button onClick={() => setImgIndex((i) => (i + 1) % allImages.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center backdrop-blur-sm active:scale-95">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button onClick={() => setImgIndex((i) => (i - 1 + allImages.length) % allImages.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center backdrop-blur-sm active:scale-95">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                      {allImages.map((imgUrl, i) => (
                        <button key={imgUrl || i} onClick={() => setImgIndex(i)} className="rounded-full transition-all" style={{ width: i === imgIndex ? 16 : 6, height: 6, background: i === imgIndex ? "white" : "rgba(255,255,255,0.5)" }} />
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            )
          })()}

          {isTraySizeVariant ? (
            <div className="text-center pb-1" dir="rtl" />
          ) : null}

          {isTray && (!isTraySizeVariant || showTrayOptionsStep) ? (
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
                <span className="font-semibold text-sm text-right">بلاتر الأجبان</span>
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
            isTraySizeVariant ? (
              showTrayDesignStep ? (
              <div className="pb-4 px-1" dir="rtl">
                {trayDesign === "floating_3" ? (
                  <>
                    <div className="text-center mb-2">
                      <div className="text-[#4d4d57] mt-0">
                        <div
                          className="leading-none font-black inline-flex items-center justify-center text-[54px] md:text-[64px] rounded-full border border-[#e7d9dd] bg-[#fffdf8] px-5 py-1.5 shadow-[0_6px_16px_rgba(110,98,120,0.12)]"
                        >
                          <PriceWithRiyalLogo value={selectedVariantPrice * quantity} />
                        </div>
                        {selectedVariantLabel ? (
                          <p className="text-2xl md:text-3xl text-[#7d7d88] font-semibold mt-3">
                            {extractPieceCount(selectedVariantLabel)} قطعة
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex justify-center gap-6 mb-3">
                      {trayVariantOptions.map((option, idx) => {
                        const chip = getTraySizeChipLabel(option.parsed.label)
                        const isSelected = selectedIngredients.includes(option.raw)
                        const colors = ["#efc0cc", "#f2df8f", "#f6e8ed"]
                        return (
                          <button key={option.raw} onClick={() => toggleIngredient(option.raw)} className="flex flex-col items-center gap-1.5">
                            <span className="relative inline-flex items-center justify-center">
                              {isSelected ? (
                                <span className="absolute -inset-1 rounded-lg border border-[#8a5064]" />
                              ) : null}
                              <span
                                className={cn(
                                  "w-11 h-11 rounded-full border transition-all",
                                  isSelected ? "ring-2 ring-[#d16f89] border-white scale-105" : "border-[#d9d9de]"
                                )}
                                style={{ backgroundColor: colors[idx % colors.length] }}
                              />
                            </span>
                            <span className={cn("text-xl font-bold", isSelected ? "text-[#2a2a35]" : "text-[#8f959f]")}>{chip}</span>
                          </button>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center gap-6 md:gap-10 text-[34px] md:text-[42px] font-extrabold leading-none mb-4">
                      {trayVariantOptions.map((option) => {
                        const chip = getTraySizeChipLabel(option.parsed.label)
                        const isSelected = selectedIngredients.includes(option.raw)
                        return (
                          <button
                            key={option.raw}
                            onClick={() => toggleIngredient(option.raw)}
                            className={cn(
                              "relative pb-2 transition-colors",
                              isSelected ? "text-[#cc7f90]" : "text-[#8f959f]"
                            )}
                          >
                            {chip}
                            {isSelected ? <span className="absolute left-0 right-0 -bottom-0.5 h-1 rounded-full bg-[#e89aac]" /> : null}
                          </button>
                        )
                      })}
                    </div>

                    {selectedVariantLabel ? (
                      <p className="text-center text-sm text-[#9aa0ac] mb-4">{selectedVariantLabel}</p>
                    ) : null}

                    <div className="flex justify-center mb-5">
                      <div className="inline-flex items-center rounded-full border border-[#e7ca5a] bg-[#fff9de] px-7 py-2.5 text-[#7d5900] text-2xl font-black">
                        <PriceWithRiyalLogo value={selectedVariantPrice * quantity} />
                      </div>
                    </div>
                  </>
                )}
              </div>
              ) : null
            ) : (
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
                      <button key={ingredient} onClick={() => toggleIngredient(ingredient)} disabled={isDisabled} className={cn("flex items-center justify-between p-4 min-h-14 rounded-xl border-2 transition-all text-base", isSelected ? "border-[#1e5631] bg-[#1e5631]/10 text-[#1e5631]" : "border-gray-200 bg-white text-[#1e293b]", isDisabled && "opacity-50 cursor-not-allowed")}>
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
            )
          ) : null}
        </div>

        <div className={cn("px-6 pb-6 pt-3 border-t border-gray-100 flex-shrink-0", isTraySizeVariant && "border-t-0 pt-0 bg-[#f7f3f3]")}>
          {!isTraySizeVariant ? (
            <>
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
                <span className="text-xl font-bold text-[#1e293b]">
                  <PriceWithRiyalLogo value={selectedVariantPrice * quantity} />
                </span>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={(((isTray && !isTraySizeVariant) && !trayComplete) || (isEidPackage && !eidComplete)) || product.inStock === false || isAddedFeedback}
                className={cn(
                  "w-full py-4 rounded-full text-lg font-medium transition-all duration-300",
                  product.inStock === false
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : ((isTray && !isTraySizeVariant) && !trayComplete) || (isEidPackage && !eidComplete)
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
                  : (isTray && !isTraySizeVariant) && !trayComplete
                  ? `اختر ${TRAY_REQUIRED - traySelections.length} أصناف أخرى`
                  : isEidPackage && !eidComplete
                  ? `اختر ${eidRequired - traySelections.length} سخانات`
                  : isTraySizeVariant
                  ? "أضف إلى السلة"
                  : "اطلب الآن"}
              </button>
            </>
          ) : trayDesign === "floating_3" ? (
            <div dir="rtl">
              {showTrayOptionsStep ? (
                <button
                  onClick={() => setTrayStep(1)}
                  className="w-full mb-2 h-10 rounded-xl border border-[#e2d6da] bg-white/90 text-[#7a3f51] text-sm font-semibold"
                >
                  رجوع لاختيار الحجم
                </button>
              ) : null}
              <div className="flex items-center gap-3 min-h-10">
                <button
                  onClick={showTrayDesignStep ? () => setTrayStep(2) : handleAddToCart}
                  disabled={product.inStock === false || isAddedFeedback || (showTrayOptionsStep && !trayComplete)}
                  className={cn(
                    "flex-1 h-10 rounded-[14px] text-[18px] md:text-[19px] font-extrabold leading-none transition-all flex items-center justify-center",
                    product.inStock === false
                      ? "bg-gray-300 text-gray-500"
                      : showTrayOptionsStep && !trayComplete
                      ? "bg-gray-300 text-gray-500"
                      : isAddedFeedback
                      ? "bg-[#2b2d39] text-white scale-[1.01]"
                      : "bg-[#181a22] text-white shadow-[0_8px_24px_rgba(0,0,0,0.28)]"
                  )}
                >
                  {isAddedFeedback
                    ? "تمت الإضافة ✓"
                    : showTrayDesignStep
                    ? "التالي: اختيار الأصناف"
                    : !trayComplete
                    ? `اختر ${TRAY_REQUIRED - traySelections.length} أصناف`
                    : "أضف للسلة"}
                </button>

                <div
                  className="border border-[#dddde2] bg-white flex items-center justify-center text-[#b6647e] h-10 min-w-[96px] rounded-[14px] px-2.5 gap-2"
                >
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="leading-none flex items-center justify-center w-6 h-6 text-[20px] font-bold"
                    aria-label="زيادة الكمية"
                  >
                    +
                  </button>
                  <span className="text-center font-extrabold text-[#2e2f4a] min-w-6 text-[20px] leading-none">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="leading-none flex items-center justify-center w-6 h-6 text-[20px] font-bold"
                    aria-label="تقليل الكمية"
                  >
                    -
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div dir="rtl">
              {showTrayOptionsStep ? (
                <button
                  onClick={() => setTrayStep(1)}
                  className="w-full mb-2 h-10 rounded-full border border-[#efced7] bg-white text-[#7a3f51] text-sm font-semibold"
                >
                  رجوع لاختيار الحجم
                </button>
              ) : null}
              <div className="flex items-center gap-3">
              <button
                onClick={showTrayDesignStep ? () => setTrayStep(2) : handleAddToCart}
                disabled={product.inStock === false || isAddedFeedback || (showTrayOptionsStep && !trayComplete)}
                className={cn(
                  "flex-1 h-14 rounded-full text-[30px] md:text-[34px] font-extrabold transition-all",
                  product.inStock === false
                    ? "bg-gray-300 text-gray-500"
                    : showTrayOptionsStep && !trayComplete
                    ? "bg-gray-300 text-gray-500"
                    : isAddedFeedback
                    ? "bg-[#d98ea0] text-white scale-[1.01]"
                    : "bg-[#efc2ce] text-[#462635] shadow-[0_6px_18px_rgba(239,194,206,0.55)]"
                )}
              >
                {isAddedFeedback
                  ? "تمت الإضافة ✓"
                  : showTrayDesignStep
                  ? "التالي: اختيار الأصناف"
                  : !trayComplete
                  ? `اختر ${TRAY_REQUIRED - traySelections.length} أصناف`
                  : "أضف للسلة"}
              </button>

              <div className="h-14 rounded-full border border-[#efced7] bg-white px-4 flex items-center gap-4 text-[#b6647e]">
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="text-[32px] leading-none"
                  aria-label="زيادة الكمية"
                >
                  +
                </button>
                <span className="min-w-8 text-center text-[34px] font-extrabold text-[#2e2f4a]">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="text-[32px] leading-none"
                  aria-label="تقليل الكمية"
                >
                  -
                </button>
              </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
