/**
 * Epson Thermal Printer via Web Bluetooth (ESC/POS)
 * Supports 80mm paper width
 */

import type { Order } from "@/lib/data"

// ESC/POS commands
const ESC = 0x1b
const GS = 0x1d

const CMD = {
  INIT: [ESC, 0x40],
  ALIGN_CENTER: [ESC, 0x61, 0x01],
  ALIGN_RIGHT: [ESC, 0x61, 0x02],
  ALIGN_LEFT: [ESC, 0x61, 0x00],
  BOLD_ON: [ESC, 0x45, 0x01],
  BOLD_OFF: [ESC, 0x45, 0x00],
  DOUBLE_HEIGHT_ON: [ESC, 0x21, 0x10],
  DOUBLE_SIZE_ON: [ESC, 0x21, 0x30],
  DOUBLE_SIZE_OFF: [ESC, 0x21, 0x00],
  CUT: [GS, 0x56, 0x42, 0x00],
  LINE_FEED: [0x0a],
  FEED_3: [ESC, 0x64, 0x03],
}

// Encode Arabic + Latin text to bytes
function encodeText(text: string): Uint8Array {
  return new TextEncoder().encode(text)
}

function bytes(...args: (number[] | Uint8Array)[]): Uint8Array {
  const total = args.reduce((n, a) => n + a.length, 0)
  const result = new Uint8Array(total)
  let offset = 0
  for (const a of args) {
    result.set(a, offset)
    offset += a.length
  }
  return result
}

function cmd(...commands: number[][]): Uint8Array {
  return new Uint8Array(commands.flat())
}

function line(text: string): Uint8Array {
  return bytes(encodeText(text), new Uint8Array([0x0a]))
}

function divider(char = "-", width = 48): Uint8Array {
  return line(char.repeat(width))
}

// Build the full ESC/POS receipt for an order
export function buildReceipt(order: Order): Uint8Array {
  const createdAt = new Date(order.createdAt)
  const timeStr = createdAt.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })
  const dateStr = createdAt.toLocaleDateString("ar-SA")

  const parts: Uint8Array[] = [
    // Init printer
    cmd(CMD.INIT),

    // Header - Shop name
    cmd(CMD.ALIGN_CENTER),
    cmd(CMD.DOUBLE_SIZE_ON),
    cmd(CMD.BOLD_ON),
    line("أمل سناك"),
    cmd(CMD.DOUBLE_SIZE_OFF),
    cmd(CMD.BOLD_OFF),

    line("تذكرة المطبخ"),
    cmd(CMD.ALIGN_LEFT),
    divider("="),

    // Order number
    cmd(CMD.BOLD_ON),
    cmd(CMD.DOUBLE_HEIGHT_ON),
    line(`# طلب رقم: ${order.orderNumber}`),
    cmd(CMD.DOUBLE_SIZE_OFF),
    cmd(CMD.BOLD_OFF),

    // Date & Time
    line(`التاريخ: ${dateStr}  الوقت: ${timeStr}`),
    divider(),

    // Customer info
    cmd(CMD.BOLD_ON),
    line("معلومات العميل:"),
    cmd(CMD.BOLD_OFF),
    line(`الاسم: ${order.customerName}`),
    line(`الهاتف: ${order.customerPhone}`),
    line(`العنوان: ${order.customerAddress}`),

    // Scheduled time
    ...(order.scheduledTime
      ? [
          cmd(CMD.BOLD_ON),
          line(`موعد التسليم: ${order.scheduledTime}`),
          cmd(CMD.BOLD_OFF),
        ]
      : []),

    divider(),

    // Items
    cmd(CMD.BOLD_ON),
    line("الطلبات:"),
    cmd(CMD.BOLD_OFF),
  ]

  // Each item
  for (const item of order.items) {
    const qty = `${item.quantity}x`
    const price = `${item.price * item.quantity} ر.س`
    // Pad to align price on right (48 chars wide)
    const nameCol = `${qty} ${item.name}`
    const padding = Math.max(1, 48 - nameCol.length - price.length)
    parts.push(line(`${nameCol}${" ".repeat(padding)}${price}`))
  }

  parts.push(
    divider(),

    // Total
    cmd(CMD.BOLD_ON),
    cmd(CMD.DOUBLE_HEIGHT_ON),
    line(`الإجمالي: ${order.total} ر.س`),
    cmd(CMD.DOUBLE_SIZE_OFF),
    cmd(CMD.BOLD_OFF),
  )

  // Notes
  if (order.notes) {
    parts.push(
      divider(),
      cmd(CMD.BOLD_ON),
      line("ملاحظات:"),
      cmd(CMD.BOLD_OFF),
      line(order.notes),
    )
  }

  parts.push(
    divider("="),
    cmd(CMD.ALIGN_CENTER),
    line("شكراً لطلبكم!"),
    cmd(CMD.FEED_3),
    cmd(CMD.CUT),
  )

  // Concatenate all parts
  const totalLen = parts.reduce((n, p) => n + p.length, 0)
  const result = new Uint8Array(totalLen)
  let offset = 0
  for (const p of parts) {
    result.set(p, offset)
    offset += p.length
  }
  return result
}

