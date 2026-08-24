"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Trash2, Clock, CalendarX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useOrderScheduleConfig } from "@/hooks/use-order-schedule-config"
import {
  normalizeOrderScheduleConfig,
  type OrderScheduleConfig,
  type ServiceWindow,
} from "@/lib/order-schedule-config"

let windowIdCounter = 0
function makeWindowId() {
  windowIdCounter += 1
  return `window-${Date.now()}-${windowIdCounter}`
}

const NEW_WINDOW_TEMPLATE: Omit<ServiceWindow, "id"> = {
  label: "فترة جديدة",
  openHour: 8,
  closeHour: 11,
  cutoff: { type: "leadMinutes", minutes: 45 },
}

function hourLabel(hour: number): string {
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  const period = hour >= 12 ? "م" : "ص"
  return `${h12}:00 ${period}`
}

export function OrderScheduleManager() {
  const { config, loading, saveConfig } = useOrderScheduleConfig()
  const [draft, setDraft] = useState<OrderScheduleConfig>(config)
  const [saving, setSaving] = useState(false)
  const [newClosedDate, setNewClosedDate] = useState("")

  useEffect(() => {
    setDraft(config)
  }, [config])

  const hasChanges = useMemo(
    () => JSON.stringify(normalizeOrderScheduleConfig(draft)) !== JSON.stringify(normalizeOrderScheduleConfig(config)),
    [draft, config]
  )

  function updateWindow(id: string, patch: Partial<ServiceWindow>) {
    setDraft((prev) => ({
      ...prev,
      windows: prev.windows.map((w) => (w.id === id ? { ...w, ...patch } : w)),
    }))
  }

  function updateCutoffType(id: string, type: "leadMinutes" | "nightBefore") {
    setDraft((prev) => ({
      ...prev,
      windows: prev.windows.map((w) =>
        w.id === id
          ? { ...w, cutoff: type === "leadMinutes" ? { type, minutes: 45 } : { type, hour: 21 } }
          : w
      ),
    }))
  }

  function removeWindow(id: string) {
    setDraft((prev) => ({ ...prev, windows: prev.windows.filter((w) => w.id !== id) }))
  }

  function addWindow() {
    setDraft((prev) => ({
      ...prev,
      windows: [...prev.windows, { ...NEW_WINDOW_TEMPLATE, id: makeWindowId() }],
    }))
  }

  function addClosedDate() {
    const date = newClosedDate.trim()
    if (!date) return
    setDraft((prev) => ({ ...prev, closedDates: [...prev.closedDates, date] }))
    setNewClosedDate("")
  }

  function removeClosedDate(date: string) {
    setDraft((prev) => ({ ...prev, closedDates: prev.closedDates.filter((d) => d !== date) }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await saveConfig(normalizeOrderScheduleConfig(draft))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="rounded-2xl border border-admin-border-soft bg-white p-4 text-sm text-admin-muted-2">جارِ التحميل...</div>
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-admin-border-soft bg-white p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-admin-muted" />
          <div>
            <h3 className="font-bold text-base">فترات استقبال الطلبات</h3>
            <p className="text-sm text-admin-muted-2">حدد الفترات التي يمكن للعملاء اختيار موعد توصيل خلالها</p>
          </div>
        </div>

        <div className="space-y-3">
          {draft.windows.map((window) => (
            <div key={window.id} className="rounded-xl border border-admin-border-soft p-3 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-start">
                <Input
                  value={window.label}
                  onChange={(e) => updateWindow(window.id, { label: e.target.value })}
                  placeholder="اسم الفترة (مثال: فطور)"
                />
                <button
                  type="button"
                  onClick={() => removeWindow(window.id)}
                  className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center self-start"
                  aria-label="حذف الفترة"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1">
                  <span className="text-xs font-medium text-admin-muted">من الساعة</span>
                  <select
                    value={window.openHour}
                    onChange={(e) => updateWindow(window.id, { openHour: Number(e.target.value) })}
                    className="w-full h-10 rounded-xl border border-admin-border-soft px-3 bg-white text-sm"
                  >
                    {Array.from({ length: 24 }, (_, h) => (
                      <option key={h} value={h}>{hourLabel(h)}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium text-admin-muted">إلى الساعة</span>
                  <select
                    value={window.closeHour}
                    onChange={(e) => updateWindow(window.id, { closeHour: Number(e.target.value) })}
                    className="w-full h-10 rounded-xl border border-admin-border-soft px-3 bg-white text-sm"
                  >
                    {Array.from({ length: 24 }, (_, h) => h + 1).map((h) => (
                      <option key={h} value={h}>{hourLabel(h % 24)}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1">
                  <span className="text-xs font-medium text-admin-muted">آخر موعد للطلب</span>
                  <select
                    value={window.cutoff.type}
                    onChange={(e) => updateCutoffType(window.id, e.target.value as "leadMinutes" | "nightBefore")}
                    className="w-full h-10 rounded-xl border border-admin-border-soft px-3 bg-white text-sm"
                  >
                    <option value="leadMinutes">قبل الموعد بمدة (دقائق)</option>
                    <option value="nightBefore">حتى ساعة محددة قبل الفترة</option>
                  </select>
                </label>

                {window.cutoff.type === "leadMinutes" ? (
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-admin-muted">عدد الدقائق</span>
                    <Input
                      type="number"
                      min={0}
                      value={window.cutoff.minutes}
                      onChange={(e) =>
                        updateWindow(window.id, {
                          cutoff: { type: "leadMinutes", minutes: Math.max(0, Number(e.target.value) || 0) },
                        })
                      }
                    />
                  </label>
                ) : (
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-admin-muted">آخر ساعة للطلب</span>
                    <select
                      value={window.cutoff.hour}
                      onChange={(e) =>
                        updateWindow(window.id, {
                          cutoff: { type: "nightBefore", hour: Number(e.target.value) },
                        })
                      }
                      className="w-full h-10 rounded-xl border border-admin-border-soft px-3 bg-white text-sm"
                    >
                      {Array.from({ length: 24 }, (_, h) => (
                        <option key={h} value={h}>{hourLabel(h)}</option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              <p className="text-xs text-admin-muted-2">
                {window.cutoff.type === "leadMinutes"
                  ? `يجب أن يُطلب قبل الموعد بـ ${window.cutoff.minutes} دقيقة على الأقل (بالإضافة لوقت التحضير)`
                  : window.cutoff.hour < 12
                  ? `يجب أن يُطلب قبل الساعة ${hourLabel(window.cutoff.hour)} من فجر يوم التسليم نفسه`
                  : `يجب أن يُطلب قبل الساعة ${hourLabel(window.cutoff.hour)} من مساء اليوم السابق`}
              </p>
            </div>
          ))}

          {draft.windows.length === 0 && (
            <p className="text-sm text-admin-muted-2 text-center py-4">لا توجد فترات - أضف فترة لاستقبال الطلبات</p>
          )}
        </div>

        <Button type="button" variant="outline" onClick={addWindow} className="w-full rounded-xl">
          <Plus className="h-4 w-4 ml-1" />
          إضافة فترة
        </Button>
      </section>

      <section className="rounded-2xl border border-admin-border-soft bg-white p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CalendarX className="h-5 w-5 text-admin-muted" />
          <div>
            <h3 className="font-bold text-base">أيام مغلقة</h3>
            <p className="text-sm text-admin-muted-2">لا يمكن للعملاء الطلب في هذه التواريخ</p>
          </div>
        </div>

        <div className="space-y-2">
          {draft.closedDates.map((date) => (
            <div key={date} className="flex items-center justify-between rounded-xl border border-admin-border-soft p-2 pr-3">
              <span className="text-sm font-medium">{date}</span>
              <button
                type="button"
                onClick={() => removeClosedDate(date)}
                className="h-8 w-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center"
                aria-label="حذف التاريخ"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            type="date"
            value={newClosedDate}
            onChange={(e) => setNewClosedDate(e.target.value)}
            className="flex-1"
          />
          <Button type="button" onClick={addClosedDate} className="rounded-xl">
            <Plus className="h-4 w-4 ml-1" />
            إضافة
          </Button>
        </div>
      </section>

      <Button
        type="button"
        onClick={handleSave}
        disabled={saving || !hasChanges || draft.windows.length === 0}
        className={cn("w-full h-12 rounded-xl")}
      >
        {saving ? "جارٍ الحفظ..." : "حفظ إعدادات المواعيد"}
      </Button>
    </div>
  )
}
