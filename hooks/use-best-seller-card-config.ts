"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  BEST_SELLER_CARD_CONFIG_KEY,
  DEFAULT_BEST_SELLER_CARD_CONFIG,
  normalizeBestSellerCardConfig,
  type BestSellerCardConfig,
} from "@/lib/best-seller-card-config"

const TABLE = "app_settings"

export function useBestSellerCardConfig() {
  const [config, setConfig] = useState<BestSellerCardConfig>(DEFAULT_BEST_SELLER_CARD_CONFIG)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function load() {
      const { data, error: loadError } = await supabase.from(TABLE).select("value").eq("key", BEST_SELLER_CARD_CONFIG_KEY).single()
      if (loadError && loadError.code !== "PGRST116") {
        setError(loadError.message)
      } else {
        setError(null)
      }
      setConfig(normalizeBestSellerCardConfig(data?.value))
      setLoading(false)
    }

    void load()
  }, [supabase])

  async function saveConfig(nextConfig: BestSellerCardConfig) {
    const normalized = normalizeBestSellerCardConfig(nextConfig)
    const { error: saveError } = await supabase
      .from(TABLE)
      .upsert({ key: BEST_SELLER_CARD_CONFIG_KEY, value: normalized }, { onConflict: "key" })
    if (saveError) {
      setError(saveError.message)
      throw saveError
    }
    setError(null)
    setConfig(normalized)
  }

  return { config, loading, error, saveConfig }
}
