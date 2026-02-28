"use client"

import Image from "next/image"
import { Star, ShoppingBag } from "lucide-react"
import useSWR from "swr"
import { useState } from "react"
import { ProductDrawer } from "@/components/product-drawer"
import type { MenuItem } from "@/components/cart-provider"

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function BestSellers() {
  const { data: result } = useSWR<{ data: MenuItem[] }>("/api/menu", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000,
  })
  const [selected, setSelected] = useState<MenuItem | null>(null)

  const featured = (result?.data || []).filter(item => item.isFeatured)
  if (featured.length === 0) return null

  return (
    <>
      <section className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-3" dir="rtl">
          <div className="w-8 h-8 rounded-xl bg-yellow-100 flex items-center justify-center">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-400" />
          </div>
          <div>
            <h2 className="font-bold text-base">الأكثر طلباً</h2>
            <p className="text-xs text-muted-foreground">أبرز ما يطلبه عملاؤنا</p>
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4" style={{ scrollbarWidth: "none" }}>
          {featured.map(item => (
            <button
              key={item.id}
              onClick={() => setSelected(item)}
              className="flex-shrink-0 w-40 bg-white rounded-2xl overflow-hidden shadow-sm active:scale-95 transition-transform text-right"
            >
              <div className="relative w-full bg-[#f5f5f5]" style={{ aspectRatio: "4/3" }}>
                {item.image
                  ? <Image src={item.image} alt={item.name} fill className="object-cover" />
                  : <div className="absolute inset-0 flex items-center justify-center"><ShoppingBag className="h-8 w-8 text-gray-200" /></div>
                }
                <span className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="h-2.5 w-2.5 fill-yellow-900" /> الأكثر
                </span>
              </div>
              <div className="p-2.5" dir="rtl">
                <p className="font-bold text-sm truncate">{item.name}</p>
                {item.nameEn && <p className="text-xs text-muted-foreground truncate">{item.nameEn}</p>}
                <p className="text-sm font-bold text-primary mt-1">{item.price} ر.س</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <ProductDrawer
        product={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </>
  )
}
