import { describe, expect, it } from "vitest"
import { DEFAULT_ORDER_SCHEDULE_CONFIG, DEFAULT_SERVICE_WINDOWS, normalizeOrderScheduleConfig } from "@/lib/order-schedule-config"

describe("normalizeOrderScheduleConfig", () => {
  it("returns the default config for non-object input", () => {
    expect(normalizeOrderScheduleConfig(null)).toEqual(DEFAULT_ORDER_SCHEDULE_CONFIG)
    expect(normalizeOrderScheduleConfig("nope")).toEqual(DEFAULT_ORDER_SCHEDULE_CONFIG)
  })

  it("defaults to an empty list when closedDates isn't an array", () => {
    expect(normalizeOrderScheduleConfig({ closedDates: "2026-01-01" })).toEqual({
      closedDates: [],
      windows: DEFAULT_SERVICE_WINDOWS,
    })
  })

  it("falls back to the default windows when none are stored (older configs)", () => {
    const result = normalizeOrderScheduleConfig({ closedDates: [] })
    expect(result.windows).toEqual(DEFAULT_SERVICE_WINDOWS)
  })

  it("keeps a custom window set when provided and well-formed", () => {
    const customWindows = [
      { id: "lunch-dinner", label: "غداء وعشاء", openHour: 15, closeHour: 22, cutoff: { type: "leadMinutes" as const, minutes: 45 } },
    ]
    const result = normalizeOrderScheduleConfig({ closedDates: [], windows: customWindows })
    expect(result.windows).toEqual(customWindows)
  })

  it("drops a malformed window (e.g. closeHour <= openHour) and falls back to defaults if none remain", () => {
    const result = normalizeOrderScheduleConfig({
      closedDates: [],
      windows: [{ id: "bad", label: "bad", openHour: 10, closeHour: 5, cutoff: { type: "leadMinutes", minutes: 10 } }],
    })
    expect(result.windows).toEqual(DEFAULT_SERVICE_WINDOWS)
  })

  it("keeps only well-formed ISO date strings", () => {
    const result = normalizeOrderScheduleConfig({
      closedDates: ["2026-01-01", "not-a-date", "2026-13-99", "", null, 42, "2026-1-1"],
    })
    // "2026-13-99" passes the regex shape check even though it's not a real date -
    // the function only validates format, not calendar validity.
    expect(result.closedDates).toEqual(["2026-01-01", "2026-13-99"])
  })

  it("deduplicates repeated dates", () => {
    const result = normalizeOrderScheduleConfig({ closedDates: ["2026-01-01", "2026-01-01"] })
    expect(result.closedDates).toEqual(["2026-01-01"])
  })

  it("sorts the resulting dates ascending", () => {
    const result = normalizeOrderScheduleConfig({ closedDates: ["2026-03-01", "2026-01-01", "2026-02-01"] })
    expect(result.closedDates).toEqual(["2026-01-01", "2026-02-01", "2026-03-01"])
  })

  it("trims whitespace before validating", () => {
    const result = normalizeOrderScheduleConfig({ closedDates: ["  2026-01-01  "] })
    expect(result.closedDates).toEqual(["2026-01-01"])
  })
})
