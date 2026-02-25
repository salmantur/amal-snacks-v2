"use client"

import { cn } from "@/lib/utils"

interface CategoryFilterProps {
  selectedCategory: string
  onSelectCategory: (category: string) => void
  categories: { id: string; label: string }[]
}

export function CategoryFilter({ selectedCategory, onSelectCategory, categories }: CategoryFilterProps) {
  return (
    <div className="flex gap-4 md:gap-8 px-4 py-4 md:py-6 overflow-x-auto scrollbar-hide bg-[#f5f5f5] md:justify-center">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelectCategory(category.id)}
          className={cn(
            "relative px-1 md:px-2 py-2 text-sm md:text-lg font-medium whitespace-nowrap transition-all flex-shrink-0",
            selectedCategory === category.id
              ? "text-[#1e293b]"
              : "text-gray-400 hover:text-gray-600"
          )}
        >
          <span className={cn(
            selectedCategory === category.id && "border border-[#1e293b] px-2 md:px-3 py-1"
          )}>
            {category.label}
          </span>
          {selectedCategory === category.id && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#1e293b] rounded-full" />
          )}
        </button>
      ))}
    </div>
  )
}