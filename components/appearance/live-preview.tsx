"use client"

import { useMemo, type CSSProperties } from "react"
import { Header } from "@/components/header"
import { BannerPreview } from "@/components/hero-banner-editor"
import { ProductCard } from "@/components/product-card"
import { useMenu } from "@/hooks/use-menu"
import { useBestSellersConfig } from "@/hooks/use-best-sellers-config"
import { getBestSellerCandidates } from "@/lib/best-sellers"
import { hexToHsl, type ThemeConfig } from "@/hooks/use-theme-config"
import type { BannerConfig } from "@/hooks/use-banner-config"
import type { HeaderConfig } from "@/lib/header-config"
import type { BestSellerCardConfig } from "@/lib/best-seller-card-config"

export function LivePreview({
  theme,
  banner,
  header,
  bestSellerCard,
}: {
  theme: ThemeConfig
  banner: BannerConfig
  header: HeaderConfig
  bestSellerCard: BestSellerCardConfig
}) {
  const { menuItems } = useMenu()
  const { orderIds } = useBestSellersConfig()

  const bestSellerItem = useMemo(
    () => getBestSellerCandidates(menuItems, orderIds)[0] ?? menuItems[0] ?? null,
    [menuItems, orderIds]
  )
  const regularItem = useMemo(
    () => menuItems.find((item) => item.id !== bestSellerItem?.id) ?? menuItems[0] ?? null,
    [menuItems, bestSellerItem]
  )

  const FONT_VAR_BY_FAMILY: Record<Exclude<ThemeConfig["font_family"], "system">, string> = {
    tajawal: "var(--font-tajawal)",
    "thmanyah-sans": "var(--font-thmanyah-sans)",
    "thmanyah-serif-text": "var(--font-thmanyah-serif-text)",
  }

  const scopedVars: CSSProperties = {
    "--primary": hexToHsl(theme.primary),
    "--primary-foreground": hexToHsl(theme.primary_foreground),
    "--secondary": hexToHsl(theme.secondary),
    "--secondary-foreground": hexToHsl(theme.secondary_foreground),
    "--accent": hexToHsl(theme.accent || theme.secondary),
    "--accent-foreground": hexToHsl(theme.accent_foreground || theme.secondary_foreground),
    "--destructive": hexToHsl(theme.destructive),
    "--destructive-foreground": hexToHsl(theme.destructive_foreground),
    "--ring": hexToHsl(theme.primary),
    "--checkout-green": theme.checkout_green,
    "--background": hexToHsl(theme.background),
    "--card": hexToHsl(theme.background),
    "--bar-background": theme.bar_background,
    "--muted": hexToHsl(theme.bar_background),
    "--amal-grey": hexToHsl(theme.bar_background),
    "--item-card-bg": theme.item_card_background,
    "--item-card-title": theme.item_card_title,
    "--item-card-desc": theme.item_card_description,
    "--item-card-price": theme.item_card_price,
    "--radius": `${theme.corner_radius}px`,
    ...(theme.font_family !== "system" ? { "--font-theme": FONT_VAR_BY_FAMILY[theme.font_family] } : {}),
  } as CSSProperties

  return (
    <div className="rounded-2xl border border-admin-border-soft overflow-hidden" style={scopedVars}>
      <div className="max-h-[75vh] overflow-y-auto" style={{ backgroundColor: "hsl(var(--background))" }}>
        <div className="pointer-events-none">
          <Header configOverride={header} />
        </div>
        <div className="space-y-4 p-4">
          <BannerPreview mode="desktop" config={banner} />
          <div className="grid grid-cols-2 gap-3">
            {regularItem ? <ProductCard item={regularItem} onSelect={() => {}} /> : null}
            {bestSellerItem ? (
              <ProductCard item={bestSellerItem} onSelect={() => {}} bestSellerStyle="s4" bestSellerCardConfig={bestSellerCard} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
