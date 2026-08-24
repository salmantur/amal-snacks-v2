"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ChevronDown, ChevronLeft, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import { trapFocusOnTab } from "@/lib/dialog-focus"
import {
  formatArabicDuration,
  generateDeliveryDaySlots,
  isSaudiDateClosed,
  isSaudiStoreOpenForOrders,
} from "@/lib/checkout-schedule"
import { DEFAULT_SERVICE_WINDOWS, type ServiceWindow } from "@/lib/order-schedule-config"

interface TimePickerProps {
  value: string | null
  onChange: (value: string | null) => void
  minMinutes?: number
  required?: boolean
  closedDates?: string[]
  windows?: ServiceWindow[]
  openSignal?: number
  /** Set when the trigger button is visually hidden and opened via `openSignal` from an
   *  external control instead - keeps the invisible button out of the tab order. */
  hideTrigger?: boolean
}

export function TimePicker({
  value,
  onChange,
  minMinutes = 0,
  required = false,
  closedDates = [],
  windows = DEFAULT_SERVICE_WINDOWS,
  openSignal = 0,
  hideTrigger = false,
}: TimePickerProps) {
  const [open, setOpen] = useState(false)
  const [selectedDayIdx, setSelectedDayIdx] = useState(0)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)

  const days = useMemo(
    () => generateDeliveryDaySlots(minMinutes, closedDates, windows),
    [closedDates, minMinutes, windows]
  )
  const safeSelectedDayIdx = days.length === 0 ? 0 : Math.min(selectedDayIdx, days.length - 1)
  const isClosedToday = isSaudiDateClosed(new Date(), closedDates)
  const isOpen = isSaudiStoreOpenForOrders(new Date(), closedDates, windows)
  const activeWindow = windows.find((w) => {
    const hour = new Date().getUTCHours() + 3 // rough Saudi hour for display purposes only
    return hour >= w.openHour && hour < w.closeHour
  })
  const hoursText = [...windows]
    .sort((a, b) => a.openHour - b.openHour)
    .map((w) => `${w.openHour > 12 ? w.openHour - 12 : w.openHour}${w.openHour >= 12 ? "م" : "ص"}-${w.closeHour > 12 ? w.closeHour - 12 : w.closeHour}${w.closeHour >= 12 ? "م" : "ص"}`)
    .join("، ")

  useEffect(() => {
    if (openSignal <= 0) return
    setOpen(true)
  }, [openSignal])

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    const previousTouchAction = document.body.style.touchAction
    const previousFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : triggerRef.current

    document.body.style.overflow = "hidden"
    document.body.style.touchAction = "none"

    const focusTimeout = window.setTimeout(() => {
      closeButtonRef.current?.focus()
    }, 0)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.clearTimeout(focusTimeout)
      window.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = previousOverflow
      document.body.style.touchAction = previousTouchAction
      previousFocused?.focus()
    }
  }, [open])

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
        ref={triggerRef}
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
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="time-picker-dialog"
        tabIndex={hideTrigger ? -1 : undefined}
        aria-hidden={hideTrigger || undefined}
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
          {isOpen && activeWindow
            ? `متاح الآن (${activeWindow.label}) - نغلق ${activeWindow.closeHour > 12 ? activeWindow.closeHour - 12 : activeWindow.closeHour}:00 ${activeWindow.closeHour >= 12 ? "م" : "ص"}`
            : isClosedToday
            ? "اليوم مغلق لاستقبال الطلبات"
            : `ساعات العمل: ${hoursText}`}
        </div>
      )}

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-[200]" dir="rtl">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div
            id="time-picker-dialog"
            ref={dialogRef}
            className="absolute bottom-0 left-0 right-0 flex max-h-[min(85vh,42rem)] flex-col rounded-t-3xl bg-white"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="time-picker-title"
            tabIndex={-1}
            onKeyDown={(event) => trapFocusOnTab(event, dialogRef.current)}
          >

            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-4 border-b border-gray-100">
              <button
                ref={closeButtonRef}
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                aria-label="إغلاق اختيار الموعد"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <div className="text-right">
                <h3 id="time-picker-title" className="font-bold text-lg">اختر الموعد</h3>
                <p className="text-xs text-gray-400">ساعات العمل {hoursText}</p>
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
