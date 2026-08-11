"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DEFAULT_PRINTER_CONFIG, normalizePrinterConfig, type PrinterConfig } from "@/lib/printer-config"

const TABLE = "app_settings"
const KEY = "printer_config"

export function usePrinterConfig() {
  const [config, setConfig] = useState<PrinterConfig>(DEFAULT_PRINTER_CONFIG)
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from(TABLE).select("value").eq("key", KEY).single()
      setConfig(normalizePrinterConfig(data?.value))
      setLoading(false)
    }
    load()
  }, [supabase])

  async function saveConfig(nextConfig: PrinterConfig) {
    const normalized = normalizePrinterConfig(nextConfig)
    await supabase.from(TABLE).upsert({ key: KEY, value: normalized }, { onConflict: "key" })
    setConfig(normalized)
  }

  return { config, loading, saveConfig }
}
