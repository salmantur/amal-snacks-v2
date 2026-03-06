"use client"

import Image from "next/image"
import { useBannerConfig } from "@/hooks/use-banner-config"
import { useState } from "react"
import { ProductDrawer } from "@/components/product-drawer"
import { useCart } from "@/components/cart-provider"
import { useMenu } from "@/hooks/use-menu"
import type { MenuItem } from "@/components/cart-provider"
import { ShoppingBag, Sparkles } from "lucide-react"
import { PriceWithRiyalLogo } from "@/components/ui/price-with-riyal-logo"


export function HeroBanner() {
  const { config, loading } = useBannerConfig()
  const { menuItems } = useMenu()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  const featuredProduct = config.featured_product_id
    ? menuItems.find(m => m.id === config.featured_product_id) || null
    : null

  if (loading) {
    return <div className="mx-4 mt-4 rounded-3xl bg-amal-pink-light/50 h-44 animate-pulse" />
  }

  // Ã¢â€â‚¬Ã¢â€â‚¬ Full design mode: custom poster image fills entire banner Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  if (config.full_design_mode && config.full_design_url) {
    return (
      <div className="mx-4 mt-4 rounded-3xl overflow-hidden relative" style={{ aspectRatio: "2.5/1" }}>
        <Image
          src={config.full_design_url}
          alt="banner design"
          fill
          sizes="(max-width: 768px) 100vw, 1200px"
          quality={75}
          className="object-cover object-center"
          priority
        />
      </div>
    )
  }

  // Ã¢â€â‚¬Ã¢â€â‚¬ With featured product: split layout Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  if (featuredProduct) {
    return (
      <>
        <div
          className="mx-4 mt-4 rounded-3xl overflow-hidden relative"
          style={{ background: `linear-gradient(135deg, ${config.bg_from}, ${config.bg_to})` }}
        >
          <div className="flex items-stretch min-h-[160px]">

            {/* Left: text + button */}
            <div className="flex-1 p-5 flex flex-col justify-between" dir="rtl">
              {/* Label badge */}
              <span className="self-start bg-white/80 text-foreground text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
                {config.featured_product_label || "Ã˜Â¬Ã˜Â¯Ã™Å Ã˜Â¯ Ã°Å¸â€Â¥"}
              </span>

              {/* Product name + price */}
              <div className="mt-3">
                <h2 className="text-xl font-black text-foreground leading-tight line-clamp-2">
                  {featuredProduct.name}
                </h2>
                {featuredProduct.nameEn && (
                  <p className="text-xs text-foreground/60 mt-0.5">{featuredProduct.nameEn}</p>
                )}
                <p className="text-lg font-black text-foreground/80 mt-1">
                  <PriceWithRiyalLogo value={featuredProduct.price} />
                </p>
              </div>

              {/* Order now button */}
              <button
                onClick={() => {
                  addItem(featuredProduct, 1)
                  setAdded(true)
                  setTimeout(() => setAdded(false), 1500)
                }}
                className="mt-4 self-start flex items-center gap-2 bg-foreground text-background rounded-full px-4 py-2.5 text-sm font-bold active:scale-95 transition-all shadow-lg"
              >
                {added ? (
                  <>Ã¢Å“â€œ Ã˜Â£Ã˜Â¶Ã™Å Ã™Â Ã™â€žÃ™â€žÃ˜Â³Ã™â€žÃ˜Â©!</>
                ) : (
                  <><ShoppingBag className="h-3.5 w-3.5" /> Ã˜Â§Ã˜Â·Ã™â€žÃ˜Â¨ Ã˜Â§Ã™â€žÃ˜Â¢Ã™â€ </>
                )}
              </button>
            </div>

            {/* Right: product image */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="relative w-40 flex-shrink-0 active:opacity-90 transition-opacity"
            >
              {featuredProduct.image ? (
                <Image
                  src={featuredProduct.image}
                  alt={featuredProduct.name}
                  fill
                  sizes="160px"
                  quality={72}
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-black/5">
                  <ShoppingBag className="h-12 w-12 opacity-20" />
                </div>
              )}
              {/* Tap for details hint */}
              <div className="absolute bottom-2 right-2 bg-black/30 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                Ã˜Â§Ã™â€žÃ˜ÂªÃ™ÂÃ˜Â§Ã˜ÂµÃ™Å Ã™â€ž
              </div>
            </button>
          </div>

          {/* Decorative sparkle */}
          <div className="absolute top-3 left-3 opacity-30">
            <Sparkles className="h-4 w-4 text-foreground" />
          </div>
        </div>

        <ProductDrawer
          product={featuredProduct}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />
      </>
    )
  }

  // Ã¢â€â‚¬Ã¢â€â‚¬ Without featured product: original banner Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const hasImage = !!config.image_url
  return (
    <div
      className="mx-4 mt-4 rounded-3xl p-6 text-center overflow-hidden relative"
      style={{ background: `linear-gradient(135deg, ${config.bg_from}, ${config.bg_to})` }}
    >
      {hasImage && (
        <div className="absolute inset-0 rounded-3xl overflow-hidden">
          <Image src={config.image_url!} alt="banner" fill sizes="(max-width: 768px) 100vw, 1200px" quality={70} className="object-cover opacity-20" />
        </div>
      )}
      <div className="relative z-10">
        {config.show_badge && config.badge && (
          <span className="text-sm text-primary font-medium">{config.badge}</span>
        )}
        <h2 className="text-3xl font-bold text-foreground mt-2">{config.title}</h2>
        {config.show_subtitle && config.subtitle && (
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed whitespace-pre-line">
            {config.subtitle}
          </p>
        )}
      </div>
    </div>
  )
}
