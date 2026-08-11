/**
 * Epson TM-M30II ePOS Print — Canvas Image method
 * Ticket: English labels, item names shown in both Arabic + English
 */

import type { Order } from "@/lib/data"
import {
  PAPER_WIDTH,
  DEFAULT_PRINT_MODE,
  DEFAULT_PRINT_DARKNESS,
  buildLines,
  type Line,
  type PrintMode,
  type PrintDarkness,
} from "@/lib/print-ticket"

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

// ── Ticket preview (used by admin to show what will print) ────────────────

export function getTicketPreviewDataUrl(
  order: Order,
  mode: PrintMode = getPrintMode(),
  darkness: PrintDarkness = getPrintDarkness(),
): string {
  void darkness
  const canvas = renderCanvas(buildLines(order, mode))
  return canvas.toDataURL("image/png")
}
