"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { applyTheme, DEFAULT_THEME, loadCachedTheme, saveCachedTheme, type ThemeConfig } from "@/hooks/use-theme-config"

export function ThemeLoader() {
  useEffect(() => {
    const cached = loadCachedTheme()
    if (cached) {
      applyTheme(cached)
    }

    const supabase = createClient()
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "theme_colors")
      .single()
      .then(({ data }) => {
        const cfg: ThemeConfig = data?.value ? { ...DEFAULT_THEME, ...data.value } : DEFAULT_THEME
        applyTheme(cfg)
        saveCachedTheme(cfg)
      })
  }, [])

  return null
}
