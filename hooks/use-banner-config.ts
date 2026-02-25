"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export interface BannerConfig {
  badge: string
  title: string
  subtitle: string
  image_url: string | null
  bg_from: string
  bg_to: string
  show_badge: boolean
  show_subtitle: boolean
}

export const DEFAULT_BANNER: BannerConfig = {
  badge: "جديدنا اليوم",
  title: "أهلاً بك",
  subtitle: "أفضل الوجبات المثلجة والساخنة\nبجودة عالمية مختارة لك.",
  image_url: null,
  bg_from: "#fce4ec",
  bg_to: "#f8bbd0",
  show_badge: true,
  show_subtitle: true,
}

const TABLE = "app_settings"
const KEY = "hero_banner"

export function useBannerConfig() {
  const [config, setConfig] = useState<BannerConfig>(DEFAULT_BANNER)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const { data } = await supabase
        .from(TABLE)
        .select("value")
        .eq("key", KEY)
        .single()

      if (data?.value) {
        setConfig({ ...DEFAULT_BANNER, ...data.value })
      }
      setLoading(false)
    }

    load()
  }, [])

  async function saveConfig(updated: BannerConfig) {
    setConfig(updated)
    const supabase = createClient()
    await supabase
      .from(TABLE)
      .upsert({ key: KEY, value: updated }, { onConflict: "key" })
  }

  return { config, loading, saveConfig }
}
