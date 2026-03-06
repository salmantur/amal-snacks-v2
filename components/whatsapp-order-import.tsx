"use client"

import { useMemo, useState } from "react"
import { MessageCircle, Loader2, Check, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { saveOrder } from "@/lib/orders"
import { cn } from "@/lib/utils"

interface ParsedItem {
  name: string
  quantity: number
  price: number
}

interface DraftOrder {
  customerName: string
  customerPhone: string
  customerArea: string
  orderType: "delivery" | "pickup"
  items: ParsedItem[]
  notes: string
  deliveryFee: number
}

const DEFAULT_DRAFT: DraftOrder = {
  customerName: "",
  customerPhone: "",
  customerArea: "",
  orderType: "delivery",
  items: [],
  notes: "",
  deliveryFee: 50,
}

function normalizeArabicDigits(text: string): string {
  return text
    .replace(/[Ã™Â -Ã™Â©]/g, (d) => String("Ã™Â Ã™Â¡Ã™Â¢Ã™Â£Ã™Â¤Ã™Â¥Ã™Â¦Ã™Â§Ã™Â¨Ã™Â©".indexOf(d)))
    .replace(/[Ã›Â°-Ã›Â¹]/g, (d) => String("Ã›Â°Ã›Â±Ã›Â²Ã›Â³Ã›Â´Ã›ÂµÃ›Â¶Ã›Â·Ã›Â¸Ã›Â¹".indexOf(d)))
}

function parseQuickFromWhatsApp(raw: string): Partial<DraftOrder> {
  const text = normalizeArabicDigits(raw)
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  const result: Partial<DraftOrder> = { items: [] }

  const nameLine = lines.find((l) => /^(Ã˜Â§Ã™â€žÃ˜Â§Ã˜Â³Ã™â€¦|name)\s*[:Ã¯Â¼Å¡]/i.test(l))
  if (nameLine) result.customerName = nameLine.replace(/^(Ã˜Â§Ã™â€žÃ˜Â§Ã˜Â³Ã™â€¦|name)\s*[:Ã¯Â¼Å¡]\s*/i, "").trim()

  const areaLine = lines.find((l) => /^(Ã˜Â§Ã™â€žÃ™â€¦Ã™â€ Ã˜Â·Ã™â€šÃ˜Â©|Ã˜Â§Ã™â€žÃ˜Â­Ã™Å |area)\s*[:Ã¯Â¼Å¡]/i.test(l))
  if (areaLine) result.customerArea = areaLine.replace(/^(Ã˜Â§Ã™â€žÃ™â€¦Ã™â€ Ã˜Â·Ã™â€šÃ˜Â©|Ã˜Â§Ã™â€žÃ˜Â­Ã™Å |area)\s*[:Ã¯Â¼Å¡]\s*/i, "").trim()

  const phoneMatch = text.match(/(?:\+?966|0)?5\d{8}/)
  if (phoneMatch) result.customerPhone = phoneMatch[0]

  if (/Ã˜Â§Ã˜Â³Ã˜ÂªÃ™â€žÃ˜Â§Ã™â€¦|pickup/i.test(text)) {
    result.orderType = "pickup"
    result.deliveryFee = 0
  }

  // Parse item lines in formats like:
  // - Ã˜Â³Ã™â€¦Ã˜Â¨Ã™Ë†Ã˜Â³Ã˜Â© Ã™â€žÃ˜Â­Ã™â€¦ x 30 = 90
  // - 2 Ãƒâ€” Ã˜Â­Ã™â€¦Ã˜Âµ 120
  // - Ã™Æ’Ã˜Â¨Ã˜Â© 20 Ã˜Â­Ã˜Â¨Ã˜Â© 3.5
  const parsedItems: ParsedItem[] = []
  for (const line of lines) {
    if (/^(Ã˜Â§Ã™â€žÃ˜Â§Ã˜Â³Ã™â€¦|name|Ã˜Â§Ã™â€žÃ™â€¦Ã™â€ Ã˜Â·Ã™â€šÃ˜Â©|Ã˜Â§Ã™â€žÃ˜Â­Ã™Å |area|Ã˜Â§Ã™â€žÃ™â€¡Ã˜Â§Ã˜ÂªÃ™Â|phone)\s*[:Ã¯Â¼Å¡]/i.test(line)) continue

    const cleaned = line.replace(/^\*+|\*+$/g, "").replace(/^-+\s*/, "").trim()
    const qtyMatch = cleaned.match(/(?:x|Ãƒâ€”|\*)?\s*(\d+(?:\.\d+)?)\s*(?:Ã˜Â­Ã˜Â¨Ã˜Â©|Ã™â€šÃ˜Â·Ã˜Â¹Ã˜Â©|pcs?)?/i)
    const priceMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*(?:\u0631\.?\u0633|\u0631\u064A\u0627\u0644|\uFDFC)?$/i)

    if (!qtyMatch || !priceMatch) continue

    const quantity = Math.max(1, Math.round(Number(qtyMatch[1])))
    const unitOrTotal = Number(priceMatch[1])
    if (!Number.isFinite(quantity) || !Number.isFinite(unitOrTotal)) continue

    const name = cleaned
      .replace(qtyMatch[0], " ")
      .replace(priceMatch[0], " ")
      .replace(/[=:+-]/g, " ")
      .replace(/\s+/g, " ")
      .trim()

    if (!name) continue

    // If value is large, assume it is total line price and compute unit.
    const price = unitOrTotal > 25 && quantity > 1 ? Math.round((unitOrTotal / quantity) * 100) / 100 : unitOrTotal
    parsedItems.push({ name, quantity, price })
  }

  if (parsedItems.length > 0) result.items = parsedItems
  return result
}

