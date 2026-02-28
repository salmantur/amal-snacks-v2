"use client"

import { useState } from "react"
import { Check, Loader2, RotateCcw } from "lucide-react"
import { useThemeConfig, DEFAULT_THEME, type ThemeConfig } from "@/hooks/use-theme-config"

const PINK_PRESETS = [
  { label: "وردي", color: "#f0526a" },
  { label: "برتقالي", color: "#f97316" },
  { label: "بنفسجي", color: "#8b5cf6" },
  { label: "أزرق", color: "#3b82f6" },
  { label: "سماوي", color: "#06b6d4" },
  { label: "أسود", color: "#1a1a1a" },
]

const GREEN_PRESETS = [
  { label: "أخضر داكن", color: "#1e5631" },
  { label: "أخضر", color: "#16a34a" },
  { label: "فيروزي", color: "#0d9488" },
  { label: "أزرق داكن", color: "#1e3a5f" },
  { label: "بنفسجي داكن", color: "#4c1d95" },
  { label: "أسود", color: "#1a1a1a" },
]

export function ThemeEditor() {
  const { config, loading, saveConfig } = useThemeConfig()
  const [draft, setDraft] = useState<ThemeConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const current = draft ?? config

  function update(patch: Partial<ThemeConfig>) {
    const next = { ...current, ...patch }
    setDraft(next)
    setSaved(false)
    // Live preview
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

  if (loading) return <div className="h-40 bg-amal-grey rounded-2xl animate-pulse" />

  return (
    <div className="space-y-6" dir="rtl">

      {/* Live preview */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-3">معاينة مباشرة</p>
        <div className="flex gap-3 items-center p-4 bg-amal-grey rounded-2xl">
          {/* Cart button preview */}
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1.5">زر السلة</p>
            <div
              className="rounded-full px-4 py-2.5 flex items-center gap-2 w-fit"
              style={{ backgroundColor: current.primary }}
            >
              <span className="text-sm font-bold" style={{ color: current.primary_foreground }}>
                عنصر · 50 ر.س
              </span>
            </div>
          </div>
          {/* Checkout button preview */}
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1.5">خيارات الطلب</p>
            <div
              className="rounded-2xl px-4 py-2.5 flex items-center justify-center w-fit"
              style={{ backgroundColor: current.checkout_green }}
            >
              <span className="text-sm font-bold text-white">استلام</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cart button color */}
      <div>
        <p className="text-sm font-semibold mb-3">🛒 لون زر السلة (الوردي)</p>
        <div className="grid grid-cols-6 gap-2 mb-3">
          {PINK_PRESETS.map(p => (
            <button
              key={p.color}
              onClick={() => update({ primary: p.color })}
              title={p.label}
              className="h-11 rounded-xl border-2 transition-all active:scale-95"
              style={{
                backgroundColor: p.color,
                borderColor: current.primary === p.color ? "#000" : "transparent",
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-3 p-3 bg-amal-grey rounded-xl">
          <input
            type="color"
            value={current.primary}
            onChange={e => update({ primary: e.target.value })}
            className="w-12 h-10 rounded-lg cursor-pointer border-0 bg-transparent flex-shrink-0"
          />
          <div>
            <p className="text-sm font-medium">لون مخصص</p>
            <p className="text-xs text-muted-foreground">{current.primary}</p>
          </div>
        </div>
      </div>

      {/* Checkout green color */}
      <div>
        <p className="text-sm font-semibold mb-3">✅ لون خيارات الطلب (الأخضر)</p>
        <div className="grid grid-cols-6 gap-2 mb-3">
          {GREEN_PRESETS.map(p => (
            <button
              key={p.color}
              onClick={() => update({ checkout_green: p.color })}
              title={p.label}
              className="h-11 rounded-xl border-2 transition-all active:scale-95"
              style={{
                backgroundColor: p.color,
                borderColor: current.checkout_green === p.color ? "#000" : "transparent",
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-3 p-3 bg-amal-grey rounded-xl">
          <input
            type="color"
            value={current.checkout_green}
            onChange={e => update({ checkout_green: e.target.value })}
            className="w-12 h-10 rounded-lg cursor-pointer border-0 bg-transparent flex-shrink-0"
          />
          <div>
            <p className="text-sm font-medium">لون مخصص</p>
            <p className="text-xs text-muted-foreground">{current.checkout_green}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amal-grey text-muted-foreground text-sm font-medium active:scale-95 transition-transform"
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
          {saved ? "تم الحفظ!" : "حفظ الألوان"}
        </button>
      </div>
    </div>
  )
}
