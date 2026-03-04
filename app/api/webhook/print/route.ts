import { NextRequest, NextResponse } from "next/server"
import { timingSafeEqual } from "crypto"

const PRINTER_IP = process.env.PRINTER_IP || "192.168.100.205"

function escapeXml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function buildTicketXml(order: {
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
  const now = new Date()
  const dateStr = now.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })

  let body = ""

  body += `<text align="center"><bold/><hSize>2</hSize><vSize>2</vSize>Amal Snack\n</text>`
  body += `<text align="center"><bold reverse="false"/><hSize>1</hSize><vSize>1</vSize>Kitchen Ticket\n</text>`
  body += `<text align="center">--------------------------------\n</text>`
  body += `<text align="center"><bold/><hSize>2</hSize><vSize>2</vSize>ORDER #${order.orderNumber}\n</text>`
  body += `<text align="left"><bold reverse="false"/><hSize>1</hSize><vSize>1</vSize>${escapeXml(dateStr)}  ${escapeXml(timeStr)}\n</text>`
  body += `<text align="center">--------------------------------\n</text>`
  body += `<text align="left"><bold/>Name: ${escapeXml(order.customerName)}\n</text>`

  if (order.customerPhone) {
    body += `<text align="left"><bold reverse="false"/>Phone: ${escapeXml(order.customerPhone)}\n</text>`
  }
  if (order.orderType === "pickup") {
    body += `<text align="left"><bold/>*** PICKUP ***\n</text>`
  } else if (order.customerArea) {
    body += `<text align="left"><bold reverse="false"/>Delivery: ${escapeXml(order.customerArea)}\n</text>`
  }
  if (order.scheduledTime) {
    body += `<text align="left"><bold/>Due: ${escapeXml(order.scheduledTime)}\n</text>`
  }

  body += `<text align="center">--------------------------------\n</text>`
  body += `<text align="left"><bold/>ITEMS:\n</text>`

  for (const item of order.items) {
    body += `<text align="left"><bold reverse="false"/>${item.quantity}x  ${escapeXml(item.name)}\n</text>`
  }

  body += `<text align="center">--------------------------------\n</text>`
  body += `<text align="right"><bold/><hSize>2</hSize><vSize>1</vSize>TOTAL: ${order.total ?? 0} SAR\n</text>`

  if (order.notes) {
    body += `<text align="left"><bold reverse="false"/><hSize>1</hSize><vSize>1</vSize>--------------------------------\n</text>`
    body += `<text align="left"><bold/>NOTE: ${escapeXml(order.notes)}\n</text>`
  }

  body += `<text align="center"><bold reverse="false"/>--------------------------------\n</text>`
  body += `<text align="center">Thank You!\n</text>`

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

export async function POST(req: NextRequest) {
  try {
    const webhookSecret = process.env.WEBHOOK_SECRET
    if (!webhookSecret) {
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 503 })
    }

    const secret = req.headers.get("x-webhook-secret")
    const validSecret = typeof secret === "string"
      && secret.length === webhookSecret.length
      && timingSafeEqual(Buffer.from(secret), Buffer.from(webhookSecret))

    if (!validSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await req.json()
    const { type, record } = payload

    if (type !== "INSERT") {
      return NextResponse.json({ ok: true, skipped: "not an insert" })
    }

    if (!record) {
      return NextResponse.json({ error: "No record" }, { status: 400 })
    }

    const order = {
      orderNumber: record.order_number ?? record.id,
      customerName: record.customer_name ?? "â€”",
      customerPhone: record.customer_phone ?? "",
      customerArea: record.customer_area ?? "",
      orderType: record.order_type ?? "delivery",
      scheduledTime: record.scheduled_time ?? null,
      items: Array.isArray(record.items) ? record.items : [],
      subtotal: record.subtotal ?? 0,
      deliveryFee: record.delivery_fee ?? 0,
      total: record.total ?? 0,
      notes: record.notes ?? "",
    }

    const xml = buildTicketXml(order)
    const url = `http://${PRINTER_IP}/cgi-bin/epos/service.cgi?devid=local_printer&timeout=10000`

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
    } finally {
      clearTimeout(timer)
    }

    const text = await response.text()
    if (text.includes("SchemaError") || text.includes("DeviceNotFound")) {
      return NextResponse.json({ error: `Printer error: ${text.slice(0, 200)}` }, { status: 500 })
    }

    console.log(`Auto-printed order #${order.orderNumber}`)
    return NextResponse.json({ ok: true, orderNumber: order.orderNumber })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}


