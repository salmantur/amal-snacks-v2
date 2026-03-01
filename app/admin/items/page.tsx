"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight, Plus, Pencil, Trash2, Search, X, Check,
  Upload, Loader2, ChevronDown, ImageIcon
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { categories } from "@/lib/data"

interface MenuItem {
  id: string
  name: string
  nameEn: string
  description: string
  price: number
  image: string
  category: string
  ingredients: string
  limit: number
  inStock: boolean
  makingTime: number
  isFeatured: boolean
  images: string[]
}

const EMPTY_ITEM: Omit<MenuItem, "id"> = {
  name: "", nameEn: "", description: "",
  price: 0, image: "", category: "",
  ingredients: "", limit: 0, inStock: true, makingTime: 0, isFeatured: false, images: [],
}

const ALL_CATEGORIES = categories.flatMap((cat) =>
  cat.sections
    ? cat.sections.map((s) => ({ value: s.dbCategory, label: `${cat.label} — ${s.label}` }))
    : (cat.dbCategories || []).map((db) => ({ value: db, label: cat.label }))
)

const SUPABASE_URL = "https://eejlqdydoilbjpegxvbq.supabase.co"

export default function ItemsPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [modalItem, setModalItem] = useState<Partial<MenuItem> | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [galleryUploading, setGalleryUploading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [ingredientInput, setIngredientInput] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => { loadItems() }, [])

  async function loadItems() {
    setLoading(true)
    const { data, error } = await supabase.from("menu").select("*").order("category")
    if (error) setError(error.message)
    else setItems((data || []).map(normalize))
    setLoading(false)
  }

  function normalize(raw: Record<string, unknown>): MenuItem {
    let img = String(raw.image || raw.img || raw.image_url || "")
    if (img.includes(",")) img = img.split(",")[0].trim()
    return {
      id: String(raw.id),
      name: String(raw.name || ""),
      nameEn: String(raw.name_en || ""),
      description: String(raw.description || ""),
      price: Number(raw.price) || 0,
      image: img,
      category: String(raw.category || ""),
      ingredients: Array.isArray(raw.ingredients)
        ? raw.ingredients.join(", ")
        : String(raw.ingredients || ""),
      limit: Number(raw.limit) || 0,
      inStock: raw.in_stock !== false,
      makingTime: Number(raw.making_time) || 0,
      isFeatured: raw.is_featured === true,
      images: Array.isArray(raw.images) ? raw.images : [],
    }
  }

  function flash(msg: string) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  function openModal(item: Partial<MenuItem>, isNewItem: boolean) {
    setModalItem(item)
    setIsNew(isNewItem)
    setError(null)
    setIngredientInput("")
    document.body.style.overflow = "hidden"
  }

  function closeModal() {
    setModalItem(null)
    document.body.style.overflow = ""
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !modalItem) return
    setImageUploading(true)
    const ext = file.name.split(".").pop()
    const filename = `${Date.now()}.${ext}`
    const { error } = await supabase.storage.from("Menu").upload(filename, file, { upsert: true })
    if (error) {
      setError("فشل رفع الصورة: " + error.message)
    } else {
      const url = `${SUPABASE_URL}/storage/v1/object/public/Menu/${filename}`
      setModalItem((prev) => ({ ...prev, image: url }))
    }
    setImageUploading(false)
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length || !modalItem) return
    setGalleryUploading(true)
    const uploaded: string[] = []
    for (const file of files) {
      const filename = `gallery_${Date.now()}_${Math.random().toString(36).slice(2)}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`
      const { error } = await supabase.storage.from("Menu").upload(filename, file, { upsert: true })
      if (!error) {
        uploaded.push(`${SUPABASE_URL}/storage/v1/object/public/Menu/${filename}`)
      }
    }
    setModalItem(prev => prev ? ({ ...prev, images: [...(prev.images || []), ...uploaded] }) : prev)
    setGalleryUploading(false)
    e.target.value = ""
  }

  async function handleSave() {
    if (!modalItem) return
    if (!modalItem.name?.trim()) { setError("الاسم مطلوب"); return }
    if (!modalItem.category) { setError("الفئة مطلوبة"); return }
    if (!modalItem.price || modalItem.price <= 0) { setError("السعر يجب أن يكون أكبر من صفر"); return }
    setSaving(true)
    setError(null)
    const payload = {
      name: modalItem.name,
      name_en: modalItem.nameEn || "",
      description: modalItem.description || "",
      price: modalItem.price,
      image: modalItem.image || "",
      category: modalItem.category,
      ingredients: modalItem.ingredients || "",
      limit: modalItem.limit || 0,
      in_stock: modalItem.inStock !== false,
      making_time: modalItem.makingTime || 0,
      is_featured: modalItem.isFeatured === true,
      images: modalItem.images || [],
    }
    if (isNew) {
      const { error } = await supabase.from("menu").insert(payload)
      if (error) setError(error.message)
      else { flash("تم الإضافة ✓"); closeModal(); loadItems() }
    } else {
      const { error } = await supabase.from("menu").update(payload).eq("id", modalItem.id)
      if (error) setError(error.message)
      else { flash("تم الحفظ ✓"); closeModal(); loadItems() }
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    const { error } = await supabase.from("menu").delete().eq("id", id)
    if (error) setError(error.message)
    else { flash("تم الحذف"); setItems((prev) => prev.filter((i) => i.id !== id)) }
    setDeleting(null)
    setDeleteConfirm(null)
  }

  function addIngredient(val: string) {
    const trimmed = val.trim()
    if (!trimmed) return
    const current = (modalItem?.ingredients || "").split(",").map(t => t.trim()).filter(Boolean)
    if (!current.includes(trimmed)) {
      setModalItem(p => ({ ...p, ingredients: [...current, trimmed].join(", ") }))
    }
    setIngredientInput("")
  }

  const filtered = items.filter(item => {
    const matchSearch = item.name.includes(search) || item.nameEn.toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCategory === "all" || item.category === filterCategory
    return matchSearch && matchCat
  })

  function getDisplayImage(img: string) {
    if (!img) return null
    if (img.startsWith("http")) return img
    return `${SUPABASE_URL}/storage/v1/object/public/Menu/${img}`
  }

  const getCategoryLabel = (val: string) =>
    ALL_CATEGORIES.find(c => c.value === val)?.label || val

  const tags = (modalItem?.ingredients || "").split(",").map(t => t.trim()).filter(Boolean)

  return (
    /* NO dir="rtl" on main — we control direction per element */
    <main className="min-h-screen bg-[#f5f5f5]">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100" style={{ transform: "translateZ(0)" }}>
        {/* Title row — LTR so back arrow is on left, add button on right */}
        <div className="flex items-center justify-between px-4 py-3">
          <Link
            href="/admin"
            className="w-11 h-11 rounded-full bg-[#f5f5f5] flex items-center justify-center active:scale-95 transition-transform flex-shrink-0"
          >
            <ArrowRight className="h-5 w-5" />
          </Link>
          {/* Title centred, Arabic */}
          <div className="text-center">
            <h1 className="text-lg font-bold" dir="rtl">إدارة الأصناف</h1>
            <p className="text-xs text-gray-400">{items.length} صنف</p>
          </div>
          <button
            onClick={() => openModal({ ...EMPTY_ITEM }, true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-black text-white rounded-full font-medium text-sm active:scale-95 transition-transform flex-shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span dir="rtl">إضافة</span>
          </button>
        </div>

        {/* Search + filter row — LTR container, inputs RTL */}
        <div className="flex gap-2 px-4 pb-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="بحث..."
              dir="rtl"
              className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-[#f5f5f5] text-sm focus:outline-none"
            />
          </div>
          <div className="relative flex-shrink-0">
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              dir="rtl"
              className="appearance-none pr-3 pl-7 py-2.5 rounded-xl bg-[#f5f5f5] text-sm focus:outline-none cursor-pointer max-w-[120px]"
            >
              <option value="all">الكل</option>
              {ALL_CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </header>

      {/* Toast */}
      {successMsg && (
        <div className="fixed top-4 left-4 right-4 z-50 p-4 bg-green-700 text-white rounded-2xl shadow-xl flex items-center gap-2">
          <Check className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium" dir="rtl">{successMsg}</span>
        </div>
      )}

      {/* Items list */}
      <div className="p-4 pb-32">
        {loading ? (
          <div className="grid gap-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 flex gap-3 animate-pulse">
                <div className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p dir="rtl">لا توجد أصناف</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map(item => {
              const imgSrc = getDisplayImage(item.image)
              return (
                <div key={item.id} className="bg-white rounded-2xl p-3 flex items-center gap-3 shadow-sm w-full overflow-hidden">

                  {/* Image — leftmost */}
                  <div className="w-20 h-20 rounded-2xl bg-[#f5f5f5] overflow-hidden flex-shrink-0">
                    {imgSrc
                      ? <Image src={imgSrc} alt={item.name} fill className="object-cover" unoptimized />
                      : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="h-6 w-6 text-gray-300" /></div>
                    }
                  </div>

                  {/* Info — RTL, fills remaining space */}
                  <div className="flex-1 min-w-0 text-right" dir="rtl">
                    <p className="font-bold text-sm truncate">{item.name}</p>
                    {item.nameEn && <p className="text-xs text-gray-400 truncate">{item.nameEn}</p>}
                    <div className="flex items-center gap-2 justify-end mt-0.5">
                      <p className="text-sm font-bold">{item.price} ر.س</p>
                      {!item.inStock && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">نفذ</span>
                      )}
                    </div>
                  </div>

                  {/* Actions — rightmost */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => openModal({ ...item }, false)}
                      className="w-10 h-10 rounded-xl bg-[#f5f5f5] flex items-center justify-center active:scale-95 transition-transform"
                    >
                      <Pencil className="h-4 w-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(item.id)}
                      className="w-10 h-10 rounded-xl bg-[#f5f5f5] flex items-center justify-center active:scale-95 transition-transform"
                    >
                      {deleting === item.id
                        ? <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                        : <Trash2 className="h-4 w-4 text-red-500" />
                      }
                    </button>
                  </div>

                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6" dir="rtl">
            <h3 className="text-lg font-bold text-center mb-2">تأكيد الحذف</h3>
            <p className="text-sm text-gray-500 text-center mb-6">هل أنت متأكد من حذف هذا الصنف؟</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3.5 rounded-2xl bg-[#f5f5f5] font-medium active:scale-95 transition-transform">إلغاء</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-3.5 rounded-2xl bg-red-500 text-white font-medium active:scale-95 transition-transform">حذف</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Add Modal */}
      {modalItem && (
        <div className="fixed inset-0 z-50 bg-black/50">
          <div
            className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl flex flex-col"
            style={{ height: "94svh" }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <button onClick={closeModal} className="w-11 h-11 rounded-full bg-[#f5f5f5] flex items-center justify-center active:scale-95 transition-transform flex-shrink-0">
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-base font-bold" dir="rtl">{isNew ? "إضافة صنف" : "تعديل الصنف"}</h2>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-full text-sm font-medium disabled:opacity-50 active:scale-95 transition-transform flex-shrink-0"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                <span dir="rtl">حفظ</span>
              </button>
            </div>

            {/* Modal body — scrollable */}
            <div
              className="flex-1 overflow-y-auto px-5 py-4 space-y-5"
              style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}
            >
              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl text-center" dir="rtl">{error}</div>
              )}

              {/* Image */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-right" dir="rtl">الصورة</label>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-24 rounded-2xl bg-[#f5f5f5] flex items-center justify-center overflow-hidden flex-shrink-0">
                    {modalItem.image
                      ? <Image src={getDisplayImage(modalItem.image) || modalItem.image || ""} alt="preview" fill className="object-cover" unoptimized />
                      : <ImageIcon className="h-7 w-7 text-gray-300" />
                    }
                  </div>
                  <div className="flex-1 space-y-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={imageUploading}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-gray-200 text-sm active:scale-95 transition-transform"
                    >
                      {imageUploading ? <><Loader2 className="h-4 w-4 animate-spin" /> جاري الرفع...</> : <><Upload className="h-4 w-4" /> رفع صورة</>}
                    </button>
                    <input
                      value={modalItem.image || ""}
                      onChange={e => setModalItem(p => ({ ...p, image: e.target.value }))}
                      placeholder="أو رابط الصورة"
                      dir="ltr"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#f5f5f5] text-sm focus:outline-none text-left"
                    />
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </div>

              {/* Arabic Name */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-right" dir="rtl">الاسم بالعربي <span className="text-red-500">*</span></label>
                <input
                  value={modalItem.name || ""}
                  onChange={e => setModalItem(p => ({ ...p, name: e.target.value }))}
                  placeholder="مثال: سمبوسة جبن"
                  dir="rtl"
                  className="w-full px-4 py-3.5 rounded-2xl bg-[#f5f5f5] focus:outline-none text-right text-base"
                />
              </div>

              {/* English Name */}
              <div>
                <label className="block text-sm font-semibold mb-1.5">English Name</label>
                <input
                  value={modalItem.nameEn || ""}
                  onChange={e => setModalItem(p => ({ ...p, nameEn: e.target.value }))}
                  placeholder="e.g. Cheese Samboosa"
                  dir="ltr"
                  className="w-full px-4 py-3.5 rounded-2xl bg-[#f5f5f5] focus:outline-none text-left text-base"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-right" dir="rtl">الوصف</label>
                <textarea
                  value={modalItem.description || ""}
                  onChange={e => setModalItem(p => ({ ...p, description: e.target.value }))}
                  placeholder="وصف الصنف"
                  rows={2}
                  dir="rtl"
                  className="w-full px-4 py-3.5 rounded-2xl bg-[#f5f5f5] focus:outline-none text-right resize-none text-base"
                />
              </div>

              {/* Price + Limit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-right" dir="rtl">السعر (ر.س) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={modalItem.price || ""}
                    onChange={e => setModalItem(p => ({ ...p, price: Number(e.target.value) }))}
                    placeholder="0"
                    className="w-full px-4 py-3.5 rounded-2xl bg-[#f5f5f5] focus:outline-none text-center text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-right" dir="rtl">حد الاختيار</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={modalItem.limit || ""}
                    onChange={e => setModalItem(p => ({ ...p, limit: Number(e.target.value) }))}
                    placeholder="0"
                    className="w-full px-4 py-3.5 rounded-2xl bg-[#f5f5f5] focus:outline-none text-center text-base"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-right" dir="rtl">الفئة <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select
                    value={modalItem.category || ""}
                    onChange={e => setModalItem(p => ({ ...p, category: e.target.value }))}
                    dir="rtl"
                    className="w-full appearance-none px-4 py-3.5 rounded-2xl bg-[#f5f5f5] focus:outline-none text-right cursor-pointer text-base"
                  >
                    <option value="">اختر الفئة</option>
                    {ALL_CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* In Stock toggle */}
              <div className="flex items-center justify-between p-4 bg-[#f5f5f5] rounded-2xl">
                <div dir="rtl">
                  <p className="font-semibold text-sm">متوفر في المخزون</p>
                  <p className="text-xs text-gray-400 mt-0.5">إيقاف يخفي الصنف من القائمة</p>
                </div>
                <button
                  onClick={() => setModalItem(p => ({ ...p, inStock: !p?.inStock }))}
                  className={`w-14 h-8 rounded-full transition-colors relative flex-shrink-0 ml-3 ${modalItem.inStock !== false ? "bg-black" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all duration-200 ${modalItem.inStock !== false ? "left-7" : "left-1"}`} />
                </button>
              </div>

              {/* Gallery Images */}
              <div dir="rtl">
                <p className="font-semibold text-sm mb-2">🖼️ صور إضافية (جاليري)</p>
                <div className="flex gap-2 flex-wrap mb-2">
                  {(modalItem.images || []).map((url, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#f5f5f5] flex-shrink-0">
                      <Image src={url} alt="" fill className="object-cover" unoptimized />
                      <button
                        onClick={() => setModalItem(prev => prev ? ({ ...prev, images: (prev.images || []).filter((_, i) => i !== idx) }) : prev)}
                        className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <label className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors flex-shrink-0">
                    {galleryUploading
                      ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      : <><Upload className="h-4 w-4 text-muted-foreground" /><span className="text-[10px] text-muted-foreground mt-0.5">إضافة</span></>
                    }
                    <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" />
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">يمكنك إضافة أكثر من صورة — ستظهر كصور إضافية في صفحة المنتج</p>
              </div>

              {/* Making Time */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-right" dir="rtl">⏱️ وقت التحضير</label>
                <select
                  value={modalItem.makingTime || 0}
                  onChange={(e) => setModalItem((p) => ({ ...p, makingTime: Number(e.target.value) }))}
                  className="w-full px-4 py-3.5 rounded-2xl bg-[#f5f5f5] focus:outline-none text-right text-base cursor-pointer"
                  dir="rtl"
                >
                  <option value={0}>بدون وقت تحضير (فوري)</option>
                  <option value={30}>30 دقيقة</option>
                  <option value={60}>1 ساعة</option>
                  <option value={90}>1.5 ساعة</option>
                  <option value={120}>2 ساعة</option>
                  <option value={180}>3 ساعات</option>
                  <option value={240}>4 ساعات</option>
                  <option value={360}>6 ساعات</option>
                  <option value={720}>12 ساعة</option>
                  <option value={1440}>24 ساعة (يوم كامل)</option>
                </select>
                <p className="text-xs text-gray-400 mt-1 text-right" dir="rtl">يحدد أقرب موعد توصيل متاح للعميل</p>
              </div>

              {/* Options / Ingredients */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-right" dir="rtl">الخيارات / المكونات</label>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3 p-3 bg-[#f5f5f5] rounded-2xl">
                    {tags.map((tag, i) => (
                      <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-sm border border-gray-100 shadow-sm" dir="rtl">
                        {tag}
                        <button
                          onClick={() => {
                            const newTags = tags.filter((_, idx) => idx !== i)
                            setModalItem(p => ({ ...p, ingredients: newTags.join(", ") }))
                          }}
                          className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center active:bg-red-100 flex-shrink-0"
                        >
                          <X className="h-3 w-3 text-gray-500" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    value={ingredientInput}
                    onChange={e => setIngredientInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addIngredient(ingredientInput) } }}
                    placeholder="مثال: جبن، لحم..."
                    dir="rtl"
                    className="flex-1 px-4 py-3.5 rounded-2xl bg-[#f5f5f5] focus:outline-none text-right text-base"
                  />
                  <button
                    onClick={() => addIngredient(ingredientInput)}
                    className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5 text-right" dir="rtl">اكتب الخيار واضغط Enter أو +</p>
              </div>

              <div className="h-8" />
            </div>
          </div>
        </div>
      )}

    </main>
  )
}