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
}

const EMPTY_ITEM: Omit<MenuItem, "id"> = {
  name: "", nameEn: "", description: "",
  price: 0, image: "", category: "",
  ingredients: "", limit: 0, inStock: true,
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
    // Prevent body scroll on iPhone
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
    <main className="min-h-screen bg-[#f5f5f5]" dir="rtl">

      {/* Header */}
      <header
        className="sticky top-0 z-40 bg-white border-b border-gray-100"
        style={{ transform: "translateZ(0)" }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="w-11 h-11 rounded-full bg-[#f5f5f5] flex items-center justify-center active:scale-95 transition-transform"
            >
              <ArrowRight className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold">إدارة الأصناف</h1>
              <p className="text-xs text-gray-400">{items.length} صنف</p>
            </div>
          </div>
          <button
            onClick={() => openModal({ ...EMPTY_ITEM }, true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-black text-white rounded-full font-medium text-sm active:scale-95 transition-transform"
          >
            <Plus className="h-4 w-4" />
            إضافة
          </button>
        </div>

        {/* Search + filter */}
        <div className="flex gap-2 px-4 pb-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="بحث..."
              className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-[#f5f5f5] text-sm focus:outline-none"
            />
          </div>
          <div className="relative">
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="appearance-none pr-3 pl-8 py-2.5 rounded-xl bg-[#f5f5f5] text-sm focus:outline-none cursor-pointer"
            >
              <option value="all">الكل</option>
              {ALL_CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </header>

      {/* Toast */}
      {successMsg && (
        <div className="fixed top-4 left-4 right-4 z-50 p-4 bg-green-700 text-white rounded-2xl shadow-xl flex items-center gap-2">
          <Check className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium">{successMsg}</span>
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
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد أصناف</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map(item => {
              const imgSrc = getDisplayImage(item.image)
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm"
                >
                  {/* Image */}
                  <div className="w-16 h-16 rounded-xl bg-[#f5f5f5] overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {imgSrc
                      ? <Image src={imgSrc} alt={item.name} width={64} height={64} className="object-cover w-full h-full" />
                      : <ImageIcon className="h-6 w-6 text-gray-300" />
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{item.name}</p>
                    {item.nameEn && <p className="text-xs text-gray-400 truncate">{item.nameEn}</p>}
                    <p className="text-xs text-gray-400">{getCategoryLabel(item.category)}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-sm font-bold text-black">{item.price} ر.س</p>
                      {!item.inStock && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">نفذ</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => openModal({ ...item }, false)}
                      className="w-11 h-11 rounded-xl bg-[#f5f5f5] flex items-center justify-center active:scale-95 transition-transform"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(item.id)}
                      className="w-11 h-11 rounded-xl bg-[#f5f5f5] flex items-center justify-center active:scale-95 transition-transform"
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
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 mb-safe">
            <h3 className="text-lg font-bold text-center mb-2">تأكيد الحذف</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              هل أنت متأكد من حذف هذا الصنف؟
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3.5 rounded-2xl bg-[#f5f5f5] font-medium active:scale-95 transition-transform"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-3.5 rounded-2xl bg-red-500 text-white font-medium active:scale-95 transition-transform"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Add Modal */}
      {modalItem && (
        <div
          className="fixed inset-0 z-50 bg-black/50"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div
            className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl flex flex-col"
            style={{ maxHeight: "94svh", height: "94svh" }}
          >
            {/* Modal header — fixed */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <button
                onClick={closeModal}
                className="w-11 h-11 rounded-full bg-[#f5f5f5] flex items-center justify-center active:scale-95 transition-transform"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-base font-bold">{isNew ? "إضافة صنف" : "تعديل الصنف"}</h2>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-full text-sm font-medium disabled:opacity-50 active:scale-95 transition-transform"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                حفظ
              </button>
            </div>

            {/* Modal body — scrollable */}
            <div
              className="flex-1 overflow-y-auto px-5 py-4 space-y-5"
              style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}
            >
              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl text-center">{error}</div>
              )}

              {/* Image */}
              <div>
                <label className="block text-sm font-semibold mb-2">الصورة</label>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-20 rounded-2xl bg-[#f5f5f5] flex items-center justify-center overflow-hidden flex-shrink-0">
                    {modalItem.image
                      ? <Image src={getDisplayImage(modalItem.image) || modalItem.image} alt="preview" width={80} height={80} className="object-cover w-full h-full" />
                      : <ImageIcon className="h-7 w-7 text-gray-300" />
                    }
                  </div>
                  <div className="flex-1 space-y-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={imageUploading}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-gray-200 text-sm active:scale-95 transition-transform"
                    >
                      {imageUploading
                        ? <><Loader2 className="h-4 w-4 animate-spin" /> جاري الرفع...</>
                        : <><Upload className="h-4 w-4" /> رفع صورة</>
                      }
                    </button>
                    <input
                      value={modalItem.image || ""}
                      onChange={e => setModalItem(p => ({ ...p, image: e.target.value }))}
                      placeholder="أو رابط الصورة"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#f5f5f5] text-sm focus:outline-none text-right"
                    />
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </div>

              {/* Arabic Name */}
              <div>
                <label className="block text-sm font-semibold mb-1.5">
                  الاسم بالعربي <span className="text-red-500">*</span>
                </label>
                <input
                  value={modalItem.name || ""}
                  onChange={e => setModalItem(p => ({ ...p, name: e.target.value }))}
                  placeholder="مثال: سمبوسة جبن"
                  className="w-full px-4 py-3.5 rounded-2xl bg-[#f5f5f5] focus:outline-none text-right text-base"
                  dir="rtl"
                />
              </div>

              {/* English Name */}
              <div>
                <label className="block text-sm font-semibold mb-1.5">الاسم بالإنجليزي</label>
                <input
                  value={modalItem.nameEn || ""}
                  onChange={e => setModalItem(p => ({ ...p, nameEn: e.target.value }))}
                  placeholder="e.g. Cheese Samboosa"
                  className="w-full px-4 py-3.5 rounded-2xl bg-[#f5f5f5] focus:outline-none text-left text-base"
                  dir="ltr"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold mb-1.5">الوصف</label>
                <textarea
                  value={modalItem.description || ""}
                  onChange={e => setModalItem(p => ({ ...p, description: e.target.value }))}
                  placeholder="وصف الصنف"
                  rows={2}
                  className="w-full px-4 py-3.5 rounded-2xl bg-[#f5f5f5] focus:outline-none text-right resize-none text-base"
                />
              </div>

              {/* Price + Limit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">
                    السعر (ر.س) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={modalItem.price || ""}
                    onChange={e => setModalItem(p => ({ ...p, price: Number(e.target.value) }))}
                    placeholder="0"
                    className="w-full px-4 py-3.5 rounded-2xl bg-[#f5f5f5] focus:outline-none text-right text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">حد الاختيار</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={modalItem.limit || ""}
                    onChange={e => setModalItem(p => ({ ...p, limit: Number(e.target.value) }))}
                    placeholder="0"
                    className="w-full px-4 py-3.5 rounded-2xl bg-[#f5f5f5] focus:outline-none text-right text-base"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold mb-1.5">
                  الفئة <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={modalItem.category || ""}
                    onChange={e => setModalItem(p => ({ ...p, category: e.target.value }))}
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
                <div>
                  <p className="font-semibold text-sm">متوفر في المخزون</p>
                  <p className="text-xs text-gray-400 mt-0.5">إيقاف يخفي الصنف من القائمة</p>
                </div>
                <button
                  onClick={() => setModalItem(p => ({ ...p, inStock: !p?.inStock }))}
                  className={`w-14 h-8 rounded-full transition-colors relative flex-shrink-0 ${
                    modalItem.inStock !== false ? "bg-black" : "bg-gray-300"
                  }`}
                >
                  <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    modalItem.inStock !== false ? "translate-x-1" : "right-1"
                  }`} />
                </button>
              </div>

              {/* Options / Ingredients — tag editor */}
              <div>
                <label className="block text-sm font-semibold mb-1.5">الخيارات / المكونات</label>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3 p-3 bg-[#f5f5f5] rounded-2xl">
                    {tags.map((tag, i) => (
                      <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-sm border border-gray-100 shadow-sm">
                        {tag}
                        <button
                          onClick={() => {
                            const newTags = tags.filter((_, idx) => idx !== i)
                            setModalItem(p => ({ ...p, ingredients: newTags.join(", ") }))
                          }}
                          className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center active:bg-red-100"
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
                    onKeyDown={e => {
                      if (e.key === "Enter") { e.preventDefault(); addIngredient(ingredientInput) }
                    }}
                    placeholder="مثال: جبن، لحم، دجاج..."
                    className="flex-1 px-4 py-3.5 rounded-2xl bg-[#f5f5f5] focus:outline-none text-right text-base"
                  />
                  <button
                    onClick={() => addIngredient(ingredientInput)}
                    className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">اكتب الخيار واضغط Enter أو +</p>
              </div>

              {/* Bottom padding for safe area */}
              <div className="h-8" />
            </div>
          </div>
        </div>
      )}

    </main>
  )
}