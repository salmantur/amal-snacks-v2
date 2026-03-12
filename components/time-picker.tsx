"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronDown, ChevronLeft, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  CLOSE_HOUR,
  OPEN_HOUR,
  formatArabicDuration,
  generateDeliveryDaySlots,
  isSaudiDateClosed,
  isSaudiStoreOpenForOrders,
} from "@/lib/checkout-schedule"

interface TimePickerProps {
  value: string | null
  onChange: (value: string | null) => void
  minMinutes?: number
  required?: boolean
  closedDates?: string[]
  openSignal?: number
}

export function TimePicker({ value, onChange, minMinutes = 0, required = false, closedDates = [], openSignal = 0 }: TimePickerProps) {
  const [open, setOpen] = useState(false)
  const [selectedDayIdx, setSelectedDayIdx] = useState(0)

  const days = useMemo(() => generateDeliveryDaySlots(minMinutes, closedDates), [closedDates, minMinutes])
  const safeSelectedDayIdx = days.length === 0 ? 0 : Math.min(selectedDayIdx, days.length - 1)
  const isClosedToday = isSaudiDateClosed(new Date(), closedDates)
  const isOpen = isSaudiStoreOpenForOrders(new Date(), closedDates)

  useEffect(() => {
    if (openSignal <= 0) return
    setOpen(true)
  }, [openSignal])

  const handleSelect = (slot: string) => {
    const day = days[safeSelectedDayIdx]
    if (!day) return
    onChange(`${day.dayLabel} ${day.dateLabel} - ${slot}`)
    setOpen(false)
  }

  const handleAsap = () => {
    onChange(null)
    setOpen(false)
  }

  const displayValue = value
    ? value
    : days.length === 0
    ? "لا توجد مواعيد متاحة الآن"
    : required
    ? "اختر موعدًا"
    : isOpen
    ? "في أقرب وقت ممكن"
    : "لا يوجد توصيل الآن - اختر موعدًا"

  return (
    <div dir="rtl">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "w-full flex items-center justify-between p-4 rounded-2xl transition-all border-2",
          value
            ? "bg-primary/5 border-primary"
            : required && !value
            ? "bg-red-50 border-red-200"
            : "bg-[#f5f5f5] border-transparent"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-0.5">{required ? "وقت الاستلام" : "موعد التوصيل"}</p>
            <p className={cn("font-semibold text-sm", !value && "text-gray-500")}>
              {displayValue}
            </p>
          </div>
        </div>
        <ChevronLeft className="h-5 w-5 text-gray-400" />
      </button>

      {/* Open/closed badge */}
      {!required && (
        <div className={cn(
          "mt-2 mx-1 flex items-center gap-1.5 text-xs font-medium",
          isOpen ? "text-green-600" : isClosedToday ? "text-red-500" : "text-orange-500"
        )}>
          <span className={cn("w-1.5 h-1.5 rounded-full", isOpen ? "bg-green-500" : isClosedToday ? "bg-red-500" : "bg-orange-400")} />
          {isOpen
            ? `متاح الآن - نغلق ${CLOSE_HOUR - 12}:00 م`
            : isClosedToday
            ? "اليوم مغلق لاستقبال الطلبات"
            : `نفتح الساعة ${OPEN_HOUR - 12}:00 م`}
        </div>
      )}

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-[200]" dir="rtl">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl flex flex-col"
            style={{ maxHeight: "85vh", paddingBottom: "env(safe-area-inset-bottom)" }}>

            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-4 border-b border-gray-100">
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <ChevronDown className="h-4 w-4" />
              </button>
              <div className="text-right">
                <h3 className="font-bold text-lg">اختر الموعد</h3>
                <p className="text-xs text-gray-400">ساعات العمل {OPEN_HOUR - 12}:00 م - {CLOSE_HOUR - 12}:00 م</p>
              </div>
              <CalendarDays className="h-5 w-5 text-gray-300" />
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

              {/* ASAP option */}
              {!required && isOpen && (
                <button
                  onClick={handleAsap}
                  className={cn(
                    "w-full p-4 rounded-2xl text-right transition-all border-2 flex items-center justify-between",
                    !value
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-[#f5f5f5] border-transparent hover:border-gray-200"
                  )}
                >
                  <div className={cn("text-xs px-2 py-1 rounded-full font-bold", !value ? "bg-white/20" : "bg-green-100 text-green-700")}>
                    {!value ? "✓ محدد" : "جاهز"}
                  </div>
                  <div>
                    <p className="font-bold">في أقرب وقت ممكن</p>
                    <p className={cn("text-xs mt-0.5", !value ? "opacity-80" : "text-gray-500")}>
                      {minMinutes > 0
                        ? `وقت التحضير ~${formatArabicDuration(minMinutes)} + التوصيل`
                        : "خلال 30-60 دقيقة تقريبًا"}
                    </p>
                  </div>
                </button>
              )}

              {/* Day tabs */}
              {days.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-right">
                  <p className="font-semibold text-gray-700">لا توجد مواعيد متاحة داخل نافذة الحجز الحالية</p>
                  <p className="mt-1 text-xs text-gray-500">احذف بعض الأيام المغلقة أو أعد المحاولة لاحقًا.</p>
                </div>
              ) : (
                <>
                  <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                    {days.map((day, idx) => (
                      <button
                        key={day.date}
                        onClick={() => setSelectedDayIdx(idx)}
                        className={cn(
                          "flex-shrink-0 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all",
                          safeSelectedDayIdx === idx
                            ? "bg-[#1e293b] text-white"
                            : "bg-[#f5f5f5] text-gray-600"
                        )}
                      >
                        <span className="block">{day.dayLabel}</span>
                        <span className={cn("block text-xs mt-0.5 font-normal", safeSelectedDayIdx === idx ? "opacity-70" : "text-gray-400")}>
                          {day.dateLabel}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 mb-3 font-medium">
                      {days[safeSelectedDayIdx]?.slots.length ?? 0} موعد متاح
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {days[safeSelectedDayIdx]?.slots.map((slot) => {
                        const activeDay = days[safeSelectedDayIdx]
                        const isSelected = activeDay ? value?.includes(slot) && value?.includes(activeDay.dayLabel) : false
                        return (
                          <button
                            key={slot}
                            onClick={() => handleSelect(slot)}
                            className={cn(
                              "py-3.5 rounded-2xl text-sm font-semibold transition-all border-2",
                              isSelected
                                ? "bg-primary border-primary text-primary-foreground shadow-md scale-105"
                                : "bg-[#f5f5f5] border-transparent hover:border-gray-300 hover:bg-white"
                            )}
                          >
                            {slot}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
