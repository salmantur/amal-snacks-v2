"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Bell, Volume2, VolumeX, RefreshCw, LogOut, ChefHat } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { type Order } from "@/lib/data"
import { fetchRecentOrders, subscribeToOrders, updateOrderStatus } from "@/lib/orders"
import { KitchenTicket } from "@/components/kitchen-ticket"
import { HeroBannerEditor } from "@/components/hero-banner-editor"
import { StockManager } from "@/components/stock-manager"
import { CategoryManager } from "@/components/category-manager"
import { SalesDashboard } from "@/components/sales-dashboard"
import { cn } from "@/lib/utils"

export default function AdminPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [filter, setFilter] = useState<Order["status"] | "all">("all")
  const [activeTab, setActiveTab] = useState<"orders" | "banner" | "stock" | "categories" | "sales">("orders")
  const [newOrderAlert, setNewOrderAlert] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const orderCountRef = useRef(orders.length)

  const playNotificationSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    }
  }, [soundEnabled])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/admin/login")
  }

  useEffect(() => {
    fetchRecentOrders().then((data) => {
      setOrders(data)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    let cleanup: (() => void) | null = null
    const setup = () => {
      cleanup = subscribeToOrders(
        (newOrder) => {
          setOrders((prev) => [newOrder, ...prev])
          setNewOrderAlert(true)
          playNotificationSound()
          setTimeout(() => setNewOrderAlert(false), 3000)
        },
        (id, status) => {
          setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)))
        }
      )
    }
    setup()
    return () => { cleanup?.() }
  }, [playNotificationSound])

  useEffect(() => {
    orderCountRef.current = orders.length
  }, [orders.length])

  const handleStatusChange = async (orderId: string, status: Order["status"]) => {
    setOrders((prev) => prev.map((order) => order.id === orderId ? { ...order, status } : order))
    await updateOrderStatus(orderId, status)
  }

  const filteredOrders = orders.filter((order) => filter === "all" || order.status === filter)
  const pendingCount = orders.filter((o) => o.status === "pending").length
  const preparingCount = orders.filter((o) => o.status === "preparing").length

  return (
    <main className="min-h-screen bg-amal-grey">
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleGZwzOrl0LFwRD9iq+Xx8duSQAYvh9vw+/zhok4bG33Q6Pn/+eapV0M+cLzg8P/+9u64cTg5eMDg8f7+9O++fUMvZ7be9P/96fLMj0MjV6rc8v7+5u3SlGFDM2Cp4fH++OTt2aFzTSlbqNvx/vjh7d+rfFwyU57W7v/64+zisYRkNUSRzun//eDq5buPc0Y+hMPl/v3c5ufAmoJXOHi72/v92uLnyqKPZTtqr9P4/trg5tGtm3REXaLK8v7Z3eTYuKh/ST5rr9Ly/tjb4tzDtJNfPmau0PD+1tnf4M3AoHhEP2iv0PD91dbd5NXJq4JMPWWt0PD91NTb5trQtI1UPWSuzfD909Pa5+DXv5xiP2Ss0O/809HX5+Te0MJzQl2ny+/9z87U6Ojl2s2CRg==" type="audio/wav" />
      </audio>

      {/* Sticky header — translateZ(0) creates own GPU layer on iOS, prevents jank */}
      <header
        className="sticky top-0 z-50 bg-background border-b border-border"
        style={{ transform: "translateZ(0)", WebkitTransform: "translateZ(0)" }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="w-10 h-10 rounded-full bg-amal-grey flex items-center justify-center">
              <ArrowRight className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">لوحة التحكم</h1>
              <p className="text-sm text-muted-foreground">المطبخ</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/items"
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-amal-grey text-sm font-medium"
            >
              <ChefHat className="h-4 w-4" />
              الأصناف
            </Link>
            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-full bg-amal-grey flex items-center justify-center"
            >
              <LogOut className="h-5 w-5 text-muted-foreground" />
            </button>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                soundEnabled ? "bg-primary text-primary-foreground" : "bg-amal-grey"
              )}
            >
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>
            <div className="relative">
              <Bell className={cn("h-6 w-6", newOrderAlert && "text-primary animate-bounce")} />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                  {pendingCount}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-2 px-4 py-2 overflow-x-auto overscroll-x-contain" style={{ WebkitOverflowScrolling: "touch" }}>
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium whitespace-nowrap">{pendingCount} طلب جديد</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-amal-yellow/20 rounded-full flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-amal-yellow" />
            <span className="text-sm font-medium whitespace-nowrap">{preparingCount} قيد التحضير</span>
          </div>
          <button
            onClick={() => fetchRecentOrders().then(setOrders)}
            className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-sm font-medium flex-shrink-0"
          >
            <RefreshCw className="h-4 w-4" />
            تحديث
          </button>
        </div>

        {/* Main tabs */}
        <div className="flex gap-2 px-4 py-3 border-t border-border/50 overflow-x-auto overscroll-x-contain" style={{ WebkitOverflowScrolling: "touch" }}>
          {[
            { id: "orders", label: "الطلبات" },
            { id: "banner", label: "🖼 البانر" },
            { id: "stock", label: "📦 المخزون" },
            { id: "categories", label: "🗂 التصنيفات" },
            { id: "sales", label: "📊 المبيعات" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                "px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors",
                activeTab === tab.id ? "bg-foreground text-background" : "bg-card hover:bg-card/80"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter tabs — orders only */}
        {activeTab === "orders" && (
          <div className="flex gap-2 px-4 py-3 border-t border-border/50 overflow-x-auto overscroll-x-contain" style={{ WebkitOverflowScrolling: "touch" }}>
            {[
              { value: "all", label: "الكل" },
              { value: "pending", label: "جديد" },
              { value: "preparing", label: "قيد التحضير" },
              { value: "ready", label: "جاهز" },
              { value: "delivered", label: "تم التوصيل" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value as typeof filter)}
                className={cn(
                  "px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors",
                  filter === tab.value ? "bg-foreground text-background" : "bg-card hover:bg-card/80"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* New order alert */}
      {newOrderAlert && (
        <div className="fixed top-4 left-4 right-4 z-50 p-4 bg-primary text-primary-foreground rounded-2xl shadow-xl">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 animate-bounce" />
            <div>
              <p className="font-bold">طلب جديد!</p>
              <p className="text-sm opacity-90">تم استلام طلب جديد في المطبخ</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "banner" && (
        <div className="p-4 max-w-lg mx-auto">
          <h2 className="text-lg font-bold mb-4">تخصيص البانر الرئيسي</h2>
          <HeroBannerEditor />
        </div>
      )}
      {activeTab === "stock" && (
        <div className="p-4 max-w-lg mx-auto">
          <h2 className="text-lg font-bold mb-4">إدارة المخزون</h2>
          <StockManager />
        </div>
      )}
      {activeTab === "categories" && (
        <div className="p-4 max-w-lg mx-auto">
          <h2 className="text-lg font-bold mb-4">إدارة التصنيفات</h2>
          <CategoryManager />
        </div>
      )}
      {activeTab === "sales" && (
        <div className="p-4 max-w-lg mx-auto">
          <h2 className="text-lg font-bold mb-4">تقرير المبيعات</h2>
          <SalesDashboard />
        </div>
      )}

      {activeTab === "orders" && (
        <div className="p-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center animate-pulse">
                <RefreshCw className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">جاري تحميل الطلبات...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <RefreshCw className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">لا توجد طلبات حالياً</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredOrders.map((order) => (
                <KitchenTicket key={order.id} order={order} onStatusChange={handleStatusChange} />
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  )
}