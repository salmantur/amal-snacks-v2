"use client"

import React, { memo, useState } from "react"
import Image from "next/image"
import { Star, Search, Plus, Minus, ShoppingBag } from "lucide-react"
import { type MenuItem } from "@/components/cart-provider"
import { getEidRequiredHeaters } from "@/lib/eid-packages"
import { cn } from "@/lib/utils"
import type { ItemCardVariant } from "@/components/product-card"

interface PackageCardProps {
  item: MenuItem
  onSelect: (item: MenuItem) => void
  priority?: boolean
  variant?: ItemCardVariant
}

function getVariantStyles(variant: ItemCardVariant) {
  switch (variant) {
    case "glass":
      return {
        container: "bg-white/55 border-white/70 backdrop-blur-xl rounded-3xl shadow-[0_10px_24px_rgba(0,0,0,0.10)]",
        cta: "bg-white/70 text-slate-900 border border-white/70",
      }
    case "editorial":
      return {
        container: "bg-white border-black/10 rounded-none shadow-none",
        cta: "bg-black text-white border border-black",
      }
    case "warm":
      return {
        container: "bg-[#fff8ef] border-[#f0dfc9] rounded-3xl shadow-sm",
        cta: "bg-[#6b3f1f] text-white border border-[#6b3f1f]",
      }
    case "minimal":
      return {
        container: "bg-white border-gray-200 rounded-2xl shadow-none",
        cta: "bg-gray-900 text-white border border-gray-900",
      }
    default:
      return {
        container: "bg-white border-gray-100 rounded-3xl shadow-sm",
        cta: "bg-[#1e293b] text-white border border-[#1e293b]",
      }
  }
}

export const PackageCard = memo(function PackageCard({
  item,
  onSelect,
  priority = false,
  variant = "neo",
}: PackageCardProps) {
  const [imgError, setImgError] = useState(false)
  const [qty, setQty] = useState(1)
  const isOutOfStock = item.inStock === false
  const required = getEidRequiredHeaters(item)
  const v = getVariantStyles(variant)

  return (
    <div className={cn("col-span-2 overflow-hidden border", v.container)} dir="rtl">
      <div className="relative w-full aspect-[16/9] bg-[#e8e8e8]">
        {item.image && !imgError ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 94vw, (max-width: 1280px) 62vw, 700px"
            quality={72}
            className="object-cover"
            onError={() => setImgError(true)}
            priority={priority}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300">
            <ShoppingBag className="h-12 w-12" />
          </div>
        )}

        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-2xl px-3 py-1.5 shadow">
          <span className="font-black text-[#1e293b]">{item.price.toLocaleString()} ريال</span>
        </div>

        {item.isFeatured ? (
          <div className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-900" />
            الأكثر طلبًا
          </div>
        ) : null}

        {isOutOfStock ? (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-gray-800 text-sm font-bold px-4 py-2 rounded-full">نفذت الكمية</span>
          </div>
        ) : null}
      </div>

      <div className="p-4 space-y-3">
        <h3 className="font-black text-[#1e293b] text-lg">{item.name}</h3>
        {item.description ? <p className="text-gray-500 text-xs -mt-2">{item.description}</p> : null}

        <div className="flex items-center justify-between">
          <button onClick={() => !isOutOfStock && onSelect(item)} className="flex items-center gap-1.5 bg-[#1e293b] text-white text-xs font-bold px-3 py-1.5 rounded-full active:scale-95 transition-transform">
            اختر ←
          </button>
          <div className="flex items-center gap-2 text-sm text-[#1e293b]">
            <Search className="h-4 w-4 text-gray-400" />
            <span className="font-semibold">{required} سخانات</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full">مشمول ⭐</span>
          <span className="font-semibold text-sm text-[#1e293b]">بلاتر الاجبان</span>
        </div>

        <div className="border-t border-gray-100" />

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => !isOutOfStock && onSelect(item)}
            disabled={isOutOfStock}
            className={cn("flex-1 py-3 font-bold rounded-2xl text-sm active:scale-95 transition-transform flex items-center justify-center gap-2", v.cta)}
          >
            <ShoppingBag className="h-4 w-4" />
            أضف للسلة
          </button>

          <div className="flex items-center gap-2 bg-[#f5f5f5] rounded-2xl px-2 py-1">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-95">
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-5 text-center font-bold text-sm">{qty}</span>
            <button onClick={() => setQty((q) => q + 1)} className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-95">
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-500 text-center">
          المجموع: <span className="font-bold text-[#1e293b]">{(item.price * qty).toLocaleString()} ريال</span>
        </p>
      </div>
    </div>
  )
})
