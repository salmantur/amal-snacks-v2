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
  padX?: number
  maxLines?: number
  continuationPrefix?: string
}

export type PrintMode = "readable" | "compact"
export type PrintDarkness = "light" | "normal" | "dark"

const DEFAULT_PRINT_MODE: PrintMode = "readable"
const DEFAULT_PRINT_DARKNESS: PrintDarkness = "normal"

export function getPrintMode(): PrintMode {
  if (typeof window !== "undefined") {
    const value = localStorage.getItem("printer_mode")
    if (value === "compact" || value === "readable") return value
  }
  return DEFAULT_PRINT_MODE
}

export function setPrintMode(mode: PrintMode): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("printer_mode", mode)
  }
}

export function getPrintDarkness(): PrintDarkness {
  if (typeof window !== "undefined") {
    const value = localStorage.getItem("printer_darkness")
    if (value === "light" || value === "normal" || value === "dark") return value
  }
  return DEFAULT_PRINT_DARKNESS
}

export function setPrintDarkness(darkness: PrintDarkness): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("printer_darkness", darkness)
  }
}

function buildLines(order: Order, mode: PrintMode = DEFAULT_PRINT_MODE): Line[] {
  const d    = new Date(order.createdAt)
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  const day  = days[d.getDay()]
  const date = `${day}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })

  const isCompact = mode === "compact"
  const baseSize = isCompact ? -2 : 0
  const optionSize = isCompact ? 20 : 24
  const optionPadX = isCompact ? 34 : 44

  const L: Line[] = []
  const sep  = () => L.push({ text: "─".repeat(32), size: 20, align: "center", dir: "ltr" })
  const gap  = () => L.push({ text: "", size: 12 })

  // Header
  L.push({ text: "Amal Snack",      bold: true,  size: 44 + baseSize, align: "center", dir: "ltr" })
  L.push({ text: "Kitchen Ticket",  bold: false, size: 26 + baseSize, align: "center", dir: "ltr" })
  sep()

  // Order number
  L.push({ text: `Order #${order.orderNumber}`, bold: true, size: 40 + baseSize, align: "center", dir: "ltr" })
  gap()

  // Date & time
  L.push({ text: date, size: 24 + baseSize, align: "left", dir: "ltr" })
  L.push({ text: `Time: ${time}`, size: 24 + baseSize, align: "left", dir: "ltr" })
  sep()

  // Customer
  L.push({ text: `Name: ${order.customerName}`, bold: true, size: 28 + baseSize, align: "left", dir: "ltr" })
  if (order.scheduledTime) {
    L.push({ text: `Due: ${order.scheduledTime}`, bold: true, size: 28 + baseSize, align: "left", dir: "ltr" })
  }
  sep()

  // Items
  L.push({ text: "ITEMS:", bold: true, size: 28 + baseSize, align: "left", dir: "ltr" })
  gap()

  for (const item of order.items) {
    const nameEn = (item as { nameEn?: string }).nameEn
    const qty    = item.quantity

    // English name (large, bold)
    if (nameEn) {
      L.push({ text: `${qty}x  ${nameEn}`, bold: true, size: 30 + baseSize, align: "left", dir: "ltr" })
    }
    // Arabic name (smaller, right-aligned)
    L.push({
      text: nameEn ? `      ${item.name}` : `${qty}x  ${item.name}`,
      bold: !nameEn,
      size: (nameEn ? 24 : 30) + baseSize,
      align: "right",
      dir: "rtl"
    })

    // Selected options / tray items — handle bilingual "ar||en" format
    const ing = (item as { selectedIngredients?: string[] }).selectedIngredients
    if (ing?.length) {
      const enNames: string[] = []
      const arNames: string[] = []
      for (const s of ing) {
        if (s.includes("||")) {
          const [ar, en] = s.split("||")
          arNames.push(ar)
          enNames.push(en)
        } else {
          arNames.push(s)
        }
      }
      // Options: readable spacing, extra horizontal padding, and 2-line cap with ellipsis.
      if (enNames.length > 0) {
        for (const name of enNames) {
          L.push({
            text: `- ${name}`,
            size: optionSize,
            align: "left",
            dir: "ltr",
            padX: optionPadX,
            maxLines: 2,
            continuationPrefix: "  "
          })
        }
      } else {
        for (const name of arNames) {
          L.push({
            text: `- ${name}`,
            size: optionSize,
            align: "right",
            dir: "rtl",
            padX: optionPadX,
            maxLines: 2,
            continuationPrefix: "  "
          })
        }
      }
    }
    gap()
  }

  // Notes
  if (order.notes) {
    sep()
    L.push({ text: "Notes:", bold: true, size: 26 + baseSize, align: "left", dir: "ltr" })
    L.push({ text: order.notes, size: 24 + baseSize, align: "left", dir: "ltr" })
  }

  sep()
  gap()

  return L
}

