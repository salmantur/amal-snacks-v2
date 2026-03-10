"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Bell, Volume2, VolumeX, RefreshCw, LogOut, ChefHat, Search, Menu, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { type Order } from "@/lib/data"
import { fetchRecentOrders, subscribeToOrders, updateOrderStatus } from "@/lib/orders"
import { KitchenTicket } from "@/components/kitchen-ticket"
import { HeroBannerEditor } from "@/components/hero-banner-editor"
import { StockManager } from "@/components/stock-manager"
import { CategoryManager } from "@/components/category-manager"
import { SalesDashboard } from "@/components/sales-dashboard"
import { ThemeEditor } from "@/components/theme-editor"
import { DeliveryAreasManager } from "@/components/delivery-areas-manager"
import { ClosedDatesManager } from "@/components/closed-dates-manager"
import { DiscountManager } from "@/components/discount-manager"
import { TelegramSettingsManager } from "@/components/telegram-settings-manager"
import { cn } from "@/lib/utils"

type AdminTab = "orders" | "banner" | "stock" | "categories" | "sales" | "colors" | "delivery" | "discounts" | "alerts"
type OrderFilter = Order["status"] | "all"
type TypeFilter = "all" | "delivery" | "pickup"
type SortBy = "newest" | "oldest" | "highest" | "status"
type LayoutMode = "kanban" | "minimal"
type AdminDesign = "design1" | "design2" | "design3" | "design4" | "design5"

const statusPriority: Record<Order["status"], number> = {
  pending: 0,
  preparing: 1,
  ready: 2,
  delivered: 3,
}

const ORDERS_POLL_INTERVAL_MS = 5000

