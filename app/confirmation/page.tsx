"use client"

import { useEffect, useMemo, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle, Clock, MapPin, ShoppingBag, MessageCircle, Copy, Pencil } from "lucide-react"

function getWhatsAppData(rawWa: string) {
  if (!rawWa) return { waNumberUrl: "", text: "" }

  try {
    const url = new URL(rawWa)
    const textParam = url.searchParams.get("text") || ""
    const decodedText = decodeURIComponent(textParam)
    return {
      waNumberUrl: `${url.origin}${url.pathname}`,
      text: decodedText,
    }
  } catch {
    return { waNumberUrl: "https://wa.me/", text: "" }
  }
}

function ConfirmationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [countdown, setCountdown] = useState(15)
  const [whatsappOpened, setWhatsappOpened] = useState(false)
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [showEditor, setShowEditor] = useState(false)

  const name = searchParams.get("name") || ""
  const area = searchParams.get("area") || ""
  const total = searchParams.get("total") || ""
  const type = searchParams.get("type") || "delivery"
  const time = searchParams.get("time") || "في أقرب وقت"
  const wa = searchParams.get("wa") || ""
  const isPickup = type === "pickup"

  const { waNumberUrl, text: initialText } = useMemo(() => getWhatsAppData(wa), [wa])
  const [messageText, setMessageText] = useState(initialText)

  useEffect(() => {
    setMessageText(initialText)
  }, [initialText])

  const finalWaUrl = useMemo(() => {
    if (!waNumberUrl || !messageText.trim()) return ""
    return `${waNumberUrl}?text=${encodeURIComponent(messageText)}`
  }, [waNumberUrl, messageText])

  const showFeedback = (msg: string) => {
    setFeedback(msg)
    window.setTimeout(() => setFeedback((prev) => (prev === msg ? null : prev)), 1600)
  }

  useEffect(() => {
    if (countdown <= 0) {
      router.push("/")
      return
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, router])

  const orderSummary = useMemo(() => {
    const lines = [
      `الاسم: ${name || "-"}`,
      `نوع الطلب: ${isPickup ? "استلام من المحل" : `توصيل إلى ${area || "-"}`}`,
      `${isPickup ? "وقت الاستلام" : "وقت التسليم"}: ${time || "في أقرب وقت"}`,
      `الإجمالي: ${total ? `${total} ﷼` : "-"}`,
    ]
    return lines.join("\n")
  }, [name, isPickup, area, time, total])

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(orderSummary)
      setCopied(true)
      showFeedback("تم نسخ ملخص الطلب")
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      showFeedback("تعذر النسخ، حاول مرة أخرى")
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-start p-6 pt-12 text-center" dir="rtl">
      <div className="relative mb-5">
        <div className="w-24 h-24 rounded-full bg-[#1e5631]/10 flex items-center justify-center">
          <CheckCircle className="h-12 w-12 text-[#1e5631]" strokeWidth={1.5} />
        </div>
        <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center">
          <CheckCircle className="h-4 w-4 text-white" strokeWidth={2.5} />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-1">تم تأكيد طلبك!</h1>
      <p className="text-[#4b5563] text-base mb-5">اضغط زر واتساب لإرسال الطلب</p>

      {feedback ? (
        <div className="w-full max-w-sm rounded-2xl border border-[#1e5631]/20 bg-[#1e5631]/10 text-[#1e5631] text-sm font-medium px-4 py-3 mb-4 animate-in fade-in slide-in-from-top-1 duration-300">
          {feedback}
        </div>
      ) : null}

      <div className="w-full max-w-sm bg-[#25D366]/10 border border-[#25D366]/25 rounded-2xl p-4 mb-4 text-right">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0">
            <MessageCircle className="h-5 w-5 text-white fill-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-[#1e5631] text-sm">جاهز للإرسال عبر واتساب</p>
            <p className="text-sm text-[#4b5563] mt-0.5">يمكنك التعديل فقط إذا احتجت</p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-sm mb-4">
        <a
          href={finalWaUrl || "#"}
          onClick={() => setWhatsappOpened(true)}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3.5 bg-[#25D366] text-white rounded-full font-bold text-base text-center block flex items-center justify-center gap-2"
        >
          <MessageCircle className="h-5 w-5 fill-white" />
          {whatsappOpened ? "فتح واتساب مرة أخرى" : "إرسال عبر واتساب"}
        </a>

        <button
          type="button"
          onClick={() => setShowEditor((prev) => !prev)}
          className="mt-2 w-full py-3 rounded-full bg-white text-foreground border border-border font-medium text-sm flex items-center justify-center gap-2"
        >
          <Pencil className="h-4 w-4" />
          {showEditor ? "إخفاء تعديل الرسالة" : "تعديل الرسالة (اختياري)"}
        </button>
      </div>

      {showEditor ? (
        <div className="w-full max-w-sm bg-white rounded-3xl p-4 shadow-sm mb-4 text-right">
          <label className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            نص الرسالة
          </label>
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            rows={7}
            className="w-full rounded-2xl bg-[#f5f5f5] p-3 text-sm leading-6 focus:outline-none focus:ring-2 focus:ring-[#25D366]/30 resize-none"
          />
          <p className="text-sm text-[#4b5563] mt-2">بعد التعديل اضغط زر واتساب بالأعلى</p>
        </div>
      ) : null}

      <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-sm mb-5 text-right space-y-3.5">
        {name ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amal-grey flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-[#4b5563]">الاسم</p>
              <p className="font-semibold text-foreground">{name}</p>
            </div>
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amal-grey flex items-center justify-center flex-shrink-0">
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm text-[#4b5563]">نوع الطلب</p>
            <p className="font-semibold text-foreground">{isPickup ? "استلام من المحل" : `توصيل إلى ${area}`}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amal-yellow-light flex items-center justify-center flex-shrink-0">
            <Clock className="h-4 w-4 text-foreground" />
          </div>
          <div>
            <p className="text-sm text-[#4b5563]">{isPickup ? "وقت الاستلام" : "وقت التسليم"}</p>
            <p className="font-semibold text-foreground">{time}</p>
          </div>
        </div>

        {total ? (
          <div className="pt-3 border-t border-border flex justify-between items-center">
            <span className="text-xl font-bold text-[#1e5631]">{total} ﷼</span>
            <span className="text-[#4b5563] font-medium">الإجمالي</span>
          </div>
        ) : null}

        <button
          onClick={handleCopySummary}
          className="w-full mt-2 py-3 rounded-full bg-[#f5f5f5] text-foreground font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <Copy className="h-4 w-4" />
          {copied ? "تم النسخ" : "نسخ ملخص الطلب"}
        </button>
      </div>

      <Link
        href="/"
        className="w-full max-w-sm py-4 bg-foreground text-background rounded-full font-bold text-lg text-center block mb-4"
      >
        العودة للقائمة
      </Link>

      <p className="text-base text-[#4b5563]">
        سيتم توجيهك تلقائيًا خلال <span className="font-bold text-foreground">{countdown}</span> ثانية
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
