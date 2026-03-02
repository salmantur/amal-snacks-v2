"use client"

import React, { memo, useState } from "react"
import Image from "next/image"
import { Star, Gift } from "lucide-react"
import { type MenuItem } from "@/components/cart-provider"

interface PackageCardProps {
  item: MenuItem
  onSelect: (item: MenuItem) => void
  priority?: boolean
}

export const PackageCard = memo(function PackageCard({ item, onSelect, priority = false }: PackageCardProps) {
  const [imgError, setImgError] = useState(false)
  const isOutOfStock = item.inStock === false
  const required = item.limit || 4

  return (
    <div
      className={`bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 col-span-2 ${isOutOfStock ? "opacity-60" : ""}`}
      dir="rtl"
    >
      {/* Image */}
      <div className="relative w-full aspect-[16/9] bg-[#e8e8e8]">
        {item.image && !imgError ? (
          <Image src={item.image} alt={item.name} fill sizes="100vw" className="object-cover" onError={() => setImgError(true)} priority={priority} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300">
            <Gift className="h-12 w-12" />
          </div>
        )}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-2xl px-3 py-1.5 shadow">
          <span className="font-black text-[#1e293b] text-base">{item.price.toLocaleString()} ريال</span>
        </div>
        {item.isFeatured && (
          <div className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-900" />الأكثر طلباً
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-gray-800 text-sm font-bold px-4 py-2 rounded-full">نفذت الكمية</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-black text-[#1e293b] text-xl">{item.name}</h3>
        {item.description && <p className="text-gray-400 text-sm mt-0.5">{item.description}</p>}

        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between p-3 bg-[#f5f5f5] rounded-2xl">
            <span className="text-xs bg-gray-200 text-gray-700 font-bold px-2.5 py-1 rounded-full">🔍 {required} سخانات</span>
            <span className="font-semibold text-sm text-[#1e293b]">اختر {required} سخانات</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-100 rounded-2xl">
            <span className="text-xs bg-yellow-400 text-yellow-900 font-bold px-2.5 py-1 rounded-full">مشمول ⭐</span>
            <span className="font-semibold text-sm text-[#1e293b]">بلاتر الاجبان</span>
          </div>
        </div>

        <button
          onClick={() => !isOutOfStock && onSelect(item)}
          disabled={isOutOfStock}
          className="mt-4 w-full py-3.5 bg-[#1e293b] text-white font-bold rounded-2xl text-sm active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <Gift className="h-4 w-4" />
          اطلب الباقة
        </button>
      </div>
    </div>
  )
})