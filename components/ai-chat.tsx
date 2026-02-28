"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Bot, Loader2 } from "lucide-react"
import { useCart } from "@/components/cart-provider"

interface Message {
  role: "user" | "assistant"
  content: string
}

const SYSTEM_PROMPT = `أنت مساعد ذكي لمتجر "أمل سناك" — متجر طعام سعودي متخصص في الوجبات المثلجة والساخنة في المنطقة الشرقية.

معلومات المتجر:
- الاسم: أمل سناك
- التوصيل متاح للمناطق: الخبر (50 ر.س)، الدمام (50 ر.س)، الظهران (50 ر.س)، القطيف (60 ر.س)، سيهات (55 ر.س)، الجبيل (80 ر.س)
- يمكن الاستلام من المحل مجاناً
- التواصل عبر واتساب: 0500645799

قواعد مهمة:
- تكلم بالعربية دائماً إذا تكلم العميل بالعربية، وبالإنجليزية إذا تكلم بالإنجليزية
- كن ودوداً وخفيفاً في ردودك
- إذا سأل عن صنف معين أخبره بالسعر والمكونات إن وجدت
- إذا أراد الطلب وجهه لاستخدام الموقع مباشرة
- لا تخترع معلومات غير موجودة
- الردود قصيرة وواضحة (3-4 جمل كحد أقصى)

المنيو الكامل:
PLATTERS: شيز بلاتر (400 ر.س) - فواكه وأجبان ومخبوزات، بلاتر الفلافل (240 ر.س)
BREAKFAST: فول (160)، فاصوليا (160)، بيض تركي (180)، شكشوكة (180)، فلافل سبيشل (180)، حمسة باذنجان (180)، حمسة حلوم بالزيتون (220)، شعيرية/بلاليط (150)
HEATERS: رز صيني مع ايدام (280)، كشري (260)، مسقعه (240)، مسقعه بالجبن (250)، كرات البطاطس (240)، فوتتشيني (240)، باستا بالدجاج (240)، مكرونة البيتزا (250)، مكرونة الباشميل (240)، لازانيا (260)، برياني (300)، جريش (200)، هريس (280)، رولات الباذنجان (240)، محشي مشكل (280)
SALADS: تبولة (140)، تبولة كينوا (150)، تبولة شمندر (140)، سلطة سيزر (140)، سلطة جرجير ورمان (120)، سلطة يونانية (140)، سلطة مكرونة (140)، سلطة البافلو (140)، فتة باذنجان (150)، سلطة كينوا (150)، سلطة كريسبي (170)، سلطة الزعتر (140)، سلطة المنجا (160)
APPETIZERS: متبل (130)، حمص (120)، فتوش (140)، ملفوف (90)، ورق عنب (90)، مسخن (95)، سبرنق رولز (3 ر.س/حبة)، كبه (3 ر.س/حبة)، سمبوسه بف (3 ر.س/حبة - لحم/دجاج/جبن)، سمبوسه شرائح (3 ر.س/حبة)
SANDWICHES: برجر لحم (100/20حبة)، دجاج طازج (100/20حبة)، مسخن (110/40حبة)، تورتلا (4 ر.س)، شاورما (4 ر.س)، مطبق مغلف (4 ر.س)، ميني ساندوتش (100/25قطعة)، كلوب ساندوتش (18 ر.س)
SWEETS: ليمون بوبز كيك (100)، ميني تارت بيكان (150)، مكعبات قرص عقيل (120)، لقيمات (120)
DATES: تمر محشي سكري (200)، تمر وتين محشي (280)، تمر محشى فاخر (390)، صينية تمور ملكي (500)، علبه سكري-عجوة-تين (140)
PASTRIES: فطاير مشكل (130/40قطعة)، 25 ميني كروسان (100)
TRAYS: صينية كبيرة (500/140قطعة)، صينية وسط (380/105قطعة)، صينية صغير (300/84قطعة)
FROZEN: سبرنق رولز مجمد (50/20حبة)، كبة برغل لحم مجمد (60/20حبة)، سمبوسة بف دجاج-لحم مجمد (60/20حبة)، سمبوسة بف خضروات-أجبان مجمد (50/25حبة)، سمبوسة لف دجاج-لحم مجمد (60/20حبة)، سمبوسة لف خضروات-بطاطس-أجبان مجمد (50/25حبة)، مسخن مجمد (50/20حبة)`

export function AIChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "أهلاً! أنا مساعد أمل سناك 👋 كيف أقدر أساعدك اليوم؟" }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { items } = useCart()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300)
  }, [open])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { role: "user", content: text }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      // Build cart context if items exist
      const cartContext = items.length > 0
        ? `\n\nسلة العميل الحالية: ${items.map(i => `${i.name} x${i.quantity}`).join(", ")}`
        : ""

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 400,
          system: SYSTEM_PROMPT + cartContext,
          messages: [...messages, userMsg].map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      const data = await response.json()
      const reply = data.content?.[0]?.text || "عذراً، حدث خطأ. حاول مرة ثانية."
      setMessages(prev => [...prev, { role: "assistant", content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "عذراً، حدث خطأ في الاتصال. حاول مرة ثانية." }])
    }
    setLoading(false)
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 left-4 z-50 w-14 h-14 rounded-full bg-foreground text-background shadow-xl flex items-center justify-center active:scale-95 transition-transform"
        style={{ display: open ? "none" : "flex" }}
      >
        <MessageCircle className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary animate-pulse" />
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-white rounded-t-3xl shadow-2xl" style={{ height: "70svh" }}>

          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-foreground flex items-center justify-center flex-shrink-0">
              <Bot className="h-5 w-5 text-background" />
            </div>
            <div className="flex-1" dir="rtl">
              <p className="font-bold text-sm">مساعد أمل سناك</p>
              <p className="text-xs text-green-500 font-medium">● متصل الآن</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ WebkitOverflowScrolling: "touch" }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-foreground flex items-center justify-center flex-shrink-0 mb-1">
                    <Bot className="h-3.5 w-3.5 text-background" />
                  </div>
                )}
                <div
                  className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-foreground text-background rounded-br-sm"
                      : "bg-gray-100 text-foreground rounded-bl-sm"
                  }`}
                  dir="auto"
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-end gap-2">
                <div className="w-7 h-7 rounded-full bg-foreground flex items-center justify-center flex-shrink-0">
                  <Bot className="h-3.5 w-3.5 text-background" />
                </div>
                <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick suggestions */}
          {messages.length === 1 && (
            <div className="px-4 pb-2 flex gap-2 overflow-x-auto flex-shrink-0" dir="rtl">
              {["ما هي الأصناف المتاحة؟", "كم رسوم التوصيل؟", "أيش تنصحني؟"].map(q => (
                <button
                  key={q}
                  onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 50) }}
                  className="flex-shrink-0 px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium active:bg-gray-200 transition-colors whitespace-nowrap"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-3 border-t border-gray-100 flex gap-2 flex-shrink-0" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="w-11 h-11 rounded-full bg-foreground text-background flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform disabled:opacity-40"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="اسألني عن أي شيء..."
              dir="auto"
              className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none"
            />
          </div>
        </div>
      )}
    </>
  )
}
