"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Bell, Volume2, VolumeX, RefreshCw, AlertTriangle, ChevronDown, Search, X } from "lucide-react"
import { type Order } from "@/lib/data"
import { fetchRecentOrders, subscribeToOrders, updateOrderStatus, fetchFailedOrders, resolveFailedOrder, type FailedOrder } from "@/lib/orders"
import { KitchenTicket } from "@/components/kitchen-ticket"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type OrderFilter = Order["status"] | "all"
type TypeFilter = "all" | "delivery" | "pickup"
type SortBy = "newest" | "oldest" | "highest" | "status"

const statusPriority: Record<Order["status"], number> = {
  pending: 0,
  preparing: 1,
  ready: 2,
  delivered: 3,
}

const STATUS_FILTERS: { value: OrderFilter; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "pending", label: "جديد" },
  { value: "preparing", label: "قيد التحضير" },
  { value: "ready", label: "جاهز" },
  { value: "delivered", label: "مكتمل" },
]

// Realtime subscription is the primary sync path (subscribeToOrders below).
// This interval is a fallback only, in case the realtime channel silently
// drops - it does not need to run every few seconds.
const ORDERS_POLL_INTERVAL_MS = 60000
const INITIAL_ORDER_HISTORY_DAYS = 365
const INITIAL_ORDER_HISTORY_LIMIT = 5000
const POLL_ORDER_HISTORY_DAYS = 30
const POLL_ORDER_HISTORY_LIMIT = 500

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

