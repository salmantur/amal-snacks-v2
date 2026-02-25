"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight, Plus, Pencil, Trash2, Search, X, Check,
  Upload, Loader2, ChevronDown, ImageIcon
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { categories } from "@/lib/data"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
  ingredients: string
  limit: number
}

const EMPTY_ITEM: Omit<MenuItem, "id"> = {
  name: "",
  description: "",
  price: 0,
  image: "",
  category: "",
  ingredients: "",
  limit: 0,
}

// Flat list of all DB categories with their display labels
const ALL_CATEGORIES = categories.flatMap((cat) =>
  cat.sections
    ? cat.sections.map((s) => ({ value: s.dbCategory, label: `${cat.label} — ${s.label}` }))
    : (cat.dbCategories || []).map((db) => ({ value: db, label: cat.label }))
)

const SUPABASE_URL = "https://eejlqdydoilbjpegxvbq.supabase.co"

// ─── Main Page ────────────────────────────────────────────────────────────────

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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  // ── Load items ──
  useEffect(() => {
    loadItems()
  }, [])

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
      description: String(raw.description || ""),
      price: Number(raw.price) || 0,
      image: img,
      category: String(raw.category || ""),
      ingredients: Array.isArray(raw.ingredients)
        ? raw.ingredients.join(", ")
        : String(raw.ingredients || ""),
      limit: Number(raw.limit) || 0,
    }
  }

  function flash(msg: string) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  // ── Image upload to Supabase Storage ──
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

  // ── Save (create or update) ──
  async function handleSave() {
    if (!modalItem) return
    if (!modalItem.name?.trim()) { setError("الاسم مطلوب"); return }
    if (!modalItem.category) { setError("الفئة مطلوبة"); return }
    if (!modalItem.price || modalItem.price <= 0) { setError("السعر يجب أن يكون أكبر من صفر"); return }

    setSaving(true)
    setError(null)

    const payload = {
      name: modalItem.name,
      description: modalItem.description || "",
      price: modalItem.price,
      image: modalItem.image || "",
      category: modalItem.category,
      ingredients: modalItem.ingredients || "",
      limit: modalItem.limit || 0,
    }

    if (isNew) {
      const { error } = await supabase.from("menu").insert(payload)
      if (error) setError(error.message)
      else { flash("تم إضافة العنصر ✓"); setModalItem(null); loadItems() }
    } else {
      const { error } = await supabase.from("menu").update(payload).eq("id", modalItem.id)
      if (error) setError(error.message)
      else { flash("تم الحفظ ✓"); setModalItem(null); loadItems() }
    }
    setSaving(false)
  }

  // ── Delete ──
  async function handleDelete(id: string) {
    setDeleting(id)
    const { error } = await supabase.from("menu").delete().eq("id", id)
    if (error) setError(error.message)
    else { flash("تم الحذف"); setItems((prev) => prev.filter((i) => i.id !== id)) }
    setDeleting(null)
    setDeleteConfirm(null)
  }

  // ── Filtered items ──
  const filtered = items.filter((item) => {
    const matchSearch = item.name.includes(search) || item.description.includes(search)
    const matchCat = filterCategory === "all" || item.category === filterCategory
    return matchSearch && matchCat
  })

  const getCategoryLabel = (val: string) =>
    ALL_CATEGORIES.find((c) => c.value === val)?.label || val

  // ── Image display ──
  function getDisplayImage(img: string) {
    if (!img) return null
    if (img.startsWith("http")) return img
    return `${SUPABASE_URL}/storage/v1/object/public/Menu/${img}`
  }

  return (
    <main className="min-h-screen bg-amal-grey" dir="rtl">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="w-10 h-10 rounded-full bg-amal-grey flex items-center justify-center">
              <ArrowRight className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">إدارة الأصناف</h1>
              <p className="text-xs text-muted-foreground">{items.length} صنف</p>
            </div>
          </div>
          <button
            onClick={() => { setIsNew(true); setModalItem({ ...EMPTY_ITEM }); setError(null) }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            إضافة صنف
          </button>
        </div>

        {/* Search + filter */}
        <div className="flex gap-2 px-4 pb-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث..."
              className="w-full pr-9 pl-3 py-2 rounded-xl bg-amal-grey text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="relative">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="appearance-none pr-3 pl-8 py-2 rounded-xl bg-amal-grey text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="all">كل الفئات</option>
              {ALL_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </header>

      {/* ── Toast messages ── */}
      {successMsg && (
        <div className="fixed top-4 left-4 right-4 z-50 p-4 bg-[#1e5631] text-white rounded-2xl shadow-xl flex items-center gap-2 animate-slide-up">
          <Check className="h-5 w-5" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {/* ── Items list ── */}
      <div className="p-4">
        {loading ? (
          <div className="grid gap-3">
            {[1,2,3,4].map((i) => (
              <div key={i} className="bg-card rounded-2xl p-4 flex gap-3 animate-pulse">
                <div className="w-16 h-16 rounded-xl bg-gray-200 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد أصناف</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((item) => {
              const imgSrc = getDisplayImage(item.image)
              return (
                <div key={item.id} className="bg-card rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                  {/* Image */}
                  <div className="w-16 h-16 rounded-xl bg-amal-grey overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {imgSrc ? (
                      <Image src={imgSrc} alt={item.name} width={64} height={64} className="object-cover w-full h-full" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{getCategoryLabel(item.category)}</p>
                    <p className="text-sm font-bold text-primary mt-0.5">{item.price} ر.س</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => { setIsNew(false); setModalItem({ ...item }); setError(null) }}
                      className="w-9 h-9 rounded-xl bg-amal-grey flex items-center justify-center hover:bg-primary/10 transition-colors"
                    >
                      <Pencil className="h-4 w-4 text-foreground" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(item.id)}
                      className="w-9 h-9 rounded-xl bg-amal-grey flex items-center justify-center hover:bg-red-100 transition-colors"
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

      {/* ── Delete confirmation ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm bg-background rounded-3xl p-6">
            <h3 className="text-lg font-bold text-center mb-2">تأكيد الحذف</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              هل أنت متأكد من حذف هذا الصنف؟ لا يمكن التراجع.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 rounded-xl bg-amal-grey font-medium"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {modalItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="w-full max-w-lg bg-background rounded-t-3xl max-h-[92vh] flex flex-col">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
              <button onClick={() => setModalItem(null)} className="w-9 h-9 rounded-full bg-amal-grey flex items-center justify-center">
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-bold">{isNew ? "إضافة صنف جديد" : "تعديل الصنف"}</h2>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                حفظ
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl text-center">{error}</div>
              )}

              {/* Image */}
              <div>
                <label className="block text-sm font-medium mb-2">الصورة</label>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-20 rounded-xl bg-amal-grey flex items-center justify-center overflow-hidden flex-shrink-0">
                    {modalItem.image ? (
                      <Image
                        src={getDisplayImage(modalItem.image) || modalItem.image}
                        alt="preview"
                        width={80} height={80}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <ImageIcon className="h-7 w-7 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={imageUploading}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors text-sm"
                    >
                      {imageUploading
                        ? <><Loader2 className="h-4 w-4 animate-spin" /> جاري الرفع...</>
                        : <><Upload className="h-4 w-4" /> رفع صورة</>
                      }
                    </button>
                    <input
                      value={modalItem.image || ""}
                      onChange={(e) => setModalItem((p) => ({ ...p, image: e.target.value }))}
                      placeholder="أو أدخل رابط الصورة"
                      className="w-full px-3 py-2 rounded-xl bg-amal-grey text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-right"
                    />
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-1.5">الاسم <span className="text-red-500">*</span></label>
                <input
                  value={modalItem.name || ""}
                  onChange={(e) => setModalItem((p) => ({ ...p, name: e.target.value }))}
                  placeholder="اسم الصنف"
                  className="w-full px-4 py-3 rounded-xl bg-amal-grey focus:outline-none focus:ring-2 focus:ring-primary/20 text-right"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1.5">الوصف</label>
                <textarea
                  value={modalItem.description || ""}
                  onChange={(e) => setModalItem((p) => ({ ...p, description: e.target.value }))}
                  placeholder="وصف الصنف"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-amal-grey focus:outline-none focus:ring-2 focus:ring-primary/20 text-right resize-none"
                />
              </div>

              {/* Price + Limit row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">السعر (ر.س) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min={0}
                    value={modalItem.price || ""}
                    onChange={(e) => setModalItem((p) => ({ ...p, price: Number(e.target.value) }))}
                    placeholder="0"
                    className="w-full px-4 py-3 rounded-xl bg-amal-grey focus:outline-none focus:ring-2 focus:ring-primary/20 text-right"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">حد الاختيار</label>
                  <input
                    type="number"
                    min={0}
                    value={modalItem.limit || ""}
                    onChange={(e) => setModalItem((p) => ({ ...p, limit: Number(e.target.value) }))}
                    placeholder="0"
                    className="w-full px-4 py-3 rounded-xl bg-amal-grey focus:outline-none focus:ring-2 focus:ring-primary/20 text-right"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-1.5">الفئة <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select
                    value={modalItem.category || ""}
                    onChange={(e) => setModalItem((p) => ({ ...p, category: e.target.value }))}
                    className="w-full appearance-none px-4 py-3 rounded-xl bg-amal-grey focus:outline-none focus:ring-2 focus:ring-primary/20 text-right cursor-pointer"
                  >
                    <option value="">اختر الفئة</option>
                    {ALL_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <label className="block text-sm font-medium mb-1.5">المكونات / الخيارات</label>
                <textarea
                  value={modalItem.ingredients || ""}
                  onChange={(e) => setModalItem((p) => ({ ...p, ingredients: e.target.value }))}
                  placeholder="افصل بين المكونات بفاصلة — مثال: جبن, زعتر, بيض"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-amal-grey focus:outline-none focus:ring-2 focus:ring-primary/20 text-right resize-none text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">مكونات مفصولة بفاصلة</p>
              </div>

              <div className="h-4" />
            </div>
          </div>
        </div>
      )}

    </main>
  )
}
