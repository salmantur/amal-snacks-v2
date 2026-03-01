"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import useSWR from "swr"
import dynamic from "next/dynamic"
import { ProductCard } from "@/components/product-card"
import { CategoryFilter } from "@/components/category-filter"
import { SearchBar } from "@/components/search-bar"
import { useCategories } from "@/hooks/use-categories"
import type { MenuItem } from "@/components/cart-provider"

const ProductDrawer = dynamic(
  () => import("@/components/product-drawer").then((mod) => ({ default: mod.ProductDrawer })),
  { ssr: false }
)

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function MenuGrid() {
  const { categories: allCategories } = useCategories()
  const categories = allCategories.filter((c) => c.isVisible)

  const { data: result, error: fetchError, isLoading } = useSWR<{ data: MenuItem[]; error: string | null }>(
    "/api/menu",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300000, revalidateOnReconnect: false }
  )

  const menuItems = result?.data || []
  const error = fetchError ? (fetchError instanceof Error ? fetchError.message : "Unknown error") : result?.error || null
  const loading = isLoading

  const [selectedCategory, setSelectedCategory] = useState("platters_breakfast")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // When categories first load, reset selectedCategory to trigger re-render
  useEffect(() => {
    if (categories.length > 0) {
      setSelectedCategory(prev => prev) // force re-render with loaded categories
    }
  }, [categories.length])

  // Get current category config
  const categoryConfig = useMemo(
    () => categories.find(c => c.id === selectedCategory),
    [selectedCategory, categories]
  )
  const dbCategories = categoryConfig?.dbCategories || []
  const sections = categoryConfig?.sections

  // Global search — searches ALL items across ALL categories
  const globalSearchResults = useMemo(() => {
    if (!debouncedSearch) return []
    const q = debouncedSearch.toLowerCase()
    return menuItems.filter(item =>
      item.name.toLowerCase().includes(q) ||
      (item.nameEn || "").toLowerCase().includes(q) ||
      (item.description || "").toLowerCase().includes(q) ||
      (item.ingredients || []).some(ing => ing.toLowerCase().includes(q))
    )
  }, [menuItems, debouncedSearch])

  const isSearching = debouncedSearch.length > 0

  // Per-category filtered items (used when not searching)
  const getItemsForCategory = useCallback((dbCategory: string) => {
    return menuItems.filter((item) => item.category === dbCategory)
  }, [menuItems])

  // Flat filtered items for categories without sections (used when not searching)
  const filteredItems = useMemo(() => menuItems.filter((item) => {
    return dbCategories.includes(item.category)
  }), [menuItems, dbCategories])

  return (
    <div className="min-h-screen bg-background">
      {error && (
        <div className="mx-4 mt-4 p-4 bg-red-500 text-white rounded-lg font-medium">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <CategoryFilter
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categories={categories}
      />
      
      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 pb-32">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-3 md:space-y-4">
                <div className="aspect-square bg-gray-200 rounded-xl md:rounded-2xl animate-pulse" />
                <div className="h-3 md:h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                <div className="h-2 md:h-3 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : isSearching ? (
          // Global search results across ALL categories
          globalSearchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center" dir="rtl">
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-bold text-lg">لا توجد نتائج</p>
              <p className="text-muted-foreground text-sm mt-1">جرّب كلمة بحث مختلفة</p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground mb-4 text-right" dir="rtl">
                {globalSearchResults.length} نتيجة لـ "{debouncedSearch}"
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
                {globalSearchResults.map((item, idx) => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    onSelect={setSelectedProduct}
                    priority={idx < 4}
                  />
                ))}
              </div>
            </div>
          )
        ) : sections ? (
          // Render with sub-sections (like platters_breakfast)
          <div className="space-y-10 md:space-y-16">
            {sections.map((section) => {
              const sectionItems = getItemsForCategory(section.dbCategory)
              if (sectionItems.length === 0) return null
              return (
                <div key={section.dbCategory}>
                  <h2 className="text-xl md:text-2xl font-bold text-[#1e293b] text-right mb-4 md:mb-8">{section.label}</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
                    {sectionItems.map((item, idx) => (
                      <ProductCard key={item.id} item={item} onSelect={setSelectedProduct} priority={idx < 4} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          // Render as flat grid for other categories
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
            {filteredItems.map((item, idx) => (
              <ProductCard key={item.id} item={item} onSelect={setSelectedProduct} priority={idx < 4} />
            ))}
          </div>
        )}
      </div>

      <ProductDrawer
        product={selectedProduct}
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  )
}