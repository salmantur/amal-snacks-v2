"use client"

import { useEffect, useMemo, useState } from "react"
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
  featured_product_id: string | null
  featured_product_label: string
  full_design_url: string | null
  full_design_mode: boolean
  image_opacity: number
  image_position_x: number
  image_position_y: number
  image_scale: number
}

export type BannerVersionKind = "draft" | "published" | "scheduled"

export interface BannerVersion {
  id: string
  kind: BannerVersionKind
  saved_at: string
  config: BannerConfig
}

export interface BannerSchedule {
  enabled: boolean
  start_at: string | null
  end_at: string | null
  config: BannerConfig | null
}

interface BannerStore {
  published: BannerConfig
  draft: BannerConfig
  schedule: BannerSchedule
  history: BannerVersion[]
}

export const DEFAULT_BANNER: BannerConfig = {
  badge: "جديدنا اليوم",
  title: "أهلا بك",
  subtitle: "أفضل الوجبات المثلجة والساخنة\nبجودة عالمية مختارة لك.",
  image_url: null,
  bg_from: "#fce4ec",
  bg_to: "#f8bbd0",
  show_badge: true,
  show_subtitle: true,
  featured_product_id: null,
  featured_product_label: "جديد 🔥",
  full_design_url: null,
  full_design_mode: false,
  image_opacity: 20,
  image_position_x: 50,
  image_position_y: 50,
  image_scale: 100,
}

const DEFAULT_STORE: BannerStore = {
  published: DEFAULT_BANNER,
  draft: DEFAULT_BANNER,
  schedule: {
    enabled: false,
    start_at: null,
    end_at: null,
    config: null,
  },
  history: [],
}

const TABLE = "app_settings"
const KEY = "hero_banner"

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function normalizeConfig(config: Partial<BannerConfig> | null | undefined): BannerConfig {
  return { ...DEFAULT_BANNER, ...(config ?? {}) }
}

function normalizeStore(raw: unknown): BannerStore {
  if (!raw || typeof raw !== "object") return DEFAULT_STORE
  const maybe = raw as Partial<BannerStore & BannerConfig>

  // Legacy mode: directly saved BannerConfig
  if ("title" in maybe && "bg_from" in maybe) {
    const legacyConfig = normalizeConfig(maybe as Partial<BannerConfig>)
    return {
      ...DEFAULT_STORE,
      published: legacyConfig,
      draft: legacyConfig,
    }
  }

  const published = normalizeConfig(maybe.published)
  const draft = normalizeConfig(maybe.draft ?? maybe.published)

  const scheduleRaw = maybe.schedule
  const schedule: BannerSchedule = {
    enabled: Boolean(scheduleRaw?.enabled),
    start_at: scheduleRaw?.start_at ?? null,
    end_at: scheduleRaw?.end_at ?? null,
    config: scheduleRaw?.config ? normalizeConfig(scheduleRaw.config) : null,
  }

  const history = Array.isArray(maybe.history)
    ? maybe.history
        .map((v) => {
          if (!v || typeof v !== "object") return null
          const item = v as Partial<BannerVersion>
          if (!item.config || !item.saved_at || !item.kind) return null
          return {
            id: item.id ?? uid(),
            kind: item.kind,
            saved_at: item.saved_at,
            config: normalizeConfig(item.config),
          } satisfies BannerVersion
        })
        .filter((v): v is BannerVersion => Boolean(v))
        .slice(0, 3)
    : []

  return {
    published,
    draft,
    schedule,
    history,
  }
}

function isNowInSchedule(schedule: BannerSchedule): boolean {
  if (!schedule.enabled || !schedule.config) return false
  const now = Date.now()
  const start = schedule.start_at ? Date.parse(schedule.start_at) : Number.NEGATIVE_INFINITY
  const end = schedule.end_at ? Date.parse(schedule.end_at) : Number.POSITIVE_INFINITY
  if (Number.isNaN(start) || Number.isNaN(end)) return false
  return now >= start && now <= end
}

export function useBannerConfig() {
  const [store, setStore] = useState<BannerStore>(DEFAULT_STORE)
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  const config = useMemo(() => {
    if (isNowInSchedule(store.schedule) && store.schedule.config) return store.schedule.config
    return store.published
  }, [store])

  async function persist(nextStore: BannerStore) {
    setStore(nextStore)
    await supabase.from(TABLE).upsert({ key: KEY, value: nextStore }, { onConflict: "key" })
  }

  function addHistory(base: BannerStore, kind: BannerVersionKind, cfg: BannerConfig): BannerStore {
    const entry: BannerVersion = {
      id: uid(),
      kind,
      saved_at: new Date().toISOString(),
      config: cfg,
    }
    return { ...base, history: [entry, ...base.history].slice(0, 3) }
  }

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from(TABLE).select("value").eq("key", KEY).single()
      const parsed = normalizeStore(data?.value)
      setStore(parsed)
      setLoading(false)
    }
    load()
  }, [supabase])

  async function saveDraft(draftConfig: BannerConfig) {
    const normalized = normalizeConfig(draftConfig)
    const next = addHistory({ ...store, draft: normalized }, "draft", normalized)
    await persist(next)
  }

  async function publishDraft(draftConfig?: BannerConfig) {
    const normalized = normalizeConfig(draftConfig ?? store.draft)
    const nextBase: BannerStore = {
      ...store,
      published: normalized,
      draft: normalized,
    }
    const next = addHistory(nextBase, "published", normalized)
    await persist(next)
  }

  async function scheduleDraft(startAt: string, endAt: string, draftConfig?: BannerConfig) {
    const normalized = normalizeConfig(draftConfig ?? store.draft)
    const nextBase: BannerStore = {
      ...store,
      schedule: {
        enabled: true,
        start_at: startAt,
        end_at: endAt,
        config: normalized,
      },
    }
    const next = addHistory(nextBase, "scheduled", normalized)
    await persist(next)
  }

  async function clearSchedule() {
    const next: BannerStore = {
      ...store,
      schedule: {
        enabled: false,
        start_at: null,
        end_at: null,
        config: null,
      },
    }
    await persist(next)
  }

  async function restoreVersionToDraft(versionId: string) {
    const version = store.history.find((v) => v.id === versionId)
    if (!version) return
    await saveDraft(version.config)
  }

  return {
    config,
    loading,
    draft: store.draft,
    published: store.published,
    schedule: store.schedule,
    history: store.history,
    saveDraft,
    publishDraft,
    scheduleDraft,
    clearSchedule,
    restoreVersionToDraft,
  }
}
