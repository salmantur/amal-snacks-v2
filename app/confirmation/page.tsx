"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle, Clock, MapPin, ShoppingBag, MessageCircle } from "lucide-react"

function ConfirmationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [countdown, setCountdown] = useState(15)
  const [whatsappOpened, setWhatsappOpened] = useState(false)

  const name = searchParams.get("name") || ""
  const area = searchParams.get("area") || ""
  const total = searchParams.get("total") || ""
  const type = searchParams.get("type") || "delivery"
  const time = searchParams.get("time") || "في أقرب وقت"
  const wa = searchParams.get("wa") || ""
  const isPickup = type === "pickup"

  // Open WhatsApp once on load
  useEffect(() => {
    if (wa && !whatsappOpened) {
      setWhatsappOpened(true)
      setTimeout(() => { window.open(wa, "_blank") }, 300)
    }
  }, [wa, whatsappOpened])

  // Countdown → auto-return home
  useEffect(() => {
    if (countdown <= 0) {
      router.push("/")
      return
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, router])

  return (
    <main className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-start p-6 pt-12 text-center" dir="rtl">

      {/* Success icon */}
      <div className="relative mb-5">
        <div className="w-24 h-24 rounded-full bg-[#1e5631]/10 flex items-center justify-center">
          <CheckCircle className="h-12 w-12 text-[#1e5631]" strokeWidth={1.5} />
        </div>
        <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center">
          <CheckCircle className="h-4 w-4 text-white" strokeWidth={2.5} />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-1">تم تأكيد طلبك!</h1>
      <p className="text-muted-foreground text-sm mb-5">سيفتح واتساب تلقائياً لإتمام الطلب</p>

      {/* WhatsApp status */}
      <div className="w-full max-w-sm bg-[#25D366]/10 border border-[#25D366]/25 rounded-2xl p-4 mb-4 text-right">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0">
            <MessageCircle className="h-5 w-5 text-white fill-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-[#1e5631] text-sm">✓ جاري فتح واتساب...</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              سيتم إرسال تفاصيل طلبك للمتجر
            </p>
          </div>
        </div>
      </div>

      {/* Manual open button in case auto-open is blocked */}
      {wa && (
        <a
          href={wa}
          className="w-full max-w-sm py-3.5 bg-[#25D366] text-white rounded-full font-bold text-base text-center block mb-5 flex items-center justify-center gap-2"
        >
          <MessageCircle className="h-5 w-5 fill-white" />
          افتح واتساب يدوياً
        </a>
      )}

      {/* Order summary */}
      <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-sm mb-5 text-right space-y-3.5">
        {name && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amal-grey flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">الاسم</p>
              <p className="font-semibold text-foreground">{name}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amal-grey flex items-center justify-center flex-shrink-0">
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">نوع الطلب</p>
            <p className="font-semibold text-foreground">
              {isPickup ? "🏪 استلام من المحل" : `🚚 توصيل إلى ${area}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amal-yellow-light flex items-center justify-center flex-shrink-0">
            <Clock className="h-4 w-4 text-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              {isPickup ? "وقت الاستلام" : "وقت التسليم"}
            </p>
            <p className="font-semibold text-foreground">{time}</p>
          </div>
        </div>

        {total && (
          <div className="pt-3 border-t border-border flex justify-between items-center">
            <span className="text-xl font-bold text-[#1e5631]">{total} ريال</span>
            <span className="text-muted-foreground font-medium">الإجمالي</span>
          </div>
        )}
      </div>

      <Link
        href="/"
        className="w-full max-w-sm py-4 bg-foreground text-background rounded-full font-bold text-lg text-center block mb-4"
      >
        العودة للقائمة
      </Link>

      <p className="text-sm text-muted-foreground">
        سيتم توجيهك تلقائياً خلال{" "}
        <span className="font-bold text-foreground">{countdown}</span> ثانية
      </p>
    </main>
  )
}

export default function ConfirmationPage() {
  return (
    <Suspense>
      <ConfirmationContent />
    </Suspense>
  )
}