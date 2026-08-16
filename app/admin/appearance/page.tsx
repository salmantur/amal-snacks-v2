"use client"

import dynamic from "next/dynamic"
import { useState } from "react"
import { AdminPageHeader } from "../page-header"
import { LivePreview } from "@/components/appearance/live-preview"
import { DEFAULT_BANNER, type BannerConfig } from "@/hooks/use-banner-config"
import { DEFAULT_THEME, type ThemeConfig } from "@/hooks/use-theme-config"
import { DEFAULT_HEADER_CONFIG, type HeaderConfig } from "@/lib/header-config"
import { DEFAULT_BEST_SELLER_CARD_CONFIG, type BestSellerCardConfig } from "@/lib/best-seller-card-config"
import { cn } from "@/lib/utils"

const LOADING = <div className="py-16 text-center text-sm text-admin-muted">جارِ التحميل...</div>

const HeroBannerEditor = dynamic(
  () => import("@/components/hero-banner-editor").then((m) => ({ default: m.HeroBannerEditor })),
  { loading: () => LOADING }
)
const ThemeEditor = dynamic(
  () => import("@/components/theme-editor").then((m) => ({ default: m.ThemeEditor })),
  { loading: () => LOADING }
)
const HeaderEditor = dynamic(
  () => import("@/components/header-editor").then((m) => ({ default: m.HeaderEditor })),
  { loading: () => LOADING }
)
const BestSellerCardEditor = dynamic(
  () => import("@/components/best-seller-card-editor").then((m) => ({ default: m.BestSellerCardEditor })),
  { loading: () => LOADING }
)
const CateringCardColorEditor = dynamic(
  () => import("@/components/catering-card-color-editor").then((m) => ({ default: m.CateringCardColorEditor })),
  { loading: () => LOADING }
)
const CateringPhotosEditor = dynamic(
  () => import("@/components/catering-photos-editor").then((m) => ({ default: m.CateringPhotosEditor })),
  { loading: () => LOADING }
)

type Section = "banner" | "colors" | "header" | "bestSeller" | "cateringCards" | "cateringPhotos"

const SECTIONS: { key: Section; label: string }[] = [
  { key: "banner", label: "البانر" },
  { key: "colors", label: "الألوان" },
  { key: "header", label: "الرأس والشعار" },
  { key: "bestSeller", label: "الأكثر طلبًا" },
  { key: "cateringCards", label: "بطاقات الكاترينج" },
  { key: "cateringPhotos", label: "صور المناسبات" },
]

export default function AppearancePage() {
  const [section, setSection] = useState<Section>("banner")
  const [banner, setBanner] = useState<BannerConfig>(DEFAULT_BANNER)
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME)
  const [header, setHeader] = useState<HeaderConfig>(DEFAULT_HEADER_CONFIG)
  const [bestSellerCard, setBestSellerCard] = useState<BestSellerCardConfig>(DEFAULT_BEST_SELLER_CARD_CONFIG)
  const [showPreviewMobile, setShowPreviewMobile] = useState(false)

  const preview = <LivePreview theme={theme} banner={banner} header={header} bestSellerCard={bestSellerCard} />

  return (
    <div dir="rtl">
      <AdminPageHeader
        title="المظهر"
        description="معاينة حية للبانر، الألوان، الرأس والشعار، بطاقة الأكثر طلبًا، وبطاقات باقات الكاترينج"
      />
      <div className="mx-auto max-w-6xl p-4 md:p-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="order-2 space-y-4 lg:order-1">
            <div className="flex gap-1.5 overflow-x-auto rounded-2xl bg-admin-bg p-1.5">
              {SECTIONS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSection(s.key)}
                  className={cn(
                    "flex-shrink-0 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-bold transition-colors",
                    section === s.key ? "bg-white text-admin-ink shadow-sm" : "text-admin-muted-2"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowPreviewMobile((v) => !v)}
              className="w-full rounded-xl border border-admin-border-soft bg-white py-2.5 text-sm font-bold text-admin-ink lg:hidden"
            >
              {showPreviewMobile ? "إخفاء المعاينة" : "إظهار المعاينة الحية"}
            </button>
            {showPreviewMobile ? <div className="lg:hidden">{preview}</div> : null}

            <div className={section === "banner" ? "" : "hidden"}>
              <HeroBannerEditor onDraftChange={setBanner} />
            </div>
            <div className={section === "colors" ? "" : "hidden"}>
              <ThemeEditor onDraftChange={setTheme} />
            </div>
            <div className={section === "header" ? "" : "hidden"}>
              <HeaderEditor onDraftChange={setHeader} />
            </div>
            <div className={section === "bestSeller" ? "" : "hidden"}>
              <BestSellerCardEditor onDraftChange={setBestSellerCard} />
            </div>
            <div className={section === "cateringCards" ? "" : "hidden"}>
              <CateringCardColorEditor />
            </div>
            <div className={section === "cateringPhotos" ? "" : "hidden"}>
              <CateringPhotosEditor />
            </div>
          </div>

          <div className="order-1 hidden lg:order-2 lg:block">
            <div className="sticky top-[5.5rem]">{preview}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
