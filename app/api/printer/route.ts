import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { ip, xml } = await req.json()

    if (!ip || !xml) {
      return NextResponse.json({ error: "Missing ip or xml" }, { status: 400 })
    }

    // Validate IP format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
    if (!ipRegex.test(ip)) {
      return NextResponse.json({ error: "Invalid printer IP address" }, { status: 400 })
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

    const body = await response.text()

    if (body.includes("SchemaError")) {
      return NextResponse.json({ error: "XML schema error — check printer ePOS settings" }, { status: 500 })
    }
    if (body.includes("DeviceNotFound")) {
      return NextResponse.json({ error: "Printer device not found — check devid setting" }, { status: 500 })
    }
    if (!response.ok) {
      return NextResponse.json({ error: `Printer rejected request (HTTP ${response.status})` }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const isTimeout = msg.includes("abort") || msg.includes("timeout")
    return NextResponse.json({
      error: isTimeout
        ? "Printer timeout — check IP and WiFi connection"
        : `Cannot reach printer: ${msg}`
    }, { status: 500 })
  }
}