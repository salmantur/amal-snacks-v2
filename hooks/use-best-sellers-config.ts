"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const TABLE = "app_settings"
const KEY = "best_sellers_order"

function normalizeOrderIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((entry) => String(entry || "").trim()).filter(Boolean)
}

export function useBestSellersConfig() {
  const [orderIds, setOrderIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from(TABLE).select("value").eq("key", KEY).single()
      setOrderIds(normalizeOrderIds(data?.value))
      setLoading(false)
    }
    load()
  }, [supabase])

  async function saveOrder(nextOrderIds: string[]) {
    const normalized = normalizeOrderIds(nextOrderIds)
    await supabase.from(TABLE).upsert({ key: KEY, value: normalized }, { onConflict: "key" })
    setOrderIds(normalized)
  }

  return { orderIds, loading, saveOrder }
}
