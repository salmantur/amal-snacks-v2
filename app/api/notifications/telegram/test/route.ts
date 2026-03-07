import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { normalizeTelegramConfig, sendTelegramMessage } from "@/lib/telegram"

interface AppSettingsRow {
  value: unknown
}

export async function POST() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json({ ok: false, error: "Server is not configured." }, { status: 500 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "telegram_alerts")
    .maybeSingle<AppSettingsRow>()

  const config = normalizeTelegramConfig(data?.value)
  if (!config.enabled || !config.botToken || !config.chatId) {
    return NextResponse.json({ ok: false, error: "Telegram settings are incomplete." }, { status: 400 })
  }

  const ok = await sendTelegramMessage(
    config,
    ["✅ Telegram test message", "إذا وصلك هذا التنبيه فالإعدادات تعمل بشكل صحيح."].join("\n")
  )

  if (!ok) {
    return NextResponse.json({ ok: false, error: "Telegram API failed. Check token/chat ID." }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
