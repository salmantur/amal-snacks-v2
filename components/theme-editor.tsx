"use client"

import { useEffect, useState } from "react"
import { Check, Clock3, Copy, History, Loader2, RotateCcw, Sparkles, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import { DEFAULT_THEME, useThemeConfig, type ThemeConfig } from "@/hooks/use-theme-config"

const FONT_OPTIONS: { value: ThemeConfig["font_family"]; label: string }[] = [
  { value: "system", label: "الافتراضي" },
  { value: "tajawal", label: "Tajawal" },
  { value: "thmanyah-sans", label: "Thmanyah Sans" },
  { value: "thmanyah-serif-text", label: "Thmanyah Serif" },
]

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
      <p className="text-[10px] mt-1 text-admin-muted-2 truncate">{label}</p>
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
        <p className="text-sm font-bold text-admin-ink">{title}</p>
        <div className="inline-flex items-center gap-2 rounded-full bg-admin-bg px-2 py-1">
          <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: value }} />
          <span className="text-[11px] font-mono text-admin-muted-2">{value}</span>
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

      <div className="flex items-center gap-3 bg-admin-bg rounded-xl border border-admin-border-soft p-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-10 rounded-lg border-0 bg-transparent cursor-pointer"
        />
        <p className="text-xs text-admin-muted-2">اختيار لون مخصص</p>
      </div>
    </section>
  )
}

