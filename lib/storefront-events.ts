"use client"

const STOREFRONT_EVENTS_KEY = "amal_storefront_events"
const MAX_STORED_EVENTS = 80

type StorefrontEventValue = boolean | number | string | null

export function trackStorefrontEvent(
  event: string,
  details: Record<string, StorefrontEventValue> = {},
) {
  if (typeof window === "undefined") return

  try {
    const raw = window.localStorage.getItem(STOREFRONT_EVENTS_KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    const existing = Array.isArray(parsed) ? parsed : []
    const next = [
      ...existing.slice(-(MAX_STORED_EVENTS - 1)),
      {
        event,
        details,
        timestamp: new Date().toISOString(),
      },
    ]

    window.localStorage.setItem(STOREFRONT_EVENTS_KEY, JSON.stringify(next))
  } catch {
    // Local event logging is best-effort only.
  }
}
