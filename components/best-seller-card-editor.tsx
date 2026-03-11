"use client"

import { useMemo, useState } from "react"
import { Check, Loader2, RotateCcw, Save } from "lucide-react"
import { ProductCard } from "@/components/product-card"
import { useBestSellerCardConfig } from "@/hooks/use-best-seller-card-config"
import { useBestSellersConfig } from "@/hooks/use-best-sellers-config"
import { useMenu } from "@/hooks/use-menu"
import {
  DEFAULT_BEST_SELLER_CARD_CONFIG,
  normalizeBestSellerCardConfig,
  type BestSellerCardConfig,
} from "@/lib/best-seller-card-config"
import { getBestSellerCandidates } from "@/lib/best-sellers"

function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = "",
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  suffix?: string
  onChange: (nextValue: number) => void
}) {
  return (
    <label className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-[#ef4b86]"
      />
    </label>
  )
}

export function BestSellerCardEditor() {
  const { config, loading, error, saveConfig } = useBestSellerCardConfig()
  const { orderIds } = useBestSellersConfig()
  const { menuItems } = useMenu()
  const [draft, setDraft] = useState<BestSellerCardConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const current = draft ?? config
  const previewItem = useMemo(() => getBestSellerCandidates(menuItems, orderIds)[0] ?? menuItems[0] ?? null, [menuItems, orderIds])

  function update<K extends keyof BestSellerCardConfig>(key: K, value: BestSellerCardConfig[K]) {
    setDraft((prev) => normalizeBestSellerCardConfig({ ...(prev ?? current), [key]: value }))
    setSaved(false)
    setSaveError(null)
  }

  async function handleSave() {
    const next = normalizeBestSellerCardConfig(current)
    setSaving(true)
    setSaveError(null)
    try {
      await saveConfig(next)
      setSaved(true)
      setDraft(null)
      window.setTimeout(() => setSaved(false), 1800)
    } catch (err) {
      const message = err instanceof Error ? err.message : "تعذر حفظ إعدادات البطاقة."
      setSaveError(message)
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    setDraft(DEFAULT_BEST_SELLER_CARD_CONFIG)
    setSaved(false)
    setSaveError(null)
  }

  if (loading) {
    return <div className="h-64 rounded-2xl bg-gray-100 animate-pulse" />
  }

  return (
    <div className="space-y-5" dir="rtl">
      <section className="sticky top-[5.5rem] z-20 rounded-2xl border border-gray-200 bg-white p-4 space-y-4 shadow-[0_12px_28px_rgba(15,23,42,0.08)] md:static md:shadow-none">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-900">بطاقة الأكثر طلبًا</h3>
            <p className="mt-1 text-sm text-gray-500">تحكم في التدرج، أماكن العناصر، والأحجام لبطاقة أفضل المبيعات.</p>
          </div>
          {draft ? <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">تغييرات غير محفوظة</span> : null}
        </div>

        <div className="rounded-[28px] border border-dashed border-gray-200 bg-[#faf8f6] p-3">
          {previewItem ? (
            <div className="mx-auto max-w-xl">
              <div className="mx-auto h-[275px] w-full overflow-hidden md:h-auto">
                <div className="origin-top scale-[0.64] sm:scale-[0.78] md:scale-100">
                  <ProductCard
                    item={previewItem}
                    onSelect={() => {}}
                    priority
                    bestSellerStyle="s2"
                    bestSellerCardConfig={current}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-gray-100 px-4 py-10 text-center text-sm text-gray-500">
              لا توجد أصناف كافية للمعاينة الآن.
            </div>
          )}
        </div>

        {saveError || error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {saveError || error}
          </div>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-3">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700"
          >
            <RotateCcw className="h-4 w-4" />
            القيم الأصلية
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(null)
              setSaved(false)
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700"
          >
            إلغاء التعديلات
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#ef4b86] px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saving ? "جارٍ الحفظ..." : saved ? "تم الحفظ" : "حفظ"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-4">
        <h4 className="text-sm font-bold text-gray-900">التدرج والشفافية</h4>
        <SliderField label="شفافية بداية التدرج" value={Math.round(current.overlay_lead_alpha * 100)} min={0} max={40} suffix="%" onChange={(value) => update("overlay_lead_alpha", value / 100)} />
        <SliderField label="شفافية منتصف التدرج" value={Math.round(current.overlay_mid_alpha * 100)} min={20} max={90} suffix="%" onChange={(value) => update("overlay_mid_alpha", value / 100)} />
        <SliderField label="شفافية نهاية التدرج" value={Math.round(current.overlay_end_alpha * 100)} min={60} max={100} suffix="%" onChange={(value) => update("overlay_end_alpha", value / 100)} />
        <SliderField label="مكان بداية التركيز" value={current.overlay_mid_stop_percent} min={40} max={72} suffix="%" onChange={(value) => update("overlay_mid_stop_percent", value)} />
        <SliderField label="مكان نهاية التركيز" value={current.overlay_end_stop_percent} min={58} max={92} suffix="%" onChange={(value) => update("overlay_end_stop_percent", value)} />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-4">
        <h4 className="text-sm font-bold text-gray-900">أماكن العناصر</h4>
        <SliderField label="عرض مساحة النص" value={current.content_width_percent} min={30} max={62} suffix="%" onChange={(value) => update("content_width_percent", value)} />
        <SliderField label="إزاحة المحتوى من اليمين" value={current.content_right_px} min={8} max={48} suffix="px" onChange={(value) => update("content_right_px", value)} />
        <SliderField label="موضع مجموعة المحتوى عموديًا" value={current.content_top_percent} min={28} max={72} suffix="%" onChange={(value) => update("content_top_percent", value)} />
        <SliderField label="مسافة الاسم عن الوصف" value={current.title_description_gap_px} min={4} max={28} suffix="px" onChange={(value) => update("title_description_gap_px", value)} />
        <SliderField label="مسافة الوصف عن السعر" value={current.description_price_gap_px} min={6} max={36} suffix="px" onChange={(value) => update("description_price_gap_px", value)} />
        <SliderField label="مسافة السعر عن المقاسات" value={current.price_sizes_gap_px} min={6} max={40} suffix="px" onChange={(value) => update("price_sizes_gap_px", value)} />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-4">
        <h4 className="text-sm font-bold text-gray-900">الأحجام</h4>
        <SliderField label="ارتفاع البطاقة" value={current.card_height} min={280} max={520} suffix="px" onChange={(value) => update("card_height", value)} />
        <SliderField label="استدارة البطاقة" value={current.card_radius} min={16} max={48} suffix="px" onChange={(value) => update("card_radius", value)} />
        <SliderField label="حجم اسم الصنف" value={current.title_size_px} min={24} max={52} suffix="px" onChange={(value) => update("title_size_px", value)} />
        <SliderField label="حجم الوصف" value={current.description_size_px} min={12} max={24} suffix="px" onChange={(value) => update("description_size_px", value)} />
        <SliderField label="حجم السعر" value={current.price_size_px} min={20} max={40} suffix="px" onChange={(value) => update("price_size_px", value)} />
        <SliderField label="حجم دوائر المقاسات" value={current.size_dot_px} min={24} max={56} suffix="px" onChange={(value) => update("size_dot_px", value)} />
        <SliderField label="حجم نص المقاسات" value={current.size_label_px} min={10} max={20} suffix="px" onChange={(value) => update("size_label_px", value)} />
      </section>
    </div>
  )
}
