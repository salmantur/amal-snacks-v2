"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Trash2, TicketPercent } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useDiscountConfig } from "@/hooks/use-discount-config"
import { type DiscountCode, type DiscountType, normalizeDiscountConfig } from "@/lib/discounts"

const DEFAULT_CODE: DiscountCode = {
  code: "",
  type: "percent",
  value: 0,
  active: true,
  minOrder: 0,
}

export function DiscountManager() {
  const { config, loading, saveConfig } = useDiscountConfig()
  const [draft, setDraft] = useState(config)
  const [saving, setSaving] = useState(false)
  const [newCode, setNewCode] = useState<DiscountCode>(DEFAULT_CODE)

  useEffect(() => {
    setDraft(config)
  }, [config])

  const hasChanges = useMemo(
    () => JSON.stringify(normalizeDiscountConfig(draft)) !== JSON.stringify(normalizeDiscountConfig(config)),
    [draft, config]
  )

  function updateDraft(patch: Partial<typeof draft>) {
    setDraft((prev) => ({ ...prev, ...patch }))
  }

  function updateCode(index: number, patch: Partial<DiscountCode>) {
    setDraft((prev) => ({
      ...prev,
      codes: prev.codes.map((code, i) => (i === index ? { ...code, ...patch } : code)),
    }))
  }

  function removeCode(index: number) {
    setDraft((prev) => ({
      ...prev,
      codes: prev.codes.filter((_, i) => i !== index),
    }))
  }

  function addCode() {
    const code = newCode.code.trim().toUpperCase()
    if (!code) return
    if (draft.codes.some((row) => row.code === code)) return
    setDraft((prev) => ({
      ...prev,
      codes: [
        ...prev.codes,
        {
          code,
          type: newCode.type,
          value: Math.max(0, Number(newCode.value) || 0),
          active: Boolean(newCode.active),
          minOrder: Math.max(0, Number(newCode.minOrder) || 0),
        },
      ],
    }))
    setNewCode(DEFAULT_CODE)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await saveConfig(normalizeDiscountConfig(draft))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-500">Loading discounts...</div>
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base">الخصومات</h3>
            <p className="text-sm text-gray-500">تفعيل وتعطيل نظام الخصم بالكامل</p>
          </div>
          <button
            type="button"
            onClick={() => updateDraft({ enabled: !draft.enabled })}
            className={cn(
              "h-10 px-4 rounded-full text-sm font-semibold transition-colors",
              draft.enabled ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"
            )}
          >
            {draft.enabled ? "مفعل" : "متوقف"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base">خصم عام</h3>
            <p className="text-sm text-gray-500">يطبق تلقائيا على جميع الطلبات</p>
          </div>
          <button
            type="button"
            onClick={() => updateDraft({ autoDiscountEnabled: !draft.autoDiscountEnabled })}
            className={cn(
              "h-10 px-4 rounded-full text-sm font-semibold transition-colors",
              draft.autoDiscountEnabled ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"
            )}
          >
            {draft.autoDiscountEnabled ? "مفعل" : "متوقف"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-sm font-medium text-gray-700">نوع الخصم</span>
            <select
              value={draft.autoDiscountType}
              onChange={(e) => updateDraft({ autoDiscountType: e.target.value as DiscountType })}
              className="w-full h-11 rounded-xl border border-gray-200 px-3 bg-white"
            >
              <option value="percent">نسبة مئوية %</option>
              <option value="fixed">قيمة ثابتة</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-gray-700">قيمة الخصم</span>
            <Input
              type="number"
              min={0}
              value={draft.autoDiscountValue}
              onChange={(e) => updateDraft({ autoDiscountValue: Math.max(0, Number(e.target.value) || 0) })}
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
        <div className="flex items-center gap-2">
          <TicketPercent className="h-5 w-5 text-gray-600" />
          <h3 className="font-bold text-base">أكواد الخصم</h3>
        </div>

        <div className="space-y-2">
          {draft.codes.map((code, index) => (
            <div key={`${code.code}-${index}`} className="rounded-xl border border-gray-200 p-3 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  value={code.code}
                  onChange={(e) => updateCode(index, { code: e.target.value.toUpperCase() })}
                  placeholder="CODE10"
                />
                <select
                  value={code.type}
                  onChange={(e) => updateCode(index, { type: e.target.value as DiscountType })}
                  className="h-10 rounded-xl border border-gray-200 px-3 bg-white"
                >
                  <option value="percent">نسبة %</option>
                  <option value="fixed">قيمة ثابتة</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input
                  type="number"
                  min={0}
                  value={code.value}
                  onChange={(e) => updateCode(index, { value: Math.max(0, Number(e.target.value) || 0) })}
                  placeholder="الخصم"
                />
                <Input
                  type="number"
                  min={0}
                  value={code.minOrder || 0}
                  onChange={(e) => updateCode(index, { minOrder: Math.max(0, Number(e.target.value) || 0) })}
                  placeholder="حد أدنى للطلب"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateCode(index, { active: !code.active })}
                    className={cn(
                      "h-10 px-4 rounded-xl text-sm font-semibold",
                      code.active ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {code.active ? "مفعل" : "متوقف"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeCode(index)}
                    className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center"
                    aria-label="حذف الكود"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-dashed border-gray-300 p-3 space-y-2">
          <p className="text-sm font-medium text-gray-700">إضافة كود جديد</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input
              value={newCode.code}
              onChange={(e) => setNewCode((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
              placeholder="WELCOME15"
            />
            <select
              value={newCode.type}
              onChange={(e) => setNewCode((prev) => ({ ...prev, type: e.target.value as DiscountType }))}
              className="h-10 rounded-xl border border-gray-200 px-3 bg-white"
            >
              <option value="percent">نسبة %</option>
              <option value="fixed">قيمة ثابتة</option>
            </select>
            <Input
              type="number"
              min={0}
              value={newCode.value}
              onChange={(e) => setNewCode((prev) => ({ ...prev, value: Math.max(0, Number(e.target.value) || 0) }))}
              placeholder="قيمة الخصم"
            />
            <Input
              type="number"
              min={0}
              value={newCode.minOrder || 0}
              onChange={(e) => setNewCode((prev) => ({ ...prev, minOrder: Math.max(0, Number(e.target.value) || 0) }))}
              placeholder="حد أدنى للطلب"
            />
          </div>
          <Button type="button" onClick={addCode} className="rounded-xl">
            <Plus className="h-4 w-4 ml-1" />
            إضافة كود
          </Button>
        </div>
      </section>

      <Button type="button" onClick={handleSave} disabled={saving || !hasChanges} className="w-full h-12 rounded-xl">
        {saving ? "جارٍ الحفظ..." : "حفظ إعدادات الخصم"}
      </Button>
    </div>
  )
}
