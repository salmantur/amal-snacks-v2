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
import { useMemo, useState, type ReactNode } from "react"
import { useCart } from "@/components/cart-provider"
import { PriceWithRiyalLogo } from "@/components/ui/price-with-riyal-logo"
import { useCategories } from "@/hooks/use-categories"
import { useMenu } from "@/hooks/use-menu"
import { cn } from "@/lib/utils"

export type HomePreviewVariant = "studio" | "soft" | "market"

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

export function HomeLayoutPreview({
  variant,
}: {
  variant: HomePreviewVariant
}) {
  if (variant === "soft") return <SoftPreview />
  if (variant === "market") return <MarketPreview />
  return <StudioPreview />
}
