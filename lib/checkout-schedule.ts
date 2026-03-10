export interface DeliveryDaySlots {
  date: string
  dayLabel: string
  dateLabel: string
  slots: string[]
  isToday: boolean
}

export const OPEN_HOUR = 15
export const CLOSE_HOUR = 22
export const BOOKING_WINDOW_DAYS = 30

const SAUDI_OFFSET_MS = 3 * 60 * 60 * 1000
const SLOT_MINUTES = [0, 30] as const
const DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
const MONTH_NAMES = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]

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

function getSaudiNowParts(date = new Date()): SaudiNowParts {
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

function getSaudiDayDate(base: SaudiNowParts, dayOffset: number): Date {
  return new Date(Date.UTC(base.year, base.monthIndex, base.day + dayOffset, 9, 0, 0, 0))
}

function getDayLabel(dayOffset: number, weekdayIndex: number): string {
  if (dayOffset === 0) return "اليوم"
  if (dayOffset === 1) return "غدًا"
  return DAY_NAMES[weekdayIndex]
}

function getDateLabel(dayDate: Date): string {
  return `${dayDate.getUTCDate()} ${MONTH_NAMES[dayDate.getUTCMonth()]}`
}

function formatSlot(hour: number, minute: number): string {
  const h12 = hour > 12 ? hour - 12 : hour
  const period = hour >= 12 ? "م" : "ص"
  return `${h12}:${minute === 0 ? "00" : "30"} ${period}`
}

export function isSaudiStoreOpen(date = new Date()): boolean {
  const { hour } = getSaudiNowParts(date)
  return hour >= OPEN_HOUR && hour < CLOSE_HOUR
}

export function getSaudiDateKey(date = new Date()): string {
  const { year, monthIndex, day } = getSaudiNowParts(date)
  return formatDateKey(year, monthIndex, day)
}

export function isSaudiDateClosed(date = new Date(), closedDates: string[] = []): boolean {
  const todayKey = getSaudiDateKey(date)
  return new Set(closedDates).has(todayKey)
}

export function isSaudiStoreOpenForOrders(date = new Date(), closedDates: string[] = []): boolean {
  if (isSaudiDateClosed(date, closedDates)) return false
  return isSaudiStoreOpen(date)
}

export function generateDeliveryDaySlots(minMinutes: number, closedDates: string[] = []): DeliveryDaySlots[] {
  const result: DeliveryDaySlots[] = []
  const base = getSaudiNowParts()
  const earliest = new Date(Date.now() + (minMinutes + 45) * 60 * 1000)
  const closedDatesSet = new Set(closedDates)

  for (let dayOffset = 0; dayOffset < BOOKING_WINDOW_DAYS; dayOffset++) {
    const dateKey = formatDateKey(base.year, base.monthIndex, base.day + dayOffset)
    if (closedDatesSet.has(dateKey)) continue

    const slots: string[] = []

    for (let hour = OPEN_HOUR; hour < CLOSE_HOUR; hour++) {
      for (const minute of SLOT_MINUTES) {
        const slotInstant = buildSaudiInstant(base, dayOffset, hour, minute)
        if (slotInstant.getTime() <= earliest.getTime()) continue
        slots.push(formatSlot(hour, minute))
      }
    }

    if (slots.length === 0) continue

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

export function getEarliestDeliverySlotLabel(minMinutes: number, closedDates: string[] = []): string | null {
  const firstDay = generateDeliveryDaySlots(minMinutes, closedDates)[0]
  if (!firstDay || firstDay.slots.length === 0) return null
  return `${firstDay.dayLabel} ${firstDay.dateLabel} - ${firstDay.slots[0]}`
}
