"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Pencil, Check, X, Loader2, MapPin, RefreshCw } from "lucide-react"
import { useDeliveryAreas, saveDeliveryArea, deleteDeliveryArea, seedDeliveryAreas, type DeliveryArea } from "@/hooks/use-delivery-areas"

export function DeliveryAreasManager() {
  const { allAreas, loading, reload } = useDeliveryAreas()
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
    if (!loading) setAreas(allAreas)
  }, [allAreas, loading])

  const handleSeed = async () => {
    setSeeding(true)
    await seedDeliveryAreas()
    await reload()
    setSeeding(false)
  }

  const handleAdd = async () => {
    if (!newName.trim() || !newPrice) { setError("اسم المنطقة والسعر مطلوبان"); return }
    setSaving(true)
    setError(null)
    const id = `area-${Date.now()}`
    const area: DeliveryArea = {
      id,
      name: newName.trim(),
      price: Number(newPrice),
      sort_order: areas.length + 1,
      is_active: true,
    }
    const ok = await saveDeliveryArea(area)
    if (ok) {
      setAreas(prev => [...prev, area])
      setNewName("")
      setNewPrice("")
      setAdding(false)
    } else {
      setError("فشل الحفظ — تأكد من إنشاء جدول delivery_areas في Supabase")
    }
    setSaving(false)
  }

  const handleEdit = (area: DeliveryArea) => {
    setEditingId(area.id)
    setEditName(area.name)
    setEditPrice(String(area.price))
  }

  const handleSaveEdit = async (area: DeliveryArea) => {
    setSaving(true)
    const updated = { ...area, name: editName.trim(), price: Number(editPrice) }
    const ok = await saveDeliveryArea(updated)
    if (ok) {
      setAreas(prev => prev.map(a => a.id === area.id ? updated : a))
      setEditingId(null)
    } else {
      setError("فشل الحفظ")
    }
    setSaving(false)
  }

  const handleToggle = async (area: DeliveryArea) => {
    const updated = { ...area, is_active: !area.is_active }
    await saveDeliveryArea(updated)
    setAreas(prev => prev.map(a => a.id === area.id ? updated : a))
  }

  const handleDelete = async (id: string) => {
    if (!confirm("حذف هذه المنطقة؟")) return
    await deleteDeliveryArea(id)
    setAreas(prev => prev.filter(a => a.id !== id))
  }

  if (loading) return (
    <div className="flex justify-center py-10">
      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
    </div>
  )

  return (
    <div dir="rtl" className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="text-xs text-blue-500 flex items-center gap-1"
        >
          <RefreshCw className={`h-3 w-3 ${seeding ? "animate-spin" : ""}`} />
          تحميل الأسعار الافتراضية
        </button>
        <h3 className="font-bold text-base flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          مناطق التوصيل
        </h3>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-600 text-right">
          {error}
          <p className="mt-1 opacity-70">قم بتشغيل SQL في Supabase لإنشاء الجدول أولاً</p>
        </div>
      )}

      {/* SQL hint */}
      <details className="text-xs text-gray-400">
        <summary className="cursor-pointer">SQL لإنشاء الجدول في Supabase ↓</summary>
        <pre className="mt-2 p-3 bg-gray-50 rounded-xl text-[10px] overflow-x-auto text-gray-600 text-left leading-relaxed">{`CREATE TABLE delivery_areas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);
ALTER TABLE delivery_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read" ON delivery_areas FOR SELECT TO public USING (true);
CREATE POLICY "public_write" ON delivery_areas FOR ALL TO public USING (true) WITH CHECK (true);`}</pre>
      </details>

      {/* Areas list */}
      <div className="space-y-2">
        {areas.map((area) => (
          <div
            key={area.id}
            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
              area.is_active ? "bg-white border-gray-100" : "bg-gray-50 border-gray-100 opacity-60"
            }`}
          >
            {editingId === area.id ? (
              // Edit mode
              <>
                <button onClick={() => setEditingId(null)} className="text-gray-400 flex-shrink-0">
                  <X className="h-4 w-4" />
                </button>
                <input
                  value={editPrice}
                  onChange={e => setEditPrice(e.target.value)}
                  type="number"
                  className="w-16 px-2 py-1.5 rounded-xl bg-[#f5f5f5] text-sm text-center focus:outline-none"
                  placeholder="السعر"
                />
                <span className="text-xs text-gray-400 flex-shrink-0">ر.س</span>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-[#f5f5f5] text-sm text-right focus:outline-none"
                  dir="rtl"
                />
                <button
                  onClick={() => handleSaveEdit(area)}
                  disabled={saving}
                  className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0"
                >
                  {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                </button>
              </>
            ) : (
              // View mode
              <>
                <button
                  onClick={() => handleDelete(area.id)}
                  className="text-red-400 flex-shrink-0 active:scale-95"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleEdit(area)}
                  className="text-gray-400 flex-shrink-0 active:scale-95"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <span className="font-bold text-sm text-primary flex-shrink-0 w-14 text-center">
                  {area.price} ر.س
                </span>
                <span className="flex-1 font-medium text-sm text-right">{area.name}</span>
                {/* Active toggle */}
                <button
                  onClick={() => handleToggle(area)}
                  className={`w-9 h-5 rounded-full transition-colors flex-shrink-0 relative ${
                    area.is_active ? "bg-green-400" : "bg-gray-200"
                  }`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                    area.is_active ? "left-4" : "left-0.5"
                  }`} />
                </button>
              </>
            )}
          </div>
        ))}

        {areas.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-4">
            لا توجد مناطق — اضغط "تحميل الأسعار الافتراضية"
          </p>
        )}
      </div>

      {/* Add new area */}
      {adding ? (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-2xl">
          <button onClick={() => { setAdding(false); setError(null) }} className="text-gray-400 flex-shrink-0">
            <X className="h-4 w-4" />
          </button>
          <input
            type="number"
            value={newPrice}
            onChange={e => setNewPrice(e.target.value)}
            className="w-16 px-2 py-1.5 rounded-xl bg-white text-sm text-center focus:outline-none border border-blue-200"
            placeholder="السعر"
            autoFocus
          />
          <span className="text-xs text-gray-400 flex-shrink-0">ر.س</span>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-xl bg-white text-sm text-right focus:outline-none border border-blue-200"
            placeholder="اسم المنطقة"
            dir="rtl"
            onKeyDown={e => e.key === "Enter" && handleAdd()}
          />
          <button
            onClick={handleAdd}
            disabled={saving}
            className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 text-sm font-medium active:scale-95 transition-all hover:border-primary hover:text-primary"
        >
          <Plus className="h-4 w-4" />
          إضافة منطقة جديدة
        </button>
      )}
    </div>
  )
}