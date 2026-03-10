"use client"

export interface OrderScheduleConfig {
  closedDates: string[]
}

export const DEFAULT_ORDER_SCHEDULE_CONFIG: OrderScheduleConfig = {
  closedDates: [],
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function normalizeOrderScheduleConfig(raw: unknown): OrderScheduleConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_ORDER_SCHEDULE_CONFIG

  const data = raw as Partial<OrderScheduleConfig>
  const closedDates = Array.isArray(data.closedDates)
    ? Array.from(
        new Set(
          data.closedDates
            .map((value) => String(value).trim())
            .filter((value) => ISO_DATE_PATTERN.test(value))
        )
      ).sort()
    : []

  return {
    closedDates,
  }
}
