"use client"

import React, { memo, useState } from "react"
import Image from "next/image"
import { ShoppingBag, Star } from "lucide-react"
import { type MenuItem } from "@/components/cart-provider"
import { cn } from "@/lib/utils"
import { PriceWithRiyalLogo } from "@/components/ui/price-with-riyal-logo"

export type ItemCardVariant = "neo" | "glass" | "editorial" | "warm" | "minimal"
export type TrayCardDesign = "d1" | "d2" | "d3"

interface ProductCardProps {
  item: MenuItem
  onSelect: (item: MenuItem) => void
  priority?: boolean
  variant?: ItemCardVariant
  trayDesign?: TrayCardDesign
  forceUnifiedStyle?: boolean
}

function parseVariantOption(raw: string, fallbackPrice: number): { label: string; price: number } {
  const value = (raw || "").trim()
  if (!value) return { label: "", price: fallbackPrice }
  const [labelPart, pricePart] = value.split("::")
  const label = (labelPart || value).trim()
  const parsedPrice = Number((pricePart || "").replace(/[^\d.]/g, ""))
  return {
    label,
    price: Number.isFinite(parsedPrice) && parsedPrice > 0 ? parsedPrice : fallbackPrice,
  }
}

function getTraySizeChipLabel(label: string): string {
  const normalized = label.trim().toLowerCase()
  if (normalized.startsWith("صغير") || normalized.startsWith("small") || normalized.startsWith("s ")) return "صغير"
  if (normalized.startsWith("وسط") || normalized.startsWith("medium") || normalized.startsWith("m ")) return "وسط"
  if (normalized.startsWith("كبير") || normalized.startsWith("large") || normalized.startsWith("l ")) return "كبير"
  return label.split(/[\s(]/)[0] || label
}

function getTraySizeOrder(label: string): number {
  const chip = getTraySizeChipLabel(label)
  if (chip === "صغير") return 0
  if (chip === "وسط") return 1
  if (chip === "كبير") return 2
  return 99
}

function getMenuStorageBase(image: string): string {
  const marker = "/storage/v1/object/public/Menu/"
  const idx = image.indexOf(marker)
  if (idx === -1) return ""
  return image.slice(0, idx + marker.length)
}

function normalizeMenuImageSrc(src: string, base: string): string | null {
  const value = (src || "").trim()
  if (!value) return null
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("data:") || value.startsWith("blob:")) {
    return value
  }
  if (value.startsWith("/")) return value
  return base ? `${base}${value}` : null
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

function getTrayCardStyles(design: TrayCardDesign) {
  if (design === "d2") {
    return {
      shell: "relative rounded-[24px] border border-[#d6dde8] bg-[#f7fbff] p-2.5 shadow-sm",
      circleShell: "absolute inset-0 rounded-full bg-[linear-gradient(145deg,#deefff_0%,#f7fbff_100%)] shadow-[0_6px_14px_rgba(59,130,246,0.12)]",
      circleInset: "absolute inset-[5px] rounded-full overflow-hidden bg-white",
      price: "inline-flex items-center rounded-full border border-[#c8d7ec] bg-[#eef4ff] px-3 py-1 text-sm font-bold text-[#1f3558]",
      title: "text-[#1f3558]",
      desc: "text-[#4f6588]",
      chipActive: "ring-[#5b8bd7]",
    }
  }

  if (design === "d3") {
    return {
      shell: "relative rounded-[28px] border border-white/70 bg-white/45 backdrop-blur-md p-2.5 shadow-[0_14px_30px_rgba(0,0,0,0.12)]",
      circleShell: "absolute inset-0 rounded-full bg-[linear-gradient(140deg,#f2ecff_0%,#f7f6ff_100%)] shadow-[0_8px_16px_rgba(100,72,180,0.15)]",
      circleInset: "absolute inset-[5px] rounded-full overflow-hidden bg-white/70",
      price: "inline-flex items-center rounded-full border border-white/80 bg-white/70 px-3 py-1 text-sm font-bold text-[#2f2b52] shadow-sm",
      title: "text-[#2f2b52]",
      desc: "text-[#6a6791]",
      chipActive: "ring-[#9a7be3]",
    }
  }

  return {
    shell: "relative rounded-[26px] border border-[#efced7] bg-[linear-gradient(130deg,#f6dfe5_0%,#f7f4e8_100%)] p-2.5 shadow-[0_8px_18px_rgba(155,117,133,0.12)]",
    circleShell: "absolute inset-0 rounded-full bg-[linear-gradient(140deg,#f6e0e7_0%,#f8f3ea_100%)] shadow-[0_6px_14px_rgba(0,0,0,0.08)]",
    circleInset: "absolute inset-[5px] rounded-full overflow-hidden bg-white/80",
    price: "inline-flex items-center rounded-full border border-[#e7d9dd] bg-white/80 px-3 py-1 text-sm font-bold text-[#2a2a35]",
    title: "text-[#2a2a35]",
    desc: "text-[#727385]",
    chipActive: "ring-[#d16f89]",
  }
}

export const ProductCard = memo(function ProductCard({
  item,
  onSelect,
  priority = false,
  variant = "neo",
  trayDesign = "d1",
  forceUnifiedStyle = false,
}: ProductCardProps) {
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({})
  const [traySizeIndex, setTraySizeIndex] = useState(0)
  const v = getVariantStyles(variant)
  const trayStyle = getTrayCardStyles(trayDesign)
  const menuStorageBase = getMenuStorageBase(item.image || "")
  const normalizedAllImages = Array.from(
    new Set(
      [item.image, ...(item.images || [])]
        .map((img) => normalizeMenuImageSrc(String(img || ""), menuStorageBase))
        .filter((img): img is string => Boolean(img))
    )
  )
  const variantOptions = (item.ingredients || []).map((raw) => parseVariantOption(raw, item.price))
  const variantPrices = variantOptions.map((option) => option.price).filter((price): price is number => typeof price === "number")
  const hasVariantPricing = (item.limit || 0) === 1 && variantPrices.length > 0
  const isTraySizeVariantCard =
    item.category === "trays" && (item.limit || 0) === 1 && (item.ingredients || []).some((raw) => raw.includes("::"))
  const normalizedNameAr = (item.name || "").replace(/\s+/g, "")
  const normalizedNameEn = (item.nameEn || "").trim().toLowerCase()
  const isMusakhanCard =
    normalizedNameAr.includes("مسخن") || normalizedNameEn.includes("musakhan") || normalizedNameEn.includes("muskhan")
  const useFloatingTrayStyle = forceUnifiedStyle || isTraySizeVariantCard || isMusakhanCard

  const trayCardOptions = isTraySizeVariantCard
    ? variantOptions
        .map((option, index) => ({
          ...option,
          image: normalizedAllImages[index] || normalizedAllImages[0] || "",
        }))
        .sort((a, b) => getTraySizeOrder(a.label) - getTraySizeOrder(b.label))
    : []
  const safeTrayIndex = Math.min(traySizeIndex, Math.max(0, trayCardOptions.length - 1))
  const selectedTrayOption = trayCardOptions[safeTrayIndex]
  const isImageBroken = (src: string) => Boolean(src && brokenImages[src])
  const markImageBroken = (src: string) => {
    if (!src) return
    setBrokenImages((prev) => (prev[src] ? prev : { ...prev, [src]: true }))
  }
  const trayImageCandidates = [
    selectedTrayOption?.image || "",
    ...trayCardOptions.map((option) => option.image || ""),
    ...normalizedAllImages,
  ].filter(Boolean)
  const selectedTrayImage =
    trayImageCandidates.find((src) => !isImageBroken(src)) || trayImageCandidates[0] || ""
  const mainImage =
    normalizedAllImages.find((src) => !isImageBroken(src)) || normalizedAllImages[0] || ""
  const displayPrice = isTraySizeVariantCard
    ? selectedTrayOption?.price || item.price
    : hasVariantPricing
    ? Math.min(...variantPrices)
    : item.price

  return (
    <div
      onClick={() => item.inStock !== false && onSelect(item)}
      className={cn(
        "cursor-pointer group transition-transform duration-100",
        item.inStock !== false ? "active:scale-95" : "opacity-60 cursor-not-allowed",
        useFloatingTrayStyle && "col-span-2 md:col-span-1",
        v.container
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect(item)}
      aria-label={`${item.name} - ${displayPrice}`}
    >
      {useFloatingTrayStyle ? (
        <>
          <div className={trayStyle.shell}>
            <div className="relative mx-auto h-[120px] w-[120px]">
              <div className={trayStyle.circleShell} />
              <div className={trayStyle.circleInset}>
                {(isTraySizeVariantCard ? selectedTrayImage : mainImage) ? (
                  <Image
                    src={isTraySizeVariantCard ? selectedTrayImage : mainImage}
                    alt={item.name}
                    fill
                    sizes="140px"
                    quality={72}
                    className="object-cover"
                    onError={() => markImageBroken(isTraySizeVariantCard ? selectedTrayImage : mainImage)}
                    priority={priority}
                    loading={priority ? "eager" : "lazy"}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                )}
              </div>
            </div>

            {isTraySizeVariantCard ? (
              <div className="mt-2.5 flex justify-center gap-2">
                {trayCardOptions.map((option, idx) => {
                  const isSelected = safeTrayIndex === idx
                  const colors = ["#efc0cc", "#f2df8f", "#f6e8ed"]
                  return (
                    <button
                      key={`${item.id}-${option.label}-${idx}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setTraySizeIndex(idx)
                      }}
                      className="flex flex-col items-center gap-1"
                      aria-label={option.label}
                    >
                      <span
                        className={cn(
                          "w-6 h-6 rounded-full border transition-all",
                          isSelected ? `ring-2 ${trayStyle.chipActive} border-white scale-105` : "border-[#d9d9de]"
                        )}
                        style={{ backgroundColor: colors[idx % colors.length] }}
                      />
                      <span className={cn("text-[11px] font-bold", isSelected ? "text-[#2a2a35]" : "text-[#8f959f]")}>
                        {getTraySizeChipLabel(option.label)}
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : null}

            {item.isFeatured ? (
              <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <Star className="h-2.5 w-2.5 fill-yellow-900" />
                الأكثر
              </div>
            ) : null}
          </div>

          <div className={cn("mt-3 text-right", v.content)}>
            <h3 className={cn("font-bold text-base leading-tight", trayStyle.title)}>{item.name}</h3>
            <p className={cn("text-sm mt-1 line-clamp-2 leading-relaxed", trayStyle.desc)}>{item.description}</p>
            <div className="mt-2">
              <p className={trayStyle.price}>
                <PriceWithRiyalLogo value={displayPrice} />
              </p>
            </div>
          </div>
        </>
      ) : (
      <>
      <div className={cn("relative aspect-square overflow-hidden bg-[#e8e8e8]", v.image)}>
        {mainImage ? (
          <Image
            src={mainImage}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 280px"
            quality={72}
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => markImageBroken(mainImage)}
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
          {item.isFeatured ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 text-yellow-800 text-[11px] font-semibold px-2.5 py-1">
              <Star className="h-3 w-3 fill-yellow-700 text-yellow-700" />
              الأكثر طلبًا
            </span>
          ) : null}
        </div>

        <div className="mt-2 text-right">
          {hasVariantPricing ? (
            <p className="text-xs text-muted-foreground mb-0.5">يبدأ من</p>
          ) : null}
          <p className={cn("font-bold", v.price)}>
            <PriceWithRiyalLogo value={displayPrice} />
          </p>
        </div>
      </div>
      </>
      )}
    </div>
  )
})
