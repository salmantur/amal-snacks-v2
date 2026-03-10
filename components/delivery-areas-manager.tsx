"use client"

import { useEffect, useState } from "react"
import { Check, Loader2, MapPin, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react"
import {
  deleteDeliveryArea,
  saveDeliveryArea,
  seedDeliveryAreas,
  type DeliveryArea,
  useDeliveryAreas,
} from "@/hooks/use-delivery-areas"
import { PriceWithRiyalLogo } from "@/components/ui/price-with-riyal-logo"

function buildMutationError(action: string, details: string | null) {
  if (!details) {
    return `فشل ${action}.`
  }

  if (details.includes("permission") || details.includes("policy") || details.includes("row-level security")) {
    return `فشل ${action} لأن صلاحية الحفظ غير متاحة في Supabase.`
  }

  return `فشل ${action}: ${details}`
}

export function DeliveryAreasManager() {
  const { allAreas, loading, reload, isUsingFallback, loadError } = useDeliveryAreas()
  const [areas, setAreas] = useState<DeliveryArea[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editPrice, setEditPrice] = useState("")
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState("")
  const [newPrice, setNewPrice] = useState("")
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading) {
      setAreas(allAreas)
    }
  }, [allAreas, loading])

  const resetAddState = () => {
    setAdding(false)
    setNewName("")
    setNewPrice("")
  }

  const handleSeed = async () => {
    setSeeding(true)
    setError(null)

    const result = await seedDeliveryAreas()

    if (!result.ok) {
      setError(buildMutationError("تحميل الأسعار الافتراضية", result.error))
      setSeeding(false)
      return
    }

    await reload()
    setSeeding(false)
  }

  const handleAdd = async () => {
    const trimmedName = newName.trim()
    const parsedPrice = Number(newPrice)

    if (!trimmedName || !newPrice) {
      setError("اسم المنطقة والسعر مطلوبان.")
      return
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setError("أدخل سعر توصيل صحيحًا.")
      return
    }

    setSaving(true)
    setError(null)

    const area: DeliveryArea = {
      id: `area-${Date.now()}`,
      name: trimmedName,
      price: parsedPrice,
      sort_order: areas.length + 1,
      is_active: true,
    }

    const result = await saveDeliveryArea(area)

    if (!result.ok) {
      setError(buildMutationError("حفظ المنطقة", result.error))
      setSaving(false)
      return
    }

    await reload()
    resetAddState()
    setSaving(false)
  }

  const handleEdit = (area: DeliveryArea) => {
    setError(null)
    setEditingId(area.id)
    setEditName(area.name)
    setEditPrice(String(area.price))
  }

  const handleSaveEdit = async (area: DeliveryArea) => {
    const trimmedName = editName.trim()
    const parsedPrice = Number(editPrice)

    if (!trimmedName || !editPrice) {
      setError("اسم المنطقة والسعر مطلوبان.")
      return
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setError("أدخل سعر توصيل صحيحًا.")
      return
    }

    setSaving(true)
    setError(null)

    const updatedArea: DeliveryArea = {
      ...area,
      name: trimmedName,
      price: parsedPrice,
    }

    const result = await saveDeliveryArea(updatedArea)

    if (!result.ok) {
      setError(buildMutationError("تعديل المنطقة", result.error))
      setSaving(false)
      return
    }

    await reload()
    setEditingId(null)
    setSaving(false)
  }

  const handleToggle = async (area: DeliveryArea) => {
    const updatedArea: DeliveryArea = {
      ...area,
      is_active: !area.is_active,
    }

    const result = await saveDeliveryArea(updatedArea)

    if (!result.ok) {
      setError(buildMutationError("تحديث حالة المنطقة", result.error))
      return
    }

    setError(null)
    await reload()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("حذف هذه المنطقة؟")) {
      return
    }

    const result = await deleteDeliveryArea(id)

    if (!result.ok) {
      setError(buildMutationError("حذف المنطقة", result.error))
      return
    }

    setError(null)
    await reload()
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div dir="rtl" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="inline-flex items-center gap-1 text-xs text-blue-500 disabled:opacity-60"
        >
          <RefreshCw className={`h-3 w-3 ${seeding ? "animate-spin" : ""}`} />
          تحميل الأسعار الافتراضية
        </button>

        <h3 className="flex items-center gap-2 text-base font-bold">
          <MapPin className="h-4 w-4 text-primary" />
          مناطق التوصيل
        </h3>
      </div>

      {isUsingFallback ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-right text-xs text-amber-700">
          يتم عرض أسعار افتراضية مؤقتة لأن تعذر تحميل مناطق التوصيل المحفوظة من Supabase.
          <p className="mt-1 opacity-80">يمكنك الضغط على "تحميل الأسعار الافتراضية" ثم الحفظ من جديد لتخزينها داخل إعدادات التطبيق.</p>
          {loadError ? <p className="mt-1 opacity-70">{loadError}</p> : null}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-right text-xs text-red-600">
          {error}
        </div>
      ) : null}

      <div className="space-y-2">
        {areas.map((area) => (
          <div
            key={area.id}
            className={`rounded-2xl border p-3 transition-all ${
              area.is_active ? "border-gray-100 bg-white" : "border-gray-100 bg-gray-50 opacity-60"
            }`}
          >
            {editingId === area.id ? (
              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleSaveEdit(area)}
                    disabled={saving}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white disabled:opacity-60"
                    aria-label="حفظ التعديلات"
                  >
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500"
                    aria-label="إلغاء التعديل"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <input
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  className="min-w-0 rounded-xl bg-[#f5f5f5] px-3 py-2 text-right text-sm focus:outline-none"
                  dir="rtl"
                />

                <label className="flex items-center gap-2 rounded-xl bg-[#f5f5f5] px-3 py-2 text-sm text-gray-500">
                  <span className="text-xs">
                    <PriceWithRiyalLogo value="" />
                  </span>
                  <input
                    value={editPrice}
                    onChange={(event) => setEditPrice(event.target.value)}
                    type="number"
                    className="w-16 bg-transparent text-center text-sm text-primary focus:outline-none"
                    placeholder="السعر"
                  />
                </label>
              </div>
            ) : (
              <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDelete(area.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-red-400 transition-colors hover:bg-red-50 active:scale-95"
                    aria-label={`حذف ${area.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(area)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 active:scale-95"
                    aria-label={`تعديل ${area.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>

                <span className="min-w-0 text-right text-sm font-medium text-primary">{area.name}</span>

                <span className="w-16 text-center text-sm font-bold text-primary">
                  <PriceWithRiyalLogo value={area.price} />
                </span>

                <button
                  onClick={() => handleToggle(area)}
                  className={`relative h-5 w-9 flex-shrink-0 rounded-full transition-colors ${
                    area.is_active ? "bg-green-400" : "bg-gray-200"
                  }`}
                  aria-label={area.is_active ? `إيقاف ${area.name}` : `تفعيل ${area.name}`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
                      area.is_active ? "left-4" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            )}
          </div>
        ))}

        {areas.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">
            لا توجد مناطق محفوظة بعد. اضغط &quot;تحميل الأسعار الافتراضية&quot; لإضافة القائمة الأساسية.
          </p>
        ) : null}
      </div>

      {adding ? (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
            <div className="flex items-center gap-1">
              <button
                onClick={handleAdd}
                disabled={saving}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white disabled:opacity-60"
                aria-label="حفظ المنطقة الجديدة"
              >
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              </button>
              <button
                onClick={() => {
                  resetAddState()
                  setError(null)
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-500"
                aria-label="إلغاء الإضافة"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              className="min-w-0 rounded-xl border border-blue-200 bg-white px-3 py-2 text-right text-sm focus:outline-none"
              placeholder="اسم المنطقة"
              dir="rtl"
              autoFocus
              onKeyDown={(event) => event.key === "Enter" && handleAdd()}
            />

            <label className="flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm text-gray-500">
              <span className="text-xs">
                <PriceWithRiyalLogo value="" />
              </span>
              <input
                type="number"
                value={newPrice}
                onChange={(event) => setNewPrice(event.target.value)}
                className="w-16 bg-transparent text-center text-sm text-primary focus:outline-none"
                placeholder="السعر"
              />
            </label>
          </div>
        </div>
      ) : (
        <button
          onClick={() => {
            setError(null)
            setAdding(true)
          }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 py-3 text-sm font-medium text-gray-500 transition-all hover:border-primary hover:text-primary active:scale-95"
        >
          <Plus className="h-4 w-4" />
          إضافة منطقة جديدة
        </button>
      )}
    </div>
  )
}
