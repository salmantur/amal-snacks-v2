import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { ip, xml } = await req.json()

    if (!ip || !xml) {
      return NextResponse.json({ error: "Missing ip or xml" }, { status: 400 })
    }

    const url = `http://${ip}/cgi-bin/epos/service.cgi?devid=local_printer&timeout=10000`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction": '""',
      },
      body: xml,
      signal: AbortSignal.timeout(15000),
    })

    const body = await response.text()

    if (!response.ok) {
      return NextResponse.json({ error: `Printer rejected (${response.status})` }, { status: 500 })
    }

    if (body.includes("SchemaError") || body.includes("DeviceNotFound")) {
      return NextResponse.json({ error: "ePOS-Print not enabled on printer" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Cannot reach printer: ${msg}` }, { status: 500 })
  }
}
