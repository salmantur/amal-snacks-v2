import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { DEFAULT_THEME, THEME_STORAGE_KEY, hexToHsl, loadCachedTheme, saveCachedTheme, useThemeConfig } from "@/hooks/use-theme-config"

const createClientMock = vi.fn()
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => createClientMock(),
}))

function mockSupabase(value: unknown) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: value !== undefined ? { value } : null, error: null }),
        }),
      }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    }),
  }
}

describe("hexToHsl", () => {
  it("converts known hex colors to their HSL triplet", () => {
    expect(hexToHsl("#ffffff")).toBe("0 0% 100%")
    expect(hexToHsl("#000000")).toBe("0 0% 0%")
    expect(hexToHsl("#ff0000")).toBe("0 100% 50%")
  })
})

describe("loadCachedTheme / saveCachedTheme", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("round-trips a saved theme through localStorage", () => {
    saveCachedTheme({ ...DEFAULT_THEME, primary: "#123456" })
    const loaded = loadCachedTheme()
    expect(loaded?.primary).toBe("#123456")
  })

  it("returns null when nothing is cached", () => {
    expect(loadCachedTheme()).toBeNull()
  })

  it("returns null instead of throwing on corrupted JSON", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "{not valid json")
    expect(loadCachedTheme()).toBeNull()
  })

  it("fills in missing fields from DEFAULT_THEME when reading a partial cached theme", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ primary: "#abcdef" }))
    const loaded = loadCachedTheme()
    expect(loaded?.primary).toBe("#abcdef")
    expect(loaded?.secondary).toBe(DEFAULT_THEME.secondary)
  })
})

describe("useThemeConfig", () => {
  beforeEach(() => {
    window.localStorage.clear()
    createClientMock.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("loads the default theme merged with whatever app_settings returns", async () => {
    createClientMock.mockReturnValue(mockSupabase({ primary: "#00ff00" }))

    const { result } = renderHook(() => useThemeConfig())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.config.primary).toBe("#00ff00")
    expect(result.current.config.secondary).toBe(DEFAULT_THEME.secondary)
  })

  it("falls back to DEFAULT_THEME entirely when app_settings has no row", async () => {
    createClientMock.mockReturnValue(mockSupabase(undefined))

    const { result } = renderHook(() => useThemeConfig())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.config).toEqual(DEFAULT_THEME)
  })

  it("caches the loaded theme to localStorage", async () => {
    createClientMock.mockReturnValue(mockSupabase({ primary: "#111111" }))

    renderHook(() => useThemeConfig())

    await waitFor(() => {
      const cached = JSON.parse(window.localStorage.getItem(THEME_STORAGE_KEY) || "{}")
      expect(cached.primary).toBe("#111111")
    })
  })

  it("saveConfig upserts and updates local state", async () => {
    const supabase = mockSupabase({})
    createClientMock.mockReturnValue(supabase)

    const { result } = renderHook(() => useThemeConfig())
    await waitFor(() => expect(result.current.loading).toBe(false))

    const nextConfig = { ...DEFAULT_THEME, primary: "#654321" }
    await act(async () => {
      await result.current.saveConfig(nextConfig)
    })

    expect(result.current.config.primary).toBe("#654321")
  })
})
