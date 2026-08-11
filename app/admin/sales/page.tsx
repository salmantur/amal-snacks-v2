"use client"

import dynamic from "next/dynamic"
import { AdminPageHeader } from "../page-header"

const SalesDashboard = dynamic(
  () => import("@/components/sales-dashboard").then((m) => ({ default: m.SalesDashboard })),
  { loading: () => <div className="py-16 text-center text-sm text-muted-foreground">جارِ التحميل...</div> }
)

export default function SalesPage() {
  return (
    <div dir="rtl">
      <AdminPageHeader title="تقرير المبيعات" />
      <div className="p-4 md:p-6">
        <SalesDashboard />
      </div>
    </div>
  )
}
