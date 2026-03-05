"use client"

import { useMemo, useState, useCallback, Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams, useRouter } from "next/navigation"
import {
  ArrowRight,
  Minus,
  Plus,
  Trash2,
  MapPin,
  User,
  Phone,
  FileText,
  ShoppingBag,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  MessageCircle,
} from "lucide-react"
import { useCart } from "@/components/cart-provider"
import type { CartItem } from "@/components/cart-provider"
import { TimePicker } from "@/components/time-picker"
import {
  generateWhatsAppMessage,
  generatePickupWhatsAppMessage,
  WHATSAPP_NUMBER,
  deliveryAreas,
} from "@/lib/data"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type CheckoutErrors = { name?: string; phone?: string; area?: string }
type AreaDesign = "search" | "chips" | "cards"
type CheckoutTheme = "classic" | "glass" | "contrast"

function CheckoutItemImage({ item }: { item: CartItem }) {
  const [imgError, setImgError] = useState(false)
  if (!item.image || imgError) {
    return (
      <div className="w-16 h-16 rounded-xl flex-shrink-0 bg-muted flex items-center justify-center">
        <ShoppingBag className="h-6 w-6 text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
      <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" onError={() => setImgError(true)} />
    </div>
  )
}

function ProgressStep({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center border text-[10px] font-bold",
          done ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border"
        )}
      >
        {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : "•"}
      </div>
      <span className={cn("text-xs font-medium", done ? "text-foreground" : "text-muted-foreground")}>{label}</span>
    </div>
  )
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim()
}

function getEarliestDeliverySlot(minMinutes: number): string | null {
  const now = new Date()
  const saudiNow = new Date(now.getTime() + (3 * 60 - now.getTimezoneOffset()) * 60000)
  const earliest = new Date(saudiNow.getTime() + (minMinutes + 45) * 60 * 1000)
  const OPEN_HOUR = 15
  const CLOSE_HOUR = 22
  const dayNames = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
  const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]

  for (let i = 0; i < 7; i++) {
    const day = new Date(saudiNow)
    day.setDate(saudiNow.getDate() + i)
    for (let hour = OPEN_HOUR; hour < CLOSE_HOUR; hour++) {
      for (const min of [0, 30]) {
        const slot = new Date(day)
        slot.setHours(hour, min, 0, 0)
        if (slot <= earliest) continue

        const dayLabel = i === 0 ? "اليوم" : i === 1 ? "غدًا" : dayNames[day.getDay()]
        const h12 = hour > 12 ? hour - 12 : hour
        const period = hour >= 12 ? "م" : "ص"
        return `${dayLabel} ${day.getDate()} ${monthNames[day.getMonth()]} - ${h12}:${min === 0 ? "00" : "30"} ${period}`
      }
    }
  }

  return null
}

function normalizeMakingTimeMinutes(value: number): number {
  if (!value || value <= 0) return 0
  // Backward compatibility: some old records stored "24" meaning 24 hours.
  if (value === 24) return 24 * 60
  return value
}

