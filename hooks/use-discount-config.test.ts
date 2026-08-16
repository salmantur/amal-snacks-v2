import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useDiscountConfig } from "@/hooks/use-discount-config"
import { DEFAULT_DISCOUNT_CONFIG } from "@/lib/discounts"

const createClientMock = vi.fn()
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => createClientMock(),
}))

function mockSupabase(value: unknown) {
  const upsert = vi.fn().mockResolvedValue({ error: null })
  return {
    client: {
      from: () => ({
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: value !== undefined ? { value } : null, error: null }) }) }),
        upsert,
      }),
    },
    upsert,
  }
}

beforeEach(() => {
  createClientMock.mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("useDiscountConfig", () => {
  it("loads the default config when nothing is stored", async () => {
    const { client } = mockSupabase(undefined)
    createClientMock.mockReturnValue(client)

    const { result } = renderHook(() => useDiscountConfig())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.config).toEqual(DEFAULT_DISCOUNT_CONFIG)
  })

  it("normalizes the stored config on load", async () => {
    const { client } = mockSupabase({ enabled: "yes", autoDiscountValue: -5 })
    createClientMock.mockReturnValue(client)

    const { result } = renderHook(() => useDiscountConfig())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.config.enabled).toBe(true)
    expect(result.current.config.autoDiscountValue).toBe(0)
  })

  it("saveConfig normalizes before upserting and updating local state", async () => {
    const { client, upsert } = mockSupabase(undefined)
    createClientMock.mockReturnValue(client)

    const { result } = renderHook(() => useDiscountConfig())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.saveConfig({
        enabled: true,
        autoDiscountEnabled: true,
        autoDiscountType: "percent",
        autoDiscountValue: -10, // should be clamped to 0 by normalization
        codes: [],
      })
    })

    expect(result.current.config.autoDiscountValue).toBe(0)
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ key: "discount_config" }),
      { onConflict: "key" }
    )
  })
})
