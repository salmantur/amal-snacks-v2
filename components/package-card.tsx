"use client"

import React, { memo, useState } from "react"
import Image from "next/image"
import { Search, ShoppingBag } from "lucide-react"
import { type MenuItem } from "@/components/cart-provider"
import { getEidRequiredHeaters } from "@/lib/eid-packages"
import { cn } from "@/lib/utils"
import type { ItemCardVariant } from "@/components/product-card"
import { PriceWithRiyalLogo } from "@/components/ui/price-with-riyal-logo"

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
        container:
          "bg-white/55 border-white/70 backdrop-blur-xl rounded-3xl shadow-[0_10px_24px_rgba(0,0,0,0.10)]",
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
  const isOutOfStock = item.inStock === false
  const required = getEidRequiredHeaters(item)
  const v = getVariantStyles(variant)
  const useThemeCardColors = variant === "neo"
  const cardSurfaceStyle = useThemeCardColors
    ? { backgroundColor: "var(--item-card-bg)" }
    : undefined
  const titleColorStyle = useThemeCardColors
    ? { color: "var(--item-card-title)" }
    : undefined
  const descColorStyle = useThemeCardColors
    ? { color: "var(--item-card-desc)" }
    : undefined
  const priceColorStyle = useThemeCardColors
    ? { color: "var(--item-card-price)" }
    : undefined

  return (
    <div
      className={cn(
        "col-span-1 min-[390px]:col-span-2 overflow-hidden border",
        v.container,
      )}
      dir="rtl"
      style={cardSurfaceStyle}
    >
      <div className="relative aspect-[16/9] w-full bg-[#e8e8e8]">
        {item.image && !imgError ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 389px) 94vw, (max-width: 768px) 94vw, (max-width: 1280px) 62vw, 700px"
            quality={72}
            className="object-cover"
            onError={() => setImgError(true)}
            priority={priority}
            loading={priority ? "eager" : "lazy"}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300">
            <ShoppingBag className="h-12 w-12" />
          </div>
        )}

        <div className="absolute bottom-3 right-3 rounded-2xl bg-white/90 px-3 py-1.5 shadow backdrop-blur-sm">
          <span className="font-black text-[#1e293b]" style={priceColorStyle}>
            <PriceWithRiyalLogo value={item.price} />
          </span>
        </div>

        {isOutOfStock ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-gray-800">
              نفذت الكمية
            </span>
          </div>
        ) : null}
      </div>

      <div className="space-y-3 p-4">
        <h3 className="text-lg font-black text-[#1e293b]" style={titleColorStyle}>
          {item.name}
        </h3>
        {item.description ? (
          <p className="-mt-2 text-xs text-gray-500" style={descColorStyle}>
            {item.description}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-[#1e293b]">
            <Search className="h-4 w-4 text-gray-400" />
            <span className="font-semibold">{required} سخانات</span>
          </div>
          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-700">
            يشمل بلاتر الأجبان
          </span>
        </div>

        <div className="border-t border-gray-100" />

        <button
          type="button"
          onClick={() => !isOutOfStock && onSelect(item)}
          disabled={isOutOfStock}
          className={cn(
            "flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold transition-transform active:scale-95",
            v.cta,
            isOutOfStock && "cursor-not-allowed opacity-50",
          )}
        >
          <ShoppingBag className="h-4 w-4" />
          خصص الباقة
        </button>
      </div>
    </div>
  )
})
