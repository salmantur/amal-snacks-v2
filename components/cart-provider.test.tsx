import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { CartProvider, getCartKey, useCart, type MenuItem } from "@/components/cart-provider"

const CART_STORAGE_KEY = "amal_cart_items"
const DELIVERY_STORAGE_KEY = "amal_delivery_info"
const CART_UPDATED_AT_KEY = "amal_cart_updated_at"

const sampleItem: MenuItem = {
  id: "item-1",
  name: "شاي",
  description: "شاي بالنعناع",
  price: 15,
  image: "/tea.jpg",
  category: "drinks",
}

function wrapper({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  window.localStorage.clear()
})

describe("getCartKey", () => {
  it("combines the id with sorted selected ingredients", () => {
    expect(getCartKey("1", ["b", "a"])).toBe(getCartKey("1", ["a", "b"]))
  })

  it("produces distinct keys for different ingredient selections", () => {
    expect(getCartKey("1", ["a"])).not.toBe(getCartKey("1", ["b"]))
  })

  it("produces distinct keys for different ids with the same ingredients", () => {
    expect(getCartKey("1", ["a"])).not.toBe(getCartKey("2", ["a"]))
  })

  it("uses an empty ingredients key when none are selected", () => {
    expect(getCartKey("1")).toBe("1::")
    expect(getCartKey("1", [])).toBe("1::")
  })
})

describe("useCart", () => {
  it("throws when used outside a CartProvider", () => {
    expect(() => renderHook(() => useCart())).toThrow("useCart must be used within a CartProvider")
  })

  it("starts empty with no persisted state", () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    expect(result.current.items).toEqual([])
    expect(result.current.totalItems).toBe(0)
    expect(result.current.totalPrice).toBe(0)
  })

  it("adds a new item to the cart", () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => {
      result.current.addItem(sampleItem, 2)
    })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0]).toMatchObject({ id: "item-1", quantity: 2 })
    expect(result.current.totalItems).toBe(2)
    expect(result.current.totalPrice).toBe(30)
  })

  it("merges quantity when adding the same item + ingredient selection again", () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => {
      result.current.addItem(sampleItem, 1, ["نعناع"])
    })
    act(() => {
      result.current.addItem(sampleItem, 3, ["نعناع"])
    })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].quantity).toBe(4)
  })

  it("treats the same ingredients in a different order as the same line item", () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => {
      result.current.addItem(sampleItem, 1, ["a", "b"])
    })
    act(() => {
      result.current.addItem(sampleItem, 1, ["b", "a"])
    })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].quantity).toBe(2)
  })

  it("treats a different ingredient selection as a distinct line item", () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => {
      result.current.addItem(sampleItem, 1, ["a"])
    })
    act(() => {
      result.current.addItem(sampleItem, 1, ["b"])
    })

    expect(result.current.items).toHaveLength(2)
  })

  it("removes an item by cartKey", () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => {
      result.current.addItem(sampleItem, 1)
    })
    const cartKey = result.current.items[0].cartKey

    act(() => {
      result.current.removeItem(cartKey)
    })

    expect(result.current.items).toEqual([])
  })

  it("updates the quantity of an existing item", () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => {
      result.current.addItem(sampleItem, 1)
    })
    const cartKey = result.current.items[0].cartKey

    act(() => {
      result.current.updateQuantity(cartKey, 5)
    })

    expect(result.current.items[0].quantity).toBe(5)
  })

  it("removes the item when its quantity is updated to zero or below", () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => {
      result.current.addItem(sampleItem, 1)
    })
    const cartKey = result.current.items[0].cartKey

    act(() => {
      result.current.updateQuantity(cartKey, 0)
    })

    expect(result.current.items).toEqual([])
  })

  it("clears the cart", () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => {
      result.current.addItem(sampleItem, 1)
    })
    act(() => {
      result.current.clearCart()
    })

    expect(result.current.items).toEqual([])
  })

  it("persists items to localStorage after they change", async () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => {
      result.current.addItem(sampleItem, 1)
    })

    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) || "[]")
      expect(stored).toHaveLength(1)
      expect(stored[0].id).toBe("item-1")
    })
  })

  it("updates and persists delivery info", async () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => {
      result.current.setDeliveryInfo({
        name: "Salman",
        phone: "0500000000",
        address: "Dammam",
        locationUrl: "",
        area: "غرب الدمام",
        scheduledTime: null,
      })
    })

    expect(result.current.deliveryInfo.area).toBe("غرب الدمام")
    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(DELIVERY_STORAGE_KEY) || "{}")
      expect(stored.area).toBe("غرب الدمام")
    })
  })

  it("loads a valid persisted cart on mount", () => {
    const persisted = [{ ...sampleItem, quantity: 2, cartKey: getCartKey(sampleItem.id) }]
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(persisted))
    window.localStorage.setItem(CART_UPDATED_AT_KEY, String(Date.now()))

    const { result } = renderHook(() => useCart(), { wrapper })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].quantity).toBe(2)
  })

  it("drops malformed/legacy-shape items from persisted storage instead of crashing", () => {
    const valid = { ...sampleItem, quantity: 1, cartKey: getCartKey(sampleItem.id) }
    const missingCartKey = { ...sampleItem, quantity: 1 } // pre-cartKey legacy shape
    const zeroQuantity = { ...sampleItem, quantity: 0, cartKey: getCartKey("other") }
    const notAnObject = "just a string"

    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify([valid, missingCartKey, zeroQuantity, notAnObject, null])
    )
    window.localStorage.setItem(CART_UPDATED_AT_KEY, String(Date.now()))

    const { result } = renderHook(() => useCart(), { wrapper })

    expect(result.current.items).toEqual([valid])
  })

  it("discards a stale cart (older than the 7-day TTL) on mount", () => {
    const persisted = [{ ...sampleItem, quantity: 2, cartKey: getCartKey(sampleItem.id) }]
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(persisted))
    window.localStorage.setItem(CART_UPDATED_AT_KEY, String(eightDaysAgo))

    const { result } = renderHook(() => useCart(), { wrapper })

    expect(result.current.items).toEqual([])
  })

  it("keeps a cart within the 7-day TTL", () => {
    const persisted = [{ ...sampleItem, quantity: 2, cartKey: getCartKey(sampleItem.id) }]
    const sixDaysAgo = Date.now() - 6 * 24 * 60 * 60 * 1000
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(persisted))
    window.localStorage.setItem(CART_UPDATED_AT_KEY, String(sixDaysAgo))

    const { result } = renderHook(() => useCart(), { wrapper })

    expect(result.current.items).toHaveLength(1)
  })

  it("falls back to default delivery info when persisted shape is invalid", () => {
    window.localStorage.setItem(DELIVERY_STORAGE_KEY, JSON.stringify({ name: "Salman" })) // missing required fields
    window.localStorage.setItem(CART_UPDATED_AT_KEY, String(Date.now()))

    const { result } = renderHook(() => useCart(), { wrapper })

    expect(result.current.deliveryInfo).toEqual({
      name: "",
      phone: "",
      address: "",
      locationUrl: "",
      area: "",
      scheduledTime: null,
    })
  })
})
