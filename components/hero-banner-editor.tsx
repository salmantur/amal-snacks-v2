"use client"

import { useMemo, useRef, useState } from "react"
import Image from "next/image"
import { CalendarClock, Check, Clock3, Eye, EyeOff, History, ImageIcon, RotateCcw, Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useBannerConfig, DEFAULT_BANNER, type BannerConfig } from "@/hooks/use-banner-config"
import { useMenu } from "@/hooks/use-menu"

const PRESET_GRADIENTS = [
  { label: "وردي", from: "#fce4ec", to: "#f8bbd0" },
  { label: "أخضر", from: "#e8f5e9", to: "#c8e6c9" },
  { label: "أصفر", from: "#fffde7", to: "#fff9c4" },
  { label: "أزرق", from: "#e3f2fd", to: "#bbdefb" },
  { label: "برتقالي", from: "#fff3e0", to: "#ffe0b2" },
  { label: "داكن", from: "#1e293b", to: "#334155" },
]

const BANNER_PRESETS: { label: string; config: Partial<BannerConfig> }[] = [
  {
    label: "رمضان",
    config: {
      badge: "رمضان مبارك",
      title: "مائدة رمضان",
      subtitle: "تشكيلة يومية جاهزة للإفطار",
      bg_from: "#fde68a",
      bg_to: "#fbcfe8",
    },
  },
  {
    label: "العيد",
    config: {
      badge: "باقات العيد 🎁",
      title: "فرحة العيد",
      subtitle: "خيارات ضيافة فاخرة لكل المناسبات",
      bg_from: "#fef3c7",
      bg_to: "#fed7aa",
    },
  },
  {
    label: "عروض نهاية الأسبوع",
    config: {
      badge: "عرض خاص",
      title: "ويكند ألذ",
      subtitle: "أفضل الأصناف الجاهزة في وقت أقل",
      bg_from: "#dbeafe",
      bg_to: "#e9d5ff",
    },
  },
]

function toInputDateTime(value: string | null): string {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  const offset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - offset).toISOString().slice(0, 16)
}

function fromInputDateTime(value: string): string {
  if (!value) return ""
  return new Date(value).toISOString()
}

