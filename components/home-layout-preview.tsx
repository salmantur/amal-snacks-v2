"use client"

import Image from "next/image"
import dynamic from "next/dynamic"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Check, ImageIcon } from "lucide-react"
import { memo, useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react"
import { useCart, type MenuItem } from "@/components/cart-provider"
import { PriceWithRiyalLogo } from "@/components/ui/price-with-riyal-logo"
import { useBestSellersConfig } from "@/hooks/use-best-sellers-config"
import { useCategories, type Category } from "@/hooks/use-categories"
import { useCateringCardConfig } from "@/hooks/use-catering-card-config"
import { useCateringPhotosConfig } from "@/hooks/use-catering-photos-config"
import { useMenu } from "@/hooks/use-menu"
import { getBestSellerCandidates } from "@/lib/best-sellers"
import { CATERING_TIERS } from "@/lib/catering"
import type { CateringCardColors } from "@/lib/catering-card-config"
import { trapFocusOnTab } from "@/lib/dialog-focus"
import { smartFilterMenuItems } from "@/lib/smart-search"
import { cn } from "@/lib/utils"
import { isTraySizeVariantItem } from "@/lib/tray-configurator"

/**
 * Scroll-locks the page, traps focus, closes on Escape, and restores focus to
 * the trigger on close - the same behavior cart-sheet.tsx / time-picker.tsx
 * already implement, reused here for the editorial home's three sheets.
 */
function useDialogA11y(open: boolean, setOpen: (open: boolean) => void) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    const previousTouchAction = document.body.style.touchAction
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null

    document.body.style.overflow = "hidden"
    document.body.style.touchAction = "none"

    const focusTimeout = window.setTimeout(() => {
      containerRef.current?.focus()
    }, 0)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.clearTimeout(focusTimeout)
      window.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = previousOverflow
      document.body.style.touchAction = previousTouchAction
      returnFocusRef.current?.focus()
    }
  }, [open, setOpen])

  return containerRef
}

export type HomePreviewVariant = "studio" | "soft" | "market" | "editorial"

function parseVariantOption(raw: string, fallbackPrice: number): { label: string; price: number } {
  const value = (raw || "").trim()
  if (!value) return { label: "", price: fallbackPrice }
  const [labelPart, pricePart] = value.split("::")
  const label = (labelPart || value).trim()
  const parsedPrice = Number((pricePart || "").replace(/[^\d.]/g, ""))
  return {
    label,
    price: Number.isFinite(parsedPrice) && parsedPrice > 0 ? parsedPrice : fallbackPrice,
  }
}

const EDITORIAL_INK = "oklch(16% 0.01 280)"
const EDITORIAL_ACCENT = "oklch(56% 0.17 28)"
const EDITORIAL_MUTED = "oklch(45% 0.015 270)"
const EDITORIAL_MUTED_SOFT = "oklch(48% 0.02 270)"
const EDITORIAL_MUTED_FAINTER = "oklch(55% 0.02 270)"
const EDITORIAL_SURFACE = "oklch(98% 0.003 75)"
const EDITORIAL_BORDER = "oklch(93% 0.008 270)"
const EDITORIAL_BORDER_STRONG = "oklch(90% 0.01 270)"
const EDITORIAL_IMG_BG = "oklch(93% 0.02 75)"
const EDITORIAL_BEST_ID = "editorial_best"
const EDITORIAL_CATERING_ID = "editorial_catering"

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

