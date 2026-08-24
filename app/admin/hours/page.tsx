"use client"

import dynamic from "next/dynamic"
import { AdminPageHeader } from "../page-header"

const OrderScheduleManager = dynamic(
  () => import("@/components/order-schedule-manager").then((m) => ({ default: m.OrderScheduleManager })),
  { loading: () => <div className="py-16 text-center text-sm text-muted-foreground">جارِ التحميل...</div> }
)

export default function HoursPage() {
  return (
    <div dir="rtl">
      <AdminPageHeader title="ساعات العمل" />
      <div className="mx-auto max-w-lg p-4 md:p-6">
        <OrderScheduleManager />
      </div>
    </div>
  )
}
