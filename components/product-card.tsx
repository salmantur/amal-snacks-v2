"use client"

import React, { memo, useState } from "react"
import Image from "next/image"
import { ShoppingBag } from "lucide-react"
import { type MenuItem } from "@/components/cart-provider"
import { buildBestSellerOverlay, DEFAULT_BEST_SELLER_CARD_CONFIG, type BestSellerCardConfig } from "@/lib/best-seller-card-config"
import { cn } from "@/lib/utils"
import { PriceWithRiyalLogo } from "@/components/ui/price-with-riyal-logo"

export type ItemCardVariant = "neo" | "glass" | "editorial" | "warm" | "minimal"
export type TrayCardDesign = "d1" | "d2" | "d3"
export type BestSellerCardStyle = "s1" | "s2" | "s3"

interface ProductCardProps {
  item: MenuItem
  onSelect: (item: MenuItem) => void
  priority?: boolean
  variant?: ItemCardVariant
  trayDesign?: TrayCardDesign
  forceUnifiedStyle?: boolean
  bestSellerStyle?: BestSellerCardStyle
  bestSellerCardConfig?: BestSellerCardConfig
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
  bestSellerStyle,
  bestSellerCardConfig = DEFAULT_BEST_SELLER_CARD_CONFIG,
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
  const useThemeCardColors = variant === "neo" || forceUnifiedStyle
  const cardSurfaceStyle = useThemeCardColors ? { backgroundColor: "var(--item-card-bg)" } : undefined
  const titleColorStyle = useThemeCardColors ? { color: "var(--item-card-title)" } : undefined
  const descColorStyle = useThemeCardColors ? { color: "var(--item-card-desc)" } : undefined
  const priceColorStyle = useThemeCardColors ? { color: "var(--item-card-price)" } : undefined
  const floatingShellStyle = useThemeCardColors
    ? { backgroundColor: "var(--item-card-bg)", backgroundImage: "none", borderColor: "rgba(15, 23, 42, 0.10)" }
    : undefined
  const floatingCircleShellStyle = useThemeCardColors
    ? { backgroundColor: "var(--item-card-bg)", backgroundImage: "none", boxShadow: "0 6px 14px rgba(0,0,0,0.08)" }
    : undefined
  const floatingCircleInsetStyle = useThemeCardColors ? { backgroundColor: "var(--item-card-bg)" } : undefined
  const floatingPriceStyle = useThemeCardColors
    ? { color: "var(--item-card-price)", backgroundColor: "var(--item-card-bg)", borderColor: "rgba(15, 23, 42, 0.12)" }
    : priceColorStyle
  const bestSellerImage = isTraySizeVariantCard ? selectedTrayImage || mainImage : mainImage
  const sizeDotColors = ["#f2d5de", "#f2da66", "#dd667d"]
  const sizeChipColors = [
    { bg: "#fde7ee", text: "#bf4a66", border: "#efb5c4" },
    { bg: "#f6eaa7", text: "#8f6900", border: "#ecd66e" },
    { bg: "#f7f3ea", text: "#6d5d42", border: "#eadfca" },
  ]
  const cardBaseClass = cn(
    "cursor-pointer group transition-transform duration-100",
    item.inStock !== false ? "active:scale-95" : "opacity-60 cursor-not-allowed"
  )
  const bestSellerCardClass = cn(cardBaseClass, "col-span-1")
  const bestSellerOverlay = buildBestSellerOverlay(bestSellerCardConfig)
  const priceBadgeRadius =
    bestSellerCardConfig.price_badge_shape === "square"
      ? 16
      : bestSellerCardConfig.price_badge_shape === "rounded"
      ? 24
      : 999
  const priceBadgeStyle =
    bestSellerCardConfig.price_badge_style === "transparent"
      ? {
          backgroundColor: `rgba(255,255,255,${bestSellerCardConfig.price_badge_opacity * 0.45})`,
          borderColor: `rgba(255,255,255,${Math.min(bestSellerCardConfig.price_badge_opacity + 0.1, 0.95)})`,
          backdropFilter: "none",
        }
      : bestSellerCardConfig.price_badge_style === "glass"
      ? {
          backgroundColor: `rgba(255,255,255,${Math.max(bestSellerCardConfig.price_badge_opacity * 0.5, 0.22)})`,
          borderColor: `rgba(255,255,255,${Math.min(bestSellerCardConfig.price_badge_opacity + 0.12, 0.98)})`,
          backdropFilter: `blur(${bestSellerCardConfig.price_badge_blur_px}px) saturate(160%)`,
          WebkitBackdropFilter: `blur(${bestSellerCardConfig.price_badge_blur_px}px) saturate(160%)`,
          boxShadow: "0 12px 30px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.5)",
        }
      : {
          backgroundColor: `rgba(255,255,255,${bestSellerCardConfig.price_badge_opacity})`,
          borderColor: "#d7d2cf",
          backdropFilter: "none",
        }