// ── Canvas renderer ───────────────────────────────────────────────────────

function renderCanvas(lines: Line[]): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")!
  const PAD = 24

  const chunkLongWord = (word: string, maxWidth: number): string[] => {
    const chunks: string[] = []
    let current = ""
    for (const ch of word) {
      const candidate = current + ch
      if (ctx.measureText(candidate).width <= maxWidth || current.length === 0) {
        current = candidate
      } else {
        chunks.push(current)
        current = ch
      }
    }
    if (current) chunks.push(current)
    return chunks.length > 0 ? chunks : [word]
  }

  const applyEllipsis = (line: string, maxWidth: number): string => {
    const ellipsis = "..."
    if (ctx.measureText(line + ellipsis).width <= maxWidth) return line + ellipsis
    let value = line
    while (value.length > 0 && ctx.measureText(value + ellipsis).width > maxWidth) {
      value = value.slice(0, -1)
    }
    return value ? value + ellipsis : ellipsis
  }

  const wrapLine = (line: Line, maxWidth: number): string[] => {
    const text = line.text
    if (!text) return [""]
    const paragraphs = text.split("\n")
    const wrapped: string[] = []
    const continuation = line.continuationPrefix ?? ""

    for (const paragraph of paragraphs) {
      if (!paragraph.trim()) {
        wrapped.push("")
        continue
      }

      const words = paragraph.split(/\s+/)
      let current = ""

      for (const word of words) {
        const candidate = current ? `${current} ${word}` : word
        if (ctx.measureText(candidate).width <= maxWidth) {
          current = candidate
          continue
        }

        if (current) wrapped.push(current)

        if (ctx.measureText(word).width <= maxWidth) {
          current = continuation + word
        } else {
          const parts = chunkLongWord(word, maxWidth)
          wrapped.push(...parts.slice(0, -1).map((part, idx) => (idx === 0 ? part : continuation + part)))
          current = continuation + parts[parts.length - 1]
        }
      }

      if (current) wrapped.push(current)
    }

    const maxLines = line.maxLines
    if (maxLines && wrapped.length > maxLines) {
      const truncated = wrapped.slice(0, maxLines)
      truncated[maxLines - 1] = applyEllipsis(truncated[maxLines - 1], maxWidth)
      return truncated
    }

    return wrapped.length > 0 ? wrapped : [text]
  }

  const measured = lines.map((l) => {
    const size = l.size ?? 28
    const lh = size + 12
    const padX = l.padX ?? PAD
    const maxWidth = Math.max(120, PAPER_WIDTH - padX * 2)
    ctx.font = `${l.bold ? "bold " : ""}${size}px Arial, sans-serif`
    const wrapped = wrapLine(l, maxWidth)
    return { ...l, size, lh, wrapped, padX }
  })

  let totalH = PAD
  for (const l of measured) totalH += l.lh * l.wrapped.length
  totalH += PAD

  canvas.width = PAPER_WIDTH
  canvas.height = Math.ceil(totalH / 8) * 8 // must be multiple of 8 for TM-M30II

  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = "#000000"
  ctx.textBaseline = "top"

  let y = PAD
  for (const l of measured) {
    ctx.font = `${l.bold ? "bold " : ""}${l.size}px Arial, sans-serif`
    ctx.direction = l.dir ?? "ltr"

    const align = l.align ?? "left"
    ctx.textAlign = align === "center" ? "center" : align === "right" ? "right" : "left"
    const x = align === "center" ? PAPER_WIDTH / 2 : align === "right" ? PAPER_WIDTH - l.padX : l.padX

    for (const row of l.wrapped) {
      if (row) ctx.fillText(row, x, y)
      y += l.lh
    }
  }

  return canvas
}