function mergeOrders(existing: Order[], incoming: Order[]): Order[] {
  const merged = new Map<string, Order>()

  for (const order of existing) {
    merged.set(order.id, order)
  }

  for (const order of incoming) {
    merged.set(order.id, order)
  }

  return Array.from(merged.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export default function AdminPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)

  const [filter, setFilter] = useState<OrderFilter>("all")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [sortBy, setSortBy] = useState<SortBy>("newest")
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("kanban")
  const [adminDesign, setAdminDesign] = useState<AdminDesign>("design1")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<AdminTab>("orders")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [newOrderAlert, setNewOrderAlert] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled || !audioRef.current) return
    audioRef.current.currentTime = 0
    audioRef.current.play().catch(() => {})
  }, [soundEnabled])

  const refreshOrders = useCallback(async () => {
    const data = await fetchRecentOrders()
    setOrders((prev) => mergeOrders(prev, data))
    setLoading(false)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/admin/login")
  }

  useEffect(() => {
    void refreshOrders()
  }, [refreshOrders])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void refreshOrders()
    }, ORDERS_POLL_INTERVAL_MS)

    const handleWindowFocus = () => {
      void refreshOrders()
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void refreshOrders()
      }
    }

    window.addEventListener("focus", handleWindowFocus)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener("focus", handleWindowFocus)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [refreshOrders])

  useEffect(() => {
    const cleanup = subscribeToOrders(
      (newOrder) => {
        setOrders((prev) => mergeOrders(prev, [newOrder]))
        setNewOrderAlert(true)
        playNotificationSound()
        setTimeout(() => setNewOrderAlert(false), 2500)
      },
      (id, status) => {
        setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)))
      }
    )
    return () => cleanup?.()
  }, [playNotificationSound])

  const handleStatusChange = async (orderId: string, status: Order["status"]) => {
    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status } : order)))
    await updateOrderStatus(orderId, status)
  }

  const pendingCount = useMemo(() => orders.filter((o) => o.status === "pending").length, [orders])
  const preparingCount = useMemo(() => orders.filter((o) => o.status === "preparing").length, [orders])

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const byQuery = (order: Order) => {
      if (!q) return true
      const fields = [
        order.customerName,
        order.customerPhone,
        order.customerAddress,
        `#${order.orderNumber}`,
        ...order.items.map((i) => i.name),
      ]
      return fields.some((f) => f?.toLowerCase().includes(q))
    }

    const out = orders.filter((order) => {
      if (filter !== "all" && order.status !== filter) return false
      if (typeFilter !== "all" && order.orderType !== typeFilter) return false
      return byQuery(order)
    })

    out.sort((a, b) => {
      if (sortBy === "oldest") return a.createdAt.getTime() - b.createdAt.getTime()
      if (sortBy === "highest") return b.total - a.total
      if (sortBy === "status") {
        const diff = statusPriority[a.status] - statusPriority[b.status]
        if (diff !== 0) return diff
      }
      return b.createdAt.getTime() - a.createdAt.getTime()
    })

    return out
  }, [orders, filter, typeFilter, sortBy, searchQuery])

  const groupedOrders = useMemo(
    () => ({
      pending: filteredOrders.filter((o) => o.status === "pending"),
      preparing: filteredOrders.filter((o) => o.status === "preparing"),
      ready: filteredOrders.filter((o) => o.status === "ready"),
      delivered: filteredOrders.filter((o) => o.status === "delivered"),
    }),
    [filteredOrders]
  )

  const statusLabelMap: Record<Order["status"], string> = {
    pending: "جديد",
    preparing: "قيد التحضير",
    ready: "جاهز",
    delivered: "مكتمل",
  }

  const tabItems: { id: AdminTab; label: string }[] = [
    { id: "orders", label: "الطلبات" },
    { id: "banner", label: "البانر" },
    { id: "stock", label: "المخزون" },
    { id: "categories", label: "التصنيفات" },
    { id: "sales", label: "المبيعات" },
    { id: "colors", label: "المظهر" },
    { id: "delivery", label: "التوصيل" },
    { id: "discounts", label: "الخصومات" },
    { id: "alerts", label: "التنبيهات" },
  ]

  const tabEmojiMap: Record<AdminTab, string> = {
    orders: "🧾",
    banner: "🖼️",
    stock: "📦",
    categories: "🗂️",
    sales: "📈",
    colors: "🎨",
    delivery: "🚚",
    discounts: "🏷️",
    alerts: "🔔",
  }

  const designStyles = {
    design1: {
      main: "min-h-screen bg-[#f5f5f5]",
      header: "sticky top-0 z-50 bg-white border-b border-gray-100",
      tabsWrap: "flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide",
      tabActive: "bg-gray-900 text-white",
      tabIdle: "bg-[#f5f5f5] text-gray-600",
      content: "p-4",
    },
    design2: {
      main: "min-h-screen bg-[radial-gradient(circle_at_top,#ffffff,#eef2f7)]",
      header: "sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/70 shadow-sm",
      tabsWrap: "flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide",
      tabActive: "bg-[#1e5631] text-white",
      tabIdle: "bg-white text-gray-600 border border-gray-200",
      content: "p-4",
    },
    design3: {
      main: "min-h-screen bg-[#0f172a] text-white",
      header: "sticky top-0 z-50 bg-[#111827] border-b border-white/10",
      tabsWrap: "flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide",
      tabActive: "bg-white text-[#111827]",
      tabIdle: "bg-white/10 text-white",
      content: "p-4",
    },
    design4: {
      main: "min-h-screen bg-[#f8fafc] pb-20",
      header: "sticky top-0 z-50 bg-white border-b border-gray-100",
      tabsWrap: "hidden",
      tabActive: "bg-gray-900 text-white",
      tabIdle: "bg-white text-gray-600",
      content: "p-4",
    },
    design5: {
      main: "min-h-screen bg-[#f9fafb]",
      header: "sticky top-0 z-50 bg-white border-b border-gray-100",
      tabsWrap: "grid grid-cols-4 gap-2 px-4 pb-3",
      tabActive: "bg-primary text-primary-foreground",
      tabIdle: "bg-[#f3f4f6] text-gray-600",
      content: "p-4",
    },
  }[adminDesign]

  return (
    <main className={designStyles.main}>
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleGZwzOrl0LFwRD9iq+Xx8duSQAYvh9vw+/zhok4bG33Q6Pn/+eapV0M+cLzg8P/+9u64cTg5eMDg8f7+9O++fUMvZ7be9P/96fLMj0MjV6rc8v7+5u3SlGFDM2Cp4fH++OTt2aFzTSlbqNvx/vjh7d+rfFwyU57W7v/64+zisYRkNUSRzun//eDq5buPc0Y+hMPl/v3c5ufAmoJXOHi72/v92uLnyqKPZTtqr9P4/trg5tGtm3REXaLK8v7Z3eTYuKh/ST5rr9Ly/tjb4tzDtJNfPmau0PD+1tnf4M3AoHhEP2iv0PD91dbd5NXJq4JMPWWt0PD91NTb5trQtI1UPWSuzfD909Pa5+DXv5xiP2Ss0O/809HX5+Te0MJzQl2ny+/9z87U6Ojl2s2CRlihxu390c3S6Ovq4NiXTFCXvOz8z8vQ5+3v6eTglVdLkbbm+szIzePv8+7s6apkR4OqrOrIxcne8fb07u+7dUx3l6bjxcPF2fP6+PT11od0Wmahz8XBwdXy/v338N2dg29SYJLCwb+/0fP///nz5q+Wf2xXYo64v7+/y+/////579+7pI53ZmV3qLm9vsPQ7P7///zz6se4rJaEeHNxlam2ur7E0On6///68+nXyrq0ppqMg3t3fZamsbW6wMnX6vr//fXp3NPJwbuwpZuQh4F+gI6cpq+2vcTM1eLy/v3x5NvTzca/ubKroZiPiIWDhouXoqq0vMPKz9bh7vj89uvf19HOyMS+t7GsppyTi4eFhomSmqSvuMDIzdLZ4+v2+/Pn3dXPy8bBvLazrKiflo+KhoaIjZainrG7w8rQ1t3l7vf78ePZ0szIw7+6trKuqaOdlo+LiYmMkJmjrri/xs3T2eHo8Pn67+TZ0s7Jxb+7t7OvrqqmoJqUj4uKi42SnKewtb3EytHX3+bt9vnu49nSzMnFwLy4tK+sqKSfm5aPjYuLjZGYoKmyusDGzNLZ4Ofs9frw5dzVz8vGwr66trKuqqainJeRjo2MjpGXn6iwuL/Gys/W3eTo8Pf67OLa1M/Lxr+8uLSwr6ynop2YlJCOjY6RlZyjq7O6wcfN0djf5u3z+PHn39nTz8rFwLy4tLCsqaWgnZiUkI6Oj5KYn6ess7q/xs3P1dri5+3y9O7m4NjSzcnFv7u3sq6rp6OgnZmVkpCPkJOXnaOqsLe9xMrP1Nrf5u3y9O/n4dvVz8rFwLq3s6+rp6OgnJiVkpCQkZSZnqSqsLe+w8nO09je5Ors8/Tu5+Hb1c/KxL65tLCsqKSgnZmVko+QkZSYnqSqs7e+w8jO0tfe5Ors8vPu5+Hb1c/KxL65tLCsqKSgnZmVkpCQkZSYnqSqsLe9w8jO0tfe5Onr8vPu5+Dc1tDKxL65tLCsqKSgnJmVkpCQkZSYnqSqsLe9w8jN0tfe5Onr8fLu5+Dc1tDKxL65tLCsp6SgnJmVkpCQkZSYnqOqsLa9w8jN0tbd5Onr8fLu5uDc1tDKxL65tK+sp6SgnJmVkpCQkZSYnqOpsLa9wsjN0tXd5Onr8fHu5uDb1tDKxL64tK+sp6OgnJmVko+PkZSYnqOpsLa8wsjN0tXc5Ojr8fHu5uDb1c/JxL64s6+sp6OgnJiVko+PkZSYnaOpsLa8wsfM0dXc5Ojr8PHt5uDb1c/JxL64s6+rp6OgnJiVko+PkZOYnaOpsLW8wsfM0dXc4+jr8PHt5d/a1c/JxL64s6+rpqKfnJiVko+PkJOXnaOosbW8wsfM0dXc4+jr8PHt5d/a1c/Jw764s6+rpqKfnJiUkY+OkJOXnaOosLW7wsfL0NXc4+jr7/Ht5d/a1c/Jw724sq6rpqKenJiUkY+OkJOXnKOosLW7wsbL0NTc4ujq7/Ds5d/a1M/Jw724sq6rpqKenJiUkY6OkJOXnKKnsLW7wsbL0NTb4ujq7/Ds5N/Z1M7Iw724sq6qpqGenJeUkY6NkJOWnKKnr7W7wsbK0NTb4ujq7+/s5N/Z1M7Iwr24sq6qpqGenJeUkY6NkJOWnKKnr7S7wMbKz9Pb4efp7+/s5N7Z1M7Iwr24sa6qpaGenJeUkI6NkJOWm6Knr7S6wMbKz9Pa4efp7+/r5N7Y087Hwr24sa6qpaGenJeUkI6NkJOWm6GnrrS6wMXKz9Pa4Ofp7u7r5N7Y087Hwr24sa6qpaGenJeUkI6NkJOWm6GnrrS6wMXJztPa4Ofp7u7r49/YD87Hwr24sa6qpaGenJeUkI6NkJOWm6GnrrS5wMXJztLZ4Obp7u3r493Xz8zGwby3sa6ppaCdm5eUkI6NkJOWm6CmrrO5wMXJztLZ3+bo7e3r493Xz8zGwLy3sa6ppaCdm5eUkI2NkJKVm6CmrrO5v8XJzdLZ3+bo7e3q493X0MzGwLy3sa2ppaCdm5aUkI2Nj5KVm6CmrbO5v8TJzdLY3+bo7ezq493X0MvGwLy3sK2po5+dm5aUkI2Nj5KVmqClrbO4v8TIzNHY3uXn7ezq4t3X0MvFwLy2sK2po5+dmpaTkI2Nj5KVmqClrbK4v8TIzNHY3uXn7ezq4t3W0MvFv7u2sK2oo5+dmpaTkI2Mj5KVmqClrLK4vsPI" type="audio/wav" />
      </audio>

      <header className={cn(designStyles.header)} style={{ transform: "translateZ(0)" }}>
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 rounded-full bg-[#f5f5f5] flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-gray-700" />
          </button>

          <div className="text-center">
            <h1 className="text-base font-bold leading-tight">لوحة التحكم</h1>
            <div className="flex items-center justify-center gap-2 mt-0.5">
              {pendingCount > 0 ? <span className="text-xs font-medium text-primary">{pendingCount} جديد</span> : null}
              {preparingCount > 0 ? <span className="text-xs font-medium text-yellow-600">{preparingCount} قيد التحضير</span> : null}
            </div>
          </div>

          <div className="w-10 h-10" />
        </div>

        {activeTab === "orders" ? (
          <div className="px-4 pb-3 border-t border-gray-100 pt-2 space-y-2">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {([
                { value: "all", label: "الكل" },
                { value: "pending", label: "جديد" },
                { value: "preparing", label: "قيد التحضير" },
                { value: "ready", label: "جاهز" },
                { value: "delivered", label: "مكتمل" },
              ] as const).map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 active:scale-95",
                    filter === f.value ? "bg-gray-900 text-white" : "bg-[#f5f5f5] text-gray-600"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto scrollbar-hide pt-1">
              {([
                { id: "kanban", label: "Kanban" },
                { id: "minimal", label: "Minimal" },
              ] as const).map((layout) => (
                <button
                  key={layout.id}
                  onClick={() => setLayoutMode(layout.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex-shrink-0 border",
                    layoutMode === layout.id
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-600 border-gray-200"
                  )}
                >
                  {layout.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </header>

      {newOrderAlert ? (
        <div className="fixed top-4 left-4 right-4 z-50 p-4 bg-primary text-primary-foreground rounded-2xl shadow-xl">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 animate-bounce flex-shrink-0" />
            <div>
              <p className="font-bold">طلب جديد</p>
              <p className="text-sm opacity-90">تم استقبال طلب جديد في لوحة الطلبات</p>
            </div>
          </div>
        </div>
      ) : null}

      {sidebarOpen ? (
        <div className="fixed inset-0 z-[70]">
          <button
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar overlay"
          />
          <aside className="absolute right-0 top-0 h-full w-[85%] max-w-[360px] bg-white shadow-2xl border-l border-gray-200 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-gray-900">القائمة</p>
              <button
                onClick={() => setSidebarOpen(false)}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500">الأقسام</p>
              {tabItems.map((tab) => (
                <button
                  key={`drawer-tab-${tab.id}`}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setSidebarOpen(false)
                  }}
                  className={cn(
                    "w-full text-right px-3 py-2.5 rounded-xl text-sm font-medium",
                    activeTab === tab.id ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    <span>{tabEmojiMap[tab.id]}</span>
                    <span>{tab.label}</span>
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
              <p className="text-xs font-semibold text-gray-500">اختصارات</p>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/"
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-xl bg-gray-100 text-gray-700 px-3 py-2.5 text-sm font-medium inline-flex items-center justify-center gap-2"
                >
                  <ArrowRight className="h-4 w-4" />
                  الرئيسية
                </Link>
                <Link
                  href="/admin/items"
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-xl bg-gray-100 text-gray-700 px-3 py-2.5 text-sm font-medium inline-flex items-center justify-center gap-2"
                >
                  <ChefHat className="h-4 w-4" />
                  الأصناف
                </Link>
                <button
                  onClick={refreshOrders}
                  className="rounded-xl bg-gray-100 text-gray-700 px-3 py-2.5 text-sm font-medium inline-flex items-center justify-center gap-2"
                >
                  <Bell className={cn("h-4 w-4", newOrderAlert && "text-primary animate-bounce")} />
                  تحديث
                </button>
                <button
                  onClick={() => setSoundEnabled((v) => !v)}
                  className={cn(
                    "rounded-xl px-3 py-2.5 text-sm font-medium inline-flex items-center justify-center gap-2",
                    soundEnabled ? "bg-primary text-primary-foreground" : "bg-gray-100 text-gray-700"
                  )}
                >
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  الصوت
                </button>
              </div>
              <button
                onClick={handleLogout}
                className="w-full rounded-xl bg-red-50 text-red-600 px-3 py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                تسجيل الخروج
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      {activeTab === "banner" ? (
        <div className={cn(designStyles.content, "max-w-lg mx-auto", adminDesign === "design3" && "text-white")}>
          <h2 className="text-lg font-bold mb-4">تخصيص البانر الرئيسي</h2>
          <HeroBannerEditor />
        </div>
      ) : null}

      {activeTab === "stock" ? (
        <div className={cn(designStyles.content, "max-w-lg mx-auto", adminDesign === "design3" && "text-white")}>
          <h2 className="text-lg font-bold mb-4">إدارة المخزون</h2>
          <StockManager />
        </div>
      ) : null}

      {activeTab === "categories" ? (
        <div className={cn(designStyles.content, "max-w-lg mx-auto", adminDesign === "design3" && "text-white")}>
          <h2 className="text-lg font-bold mb-4">إدارة التصنيفات</h2>
          <CategoryManager />
        </div>
      ) : null}

      {activeTab === "delivery" ? (
        <div className={cn(designStyles.content, "max-w-lg mx-auto space-y-4", adminDesign === "design3" && "text-white")}>
          <DeliveryAreasManager />
          <ClosedDatesManager />
        </div>
      ) : null}

      {activeTab === "colors" ? (
        <div className={cn(designStyles.content, "max-w-lg mx-auto", adminDesign === "design3" && "text-white")}>
          <h2 className="text-lg font-bold mb-4">تخصيص المظهر</h2>
          <ThemeEditor />
        </div>
      ) : null}

      {activeTab === "discounts" ? (
        <div className={cn(designStyles.content, "max-w-lg mx-auto", adminDesign === "design3" && "text-white")}>
          <h2 className="text-lg font-bold mb-4">إدارة الخصومات</h2>
          <DiscountManager />
        </div>
      ) : null}

      {activeTab === "alerts" ? (
        <div className={cn(designStyles.content, "max-w-lg mx-auto", adminDesign === "design3" && "text-white")}>
          <h2 className="text-lg font-bold mb-4">تنبيهات تيليجرام</h2>
          <TelegramSettingsManager />
        </div>
      ) : null}

      {activeTab === "sales" ? (
        <div className={cn(designStyles.content, "max-w-lg mx-auto", adminDesign === "design3" && "text-white")}>
          <h2 className="text-lg font-bold mb-4">تقرير المبيعات</h2>
          <SalesDashboard />
        </div>
      ) : null}

      {activeTab === "orders" ? (
        <div className={cn(designStyles.content)}>
          {loading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center animate-pulse">
                <RefreshCw className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-400">جاري تحميل الطلبات...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
                <RefreshCw className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500">لا توجد نتائج مطابقة</p>
            </div>
          ) : (
            <>
              {layoutMode === "kanban" ? (
                <div className="grid gap-3 lg:grid-cols-4">
                  {([
                    { key: "pending", title: "جديد", items: groupedOrders.pending },
                    { key: "preparing", title: "قيد التحضير", items: groupedOrders.preparing },
                    { key: "ready", title: "جاهز", items: groupedOrders.ready },
                    { key: "delivered", title: "مكتمل", items: groupedOrders.delivered },
                  ] as const).map((col) => (
                    <div key={col.key} className="rounded-2xl border border-gray-200 bg-white p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold">{col.title}</p>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{col.items.length}</span>
                      </div>
                      <div className="space-y-2 max-h-[65vh] overflow-y-auto">
                        {col.items.map((order) => (
                          <button
                            key={order.id}
                            className="w-full text-right rounded-xl border border-gray-200 bg-gray-50 p-2.5 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-sm">#{order.orderNumber}</p>
                              <span className="text-[11px] text-gray-500">{new Date(order.createdAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}</span>
                            </div>
                            <p className="text-sm mt-1 truncate">{order.customerName}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{order.items.length} عناصر · {order.total} SAR</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {layoutMode === "minimal" ? (
                <div className="space-y-3">
                  <div className="flex gap-2 overflow-x-auto">
                    {(["pending", "preparing", "ready", "delivered"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={cn("px-4 py-2 rounded-full text-sm font-medium", filter === s ? "bg-gray-900 text-white" : "bg-white text-gray-600 border border-gray-200")}
                      >
                        {statusLabelMap[s]}
                      </button>
                    ))}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredOrders.map((order) => (
                      <KitchenTicket key={order.id} order={order} onStatusChange={handleStatusChange} />
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}


      {adminDesign === "design4" ? (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-2 py-2 grid grid-cols-4 gap-1">
          {tabItems.map((tab) => (
            <button
              key={`bottom-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "rounded-xl px-2 py-2 text-[11px] font-semibold",
                activeTab === tab.id ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      ) : null}
    </main>
  )
}
