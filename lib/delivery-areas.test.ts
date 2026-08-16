import { describe, expect, it } from "vitest"
import {
  DEFAULT_DELIVERY_AREAS,
  DELIVERY_AREAS_SETTINGS_KEY,
  fetchDeliveryAreasFromSupabase,
  normalizeDeliveryAreas,
  saveDeliveryAreasToAppSettings,
  type DeliveryAreaRecord,
} from "@/lib/delivery-areas"

describe("normalizeDeliveryAreas", () => {
  it("returns an empty array for non-array input", () => {
    expect(normalizeDeliveryAreas(null)).toEqual([])
    expect(normalizeDeliveryAreas("not an array")).toEqual([])
    expect(normalizeDeliveryAreas({})).toEqual([])
  })

  it("drops entries with no name or a non-positive price", () => {
    const result = normalizeDeliveryAreas([
      { id: "a", name: "", price: 10, sort_order: 1, is_active: true },
      { id: "b", name: "الخبر", price: 0, sort_order: 2, is_active: true },
      { id: "c", name: "الخبر", price: -5, sort_order: 3, is_active: true },
      null,
      "not-an-object",
    ])

    expect(result).toEqual([])
  })

  it("keeps valid areas, defaults id/sort_order/is_active, and sorts by sort_order", () => {
    const result = normalizeDeliveryAreas([
      { name: "شرق الدمام", price: 35, sort_order: 2 },
      { name: "غرب الدمام", price: 30, sort_order: 1 },
    ])

    expect(result).toEqual([
      { id: "area-2", name: "غرب الدمام", price: 30, sort_order: 1, is_active: true },
      { id: "area-1", name: "شرق الدمام", price: 35, sort_order: 2, is_active: true },
    ])
  })

  it("respects an explicit is_active: false", () => {
    const result = normalizeDeliveryAreas([{ id: "x", name: "الخبر", price: 50, sort_order: 1, is_active: false }])
    expect(result[0].is_active).toBe(false)
  })
})

type FromResponse = { data?: unknown; error?: unknown }

function mockSupabase(options: { appSettings: FromResponse; legacy: FromResponse | null }) {
  return {
    from(table: string) {
      if (table === "app_settings") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve(options.appSettings),
            }),
          }),
        }
      }
      if (table === "delivery_areas") {
        return {
          select: () => {
            if (options.legacy === null) {
              // Simulates a client where `.order` doesn't exist, exercising the `?.()` in the source.
              return {}
            }
            return {
              order: () => Promise.resolve(options.legacy),
            }
          },
        }
      }
      throw new Error(`unexpected table: ${table}`)
    },
  }
}

describe("fetchDeliveryAreasFromSupabase", () => {
  it("uses app_settings as the primary source when it has a value", () => {
    const areas: DeliveryAreaRecord[] = [{ id: "a", name: "الخبر", price: 50, sort_order: 1, is_active: true }]
    const supabase = mockSupabase({ appSettings: { data: { value: areas }, error: null }, legacy: null })

    return fetchDeliveryAreasFromSupabase(supabase).then((result) => {
      expect(result.source).toBe("app_settings")
      expect(result.areas).toEqual(areas)
      expect(result.error).toBeNull()
    })
  })

  it("falls back to the legacy table when app_settings has no row for the key", async () => {
    const legacyAreas = [{ id: "a", name: "الخبر", price: 50, sort_order: 1, is_active: true }]
    const supabase = mockSupabase({
      appSettings: { data: null, error: null },
      legacy: { data: legacyAreas, error: null },
    })

    const result = await fetchDeliveryAreasFromSupabase(supabase)
    expect(result.source).toBe("legacy_table")
    expect(result.areas).toEqual(legacyAreas)
  })

  it("falls back to the legacy table when the app_settings query errors", async () => {
    const legacyAreas = [{ id: "a", name: "الخبر", price: 50, sort_order: 1, is_active: true }]
    const supabase = mockSupabase({
      appSettings: { data: null, error: { message: "boom" } },
      legacy: { data: legacyAreas, error: null },
    })

    const result = await fetchDeliveryAreasFromSupabase(supabase)
    expect(result.source).toBe("legacy_table")
  })

  it("falls back to hardcoded defaults when both app_settings and the legacy table fail", async () => {
    const supabase = mockSupabase({
      appSettings: { data: null, error: { message: "app_settings down" } },
      legacy: { data: null, error: { message: "legacy table missing" } },
    })

    const result = await fetchDeliveryAreasFromSupabase(supabase)
    expect(result.source).toBe("fallback")
    expect(result.areas).toEqual(DEFAULT_DELIVERY_AREAS)
    expect(result.error).toBe("app_settings down")
  })

  it("falls back to hardcoded defaults when the legacy client has no .order method", async () => {
    const supabase = mockSupabase({
      appSettings: { data: null, error: { message: "app_settings down" } },
      legacy: null,
    })

    const result = await fetchDeliveryAreasFromSupabase(supabase)
    expect(result.source).toBe("fallback")
    expect(result.areas).toEqual(DEFAULT_DELIVERY_AREAS)
    // getErrorMessage prefers the app_settings error over the (absent) legacy one.
    expect(result.error).toBe("app_settings down")
  })
})

describe("saveDeliveryAreasToAppSettings", () => {
  it("re-indexes sort_order sequentially and upserts under the delivery_areas key", async () => {
    let capturedPayload: unknown
    let capturedOptions: unknown
    const supabase = {
      from: (table: string) => {
        expect(table).toBe("app_settings")
        return {
          upsert: (payload: unknown, options: unknown) => {
            capturedPayload = payload
            capturedOptions = options
            return Promise.resolve({ error: null })
          },
        }
      },
    }

    const input: DeliveryAreaRecord[] = [
      { id: "b", name: "الخبر", price: 50, sort_order: 99, is_active: true },
      { id: "a", name: "الدمام", price: 30, sort_order: 1, is_active: true },
    ]

    const result = await saveDeliveryAreasToAppSettings(supabase, input)

    expect(result.ok).toBe(true)
    expect(result.error).toBeNull()
    expect(result.areas.map((a) => a.sort_order)).toEqual([1, 2])
    expect(capturedPayload).toEqual({ key: DELIVERY_AREAS_SETTINGS_KEY, value: result.areas })
    expect(capturedOptions).toEqual({ onConflict: "key" })
  })

  it("drops invalid areas (no name / non-positive price) before saving", async () => {
    const supabase = {
      from: () => ({
        upsert: () => Promise.resolve({ error: null }),
      }),
    }

    const result = await saveDeliveryAreasToAppSettings(supabase, [
      { id: "a", name: "", price: 30, sort_order: 1, is_active: true },
      { id: "b", name: "الخبر", price: 50, sort_order: 2, is_active: true },
    ])

    expect(result.areas).toHaveLength(1)
    expect(result.areas[0].id).toBe("b")
  })

  it("surfaces the upsert error and reports ok: false", async () => {
    const supabase = {
      from: () => ({
        upsert: () => Promise.resolve({ error: { message: "write failed" } }),
      }),
    }

    const result = await saveDeliveryAreasToAppSettings(supabase, [
      { id: "a", name: "الخبر", price: 50, sort_order: 1, is_active: true },
    ])

    expect(result.ok).toBe(false)
    expect(result.error).toBe("write failed")
  })
})
