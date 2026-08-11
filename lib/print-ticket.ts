/**
 * Kitchen ticket content - isomorphic (no DOM, no canvas).
 * Shared by the browser renderer (lib/thermal-printer.ts) and the
 * server renderer (lib/print-ticket-server.ts) so both produce the
 * same ticket layout from the same order data.
 */

import type { Order } from "@/lib/data"

export const PAPER_WIDTH = 576 // TM-M30II 80mm = 576 dots at 203dpi

export type Line = {
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

export const DEFAULT_PRINT_MODE: PrintMode = "readable"
export const DEFAULT_PRINT_DARKNESS: PrintDarkness = "dark"

export function buildLines(order: Order, mode: PrintMode = DEFAULT_PRINT_MODE): Line[] {
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
