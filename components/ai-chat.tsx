"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Bot, Loader2, ShoppingBag, Plus, Star } from "lucide-react"
import Image from "next/image"
import { useMenu } from "@/hooks/use-menu"
import { useCart } from "@/components/cart-provider"
import type { MenuItem } from "@/components/cart-provider"

// ─── Types ────────────────────────────────────────────────────────────────────

interface TextMessage {
  id: string
  role: "user" | "assistant"
  type: "text"
  content: string
}
interface ItemsMessage {
  id: string
  role: "assistant"
  type: "items"
  content: string
  items: MenuItem[]
}
type Message = TextMessage | ItemsMessage

// ─── System prompt (injected with live menu) ──────────────────────────────────

function buildSystemPrompt(menuItems: MenuItem[]): string {
  const menuByCategory: Record<string, string[]> = {}
  for (const item of menuItems) {
    if (!menuByCategory[item.category]) menuByCategory[item.category] = []
    const ingStr = item.ingredients?.length ? ` [${item.ingredients.join("، ")}]` : ""
    menuByCategory[item.category].push(`${item.name}${item.nameEn ? ` (${item.nameEn})` : ""} - ${item.price} ر.س${ingStr}`)
  }
  const menuText = Object.entries(menuByCategory)
    .map(([cat, items]) => `${cat.toUpperCase()}:\n${items.map(i => `  • ${i}`).join("\n")}`)
    .join("\n\n")

  return `أنت مساعد ذكي لمتجر "أمل سناك" — متجر طعام سعودي في المنطقة الشرقية متخصص في الوجبات المثلجة والساخنة.

══ أوقات العمل ══
يومياً كل أيام الأسبوع من الساعة 8 صباحاً حتى 2 فجراً.

══ التوصيل ══
- الخبر، الدمام، الظهران: 50 ر.س
- سيهات: 55 ر.س
- القطيف: 60 ر.س
- الجبيل: 80 ر.س
- الاستلام من المحل: مجاناً

══ الطلبات المسبقة ══
- الطلبات الكبيرة مثل البوفيه، البلاترز، وطلبات الإفطار الكبيرة تحتاج حجز قبل يوم كامل على الأقل.
- الطلبات العادية تُقبل في نفس اليوم خلال أوقات العمل.
- للمناسبات والكميات الكبيرة، وجّه العميل للواتساب.

══ الشكاوى والمشاكل ══
إذا كان لدى العميل مشكلة (تأخير، صنف ناقص، جودة غير مناسبة)، قل له:
"نأسف على هذا! تواصل معنا مباشرة على واتساب وسنحل المشكلة فوراً 🙏 https://wa.me/966500645799"
لا تعد بتعويض محدد، فقط وجّه للواتساب.

══ الطلبات الخاصة ══
يمكن تخصيص الطلبات (تغيير مكونات، كميات مختلفة، بدون أصناف معينة).
للطلبات الخاصة والمناسبات قل: "تواصل معنا على واتساب وسنرتب لك كل شيء 😊 https://wa.me/966500645799"

══ التواصل ══
واتساب: https://wa.me/966500645799

══ قواعد الرد ══
- تكلم بنفس لغة العميل (عربي أو إنجليزي)
- كن ودوداً وخفيفاً، استخدم إيموجي أحياناً
- ردودك قصيرة وواضحة (3-4 جمل فقط)
- لا تخترع معلومات — إذا ما تعرف، وجّه للواتساب
- عندما يسأل عن صنف أو فئة أو يطلب توصية، أضف في نهاية ردك بالضبط:
  %%%ITEMS:[اسم1,اسم2,اسم3]%%%
  (أسماء عربية بالضبط كما في المنيو، 2-4 أصناف)
- لا تستخدم %%%ITEMS:[]%%% في ردود التحية والأسعار والتوصيل والشكاوى

══ المنيو الكامل ══
${menuText}`
}

// ─── Item Card ────────────────────────────────────────────────────────────────

