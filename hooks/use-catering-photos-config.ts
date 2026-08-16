"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  CATERING_PHOTOS_KEY,
  DEFAULT_CATERING_PHOTOS_CONFIG,
  normalizeCateringPhotosConfig,
  type CateringPhotosConfig,
} from "@/lib/catering-photos-config"

const TABLE = "app_settings"

export function useCateringPhotosConfig() {
  const [config, setConfig] = useState<CateringPhotosConfig>(DEFAULT_CATERING_PHOTOS_CONFIG)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function load() {
      const { data, error: loadError } = await supabase.from(TABLE).select("value").eq("key", CATERING_PHOTOS_KEY).single()
      if (loadError && loadError.code !== "PGRST116") {
        setError(loadError.message)
      } else {
        setError(null)
      }
      setConfig(normalizeCateringPhotosConfig(data?.value))
      setLoading(false)
    }

    void load()
  }, [supabase])

  async function saveConfig(nextConfig: CateringPhotosConfig) {
    const normalized = normalizeCateringPhotosConfig(nextConfig)
    const { error: saveError } = await supabase
      .from(TABLE)
      .upsert({ key: CATERING_PHOTOS_KEY, value: normalized }, { onConflict: "key" })
    if (saveError) {
      setError(saveError.message)
      throw saveError
    }
    setError(null)
    setConfig(normalized)
  }

  return { config, loading, error, saveConfig }
}
