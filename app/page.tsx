import { Suspense } from "react"
import { unstable_cache } from "next/cache"
import { SWRConfig } from "swr"
import { Header } from "@/components/header"
import { HeroBanner } from "@/components/hero-banner"
import { TrustSignals } from "@/components/trust-signals"
import { CartBar } from "@/components/cart-bar"
import { HomeContent } from "@/components/home-content"
import { HomeLayoutPreview } from "@/components/home-layout-preview"
import { HomeSkeleton } from "@/components/home-skeleton"
import { fetchMenuItems } from "@/lib/fetch-menu"
import { fetchHomeLayoutConfig } from "@/lib/fetch-home-layout-config"
import { decodeMenuItems } from "@/lib/text"

type HomePageProps = {
  searchParams?: Promise<{
    homeui?: string
  }>
}

// The home page used to await this directly with no Suspense boundary,
// blocking the entire response on a fresh, uncached full-table query on
// every single visit - bypassing the 30s ISR cache /api/menu already has.
// Caching it here too (same window, same "menu" tag so both can be
// invalidated together later) means most visits hit warm data instead of
// a cold Supabase round trip.
const getCachedMenu = unstable_cache(async () => fetchMenuItems(), ["home-page-menu"], {
  revalidate: 30,
  tags: ["menu"],
})

// Same reasoning as getCachedMenu above: the admin-selected default layout
// (set from /admin/appearance) is read on every visit, so it's cached too
// rather than hitting Supabase per request.
const getCachedHomeLayoutConfig = unstable_cache(async () => fetchHomeLayoutConfig(), ["home-layout-config"], {
  revalidate: 30,
  tags: ["home_layout_config"],
})

async function HomeData({ homeui }: { homeui?: string }) {
  const { data, error } = await getCachedMenu()
  const menuFallback = { data: decodeMenuItems(data), error }

  // ?homeui= always wins, so staff can preview any variant regardless of
  // the saved default. Otherwise fall back to whatever's been picked in
  // the admin Appearance > "تخطيط الرئيسية" section.
  const effectiveVariant = homeui ?? (await getCachedHomeLayoutConfig()).variant

  if (effectiveVariant === "studio" || effectiveVariant === "soft" || effectiveVariant === "market") {
    return (
      <SWRConfig value={{ fallback: { "/api/menu": menuFallback } }}>
        <HomeLayoutPreview variant={effectiveVariant} />
      </SWRConfig>
    )
  }

  if (effectiveVariant === "classic") {
    return (
      <SWRConfig value={{ fallback: { "/api/menu": menuFallback } }}>
        <main className="min-h-screen bg-[linear-gradient(180deg,#fffdf9_0%,#ffffff_18rem)] pb-[calc(9rem+env(safe-area-inset-bottom))] md:bg-background md:pb-24">
          <Header />
          <HeroBanner />
          <TrustSignals />
          <Suspense fallback={null}>
            <HomeContent />
          </Suspense>
          <CartBar />
        </main>
      </SWRConfig>
    )
  }

  return (
    <SWRConfig value={{ fallback: { "/api/menu": menuFallback } }}>
      <HomeLayoutPreview variant="editorial" />
    </SWRConfig>
  )
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = searchParams ? await searchParams : undefined
  const homeui = params?.homeui

  // Reading searchParams is fast (no network) - only the data fetch inside
  // HomeData needs the Suspense boundary, so the shell below streams
  // immediately on every request instead of blocking on Supabase.
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeData homeui={homeui} />
    </Suspense>
  )
}
