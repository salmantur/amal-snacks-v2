/**
 * Epson TM-M30II printer via ePOS SDK over WiFi
 * Works on iPhone Safari, Android Chrome, desktop — any browser on the same network
 *
 * How it works:
 * - TM-M30II has a built-in HTTP server at its IP address
 * - We POST an XML/SOAP print job to http://PRINTER_IP/cgi-bin/epos/service.cgi
 * - No Bluetooth, no app, no driver needed
 *
 * ⚠️  iPhone must be on the SAME WiFi as the printer
 * ⚠️  Mixed content: if your site is HTTPS, the browser will block HTTP printer requests.
 * Fix: enable SSL on the printer via Epson TM Utility app, then use https://PRINTER_IP
 */

import type { Order } from "@/lib/data"

// Printer IP — change if it moves (self-test print shows current IP)
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

// ── XML helpers ────────────────────────────────────────────────────────────

function x(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

// ── Build ePOS SOAP envelope ───────────────────────────────────────────────

function buildXml(order: Order): string {
  const d = new Date(order.createdAt)
  const time = d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })
  const date = d.toLocaleDateString("ar-SA")

  const lines: string[] = []

  const t = (text: string, em = false, dw = false, dh = false) => {
    const attrs = [em && 'em="true"', dw && 'dw="true"', dh && 'dh="true"']
      .filter(Boolean).join(" ")
    lines.push(`<text ${attrs}>${x(text)}\n</text>`)
  }

  const sep = (c = "-") => lines.push(`<text>${x(c.repeat(32))}\n</text>`)
  const br = (n = 1) => lines.push(`<feed line="${n}"/>`)

  // Header
  lines.push(`<text align="center"/>`)
  t("أمل سناك", true, true, true)
  t("تذكرة المطبخ")
  lines.push(`<text align="left"/>`)
  sep("=")

  // Order number + time
  t(`طلب رقم: #${order.orderNumber}`, true, false, true)
  t(`${date}  ${time}`)
  sep()

  // Customer
  t("معلومات العميل:", true)
  t(`الاسم: ${order.customerName}`)
  if (order.customerPhone) t(`الهاتف: ${order.customerPhone}`)
  if (order.customerAddress) t(`العنوان: ${order.customerAddress}`)
  if (order.scheduledTime) t(`الموعد: ${order.scheduledTime}`, true)
  sep()

  // Items
  t("الطلبات:", true)
  for (const item of order.items) {
    const left = `${item.quantity}x ${item.name}`
    const right = `${item.price * item.quantity} ر.س`
    const pad = Math.max(1, 32 - left.length - right.length)
    t(left + " ".repeat(pad) + right)
    
    // --- THIS IS THE FIXED PART ---
    const ingredients = (item as any).selectedIngredients;
    if (ingredients?.length) {
      t(`  (${ingredients.join("، ")})`)
    }
    // ------------------------------
  }
  sep()

  // Total
  t(`الإجمالي: ${order.total} ر.س`, true, false, true)

  // Notes
  if (order.notes) {
    sep()
    t("ملاحظات:", true)
    t(order.notes)
  }

  // Footer
  sep("=")
  lines.push(`<text align="center"/>`)
  t("شكراً لطلبكم! 🌟")
  br(4)
  lines.push(`<cut type="feed"/>`)

  return `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Body>
    <epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">
      ${lines.join("\n      ")}
    </epos-print>
  </s:Body>
</s:Envelope>`
}

// ── Main print function ────────────────────────────────────────────────────

export async function printOrder(order: Order): Promise<void> {
  const ip = getPrinterIp()
  const url = `https://${ip}/cgi-bin/epos/service.cgi`
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
        `تعذر الاتصال بالطابعة (${ip})\n\n` +
        `تأكد من:\n` +
        `• الطابعة شغالة ومتصلة بالواي فاي\n` +
        `• الآيفون على نفس شبكة الواي فاي\n` +
        `• إذا الموقع HTTPS: فعّل SSL على الطابعة من تطبيق Epson TM Utility`
      )
    }
    throw new Error(`خطأ: ${msg}`)
  }

  if (!response.ok) {
    throw new Error(`رفضت الطابعة الطلب (${response.status})`)
  }

  const body = await response.text()
  if (body.includes("SchemaError") || body.includes("DeviceNotFound")) {
    throw new Error("خطأ في إعدادات الطابعة — تأكد من تفعيل ePOS على الطابعة")
  }
}