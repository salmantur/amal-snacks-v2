"use client"

import { useState, useMemo } from "react"
import { Clock, ChevronDown, ChevronLeft, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"

interface TimePickerProps {
  value: string | null
  onChange: (value: string | null) => void
  minMinutes?: number
  required?: boolean
}

// Working hours: 3pmâ€“10pm (15:00â€“22:00), 7 days a week
const OPEN_HOUR = 15
const CLOSE_HOUR = 22

function generateSlots(minMinutes: number): { date: string; dayLabel: string; dateLabel: string; slots: string[]; isToday: boolean }[] {
  const result = []
  const now = new Date()
  // Saudi time offset (UTC+3)
  const saudiNow = new Date(now.getTime() + (3 * 60 - now.getTimezoneOffset()) * 60000)
  const earliest = new Date(saudiNow.getTime() + (minMinutes + 45) * 60 * 1000)

  const dayNames = ["Ø§Ù„Ø£Ø­Ø¯", "Ø§Ù„Ø¥Ø«Ù†ÙŠÙ†", "Ø§Ù„Ø«Ù„Ø§Ø«Ø§Ø¡", "Ø§Ù„Ø£Ø±Ø¨Ø¹Ø§Ø¡", "Ø§Ù„Ø®Ù…ÙŠØ³", "Ø§Ù„Ø¬Ù…Ø¹Ø©", "Ø§Ù„Ø³Ø¨Øª"]
  const monthNames = ["ÙŠÙ†Ø§ÙŠØ±","ÙØ¨Ø±Ø§ÙŠØ±","Ù…Ø§Ø±Ø³","Ø£Ø¨Ø±ÙŠÙ„","Ù…Ø§ÙŠÙˆ","ÙŠÙˆÙ†ÙŠÙˆ","ÙŠÙˆÙ„ÙŠÙˆ","Ø£ØºØ³Ø·Ø³","Ø³Ø¨ØªÙ…Ø¨Ø±","Ø£ÙƒØªÙˆØ¨Ø±","Ù†ÙˆÙÙ…Ø¨Ø±","Ø¯ÙŠØ³Ù…Ø¨Ø±"]

  for (let i = 0; i < 7; i++) {
    const day = new Date(saudiNow)
    day.setDate(saudiNow.getDate() + i)

    const slots: string[] = []
    for (let hour = OPEN_HOUR; hour < CLOSE_HOUR; hour++) {
      for (const min of [0, 30]) {
        const slotTime = new Date(day)
        slotTime.setHours(hour, min, 0, 0)
        if (slotTime > earliest) {
          const h12 = hour > 12 ? hour - 12 : hour
          const period = hour >= 12 ? "Ù…" : "Øµ"
          const minStr = min === 0 ? ":00" : ":30"
          slots.push(`${h12}${minStr} ${period}`)
        }
      }
    }

    if (slots.length > 0) {
      const isToday = i === 0
      const isTomorrow = i === 1
      const dayLabel = isToday ? "Ø§Ù„ÙŠÙˆÙ…" : isTomorrow ? "ØºØ¯Ø§Ù‹" : dayNames[day.getDay()]
      const dateLabel = `${day.getDate()} ${monthNames[day.getMonth()]}`
      result.push({
        date: `${dayLabel} ${dateLabel}`,
        dayLabel,
        dateLabel,
        slots,
        isToday,
      })
    }
  }
  return result
}

export function TimePicker({ value, onChange, minMinutes = 0, required = false }: TimePickerProps) {
  const [open, setOpen] = useState(false)
  const [selectedDayIdx, setSelectedDayIdx] = useState(0)

  const days = useMemo(() => generateSlots(minMinutes), [minMinutes])

  // Check if currently in working hours
  const now = new Date()
  const saudiHour = (now.getUTCHours() + 3) % 24
  const isOpen = saudiHour >= OPEN_HOUR && saudiHour < CLOSE_HOUR

  const handleSelect = (slot: string) => {
    const day = days[selectedDayIdx]
    onChange(`${day.dayLabel} ${day.dateLabel} - ${slot}`)
    setOpen(false)
  }

  const handleAsap = () => {
    onChange(null)
    setOpen(false)
  }

  const displayValue = value
    ? value
    : required
    ? "Ø§Ø®ØªØ± Ù…ÙˆØ¹Ø¯"
    : isOpen
    ? "Ø£Ù‚Ø±Ø¨ ÙˆÙ‚Øª Ù…Ù…ÙƒÙ†"
    : "Ù„Ø§ ÙŠÙˆØ¬Ø¯ ØªÙˆØµÙŠÙ„ Ø§Ù„Ø¢Ù† â€” Ø§Ø®ØªØ± Ù…ÙˆØ¹Ø¯Ø§Ù‹"

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
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            value ? "bg-primary text-primary-foreground" : "bg-white"
          )}>
            <Clock className="h-5 w-5" />
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-0.5">{required ? "ÙˆÙ‚Øª Ø§Ù„Ø§Ø³ØªÙ„Ø§Ù…" : "Ù…ÙˆØ¹Ø¯ Ø§Ù„ØªÙˆØµÙŠÙ„"}</p>
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
          isOpen ? "text-green-600" : "text-orange-500"
        )}>
          <span className={cn("w-1.5 h-1.5 rounded-full", isOpen ? "bg-green-500" : "bg-orange-400")} />
          {isOpen
            ? `Ù…ØªØ§Ø­ Ø§Ù„Ø¢Ù† Â· Ù†ØºÙ„Ù‚ ${CLOSE_HOUR - 12}:00 Ù…`
            : `Ù†ÙØªØ­ Ø§Ù„Ø³Ø§Ø¹Ø© ${OPEN_HOUR - 12}:00 Ù…`}
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
                <h3 className="font-bold text-lg">Ø§Ø®ØªØ± Ø§Ù„Ù…ÙˆØ¹Ø¯</h3>
                <p className="text-xs text-gray-400">Ø³Ø§Ø¹Ø§Øª Ø§Ù„Ø¹Ù…Ù„ {OPEN_HOUR - 12}:00 Ù… â€“ {CLOSE_HOUR - 12}:00 Ù…</p>
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
                    {!value ? "âœ“ Ù…Ø­Ø¯Ø¯" : "Ø¬Ø§Ù‡Ø²"}
                  </div>
                  <div>
                    <p className="font-bold">ÙÙŠ Ø£Ù‚Ø±Ø¨ ÙˆÙ‚Øª Ù…Ù…ÙƒÙ†</p>
                    <p className={cn("text-xs mt-0.5", !value ? "opacity-80" : "text-gray-500")}>
                      {minMinutes > 0
                        ? `ÙˆÙ‚Øª Ø§Ù„ØªØ­Ø¶ÙŠØ± ~${minMinutes >= 60 ? `${Math.floor(minMinutes / 60)} Ø³Ø§Ø¹Ø©` : `${minMinutes} Ø¯Ù‚ÙŠÙ‚Ø©`} + Ø§Ù„ØªÙˆØµÙŠÙ„`
                        : "Ø®Ù„Ø§Ù„ 30â€“60 Ø¯Ù‚ÙŠÙ‚Ø© ØªÙ‚Ø±ÙŠØ¨Ø§Ù‹"}
                    </p>
                  </div>
                </button>
              )}

              {/* Day tabs */}
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {days.map((day, idx) => (
                  <button
                    key={day.date}
                    onClick={() => setSelectedDayIdx(idx)}
                    className={cn(
                      "flex-shrink-0 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all",
                      selectedDayIdx === idx
                        ? "bg-[#1e293b] text-white"
                        : "bg-[#f5f5f5] text-gray-600"
                    )}
                  >
                    <span className="block">{day.dayLabel}</span>
                    <span className={cn("block text-xs mt-0.5 font-normal", selectedDayIdx === idx ? "opacity-70" : "text-gray-400")}>
                      {day.dateLabel}
                    </span>
                  </button>
                ))}
              </div>

              {/* Time grid */}
              <div>
                <p className="text-xs text-gray-400 mb-3 font-medium">
                  {days[selectedDayIdx]?.slots.length} Ù…ÙˆØ¹Ø¯ Ù…ØªØ§Ø­
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {days[selectedDayIdx]?.slots.map((slot) => {
                    const isSelected = value?.includes(slot) && value?.includes(days[selectedDayIdx].dayLabel)
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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