export function ThemeEditor({ onDraftChange }: { onDraftChange?: (config: ThemeConfig) => void } = {}) {
  const { loading, draft: storedDraft, published, history, saveDraft, publishDraft, restoreVersionToDraft } = useThemeConfig()
  const [draft, setDraft] = useState<ThemeConfig | null>(null)
  const [tab, setTab] = useState<"main" | "background" | "cards" | "typography">("main")
  const [savingDraft, setSavingDraft] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [savedNotice, setSavedNotice] = useState<string | null>(null)

  const current = draft ?? storedDraft
  const trayDesign = current.tray_variant_design === "floating_3" ? "floating_3" : "design_c"
  const dirty = Boolean(draft)

  useEffect(() => {
    onDraftChange?.(current)
  }, [current, onDraftChange])

  function applyDraft(next: ThemeConfig) {
    setDraft(next)
    setSavedNotice(null)
  }

  function update(patch: Partial<ThemeConfig>) {
    applyDraft({ ...current, ...patch })
  }

  function applyPreset(preset: ThemePreset) {
    applyDraft({ ...current, ...preset.config })
  }

  async function onSaveDraft() {
    setSavingDraft(true)
    await saveDraft(current)
    setDraft(null)
    setSavingDraft(false)
    setSavedNotice("تم حفظ المسودة")
    setTimeout(() => setSavedNotice(null), 2000)
  }

  async function onPublish() {
    setPublishing(true)
    await publishDraft(current)
    setDraft(null)
    setPublishing(false)
    setSavedNotice("تم النشر")
    setTimeout(() => setSavedNotice(null), 2000)
  }

  function handleReset() {
    applyDraft(DEFAULT_THEME)
  }

  if (loading) return <div className="h-48 rounded-2xl bg-admin-bg animate-pulse" />

  return (
    <div className="space-y-5" dir="rtl">
      <section className="rounded-2xl border border-admin-border-soft bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-admin-ink">حالة الألوان</p>
          <span className={cn("text-xs px-2 py-1 rounded-full", dirty ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700")}>
            {dirty ? "تعديلات غير محفوظة" : "محفوظ"}
          </span>
        </div>
        <p className="text-xs text-admin-muted-2">
          الحفظ كمسودة لا يغيّر الموقع المباشر — فقط النشر ينشر التغييرات لزوار المتجر.
        </p>
        <div className="flex items-center gap-2 bg-admin-bg rounded-xl px-3 py-2">
          <span className="text-xs text-admin-muted-2">المنشور حاليًا:</span>
          <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: published.primary }} />
          <span className="text-xs font-mono text-admin-muted-2">{published.primary}</span>
        </div>
        {savedNotice ? <p className="text-sm text-emerald-700 font-semibold">{savedNotice}</p> : null}
      </section>

      <section className="rounded-2xl border border-admin-border-soft bg-white p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-admin-ink">Tray Design</p>
          <span className="text-xs text-admin-muted-2">Design C / Floating-3</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => update({ tray_variant_design: "design_c" })}
            className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
              trayDesign === "design_c"
                ? "border-admin-ink bg-admin-ink text-white"
                : "border-admin-border-soft bg-white text-admin-muted hover:bg-admin-bg"
            }`}
          >
            DESIGN C
          </button>
          <button
            type="button"
            onClick={() => update({ tray_variant_design: "floating_3" })}
            className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
              trayDesign === "floating_3"
                ? "border-admin-ink bg-admin-ink text-white"
                : "border-admin-border-soft bg-white text-admin-muted hover:bg-admin-bg"
            }`}
          >
            FLOATING-3
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-admin-border-soft bg-white p-4 space-y-3">
        <div className="flex items-center gap-2 text-admin-muted">
          <Sparkles className="h-4 w-4" />
          <p className="text-sm font-bold">ثيمات جاهزة</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset)}
              className="text-right rounded-xl border border-admin-border-soft p-3 hover:border-admin-border hover:bg-admin-bg transition-colors active:scale-[0.99]"
            >
              <p className="text-sm font-bold text-admin-ink">{preset.name}</p>
              <p className="text-xs text-admin-muted-2 mt-0.5">{preset.description}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-admin-border-soft bg-white p-4 space-y-4">
        <div className="flex gap-2 rounded-xl bg-admin-bg p-1">
          <button
            type="button"
            onClick={() => setTab("main")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${tab === "main" ? "bg-white text-admin-ink shadow-sm" : "text-admin-muted-2"}`}
          >
            ألوان الأزرار
          </button>
          <button
            type="button"
            onClick={() => setTab("background")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${tab === "background" ? "bg-white text-admin-ink shadow-sm" : "text-admin-muted-2"}`}
          >
            الخلفيات
          </button>
          <button
            type="button"
            onClick={() => setTab("cards")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${tab === "cards" ? "bg-white text-admin-ink shadow-sm" : "text-admin-muted-2"}`}
          >
            بطاقات المنتجات
          </button>
          <button
            type="button"
            onClick={() => setTab("typography")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${tab === "typography" ? "bg-white text-admin-ink shadow-sm" : "text-admin-muted-2"}`}
          >
            الخط والزوايا
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
              className="w-full rounded-xl border border-dashed border-admin-border py-3 text-sm font-medium text-admin-muted hover:bg-admin-bg active:scale-[0.99] transition-all inline-flex items-center justify-center gap-2"
            >
              <Copy className="h-4 w-4" />
              مطابقة لون الشريط مع الخلفية
            </button>
          </div>
        ) : tab === "cards" ? (
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
        ) : (
          <div className="space-y-5">
            <ColorBlock title="لون التمييز (Accent)" value={current.accent} palette={BUTTON_COLORS} onChange={(color) => update({ accent: color })} />
            <ColorBlock
              title="لون نص التمييز"
              value={current.accent_foreground}
              palette={TEXT_COLORS}
              onChange={(color) => update({ accent_foreground: color })}
            />

            <section className="space-y-2">
              <p className="text-sm font-bold text-admin-ink">الخط</p>
              <div className="grid grid-cols-2 gap-2">
                {FONT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => update({ font_family: opt.value })}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors",
                      current.font_family === opt.value
                        ? "border-admin-ink bg-admin-ink text-white"
                        : "border-admin-border-soft bg-white text-admin-muted hover:bg-admin-bg"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-admin-ink">استدارة الزوايا</p>
                <span className="text-xs font-mono text-admin-muted-2">{current.corner_radius}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={24}
                value={current.corner_radius}
                onChange={(e) => update({ corner_radius: Number(e.target.value) })}
                className="w-full"
              />
              <p className="text-xs text-admin-muted-2">
                يؤثر على الأزرار والنوافذ والحقول التي تستخدم الاستدارة الافتراضية للموقع، وليس كل العناصر (بعض البطاقات لها استدارة ثابتة).
              </p>
            </section>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-admin-border-soft bg-white p-4 space-y-3">
        <div className="flex items-center gap-2 text-admin-ink">
          <History className="h-4 w-4" />
          <p className="text-sm font-bold">آخر 3 نسخ</p>
        </div>
        {history.length === 0 ? <p className="text-xs text-admin-muted-2">لا توجد نسخ محفوظة بعد.</p> : null}
        <div className="space-y-2">
          {history.map((item) => (
            <div key={item.id} className="rounded-xl border border-admin-border-soft px-3 py-2 flex items-center justify-between gap-2">
              <div className="min-w-0 flex items-center gap-2">
                <span className="w-4 h-4 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: item.config.primary }} />
                <p className="text-xs text-admin-muted-2 inline-flex items-center gap-1">
                  <Clock3 className="h-3 w-3" />
                  {new Date(item.saved_at).toLocaleString("ar-SA")} · {item.kind === "published" ? "منشور" : "مسودة"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => restoreVersionToDraft(item.id)}
                className="text-xs rounded-lg bg-admin-bg px-2 py-1 font-medium shrink-0"
              >
                استرجاع للمسودة
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-admin-bg text-admin-muted text-sm font-medium active:scale-95 transition-transform"
        >
          <RotateCcw className="h-4 w-4" />
          إعادة تعيين
        </button>
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={savingDraft}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-admin-border bg-white py-3 text-sm font-bold text-admin-ink disabled:opacity-50"
        >
          {savingDraft ? <Upload className="h-4 w-4 animate-pulse" /> : <Check className="h-4 w-4" />}
          حفظ كمسودة
        </button>
        <button
          type="button"
          onClick={onPublish}
          disabled={publishing}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-admin-ink py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          نشر الآن
        </button>
      </div>
    </div>
  )
}
