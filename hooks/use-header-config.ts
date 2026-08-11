"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DEFAULT_HEADER_CONFIG, normalizeHeaderConfig, type HeaderConfig } from "@/lib/header-config"

const TABLE = "app_settings"
const KEY = "header_config"

export function useHeaderConfig() {
  const [config, setConfig] = useState<HeaderConfig>(DEFAULT_HEADER_CONFIG)
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from(TABLE).select("value").eq("key", KEY).single()
      setConfig(normalizeHeaderConfig(data?.value))
      setLoading(false)
    }
    load()
  }, [supabase])

  async function saveConfig(nextConfig: HeaderConfig) {
    const normalized = normalizeHeaderConfig(nextConfig)
    await supabase.from(TABLE).upsert({ key: KEY, value: normalized }, { onConflict: "key" })
    setConfig(normalized)
  }

  return { config, loading, saveConfig }
}
