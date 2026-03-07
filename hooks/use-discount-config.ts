"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DEFAULT_DISCOUNT_CONFIG, normalizeDiscountConfig, type DiscountConfig } from "@/lib/discounts"

const TABLE = "app_settings"
const KEY = "discount_config"

export function useDiscountConfig() {
  const [config, setConfig] = useState<DiscountConfig>(DEFAULT_DISCOUNT_CONFIG)
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from(TABLE).select("value").eq("key", KEY).single()
      setConfig(normalizeDiscountConfig(data?.value))
      setLoading(false)
    }
    load()
  }, [supabase])

  async function saveConfig(nextConfig: DiscountConfig) {
    const normalized = normalizeDiscountConfig(nextConfig)
    await supabase.from(TABLE).upsert({ key: KEY, value: normalized }, { onConflict: "key" })
    setConfig(normalized)
  }

  return { config, loading, saveConfig }
}
