"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  DEFAULT_ORDER_SCHEDULE_CONFIG,
  normalizeOrderScheduleConfig,
  type OrderScheduleConfig,
} from "@/lib/order-schedule-config"

const TABLE = "app_settings"
const KEY = "order_schedule"

export function useOrderScheduleConfig() {
  const [config, setConfig] = useState<OrderScheduleConfig>(DEFAULT_ORDER_SCHEDULE_CONFIG)
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from(TABLE).select("value").eq("key", KEY).single()
      setConfig(normalizeOrderScheduleConfig(data?.value))
      setLoading(false)
    }

    void load()
  }, [supabase])

  async function saveConfig(nextConfig: OrderScheduleConfig) {
    const normalized = normalizeOrderScheduleConfig(nextConfig)
    await supabase.from(TABLE).upsert({ key: KEY, value: normalized }, { onConflict: "key" })
    setConfig(normalized)
  }

  return { config, loading, saveConfig }
}
