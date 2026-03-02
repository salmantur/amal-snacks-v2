import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { messages, system } = await req.json()

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    // Build conversation history for Gemini
    const geminiMessages = []
    for (const m of messages) {
      const textContent = typeof m.content === 'string'
        ? m.content
        : Array.isArray(m.content)
          ? m.content.map((c: { text?: string }) => c.text || "").join(" ")
          : String(m.content)

      if (!textContent.trim()) continue

      geminiMessages.push({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: textContent }],
      })
    }

    if (geminiMessages.length === 0 || geminiMessages[geminiMessages.length - 1].role !== "user") {
      return NextResponse.json({ content: [{ type: "text", text: "أهلاً، كيف أقدر أساعدك؟" }] })
    }

    const payload: Record<string, unknown> = {
      contents: geminiMessages,
      generationConfig: { maxOutputTokens: 500, temperature: 0.7 },
    }

    if (system && typeof system === "string" && system.trim()) {
      payload.systemInstruction = { parts: [{ text: system }] }
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
    try { data = JSON.parse(raw) } catch {
      console.error("Gemini non-JSON:", raw)
      return NextResponse.json({ error: "Invalid response from AI" }, { status: 500 })
    }

    if (!response.ok) {
      console.error("Gemini error:", JSON.stringify(data))
      return NextResponse.json({ error: data.error?.message || "API error" }, { status: response.status })
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      console.error("Gemini empty:", JSON.stringify(data))
      return NextResponse.json({ error: "Empty response from AI" }, { status: 500 })
    }

    return NextResponse.json({ content: [{ type: "text", text }] })

  } catch (err) {
    console.error("Chat route error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}