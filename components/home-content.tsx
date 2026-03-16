"use client"

import { useState } from "react"
import { BestSellers } from "@/components/best-sellers"
import { MenuGrid } from "@/components/menu-grid"

export function HomeContent() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <>
      <BestSellers searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} />
      <MenuGrid searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} />
    </>
  )
}
