"use client"

import { Printer, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Order } from "@/lib/data"

interface OrderCardProps {
  order: Order
  onOpen: (order: Order) => void
  onPrint: (order: Order) => void
  onInvoice: (order: Order) => void
  printing: boolean
}

const TYPE_META: Record<Order["orderType"], { label: string; color: string }> = {
  delivery: { label: "توصيل", color: "text-admin-delivery" },
  pickup: { label: "استلام", color: "text-admin-pickup" },
}

export function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  if (seconds < 60) return "الآن"
  if (seconds < 3600) return `منذ ${Math.floor(seconds / 60)} دقيقة`
  if (seconds < 86400) return `منذ ${Math.floor(seconds / 3600)} ساعة`
  return `منذ ${Math.floor(seconds / 86400)} يوم`
}

export function OrderCard({ order, onOpen, onPrint, onInvoice, printing }: OrderCardProps) {
  const type = TYPE_META[order.orderType]
  const isPickup = order.orderType === "pickup"
  const urgent = order.status === "pending"

  return (
    <div
      onClick={() => onOpen(order)}
      className="flex cursor-pointer flex-col gap-3 rounded-lg border border-admin-border bg-white p-[18px] transition-shadow hover:border-admin-ink/20 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
      dir="rtl"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="font-admin-mono text-[15px] font-bold">#{order.orderNumber}</span>
          <span className="text-[11.5px] text-admin-muted-3">{getTimeAgo(order.createdAt)}</span>
          {urgent ? <span className="inline-block h-1.5 w-1.5 rounded-full bg-admin-urgent" /> : null}
        </div>
        <span className={cn("text-[11.5px] font-semibold", type.color)}>{type.label}</span>
      </div>

      <div className="h-px bg-admin-border-soft" />

      <div className="flex flex-col gap-0.5">
        <div className="text-[15px] font-bold">{order.customerName}</div>
        <div className="font-admin-mono text-[13px] text-admin-muted" dir="ltr">
          {order.customerPhone || "-"}
        </div>
        <div className="text-[13px] text-admin-muted">
          {isPickup ? "استلام من المحل" : order.customerAddress || "-"}
        </div>
      </div>

      {order.scheduledTime ? (
        <div className="text-[12.5px] font-semibold text-admin-muted-2">
          {isPickup ? "موعد الاستلام" : "موعد التوصيل"}: {order.scheduledTime}
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5 border-y border-dashed border-admin-border py-2.5">
        {order.items.map((item, index) => (
          <div key={index} className="flex justify-between text-[13.5px]">
            <span>{item.name}</span>
            <span className="font-admin-mono font-semibold text-admin-muted-2">{item.quantity}x</span>
          </div>
        ))}
      </div>

      <div className="flex items-baseline justify-between">
        <span className="text-[12.5px] font-semibold text-admin-muted-2">الإجمالي</span>
        <span className="font-admin-mono text-base font-bold">{order.total} ر.س</span>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onPrint(order)
          }}
          disabled={printing}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-admin-border-soft bg-white p-[11px] text-[13.5px] font-semibold transition-colors hover:bg-admin-bg disabled:opacity-50"
        >
          <Printer className="h-[15px] w-[15px]" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onInvoice(order)
          }}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-admin-border-soft bg-white p-[11px] text-[13.5px] font-semibold transition-colors hover:bg-admin-bg"
        >
          <Download className="h-[15px] w-[15px]" />
        </button>
      </div>
    </div>
  )
}
