"use client"

import { useState } from "react"
import { Plus, Trash2, Eye, EyeOff, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCategories, saveCategory, deleteCategory, updateCategoryVisibility, type Category } from "@/hooks/use-categories"

export function CategoryManager() {
  const { categories, loading } = useCategories()
  const [cats, setCats] = useState<Category[] | null>(null)
  const [adding, setAdding] = useState(false)
  const [newLabel, setNewLabel] = useState("")
  const [newDbKey, setNewDbKey] = useState("")
  const [saving, setSaving] = useState(false)

  const displayed = cats ?? categories

  const handleToggleVisibility = async (cat: Category) => {
    const updated = displayed.map((c) =>
      c.id === cat.id ? { ...c, isVisible: !c.isVisible } : c
    )
    setCats(updated)
    await updateCategoryVisibility(cat.id, !cat.isVisible)
  }

  const handleDelete = async (cat: Category) => {
    if (!confirm(`هل تريد حذف "${cat.label}"؟`)) return
    setCats(displayed.filter((c) => c.id !== cat.id))
    await deleteCategory(cat.id)
  }

  const handleAddCategory = async () => {
    if (!newLabel.trim() || !newDbKey.trim()) return
    setSaving(true)

    const id = `custom_${newDbKey.trim().toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`
    const newCat: Category = {
      id,
      label: newLabel.trim(),
      dbCategories: [newDbKey.trim().toLowerCase().replace(/\s+/g, "_")],
      isVisible: true,
      sortOrder: displayed.length + 1,
      isCustom: true,
    }

    await saveCategory(newCat)
    setCats([...displayed, newCat])
    setNewLabel("")
    setNewDbKey("")
    setAdding(false)
    setSaving(false)
  }

  if (loading) {
    return <div className="h-40 bg-amal-grey rounded-2xl animate-pulse" />
  }

  const visibleCount = displayed.filter((c) => c.isVisible).length
  const hiddenCount = displayed.filter((c) => !c.isVisible).length

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex gap-3">
        <div className="flex-1 bg-[#1e5631]/10 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-[#1e5631]">{visibleCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">ظاهر</p>
        </div>
        <div className="flex-1 bg-amal-grey rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{hiddenCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">مخفي</p>
        </div>
      </div>

      {/* Category list */}
      <div className="space-y-2">
        {displayed.map((cat) => (
          <div
            key={cat.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border-2 transition-all",
              cat.isVisible ? "bg-white border-transparent" : "bg-amal-grey/50 border-transparent opacity-60"
            )}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />

            <div className="flex-1 text-right min-w-0">
              <p className={cn("font-medium text-sm", !cat.isVisible && "text-muted-foreground")}>
                {cat.label}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {cat.dbCategories.join("، ")}
              </p>
            </div>

            {/* Custom badge */}
            {cat.isCustom && (
              <span className="text-xs px-2 py-0.5 bg-amal-yellow-light rounded-full text-foreground flex-shrink-0">
                مخصص
              </span>
            )}

            {/* Visibility toggle */}
            <button
              onClick={() => handleToggleVisibility(cat)}
              className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center transition-colors flex-shrink-0",
                cat.isVisible
                  ? "bg-[#1e5631]/10 text-[#1e5631] hover:bg-[#1e5631]/20"
                  : "bg-amal-grey text-muted-foreground hover:bg-amal-grey/80"
              )}
              title={cat.isVisible ? "إخفاء" : "إظهار"}
            >
              {cat.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>

            {/* Delete (custom only) */}
            {cat.isCustom && (
              <button
                onClick={() => handleDelete(cat)}
                className="w-9 h-9 rounded-xl bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 transition-colors flex-shrink-0"
                title="حذف"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add new category */}
      {adding ? (
        <div className="bg-amal-grey rounded-2xl p-4 space-y-3">
          <h3 className="font-bold text-right">تصنيف جديد</h3>

          <input
            type="text"
            placeholder="اسم التصنيف (مثال: عروض العيد)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="w-full py-3 px-4 rounded-xl bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-right"
          />

          <input
            type="text"
            placeholder="مفتاح قاعدة البيانات (مثال: eid_packages)"
            value={newDbKey}
            onChange={(e) => setNewDbKey(e.target.value)}
            className="w-full py-3 px-4 rounded-xl bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-right"
            dir="ltr"
          />
          <p className="text-xs text-muted-foreground text-right">
            هذا هو نفس قيمة حقل "category" في جدول menu بـ Supabase
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => { setAdding(false); setNewLabel(""); setNewDbKey("") }}
              className="flex-1 py-3 rounded-xl bg-white text-muted-foreground font-medium hover:bg-white/80 transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={handleAddCategory}
              disabled={saving || !newLabel.trim() || !newDbKey.trim()}
              className="flex-1 py-3 rounded-xl bg-[#1e5631] text-white font-bold hover:bg-[#174425] transition-colors disabled:opacity-50"
            >
              {saving ? "جاري الحفظ..." : "إضافة"}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full py-3 rounded-xl border-2 border-dashed border-amal-grey-dark text-muted-foreground flex items-center justify-center gap-2 hover:border-primary hover:text-primary transition-colors font-medium"
        >
          <Plus className="h-4 w-4" />
          إضافة تصنيف جديد
        </button>
      )}
    </div>
  )
}
