// Categories matching your Supabase database values
export const categories = [
  { id: "eid", label: "Ã˜Â¨Ã˜Â§Ã™â€šÃ˜Â§Ã˜Âª Ã˜Â§Ã™â€žÃ˜Â¹Ã™Å Ã˜Â¯ Ã°Å¸Å½Â", dbCategories: ["eid"] },
  { 
    id: "platters_breakfast", 
    label: "Ã˜Â¨Ã™â€žÃ˜Â§Ã˜ÂªÃ˜Â± Ã™Ë†Ã˜Â³Ã˜Â®Ã˜Â§Ã™â€ Ã˜Â§Ã˜Âª Ã˜Â§Ã™â€žÃ™ÂÃ˜Â·Ã™Ë†Ã˜Â±", 
    dbCategories: ["platters", "breakfast_heaters"],
    // Sub-sections to display separately within this category
    sections: [
      { dbCategory: "platters", label: "Ã˜Â§Ã™â€žÃ˜Â¨Ã™â€žÃ˜Â§Ã˜ÂªÃ˜Â±Ã˜Â§Ã˜Âª", cols: 2 },
      { dbCategory: "breakfast_heaters", label: "Ã˜Â³Ã˜Â®Ã˜Â§Ã™â€ Ã˜Â§Ã˜Âª Ã˜Â§Ã™â€žÃ™ÂÃ˜Â·Ã™Ë†Ã˜Â±", cols: 3 },
    ]
  },
  { id: "heaters", label: "Ã˜Â³Ã˜Â®Ã˜Â§Ã™â€ Ã˜Â§Ã˜Âª", dbCategories: ["heaters"] },
  { id: "trays", label: "Ã˜ÂµÃ™Ë†Ã˜Â§Ã™â€ Ã™Å  Ã˜ÂªÃ™â€šÃ˜Â¯Ã™Å Ã™â€¦Ã˜Â§Ã˜Âª", dbCategories: ["trays"] },
  { id: "stuffed_dates", label: "Ã˜ÂªÃ™â€¦Ã˜Â± Ã™â€¦Ã˜Â­Ã˜Â´Ã™Å ", dbCategories: ["stuffed_dates"] },
  { id: "salads", label: "Ã˜Â³Ã™â€žÃ˜Â·Ã˜Â§Ã˜Âª", dbCategories: ["salads"] },
  { id: "appetizers", label: "Ã™â€¦Ã™â€šÃ˜Â¨Ã™â€žÃ˜Â§Ã˜Âª", dbCategories: ["appetizers"] },
  { id: "sandwiches", label: "Ã˜Â³Ã˜Â§Ã™â€ Ã˜Â¯Ã™Ë†Ã˜ÂªÃ˜Â´Ã˜Â§Ã˜Âª", dbCategories: ["sandwiches"] },
  { id: "sweets", label: "Ã˜Â­Ã™â€žÃ˜Â§", dbCategories: ["sweets"] },
  { id: "bakery", label: "Ã™â€¦Ã˜Â®Ã˜Â¨Ã™Ë†Ã˜Â²Ã˜Â§Ã˜Âª", dbCategories: ["bakery"] },
  { id: "frozen", label: "Ã™â€¦Ã™ÂÃ˜Â±Ã˜Â²Ã™â€ Ã˜Â§Ã˜Âª", dbCategories: ["frozen"] },
]

// Mock orders data - Replace with Supabase realtime when connected
export interface Order {
  id: string
  orderNumber: number
  customerName: string
  customerPhone: string
  customerAddress: string
  orderType: "delivery" | "pickup"
  items: { name: string; quantity: number; price: number }[]
  total: number
  status: "pending" | "preparing" | "ready" | "delivered"
  notes: string
  scheduledTime: string | null
  createdAt: Date
}

export const mockOrders: Order[] = [
  {
    id: "1",
    orderNumber: 1001,
    customerName: "Ã˜Â£Ã˜Â­Ã™â€¦Ã˜Â¯ Ã™â€¦Ã˜Â­Ã™â€¦Ã˜Â¯",
    customerPhone: "+966501234567",
    customerAddress: "Ã˜Â§Ã™â€žÃ˜Â±Ã™Å Ã˜Â§Ã˜Â¶Ã˜Å’ Ã˜Â­Ã™Å  Ã˜Â§Ã™â€žÃ™â€ Ã˜Â®Ã™Å Ã™â€žÃ˜Å’ Ã˜Â´Ã˜Â§Ã˜Â±Ã˜Â¹ Ã˜Â§Ã™â€žÃ™â€¦Ã™â€žÃ™Æ’ Ã™ÂÃ™â€¡Ã˜Â¯",
    orderType: "delivery",
    items: [
      { name: "Ã˜ÂµÃ˜Â­Ã™â€  Ã™â€¦Ã˜Â´Ã™Æ’Ã™â€ž", quantity: 2, price: 45 },
      { name: "Ã˜Â³Ã™â€¦Ã˜Â¨Ã™Ë†Ã˜Â³Ã˜Â© Ã˜Â¯Ã˜Â¬Ã˜Â§Ã˜Â¬", quantity: 3, price: 25 },
    ],
    total: 165,
    status: "pending",
    notes: "Ã˜Â¨Ã˜Â¯Ã™Ë†Ã™â€  Ã˜Â¨Ã˜ÂµÃ™â€ž",
    scheduledTime: null,
    createdAt: new Date(Date.now() - 5 * 60000),
  },
  {
    id: "2",
    orderNumber: 1002,
    customerName: "Ã˜Â³Ã˜Â§Ã˜Â±Ã˜Â© Ã˜Â¹Ã™â€žÃ™Å ",
    customerPhone: "+966509876543",
    customerAddress: "Ã˜Â¬Ã˜Â¯Ã˜Â©Ã˜Å’ Ã˜Â­Ã™Å  Ã˜Â§Ã™â€žÃ˜Â±Ã™Ë†Ã˜Â¶Ã˜Â©",
    orderType: "pickup",
    items: [
      { name: "Ã™Æ’Ã˜Â¨Ã˜Â© Ã™â€¦Ã˜Â«Ã™â€žÃ˜Â¬Ã˜Â©", quantity: 5, price: 30 },
    ],
    total: 150,
    status: "preparing",
    notes: "",
    scheduledTime: "14:00",
    createdAt: new Date(Date.now() - 15 * 60000),
  },
]

