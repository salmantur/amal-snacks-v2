import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { DEFAULT_BANNER, useBannerConfig } from "@/hooks/use-banner-config"

const createClientMock = vi.fn()
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => createClientMock(),
}))

function mockSupabase(initialValue: unknown) {
  const upsert = vi.fn().mockResolvedValue({ error: null })
  return {
    client: {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: initialValue !== undefined ? { value: initialValue } : null, error: null }),
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
  vi.useRealTimers()
})

/** Flushes the microtask queue so a `useEffect`'s single `await` settles without
 *  relying on testing-library's `waitFor`, which polls via real timers and hangs
 *  under `vi.useFakeTimers()`. */
async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe("useBannerConfig", () => {
  it("falls back to the default banner store with no persisted row", async () => {
    const { client } = mockSupabase(undefined)
    createClientMock.mockReturnValue(client)

    const { result } = renderHook(() => useBannerConfig())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.published).toEqual(DEFAULT_BANNER)
    expect(result.current.draft).toEqual(DEFAULT_BANNER)
    expect(result.current.config).toEqual(DEFAULT_BANNER)
  })

  it("migrates a legacy directly-saved BannerConfig into the versioned store shape", async () => {
    const legacyConfig = { ...DEFAULT_BANNER, title: "عرض قديم" }
    const { client } = mockSupabase(legacyConfig)
    createClientMock.mockReturnValue(client)

    const { result } = renderHook(() => useBannerConfig())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.published.title).toBe("عرض قديم")
    expect(result.current.draft.title).toBe("عرض قديم")
  })

  it("defaults the draft to the published config when only published is stored", async () => {
    const { client } = mockSupabase({ published: { ...DEFAULT_BANNER, title: "منشور" } })
    createClientMock.mockReturnValue(client)

    const { result } = renderHook(() => useBannerConfig())
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.draft.title).toBe("منشور")
  })

  it("serves the scheduled config when now falls within an enabled schedule window", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-15T12:00:00Z"))

    const { client } = mockSupabase({
      published: { ...DEFAULT_BANNER, title: "عادي" },
      schedule: {
        enabled: true,
        start_at: "2026-06-01T00:00:00Z",
        end_at: "2026-06-30T00:00:00Z",
        config: { ...DEFAULT_BANNER, title: "عرض خاص" },
      },
    })
    createClientMock.mockReturnValue(client)

    const { result } = renderHook(() => useBannerConfig())
    await flushMicrotasks()
    expect(result.current.loading).toBe(false)

    expect(result.current.config.title).toBe("عرض خاص")
  })

  it("serves the published config when now falls outside the schedule window", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-15T12:00:00Z"))

    const { client } = mockSupabase({
      published: { ...DEFAULT_BANNER, title: "عادي" },
      schedule: {
        enabled: true,
        start_at: "2026-06-01T00:00:00Z",
        end_at: "2026-06-30T00:00:00Z",
        config: { ...DEFAULT_BANNER, title: "عرض خاص" },
      },
    })
    createClientMock.mockReturnValue(client)

    const { result } = renderHook(() => useBannerConfig())
    await flushMicrotasks()
    expect(result.current.loading).toBe(false)

    expect(result.current.config.title).toBe("عادي")
  })

  it("ignores a disabled schedule even if now is within its window", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-15T12:00:00Z"))

    const { client } = mockSupabase({
      published: { ...DEFAULT_BANNER, title: "عادي" },
      schedule: {
        enabled: false,
        start_at: "2026-06-01T00:00:00Z",
        end_at: "2026-06-30T00:00:00Z",
        config: { ...DEFAULT_BANNER, title: "عرض خاص" },
      },
    })
    createClientMock.mockReturnValue(client)

    const { result } = renderHook(() => useBannerConfig())
    await flushMicrotasks()
    expect(result.current.loading).toBe(false)

    expect(result.current.config.title).toBe("عادي")
  })

  it("caps history at 3 entries, most recent first", async () => {
    const { client, upsert } = mockSupabase(undefined)
    createClientMock.mockReturnValue(client)

    const { result } = renderHook(() => useBannerConfig())
    await waitFor(() => expect(result.current.loading).toBe(false))

    for (let i = 0; i < 4; i++) {
      await act(async () => {
        await result.current.saveDraft({ ...DEFAULT_BANNER, title: `مسودة ${i}` })
      })
    }

    expect(result.current.history).toHaveLength(3)
    expect(result.current.history[0].config.title).toBe("مسودة 3")
    expect(upsert).toHaveBeenCalledTimes(4)
  })

  it("publishDraft copies the draft into published and adds a 'published' history entry", async () => {
    const { client } = mockSupabase(undefined)
    createClientMock.mockReturnValue(client)

    const { result } = renderHook(() => useBannerConfig())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.saveDraft({ ...DEFAULT_BANNER, title: "مسودة جديدة" })
    })
    await act(async () => {
      await result.current.publishDraft()
    })

    expect(result.current.published.title).toBe("مسودة جديدة")
    expect(result.current.history[0].kind).toBe("published")
  })

  it("clearSchedule disables and empties the schedule", async () => {
    const { client } = mockSupabase({
      published: DEFAULT_BANNER,
      schedule: { enabled: true, start_at: "2026-01-01", end_at: "2026-01-02", config: DEFAULT_BANNER },
    })
    createClientMock.mockReturnValue(client)

    const { result } = renderHook(() => useBannerConfig())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.schedule.enabled).toBe(true)

    await act(async () => {
      await result.current.clearSchedule()
    })

    expect(result.current.schedule).toEqual({ enabled: false, start_at: null, end_at: null, config: null })
  })

  it("restoreVersionToDraft copies a history entry's config back into the draft", async () => {
    const { client } = mockSupabase(undefined)
    createClientMock.mockReturnValue(client)

    const { result } = renderHook(() => useBannerConfig())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.saveDraft({ ...DEFAULT_BANNER, title: "نسخة قديمة" })
    })
    const versionId = result.current.history[0].id

    await act(async () => {
      await result.current.saveDraft({ ...DEFAULT_BANNER, title: "نسخة جديدة" })
    })
    expect(result.current.draft.title).toBe("نسخة جديدة")

    await act(async () => {
      await result.current.restoreVersionToDraft(versionId)
    })

    expect(result.current.draft.title).toBe("نسخة قديمة")
  })

  it("restoreVersionToDraft is a no-op for an unknown version id", async () => {
    const { client } = mockSupabase(undefined)
    createClientMock.mockReturnValue(client)

    const { result } = renderHook(() => useBannerConfig())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.restoreVersionToDraft("does-not-exist")
    })

    expect(result.current.draft).toEqual(DEFAULT_BANNER)
  })
})
