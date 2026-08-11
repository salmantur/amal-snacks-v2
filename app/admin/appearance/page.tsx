"use client"

import dynamic from "next/dynamic"
import { AdminPageHeader } from "../page-header"

const LOADING = <div className="py-16 text-center text-sm text-muted-foreground">جارِ التحميل...</div>

const HeroBannerEditor = dynamic(
  () => import("@/components/hero-banner-editor").then((m) => ({ default: m.HeroBannerEditor })),
  { loading: () => LOADING }
)
const ThemeEditor = dynamic(
  () => import("@/components/theme-editor").then((m) => ({ default: m.ThemeEditor })),
  { loading: () => LOADING }
)
const BestSellerCardEditor = dynamic(
  () => import("@/components/best-seller-card-editor").then((m) => ({ default: m.BestSellerCardEditor })),
  { loading: () => LOADING }
)

export default function AppearancePage() {
  return (
    <div dir="rtl">
      <AdminPageHeader title="المظهر" description="البانر الرئيسي، الألوان، وبطاقات الأصناف الأكثر مبيعاً" />
      <div className="mx-auto max-w-lg space-y-6 p-4 md:p-6">
        <section>
          <h2 className="mb-3 text-sm font-bold text-foreground">البانر الرئيسي</h2>
          <HeroBannerEditor />
        </section>
        <section>
          <h2 className="mb-3 text-sm font-bold text-foreground">الألوان</h2>
          <ThemeEditor />
        </section>
        <section>
          <h2 className="mb-3 text-sm font-bold text-foreground">الأكثر مبيعاً</h2>
          <BestSellerCardEditor />
        </section>
      </div>
    </div>
  )
}
