"use client"

import Image from "next/image"
import { Star, ShoppingBag } from "lucide-react"
import { useState } from "react"
import type { MenuItem } from "@/components/cart-provider"
import { ProductDrawer } from "@/components/product-drawer"
import { SearchBar } from "@/components/search-bar"
import { PriceWithRiyalLogo } from "@/components/ui/price-with-riyal-logo"
import { useMenu } from "@/hooks/use-menu"
import { trackStorefrontEvent } from "@/lib/storefront-events"

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
                <button
                  type="button"
                  key={item.id}
                  onClick={() => {
                    trackStorefrontEvent("best_seller_selected", {
                      productId: item.id,
                      category: item.category,
                    })
                    setSelected(item)
                  }}
                  className="w-[11rem] min-[390px]:w-40 snap-start flex-shrink-0 overflow-hidden rounded-2xl border border-black/5 bg-white text-right shadow-sm transition-transform active:scale-95"
                >
                  <div
                    className="relative w-full bg-[#f5f5f5]"
                    style={{ aspectRatio: "4/3" }}
                  >
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="(max-width: 640px) 44vw, 160px"
                        quality={68}
                        priority={idx < 2}
                        loading={idx < 2 ? "eager" : "lazy"}
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ShoppingBag className="h-8 w-8 text-gray-200" />
                      </div>
                    )}
                  </div>
                  <div className="p-2.5" dir="rtl">
                    <p className="truncate text-sm font-bold">{item.name}</p>
                    {item.nameEn ? (
                      <p className="truncate text-xs text-muted-foreground">
                        {item.nameEn}
                      </p>
                    ) : null}
                    <p className="mt-1 text-sm font-bold text-primary">
                      <PriceWithRiyalLogo value={item.price} />
                    </p>
                  </div>
                </button>
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
