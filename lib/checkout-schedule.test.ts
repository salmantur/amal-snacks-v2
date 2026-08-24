import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  CLOSE_HOUR,
  DAY_NAMES,
  OPEN_HOUR,
  formatArabicDuration,
  generateDeliveryDaySlots,
  getDateLabel,
  getDayLabel,
  getEarliestDeliverySlotLabel,
  getSaudiDateKey,
  getSaudiDayDate,
  getSaudiNowParts,
  isSaudiDateClosed,
  isSaudiStoreOpen,
  isSaudiStoreOpenForOrders,
} from "@/lib/checkout-schedule"

describe("getSaudiNowParts", () => {
  it("converts a UTC instant to Saudi (UTC+3) wall-clock parts, including a day rollover", () => {
    // 21:30 UTC on Jan 1 -> 00:30 Saudi time on Jan 2.
    const date = new Date(Date.UTC(2026, 0, 1, 21, 30, 0))
    expect(getSaudiNowParts(date)).toEqual({ year: 2026, monthIndex: 0, day: 2, hour: 0 })
  })
})

describe("getDayLabel", () => {
  it("labels today and tomorrow specially, otherwise uses the weekday name", () => {
    expect(getDayLabel(0, 3)).toBe("اليوم")
    expect(getDayLabel(1, 4)).toBe("غدًا")
    expect(getDayLabel(2, 5)).toBe(DAY_NAMES[5])
  })
})

describe("getDateLabel", () => {
  it("formats a UTC date as '<day> <Arabic month>'", () => {
    const date = new Date(Date.UTC(2026, 0, 5, 9, 0, 0))
    expect(getDateLabel(date)).toBe("5 يناير")
  })
})

describe("formatArabicDuration", () => {
  it("returns the zero-duration label", () => {
    expect(formatArabicDuration(0)).toBe("0 دقيقة")
    expect(formatArabicDuration(-5)).toBe("0 دقيقة")
  })

  it("uses singular/dual/plural forms for minutes only", () => {
    expect(formatArabicDuration(1)).toBe("دقيقة")
    expect(formatArabicDuration(2)).toBe("دقيقتين")
    expect(formatArabicDuration(5)).toBe("5 دقائق")
  })

  it("uses singular/dual forms for whole hours", () => {
    expect(formatArabicDuration(60)).toBe("ساعة")
    expect(formatArabicDuration(120)).toBe("ساعتين")
    expect(formatArabicDuration(180)).toBe("3 ساعات")
  })

  it("joins hours and minutes with 'و' when both are present", () => {
    expect(formatArabicDuration(90)).toBe("ساعة و 30 دقائق")
    expect(formatArabicDuration(150)).toBe("ساعتين و 30 دقائق")
  })
})

describe("isSaudiStoreOpen", () => {
  it("is closed just before OPEN_HOUR and open exactly at OPEN_HOUR (Saudi time)", () => {
    const justBeforeOpen = new Date(Date.UTC(2026, 0, 1, OPEN_HOUR - 4, 59, 0))
    const atOpen = new Date(Date.UTC(2026, 0, 1, OPEN_HOUR - 3, 0, 0))
    expect(isSaudiStoreOpen(justBeforeOpen)).toBe(false)
    expect(isSaudiStoreOpen(atOpen)).toBe(true)
  })

  it("is open just before CLOSE_HOUR and closed exactly at CLOSE_HOUR (Saudi time)", () => {
    const justBeforeClose = new Date(Date.UTC(2026, 0, 1, CLOSE_HOUR - 4, 59, 0))
    const atClose = new Date(Date.UTC(2026, 0, 1, CLOSE_HOUR - 3, 0, 0))
    expect(isSaudiStoreOpen(justBeforeClose)).toBe(true)
    expect(isSaudiStoreOpen(atClose)).toBe(false)
  })
})

describe("getSaudiDateKey / isSaudiDateClosed / isSaudiStoreOpenForOrders", () => {
  it("keys by the Saudi calendar day, not the UTC day", () => {
    const date = new Date(Date.UTC(2026, 0, 1, 22, 0, 0)) // Saudi: Jan 2, 01:00
    expect(getSaudiDateKey(date)).toBe("2026-01-02")
  })

  it("treats a date in the closedDates set as closed", () => {
    const date = new Date(Date.UTC(2026, 0, 1, 12, 0, 0)) // Saudi: Jan 1, 15:00 (open hour)
    expect(isSaudiDateClosed(date, ["2026-01-01"])).toBe(true)
    expect(isSaudiStoreOpenForOrders(date, ["2026-01-01"])).toBe(false)
  })

  it("is open for orders on an open hour that isn't a closed date", () => {
    const date = new Date(Date.UTC(2026, 0, 1, 12, 0, 0)) // Saudi: Jan 1, 15:00
    expect(isSaudiStoreOpenForOrders(date, ["2026-02-01"])).toBe(true)
  })
})

