"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from "react"

export interface MenuItem {
  id: string
  name: string
  nameEn?: string
  description: string
  price: number
  image: string
  category: string
  ingredients?: string[]
  limit?: number
  makingTime?: number  // preparation time in minutes
  isFeatured?: boolean  // best seller
  images?: string[]      // additional gallery images
  inStock?: boolean
  packageItems?: { label: string; quantity: number; included?: boolean }[]
}

export interface CartItem extends MenuItem {
  quantity: number
  selectedIngredients?: string[]
  cartKey: string
}

export interface DeliveryInfo {
  name: string
  phone: string
  address: string
  area: string
  notes: string
  scheduledTime: string | null
}

/** Generate a stable composite key from id + sorted ingredients */
export function getCartKey(id: string, selectedIngredients?: string[]): string {
  const ingredientsKey = selectedIngredients ? [...selectedIngredients].sort().join(",") : ""
  return `${id}::${ingredientsKey}`
}

const CART_STORAGE_KEY = "amal_cart_items"
const DELIVERY_STORAGE_KEY = "amal_delivery_info"
const CART_UPDATED_AT_KEY = "amal_cart_updated_at"
const CART_TTL_MS = 1000 * 60 * 60 * 24 * 7 // 7 days

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or unavailable — fail silently
  }
}

function isValidCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false
  const item = value as Partial<CartItem>
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.description === "string" &&
    typeof item.price === "number" &&
    typeof item.image === "string" &&
    typeof item.category === "string" &&
    typeof item.quantity === "number" &&
    item.quantity > 0 &&
    typeof item.cartKey === "string"
  )
}

function sanitizeCartItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return []
  return value.filter(isValidCartItem)
}

function isValidDeliveryInfo(value: unknown): value is DeliveryInfo {
  if (!value || typeof value !== "object") return false
  const info = value as Partial<DeliveryInfo>
  const scheduledTimeOk = info.scheduledTime === null || typeof info.scheduledTime === "string"
  return (
    typeof info.name === "string" &&
    typeof info.phone === "string" &&
    typeof info.address === "string" &&
    typeof info.area === "string" &&
    typeof info.notes === "string" &&
    scheduledTimeOk
  )
}

function isStorageStale(): boolean {
  if (typeof window === "undefined") return false
  const raw = localStorage.getItem(CART_UPDATED_AT_KEY)
  const updatedAt = raw ? Number(raw) : NaN
  if (!Number.isFinite(updatedAt)) return false
  return Date.now() - updatedAt > CART_TTL_MS
}

const DEFAULT_DELIVERY_INFO: DeliveryInfo = {
  name: "",
  phone: "",
  address: "",
  area: "",
  notes: "",
  scheduledTime: null,
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: MenuItem, quantity?: number, selectedIngredients?: string[]) => void
  removeItem: (cartKey: string) => void
  updateQuantity: (cartKey: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
  deliveryInfo: DeliveryInfo
  setDeliveryInfo: (info: DeliveryInfo) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (isStorageStale()) return []
    return sanitizeCartItems(loadFromStorage<unknown>(CART_STORAGE_KEY, []))
  })
  const [deliveryInfo, setDeliveryInfoState] = useState<DeliveryInfo>(() => {
    if (isStorageStale()) return DEFAULT_DELIVERY_INFO
    const stored = loadFromStorage<unknown>(DELIVERY_STORAGE_KEY, DEFAULT_DELIVERY_INFO)
    return isValidDeliveryInfo(stored) ? stored : DEFAULT_DELIVERY_INFO
  })

  // Persist cart items whenever they change
  useEffect(() => {
    saveToStorage(CART_STORAGE_KEY, items)
    saveToStorage(CART_UPDATED_AT_KEY, Date.now())
  }, [items])

  // Persist delivery info whenever it changes
  useEffect(() => {
    saveToStorage(DELIVERY_STORAGE_KEY, deliveryInfo)
  }, [deliveryInfo])

  const addItem = useCallback((item: MenuItem, quantity = 1, selectedIngredients?: string[]) => {
    setItems((prev) => {
      const key = getCartKey(item.id, selectedIngredients)
      const existingItem = prev.find((i) => i.cartKey === key)
      if (existingItem) {
        return prev.map((i) =>
          i.cartKey === key ? { ...i, quantity: i.quantity + quantity } : i
        )
      }
      return [...prev, { ...item, quantity, selectedIngredients, cartKey: key }]
    })
  }, [])

  const removeItem = useCallback((cartKey: string) => {
    setItems((prev) => prev.filter((item) => item.cartKey !== cartKey))
  }, [])

  const updateQuantity = useCallback((cartKey: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.cartKey !== cartKey))
    } else {
      setItems((prev) =>
        prev.map((item) => (item.cartKey === cartKey ? { ...item, quantity } : item))
      )
    }
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    saveToStorage(CART_STORAGE_KEY, [])
    saveToStorage(CART_UPDATED_AT_KEY, Date.now())
  }, [])

  const setDeliveryInfo = useCallback((info: DeliveryInfo) => {
    setDeliveryInfoState(info)
  }, [])

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  )
  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  )

  const contextValue = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
      deliveryInfo,
      setDeliveryInfo,
    }),
    [items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice, deliveryInfo, setDeliveryInfo]
  )

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
