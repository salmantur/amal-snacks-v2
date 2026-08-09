"use client"

import Image from "next/image"
import {
  Heart,
  Home,
  Menu,
  Plus,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  User,
} from "lucide-react"
import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from "react"
import { useCart, type MenuItem } from "@/components/cart-provider"
import { PriceWithRiyalLogo } from "@/components/ui/price-with-riyal-logo"
import { SaudiRiyalIcon } from "@/components/ui/saudi-riyal-icon"
import { useCategories, type Category } from "@/hooks/use-categories"
import { useMenu } from "@/hooks/use-menu"
import { getBestSellerCandidates } from "@/lib/best-sellers"
import { smartFilterMenuItems } from "@/lib/smart-search"
import { cn } from "@/lib/utils"

export type HomePreviewVariant = "studio" | "soft" | "market" | "editorial"

function PreviewImage({
  src,
  alt,
  className,
}: {
  src?: string
  alt: string
  className?: string
}) {
  if (!src) {
    return <div className={cn("rounded-[inherit] bg-white/60", className)} />
  }

  return (
    <div className={cn("relative overflow-hidden rounded-[inherit]", className)}>
      <Image src={src} alt={alt} fill sizes="240px" className="object-cover" />
    </div>
  )
}

function PreviewShell({
  children,
  bgClassName,
}: {
  children: ReactNode
  bgClassName: string
}) {
  return (
    <main className={cn("min-h-screen pb-28", bgClassName)}>
      <div className="mx-auto max-w-[430px] px-5 pb-20 pt-5">{children}</div>
    </main>
  )
}

function BottomNav({ accentClassName }: { accentClassName: string }) {
  return (
    <nav className="fixed bottom-5 left-1/2 z-20 flex h-16 w-[calc(100%-2rem)] max-w-[390px] -translate-x-1/2 items-center justify-around rounded-[2rem] border border-white/60 bg-white/82 px-3 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <button className={cn("flex h-12 w-12 items-center justify-center rounded-[1.3rem] text-white shadow-lg", accentClassName)}>
        <Home className="h-5 w-5" />
      </button>
      <button className="text-slate-300">
        <Heart className="h-5 w-5" />
      </button>
      <button className="text-slate-300">
        <ShoppingBag className="h-5 w-5" />
      </button>
      <button className="text-slate-300">
        <User className="h-5 w-5" />
      </button>
    </nav>
  )
}

