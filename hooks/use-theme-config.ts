"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export interface ThemeConfig {
  primary: string          // cart button, badges (pink)
  primary_foreground: string  // text on primary
  secondary: string
  secondary_foreground: string
  destructive: string
  destructive_foreground: string
  checkout_green: string   // order type modal green
  background: string       // page background color
  bar_background: string   // category filter bar + search bar background
}

export const DEFAULT_THEME: ThemeConfig = {
  primary: "#f0526a",       // current pink
  primary_foreground: "#ffffff",
  secondary: "#f0f0f0",
  secondary_foreground: "#262626",
  destructive: "#ef4444",
  destructive_foreground: "#ffffff",
  checkout_green: "#1e5631",
  background: "#ffffff",    // default white
  bar_background: "#f5f5f5", // default light grey bars
}

export const THEME_STORAGE_KEY = "amal_theme_colors"

const TABLE = "app_settings"
const KEY = "theme_colors"

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

export function applyTheme(config: ThemeConfig) {
  const root = document.documentElement
  root.style.setProperty("--primary", hexToHsl(config.primary))
  root.style.setProperty("--primary-foreground", hexToHsl(config.primary_foreground))
  root.style.setProperty("--secondary", hexToHsl(config.secondary))
  root.style.setProperty("--secondary-foreground", hexToHsl(config.secondary_foreground))
  root.style.setProperty("--accent", hexToHsl(config.secondary))
  root.style.setProperty("--accent-foreground", hexToHsl(config.secondary_foreground))
  root.style.setProperty("--destructive", hexToHsl(config.destructive))
  root.style.setProperty("--destructive-foreground", hexToHsl(config.destructive_foreground))
  root.style.setProperty("--ring", hexToHsl(config.primary))
  root.style.setProperty("--checkout-green", config.checkout_green)
  if (config.background) {
    root.style.setProperty("--background", hexToHsl(config.background))
    root.style.setProperty("--card", hexToHsl(config.background))
  }
  if (config.bar_background) {
    root.style.setProperty("--bar-background", config.bar_background)
    root.style.setProperty("--muted", hexToHsl(config.bar_background))
    root.style.setProperty("--amal-grey", hexToHsl(config.bar_background))
  }
}

export function loadCachedTheme(): ThemeConfig | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<ThemeConfig>
    return { ...DEFAULT_THEME, ...parsed }
  } catch {
    return null
  }
}

export function saveCachedTheme(config: ThemeConfig) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(config))
  } catch {
    // Ignore storage failures.
  }
}

export function useThemeConfig() {
  const [config, setConfig] = useState<ThemeConfig>(DEFAULT_THEME)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const cached = loadCachedTheme()
      if (cached) {
        setConfig(cached)
        applyTheme(cached)
      }

      const { data } = await supabase
        .from(TABLE)
        .select("value")
        .eq("key", KEY)
        .single()
      const cfg = data?.value ? { ...DEFAULT_THEME, ...data.value } : DEFAULT_THEME
      setConfig(cfg)
      applyTheme(cfg)
      saveCachedTheme(cfg)
      setLoading(false)
    }
    load()
  }, [])

  async function saveConfig(newConfig: ThemeConfig) {
    const supabase = createClient()
    await supabase.from(TABLE).upsert({ key: KEY, value: newConfig })
    setConfig(newConfig)
    applyTheme(newConfig)
    saveCachedTheme(newConfig)
  }

  return { config, loading, saveConfig }
}
