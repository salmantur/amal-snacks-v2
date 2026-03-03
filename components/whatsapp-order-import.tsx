"use client"

import { useState } from "react"
import { MessageCircle, Loader2, Check, X, Plus, Trash2, ChevronDown, ChevronUp, Sparkles } from "lucide-react"
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

const SYSTEM_PROMPT = `أنت مساعد متخصص في استخراج بيانات الطلبات من محادثات واتساب لمطعم أمل سناكس في الدمام/الخبر/الظهران.

استخرج بيانات الطلب وأرجع JSON فقط بهذا الشكل بدون أي نص آخر:
{
  "customerName": "",
  "customerPhone": "",
  "customerArea": "",
  "orderType": "delivery" أو "pickup",
  "items": [{"name": "", "quantity": 1, "price": 0}],
  "notes": "",
  "deliveryFee": 50,
  "total": 0
}

== رسوم التوصيل ==
الخبر: 50 ريال
الدمام: 50 ريال
الظهران: 50 ريال
أي منطقة أخرى أو غير محددة: 50 ريال
استلام من المحل: 0 ريال

== قائمة أسعار أمل سناكس الكاملة ==
-- سخانات الفطور --
فول = 160 ر.س
فاصوليا = 160 ر.س
بيض تركي = 180 ر.س
شكشوكة = 180 ر.س
فلافل سبيشل / فلافل سبيشيل = 180 ر.س
حمسة باذنجان = 180 ر.س
حمسة حلوم بالزيتون / حمسة حلومي = 220 ر.س
شعيرية / بلاليط = 150 ر.س

-- سخانات --
رز صيني مع ايدام = 280 ر.س
كشري = 260 ر.س
مسقعه = 240 ر.س
مسقعه بالجبن = 250 ر.س
كرات البطاطس = 240 ر.س
فوتتشيني / فيتوتشيني = 240 ر.س
باستا بالدجاج = 240 ر.س
مكرونة البيتزا = 250 ر.س
مكرونة الباشميل = 240 ر.س
لازانيا = 260 ر.س
برياني = 300 ر.س
جريش = 200 ر.س
هريس = 280 ر.س
رولات الباذنجان = 240 ر.س
محشي مشكل = 280 ر.س

-- سلطات --
تبولة = 140 ر.س
تبولة كينوا = 150 ر.س
تبولة شمندر = 140 ر.س
سلطة سيزر = 140 ر.س
سلطة جرجير ورمان = 120 ر.س
سلطة يونانية = 140 ر.س
سلطة مكرونة = 140 ر.س
سلطة بافلو = 140 ر.س
فتة باذنجان = 150 ر.س
سلطة كينوا = 150 ر.س
سلطة كريسبي = 170 ر.س
سلطة الزعتر = 140 ر.س
سلطة المنجا = 160 ر.س

-- مقبلات --
متبل = 130 ر.س
حمص = 120 ر.س
فتوش = 140 ر.س
ملفوف = 90 ر.س (40 حبة)
ورق عنب = 90 ر.س (40 حبة)
مسخن = 95 ر.س (30 حبة)
سبرنق رولز = 3 ر.س للحبة
كبة / كبه = 3.5 ر.س للحبة
سمبوسة بف = 3 ر.س للحبة (لحم/دجاج/جبن)
سمبوسة لف / سمبوسة شرائح = 3 ر.س للحبة

-- سندويشات --
برجر لحم 20 حبة = 100 ر.س
دجاج طازج 20 حبة = 100 ر.س
مسخن 40 حبة = 110 ر.س
تورتلا / تورتيلا = 4 ر.س للحبة
شاورما ميني = 4 ر.س للحبة
مطبق مغلف = 4 ر.س للحبة
ميني ساندوتش 25 قطعة = 100 ر.س
كلوب ساندوتش = 18 ر.س

-- بلاترات --
شيز بلاتر = 400 ر.س
بلاتر الفلافل = 240 ر.س

-- صواني --
صينية كبيرة (140 قطعة) = 500 ر.س
صينية وسط (105 قطعة) = 380 ر.س
صينية صغير (84 قطعة) = 300 ر.س

-- معجنات --
فطاير مشكل 40 قطعة = 130 ر.س
ميني كروسان 25 قطعة = 100 ر.س

-- حلويات --
ليمون بوبز كيك 50 قطعة = 100 ر.س
ميني تارت بيكان 24 قطعة = 150 ر.س
مكعبات قرص عقيل = 120 ر.س
لقيمات = 120 ر.س

-- تمور --
تمر محشي سكري = 200 ر.س
تمر وتين محشي = 280 ر.س
تمر محشى فاخر = 390 ر.س
صينية تمور ملكي = 500 ر.س
علبة تمور (سكري-عجوة-تين) = 140 ر.س

-- مفرزنات --
سبرنق رولز مفرزن 20 حبة = 50 ر.س
كبة برغل لحم مفرزن 20 حبة = 60 ر.س
سمبوسة بف دجاج/لحم مفرزن 20 حبة = 60 ر.س
سمبوسة بف خضروات/جبن مفرزن 25 حبة = 50 ر.س
سمبوسة لف دجاج/لحم مفرزن 20 حبة = 60 ر.س
سمبوسة لف خضروات/بطاطس مفرزن 25 حبة = 50 ر.س
مسخن مفرزن 20 حبة = 50 ر.س

== قواعد الاستخراج ==
- الاسم: من "الاسم:" أو من ذكر الاسم في المحادثة
- الهاتف: أي رقم يبدأ بـ 05 أو 966
- المنطقة: ابحث عن اسم الحي أو المدينة (النزهة، الجامعيين، الفيصلية = الخبر/الدمام/الظهران)
- نوع الطلب: "pickup" إذا ذكر "استلام" أو "استلام من المحل" وإلا "delivery"
- الأرقام العربية: ١=1، ٢=2، ٣=3، ٤=4، ٥=5، ٦=6، ٧=7، ٨=8، ٩=9، ١٠=10، ٢٠=20، ٣٠=30، ٤٠=40
- الكلمات: عشرة=10، عشرين=20، ثلاثين=30، أربعين=40، خمسين=50
- السعر للحبة: إذا طلب "30 سمبوسة بف" = quantity:30, price:3
- إذا الرسالة منسقة بنجوم (*طلب جديد*) استخرج مباشرة منها
- الملاحظات: وقت التسليم، طلبات خاصة (مقلي، مع الصوص، حار...)
- احسب المجموع الفرعي تلقائياً من الأصناف
- أرجع JSON فقط بدون أي نص إضافي أو markdown`

