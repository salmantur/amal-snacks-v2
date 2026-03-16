"use client"

import type { LucideIcon } from "lucide-react"
import {
  Cookie,
  Croissant,
  Flame,
  Gift,
  IceCreamCone,
  Leaf,
  Martini,
  Package2,
  Sandwich,
  Snowflake,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react"
import { cn } from "@/lib/utils"

type CategoryBarVariant = "default" | "modern"

interface CategoryFilterProps {
  selectedCategory: string
  onSelectCategory: (category: string) => void
  categories: { id: string; label: string }[]
  variant?: CategoryBarVariant
}

function getCategoryIcon(category: { id: string; label: string }): LucideIcon {
  const key = `${category.id} ${category.label}`.toLowerCase()
  const id = category.id.toLowerCase()

  if (id === "best_sellers") return Sparkles
  if (id.includes("eid")) return Gift
  if (id.includes("drink")) return Martini
  if (id.includes("sweet")) return IceCreamCone
  if (id.includes("cookie")) return Cookie
  if (id.includes("sandwich")) return Sandwich
  if (id.includes("salad")) return Leaf
  if (id.includes("frozen")) return Snowflake
  if (id.includes("bakery")) return Croissant
  if (id.includes("heater")) return Flame
  if (id.includes("appetizer")) return UtensilsCrossed
  if (id.includes("stuffed_dates")) return Gift
  if (id.includes("tray") || id.includes("platter")) return Package2

  if (key.includes("best") || key.includes("كثر") || key.includes("طلب")) return Sparkles
  if (key.includes("drink") || key.includes("مشروب") || key.includes("عصير") || key.includes("كوكتيل")) return Martini
  if (key.includes("sweet") || key.includes("dessert") || key.includes("حلو") || key.includes("حلويات")) return IceCreamCone
  if (key.includes("cookie") || key.includes("كوكي") || key.includes("بسكويت")) return Cookie
  if (key.includes("chip") || key.includes("crisp") || key.includes("شيبس") || key.includes("snack")) return Croissant
  if (key.includes("meal") || key.includes("وجبة") || key.includes("food") || key.includes("dish")) return UtensilsCrossed

  return Package2
}

export function CategoryFilter({
  selectedCategory,
  onSelectCategory,
  categories,
  variant = "default",
}: CategoryFilterProps) {
  if (variant === "modern") {
    return (
      <div className="px-4 pt-3 md:px-6 md:pt-5">
        <div className="mx-auto flex w-max min-w-full snap-x snap-mandatory gap-2.5 overflow-x-auto pb-1 touch-pan-x [scrollbar-width:none] [-ms-overflow-style:none] [scroll-padding-inline:1rem] [&::-webkit-scrollbar]:hidden md:min-w-0 md:justify-center">
          {categories.map((category) => {
            const isActive = selectedCategory === category.id
            const Icon = getCategoryIcon(category)

            return (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                aria-pressed={isActive}
                className={cn(
                  "flex w-[82px] shrink-0 snap-start flex-col items-center gap-2 rounded-[1.1rem] px-1 py-1.5 text-center text-sm font-medium whitespace-normal transition-all duration-200 md:w-[90px] md:text-[15px]",
                  isActive ? "text-[#0f172a]" : "text-[#64748b] hover:text-[#334155]"
                )}
              >
                <span
                  className={cn(
                    "flex h-[56px] w-[56px] items-center justify-center rounded-[1rem] border transition-all duration-200 md:h-[60px] md:w-[60px]",
                    isActive
                      ? "border-[#dbe4ee] bg-white text-[#0f172a] shadow-[0_10px_24px_-20px_rgba(15,23,42,0.22)]"
                      : "border-transparent bg-[#f8fafc] text-[#94a3b8]"
                  )}
                >
                  <Icon className="h-5 w-5 md:h-5.5 md:w-5.5" strokeWidth={2} />
                </span>
                <span className="line-clamp-2 min-h-[2.25rem] text-[0.85rem] font-semibold leading-4.5 md:min-h-[2.4rem] md:text-[0.92rem]">
                  {category.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-3 md:px-6 md:pt-5">
      <div className="mx-auto flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 touch-pan-x [scrollbar-width:none] [-ms-overflow-style:none] [scroll-padding-inline:1rem] [&::-webkit-scrollbar]:hidden md:flex-wrap md:justify-center">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelectCategory(category.id)}
          aria-pressed={selectedCategory === category.id}
          className={cn(
              "relative min-h-11 snap-start shrink-0 rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 active:scale-[0.98] md:px-4.5 md:text-[15px]",
            selectedCategory === category.id
                ? "border-[#dbe4ee] bg-white text-[#0f172a] shadow-[0_10px_24px_-20px_rgba(15,23,42,0.22)]"
                : "border-transparent bg-transparent text-[#64748b] hover:bg-white/80 hover:text-[#334155]"
          )}
        >
            <span>{category.label}</span>
        </button>
      ))}
      </div>
    </div>
  )
}
