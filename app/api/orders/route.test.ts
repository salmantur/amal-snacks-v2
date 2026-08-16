// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { POST } from "@/app/api/orders/route"

vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>()
  return {
    ...actual,
    // The real `after()` requires an active Next.js request scope, which doesn't
    // exist when invoking the route handler directly in a unit test. Run the
    // callback immediately instead - synchronous portions of it (the parts these
    // tests assert on) still execute before this returns, same as production.
    after: (fn: () => unknown) => {
      fn()
    },
  }
})

const createClientMock = vi.fn()
vi.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}))

interface MockResponse {
  data?: unknown
  error?: unknown
}

function chainableThenable(response: MockResponse) {
  const builder: Record<string, unknown> = {
    select: () => builder,
    in: () => builder,
    then: (resolve: (v: MockResponse) => void, reject: (e: unknown) => void) =>
      Promise.resolve(response).then(resolve, reject),
  }
  return builder
}

function appSettingsBuilder(settingsResponse: MockResponse, deliveryAreaResponse: MockResponse) {
  let mode: "in" | "eq" = "in"
  const builder: Record<string, unknown> = {
    select: () => builder,
    in: () => {
      mode = "in"
      return builder
    },
    eq: () => {
      mode = "eq"
      return builder
    },
    maybeSingle: () => Promise.resolve(deliveryAreaResponse),
    then: (resolve: (v: MockResponse) => void, reject: (e: unknown) => void) =>
      Promise.resolve(mode === "eq" ? deliveryAreaResponse : settingsResponse).then(resolve, reject),
  }
  return builder
}

interface MenuRow {
  id: string
  name: string
  name_en?: string
  price: number
  ingredients?: string[] | string | null
  limit?: number
  making_time?: number
}

interface MockSupabaseOptions {
  menu: MenuRow[]
  menuError?: unknown
  settings?: Array<{ key: string; value: unknown }>
  deliveryAreas?: Array<{ id: string; name: string; price: number; sort_order: number; is_active: boolean }>
  rpcData?: { id: string; order_number: number } | null
  rpcError?: unknown
  onRpcCall?: (fnName: string, args: unknown) => void
  onFailedOrderInsert?: (payload: unknown) => void
}

function createMockSupabase(opts: MockSupabaseOptions) {
  return {
    from(table: string) {
      if (table === "menu") {
        return chainableThenable({ data: opts.menu, error: opts.menuError ?? null })
      }
      if (table === "app_settings") {
        return appSettingsBuilder(
          { data: opts.settings ?? [], error: null },
          { data: opts.deliveryAreas ? { value: opts.deliveryAreas } : null, error: null }
        )
      }
      if (table === "failed_orders") {
        return {
          insert: (payload: unknown) => {
            opts.onFailedOrderInsert?.(payload)
            return Promise.resolve({ error: null })
          },
        }
      }
      if (table === "delivery_areas") {
        return { select: () => ({ order: () => Promise.resolve({ data: [], error: { message: "no legacy table" } }) }) }
      }
      throw new Error(`Unexpected table requested in test: ${table}`)
    },
    rpc(fnName: string, args: unknown) {
      opts.onRpcCall?.(fnName, args)
      return {
        single: () =>
          Promise.resolve({
            data: opts.rpcData ?? { id: "order-1", order_number: 1 },
            error: opts.rpcError ?? null,
          }),
      }
    },
  }
}

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "1.2.3.4", ...headers },
    body: JSON.stringify(body),
  })
}

let ipCounter = 0
function uniqueIp() {
  ipCounter += 1
  return `10.0.0.${ipCounter}`
}

