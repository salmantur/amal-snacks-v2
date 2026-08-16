"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { ImageIcon, Loader2, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useCateringPhotosConfig } from "@/hooks/use-catering-photos-config"
import { CATERING_PHOTOS_SLOT_COUNT } from "@/lib/catering-photos-config"

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

async function uploadToSupabase(file: File, prefix: string) {
  const supabase = createClient()
  const filename = `${prefix}_${Date.now()}.webp`

  let uploadPath: string | null = null
  let bucket = "Menu"

  const first = await supabase.storage.from("Menu").upload(filename, file, {
    upsert: true,
    cacheControl: "31536000",
    contentType: "image/webp",
  })

  if (first.error) {
    const second = await supabase.storage.from("app-assets").upload(filename, file, {
      upsert: true,
      cacheControl: "31536000",
      contentType: "image/webp",
    })
    if (!second.error && second.data) {
      uploadPath = second.data.path
      bucket = "app-assets"
    }
  } else if (first.data) {
    uploadPath = first.data.path
  }

  if (!uploadPath) return null
  return supabase.storage.from(bucket).getPublicUrl(uploadPath).data.publicUrl
}

function PhotoSlot({
  index,
  url,
  onUpload,
  onRemove,
}: {
  index: number
  url: string | null
  onUpload: (file: File) => void
  onRemove: () => void
}) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setUploading(true)
    await onUpload(file)
    setUploading(false)
  }

  return (
    <div className="relative aspect-square overflow-hidden rounded-2xl border border-admin-border-soft bg-admin-bg">
      {url ? (
        <>
          <Image src={url} alt={`صورة مناسبة ${index + 1}`} fill sizes="240px" className="object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex gap-1.5 bg-gradient-to-t from-black/60 to-transparent p-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex-1 rounded-lg bg-white/90 py-1.5 text-[11px] font-bold text-admin-ink disabled:opacity-50"
            >
              {uploading ? <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin" /> : "استبدال"}
            </button>
            <button
              type="button"
              onClick={onRemove}
              disabled={uploading}
              className="rounded-lg bg-white/90 p-1.5 text-red-600 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-full w-full flex-col items-center justify-center gap-1.5 p-3 text-center disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-admin-muted-2" />
          ) : (
            <>
              <ImageIcon className="h-6 w-6 text-admin-muted-2" />
              <span className="text-[11px] text-admin-muted-2">رفع صورة</span>
            </>
          )}
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
    </div>
  )
}

export function CateringPhotosEditor() {
  const { config, loading, error, saveConfig } = useCateringPhotosConfig()
  const [savingIndex, setSavingIndex] = useState<number | null>(null)

  async function handleUpload(index: number, file: File) {
    setSavingIndex(index)
    const optimized = await optimizeImage(file, 900, 0.82)
    const url = await uploadToSupabase(optimized, `catering_photo_${index}`)
    if (url) {
      const nextPhotos = [...config.photos]
      nextPhotos[index] = url
      await saveConfig({ photos: nextPhotos })
    }
    setSavingIndex(null)
  }

  async function handleRemove(index: number) {
    setSavingIndex(index)
    const nextPhotos = [...config.photos]
    nextPhotos[index] = null
    await saveConfig({ photos: nextPhotos })
    setSavingIndex(null)
  }

  if (loading) return <div className="h-48 animate-pulse rounded-2xl bg-admin-bg" />

  return (
    <div className="space-y-4" dir="rtl">
      <section className="space-y-3 rounded-2xl border border-admin-border-soft bg-white p-4">
        <div>
          <p className="text-sm font-bold text-admin-ink">صور "من مناسباتنا"</p>
          <p className="mt-0.5 text-xs text-admin-muted-2">
            تظهر هذه الصور في أعلى صفحة كاترينج المناسبات لعرض صور حقيقية من مناسبات سابقة. يتم تحسين الصور تلقائيًا عند الرفع.
          </p>
        </div>
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
        <div className="grid grid-cols-2 gap-2.5">
          {Array.from({ length: CATERING_PHOTOS_SLOT_COUNT }).map((_, index) => (
            <PhotoSlot
              key={index}
              index={index}
              url={config.photos[index] ?? null}
              onUpload={(file) => handleUpload(index, file)}
              onRemove={() => handleRemove(index)}
            />
          ))}
        </div>
        {savingIndex !== null ? <p className="text-xs text-admin-muted-2">جاري الحفظ...</p> : null}
      </section>
    </div>
  )
}
