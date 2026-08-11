import type { Order } from "@/lib/data"

type PrintOrderOptions = {
  ip?: string
}

// Sends the order to /api/print-order instead of talking to the printer
// directly from the browser - the server renders the ticket and reaches the
// printer over plain HTTP, so no device ever needs to trust its self-signed
// certificate.
export async function printOrder(order: Order, options: PrintOrderOptions = {}): Promise<void> {
  const response = await fetch("/api/print-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order, ip: options.ip }),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.error || `فشل الاتصال بالطابعة (${response.status})`)
  }
}
