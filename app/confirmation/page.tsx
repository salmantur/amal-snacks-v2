"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle, Clock, MapPin, ShoppingBag } from "lucide-react"

function ConfirmationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [countdown, setCountdown] = useState(10)

  const name = searchParams.get("name") || ""
  const area = searchParams.get("area") || ""
  const total = searchParams.get("total") || ""
  const type = searchParams.get("type") || "delivery"
  const time = searchParams.get("time") || "في أقرب وقت"
  const isPickup = type === "pickup"

  // Auto redirect to home after 10 seconds
  useEffect(() => {
    if (countdown <= 0) {
      router.push("/")
      return
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, router])

  return (
    <main className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center p-6 text-center" dir="rtl">
      {/* Success icon */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-[#1e5631]/10 flex items-center justify-center">
          <CheckCircle className="h-12 w-12 text-[#1e5631]" strokeWidth={1.5} />
        </div>
        <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-[#25D366] flex items-center justify-center">
          <span className="text-white text-xs font-bold">✓</span>
        </div>
      </div>

      <h1 className="text-3xl font-bold text-foreground mb-2">تم إرسال طلبك!</h1>
      <p className="text-muted-foreground mb-8">
        تم فتح واتساب لإتمام الطلب. سنتواصل معك قريباً.
      </p>

      {/* Order summary card */}
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-sm mb-6 text-right space-y-4">
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
              {isPickup ? "استلام من المحل" : `توصيل إلى ${area}`}
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

      {/* Actions */}
      <Link
        href="/"
        className="w-full max-w-sm py-4 bg-foreground text-background rounded-full font-bold text-lg text-center block mb-3"
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
