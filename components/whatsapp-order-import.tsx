"use client"

import { useState } from "react"
import { MessageCircle, Loader2, Check, X, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { saveOrder } from "@/lib/orders"
import { cn } from "@/lib/utils"

interface ParsedItem {
  name: string
  quantity: number
  price: number
}

interface ParsedOrder {
  customerName: string
  customerPhone: string
  customerArea: string
  orderType: "delivery" | "pickup"
  items: ParsedItem[]
  notes: string
  subtotal: number
  deliveryFee: number
  total: number
}

const EMPTY_ORDER: ParsedOrder = {
  customerName: "",
  customerPhone: "",
  customerArea: "",
  orderType: "delivery",
  items: [],
  notes: "",
  subtotal: 0,
  deliveryFee: 0,
  total: 0,
}

function parseWhatsAppMessage(text: string): ParsedOrder {
  const order: ParsedOrder = { ...EMPTY_ORDER, items: [] }

  // Name
  const nameMatch = text.match(/الاسم[:\s]+([^\n]+)/u)
  if (nameMatch) order.customerName = nameMatch[1].trim()

  // Phone
  const phoneMatch = text.match(/الهاتف[:\s]+([^\n]+)/u)
  if (phoneMatch) order.customerPhone = phoneMatch[1].trim()

  // Area
  const areaMatch = text.match(/المنطقة[:\s]+([^\n]+)/u)
  if (areaMatch) order.customerArea = areaMatch[1].trim()

  // Order type
  if (text.includes("استلام من المحل") || text.includes("استلام")) {
    order.orderType = "pickup"
  }

  // Notes
  const notesMatch = text.match(/ملاحظات[:\s]+([^\n]+)/u)
  if (notesMatch) order.notes = notesMatch[1].trim()

  // Items — look for lines like "- item x N = price"
  const itemRegex = /-\s*(.+?)\s*x\s*(\d+)\s*=\s*([\d,]+)/gu
  let m
  while ((m = itemRegex.exec(text)) !== null) {
    const name = m[1].trim()
    const quantity = parseInt(m[2])
    const price = parseInt(m[3].replace(",", "")) / quantity
    order.items.push({ name, quantity, price })
  }

  // Totals
  const subtotalMatch = text.match(/المجموع الفرعي[:\s]*([\d,]+)/u)
  if (subtotalMatch) order.subtotal = parseInt(subtotalMatch[1].replace(",", ""))

  const deliveryMatch = text.match(/رسوم التوصيل[^:]*[:\s]*([\d,]+)/u)
  if (deliveryMatch) order.deliveryFee = parseInt(deliveryMatch[1].replace(",", ""))

  const totalMatch = text.match(/الإجمالي[:\s]*([\d,]+)/u)
  if (totalMatch) order.total = parseInt(totalMatch[1].replace(",", ""))

  // Recalculate if missing
  if (order.subtotal === 0 && order.items.length > 0) {
    order.subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0)
  }
  if (order.total === 0) {
    order.total = order.subtotal + order.deliveryFee
  }

  return order
}

