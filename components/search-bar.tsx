"use client"

import { Search, X } from "lucide-react"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="px-4 mt-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="ابحث عن وجبتك المفضلة..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full py-3 px-4 pr-4 pl-12 rounded-full text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          style={{ backgroundColor: "var(--bar-background, #f5f5f5)" }}
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center active:scale-95 transition-transform"
          >
            <X className="h-3.5 w-3.5 text-gray-600" />
          </button>
        )}
      </div>
    </div>
  )
}