"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import dynamic from "next/dynamic"
import { useSearchParams } from "next/navigation"
import { ProductCard, type TrayCardDesign } from "@/components/product-card"
import { PackageCard } from "@/components/package-card"
import { CategoryFilter } from "@/components/category-filter"
import { SearchBar } from "@/components/search-bar"
import { useCategories, type Category } from "@/hooks/use-categories"
import { useBestSellersConfig } from "@/hooks/use-best-sellers-config"
import { useMenu } from "@/hooks/use-menu"
import type { MenuItem } from "@/components/cart-provider"
import { getBestSellerCandidates } from "@/lib/best-sellers"
import { smartFilterMenuItems } from "@/lib/smart-search"
import { cn } from "@/lib/utils"

const ProductDrawer = dynamic(
  () => import("@/components/product-drawer").then((mod) => ({ default: mod.ProductDrawer })),
  { ssr: false }
)

const INITIAL_VISIBLE_ITEMS = 6
const SEARCH_SUGGESTIONS = ["سمبوسة", "سخانات", "باقة العيد", "Spring Rolls"]
const BEST_SELLERS_CATEGORY_ID = "best_sellers"
const BEST_SELLERS_CATEGORY: Category = {
  id: BEST_SELLERS_CATEGORY_ID,
  label: "الأكثر طلبًا",
  dbCategories: [],
  isVisible: true,
  sortOrder: 0,
  isCustom: false,
  sections: undefined,
}

