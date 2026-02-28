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
import { ThemeEditor } from "@/components/theme-editor"
import { cn } from "@/lib/utils"

export default function AdminPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)

  const [filter, setFilter] = useState<Order["status"] | "all">("all")
  const [activeTab, setActiveTab] = useState<"orders" | "banner" | "stock" | "categories" | "sales" | "colors">("orders")
  const [newOrderAlert, setNewOrderAlert] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const orderCountRef = useRef(orders.length)

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {
        // Audio play failed, likely due to autoplay policy
      })
    }
  }, [soundEnabled])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/admin/login")
  }

  // Load initial orders
  useEffect(() => {
    fetchRecentOrders().then((data) => {
      setOrders(data)
      setLoading(false)
    })
  }, [])

  // Subscribe to realtime updates
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
          setOrders((prev) =>
            prev.map((o) => (o.id === id ? { ...o, status } : o))
          )
        }
      )
    }

    setup()
    return () => { cleanup?.() }
  }, [playNotificationSound])

  // Update order count ref for sound
  useEffect(() => {
    orderCountRef.current = orders.length
  }, [orders.length])

  const handleStatusChange = async (orderId: string, status: Order["status"]) => {
    // Optimistic update
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status } : order
      )
    )
    // Persist to Supabase
    await updateOrderStatus(orderId, status)
  }

  const filteredOrders = orders.filter(
    (order) => filter === "all" || order.status === filter
  )

  const pendingCount = orders.filter((o) => o.status === "pending").length
  const preparingCount = orders.filter((o) => o.status === "preparing").length

  return (
    <main className="min-h-screen bg-[#f5f5f5]">
      {/* Notification Sound */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleGZwzOrl0LFwRD9iq+Xx8duSQAYvh9vw+/zhok4bG33Q6Pn/+eapV0M+cLzg8P/+9u64cTg5eMDg8f7+9O++fUMvZ7be9P/96fLMj0MjV6rc8v7+5u3SlGFDM2Cp4fH++OTt2aFzTSlbqNvx/vjh7d+rfFwyU57W7v/64+zisYRkNUSRzun//eDq5buPc0Y+hMPl/v3c5ufAmoJXOHi72/v92uLnyqKPZTtqr9P4/trg5tGtm3REXaLK8v7Z3eTYuKh/ST5rr9Ly/tjb4tzDtJNfPmau0PD+1tnf4M3AoHhEP2iv0PD91dbd5NXJq4JMPWWt0PD91NTb5trQtI1UPWSuzfD909Pa5+DXv5xiP2Ss0O/809HX5+Te0MJzQl2ny+/9z87U6Ojl2s2CRlihxu390c3S6Ovq4NiXTFCXvOz8z8vQ5+3v6eTglVdLkbbm+szIzePv8+7s6apkR4OqrOrIxcne8fb07u+7dUx3l6bjxcPF2fP6+PT11od0Wmahz8XBwdXy/v338N2dg29SYJLCwb+/0fP///nz5q+Wf2xXYo64v7+/y+/////579+7pI53ZmV3qLm9vsPQ7P7///zz6se4rJaEeHNxlam2ur7E0On6///68+nXyrq0ppqMg3t3fZamsbW6wMnX6vr//fXp3NPJwbuwpZuQh4F+gI6cpq+2vcTM1eLy/v3x5NvTzca/ubKroZiPiIWDhouXoqq0vMPKz9bh7vj89uvf19HOyMS+t7GsppyTi4eFhomSmqSvuMDIzdLZ4+v2+/Pn3dXPy8bBvLazrKiflo+KhoaIjZainrG7w8rQ1t3l7vf78ePZ0szIw7+6trKuqaOdlo+LiYmMkJmjrri/xs3T2eHo8Pn67+TZ0s7Jxb+7t7OvrqqmoJqUj4uKi42SnKewtb3EytHX3+bt9vnu49nSzMnFwLy4tK+sqKSfm5aPjYuLjZGYoKmyusDGzNLZ4Ofs9frw5dzVz8vGwr66trKuqqainJeRjo2MjpGXn6iwuL/Gys/W3eTo8Pf67OLa1M/Lxr+8uLSwr6ynop2YlJCOjY6RlZyjq7O6wcfN0djf5u3z+PHn39nTz8rFwLy4tLCsqaWgnZiUkI6Oj5KYn6ess7q/xs3P1dri5+3y9O7m4NjSzcnFv7u3sq6rp6OgnZmVkpCPkJOXnaOqsLe9xMrP1Nrf5u3y9O/n4dvVz8rFwLq3s6+rp6OgnJiVkpCQkZSZnqSqsLe+w8nO09je5Ors8/Tu5+Hb1c/KxL65tLCsqKSgnZmVko+QkZSYnqSqs7e+w8jO0tfe5Ors8vPu5+Hb1c/KxL65tLCsqKSgnZmVkpCQkZSYnqSqsLe9w8jO0tfe5Onr8vPu5+Dc1tDKxL65tLCsqKSgnJmVkpCQkZSYnqSqsLe9w8jN0tfe5Onr8fLu5+Dc1tDKxL65tLCsp6SgnJmVkpCQkZSYnqOqsLa9w8jN0tbd5Onr8fLu5uDc1tDKxL65tK+sp6SgnJmVkpCQkZSYnqOpsLa9wsjN0tXd5Onr8fHu5uDb1tDKxL64tK+sp6OgnJmVko+PkZSYnqOpsLa8wsjN0tXc5Ojr8fHu5uDb1c/JxL64s6+sp6OgnJiVko+PkZSYnaOpsLa8wsfM0dXc5Ojr8PHt5uDb1c/JxL64s6+rp6OgnJiVko+PkZOYnaOpsLW8wsfM0dXc4+jr8PHt5d/a1c/JxL64s6+rp6KfnJiVko+PkJOXnaOosbW8wsfM0dXc4+jr8PHt5d/a1c/Jw764s6+rpqKfnJiUkY+OkJOXnaOosLW7wsfL0NXc4+jr7/Ht5d/a1c/Jw724sq6rpqKenJiUkY+OkJOXnKOosLW7wsbL0NTc4ujq7/Ds5d/a1M/Jw724sq6rpqKenJiUkY6OkJOXnKKnsLW7wsbL0NTb4ujq7/Ds5N/Z1M7Iw724sq6rpqGenJiUkY6OkJOWnKKnsLW7wsbK0NTb4ujq7+/s5N/Z1M7Iw724sq6qpqGenJeUkY6NkJOWnKKnr7W7wsbK0NPb4efp7+/s5N7Z1M7Iwr24sq6qpqGenJeUkY6NkJOWnKKnr7S7wMbKz9Pb4efp7+/s5N7Z1M7Iwr24sa6qpaGenJeUkI6NkJOWm6Knr7S6wMbKz9Pa4efp7+/r5N7Y087Hwr24sa6qpaGenJeUkI6NkJOWm6GnrrS6wMXKz9Pa4Ofp7u7r5N7Y087Hwr24sa6qpaGenJeUkI6NkJOWm6GnrrS6wMXJztPa4Ofp7u7r49/YD87Hwr24sa6qpaGenJeUkI6NkJOWm6GnrrS5wMXJztLZ4Obp7u3r493Xz8zGwby3sa6ppaCdm5eUkI6NkJOWm6CmrrO5wMXJztLZ3+bo7e3r493Xz8zGwLy3sa6ppaCdm5eUkI2NkJKVm6CmrrO5v8XJzdLZ3+bo7e3q493X0MzGwLy3sa2ppaCdm5aUkI2Nj5KVm6CmrbO5v8TJzdLY3+bo7ezq493X0MvGwLy3sK2po5+dm5aUkI2Nj5KVmqClrbO4v8TIzNHY3uXn7ezq4t3X0MvFwLy2sK2po5+dmpaTkI2Nj5KVmqClrbK4v8TIzNHY3uXn7ezq4t3W0MvFv7u2sK2oo5+dmpaTkI2Mj5KVmqClrLK4vsPI" type="audio/wav" />
      </audio>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100" style={{ transform: "translateZ(0)" }}>

        {/* Row 1: back + title + icon buttons */}
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: back + items link */}
          <div className="flex items-center gap-2">
            <Link href="/" className="w-10 h-10 rounded-full bg-[#f5f5f5] flex items-center justify-center active:scale-95 transition-transform flex-shrink-0">
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/admin/items" className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#f5f5f5] text-sm font-medium active:scale-95 transition-transform flex-shrink-0">
              <ChefHat className="h-4 w-4" />
              <span>الأصناف</span>
            </Link>
          </div>

          {/* Centre: title */}
          <div className="text-center">
            <h1 className="text-base font-bold leading-tight">لوحة التحكم</h1>
            <div className="flex items-center justify-center gap-2 mt-0.5">
              {pendingCount > 0 && (
                <span className="text-xs font-medium text-primary">{pendingCount} جديد</span>
              )}
              {preparingCount > 0 && (
                <span className="text-xs font-medium text-yellow-600">{preparingCount} يُحضَّر</span>
              )}
            </div>
          </div>

          {/* Right: sound + bell + logout */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors active:scale-95", soundEnabled ? "bg-primary text-primary-foreground" : "bg-[#f5f5f5]")}
            >
              {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>
            <div className="relative">
              <button
                onClick={() => fetchRecentOrders().then(setOrders)}
                className="w-10 h-10 rounded-full bg-[#f5f5f5] flex items-center justify-center active:scale-95 transition-transform"
              >
                <Bell className={cn("h-5 w-5", newOrderAlert && "text-primary animate-bounce")} />
              </button>
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold pointer-events-none">
                  {pendingCount}
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-full bg-[#f5f5f5] flex items-center justify-center active:scale-95 transition-transform"
            >
              <LogOut className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Row 2: scrollable main tabs */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {([
            { id: "orders", label: "🧾 الطلبات" },
            { id: "banner", label: "🖼 البانر" },
            { id: "stock", label: "📦 المخزون" },
            { id: "categories", label: "🗂 التصنيفات" },
            { id: "sales", label: "📊 المبيعات" },
            { id: "colors", label: "🎨 المظهر" },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 active:scale-95",
                activeTab === tab.id ? "bg-gray-900 text-white" : "bg-[#f5f5f5] text-gray-600"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Row 3: order filter tabs — only when on orders tab */}
        {activeTab === "orders" && (
          <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide border-t border-gray-100 pt-2">
            {([
              { value: "all", label: "الكل" },
              { value: "pending", label: "🆕 جديد" },
              { value: "preparing", label: "👨‍🍳 يُحضَّر" },
              { value: "ready", label: "✅ جاهز" },
              { value: "delivered", label: "🚚 تم" },
            ] as const).map(f => (
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
        )}
      </header>

      {/* New Order Alert */}
      {newOrderAlert && (
        <div className="fixed top-4 left-4 right-4 z-50 p-4 bg-primary text-primary-foreground rounded-2xl shadow-xl">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 animate-bounce flex-shrink-0" />
            <div>
              <p className="font-bold">طلب جديد!</p>
              <p className="text-sm opacity-90">تم استلام طلب جديد في المطبخ</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab content */}
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
      {activeTab === "colors" && (
        <div className="p-4 max-w-lg mx-auto">
          <h2 className="text-lg font-bold mb-4">🎨 تخصيص المظهر</h2>
          <ThemeEditor />
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
              <p className="text-gray-400">لا توجد طلبات حالياً</p>
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