  const renderDotSelector = (
    tone: "light" | "bold" = "light",
    options?: { dotSize?: number; labelSize?: number; gap?: number; topMargin?: number }
  ) =>
    isTraySizeVariantCard ? (
      <div
        className="flex items-end justify-end"
        dir="rtl"
        style={{ marginTop: options?.topMargin ?? 20, gap: options?.gap ?? 12 }}
      >
        {trayCardOptions.map((option, idx) => {
          const isSelected = safeTrayIndex === idx
          return (
            <button
              key={`${item.id}-${option.label}-${idx}-dot`}
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
                  "rounded-full border-2 transition-all duration-200",
                  isSelected
                    ? tone === "bold"
                      ? "scale-105 border-white ring-4 ring-[#d56f86]/35"
                      : "scale-105 border-white ring-4 ring-[#d9b4bf]/55"
                    : "border-transparent"
                )}
                style={{
                  backgroundColor: sizeDotColors[idx % sizeDotColors.length],
                  width: options?.dotSize ?? 40,
                  height: options?.dotSize ?? 40,
                }}
              />
              <span
                className={cn("font-bold", isSelected ? "text-[#1f2433]" : "text-[#878a94]")}
                style={{ fontSize: options?.labelSize ?? 14 }}
              >
                {getTraySizeChipLabel(option.label)}
              </span>
            </button>
          )
        })}
      </div>
    ) : null

  const renderChipSelector = () =>
    isTraySizeVariantCard ? (
      <div className="mt-6 flex flex-wrap justify-end gap-3" dir="rtl">
        {trayCardOptions.map((option, idx) => {
          const isSelected = safeTrayIndex === idx
          const palette = sizeChipColors[idx % sizeChipColors.length]
          return (
            <button
              key={`${item.id}-${option.label}-${idx}-chip`}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setTraySizeIndex(idx)
              }}
              className={cn(
                "rounded-full border px-5 py-2.5 text-base font-bold transition-all duration-200",
                isSelected ? "shadow-[0_10px_22px_rgba(0,0,0,0.16)] scale-[1.02]" : "shadow-none"
              )}
              style={{
                backgroundColor: palette.bg,
                borderColor: palette.border,
                color: palette.text,
              }}
              aria-label={option.label}
            >
              {getTraySizeChipLabel(option.label)}
            </button>
          )
        })}
      </div>
    ) : null

  if (bestSellerStyle === "s1") {
    return (
      <div
        onClick={() => item.inStock !== false && onSelect(item)}
        className={cn(
          bestSellerCardClass,
          "overflow-hidden rounded-[34px] border border-[#ece6e6] bg-[linear-gradient(135deg,#fcfbfa_0%,#f7f4ef_48%,#ffffff_100%)] p-4 shadow-[0_24px_55px_rgba(15,23,42,0.10)]"
        )}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onSelect(item)}
        aria-label={`${item.name} - ${displayPrice}`}
      >
        <div className="grid grid-cols-[1.08fr_0.92fr] gap-0">
          <div className="relative min-h-[360px] overflow-hidden rounded-[28px] bg-[#eee7dc]">
            {bestSellerImage ? (
              <Image
                src={bestSellerImage}
                alt={item.name}
                fill
                sizes="(max-width: 768px) 52vw, 340px"
                quality={76}
                className="object-cover"
                onError={() => markImageBroken(bestSellerImage)}
                priority={priority}
                loading={priority ? "eager" : "lazy"}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <ShoppingBag className="h-8 w-8" />
              </div>
            )}
            <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.78)_62%,rgba(255,255,255,1)_100%)]" />
            {item.inStock === false ? (
              <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-800">نفذت الكمية</span>
              </div>
            ) : null}
          </div>

          <div className="flex min-h-[360px] flex-col justify-center px-4 py-6 text-right" dir="rtl">
            <h3 className="text-[2.7rem] font-black leading-[0.95] text-black sm:text-[3.1rem]">{item.name}</h3>
            <p className="mt-5 text-[1.05rem] leading-9 text-black/85">
              {item.description || "اختر الحجم المناسب لوجبتك واستمتع بطعم جاهز للتقديم."}
            </p>
            <div className="mt-6">
              <span className="inline-flex rounded-[26px] bg-white px-7 py-4 text-[2rem] font-black text-black shadow-[0_14px_28px_rgba(0,0,0,0.14)]">
                <PriceWithRiyalLogo value={displayPrice} />
              </span>
            </div>
            {renderDotSelector("bold")}
          </div>
        </div>
      </div>
    )
  }

  if (bestSellerStyle === "s2") {
    return (
      <div
        onClick={() => item.inStock !== false && onSelect(item)}
        className={cn(
          bestSellerCardClass,
          "overflow-hidden rounded-[34px] border border-white/70 bg-[#fbfaf8] p-3 shadow-[0_22px_50px_rgba(15,23,42,0.08)]"
        )}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onSelect(item)}
        aria-label={`${item.name} - ${displayPrice}`}
      >
        <div
          className="relative overflow-hidden bg-[#efeadf]"
          style={{
            minHeight: bestSellerCardConfig.card_height,
            borderRadius: bestSellerCardConfig.card_radius,
          }}
        >
          {bestSellerImage ? (
            <Image
              src={bestSellerImage}
              alt={item.name}
              fill
              sizes="(max-width: 768px) 100vw, 560px"
              quality={76}
              className="object-cover"
              onError={() => markImageBroken(bestSellerImage)}
              priority={priority}
              loading={priority ? "eager" : "lazy"}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <ShoppingBag className="h-8 w-8" />
            </div>
          )}
          {bestSellerImage ? (
            <div className="absolute inset-x-0 bottom-0 h-[58%] overflow-hidden">
              <Image
                src={bestSellerImage}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 560px"
                quality={54}
                className="scale-125 object-cover object-bottom blur-2xl brightness-[0.72] saturate-[1.2]"
                aria-hidden="true"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.02)_0%,rgba(15,23,42,0.22)_32%,rgba(15,23,42,0.52)_100%)]" />
            </div>
          ) : null}
          <div className="absolute inset-0" style={{ backgroundImage: bestSellerOverlay }} />
          <div
            className="absolute flex flex-col overflow-hidden text-right"
            dir="rtl"
            style={{
              width: `${bestSellerCardConfig.content_width_percent}%`,
              maxWidth: `calc(100% - ${bestSellerCardConfig.content_right_px + 18}px)`,
              maxHeight: "calc(100% - 32px)",
              right: bestSellerCardConfig.content_right_px,
              top: `${bestSellerCardConfig.content_top_percent}%`,
              transform: "translateY(-50%)",
            }}
          >
            <h3
              className="line-clamp-2 break-words font-black text-white drop-shadow-[0_10px_22px_rgba(15,23,42,0.38)]"
              style={{ fontSize: bestSellerCardConfig.title_size_px, lineHeight: 1.08 }}
            >
              {item.name}
            </h3>
            {bestSellerCardConfig.show_description ? (
              <p
                className="line-clamp-2 break-words text-white/82 drop-shadow-[0_8px_18px_rgba(15,23,42,0.34)]"
                style={{
                  marginTop: bestSellerCardConfig.title_description_gap_px,
                  fontSize: bestSellerCardConfig.description_size_px,
                  lineHeight: 1.45,
                }}
              >
                {item.description || "اختر الحجم الصغير أو الوسط أو الكبير حسب المناسبة."}
              </p>
            ) : null}
            <div
              style={{
                marginTop: bestSellerCardConfig.show_description
                  ? bestSellerCardConfig.description_price_gap_px
                  : bestSellerCardConfig.title_description_gap_px,
              }}
            >
              <span
                className="inline-flex items-center border font-black text-[#212430] shadow-[0_10px_24px_rgba(0,0,0,0.10)]"
                style={{
                  fontSize: bestSellerCardConfig.price_size_px,
                  borderRadius: priceBadgeRadius,
                  paddingInline: bestSellerCardConfig.price_badge_padding_x_px,
                  paddingBlock: bestSellerCardConfig.price_badge_padding_y_px,
                  ...priceBadgeStyle,
                }}
              >
                <PriceWithRiyalLogo value={displayPrice} />
              </span>
            </div>
            {renderDotSelector("light", {
              dotSize: bestSellerCardConfig.size_dot_px,
              labelSize: bestSellerCardConfig.size_label_px,
              topMargin: bestSellerCardConfig.price_sizes_gap_px,
            })}
          </div>
          {item.inStock === false ? (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-800">نفذت الكمية</span>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  if (bestSellerStyle === "s3") {
    return (
      <div
        onClick={() => item.inStock !== false && onSelect(item)}
        className={cn(
          bestSellerCardClass,
          "overflow-hidden rounded-[36px] border border-[#e9d8d8] bg-white p-3 shadow-[0_24px_54px_rgba(15,23,42,0.14)]"
        )}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onSelect(item)}
        aria-label={`${item.name} - ${displayPrice}`}
      >
        <div className="relative min-h-[620px] overflow-hidden rounded-[30px] bg-[#dfe4e6]">
          {bestSellerImage ? (
            <Image
              src={bestSellerImage}
              alt={item.name}
              fill
              sizes="(max-width: 768px) 100vw, 460px"
              quality={76}
              className="object-cover"
              onError={() => markImageBroken(bestSellerImage)}
              priority={priority}
              loading={priority ? "eager" : "lazy"}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <ShoppingBag className="h-8 w-8" />
            </div>
          )}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.48)_36%,rgba(255,255,255,0.86)_72%,rgba(255,255,255,0.95)_100%)]" />
          <div className="absolute inset-x-0 top-0 px-7 pt-8 text-right" dir="rtl">
            <span className="inline-flex rounded-full bg-[#c8a44d]/80 px-4 py-1 text-sm font-bold text-white">
              صناعة يدوية فاخرة
            </span>
            <h3 className="mt-6 text-[3rem] font-black leading-none text-[#10162f]">{item.name}</h3>
            <p className="mt-5 max-w-[90%] text-[1.05rem] leading-9 text-[#10162f]/82">
              {item.description || "استمتع بتقديم فاخر مع تفاصيل مدروسة وطعم يليق بالمناسبات."}
            </p>
          </div>
          <div className="absolute inset-x-0 bottom-0 px-7 pb-8 text-right" dir="rtl">
            <div className="text-[3rem] font-black leading-none text-[#f44784]">
              <PriceWithRiyalLogo value={displayPrice} />
            </div>
            {isTraySizeVariantCard ? <p className="mt-5 text-xl font-bold text-[#10162f]">اختر الحجم:</p> : null}
            {renderChipSelector()}
          </div>
          {item.inStock === false ? (
            <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-800">نفذت الكمية</span>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={() => item.inStock !== false && onSelect(item)}
      className={cn(
        cardBaseClass,
        useFloatingTrayStyle && "col-span-2 md:col-span-1",
        v.container
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect(item)}
      aria-label={`${item.name} - ${displayPrice}`}
      style={cardSurfaceStyle}
    >
      {useFloatingTrayStyle ? (
        <>
          <div className={trayStyle.shell} style={floatingShellStyle}>
            <div className="flex items-center gap-3">
              <div className={cn("min-w-0 flex-1 text-right", v.content)}>
                <h3 className={cn("font-bold text-base leading-tight", trayStyle.title)} style={titleColorStyle}>{item.name}</h3>
                <p className={cn("text-sm mt-1 line-clamp-2 leading-relaxed", trayStyle.desc)} style={descColorStyle}>{item.description}</p>
                <div className="mt-2">
                  <p className={trayStyle.price} style={floatingPriceStyle}>
                    <PriceWithRiyalLogo value={displayPrice} />
                  </p>
                </div>
              </div>

              <div className="relative h-[120px] w-[120px] shrink-0">
                <div className={trayStyle.circleShell} style={floatingCircleShellStyle} />
                <div className={trayStyle.circleInset} style={floatingCircleInsetStyle}>
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

        {item.inStock === false ? (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-gray-800 text-xs font-bold px-3 py-1 rounded-full">نفذت الكمية</span>
          </div>
        ) : null}
      </div>

      <div className={cn("mt-4 text-right", v.content)}>
        <h3 className={cn("font-bold text-base leading-tight", v.title)} style={titleColorStyle}>{item.name}</h3>
        <p className={cn("text-sm mt-1 line-clamp-2 leading-relaxed", v.desc)} style={descColorStyle}>{item.description}</p>
        <div className="mt-2 text-right">
          {hasVariantPricing ? (
            <p className="text-xs text-muted-foreground mb-0.5">يبدأ من</p>
          ) : null}
          <p className={cn("font-bold", v.price)} style={priceColorStyle}>
            <PriceWithRiyalLogo value={displayPrice} />
          </p>
        </div>
      </div>
      </>
      )}
    </div>
  )
})
