"use client"

import React, { memo, useState } from "react"
import Image from "next/image"
import { ShoppingBag } from "lucide-react"
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
      onClick={() => onSelect(item)}
      // active:scale gives instant tactile feedback on both iOS and Android
      className="cursor-pointer group active:scale-95 transition-transform duration-100"
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