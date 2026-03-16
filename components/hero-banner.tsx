"use client"

import Image from "next/image"
import { useState } from "react"
import { ShoppingBag, Sparkles } from "lucide-react"
import { useBannerConfig } from "@/hooks/use-banner-config"
import { useMenu } from "@/hooks/use-menu"
import { useCart } from "@/components/cart-provider"
import { ProductDrawer } from "@/components/product-drawer"
import { PriceWithRiyalLogo } from "@/components/ui/price-with-riyal-logo"
import { trackStorefrontEvent } from "@/lib/storefront-events"

export function HeroBanner() {
  const { config, loading } = useBannerConfig()
  const { menuItems } = useMenu()
  const { addItem } = useCart()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [added, setAdded] = useState(false)

  const featuredProduct = config.featured_product_id
    ? menuItems.find((m) => m.id === config.featured_product_id) || null
    : null

  const featuredNeedsConfiguration = Boolean(
    featuredProduct &&
      (featuredProduct.category === "trays" ||
        featuredProduct.category === "eid" ||
        (featuredProduct.ingredients?.length ?? 0) > 0),
  )

  if (loading) {
    return (
      <div className="mx-4 mt-4 h-44 animate-pulse rounded-[2rem] bg-amal-pink-light/50 md:rounded-3xl" />
    )
  }

  if (config.full_design_mode && config.full_design_url) {
    return (
      <div
        className="relative mx-4 mt-4 overflow-hidden rounded-[2rem] md:rounded-3xl"
        style={{ aspectRatio: "2.5/1" }}
      >
        <Image
          src={config.full_design_url}
          alt="banner design"
          fill
          sizes="(max-width: 768px) 100vw, 1200px"
          quality={80}
          className="object-cover"
          style={{
            objectPosition: `${config.image_position_x}% ${config.image_position_y}%`,
            transform: `scale(${config.image_scale / 100})`,
          }}
          priority
        />
      </div>
    )
  }

  if (featuredProduct) {
    return (
      <>
        <div
          className="relative mx-4 mt-4 overflow-hidden rounded-[2rem] md:rounded-3xl"
          style={{
            background: `linear-gradient(135deg, ${config.bg_from}, ${config.bg_to})`,
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_38%)]" />
          <div className="relative flex min-h-[180px] items-stretch">
            <div className="flex flex-1 flex-col justify-between p-5 sm:p-6" dir="rtl">
              <span className="self-start rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-foreground backdrop-blur-sm">
                {config.featured_product_label || "جديد"}
              </span>

              <div className="mt-3">
                <h2 className="line-clamp-2 text-xl font-black leading-tight text-foreground">
                  {featuredProduct.name}
                </h2>
                {featuredProduct.nameEn ? (
                  <p className="mt-0.5 text-xs text-foreground/60">
                    {featuredProduct.nameEn}
                  </p>
                ) : null}
                <p className="mt-1 text-lg font-black text-foreground/80">
                  <PriceWithRiyalLogo value={featuredProduct.price} />
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (featuredNeedsConfiguration) {
                    trackStorefrontEvent("hero_feature_opened", {
                      productId: featuredProduct.id,
                      category: featuredProduct.category,
                      mode: "configured",
                    })
                    setDrawerOpen(true)
                    return
                  }

                  addItem(featuredProduct, 1)
                  trackStorefrontEvent("hero_quick_add", {
                    productId: featuredProduct.id,
                    category: featuredProduct.category,
                    quantity: 1,
                  })
                  setAdded(true)
                  window.setTimeout(() => setAdded(false), 1500)
                }}
                className="mt-4 flex h-11 self-start items-center gap-2 rounded-full bg-foreground px-4 text-sm font-bold text-background shadow-lg transition-all active:scale-95"
              >
                {added ? (
                  <>تمت الإضافة للسلة</>
                ) : (
                  <>
                    <ShoppingBag className="h-3.5 w-3.5" />
                    {featuredNeedsConfiguration ? "خصص الطلب" : "اطلب الآن"}
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                trackStorefrontEvent("hero_feature_opened", {
                  productId: featuredProduct.id,
                  category: featuredProduct.category,
                  mode: "details",
                })
                setDrawerOpen(true)
              }}
              className="relative w-[38%] min-w-[8.75rem] flex-shrink-0 transition-opacity active:opacity-90 sm:w-40"
              aria-label={`عرض تفاصيل ${featuredProduct.name}`}
            >
              {featuredProduct.image ? (
                <Image
                  src={featuredProduct.image}
                  alt={featuredProduct.name}
                  fill
                  sizes="(max-width: 640px) 38vw, 160px"
                  quality={70}
                  loading="lazy"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-black/5">
                  <ShoppingBag className="h-12 w-12 opacity-20" />
                </div>
              )}
              <div className="absolute bottom-2 right-2 rounded-full bg-black/30 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm">
                التفاصيل
              </div>
            </button>
          </div>

          <div className="absolute left-3 top-3 opacity-30">
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

  const hasImage = Boolean(config.image_url)

  return (
    <div
      className="relative mx-4 mt-4 overflow-hidden rounded-[2rem] p-6 text-center md:rounded-3xl"
      style={{ background: `linear-gradient(135deg, ${config.bg_from}, ${config.bg_to})` }}
    >
      {hasImage ? (
        <div className="absolute inset-0 overflow-hidden rounded-[2rem] md:rounded-3xl">
          <Image
            src={config.image_url!}
            alt="banner"
            fill
            sizes="(max-width: 768px) 100vw, 1200px"
            quality={75}
            className="object-cover"
            style={{
              opacity: config.image_opacity / 100,
              objectPosition: `${config.image_position_x}% ${config.image_position_y}%`,
              transform: `scale(${config.image_scale / 100})`,
            }}
          />
        </div>
      ) : null}
      <div className="relative z-10">
        {config.show_badge && config.badge ? (
          <span className="text-sm font-medium text-primary">{config.badge}</span>
        ) : null}
        <h2 className="mt-2 text-3xl font-bold text-foreground">{config.title}</h2>
        {config.show_subtitle && config.subtitle ? (
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {config.subtitle}
          </p>
        ) : null}
      </div>
    </div>
  )
}
