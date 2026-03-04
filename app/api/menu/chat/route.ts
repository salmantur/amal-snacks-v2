import { NextResponse } from "next/server"
import { timingSafeEqual } from "crypto"

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 20
const MAX_MESSAGES = 20
const MAX_TEXT_LENGTH = 4000
const MAX_SYSTEM_LENGTH = 2000

const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const existing = rateLimitStore.get(ip)

  if (!existing || now > existing.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }

  existing.count += 1
  return existing.count > RATE_LIMIT_MAX_REQUESTS
}

function extractClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for")
  if (xff) {
    return xff.split(",")[0]?.trim() || "unknown"
  }

  return req.headers.get("x-real-ip") || "unknown"
}

function hasValidInternalSecret(req: Request): boolean {
  const expected = process.env.CHAT_API_SECRET
  if (!expected) return true

  const provided = req.headers.get("x-chat-secret")
  if (typeof provided !== "string" || provided.length !== expected.length) {
    return false
  }

  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
}

export async function POST(req: Request) {
  try {
    if (!hasValidInternalSecret(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const clientIp = extractClientIp(req)
    if (isRateLimited(clientIp)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const body = await req.json()
    const messages = Array.isArray(body?.messages) ? body.messages : []
    const system = typeof body?.system === "string" ? body.system : ""

    if (messages.length === 0 || messages.length > MAX_MESSAGES) {
      return NextResponse.json({ error: "Invalid message count" }, { status: 400 })
    }

    if (system.length > MAX_SYSTEM_LENGTH) {
      return NextResponse.json({ error: "System prompt too long" }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    // Build conversation history for Gemini with bounded text lengths.
    const geminiMessages = []
    for (const m of messages) {
      const textContent = typeof m.content === "string"
        ? m.content
        : Array.isArray(m.content)
          ? m.content.map((c: { text?: string }) => c.text || "").join(" ")
          : String(m.content)

      const trimmed = textContent.trim().slice(0, MAX_TEXT_LENGTH)
      if (!trimmed) continue

      geminiMessages.push({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: trimmed }],
      })
    }

    if (geminiMessages.length === 0 || geminiMessages[geminiMessages.length - 1].role !== "user") {
      return NextResponse.json({ content: [{ type: "text", text: "أهلاً، كيف أقدر أساعدك؟" }] })
    }

    const payload: Record<string, unknown> = {
      contents: geminiMessages,
      generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
    }

    if (system.trim()) {
      payload.systemInstruction = { parts: [{ text: system.slice(0, MAX_SYSTEM_LENGTH) }] }
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    )

    const raw = await response.text()
    let data
    try {
      data = JSON.parse(raw)
    } catch {
      return NextResponse.json({ error: "Invalid response from AI" }, { status: 500 })
    }

    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message || "API error" }, { status: response.status })
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      return NextResponse.json({ error: "Empty response from AI" }, { status: 500 })
    }

    return NextResponse.json({ content: [{ type: "text", text }] })
  } catch {
    return NextResponse.json({ error: "Unknown error" }, { status: 500 })
  }
}
