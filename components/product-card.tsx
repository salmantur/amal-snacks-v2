"use client"

import React, { memo, useState } from "react"
import Image from "next/image"
import { ShoppingBag, Star, Clock3, Users } from "lucide-react"
import { type MenuItem } from "@/components/cart-provider"

interface ProductCardProps {
  item: MenuItem
  onSelect: (item: MenuItem) => void
  priority?: boolean
}

export const ProductCard = memo(function ProductCard({ item, onSelect, priority = false }: ProductCardProps) {
  const [imgError, setImgError] = useState(false)
  const portions = item.limit && item.limit > 0 ? item.limit : null
  const prepMinutes = item.makingTime && item.makingTime > 0 ? item.makingTime : null

  return (
    <div
      onClick={() => item.inStock !== false && onSelect(item)}
      className={`cursor-pointer group transition-transform duration-100 ${item.inStock !== false ? "active:scale-95" : "opacity-60 cursor-not-allowed"}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect(item)}
      aria-label={`${item.name} - ${item.price} ريال`}
    >
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
            loading={priority ? "eager" : "lazy"}
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

      <div className="mt-4 text-right">
        <h3 className="font-bold text-[#1e293b] text-base leading-tight">{item.name}</h3>
        <p className="text-gray-500 text-sm mt-1 line-clamp-2 leading-relaxed">{item.description}</p>

        <div className="mt-2 flex flex-wrap justify-end gap-2">
          {prepMinutes ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold px-2.5 py-1">
              <Clock3 className="h-3 w-3" />
              {prepMinutes} د
            </span>
          ) : null}
          {portions ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold px-2.5 py-1">
              <Users className="h-3 w-3" />
              يكفي {portions}
            </span>
          ) : null}
          {item.isFeatured ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 text-yellow-800 text-[11px] font-semibold px-2.5 py-1">
              <Star className="h-3 w-3 fill-yellow-700 text-yellow-700" />
              الأكثر طلبًا
            </span>
          ) : null}
        </div>

        <p className="text-[#1e293b] font-bold mt-2">{item.price} ريال</p>
      </div>
    </div>
  )
})
