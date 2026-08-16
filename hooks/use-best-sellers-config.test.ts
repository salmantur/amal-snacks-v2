import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useBestSellersConfig } from "@/hooks/use-best-sellers-config"

const createClientMock = vi.fn()
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => createClientMock(),
}))

function mockSupabase(value: unknown) {
  const upsert = vi.fn().mockResolvedValue({ error: null })
  return {
    client: {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: value !== undefined ? { value } : null, error: null }),
          }),
        }),
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

describe("useBestSellersConfig", () => {
  it("defaults to an empty order when nothing is stored", async () => {
    const { client } = mockSupabase(undefined)
    createClientMock.mockReturnValue(client)

    const { result } = renderHook(() => useBestSellersConfig())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.orderIds).toEqual([])
  })

  it("drops non-string/empty entries and trims whitespace when loading", async () => {
    const { client } = mockSupabase(["a", "  b  ", "", null, 42])
    createClientMock.mockReturnValue(client)

    const { result } = renderHook(() => useBestSellersConfig())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.orderIds).toEqual(["a", "b", "42"])
  })

  it("treats a non-array stored value as empty", async () => {
    const { client } = mockSupabase("not-an-array")
    createClientMock.mockReturnValue(client)

    const { result } = renderHook(() => useBestSellersConfig())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.orderIds).toEqual([])
  })

  it("saveOrder normalizes and upserts the new order", async () => {
    const { client, upsert } = mockSupabase(undefined)
    createClientMock.mockReturnValue(client)

    const { result } = renderHook(() => useBestSellersConfig())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.saveOrder(["x", "  y  ", ""])
    })

    expect(result.current.orderIds).toEqual(["x", "y"])
    expect(upsert).toHaveBeenCalledWith({ key: "best_sellers_order", value: ["x", "y"] }, { onConflict: "key" })
  })
})
