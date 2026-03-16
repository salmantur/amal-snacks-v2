/**
 * Shared hook for menu data so components reuse one cache entry.
 */
"use client"

import useSWR from "swr"
import type { MenuItem } from "@/components/cart-provider"
import { decodePossibleMojibake } from "@/lib/text"

const IS_DEV = process.env.NODE_ENV !== "production"

const fetcher = async (url: string) => {
  const response = await fetch(url, {
    cache: IS_DEV ? "no-store" : "default",
    headers: IS_DEV ? { "Cache-Control": "no-cache" } : undefined,
  })
  const json = (await response.json()) as {
    data?: MenuItem[]
    error?: string | null
  }

  return {
    error: json.error ?? null,
    data: (json.data || []).map((item) => ({
      ...item,
      name: decodePossibleMojibake(item.name || ""),
      nameEn: decodePossibleMojibake(item.nameEn || ""),
      description: decodePossibleMojibake(item.description || ""),
      ingredients: Array.isArray(item.ingredients)
        ? item.ingredients.map((ingredient) =>
            decodePossibleMojibake(String(ingredient || "")),
          )
        : item.ingredients,
      packageItems: Array.isArray(item.packageItems)
        ? item.packageItems.map((pkg) => ({
            ...pkg,
            label: decodePossibleMojibake(String(pkg.label || "")),
          }))
        : item.packageItems,
    })),
  } satisfies { data: MenuItem[]; error: string | null }
}

const SWR_OPTIONS = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: IS_DEV ? 1000 : 5000,
}

export function useMenu() {
  const { data, error, isLoading } = useSWR<{ data: MenuItem[]; error: string | null }>(
    "/api/menu",
    fetcher,
    SWR_OPTIONS,
  )

  return {
    menuItems: data?.data || [],
    error: error || data?.error || null,
    isLoading,
  }
}
