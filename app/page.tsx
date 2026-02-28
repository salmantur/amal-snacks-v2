import { Header } from "@/components/header"
import { HeroBanner } from "@/components/hero-banner"
import { MenuGrid } from "@/components/menu-grid"
import { CartBar } from "@/components/cart-bar"
import { AIChat } from "@/components/ai-chat"
import { BestSellers } from "@/components/best-sellers"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background pb-24">
      <Header />
      <HeroBanner />
      <BestSellers />
      <MenuGrid />
      <CartBar />
      <AIChat />
    </main>
  )
}