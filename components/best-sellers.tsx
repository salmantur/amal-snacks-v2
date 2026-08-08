"use client"

import { SearchBar } from "@/components/search-bar"

interface BestSellersProps {
    searchQuery: string
    onSearchQueryChange: (value: string) => void
}

export function BestSellers({
    searchQuery,
    onSearchQueryChange,
}: BestSellersProps) {
    return (
          <section className="px-4 pb-2 pt-3 sm:pt-4">
                <SearchBar value={searchQuery} onChange={onSearchQueryChange} />
          </section>
          )
}
