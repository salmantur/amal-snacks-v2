"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const ITEMS_TABS = [
  { href: "/admin/items", label: "الأصناف" },
  { href: "/admin/items/stock", label: "المخزون" },
  { href: "/admin/items/categories", label: "التصنيفات" },
]

export default function ItemsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div dir="rtl">
      <div className="border-b border-border bg-background px-4 pt-4 md:px-6">
        <h1 className="text-xl font-bold text-foreground">الأصناف</h1>
        <div className="mt-3 flex gap-2">
          {ITEMS_TABS.map((tab) => {
            const isActive = tab.href === "/admin/items" ? pathname === "/admin/items" : pathname === tab.href
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "rounded-t-lg px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "border-b-2 border-primary text-foreground"
                    : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>
      </div>
      {children}
    </div>
  )
}
