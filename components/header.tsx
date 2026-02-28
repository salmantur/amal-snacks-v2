"use client"

import { ShoppingBag, Menu } from "lucide-react"
import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useCart } from "@/components/cart-provider"

export function Header() {
  const [open, setOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { items, totalItems, totalPrice, removeItem } = useCart()

  useEffect(() => { setMounted(true) }, [])

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
              <Link href="/" className="text-lg font-medium py-2 px-4 rounded-lg hover:bg-amal-pink-light transition-colors" onClick={() => setOpen(false)}>
                الرئيسية
              </Link>
              <Link href="/checkout" className="text-lg font-medium py-2 px-4 rounded-lg hover:bg-amal-pink-light transition-colors" onClick={() => setOpen(false)}>
                سلة المشتريات
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
      ) : (
        <Button variant="ghost" size="icon" className="text-foreground">
          <Menu className="h-6 w-6" />
        </Button>
      )}

      <h1 className="text-xl font-bold text-foreground">أمل سناك</h1>

      {/* Cart icon with badge */}
      <button
        onClick={() => totalItems > 0 && setCartOpen(true)}
        className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-amal-grey transition-colors"
      >
        <ShoppingBag className="h-5 w-5 text-foreground" />
        {totalItems > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
            {totalItems}
          </span>
        )}
      </button>

      {/* Cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50" onClick={() => setCartOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl p-5 max-h-[70vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-4" />

            <div className="flex items-center justify-between mb-4" dir="rtl">
              <h2 className="text-lg font-bold">سلتك</h2>
              <span className="text-sm text-muted-foreground">{totalItems} عنصر · {totalPrice} ر.س</span>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2" dir="rtl">
              {items.map(item => (
                <div key={item.cartKey} className="flex items-center gap-3 p-3 bg-amal-grey rounded-2xl">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    {item.selectedIngredients?.length ? (
                      <p className="text-xs text-muted-foreground truncate">{item.selectedIngredients.join("، ")}</p>
                    ) : null}
                    <p className="text-sm font-bold text-primary mt-0.5">{item.price * item.quantity} ر.س</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-medium text-muted-foreground">×{item.quantity}</span>
                    <button
                      onClick={() => removeItem(item.cartKey)}
                      className="w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center active:scale-95 transition-transform text-lg font-bold"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setCartOpen(false)}
              className="mt-4 w-full py-3 rounded-2xl bg-amal-grey text-foreground font-medium active:scale-95 transition-transform"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </header>
  )
}