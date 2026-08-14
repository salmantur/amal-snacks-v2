import type { Order } from "@/lib/data"
import { buildTicketXml, sendTicketToPrinter } from "@/lib/thermal-printer"

type PrintOrderOptions = {
  ip?: string
}

// Renders the ticket and sends it straight from the browser to the
// printer's local ePOS-Print endpoint over HTTPS - no server hop, so the
// printer never needs to be reachable from the internet. Only works when
// this device is on the same network as the printer and trusts its
// certificate (one-time setup, see /admin/printer).
export async function printOrder(order: Order, options: PrintOrderOptions = {}): Promise<void> {
  if (!options.ip) throw new Error("عنوان IP للطابعة غير مضبوط")
  const xml = buildTicketXml(order)
  await sendTicketToPrinter(xml, options.ip)
}
