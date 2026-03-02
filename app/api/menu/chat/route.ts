import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { messages, system } = await req.json()

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    // Build conversation history for Gemini
    // Gemini requires alternating user/model turns, starting with user
    const geminiMessages = []
    for (const m of messages) {
      geminiMessages.push({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })
    }

    // Gemini needs at least one user message
    if (geminiMessages.length === 0 || geminiMessages[geminiMessages.length - 1].role !== "user") {
      return NextResponse.json({ content: [{ type: "text", text: "أهلاً، كيف أقدر أساعدك؟" }] })
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: geminiMessages,
          generationConfig: {
            maxOutputTokens: 500,
            temperature: 0.7,
          },
        }),
      }
    )

    const raw = await response.text()

    let data
    try {
      data = JSON.parse(raw)
    } catch {
      console.error("Gemini non-JSON response:", raw)
      return NextResponse.json({ error: "Invalid response from AI" }, { status: 500 })
    }

    if (!response.ok) {
      console.error("Gemini error:", JSON.stringify(data))
      return NextResponse.json({ error: data.error?.message || "API error" }, { status: response.status })
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      console.error("Gemini empty response:", JSON.stringify(data))
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