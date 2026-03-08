"use client"

import { useState } from "react"
import { Check, Copy, Loader2, RotateCcw, Sparkles } from "lucide-react"
import { PriceWithRiyalLogo } from "@/components/ui/price-with-riyal-logo"
import { DEFAULT_THEME, useThemeConfig, type ThemeConfig } from "@/hooks/use-theme-config"

type ThemePreset = {
  id: string
  name: string
  description: string
  config: Partial<ThemeConfig>
}

const BUTTON_COLORS: { label: string; color: string }[] = [
  { label: "وردي", color: "#f0526a" },
  { label: "أحمر", color: "#ef4444" },
  { label: "برتقالي", color: "#f97316" },
  { label: "ذهبي", color: "#ca8a04" },
  { label: "أخضر", color: "#16a34a" },
  { label: "زيتي", color: "#1e5631" },
  { label: "فيروزي", color: "#0d9488" },
  { label: "أزرق", color: "#3b82f6" },
  { label: "نيلي", color: "#6366f1" },
  { label: "بنفسجي", color: "#8b5cf6" },
  { label: "رمادي غامق", color: "#374151" },
  { label: "أسود", color: "#111827" },
]

const BG_COLORS: { label: string; color: string }[] = [
  { label: "أبيض", color: "#ffffff" },
  { label: "رمادي فاتح", color: "#f5f5f5" },
  { label: "كريمي", color: "#fef9f0" },
  { label: "بيج", color: "#fdf6e3" },
  { label: "وردي ناعم", color: "#fff1f4" },
  { label: "خوخي", color: "#fff4ed" },
  { label: "أزرق ناعم", color: "#eff6ff" },
  { label: "نعناعي", color: "#ecfdf5" },
  { label: "أصفر ناعم", color: "#fefce8" },
  { label: "زيتي ناعم", color: "#f7fee7" },
]

const TEXT_COLORS: { label: string; color: string }[] = [
  { label: "أبيض", color: "#ffffff" },
  { label: "أسود", color: "#111827" },
  { label: "رمادي داكن", color: "#1f2937" },
  { label: "رمادي", color: "#374151" },
]

const PRESETS: ThemePreset[] = [
  {
    id: "default",
    name: "الهوية الحالية",
    description: "ألوان أمل سناك الحالية",
    config: DEFAULT_THEME,
  },
  {
    id: "elegant",
    name: "راقي هادئ",
    description: "أبيض + ذهبي + أخضر داكن",
    config: {
      primary: "#ca8a04",
      primary_foreground: "#ffffff",
      secondary: "#f3f4f6",
      secondary_foreground: "#111827",
      destructive: "#dc2626",
      destructive_foreground: "#ffffff",
      checkout_green: "#1e5631",
      background: "#ffffff",
      bar_background: "#f8fafc",
    },
  },
  {
    id: "warm",
    name: "دافئ شهّي",
    description: "خوخي + برتقالي",
    config: {
      primary: "#f97316",
      primary_foreground: "#ffffff",
      secondary: "#ffedd5",
      secondary_foreground: "#7c2d12",
      destructive: "#dc2626",
      destructive_foreground: "#ffffff",
      checkout_green: "#166534",
      background: "#fff4ed",
      bar_background: "#ffedd5",
    },
  },
  {
    id: "fresh",
    name: "منعش",
    description: "نعناعي + أخضر",
    config: {
      primary: "#16a34a",
      primary_foreground: "#ffffff",
      secondary: "#dcfce7",
      secondary_foreground: "#14532d",
      destructive: "#dc2626",
      destructive_foreground: "#ffffff",
      checkout_green: "#0f766e",
      background: "#ecfdf5",
      bar_background: "#dcfce7",
    },
  },
  {
    id: "premium",
    name: "بريميوم",
    description: "فحمي + ذهبي",
    config: {
      primary: "#1f2937",
      primary_foreground: "#ffffff",
      secondary: "#e5e7eb",
      secondary_foreground: "#111827",
      destructive: "#ef4444",
      destructive_foreground: "#ffffff",
      checkout_green: "#ca8a04",
      background: "#f9fafb",
      bar_background: "#e5e7eb",
    },
  },
]

function isLight(hex: string): boolean {
  const r = Number.parseInt(hex.slice(1, 3), 16)
  const g = Number.parseInt(hex.slice(3, 5), 16)
  const b = Number.parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 155
}

