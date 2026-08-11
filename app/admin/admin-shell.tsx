"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, ArrowRight, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ADMIN_NAV_ITEMS } from "./nav-items"

interface AdminDrawerContextValue {
  openDrawer: () => void
}

const AdminDrawerContext = createContext<AdminDrawerContextValue | null>(null)

function useAdminDrawer() {
  const ctx = useContext(AdminDrawerContext)
  if (!ctx) throw new Error("useAdminDrawer must be used within AdminShell")
  return ctx
}

export function AdminMenuButton() {
  const { openDrawer } = useAdminDrawer()
  return (
    <button
      type="button"
      onClick={openDrawer}
      aria-label="القائمة"
      className="flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-admin-border bg-white text-admin-ink transition-colors hover:bg-admin-bg"
    >
      <Menu className="h-4 w-4" />
    </button>
  )
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  if (pathname === "/admin/login") {
    return <>{children}</>
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/admin/login")
  }

  return (
    <AdminDrawerContext.Provider value={{ openDrawer: () => setOpen(true) }}>
      <div dir="rtl" className="min-h-screen bg-admin-bg font-sans text-admin-ink">
        {children}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-72 flex-col gap-0 border-admin-border bg-white p-0 sm:max-w-xs" dir="rtl">
          <SheetHeader className="border-b border-admin-border-soft px-5 py-4 text-right">
            <SheetTitle className="text-base font-bold text-admin-ink">القائمة</SheetTitle>
          </SheetHeader>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
            {ADMIN_NAV_ITEMS.map((item) => {
              const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive ? "bg-admin-ink text-white" : "text-admin-ink hover:bg-admin-bg"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="flex flex-col gap-1 border-t border-admin-border-soft p-3">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-admin-ink hover:bg-admin-bg"
            >
              <ArrowRight className="h-4 w-4" />
              <span>عرض المتجر</span>
            </Link>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-admin-urgent hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </AdminDrawerContext.Provider>
  )
}