function ItemCard({ item }: { item: MenuItem }) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  function handleAdd() {
    addItem(item, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="flex-shrink-0 w-36 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      <div className="relative w-full bg-gray-50" style={{ aspectRatio: "4/3" }}>
        {item.image
          ? <Image src={item.image} alt={item.name} fill className="object-cover" unoptimized />
          : <div className="absolute inset-0 flex items-center justify-center"><ShoppingBag className="h-7 w-7 text-gray-200" /></div>
        }
        {item.isFeatured && (
          <span className="absolute top-1.5 right-1.5 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
            <Star className="h-2 w-2 fill-yellow-900" />الأكثر
          </span>
        )}
      </div>
      <div className="p-2" dir="rtl">
        <p className="font-bold text-xs leading-tight line-clamp-2">{item.name}</p>
        <p className="text-xs text-primary font-bold mt-1">{item.price} ر.س</p>
        <button
          onClick={handleAdd}
          className={`mt-2 w-full py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1 ${
            added ? "bg-green-500 text-white" : "bg-foreground text-background"
          }`}
        >
          {added ? "✓ أضيف!" : <><Plus className="h-3 w-3" /> أضف للسلة</>}
        </button>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

const QUICK_QUESTIONS = ["أيش عندكم؟", "كم رسوم التوصيل؟", "وش تنصحني؟", "ما هي أوقات العمل؟"]

export function AIChat() {
  const { menuItems } = useMenu()

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { id: "init", role: "assistant", type: "text", content: "أهلاً! أنا مساعد أمل سناك 👋\nكيف أقدر أساعدك؟" }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { items: cartItems } = useCart()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300)
  }, [open])

  function parseReply(raw: string): { text: string; items: MenuItem[] } {
    const match = raw.match(/%%%ITEMS:\[([^\]]*)\]%%%/)
    let text = raw.replace(/%%%ITEMS:\[[^\]]*\]%%%/g, "").trim()
    let items: MenuItem[] = []
    if (match && match[1]) {
      const names = match[1].split(",").map(n => n.trim()).filter(Boolean)
      items = names
        .map(n => menuItems.find(m => m.name === n || m.nameEn === n))
        .filter((m): m is MenuItem => !!m)
    }
    return { text, items }
  }

  async function sendMessage(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || loading) return

    const userMsg: TextMessage = { id: `u-${Date.now()}`, role: "user", type: "text", content: msg }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      const cartContext = cartItems.length > 0
        ? `\n\nسلة العميل: ${cartItems.map(i => `${i.name} x${i.quantity}`).join("، ")}`
        : ""

      // --- FIXED MESSAGE MAP ---
      const apiMessages = [...messages, userMsg]
        .filter(m => m.id !== "init") // Ensure history starts with user
        .map(m => ({ 
          role: m.role, 
          content: m.content // Keep content for both 'text' and 'items' types
        }))

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: buildSystemPrompt(menuItems) + cartContext,
          messages: apiMessages,
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Server error")
      const raw = data.content?.[0]?.text || "عذراً، حدث خطأ. حاول مرة ثانية."
      const { text: replyText, items } = parseReply(raw)

      if (items.length > 0) {
        const itemMsg: ItemsMessage = { id: `items-${Date.now()}`, role: "assistant", type: "items", content: replyText, items }
        setMessages(prev => [...prev, itemMsg])
      } else {
        setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: "assistant", type: "text", content: replyText }])
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "خطأ غير معروف"
      setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: "assistant", type: "text", content: `عذراً، حدث خطأ: ${msg}` }])
    }
    setLoading(false)
  }

  const unread = !open && messages.length > 1

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-24 left-4 z-50 w-14 h-14 rounded-full bg-foreground text-background shadow-xl flex items-center justify-center active:scale-95 transition-transform"
        >
          <MessageCircle className="h-6 w-6" />
          {unread && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary animate-pulse" />}
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#f0f2f5]" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0">
            <button onClick={() => setOpen(false)} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:scale-95">
              <X className="h-4 w-4" />
            </button>
            <div className="flex-1 text-center">
              <p className="font-bold text-sm">مساعد أمل سناك 🤖</p>
              <p className="text-xs text-green-500">● متصل الآن</p>
            </div>
            <div className="w-9 h-9" />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-foreground flex items-center justify-center flex-shrink-0 mb-1">
                    <Bot className="h-3.5 w-3.5 text-background" />
                  </div>
                )}
                <div className={`flex flex-col gap-2 max-w-[82%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  {/* Text bubble */}
                  {msg.content && (
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                        msg.role === "user"
                          ? "bg-foreground text-background rounded-br-sm"
                          : "bg-white text-foreground rounded-bl-sm shadow-sm"
                      }`}
                      dir="auto"
                    >
                      {msg.content}
                    </div>
                  )}
                  {/* Item cards */}
                  {msg.type === "items" && msg.items.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 max-w-[85vw]" style={{ scrollbarWidth: "none" }}>
                      {msg.items.map(item => <ItemCard key={item.id} item={item} />)}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading */}
            {loading && (
              <div className="flex items-end gap-2">
                <div className="w-7 h-7 rounded-full bg-foreground flex items-center justify-center flex-shrink-0">
                  <Bot className="h-3.5 w-3.5 text-background" />
                </div>
                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick suggestions — only at start */}
          {messages.length === 1 && (
            <div className="px-3 pb-2 flex gap-2 overflow-x-auto flex-shrink-0" style={{ scrollbarWidth: "none" }}>
              {QUICK_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="flex-shrink-0 px-3 py-2 bg-white rounded-full text-xs font-medium shadow-sm active:scale-95 transition-transform whitespace-nowrap border border-gray-100"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 bg-white border-t border-gray-100 flex gap-2 flex-shrink-0">
            <button
              onClick={() => sendMessage()}
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
              className="flex-1 px-4 py-2.5 bg-[#f0f2f5] rounded-full text-sm focus:outline-none"
            />
          </div>
        </div>
      )}
    </>
  )
}