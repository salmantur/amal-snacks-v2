"use client"

import { useState } from "react"
import { Clock, ChevronDown } from "lucide-react"
import { getAvailableTimeSlots } from "@/lib/data"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface TimePickerProps {
  value: string | null
  onChange: (value: string | null) => void
  minMinutes?: number
  required?: boolean  // if true, hides "أقرب وقت" option
}

export function TimePicker({ value, onChange, minMinutes = 0, required = false }: TimePickerProps) {
  const [open, setOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState(0)
  const timeSlots = getAvailableTimeSlots(minMinutes)

  const handleSelectTime = (time: string, dayIndex: number) => {
    const day = timeSlots[dayIndex]
    onChange(`${day.date} - ${time}`)
    setOpen(false)
  }

  const handleSelectNow = () => {
    onChange(null)
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="w-full flex items-center justify-between p-4 bg-amal-grey rounded-2xl hover:bg-amal-grey/80 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amal-yellow-light flex items-center justify-center">
              <Clock className="h-5 w-5 text-foreground" />
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">وقت التوصيل</p>
              <p className="font-medium text-foreground">
                {value || "في أقرب وقت"}
              </p>
            </div>
          </div>
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl">اختر وقت التوصيل</SheetTitle>
        </SheetHeader>

        {!required && <button
          onClick={handleSelectNow}
          className={cn(
            "w-full p-4 rounded-2xl mb-4 text-right transition-colors",
            !value
              ? "bg-primary text-primary-foreground"
              : "bg-amal-grey hover:bg-amal-grey/80"
          )}
        >
          <p className="font-medium">في أقرب وقت ممكن</p>
          <p className="text-sm opacity-80">
              {minMinutes > 0
                ? `وقت التحضير ${minMinutes >= 60 ? `${Math.floor(minMinutes/60)} ساعة${minMinutes % 60 > 0 ? ` و${minMinutes % 60} دقيقة` : ""}` : `${minMinutes} دقيقة`}`
                : "سيتم توصيل طلبك خلال 30-60 دقيقة"}
            </p>
        </button>}

        {/* Day selector */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
          {timeSlots.map((day, index) => (
            <button
              key={day.date}
              onClick={() => setSelectedDay(index)}
              className={cn(
                "px-4 py-2 rounded-full whitespace-nowrap text-sm transition-colors",
                selectedDay === index
                  ? "bg-foreground text-background"
                  : "bg-amal-grey hover:bg-amal-grey/80"
              )}
            >
              {day.date}
            </button>
          ))}
        </div>

        {/* Time slots */}
        <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[40vh]">
          {timeSlots[selectedDay]?.slots.map((time) => (
            <button
              key={time}
              onClick={() => handleSelectTime(time, selectedDay)}
              className={cn(
                "py-3 rounded-xl text-sm font-medium transition-colors",
                value?.includes(time) && value?.includes(timeSlots[selectedDay].date)
                  ? "bg-primary text-primary-foreground"
                  : "bg-amal-grey hover:bg-amal-grey/80"
              )}
            >
              {time}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}