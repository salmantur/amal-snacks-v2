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

// ── XML Escaping Helper ────────────────────────────────────────────────

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

  // Helper updated to use native Arabic processing
  const t = (text: string, em = false, dw = false, dh = false) => {
    const attrs = [
      'lang="ar"', // This tells the TM-m30II to handle shaping and RTL layout natively
      em && 'em="true"', 
      dw && 'dw="true"', 
      dh && 'dh="true"'
    ].filter(Boolean).join(" ")
    
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

  // Order Info
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
    const qty = `${item.quantity}x`;
    const price = `${item.price * item.quantity} SR`; 
    
    // We construct the string logically (Name -> Spaces -> Price).
    // The printer will automatically flip it visually because of lang="ar".
    const currentLine = `${qty} ${item.name}`;
    const padCount = Math.max(1, 32 - currentLine.length - price.length);
    
    lines.push(`<text lang="ar">${x(currentLine + " ".repeat(padCount) + price)}\n</text>`);
    
    const ingredients = (item as any).selectedIngredients;
    if (ingredients?.length) {
      t(`  (${ingredients.join("، ")})`)
    }
  }
  sep()

  // Total
  t(`الإجمالي: ${order.total} ر.س`, true, false, true)

  if (order.notes) {
    sep()
    t("ملاحظات:", true)
    t(order.notes)
  }

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
    throw new Error(`تعذر الاتصال بالطابعة: ${msg}`)
  }

  if (!response.ok) {
    throw new Error(`رفضت الطابعة الطلب (${response.status})`)
  }

  const body = await response.text()
  if (body.includes("SchemaError") || body.includes("DeviceNotFound")) {
    throw new Error("خطأ في إعدادات الطابعة — تأكد من تفعيل ePOS")
  }
}