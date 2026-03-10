export interface DeliveryAreaRecord {
  id: string
  name: string
  price: number
  sort_order: number
  is_active: boolean
}

export const DELIVERY_AREAS_SETTINGS_KEY = "delivery_areas"

export const DEFAULT_DELIVERY_AREAS: DeliveryAreaRecord[] = [
  { id: "west-dammam", name: "غرب الدمام", price: 30, sort_order: 1, is_active: true },
  { id: "east-dammam", name: "شرق الدمام", price: 35, sort_order: 2, is_active: true },
  { id: "dhahran-raka", name: "الظهران - الراكة", price: 40, sort_order: 3, is_active: true },
  { id: "aziziyah", name: "العزيزية", price: 60, sort_order: 4, is_active: true },
  { id: "khobar", name: "الخبر", price: 50, sort_order: 5, is_active: true },
]

type DeliveryAreasSource = "app_settings" | "legacy_table" | "fallback"

function toStringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback
}

function toNumberValue(value: unknown, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toBooleanValue(value: unknown, fallback = true) {
  return typeof value === "boolean" ? value : fallback
}

export function normalizeDeliveryAreas(value: unknown): DeliveryAreaRecord[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item, index) => {
      if (!item || typeof item !== "object") return null

      const candidate = item as Partial<DeliveryAreaRecord>
      const id = toStringValue(candidate.id, `area-${index + 1}`)
      const name = toStringValue(candidate.name)
      const price = toNumberValue(candidate.price)
      const sortOrder = toNumberValue(candidate.sort_order, index + 1)

      if (!name || price <= 0) return null

      return {
        id,
        name,
        price,
        sort_order: sortOrder,
        is_active: toBooleanValue(candidate.is_active, true),
      }
    })
    .filter((item): item is DeliveryAreaRecord => Boolean(item))
    .sort((a, b) => a.sort_order - b.sort_order)
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message
  }

  return null
}

export async function fetchDeliveryAreasFromSupabase(supabase: any) {
  const appSettingsResponse = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", DELIVERY_AREAS_SETTINGS_KEY)
    .maybeSingle()

  const appSettingsAreas = normalizeDeliveryAreas(appSettingsResponse.data?.value)
  if (!appSettingsResponse.error && appSettingsResponse.data?.value !== undefined && appSettingsResponse.data?.value !== null) {
    return {
      areas: appSettingsAreas,
      source: "app_settings" as DeliveryAreasSource,
      error: null,
    }
  }

  const legacyResponse = await supabase.from("delivery_areas").select("*").order?.("sort_order")

  if (legacyResponse && !legacyResponse.error) {
    return {
      areas: normalizeDeliveryAreas(legacyResponse.data),
      source: "legacy_table" as DeliveryAreasSource,
      error: null,
    }
  }

  return {
    areas: DEFAULT_DELIVERY_AREAS,
    source: "fallback" as DeliveryAreasSource,
    error:
      getErrorMessage(appSettingsResponse.error) ??
      getErrorMessage(legacyResponse?.error) ??
      "تعذر تحميل مناطق التوصيل.",
  }
}

export async function saveDeliveryAreasToAppSettings(
  supabase: any,
  areas: DeliveryAreaRecord[]
) {
  const normalized = normalizeDeliveryAreas(
    areas.map((area, index) => ({
      ...area,
      sort_order: index + 1,
    }))
  )

  const { error } = await supabase.from("app_settings").upsert(
    {
      key: DELIVERY_AREAS_SETTINGS_KEY,
      value: normalized,
    },
    { onConflict: "key" }
  )

  return {
    ok: !error,
    error: getErrorMessage(error),
    areas: normalized,
  }
}
