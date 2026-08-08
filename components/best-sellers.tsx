"use client"

import { Star } from "lucide-react"
import { useState } from "react"
import dynamic from "next/dynamic"
import type { MenuItem } from "@/components/cart-provider"
import { SearchBar } from "@/components/search-bar"
import { ProductCard } from "@/components/product-card"
import { useMenu } from "@/hooks/use-menu"
import { trackStorefrontEvent } from "@/lib/storefront-events"

const ProductDrawer = dynamic(
  () => import("@/components/product-drawer").then((mod) => ({ default: mod.ProductDrawer })),
  { ssr: false }
)

interface BestSellersProps {
  searchQuery: string
  onSearchQueryChange: (value: string) => void
}

export function BestSellers({
  searchQuery,
  onSearchQueryChange,
}: BestSellersProps) {
  const { menuItems } = useMenu()
  const [selected, setSelected] = useState<MenuItem | null>(null)

  const featured = menuItems.filter((item) => item.isFeatured)

  return (
    <>
      <section className="px-4 pb-2 pt-3 sm:pt-4">
        <SearchBar value={searchQuery} onChange={onSearchQueryChange} />

        {featured.length > 0 ? (
          <>
            <div className="mb-3 mt-4 flex items-center gap-2" dir="rtl">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-yellow-100">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-base font-bold">الأكثر طلبا</h2>
                <p className="text-xs text-muted-foreground">
                  أبرز الأصناف التي يختارها العملاء
                </p>
              </div>
            </div>

            <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 touch-pan-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {featured.map((item, idx) => (
                <div key={item.id} className="w-[11rem] min-[390px]:w-40 snap-start flex-shrink-0">
                  <ProductCard
                    item={item}
                    onSelect={(selectedItem) => {
                      trackStorefrontEvent("best_seller_selected", {
                        productId: selectedItem.id,
                        category: selectedItem.category,
                      })
                      setSelected(selectedItem)
                    }}
                    bestSellerStyle="s4"
                    priority={idx < 2}
                  />
                </div>
              ))}
            </div>
          </>
        ) : null}
      </section>

      <ProductDrawer
        product={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </>
  )
}