// The catering landing content (trust photo grid + package tier cards) rendered
// in place of the regular product grid when the "كاترينج المناسبات" pill is
// active - shares the editorial home's header/search/category-bar chrome above
// it (see EditorialPreview), matching the same editorial ink/accent tokens.
function EditorialCateringLanding({
  onSelectTier,
  cardColors,
  photos,
}: {
  onSelectTier: (tierId: string) => void
  cardColors: CateringCardColors
  photos: (string | null)[]
}) {
  return (
    <div className="mt-2.5 px-5 pb-10">
      <h2 className="mb-3.5 text-right text-[13px] font-bold tracking-[0.4px]" style={{ color: EDITORIAL_MUTED }}>
        من مناسباتنا
      </h2>
      <div className="mb-8 grid grid-cols-2 gap-2.5">
        {[0, 1, 2, 3].map((i) =>
          photos[i] ? (
            <div key={i} className="relative aspect-square overflow-hidden rounded-2xl" style={{ background: EDITORIAL_IMG_BG }}>
              <Image src={photos[i] as string} alt="صورة حقيقية من إحدى مناسباتنا" fill sizes="240px" className="object-cover" />
            </div>
          ) : (
            <div
              key={i}
              className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed p-3 text-center"
              style={{ borderColor: EDITORIAL_BORDER_STRONG }}
            >
              <ImageIcon className="h-6 w-6" style={{ color: EDITORIAL_MUTED_FAINTER }} />
              <span className="text-[10.5px]" style={{ color: EDITORIAL_MUTED_FAINTER }}>
                صورة حقيقية من إحدى مناسباتنا
              </span>
            </div>
          )
        )}
      </div>

      <h2 className="mb-1 text-[17px] font-extrabold" style={{ color: EDITORIAL_INK }}>
        اختر باقتك
      </h2>
      <p className="mb-4 text-[12.5px]" style={{ color: EDITORIAL_MUTED_SOFT }}>
        باقات بأحجام مختلفة تناسب مناسبتك
      </p>
      <div className="flex flex-col gap-3.5">
        {CATERING_TIERS.map((tier) => {
          const popular = tier.highlighted
          return (
            <div
              key={tier.id}
              className="relative rounded-[20px] p-5"
              style={{
                background: popular ? cardColors.background_highlighted : cardColors.background,
                border: popular ? "none" : `1px solid ${cardColors.border}`,
                boxShadow: popular ? "0 16px 32px -20px rgba(20,15,10,0.35)" : "none",
              }}
            >
              {popular && (
                <span
                  className="absolute -top-2.5 right-5 rounded-full px-2.5 py-1 text-[10.5px] font-extrabold text-white"
                  style={{ background: cardColors.accent }}
                >
                  الأكثر طلبًا
                </span>
              )}
              <h3
                className="text-[16px] font-extrabold"
                style={{ color: popular ? cardColors.text_highlighted : cardColors.text }}
              >
                {tier.label}
              </h3>
              <p
                className="mt-0.5 text-[12px]"
                style={{ color: popular ? cardColors.muted_text_highlighted : cardColors.muted_text }}
              >
                تكفي {tier.guestLabel ?? `${tier.guestMin}–${tier.guestMax} ضيف`}
              </p>
              <div className="mt-2.5 flex items-baseline gap-1.5">
                <span
                  className="text-[24px] font-black"
                  style={{ color: popular ? cardColors.text_highlighted : cardColors.text }}
                >
                  <PriceWithRiyalLogo value={tier.price.toLocaleString("ar-SA")} />
                </span>
              </div>
              <div
                className="my-3.5 h-px"
                style={{ background: popular ? "rgba(255,255,255,.15)" : cardColors.border }}
              />
              <div className="flex flex-col gap-2">
                {tier.features.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-2 text-[12.5px]"
                    style={{ color: popular ? cardColors.muted_text_highlighted : cardColors.muted_text }}
                  >
                    <Check className="h-3.5 w-3.5 flex-shrink-0" style={{ color: cardColors.accent }} />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => onSelectTier(tier.id)}
                className="mt-4 block h-[46px] w-full rounded-full border-none text-center text-[13.5px] font-extrabold"
                style={{ background: popular ? cardColors.accent : cardColors.background_highlighted, color: "#fff" }}
              >
                اختر هذه الباقة
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// "2a" reference card: image with an overlaid quick-add circle, name and price below.
// No description - kept deliberately minimal, same layout for every grid on the home page
// (search results, category browsing, and the best-sellers landing view).
const EditorialProductCard = memo(function EditorialProductCard({
  item,
  isFlashed,
  onOpen,
  onQuickAdd,
}: {
  item: MenuItem
  isFlashed: boolean
  onOpen: (item: MenuItem) => void
  onQuickAdd: (item: MenuItem, e: MouseEvent) => void
}) {
  return (
    <div
      onClick={() => onOpen(item)}
      className="cursor-pointer transition-transform duration-200 hover:-translate-y-1 active:scale-[0.98]"
    >
      <div className="relative overflow-hidden rounded-[20px]" style={{ aspectRatio: "1" }}>
        <EditorialProductImage src={item.image} alt={item.name} className="absolute inset-0" />
        <button
          type="button"
          onClick={(e) => onQuickAdd(item, e)}
          aria-label={`إضافة ${item.name}`}
          className="absolute left-2.5 top-2.5 flex h-[30px] w-[30px] items-center justify-center rounded-full border-none text-[15px] font-semibold leading-none backdrop-blur-md transition-transform active:scale-90"
          style={{
            background: isFlashed ? EDITORIAL_INK : "rgba(255,255,255,0.85)",
            color: isFlashed ? "#fff" : EDITORIAL_INK,
            boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
          }}
        >
          {isFlashed ? "✓" : "+"}
        </button>
      </div>
      <div className="pt-4 text-right">
        <h3 className="m-0 text-[15px] font-semibold leading-[1.3]" style={{ color: EDITORIAL_INK }}>
          {item.name}
        </h3>
        <p className="mt-1.5 inline-flex items-center gap-1 text-[13px] font-medium tracking-[0.02em]" style={{ color: EDITORIAL_MUTED_FAINTER }}>
          <PriceWithRiyalLogo value={item.price} />
        </p>
      </div>
    </div>
  )
})

// "P1" reference card: full-width vertical layout with a translucent price badge, serif
// name, description, and a labeled add button - used only for the "الأكثر طلبًا" landing
// view, where the larger format and description give best-sellers more visual weight.
const EditorialBestSellerCardP1 = memo(function EditorialBestSellerCardP1({
  item,
  isFlashed,
  onOpen,
  onQuickAdd,
}: {
  item: MenuItem
  isFlashed: boolean
  onOpen: (item: MenuItem) => void
  onQuickAdd: (item: MenuItem, e: MouseEvent) => void
}) {
  return (
    <div onClick={() => onOpen(item)} className="flex w-full cursor-pointer flex-col gap-3.5">
      <div className="relative h-[280px] overflow-hidden rounded-[24px]" style={{ boxShadow: "0 16px 32px -20px rgba(20,15,10,0.32)" }}>
        <EditorialProductImage src={item.image} alt={item.name} className="absolute inset-0" />
        <div
          className="absolute left-3.5 top-3.5 flex h-8 items-center rounded-full px-3.5 text-[14px] font-extrabold backdrop-blur-md"
          style={{ background: "rgba(255,255,255,0.88)", color: EDITORIAL_INK, boxShadow: "0 1px 2px rgba(0,0,0,0.06)" }}
        >
          <PriceWithRiyalLogo value={item.price} />
        </div>
      </div>
      <div className="flex flex-col items-center gap-1.5 px-2 text-center">
        <h3 className="font-serif-text m-0 text-[19px] font-black leading-[1.3]" style={{ color: EDITORIAL_INK }}>
          {item.name}
        </h3>
        {item.description ? (
          <p className="m-0 text-[13.5px] leading-[1.7]" style={{ color: EDITORIAL_MUTED_SOFT }}>
            {item.description}
          </p>
        ) : null}
        <button
          type="button"
          onClick={(e) => onQuickAdd(item, e)}
          aria-label={`إضافة ${item.name}`}
          className="mt-1 flex h-[42px] w-auto shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-[22px] text-[13px] font-bold leading-none text-white transition-colors active:scale-[0.97]"
          style={{ background: isFlashed ? EDITORIAL_INK : EDITORIAL_ACCENT }}
        >
          {isFlashed ? "أُضيف ✓" : "أضف للطلب"}
        </button>
      </div>
    </div>
  )
})

function EditorialPreview() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isCateringMode = pathname === "/catering"
  const { menuItems, isLoading, error } = useMenu()
  const { categories } = useCategories()
  const { orderIds: bestSellerOrder } = useBestSellersConfig()
  const { config: cateringCardColors } = useCateringCardConfig()
  const { config: cateringPhotosConfig } = useCateringPhotosConfig()
  const { items: cartItems, addItem, updateQuantity, removeItem, totalItems, totalPrice } = useCart()

  const [selectedCategory, setSelectedCategory] = useState<string>(
    () => searchParams.get("category") || EDITORIAL_BEST_ID
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null)
  const [drawerQty, setDrawerQty] = useState(1)
  const [drawerIngredients, setDrawerIngredients] = useState<string[]>([])
  const [flashId, setFlashId] = useState<string | null>(null)
  const categoryPillRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  const uiCategories = useMemo<EditorialCategory[]>(
    () => [
      { id: EDITORIAL_BEST_ID, label: "الأكثر طلبًا" },
      { id: EDITORIAL_CATERING_ID, label: "كاترينج المناسبات" },
      ...categories.filter((c: Category) => c.isVisible).map((c) => ({ id: c.id, label: c.label, dbCategories: c.dbCategories })),
    ],
    [categories]
  )

  useEffect(() => {
    if (!uiCategories.some((c) => c.id === selectedCategory)) setSelectedCategory(EDITORIAL_BEST_ID)
  }, [uiCategories, selectedCategory])

  // "/" and "/catering" are separate routes (see selectCategory below), so switching
  // between them is a real navigation - without prefetching, every tap re-fetches that
  // route's RSC payload from scratch, which is what actually made the transition feel
  // laggy rather than smooth (the fade-in has nothing to animate until that arrives).
  // Prefetching the other side up front means it's already cached by the time it's tapped.
  useEffect(() => {
    router.prefetch(isCateringMode ? "/" : "/catering")
  }, [isCateringMode, router])

  // Category pills double as navigation once catering is involved: tapping the
  // catering pill leaves this page entirely (it's a real route so it can be
  // linked to directly), and tapping a normal pill while already on /catering
  // returns to the homepage with that category preselected via ?category=.
  const selectCategory = useCallback(
    (id: string) => {
      if (id === EDITORIAL_CATERING_ID) {
        router.push("/catering")
        return
      }
      if (isCateringMode) {
        router.push(`/?category=${id}`)
        return
      }
      setSelectedCategory(id)
      setSearchQuery("")
      setMenuOpen(false)
    },
    [isCateringMode, router]
  )

  // Keeps the active pill smoothly scrolled into view, both when tapping a pill
  // near the edge of the row and when a category is selected from elsewhere
  // (the side menu, or the ?category= link from /catering) where the bar itself
  // wasn't touched.
  useEffect(() => {
    const activeId = isCateringMode ? EDITORIAL_CATERING_ID : selectedCategory
    categoryPillRefs.current.get(activeId)?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    })
  }, [selectedCategory, isCateringMode])

  const isSearching = !isCateringMode && searchQuery.trim().length > 0
  const searchResults = useMemo(
    () => (isSearching ? smartFilterMenuItems(menuItems, searchQuery) : []),
    [isSearching, menuItems, searchQuery]
  )
  const isBestCategory = selectedCategory === EDITORIAL_BEST_ID
  const featuredItems = useMemo(
    () => getBestSellerCandidates(menuItems, bestSellerOrder),
    [menuItems, bestSellerOrder]
  )
  const activeCategory = uiCategories.find((c) => c.id === selectedCategory)
  const baseGrid = useMemo(
    () =>
      isBestCategory
        ? featuredItems
        : menuItems.filter((item) => (activeCategory?.dbCategories || []).includes(item.category)),
    [isBestCategory, featuredItems, menuItems, activeCategory]
  )
  const gridItems = isSearching ? searchResults : baseGrid
  const gridSectionLabel = isSearching
    ? `نتائج البحث (${gridItems.length})`
    : activeCategory?.label || ""

  // Some products require picking one priced option (e.g. tray sizes) before they can be
  // added correctly - ingredients formatted "label::price", exactly one selectable. Adding
  // without this always charged the base price and recorded no selection at all.
  const drawerVariantOptions = useMemo(
    () =>
      selectedProduct?.limit === 1 && (selectedProduct.ingredients?.length ?? 0) > 0
        ? (selectedProduct.ingredients ?? []).map((raw) => ({ raw, ...parseVariantOption(raw, selectedProduct.price) }))
        : [],
    [selectedProduct]
  )
  const drawerHasSingleVariant = drawerVariantOptions.length > 0
  const drawerMultiOptions =
    !drawerHasSingleVariant && selectedProduct?.ingredients?.length
      ? selectedProduct.ingredients.map((raw) => ({ raw, ...parseVariantOption(raw, selectedProduct.price) }))
      : []
  const drawerMaxMultiSelections = selectedProduct?.limit || 0
  const selectedVariant = drawerHasSingleVariant
    ? drawerVariantOptions.find((opt) => opt.raw === drawerIngredients[0])
    : undefined
  const drawerUnitPrice = selectedVariant?.price ?? selectedProduct?.price ?? 0
  const drawerDescription = selectedProduct?.description

  const openProduct = useCallback(
    (item: MenuItem) => {
      // Tray products sized via ingredients ("label::price" options, exactly one pick) get
      // their own full page (the TrayPicker layout with its 7-of-N item grid) instead of the
      // bottom-sheet drawer used for everything else.
      if (isTraySizeVariantItem(item)) {
        router.push(`/product/${item.id}`)
        return
      }
      setSelectedProduct(item)
      setDrawerQty(1)
      const hasSingleVariant =
        item.limit === 1 && (item.ingredients?.length ?? 0) > 0
      setDrawerIngredients(hasSingleVariant && item.ingredients ? [item.ingredients[0]] : [])
      setDrawerOpen(true)
    },
    [router]
  )

  const quickAdd = useCallback(
    (item: MenuItem, e: MouseEvent) => {
      e.stopPropagation()
      addItem(item, 1)
      setFlashId(item.id)
      window.setTimeout(() => setFlashId((cur) => (cur === item.id ? null : cur)), 900)
    },
    [addItem]
  )

  const toggleDrawerIngredient = (raw: string) => {
    if (drawerHasSingleVariant) {
      setDrawerIngredients([raw])
      return
    }
    setDrawerIngredients((prev) => {
      if (prev.includes(raw)) return prev.filter((v) => v !== raw)
      if (drawerMaxMultiSelections > 0 && prev.length >= drawerMaxMultiSelections) return prev
      return [...prev, raw]
    })
  }

  const addFromDrawer = () => {
    if (!selectedProduct) return
    const selectedLabels = drawerIngredients.map((raw) => parseVariantOption(raw, selectedProduct.price).label).filter(Boolean)
    addItem(
      { ...selectedProduct, price: drawerUnitPrice },
      drawerQty,
      selectedLabels.length > 0 ? selectedLabels : undefined
    )
    setDrawerOpen(false)
  }

  const drawerTotal = selectedProduct ? drawerUnitPrice * drawerQty : 0

  const drawerDialogRef = useDialogA11y(drawerOpen, setDrawerOpen)
  const cartDialogRef = useDialogA11y(cartOpen, setCartOpen)
  const menuDialogRef = useDialogA11y(menuOpen, setMenuOpen)

  return (
    // EditorialPreview backs both "/" and "/catering" (see app/catering/page.tsx) as
    // separate route segments, so switching between them fully unmounts/remounts this
    // component - animate-fade-in on the fresh mount smooths that swap (and the
    // skeleton -> content swap on first load) instead of the content popping in instantly.
    <div className="min-h-screen animate-fade-in" dir="rtl" style={{ background: EDITORIAL_SURFACE }}>
      <div className="mx-auto flex min-h-screen max-w-[430px] flex-col" style={{ background: EDITORIAL_SURFACE }}>
        <div
          className="fixed inset-x-0 top-0 z-40 mx-auto flex max-w-[430px] items-center justify-between px-5 pb-2.5 pt-[18px]"
          style={{ background: EDITORIAL_SURFACE }}
        >
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="فتح القائمة"
            className="-m-[5px] flex h-11 w-11 items-center justify-center border-none bg-transparent p-0"
          >
            <span className="flex h-[34px] w-[34px] flex-col items-start justify-center gap-[5px]">
              <span className="h-[1.5px] w-[18px]" style={{ background: EDITORIAL_INK }} />
              <span className="h-[1.5px] w-[11px]" style={{ background: EDITORIAL_INK }} />
            </span>
          </button>
          <span className="font-serif-text text-[17px] font-black tracking-[0.2px]" style={{ color: EDITORIAL_INK }}>
            أمل سناك
          </span>
          {totalItems > 0 ? (
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label="فتح السلة"
              className="-m-[5px] flex items-center gap-2 rounded-full border-none py-[7px] pl-3.5 pr-[9px] transition-transform active:scale-95"
              style={{ background: "oklch(94% 0.03 28)" }}
            >
              <span className="text-[12.5px] font-extrabold" style={{ color: EDITORIAL_ACCENT }}>
                <PriceWithRiyalLogo value={totalPrice} />
              </span>
              <span className="relative flex h-[26px] w-[26px] items-center justify-center">
                <EditorialBagIcon />
                <span
                  className="absolute -right-1.5 -top-1.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full px-[3px] text-[9px] font-extrabold text-white"
                  style={{ background: EDITORIAL_ACCENT, border: "1.5px solid oklch(94% 0.03 28)" }}
                >
                  {totalItems}
                </span>
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label="فتح السلة"
              className="-m-[5px] flex h-11 w-11 items-center justify-center border-none bg-transparent p-0"
            >
              <span className="relative flex h-[34px] w-[34px] items-center justify-center">
                <EditorialBagIcon />
              </span>
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ paddingTop: 76 }}>
          {error ? (
            <div className="mx-5 mt-5 rounded-xl p-3.5 text-[13px] font-semibold text-white" style={{ background: EDITORIAL_ACCENT }}>
              {error}
            </div>
          ) : null}
          <div className="px-5 pb-[22px] pt-5">
            {isCateringMode ? (
              <span
                className="mb-2.5 inline-block rounded-full px-3.5 py-1.5 text-[11px] font-extrabold text-white"
                style={{ background: EDITORIAL_ACCENT }}
              >
                كاترينج المناسبات
              </span>
            ) : (
              <span
                className="mb-2.5 block text-[11px] font-bold"
                style={{ color: EDITORIAL_ACCENT }}
              >
                مأكولات وضيافة
              </span>
            )}
            <h1 className="font-serif-text m-0 text-[40px] font-black leading-[1.05]" style={{ color: EDITORIAL_INK }}>
              تُحضّر بحب
              <br />
              لمناسباتك
            </h1>
            {isCateringMode && (
              <p className="mt-2.5 text-[13.5px] leading-[1.65]" style={{ color: EDITORIAL_MUTED_SOFT }}>
                باقات كاترينج جاهزة لأي مناسبة — اختر باقتك، خصص أطباقك، وسنتولى الباقي حتى تسليم الطلب.
              </p>
            )}
          </div>

          {!isCateringMode && (
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
          )}

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
                {gridItems.map((item) => (
                  <EditorialProductCard
                    key={item.id}
                    item={item}
                    isFlashed={flashId === item.id}
                    onOpen={openProduct}
                    onQuickAdd={quickAdd}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div
                className="sticky z-[6] mt-1.5 py-2.5 backdrop-blur-[8px]"
                style={{ top: 0, background: "oklch(98% 0.003 75 / 0.92)" }}
              >
                <div className="flex gap-2 overflow-x-auto scroll-smooth px-5 pb-0.5">
                  {uiCategories.map((cat) => {
                    const isCateringPill = cat.id === EDITORIAL_CATERING_ID
                    const isActive = isCateringMode ? isCateringPill : !isCateringPill && cat.id === selectedCategory
                    return (
                      <button
                        key={cat.id}
                        ref={(el) => {
                          if (el) categoryPillRefs.current.set(cat.id, el)
                          else categoryPillRefs.current.delete(cat.id)
                        }}
                        type="button"
                        onClick={() => selectCategory(cat.id)}
                        aria-pressed={isActive}
                        className="flex-shrink-0 whitespace-nowrap rounded-full px-4 py-2.5 text-[12.5px] font-bold transition-colors"
                        style={
                          isCateringPill
                            ? {
                                border: `1.5px solid ${EDITORIAL_ACCENT}`,
                                background: isActive ? EDITORIAL_ACCENT : "transparent",
                                color: isActive ? "#fff" : EDITORIAL_ACCENT,
                              }
                            : {
                                border: "1.5px solid transparent",
                                background: isActive ? EDITORIAL_INK : "transparent",
                                color: isActive ? "#fff" : EDITORIAL_MUTED,
                              }
                        }
                      >
                        {cat.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {isCateringMode ? (
                <div key={EDITORIAL_CATERING_ID} className="animate-fade-in">
                  <EditorialCateringLanding
                    onSelectTier={(tierId) => router.push(`/catering/build?tier=${tierId}`)}
                    cardColors={cateringCardColors}
                    photos={cateringPhotosConfig.photos}
                  />
                </div>
              ) : (
                <div key={selectedCategory} className="mt-2.5 px-5 pb-6 animate-fade-in">
                  <h2 className="mb-3.5 text-right text-[13px] font-bold tracking-[0.4px]" style={{ color: EDITORIAL_MUTED }}>
                    {gridSectionLabel}
                  </h2>

                  {isLoading ? (
                    <div className={isBestCategory ? "flex flex-col gap-8" : "grid grid-cols-2 gap-3.5"}>
                      {(isBestCategory ? [1, 2, 3] : [1, 2, 3, 4]).map((i) => (
                        <div
                          key={i}
                          className={cn("animate-pulse", isBestCategory ? "h-[280px] rounded-[24px]" : "aspect-square rounded-[14px]")}
                          style={{ background: EDITORIAL_IMG_BG }}
                        />
                      ))}
                    </div>
                  ) : gridItems.length === 0 ? (
                    <div className="px-6 py-10 text-center text-[13px]" style={{ color: EDITORIAL_MUTED_FAINTER }}>
                      لا توجد أصناف في هذا القسم حاليًا
                    </div>
                  ) : isBestCategory ? (
                    <div className="flex flex-col gap-8">
                      {gridItems.map((item) => (
                        <EditorialBestSellerCardP1
                          key={item.id}
                          item={item}
                          isFlashed={flashId === item.id}
                          onOpen={openProduct}
                          onQuickAdd={quickAdd}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-x-3.5 gap-y-5">
                      {gridItems.map((item) => (
                        <EditorialProductCard
                          key={item.id}
                          item={item}
                          isFlashed={flashId === item.id}
                          onOpen={openProduct}
                          onQuickAdd={quickAdd}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {drawerOpen && selectedProduct ? (
        <div className="fixed inset-0 z-50" dir="rtl">
          <div
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 animate-fade-in"
            style={{ background: "rgba(15,10,8,0.4)" }}
          />
          <div
            ref={drawerDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="editorial-drawer-title"
            tabIndex={-1}
            onKeyDown={(e) => trapFocusOnTab(e, drawerDialogRef.current)}
            className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[88%] max-w-[430px] flex-col overflow-hidden rounded-t-[24px] animate-slide-up outline-none"
            style={{ background: EDITORIAL_SURFACE }}
          >
            <div className="flex-1 overflow-y-auto">
              <div className="relative">
                <div
                  className="relative w-full"
                  style={{ aspectRatio: "1.3", background: EDITORIAL_IMG_BG }}
                >
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
                <h2 id="editorial-drawer-title" className="font-serif-text m-0 text-[22px] font-black" style={{ color: EDITORIAL_INK }}>
                  {selectedProduct.name}
                </h2>
                <p className="mt-2 text-[13px] leading-[1.6]" style={{ color: EDITORIAL_MUTED_SOFT }}>
                  {drawerDescription}
                </p>
                <p className="mt-3.5 text-[19px] font-extrabold" style={{ color: EDITORIAL_MUTED }}>
                  <PriceWithRiyalLogo value={drawerUnitPrice} />
                </p>
              </div>

              {drawerHasSingleVariant ? (
                <div className="px-5 pt-4">
                  <div className="flex flex-wrap justify-end gap-2">
                    {drawerVariantOptions.map((opt) => {
                      const isSelected = drawerIngredients[0] === opt.raw
                      return (
                        <button
                          key={opt.raw}
                          type="button"
                          onClick={() => toggleDrawerIngredient(opt.raw)}
                          className="rounded-full px-4 py-2 text-[13px] font-bold transition-colors"
                          style={{
                            border: `1.5px solid ${isSelected ? EDITORIAL_INK : EDITORIAL_BORDER_STRONG}`,
                            background: isSelected ? EDITORIAL_INK : "transparent",
                            color: isSelected ? "#fff" : EDITORIAL_INK,
                          }}
                        >
                          {opt.label} · <PriceWithRiyalLogo value={opt.price} />
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              {drawerMultiOptions.length > 0 ? (
                <div className="flex flex-wrap justify-end gap-2 px-5 pt-4">
                  {drawerMultiOptions.map((opt) => {
                    const isSelected = drawerIngredients.includes(opt.raw)
                    return (
                      <button
                        key={opt.raw}
                        type="button"
                        onClick={() => toggleDrawerIngredient(opt.raw)}
                        className="rounded-full px-4 py-2 text-[13px] font-bold transition-colors"
                        style={{
                          border: `1.5px solid ${isSelected ? EDITORIAL_INK : EDITORIAL_BORDER_STRONG}`,
                          background: isSelected ? EDITORIAL_INK : "transparent",
                          color: isSelected ? "#fff" : EDITORIAL_INK,
                        }}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              ) : null}
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
            ref={cartDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="editorial-cart-title"
            tabIndex={-1}
            onKeyDown={(e) => trapFocusOnTab(e, cartDialogRef.current)}
            className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[82%] max-w-[430px] flex-col rounded-t-[24px] animate-slide-up outline-none"
            style={{ background: EDITORIAL_SURFACE }}
          >
            <div className="flex flex-shrink-0 items-center justify-between px-5 pb-3 pt-5">
              <h2 id="editorial-cart-title" className="m-0 text-[16px] font-extrabold" style={{ color: EDITORIAL_INK }}>
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
                        {ci.selectedIngredients?.length ? (
                          <p className="mt-1 truncate text-[11.5px]" style={{ color: EDITORIAL_MUTED_FAINTER }}>
                            {ci.selectedIngredients.map((s) => (s.includes("||") ? s.split("||")[0] : s)).join("، ")}
                          </p>
                        ) : null}
                        <p className="mt-1 text-[12.5px] font-bold" style={{ color: EDITORIAL_MUTED }}>
                          <PriceWithRiyalLogo value={ci.price * ci.quantity} />
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(ci.cartKey, ci.quantity + 1)}
                          aria-label="زيادة الكمية"
                          className="flex h-[30px] w-[30px] items-center justify-center border-none bg-transparent text-[14px] font-black"
                          style={{ color: EDITORIAL_INK }}
                        >
                          +
                        </button>
                        <span className="min-w-[14px] text-center text-[13px] font-extrabold">{ci.quantity}</span>
                        <button
                          type="button"
                          onClick={() =>
                            ci.quantity === 1 ? removeItem(ci.cartKey) : updateQuantity(ci.cartKey, ci.quantity - 1)
                          }
                          aria-label={ci.quantity === 1 ? "حذف العنصر" : "تقليل الكمية"}
                          className="flex h-[30px] w-[30px] items-center justify-center border-none bg-transparent text-[14px] font-black"
                          style={{ color: ci.quantity === 1 ? "oklch(55% 0.18 25)" : EDITORIAL_INK }}
                        >
                          {ci.quantity === 1 ? "×" : "–"}
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
                  <span className="text-[17px] font-black" style={{ color: EDITORIAL_INK }}>
                    <PriceWithRiyalLogo value={totalPrice} />
                  </span>
                  <span className="text-[13px]" style={{ color: EDITORIAL_MUTED_SOFT }}>
                    المجموع
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/checkout")}
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
            ref={menuDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="editorial-menu-title"
            tabIndex={-1}
            onKeyDown={(e) => trapFocusOnTab(e, menuDialogRef.current)}
            className="absolute inset-y-0 right-0 flex w-[76%] max-w-[290px] flex-col outline-none"
            style={{ background: EDITORIAL_SURFACE }}
          >
            <div className="flex flex-shrink-0 items-center justify-between px-5 pb-4 pt-5">
              <span id="editorial-menu-title" className="font-serif-text text-[16px] font-black" style={{ color: EDITORIAL_INK }}>
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
                  onClick={() => selectCategory(cat.id)}
                  className="block w-full border-none bg-transparent py-3.5 text-right text-[15px] font-semibold"
                  style={{ color: "oklch(20% 0.01 280)", borderBottom: `1px solid ${EDITORIAL_BORDER}` }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            {cartItems.length > 0 ? (
              <div className="flex-shrink-0 px-5 pb-5 pt-3.5">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    router.push("/checkout")
                  }}
                  className="h-[50px] w-full rounded-full border-none text-[15px] font-extrabold text-white"
                  style={{ background: EDITORIAL_INK }}
                >
                  اتمام الطلب
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

// Opt-in design previews (?homeui=studio|soft|market) - not linked from anywhere in the
// live app, so they're code-split into their own chunk instead of shipping to every visitor.
const StudioPreview = dynamic(() => import("./home-preview-legacy").then((m) => m.StudioPreview))
const SoftPreview = dynamic(() => import("./home-preview-legacy").then((m) => m.SoftPreview))
const MarketPreview = dynamic(() => import("./home-preview-legacy").then((m) => m.MarketPreview))

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
