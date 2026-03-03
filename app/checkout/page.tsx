"use client"

import { useState, useCallback, Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowRight, Minus, Plus, Trash2, MapPin, User, Phone, FileText, ChevronDown, ShoppingBag } from "lucide-react"
import { useCart } from "@/components/cart-provider"
import type { CartItem } from "@/components/cart-provider"
import { TimePicker } from "@/components/time-picker"
import { generateWhatsAppMessage, generatePickupWhatsAppMessage, WHATSAPP_NUMBER } from "@/lib/data"
import { useDeliveryAreas } from "@/hooks/use-delivery-areas"
import { saveOrder } from "@/lib/orders"
import { Button } from "@/components/ui/button"

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

function CheckoutContent() {
  const searchParams = useSearchParams()
  const orderType = (searchParams.get("type") as "pickup" | "delivery") || "delivery"
  const isPickup = orderType === "pickup"

  const router = useRouter()
  const { items, totalPrice, updateQuantity, removeItem, deliveryInfo, setDeliveryInfo, clearCart } = useCart()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = useCallback((field: keyof typeof deliveryInfo, value: string) => {
    setDeliveryInfo({ ...deliveryInfo, [field]: value })
  }, [deliveryInfo, setDeliveryInfo])

  const handleScheduleChange = useCallback((value: string | null) => {
    setDeliveryInfo({ ...deliveryInfo, scheduledTime: value })
  }, [deliveryInfo, setDeliveryInfo])

  const selectedArea = deliveryAreas.find(a => a.name === deliveryInfo.area)
  const deliveryFee = isPickup ? 0 : (selectedArea?.price || 0)
  const grandTotal = totalPrice + deliveryFee

  // Calculate the longest preparation time across all cart items
  const maxMakingTime = items.reduce((max, item) => {
    const t = item.makingTime || 0
    return Math.max(max, t)
  }, 0)

  const handleWhatsAppCheckout = async () => {
    if (isPickup) {
      if (!deliveryInfo.name || !deliveryInfo.phone) {
        alert("الرجاء إدخال الاسم ورقم الهاتف")
        return
      }
      if (!deliveryInfo.scheduledTime) {
        alert("الرجاء اختيار وقت الاستلام")
        return
      }
    } else {
      if (!deliveryInfo.name || !deliveryInfo.phone || !deliveryInfo.area) {
        alert("الرجاء ملء جميع الحقول المطلوبة")
        return
      }
    }

    setIsSubmitting(true)

    const cartItems = items.map((item) => ({
      name: item.name,
      nameEn: (item as { nameEn?: string }).nameEn || "",
      quantity: item.quantity,
      price: item.price,
      selectedIngredients: item.selectedIngredients,
      makingTime: item.makingTime || 0,
    }))

    // Build message FIRST — before any await
    const message = isPickup
      ? generatePickupWhatsAppMessage(cartItems, totalPrice, deliveryInfo)
      : generateWhatsAppMessage(cartItems, totalPrice, deliveryInfo)

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`

    // Open WhatsApp BEFORE await — Safari blocks window.open after async calls
    window.open(whatsappUrl, "_blank")

    // Save order to Supabase
    await saveOrder({
      customerName: deliveryInfo.name,
      customerPhone: deliveryInfo.phone,
      customerArea: isPickup ? "استلام من المحل" : deliveryInfo.area,
      orderType: isPickup ? "pickup" : "delivery",
      items: cartItems,
      subtotal: totalPrice,
      deliveryFee,
      total: grandTotal,
      notes: deliveryInfo.notes,
      scheduledTime: deliveryInfo.scheduledTime,
    })

    clearCart()

    // Redirect to confirmation page
    const params = new URLSearchParams({
      name: deliveryInfo.name,
      area: isPickup ? "" : deliveryInfo.area,
      total: String(grandTotal),
      type: isPickup ? "pickup" : "delivery",
      time: deliveryInfo.scheduledTime ?? "في أقرب وقت",
      wa: whatsappUrl,
    })
    router.push(`/confirmation?${params.toString()}`)
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 rounded-full bg-amal-grey flex items-center justify-center mb-6">
          <Trash2 className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">السلة فارغة</h1>
        <p className="text-muted-foreground mb-6">لم تقم بإضافة أي منتجات بعد</p>
        <Link href="/"><Button className="rounded-full px-8">تصفح المنتجات</Button></Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center gap-4 px-4 py-3 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <Link href="/" className="w-10 h-10 rounded-full bg-amal-grey flex items-center justify-center">
          <ArrowRight className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">سلة المشتريات</h1>
          <p className="text-xs text-muted-foreground">
            {isPickup ? "🏪 استلام من المحل" : "🚚 توصيل للمنزل"}
          </p>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Cart Items */}
        <section>
          <h2 className="text-lg font-bold mb-4">طلباتك ({items.length})</h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.cartKey} className="flex items-center gap-4 p-3 bg-card rounded-2xl border border-border/50">
                <CheckoutItemImage item={item} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground truncate">{item.name}</h3>
                  {item.selectedIngredients && item.selectedIngredients.length > 0 && (
                    <p className="text-xs text-muted-foreground truncate">
                      {item.selectedIngredients.join("، ")}
                    </p>
                  )}
                  <p className="text-primary font-medium">{item.price * item.quantity} ر.س</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.cartKey, item.quantity - 1)} className="w-8 h-8 rounded-full bg-amal-grey flex items-center justify-center" aria-label="تقليل الكمية">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-6 text-center font-medium">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.cartKey, item.quantity + 1)} className="w-8 h-8 rounded-full bg-amal-grey flex items-center justify-center" aria-label="زيادة الكمية">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button onClick={() => removeItem(item.cartKey)} className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center text-destructive" aria-label="حذف المنتج">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Time Picker */}
        <section>
          <h2 className="text-lg font-bold mb-2">{isPickup ? "وقت الاستلام" : "موعد التوصيل"}</h2>
          {maxMakingTime > 0 && (
            <div className="mb-3 p-3 bg-amal-yellow/20 rounded-xl flex items-center gap-2 text-right">
              <span className="text-xl">⏱️</span>
              <p className="text-sm text-foreground">
                بعض الأصناف تحتاج وقت تحضير{" "}
                <span className="font-bold">
                  {maxMakingTime >= 60
                    ? `${maxMakingTime % 60 === 0 ? maxMakingTime / 60 : `${Math.floor(maxMakingTime / 60)} ساعة و${maxMakingTime % 60}`} ساعة`
                    : `${maxMakingTime} دقيقة`}
                </span>
                {" "}— المواعيد المتاحة تبدأ بعد انتهاء التحضير.
              </p>
            </div>
          )}
          <TimePicker value={deliveryInfo.scheduledTime} onChange={handleScheduleChange} minMinutes={maxMakingTime} required={isPickup} />
        </section>

        {/* Info Form */}
        <section>
          <h2 className="text-lg font-bold mb-4">{isPickup ? "معلومات الاستلام" : "معلومات التوصيل"}</h2>
          <div className="space-y-3">
            <div className="relative">
              <User className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="الاسم الكامل *"
                value={deliveryInfo.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full py-4 px-4 pr-12 rounded-2xl bg-amal-grey text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="relative">
              <Phone className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="tel"
                inputMode="tel"
                placeholder="رقم الهاتف *"
                value={deliveryInfo.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className="w-full py-4 px-4 pr-12 rounded-2xl bg-amal-grey text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                dir="ltr"
              />
            </div>

            {!isPickup && (
              <>
                <div className="relative">
                  <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                  <select
                    value={deliveryInfo.area}
                    onChange={(e) => handleInputChange("area", e.target.value)}
                    className="w-full py-4 px-4 pr-12 rounded-2xl bg-amal-grey text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                  >
                    <option value="">اختر منطقة التوصيل *</option>
                    {deliveryAreas.map((area) => (
                      <option key={area.id} value={area.name}>
                        {area.name} - {area.price} ر.س
                      </option>
                    ))}
                  </select>
                </div>
              </>
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

        {/* Summary */}
        <section className="p-4 bg-amal-pink-light rounded-2xl">
          <div className="flex justify-between mb-2">
            <span className="text-muted-foreground">المجموع الفرعي</span>
            <span className="font-medium">{totalPrice} ر.س</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-muted-foreground">
              {isPickup ? "رسوم التوصيل" : `رسوم التوصيل ${deliveryInfo.area ? `(${deliveryInfo.area})` : ""}`}
            </span>
            <span className={`font-medium ${isPickup ? "text-[#1e5631]" : ""}`}>
              {isPickup ? "مجاني 🎉" : deliveryFee > 0 ? `${deliveryFee} ر.س` : "اختر المنطقة"}
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

      {/* Fixed Bottom CTA */}
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