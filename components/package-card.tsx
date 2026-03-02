"use client"

import React, { memo, useState } from "react"
import Image from "next/image"
import { Star, Package } from "lucide-react"
import { type MenuItem } from "@/components/cart-provider"

interface PackageCardProps {
  item: MenuItem
  onSelect: (item: MenuItem) => void
  priority?: boolean
}

export const PackageCard = memo(function PackageCard({ item, onSelect, priority = false }: PackageCardProps) {
  const [imgError, setImgError] = useState(false)
  const isOutOfStock = item.inStock === false

  return (
    <div
      onClick={() => !isOutOfStock && onSelect(item)}
      className={`cursor-pointer bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 transition-transform duration-100 ${!isOutOfStock ? "active:scale-[0.98]" : "opacity-60 cursor-not-allowed"}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && !isOutOfStock && onSelect(item)}
      aria-label={`${item.name} - ${item.price} ريال`}
    >
      {/* Image - wide banner */}
      <div className="relative w-full aspect-[16/9] bg-[#e8e8e8]">
        {item.image && !imgError ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            onError={() => setImgError(true)}
            priority={priority}
            loading={priority ? "eager" : "lazy"}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300">
            <Package className="h-12 w-12" />
          </div>
        )}

        {/* Price badge */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-2xl px-3 py-1.5 shadow">
          <span className="font-black text-[#1e293b] text-base">{item.price.toLocaleString()} ريال</span>
        </div>

        {/* Featured badge */}
        {item.isFeatured && (
          <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-900" />
            الأكثر طلباً
          </div>
        )}

        {/* Out of stock */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-gray-800 text-sm font-bold px-4 py-2 rounded-full">نفذت الكمية</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4" dir="rtl">
        {/* Name */}
        <h3 className="font-black text-[#1e293b] text-lg leading-tight">{item.name}</h3>
        {item.description && (
          <p className="text-gray-400 text-sm mt-0.5">{item.description}</p>
        )}

        {/* Package items list */}
        {item.packageItems && item.packageItems.length > 0 && (
          <div className="mt-3 space-y-2">
            {item.packageItems.map((pkg, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {pkg.included ? (
                    <span className="text-xs bg-yellow-100 text-yellow-700 font-bold px-2 py-0.5 rounded-full">مشمول</span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full">{pkg.quantity}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-[#1e293b]">{pkg.label}</span>
                  <span className="text-gray-400">
                    {pkg.included ? "🎁" : "🍽️"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <button
          className="mt-4 w-full py-3 bg-[#1e293b] text-white font-bold rounded-2xl text-sm active:scale-95 transition-transform"
          onClick={(e) => { e.stopPropagation(); !isOutOfStock && onSelect(item) }}
          disabled={isOutOfStock}
        >
          اطلب الآن
        </button>
      </div>
    </div>
  )
})
