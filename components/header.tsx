"use client"

import { Bell, Menu } from "lucide-react"
import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function Header() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur-sm border-b border-border/50">
      {mounted ? (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-foreground">
              <Menu className="h-6 w-6" />
              <span className="sr-only">القائمة</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <nav className="flex flex-col gap-4 mt-8">
              <Link
                href="/"
                className="text-lg font-medium py-2 px-4 rounded-lg hover:bg-amal-pink-light transition-colors"
                onClick={() => setOpen(false)}
              >
                الرئيسية
              </Link>
              <Link
                href="/checkout"
                className="text-lg font-medium py-2 px-4 rounded-lg hover:bg-amal-pink-light transition-colors"
                onClick={() => setOpen(false)}
              >
                سلة المشتريات
              </Link>
              {/* Admin link removed — access /admin/login directly */}
            </nav>
          </SheetContent>
        </Sheet>
      ) : (
        <Button variant="ghost" size="icon" className="text-foreground">
          <Menu className="h-6 w-6" />
          <span className="sr-only">القائمة</span>
        </Button>
      )}

      <h1 className="text-xl font-bold text-foreground">أمل سناك</h1>

      <Button variant="ghost" size="icon" className="text-foreground relative">
        <Bell className="h-5 w-5" />
        <span className="sr-only">الإشعارات</span>
      </Button>
    </header>
  )
}