// Generate available time slots for scheduling
export function getAvailableTimeSlots(minMinutes = 0): { date: string; slots: string[] }[] {
  const slots: { date: string; slots: string[] }[] = []
  const now = new Date()
  // Earliest bookable moment = now + minMinutes + 30min buffer
  const earliest = new Date(now.getTime() + (minMinutes + 30) * 60 * 1000)

  for (let i = 0; i < 7; i++) {
    const date = new Date(now)
    date.setDate(now.getDate() + i)

    const daySlots: string[] = []

    for (let hour = 10; hour <= 21; hour++) {
      for (const min of [0, 30]) {
        if (hour === 21 && min === 30) continue
        const slotTime = new Date(date)
        slotTime.setHours(hour, min, 0, 0)
        // Only include slot if it's after the earliest allowed time
        if (slotTime > earliest) {
          daySlots.push(`${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`)
        }
      }
    }

    const dayNames = ["Ã˜Â§Ã™â€žÃ˜Â£Ã˜Â­Ã˜Â¯", "Ã˜Â§Ã™â€žÃ˜Â¥Ã˜Â«Ã™â€ Ã™Å Ã™â€ ", "Ã˜Â§Ã™â€žÃ˜Â«Ã™â€žÃ˜Â§Ã˜Â«Ã˜Â§Ã˜Â¡", "Ã˜Â§Ã™â€žÃ˜Â£Ã˜Â±Ã˜Â¨Ã˜Â¹Ã˜Â§Ã˜Â¡", "Ã˜Â§Ã™â€žÃ˜Â®Ã™â€¦Ã™Å Ã˜Â³", "Ã˜Â§Ã™â€žÃ˜Â¬Ã™â€¦Ã˜Â¹Ã˜Â©", "Ã˜Â§Ã™â€žÃ˜Â³Ã˜Â¨Ã˜Âª"]
    const dayName = dayNames[date.getDay()]
    const dateStr = `${dayName} ${date.getDate()}/${date.getMonth() + 1}`

    if (daySlots.length > 0) {
      slots.push({ date: dateStr, slots: daySlots })
    }
  }

  return slots
}

// Delivery areas with prices
export const deliveryAreas = [
  { id: "west-dammam",  name: "غرب الدمام", price: 30 },
  { id: "east-dammam",  name: "شرق الدمام", price: 35 },
  { id: "dhahran-raka", name: "الظهران - الراكة", price: 40 },
  { id: "khobar",       name: "الخبر", price: 50 },
  { id: "aziziyah",     name: "العزيزية", price: 60 },
]

