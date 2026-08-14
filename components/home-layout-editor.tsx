"use client"

import { useEffect, useState } from "react"
import { Check, Loader2, RotateCcw, Upload } from "lucide-react"
import { useHomeLayoutConfig } from "@/hooks/use-home-layout-config"
import {
  DEFAULT_HOME_LAYOUT_CONFIG,
  HOME_LAYOUT_VARIANTS,
  type HomeLayoutConfig,
} from "@/lib/home-layout-config"
import { cn } from "@/lib/utils"

export function HomeLayoutEditor({ onDraftChange }: { onDraftChange?: (config: HomeLayoutConfig) => void } = {}) {
  const { config, loading, saveConfig } = useHomeLayoutConfig()
  const [draft, setDraft] = useState<HomeLayoutConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const current = draft ?? config
  const dirty = Boolean(draft)

  useEffect(() => {
    onDraftChange?.(current)
  }, [current, onDraftChange])

  function selectVariant(variant: HomeLayoutConfig["variant"]) {
    if (variant === current.variant) return
    setDraft({ variant })
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    await saveConfig(current)
    setDraft(null)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  function handleReset() {
    setDraft(DEFAULT_HOME_LAYOUT_CONFIG)
    setSaved(false)
  }

  if (loading) return <div className="h-48 rounded-2xl bg-admin-bg animate-pulse" />

  return (
    <div className="space-y-5" dir="rtl">
      <section className="rounded-2xl border border-admin-border-soft bg-white p-4 space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-bold text-admin-ink">تخطيط الصفحة الرئيسية</p>
          <p className="text-xs text-admin-muted-2">
            يحدد هذا التخطيط الذي يراه الزوار على الصفحة الرئيسية افتراضيًا. لا يزال بإمكانك معاينة أي تخطيط عبر
            الرابط <span dir="ltr" className="font-mono">?homeui=</span> بغض النظر عن الاختيار هنا.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {HOME_LAYOUT_VARIANTS.map((v) => {
            const active = current.variant === v.value
            return (
              <button
                key={v.value}
                type="button"
                onClick={() => selectVariant(v.value)}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3 text-right transition-colors",
                  active ? "border-admin-ink bg-admin-bg" : "border-admin-border-soft bg-white hover:border-admin-ink/30"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                    active ? "border-admin-ink bg-admin-ink" : "border-admin-border-soft"
                  )}
                >
                  {active ? <Check className="h-3 w-3 text-white" /> : null}
                </span>
                <span className="space-y-0.5">
                  <span className="block text-sm font-bold text-admin-ink">{v.label}</span>
                  <span className="block text-xs text-admin-muted-2">{v.description}</span>
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-2 rounded-xl bg-admin-bg px-4 py-3 text-sm font-medium text-admin-muted active:scale-95 transition-transform"
        >
          <RotateCcw className="h-4 w-4" />
          استرجاع الافتراضي
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-admin-ink py-3 text-sm font-bold text-white active:scale-95 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
          {saved ? "تم الحفظ" : "حفظ"}
        </button>
      </div>
    </div>
  )
}
