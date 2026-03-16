import { Suspense } from "react"
import { Header } from "@/components/header"
import { HeroBanner } from "@/components/hero-banner"
import { CartBar } from "@/components/cart-bar"
import { HomeContent } from "@/components/home-content"
import { HomeLayoutPreview } from "@/components/home-layout-preview"

type HomePageProps = {
  searchParams?: Promise<{
    homeui?: string
  }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = searchParams ? await searchParams : undefined
  const homeui = params?.homeui

  if (homeui === "studio" || homeui === "soft" || homeui === "market") {
    return <HomeLayoutPreview variant={homeui} />
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fffdf9_0%,#ffffff_18rem)] pb-[calc(9rem+env(safe-area-inset-bottom))] md:bg-background md:pb-24">
      <Header />
      <HeroBanner />
      <Suspense fallback={null}>
        <HomeContent />
      </Suspense>
      <CartBar />
    </main>
  )
}