beforeEach(() => {
  createClientMock.mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("POST /api/orders - server-side pricing", () => {
  it("always prices items from the server-fetched menu row, ignoring any client-submitted price", async () => {
    let capturedArgs: unknown
    const supabase = createMockSupabase({
      menu: [{ id: "tea", name: "شاي", price: 15 }],
      onRpcCall: (_fn, args) => {
        capturedArgs = args
      },
    })
    createClientMock.mockReturnValue(supabase)

    const payload = {
      customerArea: "استلام من المحل",
      orderType: "pickup",
      // A client attempting to under-price the item - the schema doesn't even
      // define a `price` field on order items, and the server must never use it.
      items: [{ id: "tea", quantity: 2, price: 0.01 }],
    }

    const response = await POST(makeRequest(payload, { "x-forwarded-for": uniqueIp() }))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.subtotal).toBe(30) // 15 * 2, not 0.01 * 2
    expect((capturedArgs as any).p_subtotal).toBe(30)
    expect((capturedArgs as any).p_items[0].price).toBe(15)
  })

  it("uses the matched variant price when a single-choice ingredient option is selected", async () => {
    let capturedArgs: unknown
    const supabase = createMockSupabase({
      menu: [
        {
          id: "juice",
          name: "عصير",
          price: 10,
          limit: 1,
          ingredients: ["صغير::10", "كبير::15"],
        },
      ],
      onRpcCall: (_fn, args) => {
        capturedArgs = args
      },
    })
    createClientMock.mockReturnValue(supabase)

    const payload = {
      customerArea: "استلام من المحل",
      orderType: "pickup",
      items: [{ id: "juice", quantity: 1, selectedIngredients: ["كبير"] }],
    }

    const response = await POST(makeRequest(payload, { "x-forwarded-for": uniqueIp() }))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.subtotal).toBe(15)
    expect((capturedArgs as any).p_items[0].price).toBe(15)
  })

  it("falls back to the base price when the selected variant label has no match", async () => {
    const supabase = createMockSupabase({
      menu: [{ id: "juice", name: "عصير", price: 10, limit: 1, ingredients: ["صغير::10", "كبير::15"] }],
    })
    createClientMock.mockReturnValue(supabase)

    const payload = {
      customerArea: "استلام من المحل",
      orderType: "pickup",
      items: [{ id: "juice", quantity: 1, selectedIngredients: ["غير موجود"] }],
    }

    const response = await POST(makeRequest(payload, { "x-forwarded-for": uniqueIp() }))
    const json = await response.json()

    expect(json.subtotal).toBe(10)
  })

  it("rejects an order that references an unknown menu item and logs it to failed_orders", async () => {
    let failedPayload: unknown
    const supabase = createMockSupabase({
      menu: [{ id: "tea", name: "شاي", price: 15 }],
      onFailedOrderInsert: (payload) => {
        failedPayload = payload
      },
    })
    createClientMock.mockReturnValue(supabase)

    const payload = {
      customerArea: "استلام من المحل",
      orderType: "pickup",
      items: [{ id: "does-not-exist", quantity: 1 }],
    }

    const response = await POST(makeRequest(payload, { "x-forwarded-for": uniqueIp() }))
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toContain("does-not-exist")
    expect((failedPayload as any).reason).toContain("unknown_menu_item")
  })
})

describe("POST /api/orders - delivery fee resolution", () => {
  it("applies the matched active area's delivery fee", async () => {
    let capturedArgs: unknown
    const supabase = createMockSupabase({
      menu: [{ id: "tea", name: "شاي", price: 15 }],
      deliveryAreas: [{ id: "a", name: "الخبر", price: 40, sort_order: 1, is_active: true }],
      onRpcCall: (_fn, args) => {
        capturedArgs = args
      },
    })
    createClientMock.mockReturnValue(supabase)

    const payload = {
      customerArea: "الخبر",
      orderType: "delivery",
      items: [{ id: "tea", quantity: 1 }],
    }

    const response = await POST(makeRequest(payload, { "x-forwarded-for": uniqueIp() }))
    const json = await response.json()

    expect(json.deliveryFee).toBe(40)
    expect(json.total).toBe(55)
    expect((capturedArgs as any).p_delivery_fee).toBe(40)
  })

  it("ignores an inactive area (fee stays 0) and flags the order instead of rejecting it", async () => {
    let capturedArgs: unknown
    const supabase = createMockSupabase({
      menu: [{ id: "tea", name: "شاي", price: 15 }],
      deliveryAreas: [{ id: "a", name: "الخبر", price: 40, sort_order: 1, is_active: false }],
      onRpcCall: (_fn, args) => {
        capturedArgs = args
      },
    })
    createClientMock.mockReturnValue(supabase)

    const payload = {
      customerArea: "الخبر",
      orderType: "delivery",
      items: [{ id: "tea", quantity: 1 }],
    }

    const response = await POST(makeRequest(payload, { "x-forwarded-for": uniqueIp() }))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.deliveryFee).toBe(0)
    expect((capturedArgs as any).p_notes).toContain("منطقة غير معروفة")
  })

  it("flags an unmatched area name instead of rejecting the order", async () => {
    let capturedArgs: unknown
    const supabase = createMockSupabase({
      menu: [{ id: "tea", name: "شاي", price: 15 }],
      deliveryAreas: [{ id: "a", name: "الخبر", price: 40, sort_order: 1, is_active: true }],
      onRpcCall: (_fn, args) => {
        capturedArgs = args
      },
    })
    createClientMock.mockReturnValue(supabase)

    const payload = {
      customerArea: "منطقة قديمة غير موجودة",
      orderType: "delivery",
      items: [{ id: "tea", quantity: 1 }],
    }

    const response = await POST(makeRequest(payload, { "x-forwarded-for": uniqueIp() }))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.deliveryFee).toBe(0)
    expect((capturedArgs as any).p_notes).toContain("منطقة غير معروفة")
  })
})

