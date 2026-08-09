"use client"

import { useMemo, useState, type ReactNode } from "react"
import { useCart } from "@/components/cart-provider"
import { PriceWithRiyalLogo } from "@/components/ui/price-with-riyal-logo"

const DF_ACCENT = "oklch(62% 0.19 8)"
const DF_INK = "oklch(16% 0.01 280)"
const DF_SURFACE = "oklch(99% 0.002 75)"
const DF_DOT_INACTIVE = "oklch(88% 0.01 270)"
const DF_STEP_LABEL = "oklch(60% 0.01 270)"
const DF_BLOCK_INACTIVE_BG = "oklch(96% 0.01 75)"
const DF_BORDER = "oklch(90% 0.01 270)"
const DF_DIVIDER = "oklch(92% 0.008 270)"
const DF_DARK_LABEL = "oklch(70% 0.02 60)"
const DF_DARK_INPUT_BORDER = "oklch(35% 0.01 280)"

type FulfillmentMethod = "delivery" | "pickup"
type Screen = "fulfillment" | "details" | "review"

function StepDots({ step, onBack }: { step: 1 | 2 | 3; onBack?: () => void }) {
  const dot = (active: boolean) => (
    <span
      className="h-2 w-2 rounded-full"
      style={{ background: active ? DF_INK : DF_DOT_INACTIVE }}
    />
  )
  return (
    <div className="flex flex-shrink-0 items-center gap-2.5 px-6 pb-4.5 pt-6.5">
      {onBack ? (
        <button type="button" onClick={onBack} aria-label="رجوع" className="border-none bg-transparent p-0">
          {dot(false)}
        </button>
      ) : (
        dot(step === 1)
      )}
      {dot(step === 2)}
      {dot(step === 3)}
      <span
        className="mr-auto whitespace-nowrap text-[11px] font-bold tracking-[1px]"
        style={{ color: DF_STEP_LABEL }}
      >
        خطوة {step} من 3
      </span>
    </div>
  )
}

function FulfillmentScreen({
  method,
  onSelectDelivery,
  onSelectPickup,
  onContinue,
}: {
  method: FulfillmentMethod
  onSelectDelivery: () => void
  onSelectPickup: () => void
  onContinue: () => void
}) {
  const isDel = method === "delivery"
  const isPick = method === "pickup"
  const blockBase = "cursor-pointer rounded-[20px] p-[22px] transition-colors duration-200"
  const check = (active: boolean) => (
    <span
      className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-[13px] font-black"
      style={
        active
          ? { background: "#fff", color: DF_ACCENT }
          : { background: "transparent", color: "transparent", boxShadow: `inset 0 0 0 1.5px ${DF_DOT_INACTIVE}` }
      }
    >
      ✓
    </span>
  )

  return (
    <div className="absolute inset-0 flex flex-col animate-fade-in" style={{ background: DF_SURFACE }}>
      <StepDots step={1} />
      <div className="flex-shrink-0 px-6 pb-2">
        <h1 className="font-serif-text m-0 text-right text-[32px] font-black leading-[1.1]" style={{ color: DF_INK }}>
          كيف تحب
          <br />
          تستلم طلبك؟
        </h1>
      </div>
      <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-6 pb-5 pt-5.5">
        <div
          onClick={onSelectDelivery}
          className={blockBase}
          style={{ background: isDel ? DF_ACCENT : DF_BLOCK_INACTIVE_BG }}
        >
          <div className="flex items-center justify-between">
            <svg width="38" height="32" viewBox="0 0 24 20" fill="none" style={{ color: isDel ? "rgba(255,255,255,0.75)" : "oklch(75% 0.01 270)" }}>
              <path d="M2 4h13v9H2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M15 8h4l3 3v2h-7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <circle cx="6" cy="16" r="2" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="18" cy="16" r="2" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            {check(isDel)}
          </div>
          <h3 className="font-serif-text my-3.5 mb-1.5 text-right text-[20px] font-black" style={{ color: isDel ? "#fff" : DF_INK }}>
            توصيل للمنزل
          </h3>
          <p className="m-0 text-right text-[12.5px] leading-[1.55]" style={{ color: isDel ? "rgba(255,255,255,0.85)" : "oklch(52% 0.012 270)" }}>
            يصلك الطلب إلى باب منزلك بأسرع وقت
          </p>
        </div>

        <div
          onClick={onSelectPickup}
          className={blockBase}
          style={{ background: isPick ? DF_ACCENT : DF_BLOCK_INACTIVE_BG }}
        >
          <div className="flex items-center justify-between">
            <svg width="34" height="32" viewBox="0 0 22 20" fill="none" style={{ color: isPick ? "rgba(255,255,255,0.75)" : "oklch(75% 0.01 270)" }}>
              <path d="M2 8l1.5-6h15L20 8" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M2 8h18v10H2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M8 8v3a3 3 0 0 0 6 0V8" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            {check(isPick)}
          </div>
          <h3 className="font-serif-text my-3.5 mb-1.5 text-right text-[20px] font-black" style={{ color: isPick ? "#fff" : DF_INK }}>
            استلام من المحل
          </h3>
          <p className="m-0 text-right text-[12.5px] leading-[1.55]" style={{ color: isPick ? "rgba(255,255,255,0.85)" : "oklch(52% 0.012 270)" }}>
            وفر رسوم التوصيل واستلم طلبك بنفسك
          </p>
        </div>
      </div>
      <div className="flex-shrink-0 px-6 pb-7 pt-2">
        <button
          type="button"
          onClick={onContinue}
          className="h-[58px] w-full rounded-2xl border-none text-[15px] font-extrabold text-white"
          style={{ background: DF_ACCENT }}
        >
          الاستمرار ←
        </button>
      </div>
    </div>
  )
}