describe("generateDeliveryDaySlots", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("includes the full open-to-close slot list for today when well before opening", () => {
    // Saudi time 08:00 on Jan 1 - well before the 15:00 open hour.
    vi.setSystemTime(new Date(Date.UTC(2026, 0, 1, 5, 0, 0)))

    const days = generateDeliveryDaySlots(0)
    const today = days[0]

    expect(today.isToday).toBe(true)
    expect(today.dayLabel).toBe("اليوم")
    expect(today.slots[0]).toBe("3:00 م") // 15:00 Saudi
    expect(today.slots).toHaveLength((CLOSE_HOUR - OPEN_HOUR) * 2)
  })

  it("excludes slots that fall before the minimum-lead-time cutoff", () => {
    // Saudi time 12:00 on Jan 1.
    vi.setSystemTime(new Date(Date.UTC(2026, 0, 1, 9, 0, 0)))

    // earliest = now + (200 + 45) minutes = 12:00 + 4h05m = Saudi 16:05.
    const days = generateDeliveryDaySlots(200)
    const today = days[0]

    // 16:00 is before the cutoff, 16:30 is the first slot at/after it.
    expect(today.slots[0]).toBe("4:30 م")
  })

  it("skips a day entirely when it's in closedDates", () => {
    vi.setSystemTime(new Date(Date.UTC(2026, 0, 1, 5, 0, 0)))

    const days = generateDeliveryDaySlots(0, ["2026-01-01"])
    expect(days.find((d) => d.isToday)).toBeUndefined()
    expect(days[0].dayLabel).toBe("غدًا")
  })

  it("excludes today entirely once the lead-time cutoff pushes past closing time", () => {
    vi.setSystemTime(new Date(Date.UTC(2026, 0, 1, 5, 0, 0)))

    // minMinutes large enough that (now + minMinutes + 45) is after 22:00 Saudi today.
    const days = generateDeliveryDaySlots(24 * 60)
    expect(days.find((d) => d.isToday)).toBeUndefined()
  })
})

describe("generateDeliveryDaySlots with multiple windows", () => {
  const windows = [
    { id: "breakfast", label: "فطور", openHour: 8, closeHour: 11, cutoff: { type: "nightBefore" as const, hour: 21 } },
    { id: "lunch-dinner", label: "غداء وعشاء", openHour: 15, closeHour: 22, cutoff: { type: "leadMinutes" as const, minutes: 45 } },
  ]

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("excludes today's breakfast slots once the night-before cutoff has passed", () => {
    // Saudi 08:00 on Jan 1 - the 21:00 cutoff for TODAY's breakfast was Dec 31 21:00, already past.
    vi.setSystemTime(new Date(Date.UTC(2026, 0, 1, 5, 0, 0)))
    const today = generateDeliveryDaySlots(0, [], windows)[0]
    expect(today.slots[0]).toBe("3:00 م") // first slot is dinner, not breakfast
  })

  it("includes tomorrow's breakfast slots when ordered before the night-before cutoff", () => {
    // Saudi 12:00 on Jan 1 - before the 21:00 cutoff for tomorrow's (Jan 2) breakfast.
    vi.setSystemTime(new Date(Date.UTC(2026, 0, 1, 9, 0, 0)))
    const tomorrow = generateDeliveryDaySlots(0, [], windows).find((d) => d.dayLabel === "غدًا")
    expect(tomorrow?.slots[0]).toBe("8:00 ص")
  })

  it("excludes tomorrow's breakfast once the night-before cutoff for it has passed", () => {
    // Saudi 22:00 on Jan 1 - after the 21:00 cutoff for tomorrow's (Jan 2) breakfast.
    vi.setSystemTime(new Date(Date.UTC(2026, 0, 1, 19, 0, 0)))
    const tomorrow = generateDeliveryDaySlots(0, [], windows).find((d) => d.dayLabel === "غدًا")
    // Breakfast is gone, so the first slot for tomorrow is dinner.
    expect(tomorrow?.slots[0]).toBe("3:00 م")
  })
})

describe("getEarliestDeliverySlotLabel", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(Date.UTC(2026, 0, 1, 5, 0, 0)))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns a label combining the day and the first available slot", () => {
    const label = getEarliestDeliverySlotLabel(0)
    expect(label).toBe("اليوم 1 يناير - 3:00 م")
  })

  it("returns null when no slot exists within the whole booking window", () => {
    // Push the cutoff far beyond the entire 30-day booking window.
    const label = getEarliestDeliverySlotLabel(60 * 24 * 365)
    expect(label).toBeNull()
  })
})

describe("getSaudiDayDate", () => {
  it("adds the day offset to the base date", () => {
    const base = getSaudiNowParts(new Date(Date.UTC(2026, 0, 1, 5, 0, 0)))
    const dayDate = getSaudiDayDate(base, 3)
    expect(dayDate.getUTCDate()).toBe(4)
  })
})
