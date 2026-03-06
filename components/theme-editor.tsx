"use client"

import { useState } from "react"
import { Check, Loader2, RotateCcw, Copy } from "lucide-react"
import { useThemeConfig, DEFAULT_THEME, type ThemeConfig } from "@/hooks/use-theme-config"
import { PriceWithRiyalLogo } from "@/components/ui/price-with-riyal-logo"

const COLOR_PALETTE = [
  // Reds / Pinks
  { label: "Ã™Ë†Ã˜Â±Ã˜Â¯Ã™Å  Ã˜Â²Ã˜Â§Ã™â€¡Ã™Å ",    color: "#f0526a" },
  { label: "Ã˜Â£Ã˜Â­Ã™â€¦Ã˜Â±",         color: "#ef4444" },
  { label: "Ã™Ë†Ã˜Â±Ã˜Â¯Ã™Å ",         color: "#ec4899" },
  { label: "Ã™ÂÃ™Ë†Ã˜Â´Ã™Å Ã˜Â§",        color: "#d946ef" },
  { label: "Ã™Ë†Ã˜Â±Ã˜Â¯Ã™Å  Ã™ÂÃ˜Â§Ã˜ÂªÃ˜Â­",    color: "#f9a8d4" },
  { label: "Ã˜Â£Ã˜Â­Ã™â€¦Ã˜Â± Ã˜Â¯Ã˜Â§Ã™Æ’Ã™â€ ",    color: "#991b1b" },
  // Oranges / Yellows
  { label: "Ã˜Â¨Ã˜Â±Ã˜ÂªÃ™â€šÃ˜Â§Ã™â€žÃ™Å ",      color: "#f97316" },
  { label: "Ã˜Â¹Ã™â€ Ã˜Â¨Ã˜Â±Ã™Å ",        color: "#f59e0b" },
  { label: "Ã˜Â£Ã˜ÂµÃ™ÂÃ˜Â±",         color: "#eab308" },
  { label: "Ã˜Â¨Ã˜Â±Ã˜ÂªÃ™â€šÃ˜Â§Ã™â€žÃ™Å  Ã™ÂÃ˜Â§Ã˜ÂªÃ˜Â­", color: "#fed7aa" },
  { label: "Ã˜Â°Ã™â€¡Ã˜Â¨Ã™Å ",         color: "#ca8a04" },
  { label: "Ã˜Â¨Ã™â€ Ã™Å ",          color: "#92400e" },
  // Greens
  { label: "Ã˜Â£Ã˜Â®Ã˜Â¶Ã˜Â± Ã˜Â²Ã™Å Ã˜ÂªÃ™Å ",   color: "#1e5631" },
  { label: "Ã˜Â£Ã˜Â®Ã˜Â¶Ã˜Â±",         color: "#16a34a" },
  { label: "Ã˜Â£Ã˜Â®Ã˜Â¶Ã˜Â± Ã™ÂÃ˜Â§Ã˜ÂªÃ˜Â­",   color: "#4ade80" },
  { label: "Ã™ÂÃ™Å Ã˜Â±Ã™Ë†Ã˜Â²Ã™Å ",       color: "#0d9488" },
  { label: "Ã™â€ Ã˜Â¹Ã™â€ Ã˜Â§Ã˜Â¹Ã™Å ",       color: "#10b981" },
  { label: "Ã˜Â£Ã˜Â®Ã˜Â¶Ã˜Â± Ã™â€žÃ™Å Ã™â€¦Ã™Ë†Ã™â€ Ã™Å ",  color: "#65a30d" },
  // Blues / Purples
  { label: "Ã˜Â£Ã˜Â²Ã˜Â±Ã™â€š",         color: "#3b82f6" },
  { label: "Ã˜Â³Ã™â€¦Ã˜Â§Ã™Ë†Ã™Å ",        color: "#06b6d4" },
  { label: "Ã™â€ Ã™Å Ã™â€žÃ™Å ",         color: "#6366f1" },
  { label: "Ã˜Â¨Ã™â€ Ã™ÂÃ˜Â³Ã˜Â¬Ã™Å ",       color: "#8b5cf6" },
  { label: "Ã˜Â£Ã˜Â²Ã˜Â±Ã™â€š Ã˜Â¯Ã˜Â§Ã™Æ’Ã™â€ ",   color: "#1e3a5f" },
  { label: "Ã˜Â¨Ã™â€ Ã™ÂÃ˜Â³Ã˜Â¬Ã™Å  Ã˜Â¯Ã˜Â§Ã™Æ’Ã™â€ ",  color: "#4c1d95" },
  // Neutrals
  { label: "Ã˜Â±Ã™â€¦Ã˜Â§Ã˜Â¯Ã™Å  Ã™ÂÃ˜Â§Ã˜ÂªÃ˜Â­",  color: "#9ca3af" },
  { label: "Ã˜Â±Ã™â€¦Ã˜Â§Ã˜Â¯Ã™Å ",        color: "#6b7280" },
  { label: "Ã˜Â±Ã™â€¦Ã˜Â§Ã˜Â¯Ã™Å  Ã˜Â¯Ã˜Â§Ã™Æ’Ã™â€ ",  color: "#374151" },
  { label: "Ã™ÂÃ˜Â­Ã™â€¦Ã™Å ",         color: "#1f2937" },
  { label: "Ã˜Â£Ã˜Â³Ã™Ë†Ã˜Â¯",         color: "#0f172a" },
  { label: "Ã˜Â£Ã˜Â¨Ã™Å Ã˜Â¶",         color: "#ffffff" },
]

