import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { ip, xml } = await req.json()

    if (!ip || !xml) {
      return NextResponse.json({ error: "Missing ip or xml" }, { status: 400 })
    }

    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
    if (!ipRegex.test(ip)) {
      return NextResponse.json({ error: "Invalid printer IP" }, { status: 400 })
    }

    // Try both devid values
    const devids = ["local_printer", "local_printer1", "printer"]
    let lastError = ""

    for (const devid of devids) {
      const url = `http://${ip}/cgi-bin/epos/service.cgi?devid=${devid}&timeout=10000`
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 12000)
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
        console.log(`devid=${devid} status=${response.status} body=${body.slice(0, 200)}`)

        if (body.includes("SchemaError")) {
          lastError = `SchemaError with devid=${devid}`
          continue
        }
        if (body.includes("DeviceNotFound")) {
          lastError = `DeviceNotFound with devid=${devid}`
          continue
        }
        if (!response.ok) {
          lastError = `HTTP ${response.status} with devid=${devid}`
          continue
        }

        // Success
        return NextResponse.json({ ok: true, devid })
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e)
        continue
      }
    }

    return NextResponse.json({ error: lastError }, { status: 500 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}