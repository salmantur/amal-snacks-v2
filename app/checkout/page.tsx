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
  ChevronDown,
  ShoppingBag,
  CheckCircle2,
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

type CheckoutErrors = {
  name?: string
  phone?: string
  area?: string
}

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
      <Image
        src={item.image}
        alt={item.name}
        fill
        sizes="64px"
        className="object-cover"
        onError={() => setImgError(true)}
      />
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

function CheckoutContent() {
  const searchParams = useSearchParams()
  const orderType = (searchParams.get("type") as "pickup" | "delivery") || "delivery"
  const isPickup = orderType === "pickup"

  const router = useRouter()
  const { items, totalPrice, updateQuantity, removeItem, deliveryInfo, setDeliveryInfo, clearCart } = useCart()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<CheckoutErrors>({})
  const [submitted, setSubmitted] = useState(false)

  const handleInputChange = useCallback(
    (field: keyof typeof deliveryInfo, value: string) => {
      setDeliveryInfo({ ...deliveryInfo, [field]: value })
      if (submitted) {
        setErrors((prev) => ({ ...prev, [field]: undefined }))
      }
    },
    [deliveryInfo, setDeliveryInfo, submitted]
  )

  const handleScheduleChange = useCallback(
    (value: string | null) => {
      setDeliveryInfo({ ...deliveryInfo, scheduledTime: value })
    },
    [deliveryInfo, setDeliveryInfo]
  )

  const selectedArea = deliveryAreas.find((a) => a.name === deliveryInfo.area)
  const deliveryFee = isPickup ? 0 : (selectedArea?.price || 0)
  const grandTotal = totalPrice + deliveryFee

  const maxMakingTime = items.reduce((max, item) => Math.max(max, item.makingTime || 0), 0)

  const infoDone = useMemo(() => {
    const hasBaseInfo = Boolean(deliveryInfo.name.trim() && deliveryInfo.phone.trim())
    if (isPickup) return hasBaseInfo
    return hasBaseInfo && Boolean(deliveryInfo.area)
  }, [deliveryInfo.name, deliveryInfo.phone, deliveryInfo.area, isPickup])

  const validate = useCallback((): CheckoutErrors => {
    const nextErrors: CheckoutErrors = {}
    if (!deliveryInfo.name.trim()) nextErrors.name = "الاسم مطلوب"
    if (!deliveryInfo.phone.trim()) nextErrors.phone = "رقم الهاتف مطلوب"
    if (!isPickup && !deliveryInfo.area) nextErrors.area = "اختر منطقة التوصيل"
    return nextErrors
  }, [deliveryInfo.name, deliveryInfo.phone, deliveryInfo.area, isPickup])

  const handleWhatsAppCheckout = async () => {
    setSubmitted(true)
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

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
          customerArea: isPickup ? "" : deliveryInfo.area,
          orderType: isPickup ? "pickup" : "delivery",
          items: cartItems.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            selectedIngredients: item.selectedIngredients,
          })),
          notes: deliveryInfo.notes,
          scheduledTime: deliveryInfo.scheduledTime,
        }),
      })

      if (!orderResponse.ok) {
        throw new Error("Unable to save order")
      }

      const orderData: { total?: number } = await orderResponse.json()
      const confirmedTotal = typeof orderData.total === "number" ? orderData.total : grandTotal

      clearCart()

      const params = new URLSearchParams({
        name: deliveryInfo.name,
        area: isPickup ? "" : deliveryInfo.area,
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
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
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
    <main className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center gap-4 px-4 py-3">
          <Link href="/" className="w-10 h-10 rounded-full bg-amal-grey flex items-center justify-center">
            <ArrowRight className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">إتمام الطلب</h1>
            <p className="text-xs text-muted-foreground">
              {isPickup ? "استلام من المحل" : "توصيل للمنزل"}
            </p>
          </div>
        </div>

        <div className="px-4 pb-3 flex items-center justify-between border-t border-border/40">
          <ProgressStep label="السلة" done={items.length > 0} />
          <div className="h-px flex-1 mx-2 bg-border" />
          <ProgressStep label="البيانات" done={infoDone} />
          <div className="h-px flex-1 mx-2 bg-border" />
          <ProgressStep label="التأكيد" done={false} />
        </div>
      </header>

      <div className="p-4 space-y-5">
        <section className="rounded-2xl border border-border/60 bg-card p-4">
          <h2 className="text-lg font-bold mb-4">طلباتك ({items.length})</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.cartKey} className="flex items-center gap-4 p-3 bg-background rounded-2xl border border-border/50">
                <CheckoutItemImage item={item} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground truncate">{item.name}</h3>
                  {item.selectedIngredients?.length ? (
                    <p className="text-xs text-muted-foreground truncate">{item.selectedIngredients.join("، ")}</p>
                  ) : null}
                  <p className="text-primary font-medium">{item.price * item.quantity} ر.س</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
                    className="w-8 h-8 rounded-full bg-amal-grey flex items-center justify-center"
                    aria-label="تقليل الكمية"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-6 text-center font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                    className="w-8 h-8 rounded-full bg-amal-grey flex items-center justify-center"
                    aria-label="زيادة الكمية"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.cartKey)}
                  className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center text-destructive"
                  aria-label="حذف المنتج"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card p-4">
          <h2 className="text-lg font-bold mb-2">{isPickup ? "وقت الاستلام" : "موعد التوصيل"}</h2>
          {maxMakingTime > 0 && (
            <div className="mb-3 p-3 bg-amal-yellow/20 rounded-xl flex items-center gap-2 text-right">
              <span className="text-xl">⏱️</span>
              <p className="text-sm text-foreground">
                الحد الأدنى للتجهيز{" "}
                <span className="font-bold">
                  {maxMakingTime >= 60
                    ? `${maxMakingTime % 60 === 0 ? maxMakingTime / 60 : `${Math.floor(maxMakingTime / 60)} ساعة و${maxMakingTime % 60}`} ساعة`
                    : `${maxMakingTime} دقيقة`}
                </span>
                . المواعيد المتاحة تراعي وقت التحضير.
              </p>
            </div>
          )}
          <TimePicker value={deliveryInfo.scheduledTime} onChange={handleScheduleChange} minMinutes={maxMakingTime} required={false} />
        </section>

        <section className="rounded-2xl border border-border/60 bg-card p-4">
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
                className={cn(
                  "w-full py-4 px-4 pr-12 rounded-2xl bg-amal-grey text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20",
                  errors.name && "ring-2 ring-red-300"
                )}
              />
              {errors.name ? <p className="text-xs text-red-500 mt-1 pr-2">{errors.name}</p> : null}
            </div>

            <div className="relative">
              <Phone className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="tel"
                inputMode="tel"
                placeholder="رقم الهاتف *"
                value={deliveryInfo.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className={cn(
                  "w-full py-4 px-4 pr-12 rounded-2xl bg-amal-grey text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20",
                  errors.phone && "ring-2 ring-red-300"
                )}
                dir="ltr"
              />
              {errors.phone ? <p className="text-xs text-red-500 mt-1 pr-2">{errors.phone}</p> : null}
            </div>

            {!isPickup && (
              <div className="relative">
                <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <select
                  value={deliveryInfo.area}
                  onChange={(e) => handleInputChange("area", e.target.value)}
                  className={cn(
                    "w-full py-4 px-4 pr-12 rounded-2xl bg-amal-grey text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer",
                    errors.area && "ring-2 ring-red-300"
                  )}
                >
                  <option value="">اختر منطقة التوصيل *</option>
                  {deliveryAreas.map((area) => (
                    <option key={area.id} value={area.name}>
                      {area.name} - {area.price} ر.س
                    </option>
                  ))}
                </select>
                {errors.area ? <p className="text-xs text-red-500 mt-1 pr-2">{errors.area}</p> : null}
              </div>
            )}

            <div className="relative">
              <FileText className="absolute right-4 top-4 h-5 w-5 text-muted-foreground" />
              <textarea
                placeholder="ملاحظات إضافية (اختياري)"
                value={deliveryInfo.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={2}
                className="w-full py-4 px-4 pr-12 rounded-2xl bg-amal-grey text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>
          </div>
        </section>

        <section className="p-4 bg-amal-pink-light rounded-2xl">
          <div className="flex justify-between mb-2">
            <span className="text-muted-foreground">المجموع الفرعي</span>
            <span className="font-medium">{totalPrice} ر.س</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-muted-foreground">
              {isPickup ? "رسوم التوصيل" : `رسوم التوصيل ${deliveryInfo.area ? `(${deliveryInfo.area})` : ""}`}
            </span>
            <span className={cn("font-medium", isPickup && "text-[#1e5631]")}>
              {isPickup ? "مجاني" : deliveryFee > 0 ? `${deliveryFee} ر.س` : "اختر المنطقة"}
            </span>
          </div>
          <div className="border-t border-primary/20 pt-2 mt-2">
            <div className="flex justify-between">
              <span className="font-bold text-lg">الإجمالي</span>
              <span className="font-bold text-lg text-primary">{grandTotal} ر.س</span>
            </div>
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-8">
        <Button
          onClick={handleWhatsAppCheckout}
          disabled={isSubmitting}
          className="w-full h-14 rounded-full bg-[#25D366] hover:bg-[#25D366]/90 text-white text-lg font-bold shadow-xl"
        >
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