describe("POST /api/orders - discounts", () => {
  it("applies the discount_config from app_settings to the final total", async () => {
    const supabase = createMockSupabase({
      menu: [{ id: "tea", name: "شاي", price: 100 }],
      settings: [
        {
          key: "discount_config",
          value: { enabled: true, autoDiscountEnabled: true, autoDiscountType: "percent", autoDiscountValue: 10, codes: [] },
        },
      ],
    })
    createClientMock.mockReturnValue(supabase)

    const payload = {
      customerArea: "استلام من المحل",
      orderType: "pickup",
      items: [{ id: "tea", quantity: 1 }],
    }

    const response = await POST(makeRequest(payload, { "x-forwarded-for": uniqueIp() }))
    const json = await response.json()

    expect(json.subtotal).toBe(100)
    expect(json.totalDiscount).toBe(10)
    expect(json.total).toBe(90)
  })
})

describe("POST /api/orders - scheduled time validation", () => {
  it("flags a scheduledTime that doesn't match any currently available slot, without rejecting the order", async () => {
    let capturedArgs: unknown
    const supabase = createMockSupabase({
      menu: [{ id: "tea", name: "شاي", price: 15 }],
      onRpcCall: (_fn, args) => {
        capturedArgs = args
      },
    })
    createClientMock.mockReturnValue(supabase)

    const payload = {
      customerArea: "استلام من المحل",
      orderType: "pickup",
      items: [{ id: "tea", quantity: 1 }],
      scheduledTime: "this is not a real slot label",
    }

    const response = await POST(makeRequest(payload, { "x-forwarded-for": uniqueIp() }))
    expect(response.status).toBe(200)
    expect((capturedArgs as any).p_notes).toContain("موعد غير متاح")
  })
})

describe("POST /api/orders - validation and failure handling", () => {
  it("returns 400 with details for a payload that fails schema validation", async () => {
    const supabase = createMockSupabase({ menu: [] })
    createClientMock.mockReturnValue(supabase)

    const response = await POST(
      makeRequest({ customerArea: "x", orderType: "not-a-real-type", items: [] }, { "x-forwarded-for": uniqueIp() })
    )
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toBe("Invalid order payload")
  })

  it("returns 500 and logs failed_orders when the menu fails to load", async () => {
    let failedPayload: unknown
    const supabase = createMockSupabase({
      menu: [],
      menuError: { message: "connection refused" },
      onFailedOrderInsert: (payload) => {
        failedPayload = payload
      },
    })
    createClientMock.mockReturnValue(supabase)

    const payload = {
      customerArea: "استلام من المحل",
      orderType: "pickup",
      items: [{ id: "tea", quantity: 1 }],
    }

    const response = await POST(makeRequest(payload, { "x-forwarded-for": uniqueIp() }))
    expect(response.status).toBe(500)
    expect((failedPayload as any).reason).toBe("menu_load_failed")
  })

  it("returns 500 and logs failed_orders when the order insert RPC fails", async () => {
    let failedPayload: unknown
    const supabase = createMockSupabase({
      menu: [{ id: "tea", name: "شاي", price: 15 }],
      rpcData: null,
      rpcError: { message: "duplicate key" },
      onFailedOrderInsert: (payload) => {
        failedPayload = payload
      },
    })
    createClientMock.mockReturnValue(supabase)

    const payload = {
      customerArea: "استلام من المحل",
      orderType: "pickup",
      items: [{ id: "tea", quantity: 1 }],
    }

    const response = await POST(makeRequest(payload, { "x-forwarded-for": uniqueIp() }))
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.details).toBe("duplicate key")
    expect((failedPayload as any).reason).toContain("db_insert_failed")
  })
})

describe("POST /api/orders - rate limiting", () => {
  it("allows 5 requests per IP per minute and rejects the 6th with 429", async () => {
    const supabase = createMockSupabase({ menu: [{ id: "tea", name: "شاي", price: 15 }] })
    createClientMock.mockReturnValue(supabase)

    const ip = uniqueIp()
    const payload = {
      customerArea: "استلام من المحل",
      orderType: "pickup",
      items: [{ id: "tea", quantity: 1 }],
    }

    const statuses: number[] = []
    for (let i = 0; i < 6; i++) {
      const response = await POST(makeRequest(payload, { "x-forwarded-for": ip }))
      statuses.push(response.status)
    }

    expect(statuses.slice(0, 5)).toEqual([200, 200, 200, 200, 200])
    expect(statuses[5]).toBe(429)
  })

  it("tracks rate limits independently per IP", async () => {
    const supabase = createMockSupabase({ menu: [{ id: "tea", name: "شاي", price: 15 }] })
    createClientMock.mockReturnValue(supabase)

    const payload = {
      customerArea: "استلام من المحل",
      orderType: "pickup",
      items: [{ id: "tea", quantity: 1 }],
    }

    const responseA = await POST(makeRequest(payload, { "x-forwarded-for": uniqueIp() }))
    const responseB = await POST(makeRequest(payload, { "x-forwarded-for": uniqueIp() }))

    expect(responseA.status).toBe(200)
    expect(responseB.status).toBe(200)
  })
})