function Swatch({
  label,
  color,
  selected,
  onClick,
}: {
  label: string
  color: string
  selected: boolean
  onClick: () => void
}) {
  const light = isLight(color)
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-xl p-1.5 border transition-all active:scale-95"
      style={{ borderColor: selected ? color : "#e5e7eb", backgroundColor: selected ? "#f8fafc" : "#ffffff" }}
      title={`${label} - ${color}`}
    >
      <div
        className="h-9 rounded-lg flex items-center justify-center"
        style={{
          backgroundColor: color,
          boxShadow: selected ? `0 0 0 2px ${color}` : "0 1px 2px rgba(0,0,0,0.15)",
        }}
      >
        {selected ? <Check className="h-3.5 w-3.5" style={{ color: light ? "#111827" : "#ffffff" }} /> : null}
      </div>
      <p className="text-[10px] mt-1 text-gray-500 truncate">{label}</p>
    </button>
  )
}

function ColorBlock({
  title,
  value,
  palette,
  onChange,
}: {
  title: string
  value: string
  palette: { label: string; color: string }[]
  onChange: (value: string) => void
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-gray-800">{title}</p>
        <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-2 py-1">
          <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: value }} />
          <span className="text-[11px] font-mono text-gray-500">{value}</span>
        </div>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {palette.map((item) => (
          <Swatch
            key={`${title}-${item.color}`}
            label={item.label}
            color={item.color}
            selected={item.color.toLowerCase() === value.toLowerCase()}
            onClick={() => onChange(item.color)}
          />
        ))}
      </div>

      <div className="flex items-center gap-3 bg-gray-50 rounded-xl border border-gray-200 p-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-10 rounded-lg border-0 bg-transparent cursor-pointer"
        />
        <p className="text-xs text-gray-500">اختيار لون مخصص</p>
      </div>
    </section>
  )
}

