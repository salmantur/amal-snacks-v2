import { Suspense } from "react"
import { SWRConfig } from "swr"
import { Header } from "@/components/header"
import { HeroBanner } from "@/components/hero-banner"
import { TrustSignals } from "@/components/trust-signals"
import { CartBar } from "@/components/cart-bar"
import { HomeContent } from "@/components/home-content"
import { HomeLayoutPreview } from "@/components/home-layout-preview"
import { fetchMenuItems } from "@/lib/fetch-menu"
import { decodeMenuItems } from "@/lib/text"

type HomePageProps = {
  searchParams?: Promise<{
    homeui?: string
  }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = searchParams ? await searchParams : undefined
  const homeui = params?.homeui

  // Fetch the menu on the server and seed SWR's cache so the first paint already has
  // real products instead of waiting for hydration + a client-side round trip.
  const { data, error } = await fetchMenuItems()
  const menuFallback = { data: decodeMenuItems(data), error }

  if (homeui === "studio" || homeui === "soft" || homeui === "market") {
    return (
      <SWRConfig value={{ fallback: { "/api/menu": menuFallback } }}>
        <HomeLayoutPreview variant={homeui} />
      </SWRConfig>
    )
  }

  if (homeui === "classic") {
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