// Bluetooth printer service UUIDs (Epson & generic thermal printers)
const PRINTER_SERVICE_UUIDS = [
  "000018f0-0000-1000-8000-00805f9b34fb", // Generic serial (most common)
  "00001101-0000-1000-8000-00805f9b34fb", // SPP
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2", // Epson ePOS
]

const PRINTER_CHAR_UUIDS = [
  "00002af1-0000-1000-8000-00805f9b34fb",
  "00002af0-0000-1000-8000-00805f9b34fb",
  "00002ab1-0000-1000-8000-00805f9b34fb",
]

let cachedDevice: BluetoothDevice | null = null
let cachedCharacteristic: BluetoothRemoteGATTCharacteristic | null = null

async function getCharacteristic(): Promise<BluetoothRemoteGATTCharacteristic> {
  // Try cached connection first
  if (cachedDevice?.gatt?.connected && cachedCharacteristic) {
    return cachedCharacteristic
  }

  // Request printer device
  const device = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: PRINTER_SERVICE_UUIDS,
  })

  const server = await device.gatt!.connect()
  cachedDevice = device

  // Try each service UUID
  for (const serviceUuid of PRINTER_SERVICE_UUIDS) {
    try {
      const service = await server.getPrimaryService(serviceUuid)
      const characteristics = await service.getCharacteristics()

      // Find a writable characteristic
      for (const char of characteristics) {
        if (
          char.properties.write ||
          char.properties.writeWithoutResponse
        ) {
          cachedCharacteristic = char
          return char
        }
      }
    } catch {
      // Service not found, try next
    }
  }

  throw new Error("لم يتم العثور على خاصية الطباعة في الطابعة")
}

// Send data in chunks (BLE max ~512 bytes per write)
async function writeChunked(
  characteristic: BluetoothRemoteGATTCharacteristic,
  data: Uint8Array,
  chunkSize = 200
): Promise<void> {
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize)
    if (characteristic.properties.writeWithoutResponse) {
      await characteristic.writeValueWithoutResponse(chunk)
    } else {
      await characteristic.writeValue(chunk)
    }
    // Small delay between chunks
    await new Promise((r) => setTimeout(r, 50))
  }
}

export async function printOrder(order: Order): Promise<void> {
  if (!navigator.bluetooth) {
    throw new Error("المتصفح لا يدعم Bluetooth. استخدم Chrome على Android أو الكمبيوتر.")
  }

  const characteristic = await getCharacteristic()
  const receipt = buildReceipt(order)
  await writeChunked(characteristic, receipt)
}

export function disconnectPrinter(): void {
  if (cachedDevice?.gatt?.connected) {
    cachedDevice.gatt.disconnect()
  }
  cachedDevice = null
  cachedCharacteristic = null
}
