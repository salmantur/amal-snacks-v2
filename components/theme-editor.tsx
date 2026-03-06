"use client"

import { useState } from "react"
import { Check, Loader2, RotateCcw, Copy } from "lucide-react"
import { useThemeConfig, DEFAULT_THEME, type ThemeConfig } from "@/hooks/use-theme-config"
import { PriceWithRiyalLogo } from "@/components/ui/price-with-riyal-logo"

const COLOR_PALETTE = [
  // Reds / Pinks
  { label: "وردي زاهي",    color: "#f0526a" },
  { label: "أحمر",         color: "#ef4444" },
  { label: "وردي",         color: "#ec4899" },
  { label: "فوشيا",        color: "#d946ef" },
  { label: "وردي فاتح",    color: "#f9a8d4" },
  { label: "أحمر داكن",    color: "#991b1b" },
  // Oranges / Yellows
  { label: "برتقالي",      color: "#f97316" },
  { label: "عنبري",        color: "#f59e0b" },
  { label: "أصفر",         color: "#eab308" },
  { label: "برتقالي فاتح", color: "#fed7aa" },
  { label: "ذهبي",         color: "#ca8a04" },
  { label: "بني",          color: "#92400e" },
  // Greens
  { label: "أخضر زيتي",   color: "#1e5631" },
  { label: "أخضر",         color: "#16a34a" },
  { label: "أخضر فاتح",   color: "#4ade80" },
  { label: "فيروزي",       color: "#0d9488" },
  { label: "نعناعي",       color: "#10b981" },
  { label: "أخضر ليموني",  color: "#65a30d" },
  // Blues / Purples
  { label: "أزرق",         color: "#3b82f6" },
  { label: "سماوي",        color: "#06b6d4" },
  { label: "نيلي",         color: "#6366f1" },
  { label: "بنفسجي",       color: "#8b5cf6" },
  { label: "أزرق داكن",   color: "#1e3a5f" },
  { label: "بنفسجي داكن",  color: "#4c1d95" },
  // Neutrals
  { label: "رمادي فاتح",  color: "#9ca3af" },
  { label: "رمادي",        color: "#6b7280" },
  { label: "رمادي داكن",  color: "#374151" },
  { label: "فحمي",         color: "#1f2937" },
  { label: "أسود",         color: "#0f172a" },
  { label: "أبيض",         color: "#ffffff" },
]

const BG_PALETTE = [
  { label: "أبيض نقي",      color: "#ffffff" },
  { label: "أبيض مكسر",     color: "#fafafa" },
  { label: "رمادي ناعم",    color: "#f5f5f5" },
  { label: "رمادي فاتح",    color: "#f0f0f0" },
  { label: "كريمي",          color: "#fef9f0" },
  { label: "بيج",            color: "#fdf6e3" },
  { label: "وردي ناعم",     color: "#fff0f3" },
  { label: "خوخي",           color: "#fff4ed" },
  { label: "لافندر فاتح",   color: "#f5f0ff" },
  { label: "أزرق ناعم",     color: "#eff6ff" },
  { label: "سماوي فاتح",    color: "#ecfeff" },
  { label: "أخضر ناعم",     color: "#f0fdf4" },
  { label: "نعناعي فاتح",   color: "#ecfdf5" },
  { label: "أصفر ناعم",     color: "#fefce8" },
  { label: "وردي غامق",     color: "#fce7f3" },
  { label: "رمادي مزرق",    color: "#f1f5f9" },
  { label: "بيج داكن",      color: "#fdf4dc" },
  { label: "زيتي فاتح",     color: "#f7fee7" },
]

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 160
}

