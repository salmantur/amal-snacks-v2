/**
 * Epson TM-M30II ePOS Print over WiFi/Ethernet
 * Works on iPhone Safari when SSL is enabled on the printer
 * Ticket: name, day, date, time, items (no prices)
 */

import type { Order } from "@/lib/data"

let PRINTER_IP = "192.168.100.205"

export function getPrinterIp(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("printer_ip") || PRINTER_IP
  }
  return PRINTER_IP
}

export function setPrinterIp(ip: string): void {
  PRINTER_IP = ip
  if (typeof window !== "undefined") {
    localStorage.setItem("printer_ip", ip)
  }
}

function x(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function buildXml(order: Order): string {
  const d = new Date(order.createdAt)
  const dayName = d.toLocaleDateString("ar-SA", { weekday: "long" })
  const dateStr = d.toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })
  const timeStr = d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })

  const L: string[] = []

  const line = (text: string, em = false, dh = false, align = "left") =>
    L.push(`<text align="${align}" em="${em}" dh="${dh}">${x(text)}&#10;</text>`)

  const sep  = () => L.push(`<text>--------------------------------&#10;</text>`)
  const sep2 = () => L.push(`<text>================================&#10;</text>`)
  const feed = (n = 1) => L.push(`<feed line="${n}"/>`)

  // Header
  sep2()
  line("أمل سناك", true, true, "center")
  line("تذكرة المطبخ", false, false, "center")
  sep2()

  // Order number
  line(`#${order.orderNumber}`, true, true, "center")
  feed()

  // Date & time in Arabic
  line(`${dayName}`)
  line(`${dateStr}`)
  line(`${timeStr}`)
  sep()

  // Customer name
  line(`الاسم: ${order.customerName}`, true)

  // Scheduled time if any
  if (order.scheduledTime) {
    line(`الموعد: ${order.scheduledTime}`, true)
  }
  sep()

  // Items — name + quantity only, no prices
  line("الطلبات:", true)
  feed()
  for (const item of order.items) {
    line(`${item.quantity}x  ${item.name}`, true)
    const ing = (item as { selectedIngredients?: string[] }).selectedIngredients
    if (ing?.length) {
      line(`    ${ing.join(" - ")}`)
    }
    feed()
  }

  // Notes
  if (order.notes) {
    sep()
    line("ملاحظات:", true)
    line(order.notes)
  }

  sep2()
  feed(5)
  L.push(`<cut type="feed"/>`)

  return `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Body>
    <epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">
      ${L.join("\n      ")}
    </epos-print>
  </s:Body>
</s:Envelope>`
}

export async function printOrder(order: Order): Promise<void> {
  const ip = getPrinterIp()
  const url = `https://${ip}/cgi-bin/epos/service.cgi?devid=local_printer&timeout=10000`
  const xml = buildXml(order)

  let response: Response
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction": '""',
      },
      body: xml,
      signal: AbortSignal.timeout(8000),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const isTimeout = err instanceof Error &&
      (err.name === "AbortError" || err.name === "TimeoutError")
    if (isTimeout || msg.includes("fetch")) {
      throw new Error(
        `تعذر الاتصال بالطابعة (${ip})\n` +
        `• تأكد أن الطابعة شغالة\n` +
        `• الآيفون على نفس الشبكة\n` +
        `• SSL مفعّل على الطابعة`
      )
    }
    throw new Error(`خطأ: ${msg}`)
  }

  if (!response.ok) {
    throw new Error(`رفضت الطابعة الطلب (${response.status})`)
  }

  const body = await response.text()
  if (body.includes("SchemaError") || body.includes("DeviceNotFound")) {
    throw new Error("تأكد من تفعيل ePOS-Print على الطابعة")
  }
}