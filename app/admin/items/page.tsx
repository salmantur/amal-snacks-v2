"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight, Plus, Pencil, Trash2, Search, X, Check,
  Upload, Loader2, ChevronDown, ImageIcon, Star, ArrowUp, ArrowDown
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { categories } from "@/lib/data"
import { useBestSellersConfig } from "@/hooks/use-best-sellers-config"
import { getBestSellerCandidates } from "@/lib/best-sellers"
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
  const [pkgLabelInput, setPkgLabelInput] = useState("")
  const [pkgQtyInput, setPkgQtyInput] = useState(1)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = useMemo(() => createClient(), [])
  const { orderIds: bestSellerOrderIds, loading: bestSellerOrderLoading, saveOrder } = useBestSellersConfig()

  const decodePossibleMojibake = React.useCallback((value: string): string => {
    if (!value) return value
    if (!/[ØÙÃÂâð]/.test(value)) return value
    try {
      const bytes = Uint8Array.from(Array.from(value).map((char) => char.charCodeAt(0) & 0xff))
      const decoded = new TextDecoder("utf-8").decode(bytes)
      return decoded.includes("�") ? value : decoded
    } catch {
      return value
    }
  }, [])

  const getDisplayImage = React.useCallback((img?: string | null) => {
    const raw = String(img ?? "").trim()
    if (!raw || raw === "null" || raw === "undefined") return null
    if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:image/") || raw.startsWith("blob:")) {
      return raw
    }
    if (raw.startsWith("/")) return raw
    const cleaned = raw
      .replace(/^\/+/, "")
      .replace(/[\u0000-\u001F\u007F]/g, "")
      .trim()
    if (!cleaned) return null
    try {
      return `${SUPABASE_URL}/storage/v1/object/public/Menu/${encodeURI(cleaned)}`
    } catch {
      // Fallback for malformed unicode sequences in legacy data.
      return `${SUPABASE_URL}/storage/v1/object/public/Menu/${cleaned}`
    }
  }, [])

  function sanitizeModalItem(input: Partial<MenuItem>): Partial<MenuItem> {
    const safeImage = getDisplayImage(input.image || "") || ""
    const safeImages = Array.isArray(input.images)
      ? input.images.map((img) => getDisplayImage(String(img || ""))).filter((img): img is string => Boolean(img))
      : []
    const safePackageItems = Array.isArray(input.packageItems)
      ? input.packageItems.map((pkg) => ({
          label: String(pkg?.label || ""),
          quantity: Number(pkg?.quantity) > 0 ? Number(pkg.quantity) : 1,
          included: pkg?.included === true,
        }))
      : []
    return {
      ...input,
      name: String(input.name || ""),
      nameEn: String(input.nameEn || ""),
      description: String(input.description || ""),
      ingredients: String(input.ingredients || ""),
      category: String(input.category || ""),
      price: Number(input.price) || 0,
      limit: Number(input.limit) || 0,
      makingTime: Number(input.makingTime) || 0,
      inStock: input.inStock !== false,
      isFeatured: input.isFeatured === true,
      image: safeImage,
      images: safeImages,
      packageItems: safePackageItems,
    }
  }

  const normalize = React.useCallback((raw: Record<string, unknown>): MenuItem => {
    let img = String(raw.image || raw.img || raw.image_url || "")
    if (img.includes(",")) img = img.split(",")[0].trim()
    const normalizedImage = getDisplayImage(img) || ""
    const ingredientsText = Array.isArray(raw.ingredients)
      ? raw.ingredients.map((item) => decodePossibleMojibake(String(item || ""))).join(", ")
      : decodePossibleMojibake(String(raw.ingredients || ""))
    const packageItems = Array.isArray(raw.package_items)
      ? raw.package_items.map((item) => ({
          ...item,
          label: decodePossibleMojibake(String((item as { label?: string }).label || "")),
        }))
      : []
    const normalizedGalleryImages = Array.isArray(raw.images)
      ? raw.images
          .map((item) => getDisplayImage(String(item || "")))
          .filter((item): item is string => Boolean(item))
      : []
    return {
      id: String(raw.id),
      name: decodePossibleMojibake(String(raw.name || "")),
      nameEn: decodePossibleMojibake(String(raw.name_en || "")),
      description: decodePossibleMojibake(String(raw.description || "")),
      price: Number(raw.price) || 0,
      image: normalizedImage,
      category: String(raw.category || ""),
      ingredients: ingredientsText,
      limit: Number(raw.limit) || 0,
      inStock: raw.in_stock !== false,
      makingTime: Number(raw.making_time) || 0,
      isFeatured: raw.is_featured === true,
      images: normalizedGalleryImages,
      packageItems,
    }
  }, [decodePossibleMojibake, getDisplayImage])

  const loadItems = React.useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from("menu").select("*").order("category")
    if (error) setError(error.message)
    else setItems((data || []).map(normalize))
    setLoading(false)
  }, [normalize, supabase])

  useEffect(() => { void loadItems() }, [loadItems])

  function flash(msg: string) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  function lockBodyScroll() {
    document.documentElement.classList.add("modal-open")
    document.body.classList.add("modal-open")
  }

  function unlockBodyScroll() {
    document.documentElement.classList.remove("modal-open")
    document.body.classList.remove("modal-open")
  }

  function openModal(item: Partial<MenuItem>, isNewItem: boolean) {
    setModalItem(sanitizeModalItem(item))
    setIsNew(isNewItem)
    setError(null)
    setIngredientInput("")
    setPkgLabelInput("")
    setPkgQtyInput(1)
    try {
      lockBodyScroll()
    } catch {
      // Prevent iOS/Safari edge-case failures from blocking modal open.
    }
  }

  function closeModal() {
    setModalItem(null)
    try {
      unlockBodyScroll()
    } catch {
      // Ignore body unlock errors to keep modal close responsive.
    }
  }

  useEffect(() => {
    return () => {
      document.documentElement.classList.remove("modal-open")
      document.body.classList.remove("modal-open")
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
      setError("فشل رفع الصورة: " + error.message)
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
      image: getDisplayImage(modalItem.image || "") || "",
      category: modalItem.category,
      ingredients: modalItem.ingredients || "",
      limit: modalItem.limit || 0,
      in_stock: modalItem.inStock !== false,
      making_time: modalItem.makingTime || 0,
      is_featured: modalItem.isFeatured === true,
      images: (modalItem.images || [])
        .map((img) => getDisplayImage(String(img || "")))
        .filter((img): img is string => Boolean(img)),
      package_items: modalItem.packageItems || [],
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
      setModalItem(p => p ? { ...p, ingredients: [...current, trimmed].join(", ") } : p)
    }
    setIngredientInput("")
  }

  const filtered = items.filter(item => {
    const matchSearch = item.name.includes(search) || item.nameEn.toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCategory === "all" || item.category === filterCategory
    return matchSearch && matchCat
  })

  const bestSellerItems = useMemo(
    () => getBestSellerCandidates(items, bestSellerOrderIds),
    [items, bestSellerOrderIds]
  )

  async function moveBestSeller(itemId: string, direction: "up" | "down") {
    const currentIds = bestSellerItems.map((item) => item.id)
    const fromIndex = currentIds.indexOf(itemId)
    if (fromIndex === -1) return

    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1
    if (toIndex < 0 || toIndex >= currentIds.length) return

    const nextIds = [...currentIds]
    ;[nextIds[fromIndex], nextIds[toIndex]] = [nextIds[toIndex], nextIds[fromIndex]]
    await saveOrder(nextIds)
    flash("تم تحديث ترتيب صفحة الأكثر طلبًا")
  }

  const tags = (modalItem?.ingredients || "").split(",").map(t => t.trim()).filter(Boolean)
  const modalMainImage = getDisplayImage(modalItem?.image || "")

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
            <h1 className="text-lg font-bold" dir="rtl">{"\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0623\u0635\u0646\u0627\u0641"}</h1>
            <p className="text-xs text-gray-400">{items.length} {"\u0635\u0646\u0641"}</p>
          </div>
          <button
            type="button"
            onClick={() => openModal({ ...EMPTY_ITEM }, true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-black text-white rounded-full font-medium text-sm active:scale-95 transition-transform flex-shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span dir="rtl">{"\u0625\u0636\u0627\u0641\u0629"}</span>
          </button>
        </div>

        {/* Search + filter */}
        <div className="flex gap-2 px-4 pb-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={"\u0628\u062d\u062b..."}
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
              <option value="all">{"\u0627\u0644\u0643\u0644"}</option>
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

      <div className="w-full max-w-full p-4 pb-32 overflow-x-hidden space-y-4">
        <section className="bg-white rounded-2xl p-4 shadow-sm" dir="rtl">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="text-right">
              <h2 className="font-bold text-base">ترتيب صفحة الأكثر طلبًا</h2>
              <p className="text-xs text-gray-400 mt-1">غيّر مكان الأصناف في صفحة الأكثر طلبًا باستخدام الأسهم</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-yellow-100 text-yellow-700 flex items-center justify-center flex-shrink-0">
              <Star className="h-4 w-4 fill-yellow-500" />
            </div>
          </div>

          {bestSellerOrderLoading ? (
            <div className="flex items-center justify-center py-6 text-sm text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
              جاري تحميل الترتيب...
            </div>
          ) : bestSellerItems.length === 0 ? (
            <div className="rounded-2xl bg-[#f5f5f5] px-4 py-5 text-sm text-gray-500 text-center">
              لا توجد أصناف مفعلة في صفحة الأكثر طلبًا
            </div>
          ) : (
            <div className="space-y-2">
              {bestSellerItems.map((item, index) => {
                const imageSrc = getDisplayImage(item.image)
                return (
                  <div key={`featured-order-${item.id}`} className="flex items-center gap-3 rounded-2xl bg-[#f5f5f5] p-3">
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => moveBestSeller(item.id, "up")}
                        disabled={index === 0}
                        className="w-9 h-9 rounded-xl bg-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-transform"
                        aria-label="نقل للأعلى"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBestSeller(item.id, "down")}
                        disabled={index === bestSellerItems.length - 1}
                        className="w-9 h-9 rounded-xl bg-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-transform"
                        aria-label="نقل للأسفل"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0 text-right">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-gray-400">#{index + 1}</span>
                        <p className="font-semibold text-sm truncate">{item.name}</p>
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-1">
                        {ALL_CATEGORIES.find((category) => category.value === item.category)?.label || item.category}
                      </p>
                    </div>

                    <div className="relative w-12 h-12 rounded-xl bg-white overflow-hidden flex-shrink-0">
                      {imageSrc ? (
                        <Image
                          src={imageSrc}
                          alt={item.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-gray-300" />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

      {/* Items list */}
      <div className="w-full max-w-full overflow-x-hidden">
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
            <p dir="rtl">لا توجد أصناف</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((item, idx) => {
              const imgSrc = getDisplayImage(item.image)
              return (
                <div key={`${item.id}-${idx}`} className="w-full max-w-full bg-white rounded-2xl p-3 flex items-center gap-3 shadow-sm overflow-hidden">

                  {/* Image */}
                  <div className="relative w-20 h-20 rounded-2xl bg-[#f5f5f5] overflow-hidden flex-shrink-0">
                    {imgSrc
                      ? <Image
                          src={imgSrc}
                          alt={item.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      : <div className="absolute inset-0 flex items-center justify-center"><ImageIcon className="h-6 w-6 text-gray-300" /></div>
                    }
                    {item.isFeatured && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                        <Star className="h-2.5 w-2.5 fill-yellow-900 text-yellow-900" />
                      </div>
                    )}
                    {!item.inStock && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-2xl">
                        <span className="text-white text-[9px] font-bold">نفذ</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <button
                    type="button"
                    onClick={() => openModal({ ...item }, false)}
                    className="flex-1 min-w-0 text-right bg-transparent border-0 p-0 m-0 cursor-pointer"
                    dir="rtl"
                  >
                    <p className="font-bold text-sm truncate">{item.name}</p>
                    {item.nameEn && <p className="text-xs text-gray-400 truncate">{item.nameEn}</p>}
                    <p className="text-sm font-bold mt-0.5">
                      <PriceWithRiyalLogo value={item.price} />
                    </p>
                    <p className="text-xs text-gray-400 truncate">{ALL_CATEGORIES.find(c => c.value === item.category)?.label || item.category}</p>
                  </button>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        openModal({ ...item }, false)
                      }}
                      className="w-10 h-10 rounded-xl bg-[#f5f5f5] flex items-center justify-center active:scale-95 transition-transform"
                    >
                      <Pencil className="h-4 w-4 text-gray-600" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteConfirm(item.id)
                      }}
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
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div
            className="w-full bg-white rounded-t-3xl flex flex-col"
            style={{ maxHeight: "92dvh", height: "92dvh" }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <button onClick={closeModal} className="w-11 h-11 rounded-full bg-[#f5f5f5] flex items-center justify-center active:scale-95 transition-transform">
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-base font-bold" dir="rtl">{isNew ? "إضافة صنف" : "تعديل الصنف"}</h2>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-3 bg-black text-white rounded-full text-sm font-medium disabled:opacity-50 active:scale-95 transition-transform"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                <span dir="rtl">حفظ</span>
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
                <label className="block text-sm font-semibold mb-2 text-right" dir="rtl">الصورة الرئيسية</label>
                <div className="flex items-center gap-3">
                  <div className="relative w-24 h-24 rounded-2xl bg-[#f5f5f5] flex items-center justify-center overflow-hidden flex-shrink-0">
                    {modalMainImage
                      ? <Image
                          src={modalMainImage}
                          alt="preview"
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
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
                      onChange={e => setModalItem(p => p ? { ...p, image: e.target.value } : p)}
                      placeholder="أو الصق رابط الصورة"
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
                  onChange={e => setModalItem(p => p ? { ...p, name: e.target.value } : p)}
                  placeholder="مثال: سمبوسة جبن"
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
                <label className="block text-sm font-semibold mb-1.5 text-right" dir="rtl">الوصف</label>
                <textarea
                  value={modalItem.description || ""}
                  onChange={e => setModalItem(p => p ? { ...p, description: e.target.value } : p)}
                  placeholder="وصف الصنف"
                  rows={2}
                  dir="rtl"
                  className="w-full px-4 py-3.5 rounded-2xl bg-[#f5f5f5] focus:outline-none text-right resize-none text-base" style={{fontSize: "16px"}}
                />
              </div>

              {/* Price + Limit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-right" dir="rtl">السعر <span className="text-red-500">*</span></label>
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
                  <label className="block text-sm font-semibold mb-1.5 text-right" dir="rtl">حد الاختيار</label>
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
                <label className="block text-sm font-semibold mb-1.5 text-right" dir="rtl">الفئة <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select
                    value={modalItem.category || ""}
                    onChange={e => setModalItem(p => p ? { ...p, category: e.target.value } : p)}
                    dir="rtl"
                    className="w-full appearance-none px-4 py-3.5 rounded-2xl bg-[#f5f5f5] focus:outline-none text-right cursor-pointer text-base" style={{fontSize: "16px"}}
                  >
                    <option value="">اختر الفئة</option>
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
                    <p className="font-semibold text-sm">متوفر في المخزون</p>
                    <p className="text-xs text-gray-400 mt-0.5">إيقاف يخفي الصنف من القائمة</p>
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
                <label className="block text-sm font-semibold mb-1.5 text-right" dir="rtl">⏱️ وقت التحضير</label>
                <div className="relative">
                  <select
                    value={modalItem.makingTime || 0}
                    onChange={(e) => setModalItem((p) => p ? { ...p, makingTime: Number(e.target.value) } : p)}
                    className="w-full appearance-none px-4 py-3.5 rounded-2xl bg-[#f5f5f5] focus:outline-none text-right text-base cursor-pointer" style={{fontSize: "16px"}}
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
                  <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                <p className="text-xs text-gray-400 mt-1 text-right" dir="rtl">يحدد أقرب موعد توصيل متاح للعميل</p>
              </div>

              {/* Gallery Images */}
              <div dir="rtl">
                <p className="font-semibold text-sm mb-2">🖼️ صور إضافية (جاليري)</p>
                <div className="flex gap-2 flex-wrap mb-2">
                  {(modalItem.images || []).map((url, idx) => {
                    const gallerySrc = getDisplayImage(String(url || ""))
                    if (!gallerySrc) return null
                    return (
                      <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#f5f5f5] flex-shrink-0">
                        <Image
                          src={gallerySrc}
                          alt=""
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                        <button
                          onClick={() => setModalItem(prev => prev ? ({ ...prev, images: (prev.images || []).filter((_, i) => i !== idx) }) : prev)}
                          className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    )
                  })}
                  <label className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors flex-shrink-0">
                    {galleryUploading
                      ? <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                      : <><Upload className="h-4 w-4 text-gray-400" /><span className="text-[10px] text-gray-400 mt-0.5">إضافة</span></>
                    }
                    <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" />
                  </label>
                </div>
                <p className="text-xs text-gray-400">يمكنك إضافة أكثر من صورة — ستظهر في معرض المنتج</p>
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


              {/* ── PACKAGE MODE (باقات العيد only) ── */}
              {modalItem.category === "eid" && (
                <div dir="rtl" className="border-2 border-yellow-300 bg-yellow-50 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎁</span>
                    <p className="font-black text-base text-[#1e293b]">إعداد الباقة</p>
                    <span className="text-xs bg-yellow-400 text-yellow-900 font-bold px-2 py-0.5 rounded-full mr-auto">باقة عيد</span>
                  </div>

                  {/* Hint */}
                  <div className="bg-white rounded-xl p-3 text-xs text-gray-500 space-y-1">
                    <p>• <strong>حد الاختيار</strong> أعلاه = عدد السخانات (4 أو 6)</p>
                    <p>• أضف بلاتر الاجبان كـ "مشمول" أدناه</p>
                  </div>

                  {/* Current package items */}
                  {(modalItem.packageItems || []).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500">محتويات الباقة الحالية:</p>
                      {(modalItem.packageItems || []).map((pkg, i) => (
                        <div key={i} className="flex items-center gap-2 p-3 bg-white rounded-xl border border-gray-100">
                          <button
                            onClick={() => setModalItem(p => p ? { ...p, packageItems: (p.packageItems || []).filter((_, idx) => idx !== i) } : p)}
                            className="w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-sm flex-shrink-0 active:scale-95"
                          >×</button>
                          <div className="flex-1 text-right">
                            <p className="font-semibold text-sm">{pkg.label}</p>
                          </div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pkg.included ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"}`}>
                            {pkg.included ? "مشمول" : `${pkg.quantity} قطعة`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add item */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500">إضافة عنصر:</p>
                    <input
                      value={pkgLabelInput}
                      onChange={e => setPkgLabelInput(e.target.value)}
                      placeholder="مثال: بلاتر الاجبان"
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
                      >+ إضافة بعدد</button>
                    </div>
                    <button
                      onClick={() => {
                        if (!pkgLabelInput.trim()) return
                        setModalItem(p => p ? { ...p, packageItems: [...(p.packageItems || []), { label: pkgLabelInput.trim(), quantity: 1, included: true }] } : p)
                        setPkgLabelInput("")
                      }}
                      className="w-full py-2.5 bg-yellow-400 text-yellow-900 rounded-xl text-sm font-bold active:scale-95"
                    >⭐ إضافة كـ "مشمول"</button>
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
