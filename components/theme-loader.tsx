"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { applyTheme, loadCachedTheme, normalizeThemeStore, saveCachedTheme } from "@/hooks/use-theme-config"

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
        const published = normalizeThemeStore(data?.value).published
        applyTheme(published)
        saveCachedTheme(published)
      })
  }, [])

  return null
}
