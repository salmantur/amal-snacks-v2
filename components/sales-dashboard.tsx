"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { TrendingUp, ShoppingBag, Truck, Package } from "lucide-react"

interface SalesData {
  totalRevenue: number
  totalOrders: number
  deliveryOrders: number
  pickupOrders: number
  avgOrderValue: number
  topItems: { name: string; quantity: number; revenue: number }[]
  dailyTotals: { date: string; revenue: number; orders: number }[]
}

type Range = "today" | "week" | "month"

const RANGE_LABELS: Record<Range, string> = {
  today: "اليوم",
  week: "هذا الأسبوع",
  month: "هذا الشهر",
}

function getStartDate(range: Range): string {
  const now = new Date()
  if (range === "today") {
    now.setHours(0, 0, 0, 0)
  } else if (range === "week") {
    now.setDate(now.getDate() - 6)
    now.setHours(0, 0, 0, 0)
  } else {
    now.setDate(1)
    now.setHours(0, 0, 0, 0)
  }
  return now.toISOString()
}

export function SalesDashboard() {
  const [range, setRange] = useState<Range>("today")
  const [data, setData] = useState<SalesData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const supabase = createClient()
    const since = getStartDate(range)

    supabase
      .from("orders")
      .select("*")
      .gte("created_at", since)
      .neq("status", "cancelled")
      .order("created_at", { ascending: true })
      .then(({ data: orders }) => {
        if (!orders || orders.length === 0) {
          setData({
            totalRevenue: 0, totalOrders: 0,
            deliveryOrders: 0, pickupOrders: 0,
            avgOrderValue: 0, topItems: [], dailyTotals: [],
          })
          setLoading(false)
          return
        }

        const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0)
        const totalOrders = orders.length
        const deliveryOrders = orders.filter((o) => o.order_type === "delivery").length
        const pickupOrders = orders.filter((o) => o.order_type === "pickup").length
        const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0

        // Top items
        const itemMap: Record<string, { quantity: number; revenue: number }> = {}
        orders.forEach((order) => {
          const items = order.items as { name: string; quantity: number; price: number }[]
          if (!Array.isArray(items)) return
          items.forEach((item) => {
            if (!itemMap[item.name]) itemMap[item.name] = { quantity: 0, revenue: 0 }
            itemMap[item.name].quantity += item.quantity
            itemMap[item.name].revenue += item.quantity * item.price
          })
        })
        const topItems = Object.entries(itemMap)
          .map(([name, v]) => ({ name, ...v }))
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5)

        // Daily totals
        const dayMap: Record<string, { revenue: number; orders: number }> = {}
        orders.forEach((order) => {
          const day = new Date(order.created_at).toLocaleDateString("ar-SA", {
            month: "short", day: "numeric"
          })
          if (!dayMap[day]) dayMap[day] = { revenue: 0, orders: 0 }
          dayMap[day].revenue += order.total || 0
          dayMap[day].orders += 1
        })
        const dailyTotals = Object.entries(dayMap).map(([date, v]) => ({ date, ...v }))

        setData({ totalRevenue, totalOrders, deliveryOrders, pickupOrders, avgOrderValue, topItems, dailyTotals })
        setLoading(false)
      })
  }, [range])

  return (
    <div className="space-y-5">
      {/* Range selector */}
      <div className="flex gap-2 bg-amal-grey rounded-2xl p-1">
        {(["today", "week", "month"] as Range[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              range === r ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"
            }`}
          >
            {RANGE_LABELS[r]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-amal-grey rounded-2xl animate-pulse" />)}
        </div>
      ) : !data || data.totalOrders === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>لا توجد طلبات في هذه الفترة</p>
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1e5631]/10 rounded-2xl p-4">
              <TrendingUp className="h-5 w-5 text-[#1e5631] mb-2" />
              <p className="text-2xl font-bold text-[#1e5631]">{data.totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-0.5">إجمالي المبيعات (ريال)</p>
            </div>
            <div className="bg-amal-yellow/20 rounded-2xl p-4">
              <ShoppingBag className="h-5 w-5 text-foreground mb-2" />
              <p className="text-2xl font-bold text-foreground">{data.totalOrders}</p>
              <p className="text-xs text-muted-foreground mt-0.5">عدد الطلبات</p>
            </div>
            <div className="bg-amal-pink-light rounded-2xl p-4">
              <Truck className="h-5 w-5 text-primary mb-2" />
              <p className="text-2xl font-bold text-foreground">{data.deliveryOrders}</p>
              <p className="text-xs text-muted-foreground mt-0.5">توصيل</p>
            </div>
            <div className="bg-amal-grey rounded-2xl p-4">
              <Package className="h-5 w-5 text-foreground mb-2" />
              <p className="text-2xl font-bold text-foreground">{data.pickupOrders}</p>
              <p className="text-xs text-muted-foreground mt-0.5">استلام من المحل</p>
            </div>
          </div>

          {/* Avg order */}
          <div className="bg-white rounded-2xl p-4 flex items-center justify-between border border-border/50">
            <span className="text-2xl font-bold">{data.avgOrderValue} ريال</span>
            <span className="text-sm text-muted-foreground">متوسط قيمة الطلب</span>
          </div>

          {/* Daily breakdown — only show for week/month */}
          {range !== "today" && data.dailyTotals.length > 1 && (
            <div className="bg-white rounded-2xl p-4 border border-border/50">
              <h3 className="font-bold text-right mb-3">المبيعات اليومية</h3>
              <div className="space-y-2">
                {data.dailyTotals.map((day) => {
                  const maxRevenue = Math.max(...data.dailyTotals.map(d => d.revenue))
                  const pct = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0
                  return (
                    <div key={day.date} className="flex items-center gap-3">
                      <div className="flex-1 bg-amal-grey rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 bg-[#1e5631] rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium w-16 text-left">{day.revenue} ر</span>
                      <span className="text-xs text-muted-foreground w-16 text-right">{day.date}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Top items */}
          {data.topItems.length > 0 && (
            <div className="bg-white rounded-2xl p-4 border border-border/50">
              <h3 className="font-bold text-right mb-3">الأكثر طلباً</h3>
              <div className="space-y-3">
                {data.topItems.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      i === 0 ? "bg-[#1e5631] text-white" :
                      i === 1 ? "bg-amal-yellow text-foreground" :
                      "bg-amal-grey text-muted-foreground"
                    }`}>
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium text-right truncate">{item.name}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{item.quantity} قطعة</span>
                    <span className="text-xs font-bold text-[#1e5631] flex-shrink-0 w-16 text-left">{item.revenue} ر</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
