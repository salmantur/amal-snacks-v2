/**
 * Epson TM-M30II ePOS Print — Arabic via Canvas Image
 *
 * The printer's built-in font has NO Arabic support — this is a hardware limitation.
 * Solution: render the full ticket on an HTML Canvas using the device's Arabic font,
 * convert to 1-bit monochrome bitmap, send as <image> in ePOS XML.
 * Result: perfect Arabic on every printout, from iPhone Safari or laptop Chrome.
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

// TM-M30II paper = 80mm = 576 dots at 203dpi
const PAPER_WIDTH = 576

// ── Ticket content definition ─────────────────────────────────────────────

type Line = {
  text: string
  bold?: boolean
  size?: number
  align?: "center" | "right" | "left"
}

function buildLines(order: Order): Line[] {
  const d = new Date(order.createdAt)
  const day  = d.toLocaleDateString("ar-SA", { weekday: "long" })
  const date = d.toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })
  const time = d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })

  const L: Line[] = []
  const sep = () => L.push({ text: "─".repeat(32), size: 20, align: "center" })
  const gap = () => L.push({ text: "", size: 14 })

  // Header
  L.push({ text: "أمل سناك",     bold: true,  size: 44, align: "center" })
  L.push({ text: "تذكرة المطبخ", bold: false, size: 28, align: "center" })
  sep()

  // Order number — big and centred
  L.push({ text: `# ${order.orderNumber}`, bold: true, size: 40, align: "center" })
  gap()

  // Date & time
  L.push({ text: day,                    size: 26, align: "right" })
  L.push({ text: date,                   size: 26, align: "right" })
  L.push({ text: `الوقت: ${time}`,       size: 26, align: "right" })
  sep()

  // Customer
  L.push({ text: `الاسم: ${order.customerName}`, bold: true, size: 30, align: "right" })
  if (order.scheduledTime) {
    L.push({ text: `الموعد: ${order.scheduledTime}`, bold: true, size: 28, align: "right" })
  }
  sep()

  // Items — name + quantity, NO prices
  L.push({ text: "الطلبات:", bold: true, size: 28, align: "right" })
  gap()

  for (const item of order.items) {
    L.push({ text: `${item.name}   ×${item.quantity}`, bold: true, size: 30, align: "right" })
    const ing = (item as { selectedIngredients?: string[] }).selectedIngredients
    if (ing?.length) {
      L.push({ text: `    ${ing.join("  ،  ")}`, size: 24, align: "right" })
    }
    gap()
  }

  // Notes
  if (order.notes) {
    sep()
    L.push({ text: "ملاحظات:", bold: true, size: 28, align: "right" })
    L.push({ text: order.notes, size: 26, align: "right" })
  }

  sep()
  gap()

  return L
}

// ── Render lines to HTML Canvas ───────────────────────────────────────────

function renderCanvas(lines: Line[]): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")!
  const PAD = 24

  // Measure total height first
  let totalH = PAD
  const measured = lines.map(l => {
    const size = l.size ?? 28
    const lh   = size + 10
    totalH += lh
    return { ...l, size, lh }
  })
  totalH += PAD

  canvas.width  = PAPER_WIDTH
  canvas.height = totalH

  // White background
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Draw each line
  ctx.fillStyle  = "#000000"
  ctx.direction  = "rtl"
  ctx.textBaseline = "top"

  let y = PAD
  for (const l of measured) {
    ctx.font = `${l.bold ? "bold " : ""}${l.size}px Arial, sans-serif`
    const align = l.align ?? "right"
    ctx.textAlign = align === "center" ? "center" : align === "left" ? "left" : "right"
    const x = align === "center" ? PAPER_WIDTH / 2
             : align === "left"  ? PAD
             : PAPER_WIDTH - PAD
    if (l.text) ctx.fillText(l.text, x, y)
    y += l.lh
  }

  return canvas
}

// ── Canvas → 1-bit monochrome base64 (required by ePOS) ──────────────────

function canvasToMono(canvas: HTMLCanvasElement): { w: number; h: number; b64: string } {
  const ctx = canvas.getContext("2d")!
  const { data, width: w, height: h } = ctx.getImageData(0, 0, canvas.width, canvas.height)

  const rowBytes = Math.ceil(w / 8)
  const mono     = new Uint8Array(rowBytes * h)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i    = (y * w + x) * 4
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      if (gray < 128) {
        mono[y * rowBytes + Math.floor(x / 8)] |= (1 << (7 - x % 8))
      }
    }
  }

  let bin = ""
  mono.forEach(b => { bin += String.fromCharCode(b) })
  return { w, h, b64: btoa(bin) }
}

// ── Build ePOS SOAP XML ───────────────────────────────────────────────────

async function buildXml(order: Order): Promise<string> {
  const lines  = buildLines(order)
  const canvas = renderCanvas(lines)
  const { w, h, b64 } = canvasToMono(canvas)

  return `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Body>
    <epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">
      <image width="${w}" height="${h}" color="color_1" mode="mono">${b64}</image>
      <feed line="5"/>
      <cut type="feed"/>
    </epos-print>
  </s:Body>
</s:Envelope>`
}

// ── Main print function ───────────────────────────────────────────────────

export async function printOrder(order: Order): Promise<void> {
  const ip  = getPrinterIp()
  const url = `https://${ip}/cgi-bin/epos/service.cgi?devid=local_printer&timeout=10000`
  const xml = await buildXml(order)

  let response: Response
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction": '""',
      },
      body: xml,
      signal: AbortSignal.timeout(15000),
    })
  } catch (err) {
    const msg      = err instanceof Error ? err.message : String(err)
    const isTimeout = err instanceof Error &&
      (err.name === "AbortError" || err.name === "TimeoutError")

    if (isTimeout || msg.includes("fetch")) {
      throw new Error(
        `تعذر الاتصال بالطابعة (${ip})\n` +
        `• تأكد أن الطابعة شغالة\n` +
        `• الجهاز على نفس الشبكة\n` +
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