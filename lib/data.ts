{ id: "eid_packages", label: "باقات العيد 🎁", dbCategories: ["eid_packages"] },
// Categories matching your Supabase database values
export const categories = [
  { id: "eid_packages", label: "باقات العيد 🎁", dbCategories: ["eid_packages"] },
  { 
    id: "platters_breakfast", 
    label: "بلاتر وسخانات الفطور", 
    dbCategories: ["platters", "breakfast_heaters"],
    // Sub-sections to display separately within this category
    sections: [
      { dbCategory: "platters", label: "البلاترات", cols: 2 },
      { dbCategory: "breakfast_heaters", label: "سخانات الفطور", cols: 3 },
    ]
  },
  { id: "heaters", label: "سخانات", dbCategories: ["heaters"] },
  { id: "trays", label: "صواني تقديمات", dbCategories: ["trays"] },
  { id: "stuffed_dates", label: "تمر محشي", dbCategories: ["stuffed_dates"] },
  { id: "salads", label: "سلطات", dbCategories: ["salads"] },
  { id: "appetizers", label: "مقبلات", dbCategories: ["appetizers"] },
  { id: "sandwiches", label: "ساندوتشات", dbCategories: ["sandwiches"] },
  { id: "sweets", label: "حلا", dbCategories: ["sweets"] },
  { id: "bakery", label: "مخبوزات", dbCategories: ["bakery"] },
  { id: "frozen", label: "مفرزنات", dbCategories: ["frozen"] },
]

// Mock orders data - Replace with Supabase realtime when connected
export interface Order {
  id: string
  orderNumber: number
  customerName: string
  customerPhone: string
  customerAddress: string
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
    customerName: "أحمد محمد",
    customerPhone: "+966501234567",
    customerAddress: "الرياض، حي النخيل، شارع الملك فهد",
    items: [
      { name: "صحن مشكل", quantity: 2, price: 45 },
      { name: "سمبوسة دجاج", quantity: 3, price: 25 },
    ],
    total: 165,
    status: "pending",
    notes: "بدون بصل",
    scheduledTime: null,
    createdAt: new Date(Date.now() - 5 * 60000),
  },
  {
    id: "2",
    orderNumber: 1002,
    customerName: "سارة علي",
    customerPhone: "+966509876543",
    customerAddress: "جدة، حي الروضة",
    items: [
      { name: "كبة مثلجة", quantity: 5, price: 30 },
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

    const dayNames = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
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
  { id: "khobar", name: "الخبر", price: 50 },
  { id: "dammam", name: "الدمام", price: 50 },
  { id: "dhahran", name: "الظهران", price: 50 },
  { id: "qatif", name: "القطيف", price: 60 },
  { id: "saihat", name: "سيهات", price: 55 },
  { id: "jubail", name: "الجبيل", price: 80 },
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

  let message = `*طلب جديد من أمل سناك*\n\n`
  message += `*الاسم:* ${deliveryInfo.name}\n`
  message += `*الهاتف:* ${deliveryInfo.phone}\n`
  message += `*المنطقة:* ${deliveryInfo.area}\n`
  message += `*العنوان:* ${deliveryInfo.address}\n`
  
  if (deliveryInfo.scheduledTime) {
    message += `*وقت التسليم:* ${deliveryInfo.scheduledTime}\n`
  }
  
  message += `\n*الطلبات:*\n`
  items.forEach((item) => {
    message += `- ${item.name} x ${item.quantity} = ${item.price * item.quantity} ر.س\n`
    if (item.selectedIngredients && item.selectedIngredients.length > 0) {
      message += `  (${item.selectedIngredients.join("، ")})\n`
    }
  })
  
  message += `\n*المجموع الفرعي:* ${subtotal} ر.س\n`
  message += `*رسوم التوصيل (${deliveryInfo.area}):* ${deliveryFee} ر.س\n`
  message += `*الإجمالي:* ${total} ر.س\n`
  
  if (deliveryInfo.notes) {
    message += `\n*ملاحظات:* ${deliveryInfo.notes}`
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
  let message = `*طلب استلام من المحل - أمل سناك*\n\n`
  message += `*الاسم:* ${deliveryInfo.name}\n`

  if (deliveryInfo.scheduledTime) {
    message += `*وقت الاستلام:* ${deliveryInfo.scheduledTime}\n`
  }

  message += `\n*الطلبات:*\n`
  items.forEach((item) => {
    message += `- ${item.name} x ${item.quantity} = ${item.price * item.quantity} ر.س\n`
    if (item.selectedIngredients && item.selectedIngredients.length > 0) {
      message += `  (${item.selectedIngredients.join("، ")})\n`
    }
  })

  message += `\n*الإجمالي:* ${subtotal} ر.س\n`
  message += `*نوع الطلب:* استلام من المحل 🏪\n`

  if (deliveryInfo.notes) {
    message += `\n*ملاحظات:* ${deliveryInfo.notes}`
  }

  return encodeURIComponent(message)
}