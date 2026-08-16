"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Check, ChevronLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PriceWithRiyalLogo } from "@/components/ui/price-with-riyal-logo"
import { useDeliveryAreas } from "@/hooks/use-delivery-areas"
import {
  CATERING_SWEETS,
  getCateringDishImageUrl,
  getSweetAddonPrice,
  validateMainDishes,
  validateSides,
  validateSweet,
  type CateringDish,
  type CateringSideSelection,
  type CateringTier,
} from "@/lib/catering"

type View = "step1" | "step2" | "step3" | "success"

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

function OpenSidePicker({
  sideRule,
  selectedItems,
  onToggle,
}: {
  sideRule: CateringTier["sideRule"]
  selectedItems: string[]
  onToggle: (name: string) => void
}) {
  return (
    <section className="mb-6">
      <h3 className="mb-1 text-sm font-bold text-foreground">
        {sideRule.min === sideRule.max
          ? `اختر ${sideRule.min} مقبلات وسلطات (${selectedItems.length} من ${sideRule.max})`
          : `اختر من ${sideRule.min} إلى ${sideRule.max} مقبلات وسلطات (${selectedItems.length})`}
      </h3>
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {sideRule.pool.map((dish) => (
          <DishChip
            key={dish.name}
            dish={dish}
            selected={selectedItems.includes(dish.name)}
            disabled={selectedItems.length >= sideRule.max}
            onToggle={() => onToggle(dish.name)}
          />
        ))}
      </div>
    </section>
  )
}

function DishChip({
  dish,
  sublabel,
  selected,
  disabled,
  onToggle,
}: {
  dish: CateringDish
  sublabel?: string
  selected: boolean
  disabled?: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled && !selected}
      className={`overflow-hidden rounded-xl border text-center transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        selected ? "border-primary ring-2 ring-primary" : "border-border hover:border-foreground/20"
      }`}
    >
      <span className="relative block aspect-square w-full bg-muted">
        <Image src={getCateringDishImageUrl(dish)} alt={dish.name} fill sizes="(min-width: 640px) 150px, 30vw" className="object-cover" />
        {selected && (
          <span className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
            <Check className="h-3 w-3" />
          </span>
        )}
      </span>
      <span className="block bg-card px-1 py-1.5">
        <span className="block truncate text-[11px] font-bold leading-tight text-foreground sm:text-xs">{dish.name}</span>
        {sublabel && <span className="block truncate text-[10px] leading-tight text-muted-foreground">{sublabel}</span>}
      </span>
    </button>
  )
}

interface CateringFormState {
  mainDishes: string[]
  sideSelection: CateringSideSelection
  sweet: string | null
  eventDate: string
  deliveryTime: string
  deliveryArea: string
  customerName: string
  customerPhone: string
  notes: string
}

const EMPTY_FORM: CateringFormState = {
  mainDishes: [],
  sideSelection: { items: [] },
  sweet: null,
  eventDate: "",
  deliveryTime: "",
  deliveryArea: "",
  customerName: "",
  customerPhone: "",
  notes: "",
}

export function CateringBuilder({ tier }: { tier: CateringTier }) {
  const router = useRouter()
  const { areas: deliveryAreas } = useDeliveryAreas()
  const [view, setView] = useState<View>("step1")
  const [form, setForm] = useState<CateringFormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [orderNumber, setOrderNumber] = useState<number | null>(null)

  function toggleMainDish(name: string) {
    setForm((prev) => {
      const already = prev.mainDishes.includes(name)
      if (already) return { ...prev, mainDishes: prev.mainDishes.filter((d) => d !== name) }
      if (prev.mainDishes.length >= tier.mainDishCount) return prev
      return { ...prev, mainDishes: [...prev.mainDishes, name] }
    })
  }

  function toggleSideItem(name: string) {
    const { max } = tier.sideRule
    setForm((prev) => {
      const items = prev.sideSelection.items ?? []
      const already = items.includes(name)
      if (already) return { ...prev, sideSelection: { items: items.filter((d) => d !== name) } }
      if (items.length >= max) return prev
      return { ...prev, sideSelection: { items: [...items, name] } }
    })
  }

  const mainDishError = validateMainDishes(tier, form.mainDishes)
  const sidesError = validateSides(tier, form.sideSelection)
  const sweetError = validateSweet(form.sweet)
  const step1Valid = !mainDishError && !sidesError && !sweetError

  const step2Valid = Boolean(form.eventDate) && Boolean(form.deliveryTime) && Boolean(form.deliveryArea)

  const sweetAddonPrice = getSweetAddonPrice(form.sweet)
  const total = tier.price + sweetAddonPrice

  const sideSummaryNames = form.sideSelection.items ?? []

  async function handleSubmit() {
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
          eventDate: form.eventDate,
          deliveryTime: form.deliveryTime,
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

      {view === "step1" && (
        <div className="mx-auto max-w-2xl px-4 py-8">
          <button type="button" onClick={() => router.push("/catering")} className="mb-4 flex items-center gap-1 text-sm font-semibold text-muted-foreground">
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
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {tier.mainDishPool.map((dish) => (
                <DishChip
                  key={dish.name}
                  dish={dish}
                  selected={form.mainDishes.includes(dish.name)}
                  disabled={form.mainDishes.length >= tier.mainDishCount}
                  onToggle={() => toggleMainDish(dish.name)}
                />
              ))}
            </div>
          </section>

          <OpenSidePicker
            sideRule={tier.sideRule}
            selectedItems={form.sideSelection.items ?? []}
            onToggle={toggleSideItem}
          />

          <section className="mb-8">
            <h3 className="mb-1 text-sm font-bold text-foreground">إضافة حلا (اختياري)</h3>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {CATERING_SWEETS.map((dish) => {
                const selected = form.sweet === dish.name
                return (
                  <DishChip
                    key={dish.name}
                    dish={dish}
                    sublabel={`+${dish.price} ريال`}
                    selected={selected}
                    onToggle={() => setForm((prev) => ({ ...prev, sweet: selected ? null : dish.name }))}
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

      {view === "step2" && (
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <Label htmlFor="delivery-time">وقت التوصيل</Label>
                <Input
                  id="delivery-time"
                  type="time"
                  value={form.deliveryTime}
                  onChange={(e) => setForm((prev) => ({ ...prev, deliveryTime: e.target.value }))}
                  className="mt-1"
                />
              </div>
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

      {view === "step3" && (
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
                <dt className="text-muted-foreground">تاريخ المناسبة</dt>
                <dd className="font-medium text-foreground">{form.eventDate}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">وقت التوصيل</dt>
                <dd className="font-medium text-foreground">{form.deliveryTime}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">منطقة التوصيل</dt>
                <dd className="font-medium text-foreground">{form.deliveryArea}</dd>
              </div>
            </dl>

            <p className="mt-4 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
              الأدوات والتغليف غير مشمولة ضمن السعر — يمكن إضافتها عند التأكيد عبر واتساب. السعر النهائي والإضافات تؤكد عبر واتساب حسب تفاصيل مناسبتك
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
