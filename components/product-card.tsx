"use client"

import React, { memo, useState } from "react"
import Image from "next/image"
import { ShoppingBag, Star } from "lucide-react"
import { type MenuItem } from "@/components/cart-provider"

interface ProductCardProps {
  item: MenuItem
  onSelect: (item: MenuItem) => void
  priority?: boolean   // pass true for first ~4 visible cards
}

export const ProductCard = memo(function ProductCard({ item, onSelect, priority = false }: ProductCardProps) {
  const [imgError, setImgError] = useState(false)

  return (
    <div
      onClick={() => item.inStock !== false && onSelect(item)}
      // active:scale gives instant tactile feedback on both iOS and Android
      className={`cursor-pointer group transition-transform duration-100 ${item.inStock !== false ? "active:scale-95" : "opacity-60 cursor-not-allowed"}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(item)}
      aria-label={`${item.name} - ${item.price} ريال`}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#e8e8e8]">
        {item.image && !imgError ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <ShoppingBag className="h-8 w-8" />
          </div>
        )}
        {item.isFeatured && (
          <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
            <Star className="h-2.5 w-2.5 fill-yellow-900" />
            الأكثر
          </div>
        )}
        {item.inStock === false && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
            <span className="bg-white text-gray-800 text-xs font-bold px-3 py-1 rounded-full">نفذت الكمية</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mt-4 text-right">
        <h3 className="font-bold text-[#1e293b] text-base leading-tight">{item.name}</h3>
        <p className="text-gray-500 text-sm mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
        <p className="text-[#1e293b] font-bold mt-2">{item.price} ريال</p>
      </div>
    </div>
  )
})