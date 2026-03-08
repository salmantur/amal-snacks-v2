"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight, Plus, Pencil, Trash2, Search, X, Check,
  Upload, Loader2, ChevronDown, ImageIcon, Star
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { categories } from "@/lib/data"
import { PriceWithRiyalLogo } from "@/components/ui/price-with-riyal-logo"

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
  packageItems: { label: string; quantity: number; included?: boolean }[]
}

const EMPTY_ITEM: Omit<MenuItem, "id"> = {
  name: "", nameEn: "", description: "",
  price: 0, image: "", category: "",
  ingredients: "", limit: 0, inStock: true, makingTime: 0, isFeatured: false, images: [], packageItems: [],
}

const ALL_CATEGORIES = categories.flatMap((cat) =>
  cat.sections
    ? cat.sections.map((s) => ({ value: s.dbCategory, label: `${cat.label} â€” ${s.label}` }))
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
  const [pkgLabelInput, setPkgLabelInput] = useState("")
  const [pkgQtyInput, setPkgQtyInput] = useState(1)
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
      packageItems: Array.isArray(raw.package_items) ? raw.package_items : [],
    }
  }

  function flash(msg: string) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  function lockBodyScroll() {
    const scrollY = window.scrollY
    document.documentElement.classList.add("modal-open")
    document.body.dataset.modalScrollY = String(scrollY)
    document.body.style.position = "fixed"
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = "0"
    document.body.style.right = "0"
    document.body.style.width = "100%"
  }

  function unlockBodyScroll() {
    const scrollY = Number(document.body.dataset.modalScrollY || 0)
    document.documentElement.classList.remove("modal-open")
    delete document.body.dataset.modalScrollY
    document.body.style.position = ""
    document.body.style.top = ""
    document.body.style.left = ""
    document.body.style.right = ""
    document.body.style.width = ""
    window.scrollTo(0, scrollY)
  }

  function openModal(item: Partial<MenuItem>, isNewItem: boolean) {
    setModalItem(item)
    setIsNew(isNewItem)
    setError(null)
    setIngredientInput("")
    setPkgLabelInput("")
    setPkgQtyInput(1)
    lockBodyScroll()
  }

  function closeModal() {
    setModalItem(null)
    unlockBodyScroll()
  }

  useEffect(() => {
    return () => {
      document.documentElement.classList.remove("modal-open")
      delete document.body.dataset.modalScrollY
      document.body.style.position = ""
      document.body.style.top = ""
      document.body.style.left = ""
      document.body.style.right = ""
      document.body.style.width = ""
    }
  }, [])

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !modalItem) return
    setImageUploading(true)
    const ext = file.name.split(".").pop()
    const filename = `${Date.now()}.${ext}`
    const { error } = await supabase.storage.from("Menu").upload(filename, file, {
      upsert: true,
      cacheControl: "31536000",
      contentType: file.type || "image/jpeg",
    })
    if (error) {
      setError("ÙØ´Ù„ Ø±ÙØ¹ Ø§Ù„ØµÙˆØ±Ø©: " + error.message)
    } else {
      const url = `${SUPABASE_URL}/storage/v1/object/public/Menu/${filename}`
      setModalItem((prev) => prev ? { ...prev, image: url } : prev)
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
      const { error } = await supabase.storage.from("Menu").upload(filename, file, {
        upsert: true,
        cacheControl: "31536000",
        contentType: file.type || "image/jpeg",
      })
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
    if (!modalItem.name?.trim()) { setError("Ø§Ù„Ø§Ø³Ù… Ù…Ø·Ù„ÙˆØ¨"); return }
    if (!modalItem.category) { setError("Ø§Ù„ÙØ¦Ø© Ù…Ø·Ù„ÙˆØ¨Ø©"); return }
    if (!modalItem.price || modalItem.price <= 0) { setError("Ø§Ù„Ø³Ø¹Ø± ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ø£ÙƒØ¨Ø± Ù…Ù† ØµÙØ±"); return }
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
      package_items: modalItem.packageItems || [],
    }
    if (isNew) {
      const { error } = await supabase.from("menu").insert(payload)
      if (error) setError(error.message)
      else { flash("ØªÙ… Ø§Ù„Ø¥Ø¶Ø§ÙØ© âœ“"); closeModal(); loadItems() }
    } else {
      const { error } = await supabase.from("menu").update(payload).eq("id", modalItem.id)
      if (error) setError(error.message)
      else { flash("ØªÙ… Ø§Ù„Ø­ÙØ¸ âœ“"); closeModal(); loadItems() }
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    const { error } = await supabase.from("menu").delete().eq("id", id)
    if (error) setError(error.message)
    else { flash("ØªÙ… Ø§Ù„Ø­Ø°Ù"); setItems((prev) => prev.filter((i) => i.id !== id)) }
    setDeleting(null)
    setDeleteConfirm(null)
  }

  function addIngredient(val: string) {
    const trimmed = val.trim()
    if (!trimmed) return
    const current = (modalItem?.ingredients || "").split(",").map(t => t.trim()).filter(Boolean)
    if (!current.includes(trimmed)) {
      setModalItem(p => p ? { ...p, ingredients: [...current, trimmed].join(", ") } : p)
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

  const tags = (modalItem?.ingredients || "").split(",").map(t => t.trim()).filter(Boolean)

  return (
    <main className="min-h-screen bg-[#f5f5f5] overflow-x-hidden">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <Link
            href="/admin"
            className="w-11 h-11 rounded-full bg-[#f5f5f5] flex items-center justify-center active:scale-95 transition-transform flex-shrink-0"
          >
            <ArrowRight className="h-5 w-5" />
          </Link>
          <div className="text-center">
            <h1 className="text-lg font-bold" dir="rtl">Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø£ØµÙ†Ø§Ù</h1>
            <p className="text-xs text-gray-400">{items.length} ØµÙ†Ù</p>
          </div>
          <button
            onClick={() => openModal({ ...EMPTY_ITEM }, true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-black text-white rounded-full font-medium text-sm active:scale-95 transition-transform flex-shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span dir="rtl">Ø¥Ø¶Ø§ÙØ©</span>
          </button>
        </div>

        {/* Search + filter */}
        <div className="flex gap-2 px-4 pb-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Ø¨Ø­Ø«..."
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
              <option value="all">Ø§Ù„ÙƒÙ„</option>
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
      <div className="w-full max-w-full p-4 pb-32 overflow-x-hidden">
        {loading ? (
          <div className="grid w-full gap-3">
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
            <p dir="rtl">Ù„Ø§ ØªÙˆØ¬Ø¯ Ø£ØµÙ†Ø§Ù</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map(item => {
              const imgSrc = getDisplayImage(item.image)
              return (
                <div key={item.id} className="w-full max-w-full bg-white rounded-2xl p-3 flex items-center gap-3 shadow-sm overflow-hidden">

                  {/* Image */}
                  <div className="relative w-20 h-20 rounded-2xl bg-[#f5f5f5] overflow-hidden flex-shrink-0">
                    {imgSrc
                      ? <Image src={imgSrc} alt={item.name} fill sizes="80px" quality={70} className="object-cover" />
                      : <div className="absolute inset-0 flex items-center justify-center"><ImageIcon className="h-6 w-6 text-gray-300" /></div>
                    }
                    {item.isFeatured && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                        <Star className="h-2.5 w-2.5 fill-yellow-900 text-yellow-900" />
                      </div>
                    )}
                    {!item.inStock && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl">
                        <span className="text-white text-[9px] font-bold">Ù†ÙØ°</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 text-right" dir="rtl">
                    <p className="font-bold text-sm truncate">{item.name}</p>
                    {item.nameEn && <p className="text-xs text-gray-400 truncate">{item.nameEn}</p>}
                    <p className="text-sm font-bold mt-0.5">
                      <PriceWithRiyalLogo value={item.price} />
                    </p>
                    <p className="text-xs text-gray-400 truncate">{ALL_CATEGORIES.find(c => c.value === item.category)?.label || item.category}</p>
                  </div>

                  {/* Actions */}
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
            <h3 className="text-lg font-bold text-center mb-2">ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø­Ø°Ù</h3>
            <p className="text-sm text-gray-500 text-center mb-6">Ù‡Ù„ Ø£Ù†Øª Ù…ØªØ£ÙƒØ¯ Ù…Ù† Ø­Ø°Ù Ù‡Ø°Ø§ Ø§Ù„ØµÙ†ÙØŸ</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3.5 rounded-2xl bg-[#f5f5f5] font-medium active:scale-95 transition-transform">Ø¥Ù„ØºØ§Ø¡</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-3.5 rounded-2xl bg-red-500 text-white font-medium active:scale-95 transition-transform">Ø­Ø°Ù</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Add Modal */}
      {modalItem && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div
            className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl flex flex-col transform-gpu"
            style={{ maxHeight: "92dvh", height: "92dvh" }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <button onClick={closeModal} className="w-11 h-11 rounded-full bg-[#f5f5f5] flex items-center justify-center active:scale-95 transition-transform">
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-base font-bold" dir="rtl">{isNew ? "Ø¥Ø¶Ø§ÙØ© ØµÙ†Ù" : "ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„ØµÙ†Ù"}</h2>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-3 bg-black text-white rounded-full text-sm font-medium disabled:opacity-50 active:scale-95 transition-transform"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                <span dir="rtl">Ø­ÙØ¸</span>
              </button>
            </div>

            {/* Modal body */}
            <div
              className="flex-1 overflow-y-auto px-5 py-4 space-y-5 touch-pan-y"
              style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain", touchAction: "pan-y" }}
            >
              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl text-center" dir="rtl">{error}</div>
              )}

              {/* Main Image */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-right" dir="rtl">Ø§Ù„ØµÙˆØ±Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©</label>
                <div className="flex items-center gap-3">
                  <div className="relative w-24 h-24 rounded-2xl bg-[#f5f5f5] flex items-center justify-center overflow-hidden flex-shrink-0">
                    {modalItem.image
                      ? <Image src={getDisplayImage(modalItem.image) || modalItem.image || ""} alt="preview" fill sizes="96px" quality={70} className="object-cover" />
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
                        ? <><Loader2 className="h-4 w-4 animate-spin" /> Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø±ÙØ¹...</>
                        : <><Upload className="h-4 w-4" /> Ø±ÙØ¹ ØµÙˆØ±Ø©</>
                      }
                    </button>
                    <input
                      value={modalItem.image || ""}
                      onChange={e => setModalItem(p => p ? { ...p, image: e.target.value } : p)}
                      placeholder="Ø£Ùˆ Ø§Ù„ØµÙ‚ Ø±Ø§Ø¨Ø· Ø§Ù„ØµÙˆØ±Ø©"
                      dir="ltr"
                      className="w-full px-3 py-2.5 rounded-xl bg-[#f5f5f5] text-sm focus:outline-none text-left"
                    />
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </div>

              {/* Arabic Name */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-right" dir="rtl">Ø§Ù„Ø§Ø³Ù… Ø¨Ø§Ù„Ø¹Ø±Ø¨ÙŠ <span className="text-red-500">*</span></label>
                <input
                  value={modalItem.name || ""}
                  onChange={e => setModalItem(p => p ? { ...p, name: e.target.value } : p)}
                  placeholder="Ù…Ø«Ø§Ù„: Ø³Ù…Ø¨ÙˆØ³Ø© Ø¬Ø¨Ù†"
                  dir="rtl"
                  className="w-full px-4 py-3.5 rounded-2xl bg-[#f5f5f5] focus:outline-none text-right text-base" style={{fontSize: "16px"}}
                />
              </div>

              {/* English Name */}
              <div>
                <label className="block text-sm font-semibold mb-1.5">English Name</label>
                <input
                  value={modalItem.nameEn || ""}
                  onChange={e => setModalItem(p => p ? { ...p, nameEn: e.target.value } : p)}
                  placeholder="e.g. Cheese Samboosa"
                  dir="ltr"
                  className="w-full px-4 py-3.5 rounded-2xl bg-[#f5f5f5] focus:outline-none text-left text-base" style={{fontSize: "16px"}}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-right" dir="rtl">Ø§Ù„ÙˆØµÙ</label>
                <textarea
                  value={modalItem.description || ""}
                  onChange={e => setModalItem(p => p ? { ...p, description: e.target.value } : p)}
                  placeholder="ÙˆØµÙ Ø§Ù„ØµÙ†Ù"
                  rows={2}
                  dir="rtl"
                  className="w-full px-4 py-3.5 rounded-2xl bg-[#f5f5f5] focus:outline-none text-right resize-none text-base" style={{fontSize: "16px"}}
                />
              </div>

              {/* Price + Limit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-right" dir="rtl">Ø§Ù„Ø³Ø¹Ø± <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={modalItem.price || ""}
                    onChange={e => setModalItem(p => p ? { ...p, price: Number(e.target.value) } : p)}
                    placeholder="0"
                    className="w-full px-4 py-3.5 rounded-2xl bg-[#f5f5f5] focus:outline-none text-center text-base" style={{fontSize: "16px"}}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-right" dir="rtl">Ø­Ø¯ Ø§Ù„Ø§Ø®ØªÙŠØ§Ø±</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={modalItem.limit || ""}
                    onChange={e => setModalItem(p => p ? { ...p, limit: Number(e.target.value) } : p)}
                    placeholder="0"
                    className="w-full px-4 py-3.5 rounded-2xl bg-[#f5f5f5] focus:outline-none text-center text-base" style={{fontSize: "16px"}}
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-right" dir="rtl">Ø§Ù„ÙØ¦Ø© <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select
                    value={modalItem.category || ""}
                    onChange={e => setModalItem(p => p ? { ...p, category: e.target.value } : p)}
                    dir="rtl"
                    className="w-full appearance-none px-4 py-3.5 rounded-2xl bg-[#f5f5f5] focus:outline-none text-right cursor-pointer text-base" style={{fontSize: "16px"}}
                  >
                    <option value="">Ø§Ø®ØªØ± Ø§Ù„ÙØ¦Ø©</option>
                    {ALL_CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Toggles row: In Stock + Best Seller */}
              <div className="space-y-3">
                {/* In Stock */}
                <div className="flex items-center justify-between p-4 bg-[#f5f5f5] rounded-2xl">
                  <div dir="rtl">
                    <p className="font-semibold text-sm">Ù…ØªÙˆÙØ± ÙÙŠ Ø§Ù„Ù…Ø®Ø²ÙˆÙ†</p>
                    <p className="text-xs text-gray-400 mt-0.5">Ø¥ÙŠÙ‚Ø§Ù ÙŠØ®ÙÙŠ Ø§Ù„ØµÙ†Ù Ù…Ù† Ø§Ù„Ù‚Ø§Ø¦Ù…Ø©</p>
                  </div>
                  <button
                    onClick={() => setModalItem(p => p ? { ...p, inStock: !(p.inStock !== false) } : p)}
                    className={`w-14 h-8 rounded-full transition-colors relative flex-shrink-0 ml-3 ${modalItem.inStock !== false ? "bg-black" : "bg-gray-300"}`}
                  >
                    <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all duration-200 ${modalItem.inStock !== false ? "left-7" : "left-1"}`} />
                  </button>
                </div>

                {/* Best Sellers Page */}
                <div className="flex items-center justify-between p-4 bg-[#f5f5f5] rounded-2xl">
                  <div dir="rtl">
                    <p className="font-semibold text-sm">⭐ صفحة الأكثر طلبًا</p>
                    <p className="text-xs text-gray-400 mt-0.5">فعّل هذا الخيار ليظهر الصنف في صفحة الأكثر طلبًا</p>
                  </div>
                  <button
                    onClick={() => setModalItem(p => p ? { ...p, isFeatured: !p.isFeatured } : p)}
                    className={`w-14 h-8 rounded-full transition-colors relative flex-shrink-0 ml-3 ${modalItem.isFeatured ? "bg-yellow-400" : "bg-gray-300"}`}
                  >
                    <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all duration-200 ${modalItem.isFeatured ? "left-7" : "left-1"}`} />
                  </button>
                </div>
              </div>

              {/* Making Time */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-right" dir="rtl">â±ï¸ ÙˆÙ‚Øª Ø§Ù„ØªØ­Ø¶ÙŠØ±</label>
                <div className="relative">
                  <select
                    value={modalItem.makingTime || 0}
                    onChange={(e) => setModalItem((p) => p ? { ...p, makingTime: Number(e.target.value) } : p)}
                    className="w-full appearance-none px-4 py-3.5 rounded-2xl bg-[#f5f5f5] focus:outline-none text-right text-base cursor-pointer" style={{fontSize: "16px"}}
                    dir="rtl"
                  >
                    <option value={0}>Ø¨Ø¯ÙˆÙ† ÙˆÙ‚Øª ØªØ­Ø¶ÙŠØ± (ÙÙˆØ±ÙŠ)</option>
                    <option value={30}>30 Ø¯Ù‚ÙŠÙ‚Ø©</option>
                    <option value={60}>1 Ø³Ø§Ø¹Ø©</option>
                    <option value={90}>1.5 Ø³Ø§Ø¹Ø©</option>
                    <option value={120}>2 Ø³Ø§Ø¹Ø©</option>
                    <option value={180}>3 Ø³Ø§Ø¹Ø§Øª</option>
                    <option value={240}>4 Ø³Ø§Ø¹Ø§Øª</option>
                    <option value={360}>6 Ø³Ø§Ø¹Ø§Øª</option>
                    <option value={720}>12 Ø³Ø§Ø¹Ø©</option>
                    <option value={1440}>24 Ø³Ø§Ø¹Ø© (ÙŠÙˆÙ… ÙƒØ§Ù…Ù„)</option>
                  </select>
                  <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                <p className="text-xs text-gray-400 mt-1 text-right" dir="rtl">ÙŠØ­Ø¯Ø¯ Ø£Ù‚Ø±Ø¨ Ù…ÙˆØ¹Ø¯ ØªÙˆØµÙŠÙ„ Ù…ØªØ§Ø­ Ù„Ù„Ø¹Ù…ÙŠÙ„</p>
              </div>

              {/* Gallery Images */}
              <div dir="rtl">
                <p className="font-semibold text-sm mb-2">ðŸ–¼ï¸ ØµÙˆØ± Ø¥Ø¶Ø§ÙÙŠØ© (Ø¬Ø§Ù„ÙŠØ±ÙŠ)</p>
                <div className="flex gap-2 flex-wrap mb-2">
                  {(modalItem.images || []).map((url, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#f5f5f5] flex-shrink-0">
                      <Image src={url} alt="" fill sizes="64px" quality={70} className="object-cover" />
                      <button
                        onClick={() => setModalItem(prev => prev ? ({ ...prev, images: (prev.images || []).filter((_, i) => i !== idx) }) : prev)}
                        className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs"
                      >
                        Ã—
                      </button>
                    </div>
                  ))}
                  <label className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors flex-shrink-0">
                    {galleryUploading
                      ? <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                      : <><Upload className="h-4 w-4 text-gray-400" /><span className="text-[10px] text-gray-400 mt-0.5">Ø¥Ø¶Ø§ÙØ©</span></>
                    }
                    <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" />
                  </label>
                </div>
                <p className="text-xs text-gray-400">ÙŠÙ…ÙƒÙ†Ùƒ Ø¥Ø¶Ø§ÙØ© Ø£ÙƒØ«Ø± Ù…Ù† ØµÙˆØ±Ø© â€” Ø³ØªØ¸Ù‡Ø± ÙÙŠ Ù…Ø¹Ø±Ø¶ Ø§Ù„Ù…Ù†ØªØ¬</p>
              </div>

              {/* Options / Ingredients */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-right" dir="rtl">Ø§Ù„Ø®ÙŠØ§Ø±Ø§Øª / Ø§Ù„Ù…ÙƒÙˆÙ†Ø§Øª</label>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3 p-3 bg-[#f5f5f5] rounded-2xl">
                    {tags.map((tag, i) => (
                      <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-sm border border-gray-100 shadow-sm" dir="rtl">
                        {tag}
                        <button
                          onClick={() => {
                            const newTags = tags.filter((_, idx) => idx !== i)
                            setModalItem(p => p ? { ...p, ingredients: newTags.join(", ") } : p)
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
                    placeholder="Example: Small (84 pcs)::300"
                    dir="rtl"
                    className="flex-1 px-4 py-3.5 rounded-2xl bg-[#f5f5f5] focus:outline-none text-right text-base" style={{fontSize: "16px"}}
                  />
                  <button
                    onClick={() => addIngredient(ingredientInput)}
                    className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5 text-right" dir="rtl">Type option then press Enter or +</p>
                <p className="text-[11px] text-gray-500 mt-1 text-right" dir="rtl">
                  For size pricing use: <span dir="ltr">Option Name::Price</span> e.g.
                  <span className="mx-1" dir="ltr">L (200 pcs)::500</span>
                </p>
              </div>


              {/* â”€â”€ PACKAGE MODE (Ø¨Ø§Ù‚Ø§Øª Ø§Ù„Ø¹ÙŠØ¯ only) â”€â”€ */}
              {modalItem.category === "eid" && (
                <div dir="rtl" className="border-2 border-yellow-300 bg-yellow-50 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">ðŸŽ</span>
                    <p className="font-black text-base text-[#1e293b]">Ø¥Ø¹Ø¯Ø§Ø¯ Ø§Ù„Ø¨Ø§Ù‚Ø©</p>
                    <span className="text-xs bg-yellow-400 text-yellow-900 font-bold px-2 py-0.5 rounded-full mr-auto">Ø¨Ø§Ù‚Ø© Ø¹ÙŠØ¯</span>
                  </div>

                  {/* Hint */}
                  <div className="bg-white rounded-xl p-3 text-xs text-gray-500 space-y-1">
                    <p>â€¢ <strong>Ø­Ø¯ Ø§Ù„Ø§Ø®ØªÙŠØ§Ø±</strong> Ø£Ø¹Ù„Ø§Ù‡ = Ø¹Ø¯Ø¯ Ø§Ù„Ø³Ø®Ø§Ù†Ø§Øª (4 Ø£Ùˆ 6)</p>
                    <p>â€¢ Ø£Ø¶Ù Ø¨Ù„Ø§ØªØ± Ø§Ù„Ø§Ø¬Ø¨Ø§Ù† ÙƒÙ€ "Ù…Ø´Ù…ÙˆÙ„" Ø£Ø¯Ù†Ø§Ù‡</p>
                  </div>

                  {/* Current package items */}
                  {(modalItem.packageItems || []).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500">Ù…Ø­ØªÙˆÙŠØ§Øª Ø§Ù„Ø¨Ø§Ù‚Ø© Ø§Ù„Ø­Ø§Ù„ÙŠØ©:</p>
                      {(modalItem.packageItems || []).map((pkg, i) => (
                        <div key={i} className="flex items-center gap-2 p-3 bg-white rounded-xl border border-gray-100">
                          <button
                            onClick={() => setModalItem(p => p ? { ...p, packageItems: (p.packageItems || []).filter((_, idx) => idx !== i) } : p)}
                            className="w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-sm flex-shrink-0 active:scale-95"
                          >Ã—</button>
                          <div className="flex-1 text-right">
                            <p className="font-semibold text-sm">{pkg.label}</p>
                          </div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pkg.included ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"}`}>
                            {pkg.included ? "Ù…Ø´Ù…ÙˆÙ„" : `${pkg.quantity} Ù‚Ø·Ø¹Ø©`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add item */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500">Ø¥Ø¶Ø§ÙØ© Ø¹Ù†ØµØ±:</p>
                    <input
                      value={pkgLabelInput}
                      onChange={e => setPkgLabelInput(e.target.value)}
                      placeholder="Ù…Ø«Ø§Ù„: Ø¨Ù„Ø§ØªØ± Ø§Ù„Ø§Ø¬Ø¨Ø§Ù†"
                      dir="rtl"
                      className="w-full px-3 py-2.5 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none text-right"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={1}
                        value={pkgQtyInput}
                        onChange={e => setPkgQtyInput(Number(e.target.value))}
                        className="w-20 px-3 py-2.5 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none text-center"
                      />
                      <button
                        onClick={() => {
                          if (!pkgLabelInput.trim()) return
                          setModalItem(p => p ? { ...p, packageItems: [...(p.packageItems || []), { label: pkgLabelInput.trim(), quantity: pkgQtyInput }] } : p)
                          setPkgLabelInput("")
                          setPkgQtyInput(1)
                        }}
                        className="flex-1 py-2.5 bg-[#1e293b] text-white rounded-xl text-sm font-medium active:scale-95"
                      >+ Ø¥Ø¶Ø§ÙØ© Ø¨Ø¹Ø¯Ø¯</button>
                    </div>
                    <button
                      onClick={() => {
                        if (!pkgLabelInput.trim()) return
                        setModalItem(p => p ? { ...p, packageItems: [...(p.packageItems || []), { label: pkgLabelInput.trim(), quantity: 1, included: true }] } : p)
                        setPkgLabelInput("")
                      }}
                      className="w-full py-2.5 bg-yellow-400 text-yellow-900 rounded-xl text-sm font-bold active:scale-95"
                    >â­ Ø¥Ø¶Ø§ÙØ© ÙƒÙ€ "Ù…Ø´Ù…ÙˆÙ„"</button>
                  </div>
                </div>
              )}

              <div style={{ height: "calc(2rem + env(safe-area-inset-bottom))" }} />
            </div>
          </div>
        </div>
      )}

    </main>
  )
}
