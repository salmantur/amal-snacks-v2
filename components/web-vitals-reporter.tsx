"use client"

import { useReportWebVitals } from "next/web-vitals"

type VitalPayload = {
  id: string
  name: string
  value: number
  rating: "good" | "needs-improvement" | "poor"
  delta: number
  navigationType?: string
  path: string
}

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    const payload: VitalPayload = {
      id: metric.id,
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      navigationType: metric.navigationType,
      path: window.location.pathname,
    }

    const body = JSON.stringify(payload)

    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/vitals", body)
      return
    }

    void fetch("/api/vitals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    })
  })

  return null
}

