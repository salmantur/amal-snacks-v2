"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Search } from "lucide-react"

interface MenuItemStock {
  id: string
  name: string
  category: string
  price: number
  in_stock: boolean
}

const CATEGORY_LABELS: Record<string, string> = {
  platters: "البلاترات",
  breakfast_heaters: "سخانات الفطور",
  heaters: "سخانات",
  trays: "صواني تقديمات",
  stuffed_dates: "تمر محشي",
  salads: "سلطات",
  appetizers: "مقبلات",
  sandwiches: "ساندوتشات",
  sweets: "حلا",
  bakery: "مخبوزات",
  frozen: "مفرزنات",
}

export function StockManager() {
  const [items, setItems] = useState<MenuItemStock[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("menu")
      .select("id, name, category, price, in_stock")
      .order("category")
      .then(({ data }) => {
        if (data) setItems(data)
        setLoading(false)
      })
  }, [])

  const toggleStock = async (id: string, current: boolean) => {
    setUpdating(id)
    const supabase = createClient()
    const { error } = await supabase
      .from("menu")
      .update({ in_stock: !current })
      .eq("id", id)

    if (!error) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, in_stock: !current } : item
        )
      )
    }
    setUpdating(null)
  }

  const filtered = items.filter((item) =>
    item.name.includes(search) || item.category.includes(search)
  )

  // Group by category
  const grouped = filtered.reduce<Record<string, MenuItemStock[]>>((acc, item) => {
    const cat = item.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  const outOfStockCount = items.filter((i) => !i.in_stock).length

  if (loading) {
    return <div className="h-40 bg-amal-grey rounded-2xl animate-pulse" />
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex gap-3">
        <div className="flex-1 bg-[#1e5631]/10 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-[#1e5631]">{items.length - outOfStockCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">متاح</p>
        </div>
        <div className="flex-1 bg-red-50 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-red-500">{outOfStockCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">نفد المخزون</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="ابحث عن منتج..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full py-3 pr-10 pl-4 rounded-xl bg-amal-grey text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-right"
        />
      </div>

      {/* Items by category */}
      <div className="space-y-5">
        {Object.entries(grouped).map(([category, catItems]) => (
          <div key={category}>
            <h3 className="text-sm font-bold text-muted-foreground mb-2 px-1">
              {CATEGORY_LABELS[category] ?? category}
            </h3>
            <div className="space-y-2">
              {catItems.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border-2 transition-all",
                    item.in_stock
                      ? "bg-white border-transparent"
                      : "bg-red-50/50 border-red-100"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* Toggle */}
                    <button
                      onClick={() => toggleStock(item.id, item.in_stock)}
                      disabled={updating === item.id}
                      className={cn(
                        "relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0",
                        item.in_stock ? "bg-[#1e5631]" : "bg-gray-300",
                        updating === item.id && "opacity-50"
                      )}
                      aria-label={item.in_stock ? "إيقاف" : "تفعيل"}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200",
                          item.in_stock ? "right-0.5" : "left-0.5"
                        )}
                      />
                    </button>

                    <div className="text-right">
                      <p className={cn(
                        "font-medium text-sm",
                        !item.in_stock && "line-through text-muted-foreground"
                      )}>
                        {item.name}
                      </p>
                      {!item.in_stock && (
                        <p className="text-xs text-red-400">نفد المخزون</p>
                      )}
                    </div>
                  </div>

                  <span className="text-sm text-muted-foreground font-medium flex-shrink-0">
                    {item.price} ريال
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
