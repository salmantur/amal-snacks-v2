/**
 * Epson TM-M30II ePOS Print — Canvas Image method
 * Ticket: English labels, item names shown in both Arabic + English
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

const PAPER_WIDTH = 576 // TM-M30II 80mm = 576 dots at 203dpi

// ── Ticket lines ──────────────────────────────────────────────────────────

type Line = {
  text: string
  bold?: boolean
  size?: number
  align?: "center" | "right" | "left"
  dir?: "ltr" | "rtl"
}

function buildLines(order: Order): Line[] {
  const d    = new Date(order.createdAt)
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  const day  = days[d.getDay()]
  const date = `${day}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })

  const L: Line[] = []
  const sep  = () => L.push({ text: "─".repeat(32), size: 20, align: "center", dir: "ltr" })
  const gap  = () => L.push({ text: "", size: 12 })

  // Header
  L.push({ text: "Amal Snack",      bold: true,  size: 44, align: "center", dir: "ltr" })
  L.push({ text: "Kitchen Ticket",  bold: false, size: 26, align: "center", dir: "ltr" })
  sep()

  // Order number
  L.push({ text: `Order #${order.orderNumber}`, bold: true, size: 40, align: "center", dir: "ltr" })
  gap()

  // Date & time
  L.push({ text: date, size: 24, align: "left", dir: "ltr" })
  L.push({ text: `Time: ${time}`, size: 24, align: "left", dir: "ltr" })
  sep()

  // Customer
  L.push({ text: `Name: ${order.customerName}`, bold: true, size: 28, align: "left", dir: "ltr" })
  if (order.scheduledTime) {
    L.push({ text: `Due: ${order.scheduledTime}`, bold: true, size: 28, align: "left", dir: "ltr" })
  }
  sep()

  // Items
  L.push({ text: "ITEMS:", bold: true, size: 28, align: "left", dir: "ltr" })
  gap()

  for (const item of order.items) {
    const nameEn = (item as { nameEn?: string }).nameEn
    const qty    = item.quantity

    // English name (large, bold)
    if (nameEn) {
      L.push({ text: `${qty}x  ${nameEn}`, bold: true, size: 30, align: "left", dir: "ltr" })
    }
    // Arabic name (smaller, right-aligned)
    L.push({
      text: nameEn ? `      ${item.name}` : `${qty}x  ${item.name}`,
      bold: !nameEn,
      size: nameEn ? 24 : 30,
      align: "right",
      dir: "rtl"
    })

    // Selected options
    const ing = (item as { selectedIngredients?: string[] }).selectedIngredients
    if (ing?.length) {
      L.push({ text: `    → ${ing.join(", ")}`, size: 22, align: "left", dir: "ltr" })
    }
    gap()
  }

  // Notes
  if (order.notes) {
    sep()
    L.push({ text: "Notes:", bold: true, size: 26, align: "left", dir: "ltr" })
    L.push({ text: order.notes, size: 24, align: "left", dir: "ltr" })
  }

  sep()
  gap()

  return L
}

// ── Canvas renderer ───────────────────────────────────────────────────────

function renderCanvas(lines: Line[]): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  const ctx    = canvas.getContext("2d")!
  const PAD    = 24

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

  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle    = "#000000"
  ctx.textBaseline = "top"

  let y = PAD
  for (const l of measured) {
    ctx.font      = `${l.bold ? "bold " : ""}${l.size}px Arial, sans-serif`
    ctx.direction = l.dir ?? "ltr"

    const align = l.align ?? "left"
    ctx.textAlign = align === "center" ? "center" : align === "right" ? "right" : "left"
    const x = align === "center" ? PAPER_WIDTH / 2
             : align === "right"  ? PAPER_WIDTH - PAD
             : PAD

    if (l.text) ctx.fillText(l.text, x, y)
    y += l.lh
  }

  return canvas
}

// ── Canvas → 1-bit monochrome base64 ─────────────────────────────────────

function canvasToMono(canvas: HTMLCanvasElement): { w: number; h: number; b64: string } {
  const ctx  = canvas.getContext("2d")!
  const { data, width: w, height: h } = ctx.getImageData(0, 0, canvas.width, canvas.height)

  const rowBytes = Math.ceil(w / 8)
  const mono     = new Uint8Array(rowBytes * h)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i    = (y * w + x) * 4
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      if (gray < 128) mono[y * rowBytes + Math.floor(x / 8)] |= (1 << (7 - x % 8))
    }
  }

  let bin = ""
  mono.forEach(b => { bin += String.fromCharCode(b) })
  return { w, h, b64: btoa(bin) }
}

// ── Build ePOS XML ────────────────────────────────────────────────────────

async function buildXml(order: Order): Promise<string> {
  const lines        = buildLines(order)
  const canvas       = renderCanvas(lines)
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
    const msg       = err instanceof Error ? err.message : String(err)
    const isTimeout = err instanceof Error &&
      (err.name === "AbortError" || err.name === "TimeoutError")
    if (isTimeout || msg.includes("fetch")) {
      throw new Error(
        `Cannot reach printer (${ip})\n` +
        `• Make sure printer is on\n` +
        `• Device must be on same WiFi\n` +
        `• SSL must be enabled on printer`
      )
    }
    throw new Error(`Error: ${msg}`)
  }

  if (!response.ok) {
    throw new Error(`Printer rejected request (${response.status})`)
  }

  const body = await response.text()
  if (body.includes("SchemaError") || body.includes("DeviceNotFound")) {
    throw new Error("Make sure ePOS-Print is enabled on the printer")
  }
}