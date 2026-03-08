/**
 * Shared hook for menu data — all components use this so SWR
 * deduplicates into a single network request and single cache entry.
 */
"use client"

import useSWR from "swr"
import type { MenuItem } from "@/components/cart-provider"

const IS_DEV = process.env.NODE_ENV !== "production"

const fetcher = async (url: string) => {
  const cacheBustUrl = `${url}${url.includes("?") ? "&" : "?"}_t=${Date.now()}`
  const response = await fetch(cacheBustUrl, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
  })
  return response.json()
}

const SWR_OPTIONS = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: IS_DEV ? 1000 : 5000,
}

export function useMenu() {
  const { data, error, isLoading } = useSWR<{ data: MenuItem[]; error: string | null }>(
    "/api/menu",
    fetcher,
    SWR_OPTIONS
  )
  return {
    menuItems: data?.data || [],
    error: error || data?.error || null,
    isLoading,
  }
}
