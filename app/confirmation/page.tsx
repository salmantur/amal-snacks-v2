"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Copy,
  MapPin,
  MessageCircle,
  Pencil,
  ShoppingBag,
} from "lucide-react"
import { PriceWithRiyalLogo } from "@/components/ui/price-with-riyal-logo"
import { cn } from "@/lib/utils"

function getWhatsAppData(rawWa: string) {
  if (!rawWa) return { waNumberUrl: "", text: "" }

  try {
    const url = new URL(rawWa)
    const textParam = url.searchParams.get("text") || ""
    return {
      waNumberUrl: `${url.origin}${url.pathname}`,
      text: decodeURIComponent(textParam),
    }
  } catch {
    return { waNumberUrl: "", text: "" }
  }
}

function isLikelyIOSDevice() {
  if (typeof navigator === "undefined") return false
  return /iPad|iPhone|iPod/i.test(navigator.userAgent)
}

function ConfirmationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [countdown, setCountdown] = useState(20)
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [whatsAppOpened, setWhatsAppOpened] = useState(false)

  const name = searchParams.get("name") || ""
  const area = searchParams.get("area") || ""
  const totalValue = Number(searchParams.get("total") || 0)
  const discountValue = Number(searchParams.get("discount") || 0)
  const couponCode = searchParams.get("code") || ""
  const type = searchParams.get("type") || "delivery"
  const time = searchParams.get("time") || "غير محدد"
  const rawWa = searchParams.get("wa") || ""
  const isPickup = type === "pickup"

  const { waNumberUrl, text: initialText } = useMemo(
    () => getWhatsAppData(rawWa),
    [rawWa],
  )
  const [messageText, setMessageText] = useState(initialText)

  useEffect(() => {
    setMessageText(initialText)
  }, [initialText])

  const finalWaUrl = useMemo(() => {
    if (!waNumberUrl || !messageText.trim()) return ""
    return `${waNumberUrl}?text=${encodeURIComponent(messageText)}`
  }, [messageText, waNumberUrl])

  const showFeedback = (message: string) => {
    setFeedback(message)
    window.setTimeout(
      () => setFeedback((current) => (current === message ? null : current)),
      1800,
    )
  }

  useEffect(() => {
    if (countdown <= 0) {
      router.push("/")
      return
    }

    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [countdown, router])

  const orderSummary = useMemo(() => {
    const lines = [
      `الاسم: ${name || "-"}`,
      `نوع الطلب: ${isPickup ? "استلام من المحل" : `توصيل إلى ${area || "-"}`}`,
      `${isPickup ? "وقت الاستلام" : "موعد التوصيل"}: ${time || "-"}`,
      discountValue > 0
        ? `الخصم: ${discountValue}${couponCode ? ` (${couponCode})` : ""}`
        : null,
      `الإجمالي: ${totalValue > 0 ? `${totalValue} ريال` : "-"}`,
    ]

    return lines.filter(Boolean).join("\n")
  }, [area, couponCode, discountValue, isPickup, name, time, totalValue])

  const handleOpenWhatsApp = () => {
    if (!finalWaUrl) {
      showFeedback("تعذر تجهيز رابط واتساب")
      return
    }

    setWhatsAppOpened(true)

    if (isLikelyIOSDevice()) {
      window.location.href = finalWaUrl
      return
    }

    window.open(finalWaUrl, "_blank", "noopener,noreferrer")
  }

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(orderSummary)
      setCopied(true)
      showFeedback("تم نسخ ملخص الطلب")
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      showFeedback("تعذر النسخ، حاول مرة أخرى")
    }
  }

  return (
    <main
      className="min-h-screen bg-[radial-gradient(circle_at_top,_#f4fbf6,_#eef3f7_46%,_#e4ebf2_100%)] px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-8"
      dir="rtl"
    >
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="text-right">
              <p className="text-xs font-semibold tracking-[0.2em] text-[#1f8f48]">
                ORDER READY
              </p>
              <h1 className="mt-2 text-[1.9rem] font-black tracking-tight text-[#0f172a]">
                تم تجهيز طلبك
              </h1>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                بقيت خطوة واحدة فقط: افتح واتساب وأرسل الرسالة الجاهزة.
              </p>
            </div>

            <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-[1.4rem] bg-[#25D366]/12 text-[#1f8f48]">
              <CheckCircle2 className="h-9 w-9" strokeWidth={1.7} />
              <span className="absolute -bottom-1 -left-1 rounded-full bg-[#25D366] px-2 py-0.5 text-[10px] font-black text-white">
                DONE
              </span>
            </div>
          </div>

          {feedback ? (
            <div className="mt-4 rounded-2xl border border-[#25D366]/20 bg-[#25D366]/10 px-4 py-3 text-right text-sm font-semibold text-[#1f8f48]">
              {feedback}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
              <Clock3 className="h-3.5 w-3.5" />
              عودة تلقائية خلال {countdown} ثانية
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#25D366]/10 px-3 py-1.5 text-xs font-semibold text-[#1f8f48]">
              <MessageCircle className="h-3.5 w-3.5" />
              {whatsAppOpened ? "تم فتح واتساب" : "جاهز للإرسال"}
            </span>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/78 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div className="text-right">
              <h2 className="text-lg font-black text-slate-900">
                ملخص الطلب
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                راجع المعلومات بسرعة قبل الإرسال.
              </p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {isPickup ? "استلام" : "توصيل"}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {name ? (
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-slate-500">
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-500">الاسم</p>
                  <p className="font-bold text-slate-900">{name}</p>
                </div>
              </div>
            ) : null}

            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-white text-slate-500">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-500">نوع الطلب</p>
                <p className="font-bold text-slate-900">
                  {isPickup ? "استلام من المحل" : `توصيل إلى ${area || "-"}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[#fff6df] text-[#8a6400]">
                <Clock3 className="h-4 w-4" />
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-500">
                  {isPickup ? "وقت الاستلام" : "موعد التوصيل"}
                </p>
                <p className="font-bold text-slate-900">{time}</p>
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-[#25D366]/15 bg-[linear-gradient(135deg,rgba(37,211,102,0.12),rgba(255,255,255,0.8))] px-4 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-slate-900">الإجمالي النهائي</span>
                <PriceWithRiyalLogo
                  value={totalValue}
                  className="text-lg font-black text-[#1f8f48]"
                />
              </div>
              {discountValue > 0 ? (
                <p className="mt-2 text-right text-xs font-semibold text-green-700">
                  تم تطبيق خصم بقيمة {discountValue}
                  {couponCode ? ` عبر الكود ${couponCode}` : ""}
                </p>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopySummary}
            className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-700 transition-transform active:scale-[0.99]"
          >
            <Copy className="h-4 w-4" />
            {copied ? "تم النسخ" : "نسخ ملخص الطلب"}
          </button>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/78 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div className="text-right">
              <h2 className="text-lg font-black text-slate-900">
                رسالة واتساب
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                عدل الرسالة فقط إذا احتجت قبل الإرسال.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowEditor((value) => !value)}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-slate-100 px-4 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200"
            >
              <Pencil className="h-3.5 w-3.5" />
              {showEditor ? "إخفاء" : "تعديل"}
            </button>
          </div>

          {showEditor ? (
            <div className="mt-4">
              <textarea
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
                rows={8}
                className="w-full resize-none rounded-[1.6rem] border border-slate-200 bg-slate-50 p-3 text-right text-sm leading-7 text-slate-700 outline-none transition-colors focus:border-[#25D366]/35 focus:bg-white"
              />
            </div>
          ) : (
            <div className="mt-4 rounded-[1.6rem] bg-slate-50 p-3 text-right text-sm leading-7 text-slate-600">
              {messageText || "سيظهر نص الرسالة هنا"}
            </div>
          )}

          <button
            type="button"
            onClick={handleOpenWhatsApp}
            disabled={!finalWaUrl}
            className={cn(
              "mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-full text-base font-black text-white shadow-[0_18px_36px_rgba(37,211,102,0.26)] transition-transform active:scale-[0.99]",
              finalWaUrl
                ? "bg-[#25D366]"
                : "cursor-not-allowed bg-[#25D366]/60",
            )}
          >
            <MessageCircle className="h-5 w-5 fill-white" />
            {whatsAppOpened ? "فتح واتساب مرة أخرى" : "إرسال الطلب عبر واتساب"}
          </button>
        </section>

        <Link
          href="/"
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-4 text-base font-black text-white"
        >
          العودة للقائمة
          <ChevronLeft className="h-4 w-4" />
        </Link>
      </div>
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
