"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronLeft, ImageIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PriceWithRiyalLogo } from "@/components/ui/price-with-riyal-logo"
import { useDeliveryAreas } from "@/hooks/use-delivery-areas"
import {
  CATERING_SWEETS,
  CATERING_TIERS,
  getSweetAddonPrice,
  validateMainDishes,
  validateSides,
  validateSweet,
  type CateringSideSelection,
  type CateringTier,
} from "@/lib/catering"

type View = "landing" | "tiers" | "step1" | "step2" | "step3" | "success"

const STEP_LABELS = ["الباقة والأطباق", "تفاصيل المناسبة", "إتمام الطلب"]

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center justify-center gap-2" dir="rtl">
      {STEP_LABELS.map((label, index) => {
        const stepNumber = index + 1
        const active = stepNumber === step
        const done = stepNumber < step
        return (
          <div key={label} className="flex items-center gap-2">
            {index > 0 && <div className="h-px w-6 bg-border sm:w-10" />}
            <div className="flex flex-col items-center gap-1">
              <div
                aria-current={active ? "step" : undefined}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  active || done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : stepNumber}
              </div>
              <span className="max-w-[4.5rem] text-center text-[11px] leading-tight text-muted-foreground">{label}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function GalleryPlaceholder({ caption }: { caption: string }) {
  return (
    <div className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/40 p-4 text-center">
      <ImageIcon className="h-8 w-8 text-muted-foreground/60" />
      <p className="text-xs text-muted-foreground">{caption}</p>
    </div>
  )
}

function TierCard({ tier, onSelect }: { tier: CateringTier; onSelect: () => void }) {
  const highlighted = tier.highlighted
  return (
    <div
      className={`relative flex flex-col gap-4 rounded-3xl border p-6 ${
        highlighted ? "border-transparent bg-foreground text-background shadow-xl" : "border-border bg-card text-foreground"
      }`}
    >
      {highlighted && (
        <span className="absolute -top-3 right-6 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
          الأكثر طلبًا
        </span>
      )}
      <div>
        <h3 className="text-lg font-black">{tier.label}</h3>
        <p className={`text-sm ${highlighted ? "text-background/70" : "text-muted-foreground"}`}>
          تكفي {tier.guestMin}–{tier.guestMax} ضيف
        </p>
      </div>
      <p className="text-3xl font-black">
        <PriceWithRiyalLogo value={tier.price.toLocaleString("ar-SA")} />
      </p>
      <ul className="flex flex-1 flex-col gap-2 text-sm">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check className={`mt-0.5 h-4 w-4 shrink-0 ${highlighted ? "text-primary" : "text-primary"}`} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        onClick={onSelect}
        className={`h-11 rounded-full font-bold ${highlighted ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}`}
        variant={highlighted ? "default" : "outline"}
      >
        اختر هذه الباقة
      </Button>
    </div>
  )
}

function OpenSidePicker({
  sideRule,
  selectedItems,
  onToggle,
}: {
  sideRule: Extract<CateringTier["sideRule"], { type: "open" }>
  selectedItems: string[]
  onToggle: (name: string) => void
}) {
  return (
    <section className="mb-6">
      <h3 className="mb-1 text-sm font-bold text-foreground">
        اختر من {sideRule.min} إلى {sideRule.max} مقبلات وسلطات ({selectedItems.length})
      </h3>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {sideRule.pool.map((dish) => (
          <DishChip
            key={dish.name}
            label={dish.name}
            selected={selectedItems.includes(dish.name)}
            disabled={selectedItems.length >= sideRule.max}
            onToggle={() => onToggle(dish.name)}
          />
        ))}
      </div>
    </section>
  )
}

function DishChip({ label, selected, disabled, onToggle }: { label: string; selected: boolean; disabled?: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled && !selected}
      className={`flex items-center justify-between gap-2 rounded-xl border px-4 py-3 text-right text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        selected ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-foreground hover:bg-muted/60"
      }`}
    >
      <span>{label}</span>
      {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
    </button>
  )
}

interface CateringFormState {
  mainDishes: string[]
  sideSelection: CateringSideSelection
  sweet: string | null
  guestCount: string
  eventDate: string
  deliveryArea: string
  customerName: string
  customerPhone: string
  notes: string
}

const EMPTY_FORM: CateringFormState = {
  mainDishes: [],
  sideSelection: {},
  sweet: null,
  guestCount: "",
  eventDate: "",
  deliveryArea: "",
  customerName: "",
  customerPhone: "",
  notes: "",
}

export function CateringFlow() {
  const router = useRouter()
  const { areas: deliveryAreas } = useDeliveryAreas()
  const [view, setView] = useState<View>("landing")
  const [tier, setTier] = useState<CateringTier | null>(null)
  const [form, setForm] = useState<CateringFormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [orderNumber, setOrderNumber] = useState<number | null>(null)

  function selectTier(nextTier: CateringTier) {
    setTier(nextTier)
    setForm(EMPTY_FORM)
    setView("step1")
  }

  function toggleMainDish(name: string) {
    if (!tier) return
    setForm((prev) => {
      const already = prev.mainDishes.includes(name)
      if (already) return { ...prev, mainDishes: prev.mainDishes.filter((d) => d !== name) }
      if (prev.mainDishes.length >= tier.mainDishCount) return prev
      return { ...prev, mainDishes: [...prev.mainDishes, name] }
    })
  }

  function toggleSideItem(name: string) {
    if (!tier || tier.sideRule.type !== "open") return
    const { max } = tier.sideRule
    setForm((prev) => {
      const items = prev.sideSelection.items ?? []
      const already = items.includes(name)
      if (already) return { ...prev, sideSelection: { items: items.filter((d) => d !== name) } }
      if (items.length >= max) return prev
      return { ...prev, sideSelection: { items: [...items, name] } }
    })
  }

  const mainDishError = tier ? validateMainDishes(tier, form.mainDishes) : null
  const sidesError = tier ? validateSides(tier, form.sideSelection) : null
  const sweetError = tier ? validateSweet(tier, form.sweet) : null
  const step1Valid = !mainDishError && !sidesError && !sweetError

  const step2Valid = Boolean(form.guestCount) && Number(form.guestCount) > 0 && Boolean(form.eventDate) && Boolean(form.deliveryArea)

  const sweetAddonPrice = tier ? getSweetAddonPrice(tier, form.sweet) : 0
  const total = tier ? tier.price + sweetAddonPrice : 0

  const sideSummaryNames = useMemo(() => {
    if (!tier) return []
    if (tier.sideRule.type === "guided") {
      return [form.sideSelection.appetizer, form.sideSelection.salad].filter((v): v is string => Boolean(v))
    }
    return form.sideSelection.items ?? []
  }, [tier, form.sideSelection])

  async function handleSubmit() {
    if (!tier) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const response = await fetch("/api/catering", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tierId: tier.id,
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          guestCount: Number(form.guestCount),
          eventDate: form.eventDate,
          deliveryArea: form.deliveryArea,
          mainDishes: form.mainDishes,
          sideSelection: form.sideSelection,
          sweet: form.sweet,
          notes: form.notes,
        }),
      })
      const data = (await response.json()) as { orderNumber?: number; error?: string }
      if (!response.ok || !data.orderNumber) {
        setSubmitError(data.error || "تعذر إرسال الطلب، حاول مرة أخرى")
        return
      }
      setOrderNumber(data.orderNumber)
      setView("success")
    } catch {
      setSubmitError("تعذر إرسال الطلب، تحقق من الاتصال وحاول مرة أخرى")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="text-right">
          <p className="text-lg font-black text-foreground">أمل سناك</p>
        </div>
        <p className="text-sm font-semibold text-muted-foreground">تجهيزات المناسبات والكاترينج</p>
      </header>

      {view === "landing" && (
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="flex flex-col items-center gap-5 text-center">
            <span className="rounded-full bg-accent px-4 py-1.5 text-sm font-bold text-accent-foreground">كاترينج المناسبات</span>
            <h1 className="text-3xl font-black leading-tight text-foreground sm:text-4xl">
              تُحضّر بحب
              <br />
              لمناسباتك
            </h1>
            <p className="max-w-md text-muted-foreground">
              باقات كاترينج جاهزة لأي مناسبة — اختر باقتك، خصص أطباقك، وسنتولى الباقي حتى تسليم الطلب.
            </p>
            <Button
              type="button"
              onClick={() => setView("tiers")}
              className="h-12 rounded-full bg-primary px-8 text-base font-bold text-primary-foreground hover:bg-primary/90"
            >
              ابدأ بتصميم باقتك
            </Button>
          </div>

          <div className="mt-14">
            <h2 className="mb-4 text-center text-lg font-bold text-foreground">من مناسباتنا</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <GalleryPlaceholder key={i} caption="صورة حقيقية من إحدى مناسباتنا" />
              ))}
            </div>
          </div>
        </div>
      )}

      {view === "tiers" && (
        <div className="mx-auto max-w-5xl px-4 py-10">
          <button
            type="button"
            onClick={() => setView("landing")}
            className="mb-6 flex items-center gap-1 text-sm font-semibold text-muted-foreground"
          >
            <ChevronLeft className="h-4 w-4 rotate-180" />
            رجوع
          </button>
          <h2 className="mb-8 text-center text-2xl font-black text-foreground">اختر باقتك</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {CATERING_TIERS.map((t) => (
              <TierCard key={t.id} tier={t} onSelect={() => selectTier(t)} />
            ))}
          </div>
        </div>
      )}

      {tier && view === "step1" && (
        <div className="mx-auto max-w-2xl px-4 py-8">
          <button type="button" onClick={() => setView("tiers")} className="mb-4 flex items-center gap-1 text-sm font-semibold text-muted-foreground">
            <ChevronLeft className="h-4 w-4 rotate-180" />
            رجوع
          </button>
          <div className="mb-8">
            <StepIndicator step={1} />
          </div>
          <h2 className="mb-1 text-xl font-black text-foreground">تفاصيل المناسبة — خطوة 1 من 3</h2>
          <p className="mb-6 text-sm text-muted-foreground">{tier.label}</p>

          <section className="mb-6">
            <h3 className="mb-1 text-sm font-bold text-foreground">
              اختر {tier.mainDishCount} أطباق رئيسية ({form.mainDishes.length} من {tier.mainDishCount})
            </h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {tier.mainDishPool.map((dish) => (
                <DishChip
                  key={dish.name}
                  label={dish.name}
                  selected={form.mainDishes.includes(dish.name)}
                  disabled={form.mainDishes.length >= tier.mainDishCount}
                  onToggle={() => toggleMainDish(dish.name)}
                />
              ))}
            </div>
          </section>

          {tier.sideRule.type === "guided" ? (
            <>
              <section className="mb-6">
                <h3 className="mb-1 text-sm font-bold text-foreground">اختر مقبلًا واحدًا</h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {tier.sideRule.appetizerPool.map((dish) => (
                    <DishChip
                      key={dish.name}
                      label={dish.name}
                      selected={form.sideSelection.appetizer === dish.name}
                      onToggle={() =>
                        setForm((prev) => ({ ...prev, sideSelection: { ...prev.sideSelection, appetizer: dish.name } }))
                      }
                    />
                  ))}
                </div>
              </section>
              <section className="mb-6">
                <h3 className="mb-1 text-sm font-bold text-foreground">اختر سلطة واحدة</h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {tier.sideRule.saladPool.map((dish) => (
                    <DishChip
                      key={dish.name}
                      label={dish.name}
                      selected={form.sideSelection.salad === dish.name}
                      onToggle={() => setForm((prev) => ({ ...prev, sideSelection: { ...prev.sideSelection, salad: dish.name } }))}
                    />
                  ))}
                </div>
              </section>
            </>
          ) : (
            <OpenSidePicker
              sideRule={tier.sideRule}
              selectedItems={form.sideSelection.items ?? []}
              onToggle={toggleSideItem}
            />
          )}

          <section className="mb-8">
            <h3 className="mb-1 text-sm font-bold text-foreground">
              {tier.sweetsMode === "included" ? "اختر صنف حلا (ضمن الباقة، مجانًا)" : "إضافة حلا (اختياري)"}
            </h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {CATERING_SWEETS.map((dish) => {
                const selected = form.sweet === dish.name
                const priceLabel = tier.sweetsMode === "included" ? "مجانًا" : `+${dish.price} ريال`
                return (
                  <DishChip
                    key={dish.name}
                    label={`${dish.name} (${priceLabel})`}
                    selected={selected}
                    onToggle={() => setForm((prev) => ({ ...prev, sweet: selected && tier.sweetsMode !== "included" ? null : dish.name }))}
                  />
                )
              })}
            </div>
          </section>

          <Button
            type="button"
            disabled={!step1Valid}
            onClick={() => setView("step2")}
            className="h-12 w-full rounded-full bg-primary text-base font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
          >
            التالي
          </Button>
        </div>
      )}

      {tier && view === "step2" && (
        <div className="mx-auto max-w-2xl px-4 py-8">
          <button type="button" onClick={() => setView("step1")} className="mb-4 flex items-center gap-1 text-sm font-semibold text-muted-foreground">
            <ChevronLeft className="h-4 w-4 rotate-180" />
            رجوع
          </button>
          <div className="mb-8">
            <StepIndicator step={2} />
          </div>
          <h2 className="mb-6 text-xl font-black text-foreground">تفاصيل المناسبة — خطوة 2 من 3</h2>

          <div className="space-y-5">
            <div>
              <Label htmlFor="guest-count">عدد الضيوف</Label>
              <Input
                id="guest-count"
                type="number"
                min={1}
                value={form.guestCount}
                onChange={(e) => setForm((prev) => ({ ...prev, guestCount: e.target.value }))}
                className="mt-1"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                النطاق المقترح لهذه الباقة: {tier.guestMin}–{tier.guestMax} ضيف
              </p>
            </div>

            <div>
              <Label htmlFor="event-date">تاريخ المناسبة</Label>
              <Input
                id="event-date"
                type="date"
                value={form.eventDate}
                onChange={(e) => setForm((prev) => ({ ...prev, eventDate: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="delivery-area">منطقة التوصيل</Label>
              <Select value={form.deliveryArea} onValueChange={(value) => setForm((prev) => ({ ...prev, deliveryArea: value }))}>
                <SelectTrigger id="delivery-area" className="mt-1">
                  <SelectValue placeholder="اختر منطقة التوصيل" />
                </SelectTrigger>
                <SelectContent>
                  {deliveryAreas.map((area) => (
                    <SelectItem key={area.id} value={area.name}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="customer-name">الاسم</Label>
                <Input
                  id="customer-name"
                  value={form.customerName}
                  onChange={(e) => setForm((prev) => ({ ...prev, customerName: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="customer-phone">رقم الجوال</Label>
                <Input
                  id="customer-phone"
                  type="tel"
                  dir="ltr"
                  value={form.customerPhone}
                  onChange={(e) => setForm((prev) => ({ ...prev, customerPhone: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">ملاحظات إضافية (اختياري)</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <Button
            type="button"
            disabled={!step2Valid}
            onClick={() => setView("step3")}
            className="mt-8 h-12 w-full rounded-full bg-primary text-base font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
          >
            التالي
          </Button>
        </div>
      )}

      {tier && view === "step3" && (
        <div className="mx-auto max-w-2xl px-4 py-8">
          <button type="button" onClick={() => setView("step2")} className="mb-4 flex items-center gap-1 text-sm font-semibold text-muted-foreground">
            <ChevronLeft className="h-4 w-4 rotate-180" />
            رجوع
          </button>
          <div className="mb-8">
            <StepIndicator step={3} />
          </div>
          <h2 className="mb-6 text-xl font-black text-foreground">مراجعة الطلب — خطوة 3 من 3</h2>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-lg font-black text-foreground">
                <PriceWithRiyalLogo value={total.toLocaleString("ar-SA")} />
              </span>
              <span className="font-bold text-foreground">{tier.label}</span>
            </div>

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">الأطباق الرئيسية</dt>
                <dd className="text-right font-medium text-foreground">{form.mainDishes.join("، ")}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">مقبلات وسلطات</dt>
                <dd className="text-right font-medium text-foreground">{sideSummaryNames.join("، ")}</dd>
              </div>
              {form.sweet && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">حلا</dt>
                  <dd className="text-right font-medium text-foreground">
                    {form.sweet}
                    {sweetAddonPrice > 0 ? ` (+${sweetAddonPrice} ريال)` : ""}
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">عدد الضيوف</dt>
                <dd className="font-medium text-foreground">{form.guestCount}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">تاريخ المناسبة</dt>
                <dd className="font-medium text-foreground">{form.eventDate}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">منطقة التوصيل</dt>
                <dd className="font-medium text-foreground">{form.deliveryArea}</dd>
              </div>
            </dl>

            <p className="mt-4 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
              السعر النهائي والإضافات تؤكد عبر واتساب حسب تفاصيل مناسبتك
            </p>
          </div>

          {submitError && <p className="mt-4 text-sm font-medium text-destructive">{submitError}</p>}

          <Button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="mt-6 h-12 w-full rounded-full bg-primary text-base font-bold text-primary-foreground hover:bg-primary/90"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "إرسال الطلب"}
          </Button>
        </div>
      )}

      {view === "success" && (
        <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
            <Check className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-black text-foreground">تم استلام طلبك</h2>
          {orderNumber && <p className="text-sm text-muted-foreground">رقم الطلب: #{orderNumber}</p>}
          <p className="text-sm text-muted-foreground">سنتواصل معك عبر واتساب قريبًا لتأكيد تفاصيل الطلب والدفع.</p>
          <Button
            type="button"
            onClick={() => router.push("/")}
            className="mt-2 h-12 rounded-full bg-foreground px-8 text-base font-bold text-background hover:bg-foreground/90"
          >
            العودة للصفحة الرئيسية
          </Button>
        </div>
      )}
    </div>
  )
}