export function WhatsAppOrderImport({ onOrderCreated }: { onOrderCreated?: () => void }) {
  const [open, setOpen] = useState(false)
  const [rawText, setRawText] = useState("")
  const [parsed, setParsed] = useState<ParsedOrder | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleParse() {
    if (!rawText.trim()) return
    const result = parseWhatsAppMessage(rawText)
    setParsed(result)
    setSuccess(null)
    setError(null)
  }

  function updateField<K extends keyof ParsedOrder>(key: K, value: ParsedOrder[K]) {
    setParsed(p => p ? { ...p, [key]: value } : p)
  }

  function updateItem(idx: number, field: keyof ParsedItem, value: string | number) {
    setParsed(p => {
      if (!p) return p
      const items = [...p.items]
      items[idx] = { ...items[idx], [field]: typeof value === "string" && field !== "name" ? Number(value) : value }
      const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
      return { ...p, items, subtotal, total: subtotal + p.deliveryFee }
    })
  }

  function addItem() {
    setParsed(p => p ? { ...p, items: [...p.items, { name: "", quantity: 1, price: 0 }] } : p)
  }

  function removeItem(idx: number) {
    setParsed(p => {
      if (!p) return p
      const items = p.items.filter((_, i) => i !== idx)
      const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
      return { ...p, items, subtotal, total: subtotal + p.deliveryFee }
    })
  }

  async function handleSave() {
    if (!parsed) return
    if (!parsed.customerName) { setError("الاسم مطلوب"); return }
    if (parsed.items.length === 0) { setError("يجب إضافة منتج واحد على الأقل"); return }

    setSaving(true)
    setError(null)

    const result = await saveOrder({
      customerName: parsed.customerName,
      customerPhone: parsed.customerPhone,
      customerArea: parsed.customerArea,
      orderType: parsed.orderType,
      items: parsed.items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
      subtotal: parsed.subtotal,
      deliveryFee: parsed.deliveryFee,
      total: parsed.total,
      notes: parsed.notes,
      scheduledTime: null,
    })

    setSaving(false)

    if (!result) {
      setError("فشل حفظ الطلب — تحقق من الاتصال")
      return
    }

    setSuccess(result.orderNumber)
    setParsed(null)
    setRawText("")
    onOrderCreated?.()
  }

  function reset() {
    setParsed(null)
    setRawText("")
    setSuccess(null)
    setError(null)
  }

  return (
    <div className="mb-4" dir="rtl">
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-4 py-2.5 bg-green-500 text-white font-bold rounded-2xl text-sm active:scale-95 transition-transform w-full justify-between"
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          إضافة طلب من واتساب
        </div>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <div className="mt-3 bg-white rounded-3xl border border-gray-100 shadow-sm p-4 space-y-4">

          {/* Success */}
          {success && (
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-2xl">
              <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-bold text-green-800">تم إنشاء الطلب #{success} ✓</p>
                <p className="text-xs text-green-600">يمكنك طباعته من قائمة الطلبات</p>
              </div>
              <button onClick={reset} className="mr-auto text-green-600 text-xs underline">إضافة آخر</button>
            </div>
          )}

          {!parsed && !success && (
            <>
              <div>
                <label className="block text-sm font-bold mb-2 text-gray-700">الصق رسالة واتساب هنا:</label>
                <textarea
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                  placeholder={`*طلب جديد من أمل سناك*\n\nالاسم: محمد علي\nالهاتف: 0501234567\nالمنطقة: الخبر\nالعنوان: شارع الملك فهد\n\nالطلبات:\n- سمبوسة دجاج x 2 = 50 ر.س\n\nالمجموع الفرعي: 50 ر.س\nرسوم التوصيل: 50 ر.س\nالإجمالي: 100 ر.س`}
                  className="w-full h-48 px-3 py-2.5 rounded-2xl bg-[#f5f5f5] text-sm focus:outline-none resize-none text-right leading-relaxed"
                  dir="rtl"
                />
              </div>
              <button
                onClick={handleParse}
                disabled={!rawText.trim()}
                className="w-full py-3 bg-[#1e293b] text-white font-bold rounded-2xl text-sm active:scale-95 disabled:opacity-40"
              >
                تحليل الرسالة →
              </button>
            </>
          )}

          {parsed && !success && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button onClick={reset} className="text-xs text-gray-400 flex items-center gap-1">
                  <X className="h-3 w-3" /> إلغاء
                </button>
                <p className="font-bold text-[#1e293b]">مراجعة الطلب</p>
              </div>

              {/* Customer info */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">الاسم *</label>
                  <input value={parsed.customerName} onChange={e => updateField("customerName", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#f5f5f5] text-sm focus:outline-none text-right" dir="rtl" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">الهاتف</label>
                  <input value={parsed.customerPhone} onChange={e => updateField("customerPhone", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#f5f5f5] text-sm focus:outline-none text-right" dir="rtl" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">المنطقة</label>
                  <input value={parsed.customerArea} onChange={e => updateField("customerArea", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#f5f5f5] text-sm focus:outline-none text-right" dir="rtl" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">نوع الطلب</label>
                  <select value={parsed.orderType} onChange={e => updateField("orderType", e.target.value as "delivery" | "pickup")}
                    className="w-full px-3 py-2 rounded-xl bg-[#f5f5f5] text-sm focus:outline-none text-right" dir="rtl">
                    <option value="delivery">توصيل</option>
                    <option value="pickup">استلام</option>
                  </select>
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <button onClick={addItem} className="text-xs text-blue-600 flex items-center gap-1">
                    <Plus className="h-3 w-3" /> إضافة منتج
                  </button>
                  <label className="text-xs font-bold text-gray-700">المنتجات</label>
                </div>
                <div className="space-y-2">
                  {parsed.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-[#f5f5f5] rounded-xl">
                      <button onClick={() => removeItem(idx)} className="text-red-400 flex-shrink-0">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <input value={item.name} onChange={e => updateItem(idx, "name", e.target.value)}
                        placeholder="اسم المنتج" dir="rtl"
                        className="flex-1 px-2 py-1.5 rounded-lg bg-white text-sm focus:outline-none text-right min-w-0" />
                      <input type="number" value={item.quantity} onChange={e => updateItem(idx, "quantity", e.target.value)}
                        className="w-12 px-2 py-1.5 rounded-lg bg-white text-sm focus:outline-none text-center" />
                      <input type="number" value={item.price} onChange={e => updateItem(idx, "price", e.target.value)}
                        placeholder="سعر" className="w-16 px-2 py-1.5 rounded-lg bg-white text-sm focus:outline-none text-center" />
                    </div>
                  ))}
                  {parsed.items.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-2">لا توجد منتجات — أضف يدوياً</p>
                  )}
                </div>
              </div>

              {/* Totals */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">المجموع الفرعي</label>
                  <input type="number" value={parsed.subtotal} onChange={e => updateField("subtotal", Number(e.target.value))}
                    className="w-full px-2 py-2 rounded-xl bg-[#f5f5f5] text-sm focus:outline-none text-center" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">التوصيل</label>
                  <input type="number" value={parsed.deliveryFee} onChange={e => {
                    const fee = Number(e.target.value)
                    setParsed(p => p ? { ...p, deliveryFee: fee, total: p.subtotal + fee } : p)
                  }} className="w-full px-2 py-2 rounded-xl bg-[#f5f5f5] text-sm focus:outline-none text-center" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block font-bold">الإجمالي</label>
                  <div className="w-full px-2 py-2 rounded-xl bg-[#1e293b] text-white text-sm text-center font-bold">
                    {parsed.total} ر.س
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">ملاحظات</label>
                <input value={parsed.notes} onChange={e => updateField("notes", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#f5f5f5] text-sm focus:outline-none text-right" dir="rtl" />
              </div>

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3.5 bg-green-600 text-white font-bold rounded-2xl text-sm active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {saving ? "جاري الحفظ..." : "حفظ الطلب وإرساله للمطبخ"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
