import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useOrderScheduleConfig } from "@/hooks/use-order-schedule-config"
import { DEFAULT_ORDER_SCHEDULE_CONFIG } from "@/lib/order-schedule-config"

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

describe("useOrderScheduleConfig", () => {
  it("loads the default config when nothing is stored", async () => {
    const { client } = mockSupabase(undefined)
    createClientMock.mockReturnValue(client)

    const { result } = renderHook(() => useOrderScheduleConfig())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.config).toEqual(DEFAULT_ORDER_SCHEDULE_CONFIG)
  })

  it("normalizes closed dates on load, dropping malformed entries", async () => {
    const { client } = mockSupabase({ closedDates: ["2026-01-01", "bad-date"] })
    createClientMock.mockReturnValue(client)

    const { result } = renderHook(() => useOrderScheduleConfig())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.config.closedDates).toEqual(["2026-01-01"])
  })

  it("saveConfig normalizes before upserting under the order_schedule key", async () => {
    const { client, upsert } = mockSupabase(undefined)
    createClientMock.mockReturnValue(client)

    const { result } = renderHook(() => useOrderScheduleConfig())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.saveConfig({ closedDates: ["2026-02-01", "2026-02-01"] })
    })

    expect(result.current.config.closedDates).toEqual(["2026-02-01"])
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ key: "order_schedule" }),
      { onConflict: "key" }
    )
  })
})
