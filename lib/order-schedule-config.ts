export type ScheduleCutoff =
  // Slot must be at least `minutes` (plus kitchen making-time) ahead of now.
  | { type: "leadMinutes"; minutes: number }
  // Slot must be ordered by `hour` (0-23, Saudi time) on the day BEFORE delivery.
  | { type: "nightBefore"; hour: number }

export interface ServiceWindow {
  id: string
  label: string
  openHour: number
  closeHour: number
  cutoff: ScheduleCutoff
}

export interface OrderScheduleConfig {
  closedDates: string[]
  windows: ServiceWindow[]
}

export const DEFAULT_SERVICE_WINDOWS: ServiceWindow[] = [
  {
    id: "breakfast",
    label: "فطور",
    openHour: 8,
    closeHour: 11,
    // Must be ordered by 1am the same night (i.e. the early hours of delivery day).
    cutoff: { type: "nightBefore", hour: 1 },
  },
  {
    id: "lunch-dinner",
    label: "غداء وعشاء",
    openHour: 15,
    closeHour: 22,
    cutoff: { type: "leadMinutes", minutes: 45 },
  },
]

export const DEFAULT_ORDER_SCHEDULE_CONFIG: OrderScheduleConfig = {
  closedDates: [],
  windows: DEFAULT_SERVICE_WINDOWS,
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function normalizeCutoff(raw: unknown): ScheduleCutoff | null {
  if (!raw || typeof raw !== "object") return null
  const data = raw as Partial<ScheduleCutoff> & { minutes?: unknown; hour?: unknown }

  if (data.type === "leadMinutes") {
    const minutes = Number(data.minutes)
    if (!Number.isFinite(minutes) || minutes < 0) return null
    return { type: "leadMinutes", minutes }
  }

  if (data.type === "nightBefore") {
    const hour = Number(data.hour)
    if (!Number.isFinite(hour) || hour < 0 || hour > 23) return null
    return { type: "nightBefore", hour }
  }

  return null
}

function normalizeWindow(raw: unknown): ServiceWindow | null {
  if (!raw || typeof raw !== "object") return null
  const data = raw as Partial<ServiceWindow> & { openHour?: unknown; closeHour?: unknown }

  const id = typeof data.id === "string" && data.id.trim() ? data.id.trim() : null
  const label = typeof data.label === "string" && data.label.trim() ? data.label.trim() : id
  const openHour = Number(data.openHour)
  const closeHour = Number(data.closeHour)
  const cutoff = normalizeCutoff(data.cutoff)

  if (!id || !label || !cutoff) return null
  if (!Number.isFinite(openHour) || !Number.isFinite(closeHour)) return null
  if (openHour < 0 || openHour > 23 || closeHour < 1 || closeHour > 24 || closeHour <= openHour) return null

  return { id, label, openHour, closeHour, cutoff }
}

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

  // Older stored configs won't have `windows` at all - fall back to the defaults
  // (current dinner hours) rather than producing a schedule with no windows.
  const windows = Array.isArray(data.windows)
    ? data.windows.map(normalizeWindow).filter((w): w is ServiceWindow => w !== null)
    : []

  return {
    closedDates,
    windows: windows.length > 0 ? windows : DEFAULT_SERVICE_WINDOWS,
  }
}
