"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DEFAULT_HEADER_CONFIG, normalizeHeaderConfig, type HeaderConfig } from "@/lib/header-config"

const TABLE = "app_settings"
const KEY = "header_config"

export type HeaderVersionKind = "draft" | "published"

export interface HeaderVersion {
  id: string
  kind: HeaderVersionKind
  saved_at: string
  config: HeaderConfig
}

interface HeaderStore {
  published: HeaderConfig
  draft: HeaderConfig
  history: HeaderVersion[]
}

const DEFAULT_STORE: HeaderStore = {
  published: DEFAULT_HEADER_CONFIG,
  draft: DEFAULT_HEADER_CONFIG,
  history: [],
}

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

// Reused by anything that needs a one-shot read of the published header
// config outside a component (none today, kept exported for the same
// reason theme's normalizer is - so live vs. admin never drift on what
// "legacy shape" means).
export function normalizeHeaderStore(raw: unknown): HeaderStore {
  if (!raw || typeof raw !== "object") return DEFAULT_STORE
  const maybe = raw as Partial<HeaderStore & HeaderConfig>

  // Legacy mode: this key used to store a flat HeaderConfig directly,
  // before draft/publish/history existed.
  if ("logo_text" in maybe && !("published" in maybe)) {
    const legacyConfig = normalizeHeaderConfig(maybe)
    return { ...DEFAULT_STORE, published: legacyConfig, draft: legacyConfig }
  }

  const published = normalizeHeaderConfig(maybe.published)
  const draft = normalizeHeaderConfig(maybe.draft ?? maybe.published)

  const history = Array.isArray(maybe.history)
    ? maybe.history
        .map((v) => {
          if (!v || typeof v !== "object") return null
          const item = v as Partial<HeaderVersion>
          if (!item.config || !item.saved_at || !item.kind) return null
          return { id: item.id ?? uid(), kind: item.kind, saved_at: item.saved_at, config: normalizeHeaderConfig(item.config) } satisfies HeaderVersion
        })
        .filter((v): v is HeaderVersion => Boolean(v))
        .slice(0, 3)
    : []

  return { published, draft, history }
}

export function useHeaderConfig() {
  const [store, setStore] = useState<HeaderStore>(DEFAULT_STORE)
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from(TABLE).select("value").eq("key", KEY).single()
      setStore(normalizeHeaderStore(data?.value))
      setLoading(false)
    }
    load()
  }, [supabase])

  async function persist(nextStore: HeaderStore) {
    setStore(nextStore)
    await supabase.from(TABLE).upsert({ key: KEY, value: nextStore }, { onConflict: "key" })
  }

  function addHistory(base: HeaderStore, kind: HeaderVersionKind, cfg: HeaderConfig): HeaderStore {
    const entry: HeaderVersion = { id: uid(), kind, saved_at: new Date().toISOString(), config: cfg }
    return { ...base, history: [entry, ...base.history].slice(0, 3) }
  }

  async function saveDraft(draftConfig: HeaderConfig) {
    const normalized = normalizeHeaderConfig(draftConfig)
    const next = addHistory({ ...store, draft: normalized }, "draft", normalized)
    await persist(next)
  }

  async function publishDraft(draftConfig?: HeaderConfig) {
    const normalized = normalizeHeaderConfig(draftConfig ?? store.draft)
    const next = addHistory({ ...store, published: normalized, draft: normalized }, "published", normalized)
    await persist(next)
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
    // Back-compat alias: components that just want "the live config"
    // (e.g. Header itself) read this - identical to `published`.
    config: store.published,
    history: store.history,
    saveDraft,
    publishDraft,
    restoreVersionToDraft,
  }
}