function Swatch({ color, selected, onClick }: { color: string; selected: boolean; onClick: () => void }) {
  const light = isLightColor(color)
  return (
    <button
      onClick={onClick}
      title={color}
      className="h-10 rounded-xl border-2 transition-all active:scale-95 relative flex items-center justify-center"
      style={{
        backgroundColor: color,
        borderColor: selected ? (light ? "#374151" : color) : "transparent",
        boxShadow: selected ? `0 0 0 2px ${light ? "#374151" : color}` : "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      {selected && <Check className="h-3.5 w-3.5" style={{ color: light ? "#374151" : "#ffffff" }} />}
    </button>
  )
}

function ColorSection({
  title, value, palette, onChange,
}: {
  title: string; value: string; palette: { label: string; color: string }[]; onChange: (c: string) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg border-2 border-gray-200 shadow-sm" style={{ backgroundColor: value }} />
          <span className="text-xs font-mono text-gray-400">{value}</span>
        </div>
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <div className="grid grid-cols-6 gap-1.5">
        {palette.map(p => (
          <Swatch key={p.color} color={p.color} selected={value === p.color} onClick={() => onChange(p.color)} />
        ))}
      </div>
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-10 h-9 rounded-lg cursor-pointer border-0 bg-transparent flex-shrink-0"
        />
        <p className="text-xs text-gray-500">اختر لوناً مخصصاً</p>
      </div>
    </div>
  )
}

export function ThemeEditor() {
  const { config, loading, saveConfig } = useThemeConfig()
  const [draft, setDraft] = useState<ThemeConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState<"buttons" | "background">("buttons")

  const current = draft ?? config

  function update(patch: Partial<ThemeConfig>) {
    const next = { ...current, ...patch }
    setDraft(next)
    setSaved(false)
    import("@/hooks/use-theme-config").then(m => m.applyTheme(next))
  }

  async function handleSave() {
    if (!draft) return
    setSaving(true)
    await saveConfig(draft)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleReset() {
    setDraft(DEFAULT_THEME)
    import("@/hooks/use-theme-config").then(m => m.applyTheme(DEFAULT_THEME))
    setSaved(false)
  }

  if (loading) return <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />

  const bg = current.background ?? "#ffffff"

  return (
    <div className="space-y-5" dir="rtl">

      {/* Live Preview */}
      <div className="p-4 rounded-2xl border border-gray-200 space-y-3" style={{ backgroundColor: bg }}>
        <p className="text-xs font-medium text-gray-400 text-center">معاينة مباشرة</p>
        <div className="flex gap-3 items-center justify-center flex-wrap">
          <div className="rounded-full px-5 py-2.5" style={{ backgroundColor: current.primary }}>
            <span className="text-sm font-bold inline-flex items-center gap-1" style={{ color: current.primary_foreground }}>
              🛒 السلة · <PriceWithRiyalLogo value={50} />
            </span>
          </div>
          <div className="rounded-2xl px-5 py-2.5" style={{ backgroundColor: current.checkout_green }}>
            <span className="text-sm font-bold text-white">✅ استلام</span>
          </div>
        </div>
        <div className="h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: current.bar_background ?? "#f5f5f5" }}>
          <span className="text-xs text-gray-500">شريط الفئات والبحث</span>
        </div>
        <div className="h-8 rounded-lg border border-dashed border-gray-300 flex items-center justify-center">
          <span className="text-xs text-gray-400">خلفية الصفحة</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
        <button
          onClick={() => setTab("buttons")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === "buttons" ? "bg-white shadow text-gray-900" : "text-gray-500"}`}
        >
          🎨 ألوان الأزرار
        </button>
        <button
          onClick={() => setTab("background")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === "background" ? "bg-white shadow text-gray-900" : "text-gray-500"}`}
        >
          🖼 الخلفية
        </button>
      </div>

      {/* Buttons tab */}
      {tab === "buttons" && (
        <div className="space-y-6">
          <ColorSection title="🛒 زر السلة" value={current.primary} palette={COLOR_PALETTE} onChange={c => update({ primary: c })} />
          <div className="border-t border-gray-100" />
          <ColorSection title="✅ زر خيارات الطلب" value={current.checkout_green} palette={COLOR_PALETTE} onChange={c => update({ checkout_green: c })} />
        </div>
      )}

      {/* Background tab */}
      {tab === "background" && (
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-2">
            <span className="text-base">💡</span>
            <p className="text-xs text-blue-700 leading-relaxed">
              اختر لون الخلفية وسيتم تطبيقه على الصفحة كاملها — الهيدر والبطاقات والخلفية الرئيسية كلها في نفس اللون.
            </p>
          </div>
          <button
            onClick={() => update({ background: bg })}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-300 text-sm font-medium text-gray-600 active:scale-95 transition-all hover:border-gray-400 hover:bg-gray-50"
          >
            <Copy className="h-4 w-4" />
            تطبيق اللون الحالي على كل الخلفيات
          </button>
          <ColorSection title="🖼 لون الخلفية الرئيسية" value={bg} palette={BG_PALETTE} onChange={c => update({ background: c })} />
          <div className="border-t border-gray-100" />
          <ColorSection title="📊 لون شريط الفئات وخانة البحث" value={current.bar_background ?? "#f5f5f5"} palette={BG_PALETTE} onChange={c => update({ bar_background: c })} />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-100 text-gray-500 text-sm font-medium active:scale-95 transition-transform"
        >
          <RotateCcw className="h-4 w-4" />
          إعادة تعيين
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !draft}
          className="flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          style={{ backgroundColor: saved ? "#1e5631" : current.primary, color: current.primary_foreground }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {saved ? "تم الحفظ! ✓" : "حفظ الألوان"}
        </button>
      </div>

    </div>
  )
}
