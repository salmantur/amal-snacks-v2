/**
 * Server-side counterpart to lib/thermal-printer.ts's canvas renderer.
 * Produces the exact same bilingual bitmap ticket, but running in Node
 * (via @napi-rs/canvas) instead of the browser - so printing can happen
 * server-to-server over plain HTTP, with no TLS certificate for any
 * device to trust.
 */

import path from "path"
import { GlobalFonts, createCanvas, type Canvas, type SKRSContext2D } from "@napi-rs/canvas"
import type { Order } from "@/lib/data"
import {
  PAPER_WIDTH,
  DEFAULT_PRINT_DARKNESS,
  buildLines,
  type Line,
  type PrintMode,
  type PrintDarkness,
} from "@/lib/print-ticket"

const FONT_FAMILY = "AmalTicketFont"
let fontRegistered = false

function ensureFontRegistered(): void {
  if (fontRegistered) return
  // Reuse a font already bundled for the storefront (has both Latin + Arabic
  // glyphs) instead of shipping a separate font just for tickets.
  const fontPath = path.join(process.cwd(), "app/fonts/thmanyah-sans/thmanyahsans-Regular.woff2")
  GlobalFonts.registerFromPath(fontPath, FONT_FAMILY)
  fontRegistered = true
}

function chunkLongWord(ctx: SKRSContext2D, word: string, maxWidth: number): string[] {
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

function applyEllipsis(ctx: SKRSContext2D, line: string, maxWidth: number): string {
  const ellipsis = "..."
  if (ctx.measureText(line + ellipsis).width <= maxWidth) return line + ellipsis
  let value = line
  while (value.length > 0 && ctx.measureText(value + ellipsis).width > maxWidth) {
    value = value.slice(0, -1)
  }
  return value ? value + ellipsis : ellipsis
}

function wrapLine(ctx: SKRSContext2D, line: Line, maxWidth: number): string[] {
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
        const parts = chunkLongWord(ctx, word, maxWidth)
        wrapped.push(...parts.slice(0, -1).map((part, idx) => (idx === 0 ? part : continuation + part)))
        current = continuation + parts[parts.length - 1]
      }
    }

    if (current) wrapped.push(current)
  }

  const maxLines = line.maxLines
  if (maxLines && wrapped.length > maxLines) {
    const truncated = wrapped.slice(0, maxLines)
    truncated[maxLines - 1] = applyEllipsis(ctx, truncated[maxLines - 1], maxWidth)
    return truncated
  }

  return wrapped.length > 0 ? wrapped : [text]
}

function renderTicketCanvas(lines: Line[]): Canvas {
  ensureFontRegistered()
  const canvas = createCanvas(PAPER_WIDTH, 10)
  const ctx = canvas.getContext("2d")
  const PAD = 24

  const measured = lines.map((l) => {
    const size = l.size ?? 28
    const lh = size + 12
    const padX = l.padX ?? PAD
    const maxWidth = Math.max(120, PAPER_WIDTH - padX * 2)
    ctx.font = `${l.bold ? "bold " : ""}${size}px ${FONT_FAMILY}`
    const wrapped = wrapLine(ctx, l, maxWidth)
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
    ctx.font = `${l.bold ? "bold " : ""}${l.size}px ${FONT_FAMILY}`
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

function canvasToMono(canvas: Canvas, darkness: PrintDarkness): { w: number; h: number; b64: string } {
  const ctx = canvas.getContext("2d")
  const { data, width: w, height: h } = ctx.getImageData(0, 0, canvas.width, canvas.height)

  const rowBytes = Math.ceil(w / 8)
  const mono = new Uint8Array(rowBytes * h)
  const threshold = darkness === "light" ? 112 : darkness === "dark" ? 152 : 128

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      if (gray < threshold) mono[y * rowBytes + Math.floor(x / 8)] |= (1 << (7 - (x % 8)))
    }
  }

  return { w, h, b64: Buffer.from(mono).toString("base64") }
}

export function buildTicketXml(order: Order, mode: PrintMode, darkness: PrintDarkness = DEFAULT_PRINT_DARKNESS): string {
  const lines = buildLines(order, mode)
  const canvas = renderTicketCanvas(lines)
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

export async function sendTicketToPrinter(xml: string, ip: string): Promise<void> {
  const url = `http://${ip}/cgi-bin/epos/service.cgi?devid=local_printer&timeout=10000`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)

  let response: Response
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/xml; charset=utf-8", "SOAPAction": '""' },
      body: xml,
      signal: controller.signal,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`Cannot reach printer (${ip}): ${msg}`)
  } finally {
    clearTimeout(timer)
  }

  if (!response.ok) throw new Error(`Printer rejected request (${response.status})`)
  const body = await response.text()
  if (body.includes("SchemaError") || body.includes("DeviceNotFound")) {
    throw new Error("Make sure ePOS-Print is enabled on the printer")
  }
}
