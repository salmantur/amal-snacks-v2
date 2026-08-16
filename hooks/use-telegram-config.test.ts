import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useTelegramConfig } from "@/hooks/use-telegram-config"
import { DEFAULT_TELEGRAM_CONFIG } from "@/lib/telegram"

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

describe("useTelegramConfig", () => {
  it("loads the default config when nothing is stored", async () => {
    const { client } = mockSupabase(undefined)
    createClientMock.mockReturnValue(client)

    const { result } = renderHook(() => useTelegramConfig())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.config).toEqual(DEFAULT_TELEGRAM_CONFIG)
  })

  it("normalizes the stored config on load", async () => {
    const { client } = mockSupabase({ enabled: 1, botToken: "  tok  " })
    createClientMock.mockReturnValue(client)

    const { result } = renderHook(() => useTelegramConfig())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.config.enabled).toBe(true)
    expect(result.current.config.botToken).toBe("tok")
  })

  it("saveConfig normalizes before upserting under the telegram_alerts key", async () => {
    const { client, upsert } = mockSupabase(undefined)
    createClientMock.mockReturnValue(client)

    const { result } = renderHook(() => useTelegramConfig())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.saveConfig({ enabled: true, notifyOnNewOrder: true, botToken: "  t  ", chatId: "c" })
    })

    expect(result.current.config.botToken).toBe("t")
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ key: "telegram_alerts" }),
      { onConflict: "key" }
    )
  })
})
