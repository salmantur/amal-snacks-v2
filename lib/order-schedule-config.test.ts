import { describe, expect, it } from "vitest"
import { DEFAULT_ORDER_SCHEDULE_CONFIG, normalizeOrderScheduleConfig } from "@/lib/order-schedule-config"

describe("normalizeOrderScheduleConfig", () => {
  it("returns the default config for non-object input", () => {
    expect(normalizeOrderScheduleConfig(null)).toEqual(DEFAULT_ORDER_SCHEDULE_CONFIG)
    expect(normalizeOrderScheduleConfig("nope")).toEqual(DEFAULT_ORDER_SCHEDULE_CONFIG)
  })

  it("defaults to an empty list when closedDates isn't an array", () => {
    expect(normalizeOrderScheduleConfig({ closedDates: "2026-01-01" })).toEqual({ closedDates: [] })
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
