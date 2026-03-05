import { NextResponse } from "next/server"

type VitalPayload = {
  id?: string
  name?: string
  value?: number
  rating?: "good" | "needs-improvement" | "poor"
  delta?: number
  navigationType?: string
  path?: string
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as VitalPayload

    if (!payload?.name || typeof payload?.value !== "number") {
      return NextResponse.json({ ok: false, error: "invalid payload" }, { status: 400 })
    }

    // Keep logging lightweight; can be replaced with external monitoring sink later.
    console.log("[web-vitals]", {
      name: payload.name,
      value: payload.value,
      rating: payload.rating,
      path: payload.path,
      nav: payload.navigationType,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: "bad request" }, { status: 400 })
  }
}

