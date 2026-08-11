"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { AdminMenuButton } from "../admin-shell"

const ITEMS_TABS = [
  { href: "/admin/items", label: "الأصناف" },
  { href: "/admin/items/stock", label: "المخزون" },
  { href: "/admin/items/categories", label: "التصنيفات" },
]

export default function ItemsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div dir="rtl">
      <div className="sticky top-0 z-20 border-b border-admin-border-soft bg-admin-header px-4 pt-3.5 sm:px-8">
        <div className="flex items-center justify-between gap-6">
          <h1 className="text-[15px] font-bold text-admin-ink">الأصناف</h1>
          <AdminMenuButton />
        </div>
        <div className="mt-3 flex gap-1">
          {ITEMS_TABS.map((tab) => {
            const isActive = tab.href === "/admin/items" ? pathname === "/admin/items" : pathname === tab.href
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "rounded-t-lg px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "border-b-2 border-admin-ink text-admin-ink"
                    : "border-b-2 border-transparent text-admin-muted hover:text-admin-ink"
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
