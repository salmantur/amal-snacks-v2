"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarX2, Loader2, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useOrderScheduleConfig } from "@/hooks/use-order-schedule-config"
import { normalizeOrderScheduleConfig } from "@/lib/order-schedule-config"

function formatClosedDate(value: string): string {
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat("ar-SA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Riyadh",
  }).format(date)
}

export function ClosedDatesManager() {
  const { config, loading, saveConfig } = useOrderScheduleConfig()
  const [draft, setDraft] = useState(config)
  const [saving, setSaving] = useState(false)
  const [newDate, setNewDate] = useState("")
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    setDraft(config)
  }, [config])

  const hasChanges = useMemo(
    () => JSON.stringify(normalizeOrderScheduleConfig(draft)) !== JSON.stringify(normalizeOrderScheduleConfig(config)),
    [config, draft]
  )

  function addClosedDate() {
    if (!newDate) return
    setDraft((prev) => ({
      ...prev,
      closedDates: Array.from(new Set([...prev.closedDates, newDate])).sort(),
    }))
    setNewDate("")
    setStatus(null)
  }

  function removeClosedDate(date: string) {
    setDraft((prev) => ({
      ...prev,
      closedDates: prev.closedDates.filter((value) => value !== date),
    }))
    setStatus(null)
  }

  async function handleSave() {
    setSaving(true)
    setStatus(null)

    try {
      await saveConfig(draft)
      setStatus("تم حفظ الأيام المغلقة.")
    } catch {
      setStatus("تعذر حفظ الأيام المغلقة.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-500">جاري التحميل...</div>
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-4" dir="rtl">
      <div className="flex items-center gap-2">
        <CalendarX2 className="h-5 w-5 text-gray-600" />
        <div className="text-right">
          <h3 className="font-bold text-base">إغلاق أيام محددة</h3>
          <p className="text-sm text-gray-500">أضف أي يوم تريد إيقاف استقبال الطلبات فيه بالكامل.</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="sm:flex-1" />
        <Button type="button" onClick={addClosedDate} disabled={!newDate} className="rounded-xl sm:min-w-32">
          <Plus className="ml-1 h-4 w-4" />
          إضافة يوم
        </Button>
      </div>

      {draft.closedDates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
          لا توجد أيام مغلقة حاليًا.
        </div>
      ) : (
        <div className="space-y-2">
          {draft.closedDates.map((date) => (
            <div key={date} className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-3">
              <button
                type="button"
                onClick={() => removeClosedDate(date)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600"
                aria-label={`حذف ${date}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{formatClosedDate(date)}</p>
                <p className="text-xs text-gray-500">{date}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button type="button" onClick={handleSave} disabled={saving || !hasChanges} className="h-11 w-full rounded-xl">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "حفظ الأيام المغلقة"}
      </Button>

      {status ? <p className="text-xs text-gray-500">{status}</p> : null}
    </section>
  )
}
