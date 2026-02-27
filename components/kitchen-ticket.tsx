"use client"

import { Clock, Phone, MapPin, ChefHat, CheckCircle, Truck, Printer } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import type { Order } from "@/lib/data"
import { printOrder, getPrinterIp, setPrinterIp } from "@/lib/thermal-printer"

interface KitchenTicketProps {
  order: Order
  onStatusChange: (orderId: string, status: Order["status"]) => void
}

const statusConfig = {
  pending: {
    label: "جديد",
    color: "bg-primary text-primary-foreground",
    icon: Clock,
  },
  preparing: {
    label: "قيد التحضير",
    color: "bg-amal-yellow text-foreground",
    icon: ChefHat,
  },
  ready: {
    label: "جاهز",
    color: "bg-green-500 text-white",
    icon: CheckCircle,
  },
  delivered: {
    label: "تم التوصيل",
    color: "bg-muted text-muted-foreground",
    icon: Truck,
  },
}

export function KitchenTicket({ order, onStatusChange }: KitchenTicketProps) {
  const status = statusConfig[order.status]
  const StatusIcon = status.icon
  const timeAgo = getTimeAgo(order.createdAt)
  const [printing, setPrinting] = useState(false)
  const [printError, setPrintError] = useState<string | null>(null)
  const [printSuccess, setPrintSuccess] = useState(false)
  const [showIpEdit, setShowIpEdit] = useState(false)
  const [printerIp, setPrinterIpState] = useState(() =>
    typeof window !== "undefined" ? (localStorage.getItem("printer_ip") || "192.168.100.205") : "192.168.100.205"
  )

  const handlePrint = async () => {
    setPrinting(true)
    setPrintError(null)
    setPrintSuccess(false)
    try {
      await printOrder(order)
      setPrintSuccess(true)
      setTimeout(() => setPrintSuccess(false), 3000)
    } catch (err) {
      setPrintError(err instanceof Error ? err.message : "فشل الاتصال بالطابعة")
    } finally {
      setPrinting(false)
    }
  }

  const handleSaveIp = (ip: string) => {
    setPrinterIpState(ip)
    setPrinterIp(ip)
    setShowIpEdit(false)
  }

  const nextStatus: Record<Order["status"], Order["status"] | null> = {
    pending: "preparing",
    preparing: "ready",
    ready: "delivered",
    delivered: null,
  }

  const handleNextStatus = () => {
    const next = nextStatus[order.status]
    if (next) {
      onStatusChange(order.id, next)
    }
  }

  return (
    <div
      className={cn(
        "bg-card rounded-2xl border-2 overflow-hidden transition-all",
        order.status === "pending" && "border-primary animate-pulse-soft",
        order.status === "preparing" && "border-amal-yellow",
        order.status === "ready" && "border-green-500",
        order.status === "delivered" && "border-border opacity-60"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-amal-grey/50">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold">#{order.orderNumber}</span>
          <span className={cn("px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1", status.color)}>
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </span>
        </div>
        <span className="text-sm text-muted-foreground">{timeAgo}</span>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Customer Info */}
        <div className="flex items-start gap-3">
          <div className="flex-1 space-y-1">
            <p className="font-bold text-foreground">{order.customerName}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" />
              <span dir="ltr">{order.customerPhone}</span>
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {order.customerAddress}
            </p>
          </div>
        </div>

        {/* Scheduled Time */}
        {order.scheduledTime && (
          <div className="flex items-center gap-2 p-2 bg-amal-yellow-light rounded-lg">
            <Clock className="h-4 w-4 text-foreground" />
            <span className="text-sm font-medium">موعد التسليم: {order.scheduledTime}</span>
          </div>
        )}

        {/* Items */}
        <div className="border-t border-border pt-4">
          <h4 className="font-medium mb-2">الطلبات:</h4>
          <ul className="space-y-2">
            {order.items.map((item, index) => (
              <li key={index} className="flex justify-between text-sm">
                <span>
                  <span className="font-bold text-primary">{item.quantity}×</span> {item.name}
                </span>
                <span className="text-muted-foreground">{item.price * item.quantity} ر.س</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="p-3 bg-amal-pink-light rounded-lg">
            <p className="text-sm">
              <span className="font-medium">ملاحظات:</span> {order.notes}
            </p>
          </div>
        )}

        {/* Total */}
        <div className="flex justify-between items-center pt-2 border-t border-border">
          <span className="font-bold">الإجمالي</span>
          <span className="text-xl font-bold text-primary">{order.total} ر.س</span>
        </div>

        {/* Action Button */}
        {nextStatus[order.status] && (
          <button
            onClick={handleNextStatus}
            className={cn(
              "w-full py-3 rounded-xl font-bold transition-colors",
              order.status === "pending" && "bg-amal-yellow text-foreground hover:bg-amal-yellow/80",
              order.status === "preparing" && "bg-green-500 text-white hover:bg-green-600",
              order.status === "ready" && "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {order.status === "pending" && "بدء التحضير"}
            {order.status === "preparing" && "جاهز للتوصيل"}
            {order.status === "ready" && "تم التوصيل"}
          </button>
        )}

        {/* Print Button */}
        <button
          onClick={handlePrint}
          disabled={printing}
          className={cn(
            "w-full py-3 rounded-xl font-medium border-2 flex items-center justify-center gap-2 transition-colors disabled:opacity-50",
            printSuccess
              ? "border-green-500 bg-green-50 text-green-700"
              : "border-border hover:bg-amal-grey"
          )}
        >
          <Printer className="h-4 w-4" />
          {printing ? "جاري الطباعة..." : printSuccess ? "✓ تمت الطباعة" : "طباعة التذكرة"}
        </button>

        {/* Printer IP setting */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowIpEdit(!showIpEdit)}
            className="text-xs text-muted-foreground underline"
          >
            IP الطابعة: {printerIp}
          </button>
        </div>

        {showIpEdit && (
          <div className="flex gap-2">
            <input
              type="text"
              defaultValue={printerIp}
              placeholder="192.168.100.205"
              className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-amal-grey focus:outline-none focus:ring-2 focus:ring-primary/20"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveIp((e.target as HTMLInputElement).value)
              }}
              id="printer-ip-input"
            />
            <button
              onClick={() => {
                const input = document.getElementById("printer-ip-input") as HTMLInputElement
                if (input) handleSaveIp(input.value)
              }}
              className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg"
            >
              حفظ
            </button>
          </div>
        )}

        {/* Print Error */}
        {printError && (
          <div className="text-xs text-red-600 bg-red-50 py-2 px-3 rounded-lg whitespace-pre-line text-right">
            {printError}
          </div>
        )}
      </div>
    </div>
  )
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return "الآن"
  if (seconds < 3600) return `منذ ${Math.floor(seconds / 60)} دقيقة`
  if (seconds < 86400) return `منذ ${Math.floor(seconds / 3600)} ساعة`
  return `منذ ${Math.floor(seconds / 86400)} يوم`
}