"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DEFAULT_TELEGRAM_CONFIG, normalizeTelegramConfig, type TelegramConfig } from "@/lib/telegram"

const TABLE = "app_settings"
const KEY = "telegram_alerts"

export function useTelegramConfig() {
  const [config, setConfig] = useState<TelegramConfig>(DEFAULT_TELEGRAM_CONFIG)
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from(TABLE).select("value").eq("key", KEY).single()
      setConfig(normalizeTelegramConfig(data?.value))
      setLoading(false)
    }
    load()
  }, [supabase])

  async function saveConfig(nextConfig: TelegramConfig) {
    const normalized = normalizeTelegramConfig(nextConfig)
    await supabase.from(TABLE).upsert({ key: KEY, value: normalized }, { onConflict: "key" })
    setConfig(normalized)
  }

  return { config, loading, saveConfig }
}