export function ThemeEditor() {
  const { config, loading, saveConfig } = useThemeConfig()
  const [draft, setDraft] = useState<ThemeConfig | null>(null)
  const [tab, setTab] = useState<"main" | "background" | "cards">("main")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const current = draft ?? config
  const trayDesign = current.tray_variant_design === "floating_3" ? "floating_3" : "design_c"
  const dirty = Boolean(draft)

  function applyDraft(next: ThemeConfig) {
    setDraft(next)
    setSaved(false)
    import("@/hooks/use-theme-config").then((m) => m.applyTheme(next))
  }

  function update(patch: Partial<ThemeConfig>) {
    applyDraft({ ...current, ...patch })
  }

  function applyPreset(preset: ThemePreset) {
    applyDraft({ ...current, ...preset.config })
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
    applyDraft(DEFAULT_THEME)
  }

  if (loading) return <div className="h-48 rounded-2xl bg-gray-100 animate-pulse" />

  return (
    <div className="space-y-5" dir="rtl">
      <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-gray-800">معاينة فورية</p>
          {dirty ? <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">تغييرات غير محفوظة</span> : null}
        </div>

        <div className="rounded-2xl border border-gray-200 overflow-hidden" style={{ backgroundColor: current.background }}>
          <div className="h-10 px-3 flex items-center justify-between border-b border-black/5" style={{ backgroundColor: current.bar_background }}>
            <span className="text-xs text-gray-500">الشريط العلوي</span>
            <span className="text-xs text-gray-500">بحث + تصنيفات</span>
          </div>
          <div className="p-3 space-y-3">
            <div className="rounded-full px-4 py-2 w-fit" style={{ backgroundColor: current.primary, color: current.primary_foreground }}>
              <span className="text-sm font-bold inline-flex items-center gap-1">
                السلة · <PriceWithRiyalLogo value={120} />
              </span>
            </div>
            <div className="rounded-xl px-4 py-2 w-fit text-sm font-bold" style={{ backgroundColor: current.checkout_green, color: "#ffffff" }}>
              تأكيد الطلب
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="rounded-xl px-4 py-2 text-sm font-bold" style={{ backgroundColor: current.secondary, color: current.secondary_foreground }}>
                زر ثانوي
              </div>
              <div className="rounded-xl px-4 py-2 text-sm font-bold" style={{ backgroundColor: current.destructive, color: current.destructive_foreground }}>
                حذف
              </div>
            </div>
            <div
              className="rounded-2xl border border-gray-200 p-3"
              style={{ backgroundColor: current.item_card_background }}
            >
              <p className="text-sm font-bold" style={{ color: current.item_card_title }}>اسم الصنف</p>
              <p className="text-xs mt-1" style={{ color: current.item_card_description }}>وصف قصير للصنف يظهر هنا</p>
              <p className="text-sm font-bold mt-2" style={{ color: current.item_card_price }}>
                <PriceWithRiyalLogo value={75} />
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-gray-800">Tray Design</p>
          <span className="text-xs text-gray-500">Design C / Floating-3</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => update({ tray_variant_design: "design_c" })}
            className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
              trayDesign === "design_c"
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            DESIGN C
          </button>
          <button
            type="button"
            onClick={() => update({ tray_variant_design: "floating_3" })}
            className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
              trayDesign === "floating_3"
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            FLOATING-3
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
        <div className="flex items-center gap-2 text-gray-700">
          <Sparkles className="h-4 w-4" />
          <p className="text-sm font-bold">ثيمات جاهزة</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset)}
              className="text-right rounded-xl border border-gray-200 p-3 hover:border-gray-300 hover:bg-gray-50 transition-colors active:scale-[0.99]"
            >
              <p className="text-sm font-bold text-gray-800">{preset.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{preset.description}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-4">
        <div className="flex gap-2 rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setTab("main")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${tab === "main" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
          >
            ألوان الأزرار
          </button>
          <button
            type="button"
            onClick={() => setTab("background")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${tab === "background" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
          >
            الخلفيات
          </button>
          <button
            type="button"
            onClick={() => setTab("cards")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${tab === "cards" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
          >
            بطاقات المنتجات
          </button>
        </div>

        {tab === "main" ? (
          <div className="space-y-5">
            <ColorBlock title="لون زر السلة" value={current.primary} palette={BUTTON_COLORS} onChange={(color) => update({ primary: color })} />
            <ColorBlock
              title="لون نص زر السلة"
              value={current.primary_foreground}
              palette={TEXT_COLORS}
              onChange={(color) => update({ primary_foreground: color })}
            />
            <ColorBlock
              title="لون زر تأكيد الطلب"
              value={current.checkout_green}
              palette={BUTTON_COLORS}
              onChange={(color) => update({ checkout_green: color })}
            />
            <ColorBlock
              title="لون الأزرار الثانوية"
              value={current.secondary}
              palette={BG_COLORS}
              onChange={(color) => update({ secondary: color })}
            />
            <ColorBlock
              title="لون نص الأزرار الثانوية"
              value={current.secondary_foreground}
              palette={TEXT_COLORS}
              onChange={(color) => update({ secondary_foreground: color })}
            />
            <ColorBlock
              title="لون أزرار الحذف"
              value={current.destructive}
              palette={BUTTON_COLORS}
              onChange={(color) => update({ destructive: color })}
            />
            <ColorBlock
              title="لون نص أزرار الحذف"
              value={current.destructive_foreground}
              palette={TEXT_COLORS}
              onChange={(color) => update({ destructive_foreground: color })}
            />
          </div>
        ) : tab === "background" ? (
          <div className="space-y-5">
            <ColorBlock title="لون خلفية الصفحة" value={current.background} palette={BG_COLORS} onChange={(color) => update({ background: color })} />
            <ColorBlock
              title="لون شريط التصنيفات والبحث"
              value={current.bar_background ?? DEFAULT_THEME.bar_background}
              palette={BG_COLORS}
              onChange={(color) => update({ bar_background: color })}
            />
            <button
              type="button"
              onClick={() => update({ bar_background: current.background })}
              className="w-full rounded-xl border border-dashed border-gray-300 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 active:scale-[0.99] transition-all inline-flex items-center justify-center gap-2"
            >
              <Copy className="h-4 w-4" />
              مطابقة لون الشريط مع الخلفية
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <ColorBlock
              title="لون خلفية بطاقات المنتجات"
              value={current.item_card_background}
              palette={BG_COLORS}
              onChange={(color) => update({ item_card_background: color })}
            />
            <ColorBlock
              title="لون اسم المنتج"
              value={current.item_card_title}
              palette={TEXT_COLORS}
              onChange={(color) => update({ item_card_title: color })}
            />
            <ColorBlock
              title="لون وصف المنتج"
              value={current.item_card_description}
              palette={TEXT_COLORS}
              onChange={(color) => update({ item_card_description: color })}
            />
            <ColorBlock
              title="لون سعر المنتج"
              value={current.item_card_price}
              palette={TEXT_COLORS}
              onChange={(color) => update({ item_card_price: color })}
            />
          </div>
        )}
      </section>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium active:scale-95 transition-transform"
        >
          <RotateCcw className="h-4 w-4" />
          استرجاع الافتراضي
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving}
          className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold active:scale-95 transition-all disabled:opacity-50"
          style={{ backgroundColor: saved ? "#166534" : current.primary, color: current.primary_foreground }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {saved ? "تم الحفظ" : "حفظ الألوان"}
        </button>
      </div>
    </div>
  )
}