export function WhatsAppOrderImport({ onOrderCreated }: { onOrderCreated?: () => void }) {
  const [open, setOpen] = useState(false)
  const [rawText, setRawText] = useState("")
  const [parsed, setParsed] = useState<ParsedOrder | null>(null)
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleParse() {
    if (!rawText.trim()) return
    setParsing(true)
    setError(null)

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: rawText }]
        })
      })

      const data = await response.json()
      const text = data.content?.[0]?.text || ""
      const clean = text.replace(/```json|```/g, "").trim()
      const result = JSON.parse(clean)

      const subtotal = result.items?.reduce((s: number, i: { price: number; quantity: number }) => s + (i.price * i.quantity), 0) || 0
      const deliveryFee = result.deliveryFee ?? 50
      const total = result.total || (subtotal + deliveryFee)

      setParsed({
        customerName: result.customerName || "",
        customerPhone: result.customerPhone || "",
        customerArea: result.customerArea || "",
        orderType: result.orderType || "delivery",
        items: result.items || [],
        notes: result.notes || "",
        subtotal,
        deliveryFee,
        total,
      })
    } catch {
      setError("فشل تحليل الرسالة — حاول مرة أخرى")
    }

    setParsing(false)
  }

  function updateField<K extends keyof ParsedOrder>(key: K, value: ParsedOrder[K]) {
    setParsed(p => p ? { ...p, [key]: value } : p)
  }

  function updateItem(idx: number, field: keyof ParsedItem, value: string | number) {
    setParsed(p => {
      if (!p) return p
      const items = [...p.items]
      items[idx] = { ...items[idx], [field]: field === "name" ? value : Number(value) }
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
    if (!result) { setError("فشل حفظ الطلب — تحقق من الاتصال"); return }
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
                <label className="block text-sm font-bold mb-1 text-gray-700">الصق رسالة واتساب:</label>
                <p className="text-xs text-gray-400 mb-2">يفهم الرسائل العادية بالعامية والمنسقة من الموقع</p>
                <textarea
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                  placeholder={"مثال عامي:\nابي ٣٠ سمبوسه بف دجاج مقلي\nاسمي نوره الساعه ٧\nالنزهه\n\nأو من الموقع:\n*طلب جديد من أمل سناك*\n*الاسم:* منى..."}
                  className="w-full h-44 px-3 py-2.5 rounded-2xl bg-[#f5f5f5] text-sm focus:outline-none resize-none text-right leading-relaxed"
                  dir="rtl"
                />
              </div>
              <button
                onClick={handleParse}
                disabled={!rawText.trim() || parsing}
                className="w-full py-3 bg-[#1e293b] text-white font-bold rounded-2xl text-sm active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {parsing
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> جاري التحليل...</>
                  : <><Sparkles className="h-4 w-4" /> تحليل بالذكاء الاصطناعي</>}
              </button>
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            </>
          )}

          {parsed && !success && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button onClick={reset} className="text-xs text-gray-400 flex items-center gap-1"><X className="h-3 w-3" /> إلغاء</button>
                <p className="font-bold text-[#1e293b]">مراجعة الطلب</p>
              </div>

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
                    <option value="delivery">توصيل 🚗</option>
                    <option value="pickup">استلام 🏪</option>
                  </select>
                </div>
              </div>

              {parsed.notes ? (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">ملاحظات</label>
                  <input value={parsed.notes} onChange={e => updateField("notes", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-yellow-50 border border-yellow-200 text-sm focus:outline-none text-right" dir="rtl" />
                </div>
              ) : null}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <button onClick={addItem} className="text-xs text-blue-600 flex items-center gap-1 active:scale-95">
                    <Plus className="h-3 w-3" /> إضافة منتج
                  </button>
                  <label className="text-xs font-bold text-gray-700">المنتجات ({parsed.items.length})</label>
                </div>
                <div className="space-y-2">
                  {parsed.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-[#f5f5f5] rounded-xl">
                      <button onClick={() => removeItem(idx)} className="text-red-400 flex-shrink-0 active:scale-95">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <input value={item.name} onChange={e => updateItem(idx, "name", e.target.value)}
                        placeholder="اسم المنتج" dir="rtl"
                        className="flex-1 px-2 py-1.5 rounded-lg bg-white text-sm focus:outline-none text-right min-w-0" />
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <input type="number" value={item.quantity} onChange={e => updateItem(idx, "quantity", e.target.value)}
                          className="w-10 px-1 py-1.5 rounded-lg bg-white text-sm focus:outline-none text-center" />
                        <span className="text-xs text-gray-400">×</span>
                        <input type="number" value={item.price} onChange={e => updateItem(idx, "price", e.target.value)}
                          placeholder="0" className="w-14 px-1 py-1.5 rounded-lg bg-white text-sm focus:outline-none text-center" />
                      </div>
                    </div>
                  ))}
                  {parsed.items.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-3 bg-[#f5f5f5] rounded-xl">لا توجد منتجات — أضف يدوياً</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">المجموع</label>
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

              {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-xl">{error}</p>}

              <button onClick={handleSave} disabled={saving}
                className="w-full py-3.5 bg-green-600 text-white font-bold rounded-2xl text-sm active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60">
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