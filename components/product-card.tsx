"use client"

import React, { memo, useState } from "react"
import Image from "next/image"
import { ShoppingBag, Star, Users } from "lucide-react"
import { type MenuItem } from "@/components/cart-provider"
import { cn } from "@/lib/utils"

export type ItemCardVariant = "neo" | "glass" | "editorial" | "warm" | "minimal"

interface ProductCardProps {
  item: MenuItem
  onSelect: (item: MenuItem) => void
  priority?: boolean
  variant?: ItemCardVariant
}

function getVariantStyles(variant: ItemCardVariant) {
  switch (variant) {
    case "glass":
      return {
        container: "rounded-3xl p-2 bg-white/50 backdrop-blur-lg border border-white/60 shadow-[0_10px_24px_rgba(0,0,0,0.10)]",
        image: "rounded-2xl",
        content: "px-1 pb-2",
        title: "text-slate-900",
        desc: "text-slate-600",
        price: "text-slate-900",
      }
    case "editorial":
      return {
        container: "rounded-none border-y border-black/10 py-2",
        image: "rounded-none",
        content: "px-0 pb-0",
        title: "text-black tracking-tight",
        desc: "text-black/60",
        price: "text-black",
      }
    case "warm":
      return {
        container: "rounded-3xl p-2 bg-[#fff8ef] border border-[#f0dfc9] shadow-sm",
        image: "rounded-2xl",
        content: "px-1 pb-1",
        title: "text-[#6b3f1f]",
        desc: "text-[#8a6a4b]",
        price: "text-[#6b3f1f]",
      }
    case "minimal":
      return {
        container: "rounded-2xl p-0",
        image: "rounded-2xl",
        content: "px-0 pb-0",
        title: "text-[#111827]",
        desc: "text-[#6b7280]",
        price: "text-[#111827]",
      }
    default:
      return {
        container: "rounded-2xl p-0",
        image: "rounded-2xl",
        content: "px-0 pb-0",
        title: "text-[#1e293b]",
        desc: "text-gray-500",
        price: "text-[#1e293b]",
      }
  }
}

export const ProductCard = memo(function ProductCard({
  item,
  onSelect,
  priority = false,
  variant = "neo",
}: ProductCardProps) {
  const [imgError, setImgError] = useState(false)
  const portions = item.limit && item.limit > 0 ? item.limit : null
  const v = getVariantStyles(variant)

  return (
    <div
      onClick={() => item.inStock !== false && onSelect(item)}
      className={cn(
        "cursor-pointer group transition-transform duration-100",
        item.inStock !== false ? "active:scale-95" : "opacity-60 cursor-not-allowed",
        v.container
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect(item)}
      aria-label={`${item.name} - ${item.price} ريال`}
    >
      <div className={cn("relative aspect-square overflow-hidden bg-[#e8e8e8]", v.image)}>
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

        {item.isFeatured ? (
          <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
            <Star className="h-2.5 w-2.5 fill-yellow-900" />
            الأكثر
          </div>
        ) : null}

        {item.inStock === false ? (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-gray-800 text-xs font-bold px-3 py-1 rounded-full">نفذت الكمية</span>
          </div>
        ) : null}
      </div>

      <div className={cn("mt-4 text-right", v.content)}>
        <h3 className={cn("font-bold text-base leading-tight", v.title)}>{item.name}</h3>
        <p className={cn("text-sm mt-1 line-clamp-2 leading-relaxed", v.desc)}>{item.description}</p>

        <div className="mt-2 flex flex-wrap justify-end gap-2">
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

        <p className={cn("font-bold mt-2", v.price)}>{item.price} ريال</p>
      </div>
    </div>
  )
})