export function WhatsAppOrderImport({ onOrderCreated }: { onOrderCreated?: () => void }) {
  const [open, setOpen] = useState(false)
  const [rawText, setRawText] = useState("")
  const [draft, setDraft] = useState<DraftOrder>(DEFAULT_DRAFT)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const subtotal = useMemo(() => draft.items.reduce((sum, i) => sum + i.quantity * i.price, 0), [draft.items])
  const total = subtotal + (draft.orderType === "pickup" ? 0 : draft.deliveryFee)

  function resetAll() {
    setRawText("")
    setDraft(DEFAULT_DRAFT)
    setSuccess(null)
    setError(null)
  }

  function fillFromText() {
    if (!rawText.trim()) return
    const parsed = parseQuickFromWhatsApp(rawText)
    setDraft((prev) => ({
      ...prev,
      ...parsed,
      deliveryFee: parsed.orderType === "pickup" ? 0 : (parsed.deliveryFee ?? prev.deliveryFee),
      items: parsed.items && parsed.items.length > 0 ? parsed.items : prev.items,
    }))
    setError(null)
  }

  function updateField<K extends keyof DraftOrder>(key: K, value: DraftOrder[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function updateItem(index: number, patch: Partial<ParsedItem>) {
    setDraft((prev) => {
      const items = [...prev.items]
      items[index] = { ...items[index], ...patch }
      return { ...prev, items }
    })
  }

  function addItem() {
    setDraft((prev) => ({
      ...prev,
      items: [...prev.items, { name: "", quantity: 1, price: 0 }],
    }))
  }

  function removeItem(index: number) {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  async function handleSave() {
    if (!draft.customerName.trim()) {
      setError("Ã˜Â§Ã™â€žÃ˜Â§Ã˜Â³Ã™â€¦ Ã™â€¦Ã˜Â·Ã™â€žÃ™Ë†Ã˜Â¨")
      return
    }
    if (draft.items.length === 0) {
      setError("Ã˜Â£Ã˜Â¶Ã™Â Ã˜ÂµÃ™â€ Ã™ÂÃ™â€¹Ã˜Â§ Ã™Ë†Ã˜Â§Ã˜Â­Ã˜Â¯Ã™â€¹Ã˜Â§ Ã˜Â¹Ã™â€žÃ™â€° Ã˜Â§Ã™â€žÃ˜Â£Ã™â€šÃ™â€ž")
      return
    }

    setSaving(true)
    setError(null)

    const result = await saveOrder({
      customerName: draft.customerName.trim(),
      customerPhone: draft.customerPhone.trim(),
      customerArea: draft.customerArea.trim(),
      orderType: draft.orderType,
      items: draft.items
        .filter((i) => i.name.trim())
        .map((i) => ({ name: i.name.trim(), quantity: Math.max(1, i.quantity), price: Math.max(0, i.price) })),
      subtotal,
      deliveryFee: draft.orderType === "pickup" ? 0 : draft.deliveryFee,
      total,
      notes: draft.notes.trim(),
      scheduledTime: null,
    })

    setSaving(false)
    if (!result) {
      setError("Ã˜ÂªÃ˜Â¹Ã˜Â°Ã˜Â± Ã˜Â­Ã™ÂÃ˜Â¸ Ã˜Â§Ã™â€žÃ˜Â·Ã™â€žÃ˜Â¨. Ã˜ÂªÃ˜Â­Ã™â€šÃ™â€š Ã™â€¦Ã™â€  Ã˜Â§Ã™â€žÃ˜Â§Ã˜ÂªÃ˜ÂµÃ˜Â§Ã™â€ž Ã˜Â«Ã™â€¦ Ã˜Â­Ã˜Â§Ã™Ë†Ã™â€ž Ã™â€¦Ã˜Â±Ã˜Â© Ã˜Â£Ã˜Â®Ã˜Â±Ã™â€°.")
      return
    }

    setSuccess(result.orderNumber)
    onOrderCreated?.()
  }

  return (
    <div className="mb-4" dir="rtl">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between rounded-2xl bg-green-600 text-white px-4 py-3 font-bold text-sm active:scale-[0.99] transition-transform"
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          Ã˜Â¥Ã˜Â¶Ã˜Â§Ã™ÂÃ˜Â© Ã˜Â·Ã™â€žÃ˜Â¨ Ã™Ë†Ã˜Â§Ã˜ÂªÃ˜Â³Ã˜Â§Ã˜Â¨ Ã™â€¦Ã˜Â¨Ã˜Â§Ã˜Â´Ã˜Â±Ã˜Â©
        </div>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open ? (
        <div className="mt-3 rounded-3xl border border-gray-200 bg-white shadow-sm p-4 space-y-4">
          {success ? (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-3 flex items-center gap-3">
              <Check className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-bold text-green-700">Ã˜ÂªÃ™â€¦ Ã˜Â¥Ã™â€ Ã˜Â´Ã˜Â§Ã˜Â¡ Ã˜Â§Ã™â€žÃ˜Â·Ã™â€žÃ˜Â¨ #{success}</p>
                <button onClick={resetAll} className="text-xs text-green-700 underline mt-1">
                  Ã˜Â¥Ã˜Â¶Ã˜Â§Ã™ÂÃ˜Â© Ã˜Â·Ã™â€žÃ˜Â¨ Ã˜Â¬Ã˜Â¯Ã™Å Ã˜Â¯
                </button>
              </div>
            </div>
          ) : null}

          {!success ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Ã˜Â§Ã™â€žÃ˜ÂµÃ™â€š Ã˜Â±Ã˜Â³Ã˜Â§Ã™â€žÃ˜Â© Ã™Ë†Ã˜Â§Ã˜ÂªÃ˜Â³Ã˜Â§Ã˜Â¨ (Ã˜Â§Ã˜Â®Ã˜ÂªÃ™Å Ã˜Â§Ã˜Â±Ã™Å )</label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Ã˜Â§Ã™â€žÃ˜ÂµÃ™â€š Ã˜Â§Ã™â€žÃ˜Â±Ã˜Â³Ã˜Â§Ã™â€žÃ˜Â© Ã™â€¡Ã™â€ Ã˜Â§Ã˜Å’ Ã˜Â«Ã™â€¦ Ã˜Â§Ã˜Â¶Ã˜ÂºÃ˜Â·: Ã˜Â§Ã˜Â³Ã˜ÂªÃ˜Â®Ã˜Â±Ã˜Â§Ã˜Â¬ Ã˜Â¨Ã™Å Ã˜Â§Ã™â€ Ã˜Â§Ã˜Âª Ã˜Â£Ã™Ë†Ã™â€žÃ™Å Ã˜Â©"
                  className="w-full h-28 rounded-2xl bg-[#f5f5f5] px-3 py-2 text-sm focus:outline-none resize-none"
                />
                <button
                  type="button"
                  onClick={fillFromText}
                  disabled={!rawText.trim()}
                  className="rounded-xl bg-[#1e293b] text-white text-sm px-4 py-2 font-semibold disabled:opacity-40"
                >
                  Ã˜Â§Ã˜Â³Ã˜ÂªÃ˜Â®Ã˜Â±Ã˜Â§Ã˜Â¬ Ã˜Â¨Ã™Å Ã˜Â§Ã™â€ Ã˜Â§Ã˜Âª Ã˜Â£Ã™Ë†Ã™â€žÃ™Å Ã˜Â©
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  value={draft.customerName}
                  onChange={(e) => updateField("customerName", e.target.value)}
                  placeholder="Ã˜Â§Ã™â€žÃ˜Â§Ã˜Â³Ã™â€¦ *"
                  className="rounded-xl bg-[#f5f5f5] px-3 py-2 text-sm focus:outline-none"
                />
                <input
                  value={draft.customerPhone}
                  onChange={(e) => updateField("customerPhone", e.target.value)}
                  placeholder="Ã˜Â±Ã™â€šÃ™â€¦ Ã˜Â§Ã™â€žÃ™â€¡Ã˜Â§Ã˜ÂªÃ™Â"
                  className="rounded-xl bg-[#f5f5f5] px-3 py-2 text-sm focus:outline-none"
                />
                <input
                  value={draft.customerArea}
                  onChange={(e) => updateField("customerArea", e.target.value)}
                  placeholder="Ã˜Â§Ã™â€žÃ™â€¦Ã™â€ Ã˜Â·Ã™â€šÃ˜Â©"
                  className="rounded-xl bg-[#f5f5f5] px-3 py-2 text-sm focus:outline-none"
                />
                <select
                  value={draft.orderType}
                  onChange={(e) => updateField("orderType", e.target.value as "delivery" | "pickup")}
                  className="rounded-xl bg-[#f5f5f5] px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="delivery">Ã˜ÂªÃ™Ë†Ã˜ÂµÃ™Å Ã™â€ž</option>
                  <option value="pickup">Ã˜Â§Ã˜Â³Ã˜ÂªÃ™â€žÃ˜Â§Ã™â€¦</option>
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-700">Ã˜Â§Ã™â€žÃ˜Â£Ã˜ÂµÃ™â€ Ã˜Â§Ã™Â</label>
                  <button onClick={addItem} className="text-xs text-blue-700 flex items-center gap-1">
                    <Plus className="h-3.5 w-3.5" />
                    Ã˜Â¥Ã˜Â¶Ã˜Â§Ã™ÂÃ˜Â© Ã˜ÂµÃ™â€ Ã™Â
                  </button>
                </div>
                <div className="space-y-2">
                  {draft.items.map((item, idx) => (
                    <div key={idx} className="rounded-xl border border-gray-200 p-2 flex items-center gap-2">
                      <button onClick={() => removeItem(idx)} className="text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <input
                        value={item.name}
                        onChange={(e) => updateItem(idx, { name: e.target.value })}
                        placeholder="Ã˜Â§Ã˜Â³Ã™â€¦ Ã˜Â§Ã™â€žÃ˜ÂµÃ™â€ Ã™Â"
                        className="flex-1 min-w-0 rounded-lg bg-[#f5f5f5] px-2 py-2 text-sm focus:outline-none"
                      />
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) || 1 })}
                        className="w-14 rounded-lg bg-[#f5f5f5] px-2 py-2 text-sm text-center focus:outline-none"
                      />
                      <input
                        type="number"
                        min={0}
                        value={item.price}
                        onChange={(e) => updateItem(idx, { price: Number(e.target.value) || 0 })}
                        className="w-20 rounded-lg bg-[#f5f5f5] px-2 py-2 text-sm text-center focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="rounded-xl bg-[#f5f5f5] p-2 text-center">
                  <p className="text-gray-500 text-xs">Ã˜Â§Ã™â€žÃ™ÂÃ˜Â±Ã˜Â¹Ã™Å </p>
                  <p className="font-bold">{subtotal} ï·¼</p>
                </div>
                <div className={cn("rounded-xl p-2 text-center", draft.orderType === "pickup" ? "bg-gray-100" : "bg-[#f5f5f5]")}>
                  <p className="text-gray-500 text-xs">Ã˜Â§Ã™â€žÃ˜ÂªÃ™Ë†Ã˜ÂµÃ™Å Ã™â€ž</p>
                  {draft.orderType === "pickup" ? (
                    <p className="font-bold">0</p>
                  ) : (
                    <input
                      type="number"
                      min={0}
                      value={draft.deliveryFee}
                      onChange={(e) => updateField("deliveryFee", Number(e.target.value) || 0)}
                      className="w-full bg-transparent text-center font-bold focus:outline-none"
                    />
                  )}
                </div>
                <div className="rounded-xl bg-[#1e293b] text-white p-2 text-center">
                  <p className="text-xs opacity-80">Ã˜Â§Ã™â€žÃ˜Â¥Ã˜Â¬Ã™â€¦Ã˜Â§Ã™â€žÃ™Å </p>
                  <p className="font-bold">{total} ï·¼</p>
                </div>
              </div>

              <textarea
                value={draft.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Ã™â€¦Ã™â€žÃ˜Â§Ã˜Â­Ã˜Â¸Ã˜Â§Ã˜Âª (Ã˜Â§Ã˜Â®Ã˜ÂªÃ™Å Ã˜Â§Ã˜Â±Ã™Å )"
                className="w-full h-20 rounded-2xl bg-[#f5f5f5] px-3 py-2 text-sm focus:outline-none resize-none"
              />

              {error ? <p className="text-sm text-red-600 rounded-xl bg-red-50 p-2">{error}</p> : null}

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-2xl bg-green-600 text-white py-3.5 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {saving ? "Ã˜Â¬Ã˜Â§Ã˜Â±Ã™Å  Ã˜Â­Ã™ÂÃ˜Â¸ Ã˜Â§Ã™â€žÃ˜Â·Ã™â€žÃ˜Â¨..." : "Ã˜Â­Ã™ÂÃ˜Â¸ Ã˜Â§Ã™â€žÃ˜Â·Ã™â€žÃ˜Â¨"}
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

