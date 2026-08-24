import { DEFAULT_SERVICE_WINDOWS, type ServiceWindow } from "@/lib/order-schedule-config"

export interface DeliveryDaySlots {
  date: string
  dayLabel: string
  dateLabel: string
  slots: string[]
  isToday: boolean
}

// Kept for backward compatibility with any existing imports/tests - these now
// only describe the default lunch/dinner window, not the whole schedule.
// Prefer passing `windows` (from OrderScheduleConfig) explicitly instead.
export const OPEN_HOUR = 15
export const CLOSE_HOUR = 22
export const BOOKING_WINDOW_DAYS = 30

const SAUDI_OFFSET_MS = 3 * 60 * 60 * 1000
const SLOT_MINUTES = [0, 30] as const
export const DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
export const MONTH_NAMES = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]

interface SaudiNowParts {
  year: number
  monthIndex: number
  day: number
  hour: number
}

function formatDateKey(year: number, monthIndex: number, day: number): string {
  const date = new Date(Date.UTC(year, monthIndex, day, 9, 0, 0, 0))
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-")
}

function getSaudiClock(date = new Date()): Date {
  return new Date(date.getTime() + SAUDI_OFFSET_MS)
}

export function getSaudiNowParts(date = new Date()): SaudiNowParts {
  const saudiClock = getSaudiClock(date)
  return {
    year: saudiClock.getUTCFullYear(),
    monthIndex: saudiClock.getUTCMonth(),
    day: saudiClock.getUTCDate(),
    hour: saudiClock.getUTCHours(),
  }
}

function buildSaudiInstant(base: SaudiNowParts, dayOffset: number, hour: number, minute: number): Date {
  return new Date(Date.UTC(base.year, base.monthIndex, base.day + dayOffset, hour - 3, minute, 0, 0))
}

export function getSaudiDayDate(base: SaudiNowParts, dayOffset: number): Date {
  return new Date(Date.UTC(base.year, base.monthIndex, base.day + dayOffset, 9, 0, 0, 0))
}

export function getDayLabel(dayOffset: number, weekdayIndex: number): string {
  if (dayOffset === 0) return "اليوم"
  if (dayOffset === 1) return "غدًا"
  return DAY_NAMES[weekdayIndex]
}

export function getDateLabel(dayDate: Date): string {
  return `${dayDate.getUTCDate()} ${MONTH_NAMES[dayDate.getUTCMonth()]}`
}

function formatSlot(hour: number, minute: number): string {
  const h12 = hour > 12 ? hour - 12 : hour
  const period = hour >= 12 ? "م" : "ص"
  return `${h12}:${minute === 0 ? "00" : "30"} ${period}`
}

function formatArabicDurationPart(value: number, singular: string, dual: string, plural: string): string {
  if (value <= 0) return ""
  if (value === 1) return singular
  if (value === 2) return dual
  return `${value} ${plural}`
}

export function formatArabicDuration(totalMinutes: number): string {
  if (totalMinutes <= 0) return "0 دقيقة"

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const parts = [
    formatArabicDurationPart(hours, "ساعة", "ساعتين", "ساعات"),
    formatArabicDurationPart(minutes, "دقيقة", "دقيقتين", "دقائق"),
  ].filter(Boolean)

  return parts.join(" و ")
}

/** True if `hour` (Saudi time) falls inside any of the given service windows. */
export function isSaudiStoreOpen(date = new Date(), windows: ServiceWindow[] = DEFAULT_SERVICE_WINDOWS): boolean {
  const { hour } = getSaudiNowParts(date)
  return windows.some((w) => hour >= w.openHour && hour < w.closeHour)
}

export function getSaudiDateKey(date = new Date()): string {
  const { year, monthIndex, day } = getSaudiNowParts(date)
  return formatDateKey(year, monthIndex, day)
}

export function isSaudiDateClosed(date = new Date(), closedDates: string[] = []): boolean {
  const todayKey = getSaudiDateKey(date)
  return new Set(closedDates).has(todayKey)
}

