"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  CATERING_CARD_COLORS_KEY,
  DEFAULT_CATERING_CARD_COLORS,
  normalizeCateringCardColors,
  type CateringCardColors,
} from "@/lib/catering-card-config"

const TABLE = "app_settings"

export function useCateringCardConfig() {
  const [config, setConfig] = useState<CateringCardColors>(DEFAULT_CATERING_CARD_COLORS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function load() {
      const { data, error: loadError } = await supabase.from(TABLE).select("value").eq("key", CATERING_CARD_COLORS_KEY).single()
      if (loadError && loadError.code !== "PGRST116") {
        setError(loadError.message)
      } else {
        setError(null)
      }
      setConfig(normalizeCateringCardColors(data?.value))
      setLoading(false)
    }

    void load()
  }, [supabase])

  async function saveConfig(nextConfig: CateringCardColors) {
    const normalized = normalizeCateringCardColors(nextConfig)
    const { error: saveError } = await supabase
      .from(TABLE)
      .upsert({ key: CATERING_CARD_COLORS_KEY, value: normalized }, { onConflict: "key" })
    if (saveError) {
      setError(saveError.message)
      throw saveError
    }
    setError(null)
    setConfig(normalized)
  }

  return { config, loading, error, saveConfig }
}
