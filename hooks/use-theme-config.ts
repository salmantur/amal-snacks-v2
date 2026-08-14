"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export interface ThemeConfig {
  primary: string          // cart button, badges (pink)
  primary_foreground: string  // text on primary
  secondary: string
  secondary_foreground: string
  accent: string
  accent_foreground: string
  destructive: string
  destructive_foreground: string
  checkout_green: string   // order type modal green
  background: string       // page background color
  bar_background: string   // category filter bar + search bar background
  item_card_background: string
  item_card_title: string
  item_card_description: string
  item_card_price: string
  tray_variant_design?: "design_c" | "floating_3"
  font_family: "system" | "tajawal" | "thmanyah-sans" | "thmanyah-serif-text"
  corner_radius: number // px, drives --radius (shadcn UI: buttons, dialogs, inputs, etc.)
}

export const DEFAULT_THEME: ThemeConfig = {
  primary: "#f0526a",       // current pink
  primary_foreground: "#ffffff",
  secondary: "#f0f0f0",
  secondary_foreground: "#262626",
  accent: "#f0f0f0",
  accent_foreground: "#262626",
  destructive: "#ef4444",
  destructive_foreground: "#ffffff",
  checkout_green: "#1e5631",
  background: "#ffffff",    // default white
  bar_background: "#f5f5f5", // default light grey bars
  item_card_background: "#ffffff",
  item_card_title: "#1e293b",
  item_card_description: "#6b7280",
  item_card_price: "#1e293b",
  tray_variant_design: "design_c",
  font_family: "system",
  corner_radius: 16,
}

export const THEME_STORAGE_KEY = "amal_theme_colors"

const TABLE = "app_settings"
const KEY = "theme_colors"

export type ThemeVersionKind = "draft" | "published"

export interface ThemeVersion {
  id: string
  kind: ThemeVersionKind
  saved_at: string
  config: ThemeConfig
}

interface ThemeStore {
  published: ThemeConfig
  draft: ThemeConfig
  history: ThemeVersion[]
}

const DEFAULT_STORE: ThemeStore = {
  published: DEFAULT_THEME,
  draft: DEFAULT_THEME,
  history: [],
}

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function normalizeConfig(config: Partial<ThemeConfig> | null | undefined): ThemeConfig {
  return { ...DEFAULT_THEME, ...(config ?? {}) }
}

// Reused by theme-loader.tsx so the live storefront and the admin editor
// agree on exactly what "published" means, including the legacy-shape
// fallback below.
export function normalizeThemeStore(raw: unknown): ThemeStore {
  if (!raw || typeof raw !== "object") return DEFAULT_STORE
  const maybe = raw as Partial<ThemeStore & ThemeConfig>

  // Legacy mode: this key used to store a flat ThemeConfig directly,
  // before draft/publish/history existed.
  if ("primary" in maybe && "background" in maybe && !("published" in maybe)) {
    const legacyConfig = normalizeConfig(maybe as Partial<ThemeConfig>)
    return { ...DEFAULT_STORE, published: legacyConfig, draft: legacyConfig }
  }

  const published = normalizeConfig(maybe.published)
  const draft = normalizeConfig(maybe.draft ?? maybe.published)

  const history = Array.isArray(maybe.history)
    ? maybe.history
        .map((v) => {
          if (!v || typeof v !== "object") return null
          const item = v as Partial<ThemeVersion>
          if (!item.config || !item.saved_at || !item.kind) return null
          return { id: item.id ?? uid(), kind: item.kind, saved_at: item.saved_at, config: normalizeConfig(item.config) } satisfies ThemeVersion
        })
        .filter((v): v is ThemeVersion => Boolean(v))
        .slice(0, 3)
    : []

  return { published, draft, history }
}

export function hexToHsl(hex: string): string {
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

const FONT_VAR_BY_FAMILY: Record<Exclude<ThemeConfig["font_family"], "system">, string> = {
  tajawal: "var(--font-tajawal)",
  "thmanyah-sans": "var(--font-thmanyah-sans)",
  "thmanyah-serif-text": "var(--font-thmanyah-serif-text)",
}

export function applyTheme(config: ThemeConfig) {
  const root = document.documentElement
  root.style.setProperty("--primary", hexToHsl(config.primary))
  root.style.setProperty("--primary-foreground", hexToHsl(config.primary_foreground))
  root.style.setProperty("--secondary", hexToHsl(config.secondary))
  root.style.setProperty("--secondary-foreground", hexToHsl(config.secondary_foreground))
  root.style.setProperty("--accent", hexToHsl(config.accent || config.secondary))
  root.style.setProperty("--accent-foreground", hexToHsl(config.accent_foreground || config.secondary_foreground))
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
  root.style.setProperty("--item-card-bg", config.item_card_background || DEFAULT_THEME.item_card_background)
  root.style.setProperty("--item-card-title", config.item_card_title || DEFAULT_THEME.item_card_title)
  root.style.setProperty("--item-card-desc", config.item_card_description || DEFAULT_THEME.item_card_description)
  root.style.setProperty("--item-card-price", config.item_card_price || DEFAULT_THEME.item_card_price)

  if (config.font_family && config.font_family !== "system") {
    root.style.setProperty("--font-theme", FONT_VAR_BY_FAMILY[config.font_family])
  } else {
    root.style.removeProperty("--font-theme")
  }

  root.style.setProperty("--radius", `${config.corner_radius ?? DEFAULT_THEME.corner_radius}px`)
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
  const [store, setStore] = useState<ThemeStore>(DEFAULT_STORE)
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function load() {
      const cached = loadCachedTheme()
      if (cached) applyTheme(cached)

      const { data } = await supabase.from(TABLE).select("value").eq("key", KEY).single()
      const parsed = normalizeThemeStore(data?.value)
      setStore(parsed)
      applyTheme(parsed.published)
      saveCachedTheme(parsed.published)
      setLoading(false)
    }
    load()
  }, [supabase])

  async function persist(nextStore: ThemeStore) {
    setStore(nextStore)
    await supabase.from(TABLE).upsert({ key: KEY, value: nextStore }, { onConflict: "key" })
  }

  function addHistory(base: ThemeStore, kind: ThemeVersionKind, cfg: ThemeConfig): ThemeStore {
    const entry: ThemeVersion = { id: uid(), kind, saved_at: new Date().toISOString(), config: cfg }
    return { ...base, history: [entry, ...base.history].slice(0, 3) }
  }

  async function saveDraft(draftConfig: ThemeConfig) {
    const normalized = normalizeConfig(draftConfig)
    const next = addHistory({ ...store, draft: normalized }, "draft", normalized)
    await persist(next)
  }

  async function publishDraft(draftConfig?: ThemeConfig) {
    const normalized = normalizeConfig(draftConfig ?? store.draft)
    const next = addHistory({ ...store, published: normalized, draft: normalized }, "published", normalized)
    await persist(next)
    applyTheme(normalized)
    saveCachedTheme(normalized)
  }

  async function restoreVersionToDraft(versionId: string) {
    const version = store.history.find((v) => v.id === versionId)
    if (!version) return
    await saveDraft(version.config)
  }

  return {
    loading,
    draft: store.draft,
    published: store.published,
    history: store.history,
    saveDraft,
    publishDraft,
    restoreVersionToDraft,
  }
}