export function isSaudiStoreOpenForOrders(
  date = new Date(),
  closedDates: string[] = [],
  windows: ServiceWindow[] = DEFAULT_SERVICE_WINDOWS
): boolean {
  if (isSaudiDateClosed(date, closedDates)) return false
  return isSaudiStoreOpen(date, windows)
}

/** Whether a given (dayOffset, hour, minute) slot in `window` is still bookable right now. */
function isSlotBookable(
  base: SaudiNowParts,
  dayOffset: number,
  hour: number,
  minute: number,
  window: ServiceWindow,
  minMinutes: number,
  now: Date
): boolean {
  const slotInstant = buildSaudiInstant(base, dayOffset, hour, minute)

  if (window.cutoff.type === "leadMinutes") {
    // Kitchen making-time and the window's buffer stack, same as the original
    // single-window behavior (now + minMinutes + cutoff.minutes).
    const earliest = new Date(now.getTime() + (minMinutes + window.cutoff.minutes) * 60 * 1000)
    return slotInstant.getTime() > earliest.getTime()
  }

  // "nightBefore": order must be placed by `cutoff.hour` Saudi time on the
  // overnight stretch before delivery, and still needs at least the making-time.
  // A late-evening hour (e.g. 21 = 9pm) falls on the day before delivery
  // (dayOffset - 1); an early-morning hour (e.g. 1 = 1am) is past midnight, so
  // it falls on delivery day itself (dayOffset) even though it's still "the
  // night before" in the everyday sense.
  const minPrepInstant = new Date(now.getTime() + minMinutes * 60 * 1000)
  if (slotInstant.getTime() <= minPrepInstant.getTime()) return false

  const cutoffDayOffset = window.cutoff.hour < 12 ? dayOffset : dayOffset - 1
  const cutoffInstant = buildSaudiInstant(base, cutoffDayOffset, window.cutoff.hour, 0)
  return now.getTime() <= cutoffInstant.getTime()
}

export function generateDeliveryDaySlots(
  minMinutes: number,
  closedDates: string[] = [],
  windows: ServiceWindow[] = DEFAULT_SERVICE_WINDOWS
): DeliveryDaySlots[] {
  const result: DeliveryDaySlots[] = []
  const base = getSaudiNowParts()
  const now = new Date()
  const closedDatesSet = new Set(closedDates)

  for (let dayOffset = 0; dayOffset < BOOKING_WINDOW_DAYS; dayOffset++) {
    const dateKey = formatDateKey(base.year, base.monthIndex, base.day + dayOffset)
    if (closedDatesSet.has(dateKey)) continue

    // Collect (hour, minute) across all windows first so we can dedupe + sort
    // before formatting - windows may be defined out of chronological order.
    const slotTimes = new Map<number, { hour: number; minute: number }>()

    for (const window of windows) {
      for (let hour = window.openHour; hour < window.closeHour; hour++) {
        for (const minute of SLOT_MINUTES) {
          if (!isSlotBookable(base, dayOffset, hour, minute, window, minMinutes, now)) continue
          slotTimes.set(hour * 60 + minute, { hour, minute })
        }
      }
    }

    if (slotTimes.size === 0) continue

    const slots = Array.from(slotTimes.keys())
      .sort((a, b) => a - b)
      .map((key) => {
        const { hour, minute } = slotTimes.get(key)!
        return formatSlot(hour, minute)
      })

    const dayDate = getSaudiDayDate(base, dayOffset)
    const dayLabel = getDayLabel(dayOffset, dayDate.getUTCDay())
    const dateLabel = getDateLabel(dayDate)

    result.push({
      date: `${dayLabel} ${dateLabel}`,
      dayLabel,
      dateLabel,
      slots,
      isToday: dayOffset === 0,
    })
  }

  return result
}

export function getEarliestDeliverySlotLabel(
  minMinutes: number,
  closedDates: string[] = [],
  windows: ServiceWindow[] = DEFAULT_SERVICE_WINDOWS
): string | null {
  const firstDay = generateDeliveryDaySlots(minMinutes, closedDates, windows)[0]
  if (!firstDay || firstDay.slots.length === 0) return null
  return `${firstDay.dayLabel} ${firstDay.dateLabel} - ${firstDay.slots[0]}`
}
