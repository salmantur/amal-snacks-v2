"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import type { CartItem, DeliveryInfo } from "@/components/cart-provider"
import { TimePicker } from "@/components/time-picker"
import { PriceWithRiyalLogo } from "@/components/ui/price-with-riyal-logo"
import type { DeliveryArea } from "@/hooks/use-delivery-areas"

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

type ScreenPhase = "fulfillment" | "flow"
type FlowStep = 2 | 3

export interface DeliveryFlowEditorialProps {
  isPickup: boolean
  onSelectFulfillment: (method: "delivery" | "pickup") => void

  deliveryInfo: DeliveryInfo
  onNameChange: (v: string) => void
  onPhoneChange: (v: string) => void
  nameError?: string
  phoneError?: string

  deliveryAreas: DeliveryArea[]
  selectedArea: DeliveryArea | undefined
  onPickArea: (name: string) => void
  areaError?: string

  scheduledTime: string | null
  onScheduleChange: (value: string | null) => void
  minimumLeadTimeMinutes: number
  closedDates: string[]
  schedulePickerOpenSignal: number
  onOpenSchedulePicker: () => void
  deliveryAccuracyText: string
  scheduleError?: string

  step: FlowStep
  onGoToReview: () => void
  onGoToDetails: () => void
  missingCheckoutSteps: string[]
  actionFeedback: string | null

  items: CartItem[]
  totalPrice: number
  deliveryFee: number
  totalDiscount: number
  grandTotal: number
  isFinalTotalReady: boolean

  onConfirmOrder: () => void
  isSubmitting: boolean
  checkoutButtonLabel: string
  manualWhatsAppUrl: string | null
  checkoutIssue: { tone: "warning" | "error"; message: string } | null
  onDismissCheckoutIssue: () => void
}

function StepDots({ step, onBack }: { step: 1 | 2 | 3; onBack?: () => void }) {
  const dot = (active: boolean) => (
    <span className="h-2 w-2 rounded-full" style={{ background: active ? DF_INK : DF_DOT_INACTIVE }} />
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
      <span className="mr-auto whitespace-nowrap text-[11px] font-bold tracking-[1px]" style={{ color: DF_STEP_LABEL }}>
        خطوة {step} من 3
      </span>
    </div>
  )
}

function FulfillmentScreen({
  isPickup,
  onSelectFulfillment,
}: {
  isPickup: boolean
  onSelectFulfillment: (method: "delivery" | "pickup") => void
}) {
  const isDel = !isPickup
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
          onClick={() => onSelectFulfillment("delivery")}
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
          onClick={() => onSelectFulfillment("pickup")}
          className={blockBase}
          style={{ background: isPickup ? DF_ACCENT : DF_BLOCK_INACTIVE_BG }}
        >
          <div className="flex items-center justify-between">
            <svg width="34" height="32" viewBox="0 0 22 20" fill="none" style={{ color: isPickup ? "rgba(255,255,255,0.75)" : "oklch(75% 0.01 270)" }}>
              <path d="M2 8l1.5-6h15L20 8" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M2 8h18v10H2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M8 8v3a3 3 0 0 0 6 0V8" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            {check(isPickup)}
          </div>
          <h3 className="font-serif-text my-3.5 mb-1.5 text-right text-[20px] font-black" style={{ color: isPickup ? "#fff" : DF_INK }}>
            استلام من المحل
          </h3>
          <p className="m-0 text-right text-[12.5px] leading-[1.55]" style={{ color: isPickup ? "rgba(255,255,255,0.85)" : "oklch(52% 0.012 270)" }}>
            وفر رسوم التوصيل واستلم طلبك بنفسك
          </p>
        </div>
      </div>
      <div className="flex-shrink-0 px-6 pb-7 pt-2">
        <button
          type="button"
          onClick={() => onSelectFulfillment(isPickup ? "pickup" : "delivery")}
          className="h-[58px] w-full rounded-2xl border-none text-[15px] font-extrabold text-white"
          style={{ background: DF_ACCENT }}
        >
          الاستمرار ←
        </button>
      </div>
    </div>
  )
}

