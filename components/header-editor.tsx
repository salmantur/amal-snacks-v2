"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Check, Clock3, History, Loader2, RotateCcw, Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useHeaderConfig } from "@/hooks/use-header-config"
import { DEFAULT_HEADER_CONFIG, type HeaderConfig } from "@/lib/header-config"

const MENU_ICON_OPTIONS: { value: HeaderConfig["menu_icon_style"]; label: string }[] = [
  { value: "lines", label: "خطوط" },
  { value: "dots", label: "نقاط" },
  { value: "hidden", label: "مخفي" },
]

async function optimizeLogo(file: File, maxWidth = 480, quality = 0.9): Promise<File> {
  const bitmap = await createImageBitmap(file)
  const ratio = Math.min(1, maxWidth / bitmap.width)
  const width = Math.max(1, Math.round(bitmap.width * ratio))
  const height = Math.max(1, Math.round(bitmap.height * ratio))

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) return file

  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const webpBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality))
  if (!webpBlob) return file

  return new File([webpBlob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, {
    type: "image/webp",
    lastModified: Date.now(),
  })
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="space-y-2 block">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-admin-muted">{label}</span>
        <span className="rounded-full bg-admin-bg px-2.5 py-1 text-xs font-mono font-semibold text-admin-muted">{value}</span>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-admin-border-soft bg-white px-3 py-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-10 w-12 cursor-pointer rounded-lg border-0 bg-transparent" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 flex-1 rounded-lg border border-admin-border-soft px-3 text-left text-sm font-mono"
          dir="ltr"
        />
      </div>
    </label>
  )
}

export function HeaderEditor({ onDraftChange }: { onDraftChange?: (config: HeaderConfig) => void } = {}) {
  const { loading, draft: storedDraft, published, history, saveDraft, publishDraft, restoreVersionToDraft } = useHeaderConfig()
  const [draft, setDraft] = useState<HeaderConfig | null>(null)
  const [savingDraft, setSavingDraft] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [savedNotice, setSavedNotice] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const current = draft ?? storedDraft
  const dirty = Boolean(draft)

  useEffect(() => {
    onDraftChange?.(current)
  }, [current, onDraftChange])

  function update(patch: Partial<HeaderConfig>) {
    setDraft({ ...current, ...patch })
    setSavedNotice(null)
  }

  async function onUploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    const optimized = await optimizeLogo(file)
    const supabase = createClient()
    const filename = `header_logo_${Date.now()}.webp`

    let publicUrl: string | null = null
    const first = await supabase.storage.from("Menu").upload(filename, optimized, {
      upsert: true,
      cacheControl: "31536000",
      contentType: "image/webp",
    })
    if (!first.error) {
      publicUrl = supabase.storage.from("Menu").getPublicUrl(first.data.path).data.publicUrl
    } else {
      const second = await supabase.storage.from("app-assets").upload(filename, optimized, {
        upsert: true,
        cacheControl: "31536000",
        contentType: "image/webp",
      })
      if (!second.error) {
        publicUrl = supabase.storage.from("app-assets").getPublicUrl(second.data.path).data.publicUrl
      }
    }

    if (publicUrl) update({ logo_image_url: publicUrl })
    setUploading(false)
    e.target.value = ""
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
    update(DEFAULT_HEADER_CONFIG)
  }

  if (loading) return <div className="h-48 rounded-2xl bg-admin-bg animate-pulse" />

  return (
    <div className="space-y-5" dir="rtl">
      <section className="rounded-2xl border border-admin-border-soft bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-admin-ink">حالة الرأس</p>
          <span className={cn("text-xs px-2 py-1 rounded-full", dirty ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700")}>
            {dirty ? "تعديلات غير محفوظة" : "محفوظ"}
          </span>
        </div>
        <p className="text-xs text-admin-muted-2">
          الحفظ كمسودة لا يغيّر الموقع المباشر — فقط النشر ينشر التغييرات لزوار المتجر.
        </p>
        <p className="bg-admin-bg rounded-xl px-3 py-2 text-sm">المنشور حاليًا: <span className="font-semibold">{published.logo_text}</span></p>
        {savedNotice ? <p className="text-sm text-emerald-700 font-semibold">{savedNotice}</p> : null}
      </section>

      <section className="rounded-2xl border border-admin-border-soft bg-white p-4 space-y-3">
        <p className="text-sm font-bold text-admin-ink">الشعار</p>
        <input value={current.logo_text} onChange={(e) => update({ logo_text: e.target.value })} placeholder="نص الشعار" className="w-full rounded-xl bg-admin-bg px-4 py-3 text-sm focus:outline-none" />

        {current.logo_image_url ? (
          <div className="flex items-center gap-3 rounded-xl border border-admin-border-soft p-3">
            <div className="relative h-10 w-28 shrink-0">
              <Image src={current.logo_image_url} alt="logo" fill className="object-contain" />
            </div>
            <p className="flex-1 text-xs text-admin-muted-2">يتم استخدام هذه الصورة بدلاً من النص</p>
            <button type="button" onClick={() => update({ logo_image_url: null })} className="rounded-lg bg-red-50 p-2 text-red-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => logoInputRef.current?.click()}
          disabled={uploading}
          className="w-full rounded-xl border-2 border-dashed border-admin-border-soft p-3 text-sm font-medium hover:border-primary/40"
        >
          {uploading ? "جاري الرفع..." : current.logo_image_url ? "استبدال صورة الشعار" : "رفع صورة شعار"}
        </button>
        <input ref={logoInputRef} type="file" accept="image/*" onChange={onUploadLogo} className="hidden" />
      </section>

      <section className="rounded-2xl border border-admin-border-soft bg-white p-4 space-y-5">
        <p className="text-sm font-bold text-admin-ink">الألوان</p>
        <ColorField label="لون خلفية الرأس" value={current.background_color} onChange={(value) => update({ background_color: value })} />
        <ColorField label="لون الأيقونات" value={current.icon_color} onChange={(value) => update({ icon_color: value })} />
      </section>

      <section className="rounded-2xl border border-admin-border-soft bg-white p-4 space-y-3">
        <p className="text-sm font-bold text-admin-ink">شكل أيقونة القائمة</p>
        <div className="grid grid-cols-3 gap-2">
          {MENU_ICON_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update({ menu_icon_style: opt.value })}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors",
                current.menu_icon_style === opt.value
                  ? "border-admin-ink bg-admin-ink text-white"
                  : "border-admin-border-soft bg-white text-admin-muted hover:bg-admin-bg"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {current.menu_icon_style === "hidden" ? (
          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
            تنبيه: إخفاء الأيقونة يخفي زر فتح قائمة التصنيفات بالكامل من الرأس.
          </p>
        ) : null}
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
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{item.config.logo_text}</p>
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
          className="inline-flex items-center gap-2 rounded-xl bg-admin-bg px-4 py-3 text-sm font-medium text-admin-muted active:scale-95 transition-transform"
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