function DetailsScreen({
  name,
  phone,
  onNameChange,
  onPhoneChange,
  zoneChosen,
  onPickZone,
  timeChosen,
  onPickTime,
  onBack,
  onContinue,
}: {
  name: string
  phone: string
  onNameChange: (v: string) => void
  onPhoneChange: (v: string) => void
  zoneChosen: boolean
  onPickZone: () => void
  timeChosen: boolean
  onPickTime: () => void
  onBack: () => void
  onContinue: () => void
}) {
  return (
    <div className="absolute inset-0 flex flex-col animate-fade-in" style={{ background: DF_SURFACE }}>
      <StepDots step={2} onBack={onBack} />
      <div className="flex-shrink-0 px-6 pb-5">
        <h1 className="font-serif-text m-0 text-right text-[28px] font-black leading-[1.15]" style={{ color: DF_INK }}>
          أخبرنا بالتفاصيل
        </h1>
      </div>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 pb-5">
        <div className="flex flex-col gap-4 rounded-[18px] p-5" style={{ background: DF_INK }}>
          <span className="text-right text-[10.5px] font-extrabold uppercase tracking-[1.5px]" style={{ color: DF_DARK_LABEL }}>
            01 — التواصل
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="الاسم الكامل"
            className="w-full border-0 bg-transparent px-0 pb-2.5 pt-1 text-right text-[15px] text-white outline-none"
            style={{ borderBottom: `1.5px solid ${DF_DARK_INPUT_BORDER}` }}
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="رقم الجوال"
            className="w-full border-0 bg-transparent px-0 pb-2.5 pt-1 text-right text-[15px] text-white outline-none"
            style={{ borderBottom: `1.5px solid ${DF_DARK_INPUT_BORDER}` }}
          />
        </div>

        <button
          type="button"
          onClick={onPickZone}
          className="flex w-full items-center justify-between rounded-[18px] bg-transparent px-5 py-4.5"
          style={{ border: `1.5px solid ${DF_BORDER}` }}
        >
          <span className="text-[20px]" style={{ color: DF_ACCENT }}>
            ←
          </span>
          <div className="text-right">
            <span className="mb-1 block text-[10.5px] font-extrabold uppercase tracking-[1.5px]" style={{ color: DF_STEP_LABEL }}>
              02 — المنطقة
            </span>
            <span className="block text-[15px] font-extrabold" style={{ color: zoneChosen ? DF_INK : DF_STEP_LABEL }}>
              {zoneChosen ? "حي النزهة، الرياض" : "اختر منطقة التوصيل"}
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={onPickTime}
          className="flex w-full items-center justify-between rounded-[18px] bg-transparent px-5 py-4.5"
          style={{ border: `1.5px solid ${DF_BORDER}` }}
        >
          <span className="text-[20px]" style={{ color: DF_ACCENT }}>
            ←
          </span>
          <div className="text-right">
            <span className="mb-1 block text-[10.5px] font-extrabold uppercase tracking-[1.5px]" style={{ color: DF_STEP_LABEL }}>
              03 — الموعد
            </span>
            <span className="block text-[15px] font-extrabold" style={{ color: DF_INK }}>
              {timeChosen ? "اليوم — من 4:00 إلى 5:00 م" : "لا يوجد وقت محدد بعد"}
            </span>
          </div>
        </button>
        <p className="m-0 px-1 text-right text-[11.5px]" style={{ color: DF_ACCENT }}>
          يفتح الساعة 3:00 م — سنؤكد الوقت بعد التحضير
        </p>
      </div>
      <div className="flex-shrink-0 px-6 pb-7 pt-2">
        <button
          type="button"
          onClick={onContinue}
          className="h-[58px] w-full rounded-2xl border-none text-[15px] font-extrabold text-white"
          style={{ background: DF_ACCENT }}
        >
          مراجعة الطلب ←
        </button>
      </div>
    </div>
  )
}

