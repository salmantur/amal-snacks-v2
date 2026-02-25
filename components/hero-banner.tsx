"use client"

import Image from "next/image"
import { useBannerConfig } from "@/hooks/use-banner-config"

export function HeroBanner() {
  const { config, loading } = useBannerConfig()

  if (loading) {
    return (
      <div className="mx-4 mt-4 rounded-3xl bg-amal-pink-light/50 p-6 h-32 animate-pulse" />
    )
  }

  const hasImage = !!config.image_url

  return (
    <div
      className="mx-4 mt-4 rounded-3xl p-6 text-center overflow-hidden relative"
      style={{
        background: `linear-gradient(135deg, ${config.bg_from}, ${config.bg_to})`,
      }}
    >
      {/* Background image */}
      {hasImage && (
        <div className="absolute inset-0 rounded-3xl overflow-hidden">
          <Image
            src={config.image_url!}
            alt="banner"
            fill
            className="object-cover opacity-20"
          />
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