"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Check, Upload, X, Eye, EyeOff, ImageIcon } from "lucide-react"
import { useBannerConfig, DEFAULT_BANNER, type BannerConfig } from "@/hooks/use-banner-config"
import { useMenu } from "@/hooks/use-menu"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const PRESET_GRADIENTS = [
  { label: "وردي (الافتراضي)", from: "#fce4ec", to: "#f8bbd0" },
  { label: "أخضر", from: "#e8f5e9", to: "#c8e6c9" },
  { label: "أصفر", from: "#fffde7", to: "#fff9c4" },
  { label: "أزرق", from: "#e3f2fd", to: "#bbdefb" },
  { label: "بنفسجي", from: "#f3e5f5", to: "#e1bee7" },
  { label: "برتقالي", from: "#fff3e0", to: "#ffe0b2" },
  { label: "أبيض", from: "#ffffff", to: "#f5f5f5" },
  { label: "داكن", from: "#1e293b", to: "#334155" },
]

export function HeroBannerEditor() {
  const { config, loading, saveConfig } = useBannerConfig()
  const { menuItems } = useMenu()
  const [draft, setDraft] = useState<BannerConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const designInputRef = useRef<HTMLInputElement>(null)
  const [uploadingDesign, setUploadingDesign] = useState(false)

  const current = draft ?? config

  const update = (patch: Partial<BannerConfig>) => {
    setDraft({ ...current, ...patch })
    setSaved(false)
  }

  const handleSave = async () => {
    if (!draft) return
    setSaving(true)
    await saveConfig(draft)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    setDraft(DEFAULT_BANNER)
    setSaved(false)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const supabase = createClient()
    const filename = `banner_${Date.now()}.${file.name.split(".").pop()}`

    // Try "Menu" bucket first (known to work), fallback to "app-assets"
    let uploadData = null
    let bucket = "Menu"
    const { data: d1, error: e1 } = await supabase.storage
      .from("Menu")
      .upload(filename, file, { upsert: true })

    if (e1) {
      const { data: d2, error: e2 } = await supabase.storage
        .from("app-assets")
        .upload(filename, file, { upsert: true })
      if (!e2) { uploadData = d2; bucket = "app-assets" }
    } else {
      uploadData = d1
    }

    if (uploadData) {
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(uploadData.path)
      update({ image_url: urlData.publicUrl })
    }
    setUploading(false)
    // Reset input so same file can be re-uploaded
    e.target.value = ""
  }

  const handleDesignUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingDesign(true)
    const supabase = createClient()
    const filename = `banner_design_${Date.now()}.${file.name.split(".").pop()}`
    const { data: d1, error: e1 } = await supabase.storage.from("Menu").upload(filename, file, { upsert: true })
    if (!e1 && d1) {
      const { data: urlData } = supabase.storage.from("Menu").getPublicUrl(d1.path)
      update({ full_design_url: urlData.publicUrl, full_design_mode: true })
    }
    setUploadingDesign(false)
    e.target.value = ""
  }

  if (loading) {
    return <div className="h-40 bg-amal-grey rounded-2xl animate-pulse" />
  }

  return (
    <div className="space-y-6">
      {/* Live Preview */}
      <div>
        <p className="text-sm font-medium text-muted-foreground mb-2">معاينة مباشرة</p>
        <div
          className="rounded-3xl p-6 text-center overflow-hidden relative"
          style={{ background: `linear-gradient(135deg, ${current.bg_from}, ${current.bg_to})` }}
        >
          {current.image_url && (
            <div className="absolute inset-0 rounded-3xl overflow-hidden">
              <Image src={current.image_url} alt="preview" fill className="object-cover opacity-20" />
            </div>
          )}
          <div className="relative z-10">
            {current.show_badge && current.badge && (
              <span className="text-sm text-primary font-medium">{current.badge}</span>
            )}
            <h2 className="text-2xl font-bold text-foreground mt-1">{current.title || "العنوان"}</h2>
            {current.show_subtitle && current.subtitle && (
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed whitespace-pre-line">
                {current.subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Text Fields */}
      <div className="space-y-3">
        <h3 className="font-bold text-[#1e293b]">النصوص</h3>

        {/* Badge row */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => update({ show_badge: !current.show_badge })}
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
              current.show_badge ? "bg-[#1e5631] text-white" : "bg-amal-grey text-muted-foreground"
            )}
            title={current.show_badge ? "إخفاء الشارة" : "إظهار الشارة"}
          >
            {current.show_badge ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
          <input
            type="text"
            placeholder="شارة صغيرة (مثل: جديدنا اليوم)"
            value={current.badge}
            onChange={(e) => update({ badge: e.target.value })}
            disabled={!current.show_badge}
            className="flex-1 py-3 px-4 rounded-xl bg-amal-grey text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-40"
          />
        </div>

        {/* Title */}
        <input
          type="text"
          placeholder="العنوان الرئيسي *"
          value={current.title}
          onChange={(e) => update({ title: e.target.value })}
          className="w-full py-3 px-4 rounded-xl bg-amal-grey text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold text-lg"
        />

        {/* Subtitle row */}
        <div className="flex items-start gap-2">
          <button
            onClick={() => update({ show_subtitle: !current.show_subtitle })}
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 transition-colors",
              current.show_subtitle ? "bg-[#1e5631] text-white" : "bg-amal-grey text-muted-foreground"
            )}
            title={current.show_subtitle ? "إخفاء النص الفرعي" : "إظهار النص الفرعي"}
          >
            {current.show_subtitle ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
          <textarea
            placeholder="النص الفرعي (اختياري)"
            value={current.subtitle}
            onChange={(e) => update({ subtitle: e.target.value })}
            disabled={!current.show_subtitle}
            rows={2}
            className="flex-1 py-3 px-4 rounded-xl bg-amal-grey text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none disabled:opacity-40"
          />
        </div>
      </div>

      {/* Background */}
      <div className="space-y-3">
        <h3 className="font-bold text-[#1e293b]">لون الخلفية</h3>
        <div className="grid grid-cols-4 gap-2">
          {PRESET_GRADIENTS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => update({ bg_from: preset.from, bg_to: preset.to })}
              className={cn(
                "h-12 rounded-xl border-2 transition-all",
                current.bg_from === preset.from
                  ? "border-[#1e5631] scale-95"
                  : "border-transparent hover:border-gray-300"
              )}
              style={{ background: `linear-gradient(135deg, ${preset.from}, ${preset.to})` }}
              title={preset.label}
            />
          ))}
        </div>

        {/* Custom color pickers */}
        <div className="flex gap-3">
          <div className="flex items-center gap-2 flex-1">
            <input
              type="color"
              value={current.bg_from}
              onChange={(e) => update({ bg_from: e.target.value })}
              className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
            />
            <span className="text-sm text-muted-foreground">من</span>
          </div>
          <div className="flex items-center gap-2 flex-1">
            <input
              type="color"
              value={current.bg_to}
              onChange={(e) => update({ bg_to: e.target.value })}
              className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
            />
            <span className="text-sm text-muted-foreground">إلى</span>
          </div>
        </div>
      </div>

      {/* Image */}
      <div className="space-y-3">
        <h3 className="font-bold text-[#1e293b]">صورة خلفية (اختياري)</h3>

        {/* Upload area */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full relative rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden transition-all hover:border-primary/50 active:scale-[0.99] disabled:opacity-60"
          style={{ minHeight: 120 }}
        >
          {current.image_url ? (
            <div className="relative w-full" style={{ aspectRatio: "16/7" }}>
              <Image src={current.image_url} alt="banner preview" fill className="object-cover" />
              <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center gap-1">
                <Upload className="h-6 w-6 text-white" />
                <span className="text-white text-sm font-medium">استبدال الصورة</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-8">
              {uploading ? (
                <>
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-muted-foreground">جاري الرفع...</span>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-sm font-medium">اضغط لرفع صورة</span>
                  <span className="text-xs text-muted-foreground">PNG, JPG, WEBP</span>
                </>
              )}
            </div>
          )}
        </button>

        {/* Remove image */}
        {current.image_url && (
          <button
            onClick={() => update({ image_url: null })}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 text-red-500 text-sm hover:bg-red-100 transition-colors w-full justify-center"
          >
            <X className="h-4 w-4" />
            حذف الصورة
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        <p className="text-xs text-muted-foreground text-center">الصورة ستظهر بشفافية خلف النص</p>
      </div>

      {/* Full Design Banner */}
      <div className="space-y-3 pt-2 border-t border-border/50">
        <div dir="rtl">
          <p className="font-semibold text-sm">🎨 تصميم كامل للبانر</p>
          <p className="text-xs text-muted-foreground mt-0.5">ارفع صورة تصميم تملأ البانر بالكامل</p>
          <p className="text-xs text-primary font-medium mt-1">📐 الحجم المُوصى به: 1200 × 480 بكسل (نسبة 2.5:1)</p>
        </div>

        {/* Toggle */}
        {current.full_design_url && (
          <button
            onClick={() => update({ full_design_mode: !current.full_design_mode })}
            className={cn(
              "w-full py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2",
              current.full_design_mode
                ? "bg-[#1e5631] text-white"
                : "bg-amal-grey text-muted-foreground"
            )}
          >
            {current.full_design_mode ? <><Eye className="h-4 w-4" /> التصميم الكامل مفعّل</> : <><EyeOff className="h-4 w-4" /> التصميم الكامل معطّل</>}
          </button>
        )}

        {/* Upload area */}
        <button
          onClick={() => designInputRef.current?.click()}
          disabled={uploadingDesign}
          className="w-full relative rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden transition-all hover:border-primary/50 active:scale-[0.99] disabled:opacity-60"
          style={{ minHeight: 100 }}
        >
          {current.full_design_url ? (
            <div className="relative w-full" style={{ aspectRatio: "2.5/1" }}>
              <Image src={current.full_design_url} alt="full design" fill className="object-cover" unoptimized />
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1">
                <Upload className="h-5 w-5 text-white" />
                <span className="text-white text-sm font-medium">استبدال التصميم</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-6">
              {uploadingDesign ? (
                <><div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" /><span className="text-sm text-muted-foreground">جاري الرفع...</span></>
              ) : (
                <><div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center"><ImageIcon className="h-5 w-5 text-primary" /></div><span className="text-sm font-medium">ارفع تصميم البانر</span><span className="text-xs text-muted-foreground">1200 × 480 بكسل — PNG, JPG, WEBP</span></>
              )}
            </div>
          )}
        </button>

        {current.full_design_url && (
          <button
            onClick={() => update({ full_design_url: null, full_design_mode: false })}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 text-red-500 text-sm w-full justify-center"
          >
            <X className="h-4 w-4" /> حذف التصميم
          </button>
        )}

        <input ref={designInputRef} type="file" accept="image/*" onChange={handleDesignUpload} className="hidden" />
      </div>

      {/* Featured Product on Banner */}
      <div className="space-y-3 pt-2 border-t border-border/50">
        <div dir="rtl">
          <p className="font-semibold text-sm">🌟 منتج مميز على البانر</p>
          <p className="text-xs text-muted-foreground mt-0.5">يظهر على البانر الرئيسي مع زر "اطلب الآن"</p>
        </div>
        <select
          value={current.featured_product_id || ""}
          onChange={e => update({ featured_product_id: e.target.value || null })}
          className="w-full px-4 py-3 rounded-xl bg-amal-grey focus:outline-none text-sm text-right cursor-pointer"
          dir="rtl"
        >
          <option value="">— بدون منتج مميز (البانر العادي) —</option>
          {menuItems.map(item => (
            <option key={item.id} value={item.id}>
              {item.name}{item.nameEn ? ` — ${item.nameEn}` : ""}
            </option>
          ))}
        </select>
        {current.featured_product_id && (
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5" dir="rtl">نص الشارة (مثال: جديد 🔥 أو عرض اليوم)</label>
            <input
              type="text"
              value={current.featured_product_label || ""}
              onChange={e => update({ featured_product_label: e.target.value })}
              placeholder="جديد 🔥"
              className="w-full px-4 py-3 rounded-xl bg-amal-grey focus:outline-none text-sm text-right"
              dir="rtl"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleReset}
          className="px-4 py-3 rounded-xl bg-amal-grey text-muted-foreground hover:bg-amal-grey/80 transition-colors text-sm font-medium"
        >
          إعادة تعيين
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !draft}
          className={cn(
            "flex-1 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2",
            saved
              ? "bg-[#1e5631] text-white"
              : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          )}
        >
          {saved ? (
            <><Check className="h-4 w-4" /> تم الحفظ!</>
          ) : saving ? (
            "جاري الحفظ..."
          ) : (
            "حفظ التغييرات"
          )}
        </button>
      </div>
    </div>
  )
}