function StudioPreview() {
  const { menuItems, isLoading } = useMenu()
  const { categories } = useCategories()
  const { addItem, totalItems, totalPrice } = useCart()
  const [searchValue, setSearchValue] = useState("")

  const visibleCategories = useMemo(
    () => categories.filter((category) => category.isVisible).slice(0, 4),
    [categories]
  )
  const heroItem = menuItems.find((item) => item.isFeatured) ?? menuItems[0] ?? null
  const gridItems = useMemo(() => menuItems.slice(0, 4), [menuItems])

  return (
    <PreviewShell bgClassName="bg-[#f3eee6] text-[#2f241f]">
      <header className="mb-6 rounded-[2.2rem] bg-[#fbf8f2] px-5 py-5 shadow-[0_18px_40px_rgba(82,63,43,0.08)]">
        <div className="mb-5 flex items-center justify-between">
          <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#6f5948] shadow-sm">
            <Menu className="h-5 w-5" />
          </button>
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-[0.45em] text-[#b58a68]">Amal Snacks</p>
            <h1 className="mt-1 text-[28px] leading-none" style={{ fontFamily: '"DM Serif Display", serif' }}>
              Curated Bites
            </h1>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#eadfd1] bg-white">
            <User className="h-5 w-5 text-[#8e7865]" />
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#bea58f]" />
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="ابحث عن منتجات أمل سناك"
            dir="rtl"
            className="h-14 w-full rounded-full border-none bg-white pl-11 pr-14 text-sm text-[#5f4e42] placeholder:text-[#c8b7a8] focus:ring-1 focus:ring-[#d2b296]"
          />
          <div className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[#f6e4d3] text-[#bf7e53]">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
        </div>
      </header>

      <section className="mb-6 overflow-hidden rounded-[2.2rem] bg-[#d9c0a8] shadow-[0_20px_40px_rgba(111,89,72,0.16)]">
        <div className="grid grid-cols-[1fr_1.2fr] items-stretch">
          <div className="flex flex-col justify-between p-5 text-[#402c20]">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[#84553a]">Fresh Drop</p>
              <h2 className="mt-3 text-4xl leading-none" style={{ fontFamily: '"DM Serif Display", serif' }}>
                30%
              </h2>
              <p className="mt-2 text-sm text-[#6a4f3d]">على منتجات مختارة هذا الأسبوع</p>
            </div>
            <div className="flex gap-2">
              <div className="h-2 w-2 rounded-full bg-white/80" />
              <div className="h-2 w-8 rounded-full bg-white" />
              <div className="h-2 w-2 rounded-full bg-white/60" />
            </div>
          </div>
          <div className="relative min-h-[220px]">
            <PreviewImage src={heroItem?.image} alt={heroItem?.name ?? "Studio hero"} className="h-full w-full" />
          </div>
        </div>
      </section>

      <section className="mb-6 overflow-x-auto pb-1">
        <div className="flex gap-3">
          <button className="rounded-full bg-[#4d392d] px-5 py-3 text-sm font-medium text-white">الكل</button>
          {visibleCategories.map((category) => (
            <button key={category.id} className="rounded-full bg-[#fbf8f2] px-5 py-3 text-sm font-medium text-[#7d6a5c] shadow-sm">
              {category.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <button className="text-sm text-[#a07f69]">عرض الكل</button>
          <h3 className="text-2xl" style={{ fontFamily: '"DM Serif Display", serif' }}>مختارات اليوم</h3>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-52 animate-pulse rounded-[1.8rem] bg-white/70" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {gridItems.map((item) => (
              <div key={item.id} className="rounded-[1.8rem] bg-[#fbf8f2] p-3 shadow-[0_12px_30px_rgba(82,63,43,0.07)]">
                <div className="mb-3 flex aspect-square items-center justify-center rounded-[1.4rem] bg-[#f5eee6]">
                  <div className="relative h-24 w-24">
                    <PreviewImage src={item.image} alt={item.name} className="h-full w-full bg-transparent" />
                  </div>
                </div>
                <p className="text-right text-sm font-medium text-[#4d392d]">{item.name}</p>
                <div className="mt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => addItem(item, 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4d392d] text-white"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-semibold text-[#9b6947]">
                    <PriceWithRiyalLogo value={item.price} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {totalItems > 0 ? (
        <div className="mt-6 rounded-[1.8rem] bg-[#4d392d] px-5 py-4 text-right text-white shadow-lg">
          <p className="text-xs text-white/70">إجمالي السلة</p>
          <p className="mt-1 text-sm font-semibold">
            {totalItems} عناصر · <PriceWithRiyalLogo value={totalPrice} />
          </p>
        </div>
      ) : null}

      <BottomNav accentClassName="bg-[#4d392d]" />
    </PreviewShell>
  )
}

function SoftPreview() {
  const { menuItems, isLoading } = useMenu()
  const { categories } = useCategories()
  const { addItem, totalItems, totalPrice } = useCart()
  const visibleCategories = useMemo(() => categories.filter((category) => category.isVisible).slice(0, 4), [categories])
  const heroItem = menuItems[0] ?? null
  const gridItems = useMemo(() => menuItems.slice(0, 4), [menuItems])

  return (
    <PreviewShell bgClassName="bg-[linear-gradient(180deg,#f8fbff_0%,#f5f7fb_100%)] text-[#1f2a44]">
      <header className="mb-8">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex h-14 w-14 items-center justify-center rounded-[1.7rem] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
            <Menu className="h-6 w-6 text-[#9aa5bd]" />
          </div>
          <div className="text-center">
            <p className="text-[12px] uppercase tracking-[0.42em] text-[#9ea7ff]">Amal Snacks</p>
            <h1 className="mt-1 text-[30px] font-light uppercase tracking-[0.18em]">Discovery</h1>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
            <User className="h-6 w-6 text-[#b6bfd2]" />
          </div>
        </div>

        <div className="relative rounded-[2rem] bg-white p-2 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#bcc5d7]">
            <Search className="h-5 w-5" />
          </div>
          <input
            readOnly
            placeholder="ابحث عن منتجات مختارة"
            dir="rtl"
            className="h-14 w-full rounded-[1.4rem] border-none bg-transparent pl-12 pr-16 text-right text-sm text-[#7f89a0] placeholder:text-[#cfd6e2] focus:ring-0"
          />
          <div className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[#ffeef3] text-[#f09bb0]">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
        </div>
      </header>

      <section className="mb-8 overflow-hidden rounded-[2.4rem] bg-[linear-gradient(135deg,#e6edff_0%,#f6f8ff_45%,#fff1e8_100%)] p-5 shadow-[0_18px_44px_rgba(31,42,68,0.08)]">
        <div className="flex items-center gap-4">
          <div className="w-[42%] shrink-0">
            <p className="text-xs uppercase tracking-[0.28em] text-[#8b96ff]">Season Launch</p>
            <h2 className="mt-3 text-5xl font-extralight leading-none text-[#3341c8]">50%</h2>
            <p className="mt-2 text-lg font-light text-[#3341c8]">خصم</p>
            <div className="mt-6 flex gap-2">
              <div className="h-2 w-8 rounded-full bg-[#8fa1ff]" />
              <div className="h-2 w-2 rounded-full bg-white" />
              <div className="h-2 w-2 rounded-full bg-white/70" />
            </div>
          </div>
          <div className="relative min-h-[220px] flex-1 overflow-hidden rounded-[2rem] bg-[#ffd38e]">
            <PreviewImage src={heroItem?.image} alt={heroItem?.name ?? "Soft hero"} className="h-full w-full" />
          </div>
        </div>
      </section>

      <section className="mb-8 overflow-x-auto pb-1">
        <div className="flex gap-3">
          <button className="rounded-[1.3rem] bg-white px-5 py-3 text-sm font-medium text-[#56607a] shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
            <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#ff93ab]" />
            الكل
          </button>
          {visibleCategories.map((category) => (
            <button key={category.id} className="rounded-[1.3rem] px-4 py-3 text-sm font-light text-[#a6aec0]">
              {category.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between">
          <button className="text-sm font-light text-[#b0b7c8]">View All</button>
          <h3 className="text-[32px] font-extralight tracking-[0.08em]">Popular</h3>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-56 animate-pulse rounded-[2rem] bg-white/70" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {gridItems.map((item, index) => {
              const cards = ["bg-[#f3faf7]", "bg-[#fbf4f2]", "bg-[#f4f7fc]", "bg-[#faf4ea]"]
              return (
                <div key={item.id} className={cn("rounded-[2rem] p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]", cards[index % cards.length])}>
                  <div className="mb-4 rounded-[1.6rem] bg-white/80 p-5">
                    <div className="relative mx-auto h-28 w-28">
                      <PreviewImage src={item.image} alt={item.name} className="h-full w-full bg-transparent" />
                    </div>
                  </div>
                  <p className="text-left text-sm font-light text-[#5f6677]">{item.name}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-base font-light text-[#1f2a44]">
                      <PriceWithRiyalLogo value={item.price} />
                    </p>
                    <button
                      type="button"
                      onClick={() => addItem(item, 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-[1rem] bg-white text-[#ff8ca6] shadow-sm"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {totalItems > 0 ? (
        <div className="mt-6 rounded-[2rem] bg-white px-5 py-4 text-right shadow-[0_16px_34px_rgba(15,23,42,0.05)]">
          <p className="text-xs font-light text-[#a9b1c2]">إجمالي السلة</p>
          <p className="mt-1 text-sm text-[#1f2a44]">
            {totalItems} عناصر · <PriceWithRiyalLogo value={totalPrice} />
          </p>
        </div>
      ) : null}

      <BottomNav accentClassName="bg-[#ff7f99]" />
    </PreviewShell>
  )
}

function MarketPreview() {
  const { menuItems, isLoading } = useMenu()
  const { categories } = useCategories()
  const { addItem, totalItems, totalPrice } = useCart()

  const visibleCategories = useMemo(() => categories.filter((category) => category.isVisible).slice(0, 5), [categories])
  const featuredItems = useMemo(() => menuItems.filter((item) => item.isFeatured), [menuItems])
  const heroItem = featuredItems[0] ?? menuItems[0] ?? null
  const spotlightItem = featuredItems[1] ?? menuItems[1] ?? null
  const gridItems = useMemo(() => menuItems.slice(0, 4), [menuItems])

  return (
    <PreviewShell bgClassName="bg-[#f7f7f4] text-[#223029]">
      <header className="mb-6 rounded-[2rem] bg-white px-5 py-5 shadow-[0_14px_32px_rgba(31,53,41,0.06)]">
        <div className="mb-4 flex items-center justify-between">
          <button className="flex h-11 w-11 items-center justify-center rounded-full bg-[#edf4ec] text-[#4c6a57]">
            <Menu className="h-5 w-5" />
          </button>
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-[0.42em] text-[#739072]">Amal Snacks</p>
            <h1 className="mt-1 text-[28px] font-semibold tracking-[0.06em] text-[#2f4a3a]">Fresh Market</h1>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f7eee3] text-[#be7b50]">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-1">
          <button className="rounded-full bg-[#2f4a3a] px-4 py-2.5 text-sm font-medium text-white">جاهز الآن</button>
          <button className="rounded-full bg-[#f4f5ef] px-4 py-2.5 text-sm font-medium text-[#6f7f73]">هدايا</button>
          <button className="rounded-full bg-[#f4f5ef] px-4 py-2.5 text-sm font-medium text-[#6f7f73]">ضيافة</button>
        </div>
      </header>

      <section className="mb-6 grid gap-4">
        <div className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#d9ead8_0%,#f5efe2_100%)] p-5 shadow-[0_16px_36px_rgba(47,74,58,0.1)]">
          <div className="flex items-center gap-4">
            <div className="flex-1 text-right">
              <p className="text-xs uppercase tracking-[0.28em] text-[#739072]">Weekly Pick</p>
              <h2 className="mt-2 text-3xl font-semibold text-[#2f4a3a]">{heroItem?.name ?? "منتجات مميزة"}</h2>
              <p className="mt-2 text-sm text-[#5d715f]">ألذ الاختيارات للضيافة والتقديم السريع</p>
            </div>
            <div className="relative h-28 w-28 overflow-hidden rounded-[1.6rem] bg-white/70">
              <PreviewImage src={heroItem?.image} alt={heroItem?.name ?? "Market hero"} className="h-full w-full" />
            </div>
          </div>
        </div>

        {spotlightItem ? (
          <div className="flex items-center gap-4 rounded-[2rem] bg-white p-4 shadow-[0_14px_32px_rgba(47,74,58,0.07)]">
            <div className="relative h-24 w-24 overflow-hidden rounded-[1.4rem] bg-[#f4f5ef]">
              <PreviewImage src={spotlightItem.image} alt={spotlightItem.name} className="h-full w-full" />
            </div>
            <div className="flex-1 text-right">
              <p className="text-sm font-medium text-[#2f4a3a]">{spotlightItem.name}</p>
              <p className="mt-1 text-xs text-[#7a8a7d]">إضافة سريعة ومناسبة للجمعات</p>
              <div className="mt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => addItem(spotlightItem, 1)}
                  className="rounded-full bg-[#be7b50] px-4 py-2 text-xs font-semibold text-white"
                >
                  أضف للسلة
                </button>
                <span className="font-semibold text-[#be7b50]">
                  <PriceWithRiyalLogo value={spotlightItem.price} />
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section className="mb-6 overflow-x-auto pb-1">
        <div className="flex gap-3">
          <button className="rounded-full border border-[#739072] bg-[#eff6ee] px-5 py-3 text-sm font-semibold text-[#2f4a3a]">الكل</button>
          {visibleCategories.map((category) => (
            <button key={category.id} className="rounded-full bg-white px-5 py-3 text-sm font-medium text-[#758779] shadow-sm">
              {category.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <button className="text-sm text-[#97a599]">عرض الكل</button>
          <h3 className="text-xl font-semibold text-[#2f4a3a]">الأكثر طلباً</h3>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-52 animate-pulse rounded-[1.8rem] bg-white/70" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {gridItems.map((item) => (
              <div key={item.id} className="rounded-[1.8rem] bg-white p-3 shadow-[0_14px_32px_rgba(47,74,58,0.06)]">
                <div className="mb-3 flex aspect-square items-center justify-center rounded-[1.4rem] bg-[#f4f5ef]">
                  <div className="relative h-24 w-24">
                    <PreviewImage src={item.image} alt={item.name} className="h-full w-full bg-transparent" />
                  </div>
                </div>
                <p className="text-right text-sm font-medium text-[#355241]">{item.name}</p>
                <div className="mt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => addItem(item, 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eff6ee] text-[#2f4a3a]"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-semibold text-[#be7b50]">
                    <PriceWithRiyalLogo value={item.price} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {totalItems > 0 ? (
        <div className="mt-6 rounded-[1.8rem] bg-[#2f4a3a] px-5 py-4 text-right text-white shadow-lg">
          <p className="text-xs text-white/70">إجمالي السلة</p>
          <p className="mt-1 text-sm font-semibold">
            {totalItems} عناصر · <PriceWithRiyalLogo value={totalPrice} />
          </p>
        </div>
      ) : null}

      <BottomNav accentClassName="bg-[#2f4a3a]" />
    </PreviewShell>
  )
}

const EDITORIAL_INK = "oklch(16% 0.01 280)"
const EDITORIAL_ACCENT = "oklch(56% 0.17 28)"
const EDITORIAL_MUTED = "oklch(45% 0.015 270)"
const EDITORIAL_MUTED_SOFT = "oklch(48% 0.02 270)"
const EDITORIAL_MUTED_FAINT = "oklch(52% 0.012 270)"
const EDITORIAL_MUTED_FAINTER = "oklch(55% 0.02 270)"
const EDITORIAL_SURFACE = "oklch(98% 0.003 75)"
const EDITORIAL_BORDER = "oklch(93% 0.008 270)"
const EDITORIAL_BORDER_STRONG = "oklch(90% 0.01 270)"
const EDITORIAL_IMG_BG = "oklch(93% 0.02 75)"
const EDITORIAL_BEST_ID = "editorial_best"

type EditorialCategory = { id: string; label: string; dbCategories?: string[] }

function EditorialBagIcon() {
  return (
    <span className="relative inline-block h-[15px] w-[17px]">
      <span
        className="absolute right-[3.5px] top-[-5px] h-[7px] w-[9px] rounded-t-[9px] box-border"
        style={{ border: `1.6px solid ${EDITORIAL_INK}`, borderBottom: "none" }}
      />
      <span
        className="absolute bottom-0 right-0 h-[12px] w-[17px] box-border"
        style={{ border: `1.6px solid ${EDITORIAL_INK}` }}
      />
    </span>
  )
}

function EditorialProductImage({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  if (!src) {
    return <div className={cn("rounded-[inherit]", className)} style={{ background: EDITORIAL_IMG_BG }} />
  }
  return (
    <div className={cn("relative overflow-hidden rounded-[inherit]", className)} style={{ background: EDITORIAL_IMG_BG }}>
      <Image src={src} alt={alt} fill sizes="240px" className="object-cover" />
    </div>
  )
}

function EditorialPreview() {
  const { menuItems, isLoading } = useMenu()
  const { categories } = useCategories()
  const { items: cartItems, addItem, updateQuantity, totalItems, totalPrice } = useCart()

  const [selectedCategory, setSelectedCategory] = useState<string>(EDITORIAL_BEST_ID)
  const [searchQuery, setSearchQuery] = useState("")
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null)
  const [drawerQty, setDrawerQty] = useState(1)
  const [flashId, setFlashId] = useState<string | null>(null)

  const uiCategories = useMemo<EditorialCategory[]>(
    () => [
      { id: EDITORIAL_BEST_ID, label: "الأكثر طلبًا" },
      ...categories.filter((c: Category) => c.isVisible).map((c) => ({ id: c.id, label: c.label, dbCategories: c.dbCategories })),
    ],
    [categories]
  )

  useEffect(() => {
    if (!uiCategories.some((c) => c.id === selectedCategory)) setSelectedCategory(EDITORIAL_BEST_ID)
  }, [uiCategories, selectedCategory])

  const isSearching = searchQuery.trim().length > 0
  const searchResults = useMemo(
    () => (isSearching ? smartFilterMenuItems(menuItems, searchQuery) : []),
    [isSearching, menuItems, searchQuery]
  )
  const isBestCategory = selectedCategory === EDITORIAL_BEST_ID
  const featuredItems = useMemo(() => getBestSellerCandidates(menuItems, []), [menuItems])
  const activeCategory = uiCategories.find((c) => c.id === selectedCategory)
  const baseGrid = isBestCategory
    ? featuredItems
    : menuItems.filter((item) => (activeCategory?.dbCategories || []).includes(item.category))
  const gridItems = isSearching ? searchResults : baseGrid
  const gridSectionLabel = isSearching
    ? `نتائج البحث (${gridItems.length})`
    : activeCategory?.label || ""

  const openProduct = (item: MenuItem) => {
    setSelectedProduct(item)
    setDrawerQty(1)
    setDrawerOpen(true)
  }

  const quickAdd = (item: MenuItem, e: MouseEvent) => {
    e.stopPropagation()
    addItem(item, 1)
    setFlashId(item.id)
    window.setTimeout(() => setFlashId((cur) => (cur === item.id ? null : cur)), 900)
  }

  const addFromDrawer = () => {
    if (!selectedProduct) return
    addItem(selectedProduct, drawerQty)
    setDrawerOpen(false)
  }

  const jumpToCategory = (id: string) => {
    setSelectedCategory(id)
    setSearchQuery("")
    setMenuOpen(false)
  }

  const drawerTotal = selectedProduct ? selectedProduct.price * drawerQty : 0

  return (
    <div className="min-h-screen" dir="rtl" style={{ background: EDITORIAL_SURFACE }}>
      <div className="mx-auto flex min-h-screen max-w-[430px] flex-col" style={{ background: EDITORIAL_SURFACE }}>
        <div
          className="sticky top-0 z-30 flex flex-shrink-0 items-center justify-between px-5 pb-2.5 pt-[18px]"
          style={{ background: EDITORIAL_SURFACE }}
        >
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="فتح القائمة"
            className="flex h-[34px] w-[34px] flex-col items-start justify-center gap-[5px] border-none bg-transparent p-0"
          >
            <span className="h-[1.5px] w-[18px]" style={{ background: EDITORIAL_INK }} />
            <span className="h-[1.5px] w-[11px]" style={{ background: EDITORIAL_INK }} />
          </button>
          <span className="font-serif-text text-[17px] font-black tracking-[0.2px]" style={{ color: EDITORIAL_INK }}>
            أمل سناك
          </span>
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label="فتح السلة"
            className="relative flex h-[34px] w-[34px] items-center justify-center border-none bg-transparent p-0"
          >
            <EditorialBagIcon />
            {totalItems > 0 ? (
              <span
                className="absolute -right-1 -top-1 flex h-[15px] min-w-[15px] items-center justify-center rounded-full px-[3px] text-[9px] font-extrabold text-white"
                style={{ background: EDITORIAL_ACCENT }}
              >
                {totalItems}
              </span>
            ) : null}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="px-5 pb-[22px] pt-5">
            <span
              className="mb-2.5 block text-[11px] font-bold uppercase tracking-[1.5px]"
              style={{ color: EDITORIAL_ACCENT }}
            >
              مأكولات وضيافة
            </span>
            <h1 className="font-serif-text m-0 text-[40px] font-black leading-[1.05]" style={{ color: EDITORIAL_INK }}>
              تُحضّر بحب
              <br />
              لمناسباتك
            </h1>
          </div>

          <div
            className="relative mx-5 mb-5 flex items-center pb-2.5"
            style={{ borderBottom: `1.5px solid ${EDITORIAL_INK}` }}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن وجبتك المفضلة"
              className="flex-1 border-none bg-transparent p-0 text-[15px] outline-none"
              style={{ color: EDITORIAL_INK }}
            />
            {isSearching ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="مسح البحث"
                className="border-none bg-transparent p-0 text-[16px] font-bold leading-none"
                style={{ color: EDITORIAL_MUTED_FAINTER }}
              >
                ×
              </button>
            ) : null}
          </div>

          {isSearching ? (
            <div>
              <h2
                className="mx-5 mb-3.5 text-right text-[13px] font-bold tracking-[0.4px]"
                style={{ color: EDITORIAL_MUTED }}
              >
                {gridSectionLabel}
              </h2>
              {gridItems.length === 0 ? (
                <div className="px-6 py-10 text-center text-[13px]" style={{ color: EDITORIAL_MUTED_FAINTER }}>
                  لا توجد نتائج مطابقة لبحثك
                </div>
              ) : null}
              <div className="grid grid-cols-2 gap-x-3.5 gap-y-5 px-5 pb-3">
                {gridItems.map((item) => {
                  const isFlashed = flashId === item.id
                  return (
                    <div
                      key={item.id}
                      onClick={() => openProduct(item)}
                      className="cursor-pointer transition-opacity duration-150 hover:opacity-85"
                    >
                      <EditorialProductImage src={item.image} alt={item.name} className="aspect-square" />
                      <div className="pt-2.5 text-right">
                        <h3 className="m-0 text-[13.5px] font-bold leading-[1.3]" style={{ color: EDITORIAL_INK }}>
                          {item.name}
                        </h3>
                        <div className="mt-1.5 flex items-center justify-between">
                          <span className="text-[13px] font-bold" style={{ color: EDITORIAL_MUTED }}>
                            <PriceWithRiyalLogo value={item.price} />
                          </span>
                          <button
                            type="button"
                            onClick={(e) => quickAdd(item, e)}
                            aria-label="إضافة"
                            className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-[14px] font-black leading-none transition-colors"
                            style={{
                              border: `1.5px solid ${EDITORIAL_INK}`,
                              background: isFlashed ? EDITORIAL_INK : "transparent",
                              color: isFlashed ? "#fff" : EDITORIAL_INK,
                            }}
                          >
                            {isFlashed ? "✓" : "+"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div>
              <div
                className="sticky z-[6] mt-1.5 py-2.5 backdrop-blur-[8px]"
                style={{ top: 0, background: "oklch(98% 0.003 75 / 0.92)" }}
              >
                <div className="flex gap-2 overflow-x-auto px-5 pb-0.5">
                  {uiCategories.map((cat) => {
                    const isActive = cat.id === selectedCategory
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className="flex-shrink-0 whitespace-nowrap rounded-full border-none px-4 py-2.5 text-[12.5px] font-bold transition-colors"
                        style={{
                          background: isActive ? EDITORIAL_INK : "transparent",
                          color: isActive ? "#fff" : EDITORIAL_MUTED,
                        }}
                      >
                        {cat.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="mt-2.5 px-5 pb-6">
                <h2 className="mb-3.5 text-right text-[13px] font-bold tracking-[0.4px]" style={{ color: EDITORIAL_MUTED }}>
                  {gridSectionLabel}
                </h2>

                {isLoading ? (
                  <div className="grid grid-cols-2 gap-3.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="aspect-square animate-pulse rounded-[14px]" style={{ background: EDITORIAL_IMG_BG }} />
                    ))}
                  </div>
                ) : isBestCategory ? (
                  <div className="grid grid-cols-2 gap-3.5">
                    {gridItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => openProduct(item)}
                        className="relative cursor-pointer rounded-[24px] p-[9px] transition-transform duration-200 hover:-translate-y-1 active:scale-[0.985]"
                        style={{ filter: "drop-shadow(0px 4px 4px rgba(0,0,0,0.15)) drop-shadow(0px 1px 1.5px rgba(0,0,0,0.3))" }}
                      >
                        <div className="relative w-full overflow-hidden rounded-[14px]" style={{ aspectRatio: "0.78", background: EDITORIAL_IMG_BG }}>
                          <EditorialProductImage src={item.image} alt={item.name} className="absolute inset-0" />
                          <h3
                            className="font-serif-text absolute right-3.5 top-3.5 left-3.5 m-0 text-right text-[15px] font-black leading-[1.25]"
                            style={{ color: EDITORIAL_INK }}
                          >
                            {item.name}
                          </h3>
                          <div
                            className="absolute bottom-3.5 left-3.5 flex items-center justify-center gap-1 rounded-full px-[13px] py-1.5"
                            style={{
                              background: "rgba(255,255,255,0.65)",
                              border: "1px solid #d7d2cf",
                              boxShadow: "0 10px 24px 0 rgba(0,0,0,0.1)",
                            }}
                          >
                            <SaudiRiyalIcon className="h-[11px] w-[11px] shrink-0 text-[#212430]" />
                            <span className="text-[15px] font-extrabold leading-none text-[#212430]">
                              {item.price}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-x-3.5 gap-y-[22px]">
                    {gridItems.map((item) => {
                      const isFlashed = flashId === item.id
                      return (
                        <div
                          key={item.id}
                          onClick={() => openProduct(item)}
                          className="cursor-pointer transition-opacity duration-150 hover:opacity-85"
                        >
                          <EditorialProductImage src={item.image} alt={item.name} className="aspect-square" />
                          <div className="pt-2.5 text-right">
                            <h3 className="m-0 text-[13.5px] font-bold leading-[1.3]" style={{ color: EDITORIAL_INK }}>
                              {item.name}
                            </h3>
                            <p
                              className="m-0 mt-[5px] overflow-hidden text-[11.5px] leading-[1.4]"
                              style={{
                                color: EDITORIAL_MUTED_FAINT,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                              }}
                            >
                              {item.description}
                            </p>
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-[13px] font-bold" style={{ color: EDITORIAL_MUTED }}>
                                <PriceWithRiyalLogo value={item.price} />
                              </span>
                              <button
                                type="button"
                                onClick={(e) => quickAdd(item, e)}
                                aria-label="إضافة"
                                className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-[14px] font-black leading-none transition-colors"
                                style={{
                                  border: `1.5px solid ${EDITORIAL_INK}`,
                                  background: isFlashed ? EDITORIAL_INK : "transparent",
                                  color: isFlashed ? "#fff" : EDITORIAL_INK,
                                }}
                              >
                                {isFlashed ? "✓" : "+"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {totalItems > 0 ? <div className="h-[74px] flex-shrink-0" /> : null}
        </div>

        {totalItems > 0 ? (
          <div className="fixed inset-x-0 bottom-[18px] z-20 mx-auto max-w-[430px] px-4">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="flex w-full items-center justify-between rounded-[14px] border-none px-5 py-4 transition-transform active:scale-[0.97]"
              style={{ background: EDITORIAL_INK, boxShadow: "0 16px 30px -10px rgba(0,0,0,0.4)" }}
            >
              <span className="text-[14px] font-extrabold text-white">
                <PriceWithRiyalLogo value={totalPrice} />
              </span>
              <span className="text-[13px] font-semibold text-white/75">عرض السلة ({totalItems}) ‹</span>
            </button>
          </div>
        ) : null}
      </div>

      {drawerOpen && selectedProduct ? (
        <div className="fixed inset-0 z-50" dir="rtl">
          <div
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 animate-fade-in"
            style={{ background: "rgba(15,10,8,0.4)" }}
          />
          <div
            className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[88%] max-w-[430px] flex-col overflow-hidden rounded-t-[24px] animate-slide-up"
            style={{ background: EDITORIAL_SURFACE }}
          >
            <div className="flex-1 overflow-y-auto">
              <div className="relative">
                <div className="relative w-full" style={{ aspectRatio: "1.3", background: EDITORIAL_IMG_BG }}>
                  <EditorialProductImage src={selectedProduct.image} alt={selectedProduct.name} className="absolute inset-0" />
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="إغلاق"
                  className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border-none text-[15px] font-bold"
                  style={{ background: "rgba(255,255,255,0.92)", color: EDITORIAL_INK }}
                >
                  ×
                </button>
              </div>
              <div className="px-5 pb-1 pt-[22px] text-right">
                <h2 className="font-serif-text m-0 text-[22px] font-black" style={{ color: EDITORIAL_INK }}>
                  {selectedProduct.name}
                </h2>
                <p className="mt-2 text-[13px] leading-[1.6]" style={{ color: EDITORIAL_MUTED_SOFT }}>
                  {selectedProduct.description}
                </p>
                <p className="mt-3.5 text-[19px] font-extrabold" style={{ color: EDITORIAL_MUTED }}>
                  <PriceWithRiyalLogo value={selectedProduct.price} />
                </p>
              </div>
            </div>
            <div className="flex flex-shrink-0 items-center gap-3 px-5 pb-[22px] pt-4">
              <div
                className="flex items-center gap-3.5 rounded-full px-4 py-2"
                style={{ border: `1.5px solid ${EDITORIAL_BORDER_STRONG}` }}
              >
                <button
                  type="button"
                  onClick={() => setDrawerQty((q) => q + 1)}
                  aria-label="زيادة"
                  className="border-none bg-transparent text-[18px] font-black leading-none"
                  style={{ color: EDITORIAL_INK }}
                >
                  +
                </button>
                <span className="min-w-[16px] text-center text-[15px] font-extrabold">{drawerQty}</span>
                <button
                  type="button"
                  onClick={() => setDrawerQty((q) => Math.max(1, q - 1))}
                  aria-label="تقليل"
                  className="border-none bg-transparent text-[18px] font-black leading-none"
                  style={{ color: EDITORIAL_INK }}
                >
                  –
                </button>
              </div>
              <button
                type="button"
                onClick={addFromDrawer}
                className="flex h-[50px] flex-1 items-center justify-center gap-2 rounded-full border-none text-[15px] font-extrabold text-white"
                style={{ background: EDITORIAL_INK }}
              >
                أضف إلى السلة · <PriceWithRiyalLogo value={drawerTotal} />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {cartOpen ? (
        <div className="fixed inset-0 z-50" dir="rtl">
          <div
            onClick={() => setCartOpen(false)}
            className="absolute inset-0 animate-fade-in"
            style={{ background: "rgba(15,10,8,0.4)" }}
          />
          <div
            className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[82%] max-w-[430px] flex-col rounded-t-[24px] animate-slide-up"
            style={{ background: EDITORIAL_SURFACE }}
          >
            <div className="flex flex-shrink-0 items-center justify-between px-5 pb-3 pt-5">
              <h2 className="m-0 text-[16px] font-extrabold" style={{ color: EDITORIAL_INK }}>
                سلتك
              </h2>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                aria-label="إغلاق"
                className="flex h-[30px] w-[30px] items-center justify-center rounded-full border-none bg-transparent text-[16px] font-bold"
                style={{ color: EDITORIAL_INK }}
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-1.5">
              {cartItems.length > 0 ? (
                <div className="flex flex-col">
                  {cartItems.map((ci) => (
                    <div
                      key={ci.cartKey}
                      className="flex items-center gap-3 py-3"
                      style={{ borderBottom: `1px solid ${EDITORIAL_BORDER}` }}
                    >
                      <div className="flex-1 text-right">
                        <p className="m-0 text-[13.5px] font-bold" style={{ color: EDITORIAL_INK }}>
                          {ci.name}
                        </p>
                        <p className="mt-1 text-[12.5px] font-bold" style={{ color: EDITORIAL_MUTED }}>
                          <PriceWithRiyalLogo value={ci.price * ci.quantity} />
                        </p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(ci.cartKey, ci.quantity + 1)}
                          className="border-none bg-transparent text-[14px] font-black"
                          style={{ color: EDITORIAL_INK }}
                        >
                          +
                        </button>
                        <span className="min-w-[14px] text-center text-[13px] font-extrabold">{ci.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(ci.cartKey, ci.quantity - 1)}
                          className="border-none bg-transparent text-[14px] font-black"
                          style={{ color: EDITORIAL_INK }}
                        >
                          –
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-5 py-[50px] text-center text-[13px]" style={{ color: EDITORIAL_MUTED_FAINTER }}>
                  سلتك فارغة، أضف شيئًا لذيذًا
                </div>
              )}
            </div>
            {cartItems.length > 0 ? (
              <div className="flex-shrink-0 px-5 pb-5 pt-3.5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[13px]" style={{ color: EDITORIAL_MUTED_SOFT }}>
                    المجموع
                  </span>
                  <span className="text-[17px] font-black" style={{ color: EDITORIAL_INK }}>
                    <PriceWithRiyalLogo value={totalPrice} />
                  </span>
                </div>
                <button
                  type="button"
                  className="h-[50px] w-full rounded-full border-none text-[15px] font-extrabold text-white"
                  style={{ background: EDITORIAL_INK }}
                >
                  تأكيد الطلب
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {menuOpen ? (
        <div className="fixed inset-0 z-[60]" dir="rtl">
          <div
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 animate-fade-in"
            style={{ background: "rgba(15,10,8,0.35)" }}
          />
          <div
            className="absolute inset-y-0 right-0 flex w-[76%] max-w-[290px] flex-col"
            style={{ background: EDITORIAL_SURFACE }}
          >
            <div className="flex flex-shrink-0 items-center justify-between px-5 pb-4 pt-5">
              <span className="font-serif-text text-[16px] font-black" style={{ color: EDITORIAL_INK }}>
                القائمة
              </span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="إغلاق"
                className="flex h-[30px] w-[30px] items-center justify-center border-none bg-transparent text-[16px] font-bold"
                style={{ color: EDITORIAL_INK }}
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5">
              {uiCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => jumpToCategory(cat.id)}
                  className="block w-full border-none bg-transparent py-3.5 text-right text-[15px] font-semibold"
                  style={{ color: "oklch(20% 0.01 280)", borderBottom: `1px solid ${EDITORIAL_BORDER}` }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function HomeLayoutPreview({
  variant,
}: {
  variant: HomePreviewVariant
}) {
  if (variant === "soft") return <SoftPreview />
  if (variant === "market") return <MarketPreview />
  if (variant === "editorial") return <EditorialPreview />
  return <StudioPreview />
}
