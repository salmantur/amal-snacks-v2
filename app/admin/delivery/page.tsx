"use client"

import dynamic from "next/dynamic"
import { AdminPageHeader } from "../page-header"

const LOADING = <div className="py-16 text-center text-sm text-muted-foreground">جارِ التحميل...</div>

const DeliveryAreasManager = dynamic(
  () => import("@/components/delivery-areas-manager").then((m) => ({ default: m.DeliveryAreasManager })),
  { loading: () => LOADING }
)
const ClosedDatesManager = dynamic(
  () => import("@/components/closed-dates-manager").then((m) => ({ default: m.ClosedDatesManager })),
  { loading: () => LOADING }
)

export default function DeliveryPage() {
  return (
    <div dir="rtl">
      <AdminPageHeader title="التوصيل" description="مناطق التوصيل والأيام المغلقة" />
      <div className="mx-auto max-w-lg space-y-6 p-4 md:p-6">
        <DeliveryAreasManager />
        <ClosedDatesManager />
      </div>
    </div>
  )
}