async function optimizeImage(file: File, maxWidth: number, quality = 0.82): Promise<File> {
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

function PreviewFrame({
  mode,
  config,
}: {
  mode: "mobile" | "desktop"
  config: BannerConfig
}) {
  const isMobile = mode === "mobile"
  const frameClass = isMobile ? "w-[290px] h-[520px]" : "w-full h-[280px]"
  const bannerHeight = isMobile ? "h-[170px]" : "h-[220px]"

  return (
    <div className={cn("rounded-2xl border border-gray-200 bg-white p-3", isMobile ? "mx-auto" : "")}>
      <div className={cn("rounded-2xl overflow-hidden border border-gray-100 bg-white", frameClass)}>
        <div className={cn("relative", bannerHeight)} style={{ background: `linear-gradient(135deg, ${config.bg_from}, ${config.bg_to})` }}>
          {config.image_url ? (
            <div className="absolute inset-0">
              <Image
                src={config.image_url}
                alt="banner preview"
                fill
                sizes={isMobile ? "290px" : "1200px"}
                className="object-cover"
                style={{
                  opacity: Math.max(0, Math.min(100, config.image_opacity)) / 100,
                  objectPosition: `${config.image_position_x}% ${config.image_position_y}%`,
                  transform: `scale(${config.image_scale / 100})`,
                }}
              />
            </div>
          ) : null}

          {/* Safe-area guides */}
          <div className="absolute inset-3 border border-dashed border-white/60 rounded-xl pointer-events-none" />
          <div className="absolute inset-x-4 top-4 h-8 border border-dashed border-white/70 rounded-lg pointer-events-none" />
          <div className="absolute inset-x-4 bottom-4 h-10 border border-dashed border-white/70 rounded-lg pointer-events-none" />

          <div className="relative z-10 p-5 text-right" dir="rtl">
            {config.show_badge && config.badge ? (
              <span className="inline-block text-xs px-3 py-1 rounded-full bg-white/70 text-gray-800 font-medium">{config.badge}</span>
            ) : null}
            <h3 className="text-xl font-black text-gray-900 mt-2">{config.title || "عنوان البانر"}</h3>
            {config.show_subtitle && config.subtitle ? (
              <p className="text-sm text-gray-700 mt-1 line-clamp-2 whitespace-pre-line">{config.subtitle}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export function HeroBannerEditor() {
  const { menuItems } = useMenu()
  const {
    loading,
    draft: storedDraft,
    published,
    schedule,
    history,
    saveDraft,
    publishDraft,
    scheduleDraft,
    clearSchedule,
    restoreVersionToDraft,
  } = useBannerConfig()

  const [draft, setDraft] = useState<BannerConfig | null>(null)
  const [savingDraft, setSavingDraft] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [scheduling, setScheduling] = useState(false)
  const [savedNotice, setSavedNotice] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("mobile")
  const [scheduleStart, setScheduleStart] = useState("")
  const [scheduleEnd, setScheduleEnd] = useState("")
  const [uploadingBg, setUploadingBg] = useState(false)
  const [uploadingDesign, setUploadingDesign] = useState(false)

  const bgInputRef = useRef<HTMLInputElement>(null)
  const designInputRef = useRef<HTMLInputElement>(null)

  const current = draft ?? storedDraft
  const dirty = Boolean(draft)

  const scheduleStatus = useMemo(() => {
    if (!schedule.enabled || !schedule.config) return "غير مفعّل"
    const now = Date.now()
    const start = schedule.start_at ? Date.parse(schedule.start_at) : Number.NEGATIVE_INFINITY
    const end = schedule.end_at ? Date.parse(schedule.end_at) : Number.POSITIVE_INFINITY
    if (now < start) return "مجدول (لم يبدأ بعد)"
    if (now > end) return "انتهى الجدول"
    return "نشط الآن"
  }, [schedule])

  function update(patch: Partial<BannerConfig>) {
    setDraft({ ...current, ...patch })
    setSavedNotice(null)
  }

  function applyPreset(preset: Partial<BannerConfig>) {
    update(preset)
  }

  async function uploadToSupabase(file: File, prefix: string) {
    const supabase = createClient()
    const ext = file.name.split(".").pop() || "webp"
    const filename = `${prefix}_${Date.now()}.${ext}`

    let uploadData: { path: string } | null = null
    let bucket = "Menu"

    const first = await supabase.storage.from("Menu").upload(filename, file, {
      upsert: true,
      cacheControl: "31536000",
      contentType: file.type || "image/webp",
    })

    if (first.error) {
      const second = await supabase.storage.from("app-assets").upload(filename, file, {
        upsert: true,
        cacheControl: "31536000",
        contentType: file.type || "image/webp",
      })
      if (!second.error && second.data) {
        uploadData = second.data
        bucket = "app-assets"
      }
    } else if (first.data) {
      uploadData = first.data
    }

    if (!uploadData) return null
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(uploadData.path)
    return urlData.publicUrl
  }

  async function onUploadBackground(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingBg(true)
    const optimized = await optimizeImage(file, 1800, 0.82)
    const url = await uploadToSupabase(optimized, "banner_bg")
    if (url) update({ image_url: url })
    setUploadingBg(false)
    e.target.value = ""
  }

  async function onUploadDesign(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingDesign(true)
    const optimized = await optimizeImage(file, 2200, 0.86)
    const url = await uploadToSupabase(optimized, "banner_design")
    if (url) update({ full_design_url: url, full_design_mode: true })
    setUploadingDesign(false)
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

  async function onSchedule() {
    if (!scheduleStart || !scheduleEnd) return
    setScheduling(true)
    await scheduleDraft(fromInputDateTime(scheduleStart), fromInputDateTime(scheduleEnd), current)
    setDraft(null)
    setScheduling(false)
    setSavedNotice("تمت الجدولة")
    setTimeout(() => setSavedNotice(null), 2000)
  }

  if (loading) return <div className="h-40 bg-amal-grey rounded-2xl animate-pulse" />

  return (
    <div className="space-y-6" dir="rtl">
      <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-gray-800">حالة البانر</p>
          <span className={cn("text-xs px-2 py-1 rounded-full", dirty ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700")}>
            {dirty ? "تعديلات غير محفوظة" : "محفوظ"}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <p className="bg-gray-50 rounded-xl px-3 py-2">الحالي المنشور: <span className="font-semibold">{published.title}</span></p>
          <p className="bg-gray-50 rounded-xl px-3 py-2">الجدولة: <span className="font-semibold">{scheduleStatus}</span></p>
        </div>
        {savedNotice ? <p className="text-sm text-emerald-700 font-semibold">{savedNotice}</p> : null}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-gray-800">معاينة البانر</p>
          <div className="inline-flex rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setPreviewMode("mobile")}
              className={cn("px-3 py-1.5 text-xs rounded-lg", previewMode === "mobile" ? "bg-white shadow-sm font-bold" : "text-gray-500")}
            >
              موبايل
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode("desktop")}
              className={cn("px-3 py-1.5 text-xs rounded-lg", previewMode === "desktop" ? "bg-white shadow-sm font-bold" : "text-gray-500")}
            >
              كمبيوتر
            </button>
          </div>
        </div>
        <PreviewFrame mode={previewMode} config={current} />
        <p className="text-xs text-gray-500">المربعات المتقطعة = منطقة الأمان للنصوص والصور.</p>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
        <p className="text-sm font-bold text-gray-800">قوالب جاهزة</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {BANNER_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyPreset(preset.config)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium hover:bg-gray-50"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
        <p className="text-sm font-bold text-gray-800">النصوص</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => update({ show_badge: !current.show_badge })}
            className={cn("w-9 h-9 rounded-xl flex items-center justify-center", current.show_badge ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-500")}
          >
            {current.show_badge ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
          <input
            value={current.badge}
            onChange={(e) => update({ badge: e.target.value })}
            disabled={!current.show_badge}
            placeholder="نص الشارة"
            className="flex-1 rounded-xl bg-amal-grey px-4 py-3 text-sm focus:outline-none"
          />
        </div>
        <input
          value={current.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="العنوان الرئيسي"
          className="w-full rounded-xl bg-amal-grey px-4 py-3 text-base font-bold focus:outline-none"
        />
        <div className="flex items-start gap-2">
          <button
            type="button"
            onClick={() => update({ show_subtitle: !current.show_subtitle })}
            className={cn("w-9 h-9 rounded-xl flex items-center justify-center mt-1", current.show_subtitle ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-500")}
          >
            {current.show_subtitle ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
          <textarea
            value={current.subtitle}
            onChange={(e) => update({ subtitle: e.target.value })}
            disabled={!current.show_subtitle}
            rows={2}
            placeholder="النص الفرعي"
            className="flex-1 rounded-xl bg-amal-grey px-4 py-3 text-sm resize-none focus:outline-none"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
        <p className="text-sm font-bold text-gray-800">خلفية البانر</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {PRESET_GRADIENTS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => update({ bg_from: preset.from, bg_to: preset.to })}
              className={cn("h-10 rounded-xl border-2", current.bg_from === preset.from && current.bg_to === preset.to ? "border-emerald-600" : "border-transparent")}
              style={{ background: `linear-gradient(135deg, ${preset.from}, ${preset.to})` }}
              title={preset.label}
            />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="block text-xs text-gray-500 mb-1">من</span>
            <input type="color" value={current.bg_from} onChange={(e) => update({ bg_from: e.target.value })} className="w-full h-10 rounded-lg" />
          </label>
          <label className="text-sm">
            <span className="block text-xs text-gray-500 mb-1">إلى</span>
            <input type="color" value={current.bg_to} onChange={(e) => update({ bg_to: e.target.value })} className="w-full h-10 rounded-lg" />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
        <p className="text-sm font-bold text-gray-800">صورة الخلفية</p>
        <button
          type="button"
          onClick={() => bgInputRef.current?.click()}
          className="w-full rounded-xl border-2 border-dashed border-gray-200 p-4 text-sm font-medium hover:border-primary/40"
          disabled={uploadingBg}
        >
          {uploadingBg ? "جاري التحسين والرفع..." : "رفع صورة خلفية (يتم تحسينها تلقائيًا WebP)"}
        </button>
        {current.image_url ? (
          <div className="space-y-3">
            <div className="relative w-full h-40 rounded-xl overflow-hidden border border-gray-100">
              <Image
                src={current.image_url}
                alt="banner image"
                fill
                className="object-cover"
                style={{
                  opacity: current.image_opacity / 100,
                  objectPosition: `${current.image_position_x}% ${current.image_position_y}%`,
                  transform: `scale(${current.image_scale / 100})`,
                }}
              />
            </div>

            <label className="block text-xs text-gray-500">
              الشفافية: {current.image_opacity}%
              <input
                type="range"
                min={0}
                max={100}
                value={current.image_opacity}
                onChange={(e) => update({ image_opacity: Number(e.target.value) })}
                className="w-full"
              />
            </label>

            <label className="block text-xs text-gray-500">
              موضع أفقي: {current.image_position_x}%
              <input
                type="range"
                min={0}
                max={100}
                value={current.image_position_x}
                onChange={(e) => update({ image_position_x: Number(e.target.value) })}
                className="w-full"
              />
            </label>

            <label className="block text-xs text-gray-500">
              موضع عمودي: {current.image_position_y}%
              <input
                type="range"
                min={0}
                max={100}
                value={current.image_position_y}
                onChange={(e) => update({ image_position_y: Number(e.target.value) })}
                className="w-full"
              />
            </label>

            <label className="block text-xs text-gray-500">
              تكبير الصورة: {current.image_scale}%
              <input
                type="range"
                min={100}
                max={170}
                value={current.image_scale}
                onChange={(e) => update({ image_scale: Number(e.target.value) })}
                className="w-full"
              />
            </label>

            <button
              type="button"
              onClick={() => update({ image_url: null })}
              className="w-full rounded-xl bg-red-50 text-red-600 py-2 text-sm font-medium"
            >
              حذف صورة الخلفية
            </button>
          </div>
        ) : null}
        <input ref={bgInputRef} type="file" accept="image/*" onChange={onUploadBackground} className="hidden" />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
        <p className="text-sm font-bold text-gray-800">تصميم بانر كامل</p>
        <button
          type="button"
          onClick={() => designInputRef.current?.click()}
          className="w-full rounded-xl border-2 border-dashed border-gray-200 p-4 text-sm font-medium hover:border-primary/40"
          disabled={uploadingDesign}
        >
          {uploadingDesign ? "جاري التحسين والرفع..." : "رفع تصميم كامل (1200×480) مع تحسين تلقائي"}
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => update({ full_design_mode: !current.full_design_mode })}
            className={cn("flex-1 rounded-xl py-2 text-sm font-medium", current.full_design_mode ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600")}
          >
            {current.full_design_mode ? "التصميم الكامل مفعّل" : "تفعيل التصميم الكامل"}
          </button>
          {current.full_design_url ? (
            <button
              type="button"
              onClick={() => update({ full_design_url: null, full_design_mode: false })}
              className="rounded-xl px-3 py-2 bg-red-50 text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        <input ref={designInputRef} type="file" accept="image/*" onChange={onUploadDesign} className="hidden" />
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
        <p className="text-sm font-bold text-gray-800">منتج مميز في البانر</p>
        <select
          value={current.featured_product_id || ""}
          onChange={(e) => update({ featured_product_id: e.target.value || null })}
          className="w-full rounded-xl bg-amal-grey px-4 py-3 text-sm"
        >
          <option value="">بدون منتج مميز</option>
          {menuItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}{item.nameEn ? ` - ${item.nameEn}` : ""}
            </option>
          ))}
        </select>
        {current.featured_product_id ? (
          <input
            value={current.featured_product_label}
            onChange={(e) => update({ featured_product_label: e.target.value })}
            placeholder="نص الشارة للمنتج المميز"
            className="w-full rounded-xl bg-amal-grey px-4 py-3 text-sm"
          />
        ) : null}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
        <div className="flex items-center gap-2 text-gray-800">
          <CalendarClock className="h-4 w-4" />
          <p className="text-sm font-bold">جدولة بانر موسمي</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="text-xs text-gray-500">
            بداية العرض
            <input
              type="datetime-local"
              value={scheduleStart || toInputDateTime(schedule.start_at)}
              onChange={(e) => setScheduleStart(e.target.value)}
              className="w-full mt-1 rounded-xl bg-amal-grey px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs text-gray-500">
            نهاية العرض
            <input
              type="datetime-local"
              value={scheduleEnd || toInputDateTime(schedule.end_at)}
              onChange={(e) => setScheduleEnd(e.target.value)}
              className="w-full mt-1 rounded-xl bg-amal-grey px-3 py-2 text-sm"
            />
          </label>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSchedule}
            disabled={scheduling}
            className="flex-1 rounded-xl bg-indigo-600 text-white py-2.5 text-sm font-bold disabled:opacity-50"
          >
            {scheduling ? "جاري الجدولة..." : "جدولة المسودة"}
          </button>
          <button
            type="button"
            onClick={() => clearSchedule()}
            className="rounded-xl bg-gray-100 text-gray-600 px-3 py-2.5 text-sm font-medium"
          >
            إلغاء الجدولة
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
        <div className="flex items-center gap-2 text-gray-800">
          <History className="h-4 w-4" />
          <p className="text-sm font-bold">آخر 3 نسخ</p>
        </div>
        {history.length === 0 ? <p className="text-xs text-gray-500">لا توجد نسخ محفوظة بعد.</p> : null}
        <div className="space-y-2">
          {history.map((item) => (
            <div key={item.id} className="rounded-xl border border-gray-100 px-3 py-2 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{item.config.title || "بدون عنوان"}</p>
                <p className="text-xs text-gray-500 inline-flex items-center gap-1">
                  <Clock3 className="h-3 w-3" />
                  {new Date(item.saved_at).toLocaleString("ar-SA")} · {item.kind}
                </p>
              </div>
              <button
                type="button"
                onClick={() => restoreVersionToDraft(item.id)}
                className="text-xs rounded-lg bg-gray-100 px-2 py-1 font-medium"
              >
                استرجاع للمسودة
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setDraft(DEFAULT_BANNER)
            setSavedNotice(null)
          }}
          className="rounded-xl bg-gray-100 text-gray-600 px-4 py-3 text-sm font-medium inline-flex items-center gap-1"
        >
          <RotateCcw className="h-4 w-4" />
          إعادة تعيين
        </button>
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={savingDraft}
          className="flex-1 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-bold disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {savingDraft ? <Upload className="h-4 w-4 animate-pulse" /> : <Check className="h-4 w-4" />}
          حفظ كمسودة
        </button>
        <button
          type="button"
          onClick={onPublish}
          disabled={publishing}
          className="flex-1 rounded-xl bg-emerald-600 text-white py-3 text-sm font-bold disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {publishing ? <Upload className="h-4 w-4 animate-pulse" /> : <ImageIcon className="h-4 w-4" />}
          نشر الآن
        </button>
      </section>
    </div>
  )
}
