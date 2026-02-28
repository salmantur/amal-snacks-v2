"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { applyTheme, DEFAULT_THEME, type ThemeConfig } from "@/hooks/use-theme-config"

export function ThemeLoader() {
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "theme_colors")
      .single()
      .then(({ data }) => {
        const cfg: ThemeConfig = data?.value ? { ...DEFAULT_THEME, ...data.value } : DEFAULT_THEME
        applyTheme(cfg)
      })
  }, [])

  return null
}
