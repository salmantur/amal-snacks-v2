"use client"

import dynamic from "next/dynamic"

const StockManager = dynamic(
  () => import("@/components/stock-manager").then((m) => ({ default: m.StockManager })),
  { loading: () => <div className="py-16 text-center text-sm text-muted-foreground">جارِ التحميل...</div> }
)

export default function ItemsStockPage() {
  return (
    <div className="mx-auto max-w-lg p-4 md:p-6">
      <StockManager />
    </div>
  )
}
