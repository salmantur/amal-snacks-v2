"use client"

import { useEffect, useState } from "react"
import { Check, Loader2, RotateCcw } from "lucide-react"
import { useCateringCardConfig } from "@/hooks/use-catering-card-config"
import { DEFAULT_CATERING_CARD_COLORS, type CateringCardColors } from "@/lib/catering-card-config"

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-admin-border-soft bg-admin-bg p-3">
      <div className="flex items-center gap-2.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-10 cursor-pointer rounded-lg border-0 bg-transparent"
        />
        <span className="text-sm font-medium text-admin-ink">{label}</span>
      </div>
      <span className="text-[11px] font-mono text-admin-muted-2">{value}</span>
    </div>
  )
}

function PreviewCard({
  colors,
  highlighted,
}: {
  colors: CateringCardColors
  highlighted: boolean
}) {
  return (
    <div
      className="relative w-full max-w-[220px] rounded-[20px] p-4"
      style={{
        background: highlighted ? colors.background_highlighted : colors.background,
        border: highlighted ? "none" : `1px solid ${colors.border}`,
      }}
      dir="rtl"
    >
      {highlighted ? (
        <span
          className="absolute -top-2.5 right-4 rounded-full px-2.5 py-1 text-[10px] font-extrabold text-white"
          style={{ background: colors.accent }}
        >
          الأكثر طلبًا
        </span>
      ) : null}
      <h3 className="text-[15px] font-extrabold" style={{ color: highlighted ? colors.text_highlighted : colors.text }}>
        باقة تجريبية
      </h3>
      <p className="mt-0.5 text-[11px]" style={{ color: highlighted ? colors.muted_text_highlighted : colors.muted_text }}>
        تكفي 20–30 ضيف
      </p>
      <p className="mt-2 text-[18px] font-black" style={{ color: highlighted ? colors.text_highlighted : colors.text }}>
        1٬890 ﷼
      </p>
      <div className="my-3 h-px" style={{ background: highlighted ? "rgba(255,255,255,.15)" : colors.border }} />
      <div className="flex flex-col gap-1.5">
        {["4 سخانات تختارها", "توصيل مجاني"].map((feature) => (
          <div
            key={feature}
            className="flex items-center gap-1.5 text-[11px]"
            style={{ color: highlighted ? colors.muted_text_highlighted : colors.muted_text }}
          >
            <Check className="h-3 w-3 flex-shrink-0" style={{ color: colors.accent }} />
            <span>{feature}</span>
          </div>
        ))}
      </div>
      <button
        type="button"
        disabled
        className="mt-3 block h-9 w-full rounded-full text-[12px] font-extrabold text-white"
        style={{ background: highlighted ? colors.accent : colors.background_highlighted }}
      >
        اختر هذه الباقة
      </button>
    </div>
  )
}

export function CateringCardColorEditor() {
  const { config, loading, saveConfig } = useCateringCardConfig()
  const [draft, setDraft] = useState<CateringCardColors | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const current = draft ?? config
  const dirty = Boolean(draft)

  useEffect(() => {
    setDraft(null)
    setSaved(false)
  }, [config])

  function update(patch: Partial<CateringCardColors>) {
    setDraft({ ...current, ...patch })
    setSaved(false)
  }

  async function handleSave() {
    if (!draft) return
    setSaving(true)
    await saveConfig(draft)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
    setDraft(null)
  }

  function handleReset() {
    setDraft(DEFAULT_CATERING_CARD_COLORS)
    setSaved(false)
  }

  if (loading) return <div className="h-48 animate-pulse rounded-2xl bg-admin-bg" />

  return (
    <div className="space-y-5" dir="rtl">
      {dirty ? (
        <div className="flex items-center justify-end">
          <span className="rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-600">تغييرات غير محفوظة</span>
        </div>
      ) : null}

      <section className="space-y-3 rounded-2xl border border-admin-border-soft bg-white p-4">
        <p className="text-sm font-bold text-admin-ink">معاينة حية</p>
        <div className="flex flex-wrap justify-center gap-4 rounded-xl bg-admin-bg p-4">
          <PreviewCard colors={current} highlighted={false} />
          <PreviewCard colors={current} highlighted />
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-admin-border-soft bg-white p-4">
        <p className="text-sm font-bold text-admin-ink">اللون المميز (الشارة، الأيقونات، الأزرار)</p>
        <ColorRow label="اللون المميز" value={current.accent} onChange={(color) => update({ accent: color })} />
      </section>

      <section className="space-y-3 rounded-2xl border border-admin-border-soft bg-white p-4">
        <p className="text-sm font-bold text-admin-ink">البطاقات العادية</p>
        <div className="space-y-2">
          <ColorRow label="لون الخلفية" value={current.background} onChange={(color) => update({ background: color })} />
          <ColorRow label="لون الإطار" value={current.border} onChange={(color) => update({ border: color })} />
          <ColorRow label="لون العنوان والسعر" value={current.text} onChange={(color) => update({ text: color })} />
          <ColorRow
            label="لون النص الثانوي"
            value={current.muted_text}
            onChange={(color) => update({ muted_text: color })}
          />
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-admin-border-soft bg-white p-4">
        <p className="text-sm font-bold text-admin-ink">البطاقة المميزة (الأكثر طلبًا)</p>
        <div className="space-y-2">
          <ColorRow
            label="لون الخلفية"
            value={current.background_highlighted}
            onChange={(color) => update({ background_highlighted: color })}
          />
          <ColorRow
            label="لون العنوان والسعر"
            value={current.text_highlighted}
            onChange={(color) => update({ text_highlighted: color })}
          />
          <ColorRow
            label="لون النص الثانوي"
            value={current.muted_text_highlighted}
            onChange={(color) => update({ muted_text_highlighted: color })}
          />
        </div>
      </section>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-2 rounded-xl bg-admin-bg px-4 py-3 text-sm font-medium text-admin-muted transition-transform active:scale-95"
        >
          <RotateCcw className="h-4 w-4" />
          استرجاع الافتراضي
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50"
          style={{ backgroundColor: saved ? "#166534" : current.accent }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {saved ? "تم الحفظ" : "حفظ الألوان"}
        </button>
      </div>
    </div>
  )
}