function CheckoutContent() {
  const searchParams = useSearchParams()
  const orderType = (searchParams.get("type") as "pickup" | "delivery") || "delivery"
  const isPickup = orderType === "pickup"

  const areaDesignParam = searchParams.get("areaui")
  const areaDesign: AreaDesign =
    areaDesignParam === "chips" || areaDesignParam === "cards" || areaDesignParam === "search"
      ? areaDesignParam
      : "chips"

  const themeParam = searchParams.get("checkoutui")
  const activeCheckoutTheme: CheckoutTheme =
    themeParam === "glass" || themeParam === "contrast" || themeParam === "classic" ? themeParam : "glass"

  const theme =
    activeCheckoutTheme === "glass"
      ? {
          main: "min-h-screen pb-32 bg-[radial-gradient(circle_at_top,_#f7fafc,_#edf2f7_50%,_#e2e8f0)]",
          header: "sticky top-0 z-50 bg-white/55 backdrop-blur-xl border-b border-white/60",
          section: "rounded-3xl border border-white/60 bg-white/55 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.07)] p-4",
          summary: "p-4 rounded-3xl border border-white/60 bg-white/55 backdrop-blur-md",
          input: "bg-white/70",
          ctaWrap:
            "fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/90 to-transparent pt-8",
        }
      : activeCheckoutTheme === "contrast"
        ? {
            main: "min-h-screen pb-32 bg-slate-50",
            header: "sticky top-0 z-50 bg-slate-900 text-white border-b border-slate-800",
            section: "rounded-2xl border border-slate-200 bg-white shadow-sm p-4",
            summary: "p-4 rounded-2xl bg-slate-900 text-white",
            input: "bg-slate-100",
            ctaWrap: "fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pt-8",
          }
        : {
            main: "min-h-screen bg-background pb-32",
            header: "sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50",
            section: "rounded-2xl border border-border/60 bg-card p-4",
            summary: "p-4 bg-amal-pink-light rounded-2xl",
            input: "bg-amal-grey",
            ctaWrap: "fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-8",
          }

  const router = useRouter()
  const { items, totalPrice, updateQuantity, removeItem, deliveryInfo, setDeliveryInfo, clearCart } = useCart()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<CheckoutErrors>({})
  const [submitted, setSubmitted] = useState(false)
  const [areaFocused, setAreaFocused] = useState(false)
  const [actionFeedback, setActionFeedback] = useState<string | null>(null)
  const [highlightedCartKey, setHighlightedCartKey] = useState<string | null>(null)

  const showActionFeedback = useCallback((message: string) => {
    setActionFeedback(message)
    window.setTimeout(() => {
      setActionFeedback((prev) => (prev === message ? null : prev))
    }, 1500)
  }, [])

  const handleInputChange = useCallback(
    (field: keyof typeof deliveryInfo, value: string) => {
      setDeliveryInfo({ ...deliveryInfo, [field]: value })
      if (submitted || errors[field as keyof CheckoutErrors]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }))
      }
    },
    [deliveryInfo, setDeliveryInfo, submitted, errors]
  )

  const pickArea = useCallback(
    (areaName: string) => {
      handleInputChange("area", areaName)
      setAreaFocused(false)
      showActionFeedback("تم تحديث رسوم التوصيل")
    },
    [handleInputChange, showActionFeedback]
  )

  const handleDecrease = useCallback(
    (item: CartItem) => {
      const nextQty = item.quantity - 1
      updateQuantity(item.cartKey, nextQty)
      setHighlightedCartKey(item.cartKey)
      window.setTimeout(() => setHighlightedCartKey((prev) => (prev === item.cartKey ? null : prev)), 500)
      showActionFeedback(nextQty <= 0 ? "تم حذف الصنف من السلة" : "تم تحديث الكمية")
    },
    [updateQuantity, showActionFeedback]
  )

  const handleIncrease = useCallback(
    (item: CartItem) => {
      updateQuantity(item.cartKey, item.quantity + 1)
      setHighlightedCartKey(item.cartKey)
      window.setTimeout(() => setHighlightedCartKey((prev) => (prev === item.cartKey ? null : prev)), 500)
      showActionFeedback("تم تحديث الكمية")
    },
    [updateQuantity, showActionFeedback]
  )

  const handleRemove = useCallback(
    (item: CartItem) => {
      removeItem(item.cartKey)
      showActionFeedback("تم حذف الصنف من السلة")
    },
    [removeItem, showActionFeedback]
  )

  const handleScheduleChange = useCallback(
    (value: string | null) => setDeliveryInfo({ ...deliveryInfo, scheduledTime: value }),
    [deliveryInfo, setDeliveryInfo]
  )

  const selectedArea = deliveryAreas.find((a) => a.name === deliveryInfo.area)
  const deliveryFee = isPickup ? 0 : selectedArea?.price || 0
  const grandTotal = totalPrice + deliveryFee
  const maxMakingTime = items.reduce((max, item) => Math.max(max, normalizeMakingTimeMinutes(item.makingTime || 0)), 0)
  const earliestSlot = useMemo(() => getEarliestDeliverySlot(maxMakingTime), [maxMakingTime])

  const filteredAreas = useMemo(() => {
    if (isPickup) return []
    const q = normalizeText(deliveryInfo.area || "")
    if (!q) return deliveryAreas
    return deliveryAreas.filter((a) => normalizeText(a.name).includes(q))
  }, [deliveryInfo.area, isPickup])

  const infoDone = useMemo(() => {
    const hasBaseInfo = Boolean(deliveryInfo.name.trim() && deliveryInfo.phone.trim())
    return isPickup ? hasBaseInfo : hasBaseInfo && Boolean(selectedArea)
  }, [deliveryInfo.name, deliveryInfo.phone, selectedArea, isPickup])

  const validate = useCallback((): CheckoutErrors => {
    const next: CheckoutErrors = {}
    if (!deliveryInfo.name.trim()) next.name = "الاسم مطلوب"

    if (!deliveryInfo.phone.trim()) next.phone = "رقم الهاتف مطلوب"
    else {
      const digitsOnly = deliveryInfo.phone.replace(/\D/g, "")
      if (digitsOnly.length < 9) next.phone = "أدخل رقم هاتف صحيح"
    }

    if (!isPickup && !selectedArea) next.area = "اختر منطقة التوصيل من القائمة"
    return next
  }, [deliveryInfo.name, deliveryInfo.phone, isPickup, selectedArea])

  const deliveryAccuracyText = useMemo(() => {
    if (isPickup) return "جاهزية الطلب حسب موعد الاستلام المختار."
    if (deliveryInfo.scheduledTime) return `التسليم المتوقع ضمن 15-25 دقيقة من الموعد: ${deliveryInfo.scheduledTime}`
    return earliestSlot
      ? `أقرب نافذة توصيل متاحة: ${earliestSlot} (قد تتغير ±20 دقيقة حسب الزحام).`
      : "نؤكد أقرب نافذة توصيل متاحة بعد مراجعة وقت التحضير."
  }, [isPickup, deliveryInfo.scheduledTime, earliestSlot])

  const fieldBaseClass = `w-full min-h-12 py-4 px-4 pr-12 rounded-2xl text-base ${theme.input} text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all`

  const handleWhatsAppCheckout = async () => {
    setSubmitted(true)
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      showActionFeedback("يرجى تصحيح الحقول المحددة")
      return
    }

    setIsSubmitting(true)
    const cartItems = items.map((item) => ({
      id: item.id,
      name: item.name,
      nameEn: (item as { nameEn?: string }).nameEn || "",
      quantity: item.quantity,
      price: item.price,
      selectedIngredients: item.selectedIngredients,
      makingTime: item.makingTime || 0,
    }))

    const message = isPickup
      ? generatePickupWhatsAppMessage(cartItems, totalPrice, deliveryInfo)
      : generateWhatsAppMessage(cartItems, totalPrice, deliveryInfo)

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`
    window.open(whatsappUrl, "_blank")

    try {
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: deliveryInfo.name,
          customerPhone: deliveryInfo.phone,
          customerArea: isPickup ? "" : selectedArea?.name || "",
          orderType: isPickup ? "pickup" : "delivery",
          items: cartItems.map((item) => ({ id: item.id, quantity: item.quantity, selectedIngredients: item.selectedIngredients })),
          notes: deliveryInfo.notes,
          scheduledTime: deliveryInfo.scheduledTime,
        }),
      })

      if (!orderResponse.ok) throw new Error("save failed")
      const orderData: { total?: number } = await orderResponse.json()
      const confirmedTotal = typeof orderData.total === "number" ? orderData.total : grandTotal

      clearCart()
      const params = new URLSearchParams({
        name: deliveryInfo.name,
        area: isPickup ? "" : selectedArea?.name || "",
        total: String(confirmedTotal),
        type: isPickup ? "pickup" : "delivery",
        time: deliveryInfo.scheduledTime ?? "في أقرب وقت",
        wa: whatsappUrl,
      })
      router.push(`/confirmation?${params.toString()}`)
    } catch {
      alert("تعذر حفظ الطلب، حاول مرة أخرى.")
      setIsSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <main className={cn(theme.main, "flex flex-col items-center justify-center p-6 text-center")}>
        <div className="w-24 h-24 rounded-full bg-amal-grey flex items-center justify-center mb-6">
          <Trash2 className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">السلة فارغة</h1>
        <p className="text-muted-foreground mb-6">لم تقم بإضافة أي منتجات بعد</p>
        <Link href="/">
          <Button className="rounded-full px-8">تصفح المنتجات</Button>
        </Link>
      </main>
    )
  }

  return (
    <main className={theme.main}>
      <header className={theme.header}>
        <div className="flex items-center gap-4 px-4 py-3">
          <Link
            href="/"
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center active:scale-95 transition-transform",
              activeCheckoutTheme === "contrast" ? "bg-slate-700" : "bg-amal-grey"
            )}
          >
            <ArrowRight className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">إتمام الطلب</h1>
            <p className={cn("text-xs", activeCheckoutTheme === "contrast" ? "text-slate-300" : "text-muted-foreground")}>
              {isPickup ? "استلام من المحل" : "توصيل للمنزل"}
            </p>
          </div>
        </div>

        <div className={cn("px-4 pb-3 flex items-center justify-between border-t", activeCheckoutTheme === "contrast" ? "border-slate-700" : "border-border/40")}>
          <ProgressStep label="السلة" done={items.length > 0} />
          <div className={cn("h-px flex-1 mx-2", activeCheckoutTheme === "contrast" ? "bg-slate-700" : "bg-border")} />
          <ProgressStep label="البيانات" done={infoDone} />
          <div className={cn("h-px flex-1 mx-2", activeCheckoutTheme === "contrast" ? "bg-slate-700" : "bg-border")} />
          <ProgressStep label="التأكيد" done={false} />
        </div>
      </header>

      {actionFeedback ? (
        <div className="px-4 pt-3">
          <div className="rounded-2xl border border-primary/25 bg-primary/10 text-primary text-sm font-medium px-4 py-3 animate-in fade-in slide-in-from-top-1 duration-300">
            {actionFeedback}
          </div>
        </div>
      ) : null}

      <div className="p-4 space-y-5">
        <section className={theme.section}>
          <h2 className="text-lg font-bold mb-4">طلباتك ({items.length})</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.cartKey}
                className={cn(
                  "p-3 rounded-2xl border transition-all duration-300",
                  highlightedCartKey === item.cartKey && "ring-2 ring-primary/30 scale-[1.01]",
                  activeCheckoutTheme === "contrast" ? "bg-white border-slate-200" : "bg-background border-border/50"
                )}
              >
                <div className="flex items-start gap-3">
                  <CheckoutItemImage item={item} />
                  <div className="flex-1 min-w-0 text-right">
                    <h3 className="font-bold text-foreground leading-tight break-words">{item.name}</h3>
                    {item.selectedIngredients?.length ? (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.selectedIngredients.join("، ")}</p>
                    ) : null}
                    <p className="text-primary font-medium mt-1">{item.price * item.quantity} ر.س</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <button
                    onClick={() => handleRemove(item)}
                    className="w-11 h-11 rounded-full bg-destructive/10 flex items-center justify-center text-destructive active:scale-95 transition-transform flex-shrink-0"
                    aria-label="حذف"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDecrease(item)}
                      className={cn("w-11 h-11 rounded-full flex items-center justify-center active:scale-95 transition-transform", theme.input)}
                      aria-label="تقليل"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-7 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => handleIncrease(item)}
                      className={cn("w-11 h-11 rounded-full flex items-center justify-center active:scale-95 transition-transform", theme.input)}
                      aria-label="زيادة"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={theme.section}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold">{isPickup ? "وقت الاستلام" : "موعد التوصيل"}</h2>
            {!isPickup && earliestSlot ? (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1">
                <Clock3 className="h-3.5 w-3.5" />
                أقرب موعد: {earliestSlot}
              </div>
            ) : null}
          </div>

          {maxMakingTime > 0 ? (
            <div className="mb-3 p-3 bg-amal-yellow/20 rounded-xl text-right text-sm text-foreground">
              الحد الأدنى للتجهيز:{" "}
              <span className="font-bold">
                {maxMakingTime >= 60
                  ? `${maxMakingTime % 60 === 0 ? maxMakingTime / 60 : `${Math.floor(maxMakingTime / 60)} ساعة و${maxMakingTime % 60} دقيقة`}`
                  : `${maxMakingTime} دقيقة`}
              </span>
            </div>
          ) : null}

          <TimePicker value={deliveryInfo.scheduledTime} onChange={handleScheduleChange} minMinutes={maxMakingTime} required={false} />
        </section>

        <section className={theme.section}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">{isPickup ? "بيانات الاستلام" : "بيانات التوصيل"}</h2>
            <span className="text-xs text-muted-foreground">* الحقول المطلوبة</span>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <User className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="الاسم الكامل *"
                value={deliveryInfo.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={cn(fieldBaseClass, errors.name && "ring-2 ring-red-300 border border-red-300")}
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name ? <p className="text-sm font-medium text-red-600 mt-1 pr-2" role="alert">{errors.name}</p> : null}
            </div>

            <div className="relative">
              <Phone className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="tel"
                inputMode="tel"
                dir="ltr"
                placeholder="رقم الهاتف *"
                value={deliveryInfo.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className={cn(fieldBaseClass, errors.phone && "ring-2 ring-red-300 border border-red-300")}
                aria-invalid={Boolean(errors.phone)}
              />
              {errors.phone ? <p className="text-sm font-medium text-red-600 mt-1 pr-2" role="alert">{errors.phone}</p> : null}
              {!errors.phone ? <p className="text-sm text-muted-foreground mt-1 pr-2">صيغة مقترحة: 05xxxxxxxx</p> : null}
            </div>

            {!isPickup ? (
              <div className="relative">
                {areaDesign === "search" ? (
                  <>
                    <MapPin className="absolute right-4 top-4 h-5 w-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="اكتب المنطقة *"
                      value={deliveryInfo.area}
                      onFocus={() => setAreaFocused(true)}
                      onBlur={() => setTimeout(() => setAreaFocused(false), 120)}
                      onChange={(e) => handleInputChange("area", e.target.value)}
                      className={cn(fieldBaseClass, errors.area && "ring-2 ring-red-300 border border-red-300")}
                      aria-invalid={Boolean(errors.area)}
                    />

                    {areaFocused && filteredAreas.length > 0 ? (
                      <div className="absolute z-20 mt-2 w-full rounded-2xl border border-border bg-white shadow-lg overflow-hidden">
                        <div className="max-h-56 overflow-y-auto">
                          {filteredAreas.map((area) => (
                            <button
                              key={area.id}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault()
                                pickArea(area.name)
                              }}
                              className="w-full text-right px-4 py-3.5 min-h-12 hover:bg-amal-grey/60 transition-colors"
                            >
                              <p className="font-medium">{area.name}</p>
                              <p className="text-xs text-muted-foreground">رسوم التوصيل: {area.price} ر.س</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </>
                ) : areaDesign === "cards" ? (
                  <div className="space-y-2">
                    {filteredAreas.map((area) => (
                      <button
                        key={area.id}
                        type="button"
                        onClick={() => pickArea(area.name)}
                        className={cn(
                          "w-full rounded-2xl border px-3 py-3.5 min-h-12 text-right transition-colors active:scale-[0.99]",
                          selectedArea?.id === area.id ? "border-primary bg-primary/10" : "border-border bg-amal-grey/60 hover:bg-amal-grey"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{area.name}</span>
                          <span className={cn("text-sm", selectedArea?.id === area.id ? "text-primary font-bold" : "text-muted-foreground")}>{area.price} ر.س</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {filteredAreas.map((area) => (
                      <button
                        key={area.id}
                        type="button"
                        onClick={() => pickArea(area.name)}
                        className={cn(
                          "rounded-full px-4 py-3 min-h-12 text-sm border transition-colors active:scale-[0.99]",
                          selectedArea?.id === area.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : `${theme.input} text-foreground border-border hover:bg-primary/10`
                        )}
                      >
                        {area.name} · {area.price} ر.س
                      </button>
                    ))}
                  </div>
                )}

                {errors.area ? <p className="text-sm font-medium text-red-600 mt-1 pr-2" role="alert">{errors.area}</p> : null}
                <p className="text-sm mt-2 text-muted-foreground">
                  {selectedArea ? (
                    <span className="text-primary font-semibold">رسوم التوصيل الآن: {selectedArea.price} ر.س</span>
                  ) : (
                    "اختر منطقة من القائمة لاحتساب الرسوم فورًا"
                  )}
                </p>
              </div>
            ) : null}

            <div className="relative">
              <FileText className="absolute right-4 top-4 h-5 w-5 text-muted-foreground" />
              <textarea
                placeholder="ملاحظات إضافية (اختياري)"
                value={deliveryInfo.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={2}
                className={cn(fieldBaseClass, "resize-none")}
              />
            </div>
          </div>
        </section>

        <section className={theme.summary}>
          <div className="flex justify-between mb-2">
            <span className={cn(activeCheckoutTheme === "contrast" ? "text-slate-300" : "text-muted-foreground")}>المجموع الفرعي</span>
            <span className="font-medium">{totalPrice} ر.س</span>
          </div>

          <div className="flex justify-between mb-2">
            <span className={cn(activeCheckoutTheme === "contrast" ? "text-slate-300" : "text-muted-foreground")}>
              {isPickup ? "رسوم التوصيل" : `رسوم التوصيل ${selectedArea ? `(${selectedArea.name})` : ""}`}
            </span>
            <span className={cn("font-medium", isPickup && "text-[#1e5631]")}>
              {isPickup ? "مجاني" : selectedArea ? `${selectedArea.price} ر.س` : "اختر المنطقة"}
            </span>
          </div>

          <div className={cn("pt-2 mt-2 border-t", activeCheckoutTheme === "contrast" ? "border-slate-700" : "border-primary/20")}>
            <div className="flex justify-between">
              <span className="font-bold text-lg">الإجمالي</span>
              <span className="font-bold text-lg text-primary">{grandTotal} ر.س</span>
            </div>
          </div>
        </section>

        <section className={theme.section} dir="rtl">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <h3 className="font-bold text-base">ضمانات الطلب</h3>
          </div>

          <p className="text-sm text-muted-foreground mb-3">{deliveryAccuracyText}</p>

          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-[#25D366]/10 text-[#1f8f48] text-sm font-semibold hover:bg-[#25D366]/20 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            تواصل مباشر للدعم
          </a>
        </section>
      </div>

      <div className={theme.ctaWrap}>
        <Button onClick={handleWhatsAppCheckout} disabled={isSubmitting} className="w-full h-14 rounded-full bg-[#25D366] hover:bg-[#25D366]/90 text-white text-lg font-bold shadow-xl">
          {isSubmitting ? "جاري الإرسال..." : "إتمام الطلب عبر واتساب"}
        </Button>
      </div>
    </main>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  )
}