// WhatsApp message generator
export function generateWhatsAppMessage(
  items: { name: string; quantity: number; price: number; selectedIngredients?: string[] }[],
  subtotal: number,
  deliveryInfo: {
    name: string
    phone: string
    address: string
    area: string
    notes: string
    scheduledTime: string | null
  }
): string {
  const deliveryArea = deliveryAreas.find(a => a.name === deliveryInfo.area)
  const deliveryFee = deliveryArea?.price || 0
  const total = subtotal + deliveryFee

  let message = `*Ã˜Â·Ã™â€žÃ˜Â¨ Ã˜Â¬Ã˜Â¯Ã™Å Ã˜Â¯ Ã™â€¦Ã™â€  Ã˜Â£Ã™â€¦Ã™â€ž Ã˜Â³Ã™â€ Ã˜Â§Ã™Æ’*\n\n`
  message += `*Ã˜Â§Ã™â€žÃ˜Â§Ã˜Â³Ã™â€¦:* ${deliveryInfo.name}\n`
  message += `*Ã˜Â§Ã™â€žÃ™â€¡Ã˜Â§Ã˜ÂªÃ™Â:* ${deliveryInfo.phone}\n`
  message += `*Ã˜Â§Ã™â€žÃ™â€¦Ã™â€ Ã˜Â·Ã™â€šÃ˜Â©:* ${deliveryInfo.area}\n`
  message += `*Ã˜Â§Ã™â€žÃ˜Â¹Ã™â€ Ã™Ë†Ã˜Â§Ã™â€ :* ${deliveryInfo.address}\n`
  
  if (deliveryInfo.scheduledTime) {
    message += `*Ã™Ë†Ã™â€šÃ˜Âª Ã˜Â§Ã™â€žÃ˜ÂªÃ˜Â³Ã™â€žÃ™Å Ã™â€¦:* ${deliveryInfo.scheduledTime}\n`
  }
  
  message += `\n*Ã˜Â§Ã™â€žÃ˜Â·Ã™â€žÃ˜Â¨Ã˜Â§Ã˜Âª:*\n`
  items.forEach((item) => {
    message += `- ${item.name} x ${item.quantity} = ${item.price * item.quantity} SAR\n`
    if (item.selectedIngredients && item.selectedIngredients.length > 0) {
      message += `  (${item.selectedIngredients.join("Ã˜Å’ ")})\n`
    }
  })
  
  message += `\n*Ã˜Â§Ã™â€žÃ™â€¦Ã˜Â¬Ã™â€¦Ã™Ë†Ã˜Â¹ Ã˜Â§Ã™â€žÃ™ÂÃ˜Â±Ã˜Â¹Ã™Å :* ${subtotal} SAR\n`
  message += `*Ã˜Â±Ã˜Â³Ã™Ë†Ã™â€¦ Ã˜Â§Ã™â€žÃ˜ÂªÃ™Ë†Ã˜ÂµÃ™Å Ã™â€ž (${deliveryInfo.area}):* ${deliveryFee} SAR\n`
  message += `*Ã˜Â§Ã™â€žÃ˜Â¥Ã˜Â¬Ã™â€¦Ã˜Â§Ã™â€žÃ™Å :* ${total} SAR\n`
  
  if (deliveryInfo.notes) {
    message += `\n*Ã™â€¦Ã™â€žÃ˜Â§Ã˜Â­Ã˜Â¸Ã˜Â§Ã˜Âª:* ${deliveryInfo.notes}`
  }
  
  return encodeURIComponent(message)
}

// WhatsApp number for the business (Saudi format: 966 + number without leading 0)
export const WHATSAPP_NUMBER = "966500645799"

// WhatsApp message for pickup orders
export function generatePickupWhatsAppMessage(
  items: { name: string; quantity: number; price: number; selectedIngredients?: string[] }[],
  subtotal: number,
  deliveryInfo: {
    name: string
    scheduledTime: string | null
    notes: string
  }
): string {
  let message = `*Ã˜Â·Ã™â€žÃ˜Â¨ Ã˜Â§Ã˜Â³Ã˜ÂªÃ™â€žÃ˜Â§Ã™â€¦ Ã™â€¦Ã™â€  Ã˜Â§Ã™â€žÃ™â€¦Ã˜Â­Ã™â€ž - Ã˜Â£Ã™â€¦Ã™â€ž Ã˜Â³Ã™â€ Ã˜Â§Ã™Æ’*\n\n`
  message += `*Ã˜Â§Ã™â€žÃ˜Â§Ã˜Â³Ã™â€¦:* ${deliveryInfo.name}\n`

  if (deliveryInfo.scheduledTime) {
    message += `*Ã™Ë†Ã™â€šÃ˜Âª Ã˜Â§Ã™â€žÃ˜Â§Ã˜Â³Ã˜ÂªÃ™â€žÃ˜Â§Ã™â€¦:* ${deliveryInfo.scheduledTime}\n`
  }

  message += `\n*Ã˜Â§Ã™â€žÃ˜Â·Ã™â€žÃ˜Â¨Ã˜Â§Ã˜Âª:*\n`
  items.forEach((item) => {
    message += `- ${item.name} x ${item.quantity} = ${item.price * item.quantity} SAR\n`
    if (item.selectedIngredients && item.selectedIngredients.length > 0) {
      message += `  (${item.selectedIngredients.join("Ã˜Å’ ")})\n`
    }
  })

  message += `\n*Ã˜Â§Ã™â€žÃ˜Â¥Ã˜Â¬Ã™â€¦Ã˜Â§Ã™â€žÃ™Å :* ${subtotal} SAR\n`
  message += `*Ã™â€ Ã™Ë†Ã˜Â¹ Ã˜Â§Ã™â€žÃ˜Â·Ã™â€žÃ˜Â¨:* Ã˜Â§Ã˜Â³Ã˜ÂªÃ™â€žÃ˜Â§Ã™â€¦ Ã™â€¦Ã™â€  Ã˜Â§Ã™â€žÃ™â€¦Ã˜Â­Ã™â€ž Ã°Å¸ÂÂª\n`

  if (deliveryInfo.notes) {
    message += `\n*Ã™â€¦Ã™â€žÃ˜Â§Ã˜Â­Ã˜Â¸Ã˜Â§Ã˜Âª:* ${deliveryInfo.notes}`
  }

  return encodeURIComponent(message)
}

