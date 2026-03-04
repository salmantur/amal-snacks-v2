import { NextRequest, NextResponse } from "next/server"
import { createCanvas } from "canvas"

// We can't use 'canvas' npm package on Vercel easily, so use ESC/POS text XML instead
// This sends text-based ePOS XML which doesn't need image encoding

function buildTextXml(order: {
  orderNumber: number
  customerName: string
  customerPhone?: string
  customerArea?: string
  orderType?: string
  scheduledTime?: string | null
  items: { name: string; quantity: number; price: number }[]
  subtotal?: number
  deliveryFee?: number
  total?: number
  notes?: string
}): string {
  const lines: { text: string; bold?: boolean; align?: "center" | "left" | "right"; size?: number }[] = []

  const add = (text: string, bold = false, align: "center" | "left" | "right" = "left", size = 1) =>
    lines.push({ text, bold, align, size })

  const sep = () => add("--------------------------------", false, "center")

  // Header
  add("Amal Snack", true, "center", 2)
  add("Kitchen Ticket", false, "center")
  sep()

  // Order number
  add(`Order #${order.orderNumber}`, true, "center", 2)

  // Date/time
  const now = new Date()
  const dateStr = now.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
  add(`${dateStr}  ${timeStr}`, false, "left")
  sep()

  // Customer
  add(`Name: ${order.customerName}`, true)
  if (order.customerPhone) add(`Phone: ${order.customerPhone}`)
  if (order.orderType === "pickup") {
    add("Type: PICKUP", true)
  } else if (order.customerArea) {
    add(`Area: ${order.customerArea}`)
  }
  if (order.scheduledTime) add(`Time: ${order.scheduledTime}`, true)
  sep()

  // Items
  add("ITEMS:", true)
  for (const item of order.items) {
    add(`${item.quantity}x ${item.name}`, false, "left")
    add(`${(item.price * item.quantity).toFixed(0)} SAR`, false, "right")
  }
  sep()

  // Totals
  if (order.subtotal) add(`Subtotal: ${order.subtotal} SAR`, false, "right")
  if (order.deliveryFee) add(`Delivery: ${order.deliveryFee} SAR`, false, "right")
  add(`TOTAL: ${order.total || order.subtotal} SAR`, true, "right", 2)

  // Notes
  if (order.notes) {
    sep()
    add("Notes:", true)
    add(order.notes)
  }

  sep()
  add("Thank You!", false, "center")

  // Build ePOS XML with text commands
  let body = ""
  for (const line of lines) {
    const align = line.align === "center" ? "center" : line.align === "right" ? "right" : "left"
    const sz = line.size === 2 ? ' width="2" height="2"' : ' width="1" height="1"'
    const bold = line.bold ? "<bold/>" : ""
    body += `<text align="${align}"${sz}>${bold}${escapeXml(line.text)}\n</text>`
  }

  return `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Body>
    <epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">
      ${body}
      <feed line="4"/>
      <cut type="feed"/>
    </epos-print>
  </s:Body>
</s:Envelope>`
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { ip, order, xml: rawXml } = body

    if (!ip) {
      return NextResponse.json({ error: "Missing printer IP" }, { status: 400 })
    }

    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
    if (!ipRegex.test(ip)) {
      return NextResponse.json({ error: "Invalid printer IP format" }, { status: 400 })
    }

    // Build XML server-side if order data sent, otherwise use raw XML
    const xml = order ? buildTextXml(order) : rawXml
    if (!xml) {
      return NextResponse.json({ error: "Missing print data" }, { status: 400 })
    }

    const url = `http://${ip}/cgi-bin/epos/service.cgi?devid=local_printer&timeout=10000`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    let response: Response
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          "SOAPAction": '""',
        },
        body: xml,
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeout)
    }

    const responseText = await response.text()
    console.log("Printer response:", responseText.slice(0, 300))

    if (responseText.includes("SchemaError")) {
      return NextResponse.json({ error: `XML Schema error: ${responseText.slice(0, 200)}` }, { status: 500 })
    }
    if (responseText.includes("DeviceNotFound")) {
      return NextResponse.json({ error: "Printer not found — check devid setting" }, { status: 500 })
    }
    if (!response.ok) {
      return NextResponse.json({ error: `Printer HTTP error ${response.status}` }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({
      error: msg.includes("abort") ? "Printer timeout — check WiFi and IP" : `Error: ${msg}`
    }, { status: 500 })
  }
}