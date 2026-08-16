"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import type { Order } from "@/lib/data"
import { downloadInvoice } from "@/lib/invoice"

interface InvoiceModalProps {
  order: Order | null
  onClose: () => void
}

function todayLabel(): string {
  const d = new Date()
  return d.toLocaleDateString("ar-SA", { year: "numeric", month: "2-digit", day: "2-digit" })
}

export function InvoiceModal({ order, onClose }: InvoiceModalProps) {
  const [vatNumber, setVatNumber] = useState("")
  const [clientName, setClientName] = useState("")
  const [date, setDate] = useState("")
  const [downloading, setDownloading] = useState(false)

  // Reset the form's fields to defaults whenever a different order is opened.
  useEffect(() => {
    if (order) {
      setVatNumber("")
      setClientName(order.customerName)
      setDate(todayLabel())
    }
  }, [order])

  if (!order) return null

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await downloadInvoice(order, {
        vatNumber: vatNumber.trim(),
        clientName: clientName.trim() || order.customerName,
        date: date.trim() || todayLabel(),
      })
      onClose()
    } catch {
      window.alert("تعذر إنشاء الفاتورة، حاول مرة أخرى")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold">فاتورة #{order.orderNumber}</h2>
          <button type="button" onClick={onClose} className="text-admin-muted hover:text-admin-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-admin-muted-2">الرقم الضريبي (اختياري)</span>
            <input
              type="text"
              value={vatNumber}
              onChange={(e) => setVatNumber(e.target.value)}
              dir="ltr"
              placeholder="3xxxxxxxxxxxxxx"
              className="rounded-lg border border-admin-border-soft px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-admin-ink"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-admin-muted-2">اسم الشركة أو العميل</span>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="rounded-lg border border-admin-border-soft px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-admin-ink"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-admin-muted-2">التاريخ</span>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-admin-border-soft px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-admin-ink"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={downloading}
          className="mt-5 w-full rounded-lg bg-admin-ink py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {downloading ? "جاري التحميل..." : "تحميل الفاتورة"}
        </button>
      </div>
    </div>
  )
}
