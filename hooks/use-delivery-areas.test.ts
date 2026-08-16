import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useDeliveryAreas } from "@/hooks/use-delivery-areas"
import { DEFAULT_DELIVERY_AREAS } from "@/lib/delivery-areas"

const createClientMock = vi.fn()
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => createClientMock(),
}))

function mockSupabase(appSettingsResponse: { data?: unknown; error?: unknown }) {
  return {
    from: (table: string) => {
      if (table === "app_settings") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve(appSettingsResponse),
            }),
          }),
        }
      }
      if (table === "delivery_areas") {
        return { select: () => ({ order: () => Promise.resolve({ data: [], error: { message: "no legacy table" } }) }) }
      }
      throw new Error(`unexpected table: ${table}`)
    },
  }
}

beforeEach(() => {
  createClientMock.mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("useDeliveryAreas", () => {
  it("exposes only active areas via `areas`, while `allAreas` keeps inactive ones too", async () => {
    createClientMock.mockReturnValue(
      mockSupabase({
        data: {
          value: [
            { id: "a", name: "الخبر", price: 50, sort_order: 1, is_active: true },
            { id: "b", name: "الظهران", price: 40, sort_order: 2, is_active: false },
          ],
        },
        error: null,
      })
    )

    const { result } = renderHook(() => useDeliveryAreas())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.allAreas).toHaveLength(2)
    expect(result.current.areas).toHaveLength(1)
    expect(result.current.areas[0].id).toBe("a")
    expect(result.current.source).toBe("app_settings")
    expect(result.current.isUsingFallback).toBe(false)
  })

  it("falls back to defaults and flags isUsingFallback when nothing can be loaded", async () => {
    createClientMock.mockReturnValue(
      mockSupabase({ data: null, error: { message: "network error" } })
    )

    const { result } = renderHook(() => useDeliveryAreas())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.isUsingFallback).toBe(true)
    expect(result.current.allAreas).toEqual(DEFAULT_DELIVERY_AREAS)
    expect(result.current.loadError).toBe("network error")
  })

  it("reload() re-fetches the areas", async () => {
    createClientMock.mockReturnValue(
      mockSupabase({ data: { value: [{ id: "a", name: "الخبر", price: 50, sort_order: 1, is_active: true }] }, error: null })
    )

    const { result } = renderHook(() => useDeliveryAreas())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.reload()
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.allAreas).toHaveLength(1)
  })
})