function failedOrderReasonLabel(reason: string): string {
  if (reason === "rate_limited") return "تم رفض الطلب مؤقتًا (عدد كبير من الطلبات في وقت قصير)"
  if (reason === "invalid_payload") return "بيانات الطلب غير مكتملة أو غير صحيحة"
  if (reason.startsWith("unknown_menu_item")) return "أحد الأصناف لم يعد متوفرًا في القائمة"
  if (reason === "invalid_delivery_area") return "منطقة التوصيل لم تعد صالحة"
  if (reason === "menu_load_failed") return "تعذر تحميل أسعار القائمة"
  if (reason.startsWith("db_insert_failed")) return "خطأ في حفظ الطلب في قاعدة البيانات"
  return reason
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)

  const [filter, setFilter] = useState<OrderFilter>("all")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [sortBy, setSortBy] = useState<SortBy>("newest")
  const [searchQuery, setSearchQuery] = useState("")
  const [newOrderAlert, setNewOrderAlert] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const [failedOrders, setFailedOrders] = useState<FailedOrder[]>([])
  const [failedOrdersPanelOpen, setFailedOrdersPanelOpen] = useState(false)
  const unresolvedFailedOrders = useMemo(
    () => failedOrders.filter((f) => !f.resolved),
    [failedOrders]
  )

  const refreshFailedOrders = useCallback(async () => {
    try {
      const data = await fetchFailedOrders()
      setFailedOrders(data)
    } catch (error) {
      console.error("Failed to load failed-orders log", error)
    }
  }, [])

  useEffect(() => {
    void refreshFailedOrders()
    const intervalId = window.setInterval(() => void refreshFailedOrders(), ORDERS_POLL_INTERVAL_MS)
    return () => window.clearInterval(intervalId)
  }, [refreshFailedOrders])

  const handleResolveFailedOrder = async (id: string) => {
    setFailedOrders((prev) => prev.map((f) => (f.id === id ? { ...f, resolved: true } : f)))
    await resolveFailedOrder(id)
  }

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled || !audioRef.current) return
    audioRef.current.currentTime = 0
    audioRef.current.play().catch(() => {})
  }, [soundEnabled])

  const refreshOrders = useCallback(async (mode: "initial" | "poll" = "poll") => {
    try {
      const data = await fetchRecentOrders(
        mode === "initial"
          ? { days: INITIAL_ORDER_HISTORY_DAYS, maxRecords: INITIAL_ORDER_HISTORY_LIMIT }
          : { days: POLL_ORDER_HISTORY_DAYS, maxRecords: POLL_ORDER_HISTORY_LIMIT }
      )
      setOrders((prev) => mergeOrders(prev, data))
      setLoadError(null)
    } catch (error) {
      console.error("Failed to refresh admin orders", error)
      setLoadError("تعذر تحميل الطلبات من لوحة التحكم. تحقق من الجلسة أو إعدادات Supabase ثم أعد المحاولة.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshOrders("initial")
  }, [refreshOrders])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void refreshOrders("poll")
    }, ORDERS_POLL_INTERVAL_MS)

    const handleWindowFocus = () => {
      void refreshOrders("poll")
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void refreshOrders("poll")
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

  return (
    <div dir="rtl" className="min-h-[calc(100dvh-3.5rem)] bg-muted/30">
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleGZwzOrl0LFwRD9iq+Xx8duSQAYvh9vw+/zhok4bG33Q6Pn/+eapV0M+cLzg8P/+9u64cTg5eMDg8f7+9O++fUMvZ7be9P/96fLMj0MjV6rc8v7+5u3SlGFDM2Cp4fH++OTt2aFzTSlbqNvx/vjh7d+rfFwyU57W7v/64+zisYRkNUSRzun//eDq5buPc0Y+hMPl/v3c5ufAmoJXOHi72/v92uLnyqKPZTtqr9P4/trg5tGtm3REXaLK8v7Z3eTYuKh/ST5rr9Ly/tjb4tzDtJNfPmau0PD+1tnf4M3AoHhEP2iv0PD91dbd5NXJq4JMPWWt0PD91NTb5trQtI1UPWSuzfD909Pa5+DXv5xiP2Ss0O/809HX5+Te0MJzQl2ny+/9z87U6Ojl2s2CRlihxu390c3S6Ovq4NiXTFCXvOz8z8vQ5+3v6eTglVdLkbbm+szIzePv8+7s6apkR4OqrOrIxcne8fb07u+7dUx3l6bjxcPF2fP6+PT11od0Wmahz8XBwdXy/v338N2dg29SYJLCwb+/0fP///nz5q+Wf2xXYo64v7+/y+/////579+7pI53ZmV3qLm9vsPQ7P7///zz6se4rJaEeHNxlam2ur7E0On6///68+nXyrq0ppqMg3t3fZamsbW6wMnX6vr//fXp3NPJwbuwpZuQh4F+gI6cpq+2vcTM1eLy/v3x5NvTzca/ubKroZiPiIWDhouXoqq0vMPKz9bh7vj89uvf19HOyMS+t7GsppyTi4eFhomSmqSvuMDIzdLZ4+v2+/Pn3dXPy8bBvLazrKiflo+KhoaIjZainrG7w8rQ1t3l7vf78ePZ0szIw7+6trKuqaOdlo+LiYmMkJmjrri/xs3T2eHo8Pn67+TZ0s7Jxb+7t7OvrqqmoJqUj4uKi42SnKewtb3EytHX3+bt9vnu49nSzMnFwLy4tK+sqKSfm5aPjYuLjZGYoKmyusDGzNLZ4Ofs9frw5dzVz8vGwr66trKuqqainJeRjo2MjpGXn6iwuL/Gys/W3eTo8Pf67OLa1M/Lxr+8uLSwr6ynop2YlJCOjY6RlZyjq7O6wcfN0djf5u3z+PHn39nTz8rFwLy4tLCsqaWgnZiUkI6Oj5KYn6ess7q/xs3P1dri5+3y9O7m4NjSzcnFv7u3sq6rp6OgnZmVkpCPkJOXnaOqsLe9xMrP1Nrf5u3y9O/n4dvVz8rFwLq3s6+rp6OgnJiVkpCQkZSZnqSqsLe+w8nO09je5Ors8/Tu5+Hb1c/KxL65tLCsqKSgnZmVko+QkZSYnqSqs7e+w8jO0tfe5Ors8vPu5+Hb1c/KxL65tLCsqKSgnZmVkpCQkZSYnqSqsLe9w8jO0tfe5Onr8vPu5+Dc1tDKxL65tLCsqKSgnJmVkpCQkZSYnqSqsLe9w8jN0tfe5Onr8fLu5+Dc1tDKxL65tLCsp6SgnJmVkpCQkZSYnqOqsLa9w8jN0tbd5Onr8fLu5uDc1tDKxL65tK+sp6SgnJmVkpCQkZSYnqOpsLa9wsjN0tXd5Onr8fHu5uDb1tDKxL64tK+sp6OgnJmVko+PkZSYnqOpsLa8wsjN0tXc5Ojr8fHu5uDb1c/JxL64s6+sp6OgnJiVko+PkZSYnaOpsLa8wsfM0dXc5Ojr8PHt5uDb1c/JxL64s6+rp6OgnJiVko+PkZOYnaOpsLW8wsfM0dXc4+jr8PHt5d/a1c/JxL64s6+rpqKfnJiVko+PkJOXnaOosbW8wsfM0dXc4+jr8PHt5d/a1c/Jw764s6+rpqKfnJiUkY+OkJOXnaOosLW7wsfL0NXc4+jr7/Ht5d/a1M/Jw724sq6rpqKenJiUkY+OkJOXnKOosLW7wsbL0NTc4ujq7/Ds5d/a1M/Jw724sq6rpqKenJiUkY6OkJOXnKKnsLW7wsbL0NTb4ujq7/Ds5N/Z1M7Iw724sq6qpqGenJeUkY6NkJOWnKKnr7W7wsbK0NTb4ujq7+/s5N/Z1M7Iwr24sq6qpqGenJeUkY6NkJOWnKKnr7S7wMbKz9Pb4efp7+/s5N7Z1M7Iwr24sa6qpaGenJeUkI6NkJOWm6Knr7S6wMbKz9Pa4efp7+/r5N7Y087Hwr24sa6qpaGenJeUkI6NkJOWm6GnrrS6wMXKz9Pa4Ofp7u7r5N7Y087Hwr24sa6qpaGenJeUkI6NkJOWm6GnrrS6wMXJztPa4Ofp7u7r49/YD87Hwr24sa6qpaGenJeUkI6NkJOWm6GnrrS5wMXJztLZ4Obp7u3r493Xz8zGwby3sa6ppaCdm5eUkI6NkJOWm6CmrrO5wMXJztLZ3+bo7e3r493Xz8zGwLy3sa6ppaCdm5eUkI2NkJKVm6CmrrO5v8XJzdLZ3+bo7e3q493X0MzGwLy3sa2ppaCdm5aUkI2Nj5KVm6CmrbO5v8TJzdLY3+bo7ezq493X0MvGwLy3sK2po5+dm5aUkI2Nj5KVmqClrbO4v8TIzNHY3uXn7ezq4t3X0MvFwLy2sK2po5+dmpaTkI2Nj5KVmqClrbK4v8TIzNHY3uXn7ezq4t3W0MvFv7u2sK2oo5+dmpaTkI2Mj5KVmqClrLK4vsPI" type="audio/wav" />
      </audio>

      {newOrderAlert ? (
        <div className="fixed left-4 right-4 top-4 z-50 rounded-2xl bg-primary p-4 text-primary-foreground shadow-xl md:left-auto md:w-96">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 flex-shrink-0 animate-bounce" />
            <div>
              <p className="font-bold">طلب جديد</p>
              <p className="text-sm opacity-90">تم استقبال طلب جديد في لوحة الطلبات</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="border-b border-border bg-background px-4 py-4 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">الطلبات</h1>
            <div className="mt-1 flex items-center gap-2">
              {pendingCount > 0 ? (
                <Badge className="bg-primary text-primary-foreground">{pendingCount} جديد</Badge>
              ) : null}
              {preparingCount > 0 ? (
                <Badge className="bg-amal-yellow text-foreground">{preparingCount} قيد التحضير</Badge>
              ) : null}
              {pendingCount === 0 && preparingCount === 0 ? (
                <span className="text-sm text-muted-foreground">لا توجد طلبات نشطة حالياً</span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => void refreshOrders("poll")}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/70"
              aria-label="تحديث"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setSoundEnabled((v) => !v)}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                soundEnabled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
              aria-label="الصوت"
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم، الجوال، أو رقم الطلب..."
              className="pr-9 text-right"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="مسح البحث"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
            <SelectTrigger className="w-36" dir="rtl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent dir="rtl">
              <SelectItem value="all">كل الأنواع</SelectItem>
              <SelectItem value="delivery">توصيل</SelectItem>
              <SelectItem value="pickup">استلام</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
            <SelectTrigger className="w-36" dir="rtl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent dir="rtl">
              <SelectItem value="newest">الأحدث</SelectItem>
              <SelectItem value="oldest">الأقدم</SelectItem>
              <SelectItem value="highest">الأعلى سعراً</SelectItem>
              <SelectItem value="status">حسب الحالة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "flex-shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                filter === f.value ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/70"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 md:p-6">
        {unresolvedFailedOrders.length > 0 ? (
          <div className="mb-4 overflow-hidden rounded-2xl border border-red-200 bg-red-50">
            <button
              type="button"
              onClick={() => setFailedOrdersPanelOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-right"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
                <span className="text-sm font-bold text-red-700">
                  {unresolvedFailedOrders.length} طلب لم يتم حفظه — راجع واتساب للتأكد منه
                </span>
              </div>
              <ChevronDown
                className={cn("h-4 w-4 text-red-500 transition-transform", failedOrdersPanelOpen && "rotate-180")}
              />
            </button>
            {failedOrdersPanelOpen ? (
              <div className="divide-y divide-red-100 border-t border-red-200">
                {unresolvedFailedOrders.map((f) => (
                  <div key={f.id} className="flex items-start justify-between gap-3 px-4 py-3 text-right text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900">
                        {f.customerName || "بدون اسم"}
                        {f.customerPhone ? ` · ${f.customerPhone}` : ""}
                      </p>
                      <p className="mt-0.5 text-gray-500">{failedOrderReasonLabel(f.reason)}</p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {f.createdAt.toLocaleString("ar-SA", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                      {f.rawPayload ? (
                        <pre
                          dir="ltr"
                          className="mt-2 max-h-40 overflow-auto rounded-lg bg-gray-900 p-2 text-left text-[11px] leading-relaxed text-gray-100"
                        >
                          {JSON.stringify(f.rawPayload, null, 2)}
                        </pre>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleResolveFailedOrder(f.id)}
                      className="shrink-0 rounded-full border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                    >
                      تم الحل
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {loading ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-muted">
              <RefreshCw className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">جاري تحميل الطلبات...</p>
          </div>
        ) : loadError && orders.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <X className="h-8 w-8 text-red-400" />
            </div>
            <p className="mx-auto max-w-md text-sm font-medium text-red-600">{loadError}</p>
            <button
              onClick={() => void refreshOrders()}
              className="mt-4 rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <RefreshCw className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">لا توجد نتائج مطابقة</p>
          </div>
        ) : (
          <>
            {loadError ? (
              <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-right text-sm text-amber-700">
                {loadError}
              </div>
            ) : null}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredOrders.map((order) => (
                <KitchenTicket key={order.id} order={order} onStatusChange={handleStatusChange} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
