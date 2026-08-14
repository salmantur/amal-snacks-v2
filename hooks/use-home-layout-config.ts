"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DEFAULT_HOME_LAYOUT_CONFIG, normalizeHomeLayoutConfig, type HomeLayoutConfig } from "@/lib/home-layout-config"

const TABLE = "app_settings"
const KEY = "home_layout_config"

export function useHomeLayoutConfig() {
  const [config, setConfig] = useState<HomeLayoutConfig>(DEFAULT_HOME_LAYOUT_CONFIG)
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from(TABLE).select("value").eq("key", KEY).single()
      setConfig(normalizeHomeLayoutConfig(data?.value))
      setLoading(false)
    }
    load()
  }, [supabase])

  async function saveConfig(nextConfig: HomeLayoutConfig) {
    const normalized = normalizeHomeLayoutConfig(nextConfig)
    await supabase.from(TABLE).upsert({ key: KEY, value: normalized }, { onConflict: "key" })
    setConfig(normalized)
  }

  return { config, loading, saveConfig }
}
