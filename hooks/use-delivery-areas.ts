"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  DEFAULT_DELIVERY_AREAS,
  fetchDeliveryAreasFromSupabase,
  saveDeliveryAreasToAppSettings,
  type DeliveryAreaRecord,
} from "@/lib/delivery-areas"

export type DeliveryArea = DeliveryAreaRecord

export interface DeliveryAreaMutationResult {
  ok: boolean
  error: string | null
}

type DeliveryAreasSource = "app_settings" | "legacy_table" | "fallback"

function getSupabaseErrorMessage(error: unknown, fallbackMessage: string) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message
  }

  return fallbackMessage
}

async function loadEditableAreas(supabase: ReturnType<typeof createClient>) {
  const result = await fetchDeliveryAreasFromSupabase(supabase)

  if (result.source === "fallback") {
    return {
      areas: DEFAULT_DELIVERY_AREAS,
      error: result.error,
    }
  }

  return {
    areas: result.areas,
    error: null,
  }
}

export function useDeliveryAreas() {
  const [areas, setAreas] = useState<DeliveryArea[]>([])
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState<DeliveryAreasSource>("app_settings")
  const [loadError, setLoadError] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  const load = useCallback(async () => {
    setLoading(true)

    const result = await fetchDeliveryAreasFromSupabase(supabase)
    setAreas(result.areas)
    setSource(result.source)
    setLoadError(result.error)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    void load()
  }, [load])

  return {
    areas: areas.filter((area) => area.is_active),
    allAreas: areas,
    loading,
    reload: load,
    loadError,
    source,
    isUsingFallback: source === "fallback",
  }
}

export async function saveDeliveryArea(area: DeliveryArea): Promise<DeliveryAreaMutationResult> {
  const supabase = createClient()
  const current = await loadEditableAreas(supabase)

  if (current.error) {
    return {
      ok: false,
      error: current.error,
    }
  }

  const nextAreas = current.areas.some((existing) => existing.id === area.id)
    ? current.areas.map((existing) => (existing.id === area.id ? area : existing))
    : [...current.areas, area]

  const result = await saveDeliveryAreasToAppSettings(supabase, nextAreas)

  return {
    ok: result.ok,
    error: result.error ? getSupabaseErrorMessage(result.error, "تعذر حفظ منطقة التوصيل") : null,
  }
}

export async function deleteDeliveryArea(id: string): Promise<DeliveryAreaMutationResult> {
  const supabase = createClient()
  const current = await loadEditableAreas(supabase)

  if (current.error) {
    return {
      ok: false,
      error: current.error,
    }
  }

  const result = await saveDeliveryAreasToAppSettings(
    supabase,
    current.areas.filter((area) => area.id !== id)
  )

  return {
    ok: result.ok,
    error: result.error ? getSupabaseErrorMessage(result.error, "تعذر حذف منطقة التوصيل") : null,
  }
}

export async function seedDeliveryAreas(): Promise<DeliveryAreaMutationResult> {
  const supabase = createClient()
  const result = await saveDeliveryAreasToAppSettings(supabase, DEFAULT_DELIVERY_AREAS)

  return {
    ok: result.ok,
    error: result.error ? getSupabaseErrorMessage(result.error, "تعذر تحميل الأسعار الافتراضية") : null,
  }
}
