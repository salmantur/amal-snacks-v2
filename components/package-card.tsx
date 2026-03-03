"use client"

import React, { memo, useState } from "react"
import Image from "next/image"
import { Star, Search, Plus, Minus, ShoppingBag } from "lucide-react"
import { type MenuItem } from "@/components/cart-provider"

interface PackageCardProps {
  item: MenuItem
  onSelect: (item: MenuItem) => void
  priority?: boolean
}

export const PackageCard = memo(function PackageCard({ item, onSelect, priority = false }: PackageCardProps) {
  const [imgError, setImgError] = useState(false)
  const [qty, setQty] = useState(1)
  const isOutOfStock = item.inStock === false
  const required = item.limit || 4

  return (
    <div className="col-span-2 bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100" dir="rtl">

      {/* Image */}
      <div className="relative w-full aspect-[16/9] bg-[#e8e8e8]">
        {item.image && !imgError ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="100vw"
            className="object-cover"
            onError={() => setImgError(true)}
            priority={priority}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300">
            <ShoppingBag className="h-12 w-12" />
          </div>
        )}

        {/* Price badge */}
        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-2xl px-3 py-1.5 shadow">
          <span className="font-black text-[#1e293b]">{item.price.toLocaleString()} ريال</span>
        </div>

        {/* Featured badge */}
        {item.isFeatured && (
          <div className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-900" />
            الأكثر طلباً
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-gray-800 text-sm font-bold px-4 py-2 rounded-full">نفذت الكمية</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">

        {/* Name */}
        <h3 className="font-black text-[#1e293b] text-lg">{item.name}</h3>
        {item.description && <p className="text-gray-400 text-xs -mt-2">{item.description}</p>}

        {/* Heaters row */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => !isOutOfStock && onSelect(item)}
            className="flex items-center gap-1.5 bg-[#1e293b] text-white text-xs font-bold px-3 py-1.5 rounded-full active:scale-95 transition-transform"
          >
            اختر←
          </button>
          <div className="flex items-center gap-2 text-sm text-[#1e293b]">
            <Search className="h-4 w-4 text-gray-400" />
            <span className="font-semibold">{required} سخانات</span>
          </div>
        </div>

        {/* Included: بلاتر الاجبان */}
        <div className="flex items-center justify-between">
          <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full">مشمول ⭐</span>
          <span className="font-semibold text-sm text-[#1e293b]">بلاتر الاجبان</span>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Add to cart row */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => !isOutOfStock && onSelect(item)}
            disabled={isOutOfStock}
            className="flex-1 py-3 bg-[#1e293b] text-white font-bold rounded-2xl text-sm active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <ShoppingBag className="h-4 w-4" />
            أضف للسلة
          </button>

          {/* Quantity */}
          <div className="flex items-center gap-2 bg-[#f5f5f5] rounded-2xl px-2 py-1">
            <button
              onClick={() => setQty(q => Math.max(1, q - 1))}
              className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-95"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-5 text-center font-bold text-sm">{qty}</span>
            <button
              onClick={() => setQty(q => q + 1)}
              className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-95"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Total */}
        <p className="text-sm text-gray-500 text-center">
          المجموع: <span className="font-bold text-[#1e293b]">{(item.price * qty).toLocaleString()} ريال</span>
        </p>

      </div>
    </div>
  )
})