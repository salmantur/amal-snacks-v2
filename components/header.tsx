"use client"

import { ShoppingBag, Menu, X } from "lucide-react"
import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useCart } from "@/components/cart-provider"

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { items, totalItems, totalPrice, removeItem } = useCart()

  useEffect(() => { setMounted(true) }, [])

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur-sm border-b border-border/50">
        {/* Hamburger menu */}
        {mounted ? (
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-foreground">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <nav className="flex flex-col gap-4 mt-8">
                <Link href="/" className="text-lg font-medium py-2 px-4 rounded-lg hover:bg-amal-pink-light transition-colors" onClick={() => setMenuOpen(false)}>
                  الرئيسية
                </Link>
                <Link href="/checkout" className="text-lg font-medium py-2 px-4 rounded-lg hover:bg-amal-pink-light transition-colors" onClick={() => setMenuOpen(false)}>
                  سلة المشتريات
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        ) : (
          <Button variant="ghost" size="icon"><Menu className="h-6 w-6" /></Button>
        )}

        <h1 className="text-xl font-bold text-foreground">أمل سناك</h1>

        {/* Cart button */}
        <button
          onClick={() => setCartOpen(true)}
          className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-amal-grey transition-colors active:scale-95"
        >
          <ShoppingBag className="h-5 w-5 text-foreground" />
          {totalItems > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
              {totalItems > 9 ? "9+" : totalItems}
            </span>
          )}
        </button>
      </header>

      {/* Cart drawer — rendered outside header so z-index works properly */}
      {cartOpen && (
        <div className="fixed inset-0 z-[100]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setCartOpen(false)}
          />

          {/* Drawer */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl flex flex-col"
            style={{ maxHeight: "75vh", paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
              <button
                onClick={() => setCartOpen(false)}
                className="w-9 h-9 rounded-full bg-amal-grey flex items-center justify-center active:scale-95 transition-transform"
              >
                <X className="h-4 w-4" />
              </button>
              <h2 className="text-lg font-bold" dir="rtl">سلتك</h2>
              <span className="text-sm text-muted-foreground" dir="rtl">
                {totalItems > 0 ? `${totalItems} عنصر · ${totalPrice} ر.س` : "فارغة"}
              </span>
            </div>

            {/* Items */}
            <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2" dir="rtl">
              {items.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>سلتك فارغة</p>
                </div>
              ) : (
                items.map(item => (
                  <div key={item.cartKey} className="flex items-center gap-3 p-3 bg-amal-grey rounded-2xl">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{item.name}</p>
                      {item.selectedIngredients?.length ? (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {item.selectedIngredients.join("، ")}
                        </p>
                      ) : null}
                      <p className="text-sm font-bold text-primary mt-1">
                        {item.price * item.quantity} ر.س
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-medium bg-background px-2.5 py-1 rounded-full">
                        ×{item.quantity}
                      </span>
                      <button
                        onClick={() => removeItem(item.cartKey)}
                        className="w-9 h-9 rounded-full bg-red-100 text-red-500 flex items-center justify-center active:scale-95 transition-transform"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-4 py-3 border-t border-border/50">
                <button
                  onClick={() => setCartOpen(false)}
                  className="w-full py-3.5 rounded-2xl bg-foreground text-background font-bold active:scale-95 transition-transform"
                >
                  متابعة التسوق
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}