function DetailsScreen(props: DeliveryFlowEditorialProps & { onBack: () => void }) {
  const {
    deliveryInfo,
    onNameChange,
    onPhoneChange,
    nameError,
    phoneError,
    isPickup,
    deliveryAreas,
    selectedArea,
    onPickArea,
    areaError,
    scheduledTime,
    onOpenSchedulePicker,
    deliveryAccuracyText,
    scheduleError,
    missingCheckoutSteps,
    onGoToReview,
    onBack,
  } = props
  const [zonePickerOpen, setZonePickerOpen] = useState(false)

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
          <div>
            <input
              type="text"
              value={deliveryInfo.name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="الاسم الكامل"
              className="w-full border-0 bg-transparent px-0 pb-2.5 pt-1 text-right text-[15px] text-white outline-none"
              style={{ borderBottom: `1.5px solid ${nameError ? DF_ACCENT : DF_DARK_INPUT_BORDER}` }}
            />
            {nameError ? <p className="m-0 mt-1.5 text-right text-[11.5px] font-bold" style={{ color: DF_ACCENT }}>{nameError}</p> : null}
          </div>
          <div>
            <input
              type="tel"
              value={deliveryInfo.phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="رقم الجوال"
              dir="ltr"
              className="w-full border-0 bg-transparent px-0 pb-2.5 pt-1 text-right text-[15px] text-white outline-none"
              style={{ borderBottom: `1.5px solid ${phoneError ? DF_ACCENT : DF_DARK_INPUT_BORDER}` }}
            />
            {phoneError ? <p className="m-0 mt-1.5 text-right text-[11.5px] font-bold" style={{ color: DF_ACCENT }}>{phoneError}</p> : null}
          </div>
        </div>

        {!isPickup ? (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setZonePickerOpen((v) => !v)}
              className="flex w-full items-center justify-between rounded-[18px] bg-transparent px-5 py-4.5"
              style={{ border: `1.5px solid ${areaError ? DF_ACCENT : DF_BORDER}` }}
            >
              <span className="text-[20px]" style={{ color: DF_ACCENT }}>
                {zonePickerOpen ? "↓" : "←"}
              </span>
              <div className="text-right">
                <span className="mb-1 block text-[10.5px] font-extrabold uppercase tracking-[1.5px]" style={{ color: DF_STEP_LABEL }}>
                  02 — المنطقة
                </span>
                <span className="block text-[15px] font-extrabold" style={{ color: selectedArea ? DF_INK : DF_STEP_LABEL }}>
                  {selectedArea ? `${selectedArea.name} — ${selectedArea.price} ر.س` : "اختر منطقة التوصيل"}
                </span>
              </div>
            </button>
            {areaError ? <p className="m-0 px-1 text-right text-[11.5px] font-bold" style={{ color: DF_ACCENT }}>{areaError}</p> : null}
            {zonePickerOpen ? (
              <div className="max-h-[220px] overflow-y-auto rounded-[18px]" style={{ border: `1.5px solid ${DF_BORDER}` }}>
                {deliveryAreas.length === 0 ? (
                  <p className="m-0 px-5 py-4 text-right text-[13px]" style={{ color: DF_STEP_LABEL }}>
                    لا توجد مناطق متاحة حاليًا
                  </p>
                ) : (
                  deliveryAreas.map((area) => (
                    <button
                      key={area.id}
                      type="button"
                      onClick={() => {
                        onPickArea(area.name)
                        setZonePickerOpen(false)
                      }}
                      className="flex w-full items-center justify-between px-5 py-3.5 text-right"
                      style={{ borderBottom: `1px solid ${DF_DIVIDER}`, background: selectedArea?.id === area.id ? DF_BLOCK_INACTIVE_BG : "transparent" }}
                    >
                      <span className="text-[13px] font-bold" style={{ color: DF_ACCENT }}>
                        <PriceWithRiyalLogo value={area.price} />
                      </span>
                      <span className="text-[14px] font-bold" style={{ color: DF_INK }}>
                        {area.name}
                      </span>
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onOpenSchedulePicker}
            className="flex w-full items-center justify-between rounded-[18px] bg-transparent px-5 py-4.5"
            style={{ border: `1.5px solid ${scheduleError ? DF_ACCENT : DF_BORDER}` }}
          >
            <span className="text-[20px]" style={{ color: DF_ACCENT }}>
              ←
            </span>
            <div className="text-right">
              <span className="mb-1 block text-[10.5px] font-extrabold uppercase tracking-[1.5px]" style={{ color: DF_STEP_LABEL }}>
                03 — الموعد
              </span>
              <span className="block text-[15px] font-extrabold" style={{ color: scheduledTime ? DF_INK : DF_STEP_LABEL }}>
                {scheduledTime || "لا يوجد وقت محدد بعد"}
              </span>
            </div>
          </button>
          {scheduleError ? <p className="m-0 px-1 text-right text-[11.5px] font-bold" style={{ color: DF_ACCENT }}>{scheduleError}</p> : null}
        </div>
        <p className="m-0 px-1 text-right text-[11.5px]" style={{ color: DF_ACCENT }}>
          {deliveryAccuracyText}
        </p>

        {missingCheckoutSteps.length > 0 ? (
          <p className="m-0 px-1 text-right text-[11.5px]" style={{ color: DF_STEP_LABEL }}>
            أكمل هذه البيانات أولًا: {missingCheckoutSteps.join("، ")}
          </p>
        ) : null}
      </div>
      <div className="flex-shrink-0 px-6 pb-7 pt-2">
        <button
          type="button"
          onClick={onGoToReview}
          className="h-[58px] w-full rounded-2xl border-none text-[15px] font-extrabold text-white"
          style={{ background: DF_ACCENT }}
        >
          مراجعة الطلب ←
        </button>
      </div>
    </div>
  )
}

function ReviewScreen(props: DeliveryFlowEditorialProps & { onBack: () => void }) {
  const {
    isPickup,
    deliveryInfo,
    items,
    totalPrice,
    deliveryFee,
    totalDiscount,
    grandTotal,
    isFinalTotalReady,
    onConfirmOrder,
    isSubmitting,
    checkoutButtonLabel,
    manualWhatsAppUrl,
    checkoutIssue,
    onDismissCheckoutIssue,
    missingCheckoutSteps,
    onBack,
  } = props
  const methodSummary = isPickup ? "استلام من المحل" : "توصيل للمنزل"
  const contactSummary = `${deliveryInfo.name || "بدون اسم"} · ${deliveryInfo.phone || "بدون رقم"}`
  const scheduleSummary = deliveryInfo.scheduledTime || "لم يُحدَّد موعد بعد"

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
          <span
            className="text-right text-[12px]"
            style={{ color: deliveryInfo.scheduledTime ? "rgba(255,255,255,0.65)" : "oklch(70% 0.19 8)" }}
          >
            {scheduleSummary}
          </span>
        </div>

        <div className="flex flex-col gap-3.5 rounded-[18px] p-5" style={{ border: `1.5px solid ${DF_BORDER}` }}>
          <span className="text-right text-[10.5px] font-extrabold uppercase tracking-[1.5px]" style={{ color: DF_ACCENT }}>
            الطلب ({items.length})
          </span>
          {items.map((it) => (
            <div key={it.cartKey} className="flex items-center justify-between">
              <span className="text-[14px] font-bold" style={{ color: DF_INK }}>
                <PriceWithRiyalLogo value={it.price * it.quantity} />
              </span>
              <span className="text-[14px]" style={{ color: "oklch(40% 0.01 270)" }}>
                {it.name} {it.quantity > 1 ? `× ${it.quantity}` : ""}
              </span>
            </div>
          ))}
          <div className="my-0.5 h-px" style={{ background: DF_DIVIDER }} />
          {!isPickup && deliveryFee > 0 ? (
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold" style={{ color: "oklch(40% 0.01 270)" }}>
                <PriceWithRiyalLogo value={deliveryFee} />
              </span>
              <span className="text-[13px]" style={{ color: "oklch(52% 0.012 270)" }}>
                رسوم التوصيل
              </span>
            </div>
          ) : null}
          {totalDiscount > 0 ? (
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold" style={{ color: "oklch(55% 0.14 150)" }}>
                − <PriceWithRiyalLogo value={totalDiscount} />
              </span>
              <span className="text-[13px]" style={{ color: "oklch(52% 0.012 270)" }}>
                الخصم
              </span>
            </div>
          ) : null}
          <div className="flex items-center justify-between">
            <span className="font-serif-text text-[18px] font-black" style={{ color: DF_INK }}>
              {isFinalTotalReady ? <PriceWithRiyalLogo value={grandTotal} /> : <PriceWithRiyalLogo value={totalPrice} />}
            </span>
            <span className="text-[14px] font-bold" style={{ color: DF_INK }}>
              الإجمالي
            </span>
          </div>
        </div>

        {checkoutIssue ? (
          <div
            className="rounded-[16px] px-4 py-3 text-right"
            style={{
              background: checkoutIssue.tone === "error" ? "oklch(95% 0.03 25)" : "oklch(96% 0.03 80)",
              color: checkoutIssue.tone === "error" ? "oklch(45% 0.15 25)" : "oklch(45% 0.1 70)",
            }}
          >
            <p className="m-0 text-[12.5px] font-bold">{checkoutIssue.message}</p>
            <button type="button" onClick={onDismissCheckoutIssue} className="mt-2 border-none bg-transparent p-0 text-[11.5px] font-bold underline">
              إخفاء التنبيه
            </button>
          </div>
        ) : null}

        {manualWhatsAppUrl ? (
          <a
            href={manualWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center rounded-[16px] px-4 py-3 text-[13px] font-bold no-underline"
            style={{ background: "oklch(93% 0.08 150)", color: "oklch(35% 0.12 150)" }}
          >
            فتح واتساب يدويًا
          </a>
        ) : null}

        {missingCheckoutSteps.length > 0 ? (
          <p className="m-0 px-1 text-right text-[11.5px]" style={{ color: DF_STEP_LABEL }}>
            أكمل هذه البيانات أولًا: {missingCheckoutSteps.join("، ")}
          </p>
        ) : null}
      </div>
      <div className="flex-shrink-0 px-6 pb-7 pt-2">
        <button
          type="button"
          onClick={onConfirmOrder}
          disabled={isSubmitting}
          className="h-[58px] w-full rounded-2xl border-none text-[15px] font-extrabold text-white disabled:opacity-60"
          style={{ background: DF_ACCENT }}
        >
          {checkoutButtonLabel} ←
        </button>
      </div>
    </div>
  )
}

export function DeliveryFlowEditorial(props: DeliveryFlowEditorialProps) {
  const [phase, setPhase] = useState<ScreenPhase>("fulfillment")
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const handleSelectFulfillment = (method: "delivery" | "pickup") => {
    props.onSelectFulfillment(method)
    setPhase("flow")
  }

  // Confirm re-validates on click (a field can go stale between reaching review and
  // confirming — e.g. a selected delivery slot falling outside the live availability
  // window). If that happens while showing the review screen, the field-level error only
  // renders on the details screen, so bounce back there instead of leaving confirm looking
  // like a dead button with no visible feedback.
  useEffect(() => {
    if (phase === "flow" && props.step === 3 && props.missingCheckoutSteps.length > 0) {
      props.onGoToDetails()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, props.step, props.missingCheckoutSteps])

  return (
    <div dir="rtl" className="min-h-screen" style={{ background: DF_SURFACE }}>
      {props.actionFeedback ? (
        <div
          className="fixed inset-x-4 top-4 z-[300] mx-auto max-w-[398px] rounded-2xl px-4 py-3 text-center text-[13px] font-bold text-white shadow-lg animate-fade-in"
          style={{ background: DF_INK }}
          role="status"
          aria-live="polite"
        >
          {props.actionFeedback}
        </div>
      ) : null}
      <div className="relative mx-auto min-h-screen max-w-[430px] overflow-hidden">
        {phase === "fulfillment" ? (
          <FulfillmentScreen isPickup={props.isPickup} onSelectFulfillment={handleSelectFulfillment} />
        ) : props.step === 2 ? (
          <DetailsScreen {...props} onBack={() => setPhase("fulfillment")} />
        ) : (
          <ReviewScreen {...props} onBack={props.onGoToDetails} />
        )}
      </div>

      {/* Portaled to document.body: mounting TimePicker's dialog anywhere inside this tree
          traps its position:fixed modal inside an ancestor's local stacking context (Chromium
          promotes animated/opacity-transitioning ancestors to their own compositing layer),
          making it invisible or unclickable behind other screens despite z-index:200. A portal
          sidesteps that entirely. Real TimePicker drives value/slots/validation; its own
          trigger button is hidden (zero-size, plain overflow:hidden) since we open it via
          openSignal from our own "03 — الموعد" row instead. */}
      {mounted
        ? createPortal(
            <div style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
              <TimePicker
                value={props.scheduledTime}
                onChange={props.onScheduleChange}
                minMinutes={props.minimumLeadTimeMinutes}
                required={false}
                closedDates={props.closedDates}
                openSignal={props.schedulePickerOpenSignal}
              />
            </div>,
            document.body
          )
        : null}
    </div>
  )
}
