export interface PrinterConfig {
  ip: string
}

export const DEFAULT_PRINTER_CONFIG: PrinterConfig = {
  ip: "192.168.100.205",
}

export function normalizePrinterConfig(raw: unknown): PrinterConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_PRINTER_CONFIG
  const data = raw as Partial<PrinterConfig>
  const ip = typeof data.ip === "string" ? data.ip.trim() : ""
  return { ip: ip || DEFAULT_PRINTER_CONFIG.ip }
}
