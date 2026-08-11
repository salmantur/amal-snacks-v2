"use client"

import dynamic from "next/dynamic"
import { AdminPageHeader } from "../page-header"

const DiscountManager = dynamic(
  () => import("@/components/discount-manager").then((m) => ({ default: m.DiscountManager })),
  { loading: () => <div className="py-16 text-center text-sm text-muted-foreground">جارِ التحميل...</div> }
)

export default function DiscountsPage() {
  return (
    <div dir="rtl">
      <AdminPageHeader title="الخصومات" />
      <div className="mx-auto max-w-lg p-4 md:p-6">
        <DiscountManager />
      </div>
    </div>
  )
}