const BG_PALETTE = [
  { label: "Ã˜Â£Ã˜Â¨Ã™Å Ã˜Â¶ Ã™â€ Ã™â€šÃ™Å ",      color: "#ffffff" },
  { label: "Ã˜Â£Ã˜Â¨Ã™Å Ã˜Â¶ Ã™â€¦Ã™Æ’Ã˜Â³Ã˜Â±",     color: "#fafafa" },
  { label: "Ã˜Â±Ã™â€¦Ã˜Â§Ã˜Â¯Ã™Å  Ã™â€ Ã˜Â§Ã˜Â¹Ã™â€¦",    color: "#f5f5f5" },
  { label: "Ã˜Â±Ã™â€¦Ã˜Â§Ã˜Â¯Ã™Å  Ã™ÂÃ˜Â§Ã˜ÂªÃ˜Â­",    color: "#f0f0f0" },
  { label: "Ã™Æ’Ã˜Â±Ã™Å Ã™â€¦Ã™Å ",          color: "#fef9f0" },
  { label: "Ã˜Â¨Ã™Å Ã˜Â¬",            color: "#fdf6e3" },
  { label: "Ã™Ë†Ã˜Â±Ã˜Â¯Ã™Å  Ã™â€ Ã˜Â§Ã˜Â¹Ã™â€¦",     color: "#fff0f3" },
  { label: "Ã˜Â®Ã™Ë†Ã˜Â®Ã™Å ",           color: "#fff4ed" },
  { label: "Ã™â€žÃ˜Â§Ã™ÂÃ™â€ Ã˜Â¯Ã˜Â± Ã™ÂÃ˜Â§Ã˜ÂªÃ˜Â­",   color: "#f5f0ff" },
  { label: "Ã˜Â£Ã˜Â²Ã˜Â±Ã™â€š Ã™â€ Ã˜Â§Ã˜Â¹Ã™â€¦",     color: "#eff6ff" },
  { label: "Ã˜Â³Ã™â€¦Ã˜Â§Ã™Ë†Ã™Å  Ã™ÂÃ˜Â§Ã˜ÂªÃ˜Â­",    color: "#ecfeff" },
  { label: "Ã˜Â£Ã˜Â®Ã˜Â¶Ã˜Â± Ã™â€ Ã˜Â§Ã˜Â¹Ã™â€¦",     color: "#f0fdf4" },
  { label: "Ã™â€ Ã˜Â¹Ã™â€ Ã˜Â§Ã˜Â¹Ã™Å  Ã™ÂÃ˜Â§Ã˜ÂªÃ˜Â­",   color: "#ecfdf5" },
  { label: "Ã˜Â£Ã˜ÂµÃ™ÂÃ˜Â± Ã™â€ Ã˜Â§Ã˜Â¹Ã™â€¦",     color: "#fefce8" },
  { label: "Ã™Ë†Ã˜Â±Ã˜Â¯Ã™Å  Ã˜ÂºÃ˜Â§Ã™â€¦Ã™â€š",     color: "#fce7f3" },
  { label: "Ã˜Â±Ã™â€¦Ã˜Â§Ã˜Â¯Ã™Å  Ã™â€¦Ã˜Â²Ã˜Â±Ã™â€š",    color: "#f1f5f9" },
  { label: "Ã˜Â¨Ã™Å Ã˜Â¬ Ã˜Â¯Ã˜Â§Ã™Æ’Ã™â€ ",      color: "#fdf4dc" },
  { label: "Ã˜Â²Ã™Å Ã˜ÂªÃ™Å  Ã™ÂÃ˜Â§Ã˜ÂªÃ˜Â­",     color: "#f7fee7" },
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
        <p className="text-xs text-gray-500">Ã˜Â§Ã˜Â®Ã˜ÂªÃ˜Â± Ã™â€žÃ™Ë†Ã™â€ Ã˜Â§Ã™â€¹ Ã™â€¦Ã˜Â®Ã˜ÂµÃ˜ÂµÃ˜Â§Ã™â€¹</p>
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
        <p className="text-xs font-medium text-gray-400 text-center">Ã™â€¦Ã˜Â¹Ã˜Â§Ã™Å Ã™â€ Ã˜Â© Ã™â€¦Ã˜Â¨Ã˜Â§Ã˜Â´Ã˜Â±Ã˜Â©</p>
        <div className="flex gap-3 items-center justify-center flex-wrap">
          <div className="rounded-full px-5 py-2.5" style={{ backgroundColor: current.primary }}>
            <span className="text-sm font-bold inline-flex items-center gap-1" style={{ color: current.primary_foreground }}>
              Ã°Å¸â€ºâ€™ Ã˜Â§Ã™â€žÃ˜Â³Ã™â€žÃ˜Â© Ã‚Â· <PriceWithRiyalLogo value={50} />
            </span>
          </div>
          <div className="rounded-2xl px-5 py-2.5" style={{ backgroundColor: current.checkout_green }}>
            <span className="text-sm font-bold text-white">Ã¢Å“â€¦ Ã˜Â§Ã˜Â³Ã˜ÂªÃ™â€žÃ˜Â§Ã™â€¦</span>
          </div>
        </div>
        <div className="h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: current.bar_background ?? "#f5f5f5" }}>
          <span className="text-xs text-gray-500">Ã˜Â´Ã˜Â±Ã™Å Ã˜Â· Ã˜Â§Ã™â€žÃ™ÂÃ˜Â¦Ã˜Â§Ã˜Âª Ã™Ë†Ã˜Â§Ã™â€žÃ˜Â¨Ã˜Â­Ã˜Â«</span>
        </div>
        <div className="h-8 rounded-lg border border-dashed border-gray-300 flex items-center justify-center">
          <span className="text-xs text-gray-400">Ã˜Â®Ã™â€žÃ™ÂÃ™Å Ã˜Â© Ã˜Â§Ã™â€žÃ˜ÂµÃ™ÂÃ˜Â­Ã˜Â©</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
        <button
          onClick={() => setTab("buttons")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === "buttons" ? "bg-white shadow text-gray-900" : "text-gray-500"}`}
        >
          Ã°Å¸Å½Â¨ Ã˜Â£Ã™â€žÃ™Ë†Ã˜Â§Ã™â€  Ã˜Â§Ã™â€žÃ˜Â£Ã˜Â²Ã˜Â±Ã˜Â§Ã˜Â±
        </button>
        <button
          onClick={() => setTab("background")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === "background" ? "bg-white shadow text-gray-900" : "text-gray-500"}`}
        >
          Ã°Å¸â€“Â¼ Ã˜Â§Ã™â€žÃ˜Â®Ã™â€žÃ™ÂÃ™Å Ã˜Â©
        </button>
      </div>

      {/* Buttons tab */}
      {tab === "buttons" && (
        <div className="space-y-6">
          <ColorSection title="Ã°Å¸â€ºâ€™ Ã˜Â²Ã˜Â± Ã˜Â§Ã™â€žÃ˜Â³Ã™â€žÃ˜Â©" value={current.primary} palette={COLOR_PALETTE} onChange={c => update({ primary: c })} />
          <div className="border-t border-gray-100" />
          <ColorSection title="Ã¢Å“â€¦ Ã˜Â²Ã˜Â± Ã˜Â®Ã™Å Ã˜Â§Ã˜Â±Ã˜Â§Ã˜Âª Ã˜Â§Ã™â€žÃ˜Â·Ã™â€žÃ˜Â¨" value={current.checkout_green} palette={COLOR_PALETTE} onChange={c => update({ checkout_green: c })} />
        </div>
      )}

      {/* Background tab */}
      {tab === "background" && (
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-2">
            <span className="text-base">Ã°Å¸â€™Â¡</span>
            <p className="text-xs text-blue-700 leading-relaxed">
              Ã˜Â§Ã˜Â®Ã˜ÂªÃ˜Â± Ã™â€žÃ™Ë†Ã™â€  Ã˜Â§Ã™â€žÃ˜Â®Ã™â€žÃ™ÂÃ™Å Ã˜Â© Ã™Ë†Ã˜Â³Ã™Å Ã˜ÂªÃ™â€¦ Ã˜ÂªÃ˜Â·Ã˜Â¨Ã™Å Ã™â€šÃ™â€¡ Ã˜Â¹Ã™â€žÃ™â€° Ã˜Â§Ã™â€žÃ˜ÂµÃ™ÂÃ˜Â­Ã˜Â© Ã™Æ’Ã˜Â§Ã™â€¦Ã™â€žÃ™â€¡Ã˜Â§ Ã¢â‚¬â€ Ã˜Â§Ã™â€žÃ™â€¡Ã™Å Ã˜Â¯Ã˜Â± Ã™Ë†Ã˜Â§Ã™â€žÃ˜Â¨Ã˜Â·Ã˜Â§Ã™â€šÃ˜Â§Ã˜Âª Ã™Ë†Ã˜Â§Ã™â€žÃ˜Â®Ã™â€žÃ™ÂÃ™Å Ã˜Â© Ã˜Â§Ã™â€žÃ˜Â±Ã˜Â¦Ã™Å Ã˜Â³Ã™Å Ã˜Â© Ã™Æ’Ã™â€žÃ™â€¡Ã˜Â§ Ã™ÂÃ™Å  Ã™â€ Ã™ÂÃ˜Â³ Ã˜Â§Ã™â€žÃ™â€žÃ™Ë†Ã™â€ .
            </p>
          </div>
          <button
            onClick={() => update({ background: bg })}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-300 text-sm font-medium text-gray-600 active:scale-95 transition-all hover:border-gray-400 hover:bg-gray-50"
          >
            <Copy className="h-4 w-4" />
            Ã˜ÂªÃ˜Â·Ã˜Â¨Ã™Å Ã™â€š Ã˜Â§Ã™â€žÃ™â€žÃ™Ë†Ã™â€  Ã˜Â§Ã™â€žÃ˜Â­Ã˜Â§Ã™â€žÃ™Å  Ã˜Â¹Ã™â€žÃ™â€° Ã™Æ’Ã™â€ž Ã˜Â§Ã™â€žÃ˜Â®Ã™â€žÃ™ÂÃ™Å Ã˜Â§Ã˜Âª
          </button>
          <ColorSection title="Ã°Å¸â€“Â¼ Ã™â€žÃ™Ë†Ã™â€  Ã˜Â§Ã™â€žÃ˜Â®Ã™â€žÃ™ÂÃ™Å Ã˜Â© Ã˜Â§Ã™â€žÃ˜Â±Ã˜Â¦Ã™Å Ã˜Â³Ã™Å Ã˜Â©" value={bg} palette={BG_PALETTE} onChange={c => update({ background: c })} />
          <div className="border-t border-gray-100" />
          <ColorSection title="Ã°Å¸â€œÅ  Ã™â€žÃ™Ë†Ã™â€  Ã˜Â´Ã˜Â±Ã™Å Ã˜Â· Ã˜Â§Ã™â€žÃ™ÂÃ˜Â¦Ã˜Â§Ã˜Âª Ã™Ë†Ã˜Â®Ã˜Â§Ã™â€ Ã˜Â© Ã˜Â§Ã™â€žÃ˜Â¨Ã˜Â­Ã˜Â«" value={current.bar_background ?? "#f5f5f5"} palette={BG_PALETTE} onChange={c => update({ bar_background: c })} />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-100 text-gray-500 text-sm font-medium active:scale-95 transition-transform"
        >
          <RotateCcw className="h-4 w-4" />
          Ã˜Â¥Ã˜Â¹Ã˜Â§Ã˜Â¯Ã˜Â© Ã˜ÂªÃ˜Â¹Ã™Å Ã™Å Ã™â€ 
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !draft}
          className="flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          style={{ backgroundColor: saved ? "#1e5631" : current.primary, color: current.primary_foreground }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {saved ? "Ã˜ÂªÃ™â€¦ Ã˜Â§Ã™â€žÃ˜Â­Ã™ÂÃ˜Â¸! Ã¢Å“â€œ" : "Ã˜Â­Ã™ÂÃ˜Â¸ Ã˜Â§Ã™â€žÃ˜Â£Ã™â€žÃ™Ë†Ã˜Â§Ã™â€ "}
        </button>
      </div>

    </div>
  )
}