function canvasToMono(canvas: HTMLCanvasElement, darkness: PrintDarkness = DEFAULT_PRINT_DARKNESS): { w: number; h: number; b64: string } {
  const ctx  = canvas.getContext("2d")!
  const { data, width: w, height: h } = ctx.getImageData(0, 0, canvas.width, canvas.height)

  const rowBytes = Math.ceil(w / 8)  // must be multiple of 8 bytes per row
  const mono     = new Uint8Array(rowBytes * h)
  const threshold = darkness === "light" ? 112 : darkness === "dark" ? 152 : 128

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i    = (y * w + x) * 4
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      if (gray < threshold) mono[y * rowBytes + Math.floor(x / 8)] |= (1 << (7 - (x % 8)))
    }
  }

  // Safe base64 encoding that works on all browsers including Safari mobile
  const chunkSize = 8192
  let b64 = ""
  for (let i = 0; i < mono.length; i += chunkSize) {
    const chunk = mono.subarray(i, i + chunkSize)
    b64 += String.fromCharCode(...chunk)
  }
  return { w, h, b64: btoa(b64) }
}

// ── Build ePOS XML ────────────────────────────────────────────────────────

async function buildXml(order: Order, mode: PrintMode, darkness: PrintDarkness): Promise<string> {
  const lines        = buildLines(order, mode)
  const canvas       = renderCanvas(lines)
  const { w, h, b64 } = canvasToMono(canvas, darkness)

  return `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Body>
    <epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">
      <image width="${w}" height="${h}" color="color_1" mode="mono" hri="false">${b64}</image>
      <feed line="5"/>
      <cut type="feed"/>
    </epos-print>
  </s:Body>
</s:Envelope>`
}

// ── Main print function ───────────────────────────────────────────────────

type PrintJobOptions = {
  mode?: PrintMode
  darkness?: PrintDarkness
}

export function getTicketPreviewDataUrl(
  order: Order,
  mode: PrintMode = getPrintMode(),
  darkness: PrintDarkness = getPrintDarkness(),
): string {
  void darkness
  const canvas = renderCanvas(buildLines(order, mode))
  return canvas.toDataURL("image/png")
}

function createTimeoutSignal(ms: number): { signal: AbortSignal; cancel: () => void } {
  // Safari on some iOS versions does not support AbortSignal.timeout().
  if (typeof AbortSignal !== "undefined" && typeof (AbortSignal as { timeout?: (n: number) => AbortSignal }).timeout === "function") {
    return { signal: (AbortSignal as { timeout: (n: number) => AbortSignal }).timeout(ms), cancel: () => {} }
  }

  const controller = new AbortController()
  const id = window.setTimeout(() => controller.abort(), ms)
  return {
    signal: controller.signal,
    cancel: () => window.clearTimeout(id),
  }
}

export async function printOrder(order: Order, options: PrintJobOptions = {}): Promise<void> {
  const ip  = getPrinterIp()
  const url = `https://${ip}/cgi-bin/epos/service.cgi?devid=local_printer&timeout=10000`
  const mode = options.mode ?? getPrintMode()
  const darkness = options.darkness ?? getPrintDarkness()
  const xml = await buildXml(order, mode, darkness)
  const { signal, cancel } = createTimeoutSignal(15000)

  let response: Response
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction": '"\"\"',
      },
      body: xml,
      signal,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const isSafariLike = typeof navigator !== "undefined" && /iPhone|iPad|iPod|Safari/i.test(navigator.userAgent)
    if (isSafariLike) {
      throw new Error(
        `Cannot reach printer (${ip}) - check WiFi.\n` +
        `On iPhone Safari, open https://${ip} once and trust the printer certificate, then try print again.\n` +
        `Technical: ${msg}`
      )
    }
    throw new Error(`Cannot reach printer (${ip}) - check WiFi: ${msg}`)
  } finally {
    cancel()
  }

  if (!response.ok) throw new Error(`Printer rejected request (${response.status})`)
  const body = await response.text()
  if (body.includes("SchemaError") || body.includes("DeviceNotFound")) {
    throw new Error("Make sure ePOS-Print is enabled on the printer")
  }
}