function ReviewScreen({
  methodSummary,
  contactSummary,
  reviewItems,
  totalLabel,
  onBack,
  onConfirm,
}: {
  methodSummary: string
  contactSummary: string
  reviewItems: { name: string; priceLabel: string }[]
  totalLabel: ReactNode
  onBack: () => void
  onConfirm: () => void
}) {
  return (
    <div className="absolute inset-0 flex flex-col animate-fade-in" style={{ background: DF_SURFACE }}>
      <StepDots step={3} onBack={onBack} />
      <div className="flex-shrink-0 px-6 pb-5">
        <h1 className="font-serif-text m-0 text-right text-[28px] font-black leading-[1.15]" style={{ color: DF_INK }}>
          راجع طلبك قبل التأكيد
        </h1>
      </div>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 pb-5">
        <div className="flex flex-col gap-2.5 rounded-[18px] p-5" style={{ background: DF_INK }}>
          <span className="text-right text-[10.5px] font-extrabold uppercase tracking-[1.5px]" style={{ color: DF_DARK_LABEL }}>
            طريقة الاستلام
          </span>
          <div className="flex items-center justify-between">
            <span className="text-[13px]" style={{ color: "oklch(70% 0.19 8)" }}>
              ←
            </span>
            <span className="text-[15px] font-extrabold text-white">{methodSummary}</span>
          </div>
          <span className="text-right text-[12px]" style={{ color: "rgba(255,255,255,0.65)" }}>
            {contactSummary}
          </span>
        </div>

        <div className="flex flex-col gap-3.5 rounded-[18px] p-5" style={{ border: `1.5px solid ${DF_BORDER}` }}>
          <span className="text-right text-[10.5px] font-extrabold uppercase tracking-[1.5px]" style={{ color: DF_ACCENT }}>
            الطلب
          </span>
          {reviewItems.map((it, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-[14px] font-bold" style={{ color: DF_INK }}>
                {it.priceLabel}
              </span>
              <span className="text-[14px]" style={{ color: "oklch(40% 0.01 270)" }}>
                {it.name}
              </span>
            </div>
          ))}
          <div className="my-0.5 h-px" style={{ background: DF_DIVIDER }} />
          <div className="flex items-center justify-between">
            <span className="font-serif-text text-[18px] font-black" style={{ color: DF_INK }}>
              {totalLabel}
            </span>
            <span className="text-[14px] font-bold" style={{ color: DF_INK }}>
              الإجمالي
            </span>
          </div>
        </div>
      </div>
      <div className="flex-shrink-0 px-6 pb-7 pt-2">
        <button
          type="button"
          onClick={onConfirm}
          className="h-[58px] w-full rounded-2xl border-none text-[15px] font-extrabold text-white"
          style={{ background: DF_ACCENT }}
        >
          تأكيد الطلب ←
        </button>
      </div>
    </div>
  )
}

export function DeliveryFlowEditorialPreview() {
  const { items, totalPrice, deliveryInfo, setDeliveryInfo } = useCart()
  const [screen, setScreen] = useState<Screen>("fulfillment")
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>("delivery")
  const [zoneChosen, setZoneChosen] = useState(false)
  const [timeChosen, setTimeChosen] = useState(false)

  const isDel = fulfillmentMethod === "delivery"
  const methodSummary = isDel ? "توصيل للمنزل" : "استلام من المحل"
  const contactSummary = `${deliveryInfo.name || "بدون اسم"} · ${deliveryInfo.phone || "بدون رقم"}`

  const reviewItems = useMemo(
    () =>
      items.length > 0
        ? items.map((it) => ({ name: it.name, priceLabel: `${it.price * it.quantity} ر.س` }))
        : [
            { name: "تمر محشي فاخر", priceLabel: "420 ر.س" },
            { name: "ميني ساندوتش (25 قطعة)", priceLabel: "100 ر.س" },
          ],
    [items]
  )
  const totalLabel = items.length > 0 ? <PriceWithRiyalLogo value={totalPrice} /> : "520 ر.س"

  return (
    <div dir="rtl" className="min-h-screen" style={{ background: DF_SURFACE }}>
      <div className="relative mx-auto min-h-screen max-w-[430px] overflow-hidden">
        {screen === "fulfillment" ? (
          <FulfillmentScreen
            method={fulfillmentMethod}
            onSelectDelivery={() => setFulfillmentMethod("delivery")}
            onSelectPickup={() => setFulfillmentMethod("pickup")}
            onContinue={() => setScreen("details")}
          />
        ) : null}
        {screen === "details" ? (
          <DetailsScreen
            name={deliveryInfo.name}
            phone={deliveryInfo.phone}
            onNameChange={(v) => setDeliveryInfo({ ...deliveryInfo, name: v })}
            onPhoneChange={(v) => setDeliveryInfo({ ...deliveryInfo, phone: v })}
            zoneChosen={zoneChosen}
            onPickZone={() => setZoneChosen(true)}
            timeChosen={timeChosen}
            onPickTime={() => setTimeChosen(true)}
            onBack={() => setScreen("fulfillment")}
            onContinue={() => setScreen("review")}
          />
        ) : null}
        {screen === "review" ? (
          <ReviewScreen
            methodSummary={methodSummary}
            contactSummary={contactSummary}
            reviewItems={reviewItems}
            totalLabel={totalLabel}
            onBack={() => setScreen("details")}
            onConfirm={() => setScreen("fulfillment")}
          />
        ) : null}
      </div>
    </div>
  )
}
