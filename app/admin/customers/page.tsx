"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, X } from "lucide-react"
import { fetchRecentOrders } from "@/lib/orders"
import { summarizeCustomers, type CustomerSummary } from "@/lib/customers"
import { getTimeAgo } from "@/components/order-card"
import { AdminPageHeader } from "../page-header"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"

const HISTORY_DAYS = 365
const HISTORY_LIMIT = 5000

export default function CustomersPage() {
  const [orders, setOrders] = useState<Awaited<ReturnType<typeof fetchRecentOrders>>>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<CustomerSummary | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await fetchRecentOrders({ days: HISTORY_DAYS, maxRecords: HISTORY_LIMIT })
        if (!cancelled) {
          setOrders(data)
          setLoadError(null)
        }
      } catch (error) {
        console.error("Failed to load orders for customers page", error)
        if (!cancelled) setLoadError("تعذر تحميل بيانات العملاء. تحقق من إعدادات Supabase ثم أعد المحاولة.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const customers = useMemo(() => summarizeCustomers(orders), [orders])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return customers
    return customers.filter((c) => c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q))
  }, [customers, search])

  return (
    <div dir="rtl">
      <AdminPageHeader title="العملاء" description="عدد الطلبات ومجموع المشتريات لكل عميل" />

      <div className="mx-auto max-w-3xl p-4 sm:p-8">
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الجوال..."
            dir="rtl"
            className="w-full rounded-xl bg-white border border-admin-border-soft py-2.5 pr-9 pl-3 text-sm focus:outline-none"
          />
          {search ? (
            <button
              onClick={() => setSearch("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted hover:text-admin-ink"
              aria-label="مسح البحث"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-admin-muted">جاري تحميل العملاء...</div>
        ) : loadError && orders.length === 0 ? (
          <div className="py-16 text-center text-sm text-red-600">{loadError}</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-admin-muted">لا يوجد عملاء</div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtered.map((customer) => (
              <button
                key={customer.phone}
                type="button"
                onClick={() => setSelected(customer)}
                className="flex items-center justify-between gap-3 rounded-lg border border-admin-border-soft bg-white p-4 text-right transition-colors hover:border-admin-ink/20"
              >
                <div className="min-w-0">
                  <div className="text-[15px] font-bold">{customer.name}</div>
                  <div className="font-admin-mono text-[13px] text-admin-muted" dir="ltr">
                    {customer.phone}
                  </div>
                  <div className="mt-0.5 text-xs text-admin-muted-2">آخر طلب {getTimeAgo(customer.lastOrderAt)}</div>
                </div>
                <div className="flex flex-shrink-0 flex-col items-end gap-1">
                  <span className="rounded-full bg-admin-ink px-2.5 py-1 text-xs font-bold text-white">
                    {customer.orderCount} طلب
                  </span>
                  <span className="font-admin-mono text-sm font-semibold text-admin-muted">
                    {customer.totalSpent} ر.س
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent
          side="left"
          className="flex w-full flex-col gap-4 overflow-y-auto border-admin-border bg-white p-7 sm:max-w-[460px]"
          dir="rtl"
        >
          {selected ? (
            <>
              <SheetTitle className="text-base font-extrabold">{selected.name}</SheetTitle>
              <div className="font-admin-mono text-sm text-admin-muted" dir="ltr">{selected.phone}</div>

              <div className="flex gap-2">
                <span className="rounded-lg bg-admin-bg px-3 py-2 text-xs font-semibold">
                  {selected.orderCount} طلب إجمالي
                </span>
                <span className="rounded-lg bg-admin-bg px-3 py-2 text-xs font-semibold">
                  {selected.totalSpent} ر.س إجمالي
                </span>
              </div>

              <div className="mt-2 flex flex-col gap-2.5">
                <div className="text-[13px] font-extrabold text-admin-muted-2">سجل الطلبات</div>
                {selected.orders
                  .slice()
                  .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                  .map((order) => (
                    <div key={order.id} className="rounded-lg border border-admin-border-soft p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-admin-mono text-sm font-bold">#{order.orderNumber}</span>
                        <span className="text-xs text-admin-muted-2">{getTimeAgo(order.createdAt)}</span>
                      </div>
                      <div className="mt-1 text-xs text-admin-muted">
                        {order.items.map((item) => `${item.quantity}x ${item.name}`).join("، ")}
                      </div>
                      <div className="mt-1 font-admin-mono text-sm font-semibold">{order.total} ر.س</div>
                    </div>
                  ))}
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
