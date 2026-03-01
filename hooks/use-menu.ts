/**
 * Shared hook for menu data — all components use this so SWR
 * deduplicates into a single network request and single cache entry.
 */
"use client"

import useSWR from "swr"
import type { MenuItem } from "@/components/cart-provider"

const fetcher = (url: string) => fetch(url).then(r => r.json())

const SWR_OPTIONS = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 300000, // 5 minutes
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
