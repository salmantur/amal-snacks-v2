"use client"

import { useState } from "react"
import { Printer } from "lucide-react"
import type { Order } from "@/lib/data"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { getTimeAgo } from "./order-card"

interface OrderDetailPanelProps {
  order: Order | null
  onOpenChange: (open: boolean) => void
  onPrint: (order: Order) => void
  printing: boolean
  printError: string | null
  printerIp: string
  onSavePrinterIp: (ip: string) => void
}

const TYPE_META: Record<Order["orderType"], { label: string; color: string; tint: string }> = {
  delivery: { label: "توصيل", color: "text-admin-delivery", tint: "bg-admin-delivery-tint" },
  pickup: { label: "استلام", color: "text-admin-pickup", tint: "bg-admin-pickup-tint" },
}

export function OrderDetailPanel({
  order,
  onOpenChange,
  onPrint,
  printing,
  printError,
  printerIp,
  onSavePrinterIp,
}: OrderDetailPanelProps) {
  const [showIpEdit, setShowIpEdit] = useState(false)

  const handleSaveIp = (ip: string) => {
    onSavePrinterIp(ip)
    setShowIpEdit(false)
  }

  if (!order) return null

  const type = TYPE_META[order.orderType]
  const isPickup = order.orderType === "pickup"

  return (
    <Sheet open={Boolean(order)} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="flex w-full flex-col gap-[22px] overflow-y-auto border-admin-border bg-white p-7 sm:max-w-[460px]"
        dir="rtl"
      >
        <SheetTitle className="sr-only">تفاصيل الطلب #{order.orderNumber}</SheetTitle>

        <div>
          <div className="font-admin-mono text-[22px] font-extrabold">#{order.orderNumber}</div>
          <div className="mt-0.5 text-xs text-admin-muted-2">{getTimeAgo(order.createdAt)}</div>
        </div>

        <span className={`inline-block w-fit rounded-lg px-[11px] py-[5px] text-xs font-bold ${type.tint} ${type.color}`}>
          {type.label}
        </span>

        <div className="flex flex-col gap-2 rounded-[10px] bg-admin-bg p-4">
          <div className="text-base font-extrabold">{order.customerName}</div>
          <a href={`tel:${order.customerPhone}`} className="font-admin-mono text-[13.5px] no-underline" dir="ltr">
            📞 {order.customerPhone || "-"}
          </a>
          <div className="text-[13.5px] text-admin-muted">
            {isPickup ? "استلام من المحل" : order.customerAddress || "-"}
          </div>
          {order.scheduledTime ? (
            <div className="mt-1 rounded-lg bg-admin-window-tint px-3 py-[9px] text-[13px] font-semibold text-admin-window">
              {isPickup ? "موعد الاستلام" : "موعد التوصيل"}: {order.scheduledTime}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="text-[13px] font-extrabold text-admin-muted-2">تفاصيل الطلب</div>
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between border-b border-admin-border-soft pb-2 text-sm">
              <span>{item.quantity}x {item.name}</span>
            </div>
          ))}
          <div className="flex items-baseline justify-between pt-1.5">
            <span className="text-sm font-bold text-admin-muted">الإجمالي</span>
            <span className="font-admin-mono text-xl font-extrabold">{order.total} ر.س</span>
          </div>
        </div>

        {order.notes ? (
          <div className="rounded-lg bg-admin-window-tint p-3 text-sm">
            <span className="font-medium">ملاحظات:</span> {order.notes}
          </div>
        ) : null}

        <div className="mt-auto flex flex-col gap-2.5 pt-2.5">
          <button
            type="button"
            onClick={() => onPrint(order)}
            disabled={printing}
            className="flex items-center justify-center gap-2 rounded-[9px] border border-admin-border bg-white p-[13px] text-sm font-semibold transition-colors hover:bg-admin-bg disabled:opacity-50"
          >
            <Printer className="h-4 w-4" />
            {printing ? "جاري الطباعة..." : "طباعة الآن"}
          </button>

          {printError ? (
            <div className="whitespace-pre-line rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{printError}</div>
          ) : null}

          {showIpEdit ? (
            <div className="flex gap-2">
              <input
                type="text"
                defaultValue={printerIp}
                placeholder="192.168.100.205"
                dir="ltr"
                className="flex-1 rounded-lg bg-admin-bg px-3 py-1.5 text-sm focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveIp((e.target as HTMLInputElement).value)
                }}
                id={`detail-printer-ip-${order.id}`}
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById(`detail-printer-ip-${order.id}`) as HTMLInputElement | null
                  if (input) handleSaveIp(input.value)
                }}
                className="rounded-lg bg-admin-ink px-3 py-1.5 text-sm text-white"
              >
                حفظ
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowIpEdit(true)}
              className="font-admin-mono text-center text-[11px] text-admin-muted-3"
            >
              IP الطابعة: {printerIp}
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