export function MenuGrid() {
  const searchParams = useSearchParams()
  const { categories: allCategories } = useCategories()
  const categories = allCategories.filter((c) => c.isVisible)
  const categoriesForUi = useMemo<Category[]>(
    () => (categories.some((c) => c.id === BEST_SELLERS_CATEGORY_ID) ? categories : [BEST_SELLERS_CATEGORY, ...categories]),
    [categories]
  )
  const itemUiParam = searchParams.get("itemui")
  const itemVariant =
    itemUiParam === "glass" ||
    itemUiParam === "editorial" ||
    itemUiParam === "warm" ||
    itemUiParam === "minimal" ||
    itemUiParam === "neo"
      ? itemUiParam
      : "neo"
  const trayUiParam = searchParams.get("trayui")
  const trayCardDesign: TrayCardDesign =
    trayUiParam === "d2" || trayUiParam === "d3" || trayUiParam === "d1" ? trayUiParam : "d1"

  const { menuItems, error, isLoading: loading } = useMenu()
  const { orderIds: bestSellerOrder } = useBestSellersConfig()

  const [selectedCategory, setSelectedCategory] = useState(BEST_SELLERS_CATEGORY_ID)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null)
  const [showAllItems, setShowAllItems] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    setShowAllItems(false)

    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let idleId: number | null = null
    const revealAll = () => setShowAllItems(true)

    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(revealAll, { timeout: 250 })
    } else {
      timeoutId = setTimeout(revealAll, 120)
    }

    return () => {
      if (idleId !== null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId)
      }
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [selectedCategory, debouncedSearch])

  useEffect(() => {
    if (categoriesForUi.length === 0) return
    setSelectedCategory((prev) =>
      categoriesForUi.some((cat) => cat.id === prev) ? prev : BEST_SELLERS_CATEGORY_ID
    )
  }, [categoriesForUi])

  useEffect(() => {
    const handler = (e: Event) => {
      const catId = (e as CustomEvent).detail
      setSelectedCategory(catId)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
    window.addEventListener("selectCategory", handler)
    return () => window.removeEventListener("selectCategory", handler)
  }, [])

  const categoryConfig = useMemo(() => categoriesForUi.find((c) => c.id === selectedCategory), [selectedCategory, categoriesForUi])
  const dbCategories = useMemo(() => categoryConfig?.dbCategories || [], [categoryConfig])
  const sections = categoryConfig?.sections
  const isBestSellersCategory = selectedCategory === BEST_SELLERS_CATEGORY_ID

  const globalSearchResults = useMemo(() => {
    if (!debouncedSearch) return []
    return smartFilterMenuItems(menuItems, debouncedSearch)
  }, [menuItems, debouncedSearch])

  const isSearching = debouncedSearch.length > 0
  const shouldLimitItems = !isSearching && !showAllItems

  const getItemsForCategory = useCallback(
    (dbCategory: string) => {
      return menuItems.filter((item) => item.category === dbCategory)
    },
    [menuItems]
  )

  const featuredItems = useMemo(() => {
    return getBestSellerCandidates(menuItems, bestSellerOrder)
  }, [menuItems, bestSellerOrder])

  const filteredItems = useMemo(
    () => (isBestSellersCategory ? featuredItems : menuItems.filter((item) => dbCategories.includes(item.category))),
    [isBestSellersCategory, featuredItems, menuItems, dbCategories]
  )

  const visibleFilteredItems = useMemo(
    () => (shouldLimitItems ? filteredItems.slice(0, INITIAL_VISIBLE_ITEMS) : filteredItems),
    [filteredItems, shouldLimitItems]
  )

  return (
    <div className="min-h-screen bg-background">
      {error ? (
        <div className="mx-4 mt-4 p-4 bg-red-500 text-white rounded-lg font-medium">
          <p className="text-sm">{error}</p>
        </div>
      ) : null}

      <CategoryFilter selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} categories={categoriesForUi} />
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
          globalSearchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center" dir="rtl">
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-bold text-xl">لا توجد نتائج</p>
              <p className="text-[#4b5563] text-base mt-1">جرّب كتابة اسم الصنف بالعربي أو بالإنجليزي</p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {SEARCH_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setSearchQuery(suggestion)}
                    className="px-4 py-2 rounded-full border border-[#1e5631]/30 bg-white text-[#1e5631] text-sm hover:bg-[#1e5631]/5 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
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
                    priority={idx < 2}
                    variant={itemVariant}
                    trayDesign={trayCardDesign}
                    forceUnifiedStyle={isBestSellersCategory}
                  />
                ))}
              </div>
            </div>
          )
        ) : sections ? (
          <div className="space-y-10 md:space-y-16">
            {sections.map((section) => {
              const sectionItems = getItemsForCategory(section.dbCategory)
              const visibleSectionItems = shouldLimitItems ? sectionItems.slice(0, INITIAL_VISIBLE_ITEMS) : sectionItems
              if (sectionItems.length === 0) return null

              return (
                <div key={section.dbCategory} className={cn("contain-layout", section.dbCategory !== sections[0]?.dbCategory && "[content-visibility:auto] [contain-intrinsic-size:1px_1200px]")}>
                  <h2 className="text-xl md:text-2xl font-bold text-[#1e293b] text-right mb-4 md:mb-8">{section.label}</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
                    {visibleSectionItems.map((item, idx) =>
                      item.category === "eid" ? (
                        <PackageCard key={item.id} item={item} onSelect={setSelectedProduct} priority={idx < 4 && section.dbCategory === sections[0]?.dbCategory} variant={itemVariant} />
                      ) : (
                        <ProductCard key={item.id} item={item} onSelect={setSelectedProduct} priority={idx < 4 && section.dbCategory === sections[0]?.dbCategory} variant={itemVariant} trayDesign={trayCardDesign} />
                      )
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
            {visibleFilteredItems.map((item, idx) =>
              item.category === "eid" && !isBestSellersCategory ? (
                <PackageCard key={item.id} item={item} onSelect={setSelectedProduct} priority={idx < 2} variant={itemVariant} />
              ) : (
                <ProductCard
                  key={item.id}
                  item={item}
                  onSelect={setSelectedProduct}
                  priority={idx < 2}
                  variant={itemVariant}
                  trayDesign={trayCardDesign}
                  forceUnifiedStyle={isBestSellersCategory}
                />
              )
            )}
          </div>
        )}
      </div>

      {selectedProduct ? (
        <ProductDrawer product={selectedProduct} open={!!selectedProduct} onClose={() => setSelectedProduct(null)} />
      ) : null}
    </div>
  )
}
