"use client"

import { useState } from "react"
import { MessageCircle, Loader2, Check, X, Plus, Trash2, ChevronDown, ChevronUp, Sparkles } from "lucide-react"
import { saveOrder } from "@/lib/orders"

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

const SYSTEM_PROMPT = `Ø£Ù†Øª Ù…Ø³Ø§Ø¹Ø¯ Ù…ØªØ®ØµØµ ÙÙŠ Ø§Ø³ØªØ®Ø±Ø§Ø¬ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø·Ù„Ø¨Ø§Øª Ù…Ù† Ù…Ø­Ø§Ø¯Ø«Ø§Øª ÙˆØ§ØªØ³Ø§Ø¨ Ù„Ù…Ø·Ø¹Ù… Ø£Ù…Ù„ Ø³Ù†Ø§ÙƒØ³ ÙÙŠ Ø§Ù„Ø¯Ù…Ø§Ù…/Ø§Ù„Ø®Ø¨Ø±/Ø§Ù„Ø¸Ù‡Ø±Ø§Ù†.

Ø§Ø³ØªØ®Ø±Ø¬ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø·Ù„Ø¨ ÙˆØ£Ø±Ø¬Ø¹ JSON ÙÙ‚Ø· Ø¨Ù‡Ø°Ø§ Ø§Ù„Ø´ÙƒÙ„ Ø¨Ø¯ÙˆÙ† Ø£ÙŠ Ù†Øµ Ø¢Ø®Ø±:
{
  "customerName": "",
  "customerPhone": "",
  "customerArea": "",
  "orderType": "delivery" Ø£Ùˆ "pickup",
  "items": [{"name": "", "quantity": 1, "price": 0}],
  "notes": "",
  "deliveryFee": 50,
  "total": 0
}

== Ø±Ø³ÙˆÙ… Ø§Ù„ØªÙˆØµÙŠÙ„ ==
Ø§Ù„Ø®Ø¨Ø±: 50 Ø±ÙŠØ§Ù„
Ø§Ù„Ø¯Ù…Ø§Ù…: 50 Ø±ÙŠØ§Ù„
Ø§Ù„Ø¸Ù‡Ø±Ø§Ù†: 50 Ø±ÙŠØ§Ù„
Ø£ÙŠ Ù…Ù†Ø·Ù‚Ø© Ø£Ø®Ø±Ù‰ Ø£Ùˆ ØºÙŠØ± Ù…Ø­Ø¯Ø¯Ø©: 50 Ø±ÙŠØ§Ù„
Ø§Ø³ØªÙ„Ø§Ù… Ù…Ù† Ø§Ù„Ù…Ø­Ù„: 0 Ø±ÙŠØ§Ù„

== Ù‚Ø§Ø¦Ù…Ø© Ø£Ø³Ø¹Ø§Ø± Ø£Ù…Ù„ Ø³Ù†Ø§ÙƒØ³ Ø§Ù„ÙƒØ§Ù…Ù„Ø© ==
-- Ø³Ø®Ø§Ù†Ø§Øª Ø§Ù„ÙØ·ÙˆØ± --
ÙÙˆÙ„ = 160 Ø±.Ø³
ÙØ§ØµÙˆÙ„ÙŠØ§ = 160 Ø±.Ø³
Ø¨ÙŠØ¶ ØªØ±ÙƒÙŠ = 180 Ø±.Ø³
Ø´ÙƒØ´ÙˆÙƒØ© = 180 Ø±.Ø³
ÙÙ„Ø§ÙÙ„ Ø³Ø¨ÙŠØ´Ù„ / ÙÙ„Ø§ÙÙ„ Ø³Ø¨ÙŠØ´ÙŠÙ„ = 180 Ø±.Ø³
Ø­Ù…Ø³Ø© Ø¨Ø§Ø°Ù†Ø¬Ø§Ù† = 180 Ø±.Ø³
Ø­Ù…Ø³Ø© Ø­Ù„ÙˆÙ… Ø¨Ø§Ù„Ø²ÙŠØªÙˆÙ† / Ø­Ù…Ø³Ø© Ø­Ù„ÙˆÙ…ÙŠ = 220 Ø±.Ø³
Ø´Ø¹ÙŠØ±ÙŠØ© / Ø¨Ù„Ø§Ù„ÙŠØ· = 150 Ø±.Ø³

-- Ø³Ø®Ø§Ù†Ø§Øª --
Ø±Ø² ØµÙŠÙ†ÙŠ Ù…Ø¹ Ø§ÙŠØ¯Ø§Ù… = 280 Ø±.Ø³
ÙƒØ´Ø±ÙŠ = 260 Ø±.Ø³
Ù…Ø³Ù‚Ø¹Ù‡ = 240 Ø±.Ø³
Ù…Ø³Ù‚Ø¹Ù‡ Ø¨Ø§Ù„Ø¬Ø¨Ù† = 250 Ø±.Ø³
ÙƒØ±Ø§Øª Ø§Ù„Ø¨Ø·Ø§Ø·Ø³ = 240 Ø±.Ø³
ÙÙˆØªØªØ´ÙŠÙ†ÙŠ / ÙÙŠØªÙˆØªØ´ÙŠÙ†ÙŠ = 240 Ø±.Ø³
Ø¨Ø§Ø³ØªØ§ Ø¨Ø§Ù„Ø¯Ø¬Ø§Ø¬ = 240 Ø±.Ø³
Ù…ÙƒØ±ÙˆÙ†Ø© Ø§Ù„Ø¨ÙŠØªØ²Ø§ = 250 Ø±.Ø³
Ù…ÙƒØ±ÙˆÙ†Ø© Ø§Ù„Ø¨Ø§Ø´Ù…ÙŠÙ„ = 240 Ø±.Ø³
Ù„Ø§Ø²Ø§Ù†ÙŠØ§ = 260 Ø±.Ø³
Ø¨Ø±ÙŠØ§Ù†ÙŠ = 300 Ø±.Ø³
Ø¬Ø±ÙŠØ´ = 200 Ø±.Ø³
Ù‡Ø±ÙŠØ³ = 280 Ø±.Ø³
Ø±ÙˆÙ„Ø§Øª Ø§Ù„Ø¨Ø§Ø°Ù†Ø¬Ø§Ù† = 240 Ø±.Ø³
Ù…Ø­Ø´ÙŠ Ù…Ø´ÙƒÙ„ = 280 Ø±.Ø³

-- Ø³Ù„Ø·Ø§Øª --
ØªØ¨ÙˆÙ„Ø© = 140 Ø±.Ø³
ØªØ¨ÙˆÙ„Ø© ÙƒÙŠÙ†ÙˆØ§ = 150 Ø±.Ø³
ØªØ¨ÙˆÙ„Ø© Ø´Ù…Ù†Ø¯Ø± = 140 Ø±.Ø³
Ø³Ù„Ø·Ø© Ø³ÙŠØ²Ø± = 140 Ø±.Ø³
Ø³Ù„Ø·Ø© Ø¬Ø±Ø¬ÙŠØ± ÙˆØ±Ù…Ø§Ù† = 120 Ø±.Ø³
Ø³Ù„Ø·Ø© ÙŠÙˆÙ†Ø§Ù†ÙŠØ© = 140 Ø±.Ø³
Ø³Ù„Ø·Ø© Ù…ÙƒØ±ÙˆÙ†Ø© = 140 Ø±.Ø³
Ø³Ù„Ø·Ø© Ø¨Ø§ÙÙ„Ùˆ = 140 Ø±.Ø³
ÙØªØ© Ø¨Ø§Ø°Ù†Ø¬Ø§Ù† = 150 Ø±.Ø³
Ø³Ù„Ø·Ø© ÙƒÙŠÙ†ÙˆØ§ = 150 Ø±.Ø³
Ø³Ù„Ø·Ø© ÙƒØ±ÙŠØ³Ø¨ÙŠ = 170 Ø±.Ø³
Ø³Ù„Ø·Ø© Ø§Ù„Ø²Ø¹ØªØ± = 140 Ø±.Ø³
Ø³Ù„Ø·Ø© Ø§Ù„Ù…Ù†Ø¬Ø§ = 160 Ø±.Ø³

-- Ù…Ù‚Ø¨Ù„Ø§Øª --
Ù…ØªØ¨Ù„ = 130 Ø±.Ø³
Ø­Ù…Øµ = 120 Ø±.Ø³
ÙØªÙˆØ´ = 140 Ø±.Ø³
Ù…Ù„ÙÙˆÙ = 90 Ø±.Ø³ (40 Ø­Ø¨Ø©)
ÙˆØ±Ù‚ Ø¹Ù†Ø¨ = 90 Ø±.Ø³ (40 Ø­Ø¨Ø©)
Ù…Ø³Ø®Ù† = 95 Ø±.Ø³ (30 Ø­Ø¨Ø©)
Ø³Ø¨Ø±Ù†Ù‚ Ø±ÙˆÙ„Ø² = 3 Ø±.Ø³ Ù„Ù„Ø­Ø¨Ø©
ÙƒØ¨Ø© / ÙƒØ¨Ù‡ = 3.5 Ø±.Ø³ Ù„Ù„Ø­Ø¨Ø©
Ø³Ù…Ø¨ÙˆØ³Ø© Ø¨Ù = 3 Ø±.Ø³ Ù„Ù„Ø­Ø¨Ø© (Ù„Ø­Ù…/Ø¯Ø¬Ø§Ø¬/Ø¬Ø¨Ù†)
Ø³Ù…Ø¨ÙˆØ³Ø© Ù„Ù / Ø³Ù…Ø¨ÙˆØ³Ø© Ø´Ø±Ø§Ø¦Ø­ = 3 Ø±.Ø³ Ù„Ù„Ø­Ø¨Ø©

-- Ø³Ù†Ø¯ÙˆÙŠØ´Ø§Øª --
Ø¨Ø±Ø¬Ø± Ù„Ø­Ù… 20 Ø­Ø¨Ø© = 100 Ø±.Ø³
Ø¯Ø¬Ø§Ø¬ Ø·Ø§Ø²Ø¬ 20 Ø­Ø¨Ø© = 100 Ø±.Ø³
Ù…Ø³Ø®Ù† 40 Ø­Ø¨Ø© = 110 Ø±.Ø³
ØªÙˆØ±ØªÙ„Ø§ / ØªÙˆØ±ØªÙŠÙ„Ø§ = 4 Ø±.Ø³ Ù„Ù„Ø­Ø¨Ø©
Ø´Ø§ÙˆØ±Ù…Ø§ Ù…ÙŠÙ†ÙŠ = 4 Ø±.Ø³ Ù„Ù„Ø­Ø¨Ø©
Ù…Ø·Ø¨Ù‚ Ù…ØºÙ„Ù = 4 Ø±.Ø³ Ù„Ù„Ø­Ø¨Ø©
Ù…ÙŠÙ†ÙŠ Ø³Ø§Ù†Ø¯ÙˆØªØ´ 25 Ù‚Ø·Ø¹Ø© = 100 Ø±.Ø³
ÙƒÙ„ÙˆØ¨ Ø³Ø§Ù†Ø¯ÙˆØªØ´ = 18 Ø±.Ø³

-- Ø¨Ù„Ø§ØªØ±Ø§Øª --
Ø´ÙŠØ² Ø¨Ù„Ø§ØªØ± = 400 Ø±.Ø³
Ø¨Ù„Ø§ØªØ± Ø§Ù„ÙÙ„Ø§ÙÙ„ = 240 Ø±.Ø³

-- ØµÙˆØ§Ù†ÙŠ --
ØµÙŠÙ†ÙŠØ© ÙƒØ¨ÙŠØ±Ø© (140 Ù‚Ø·Ø¹Ø©) = 500 Ø±.Ø³
ØµÙŠÙ†ÙŠØ© ÙˆØ³Ø· (105 Ù‚Ø·Ø¹Ø©) = 380 Ø±.Ø³
ØµÙŠÙ†ÙŠØ© ØµØºÙŠØ± (84 Ù‚Ø·Ø¹Ø©) = 300 Ø±.Ø³

-- Ù…Ø¹Ø¬Ù†Ø§Øª --
ÙØ·Ø§ÙŠØ± Ù…Ø´ÙƒÙ„ 40 Ù‚Ø·Ø¹Ø© = 130 Ø±.Ø³
Ù…ÙŠÙ†ÙŠ ÙƒØ±ÙˆØ³Ø§Ù† 25 Ù‚Ø·Ø¹Ø© = 100 Ø±.Ø³

-- Ø­Ù„ÙˆÙŠØ§Øª --
Ù„ÙŠÙ…ÙˆÙ† Ø¨ÙˆØ¨Ø² ÙƒÙŠÙƒ 50 Ù‚Ø·Ø¹Ø© = 100 Ø±.Ø³
Ù…ÙŠÙ†ÙŠ ØªØ§Ø±Øª Ø¨ÙŠÙƒØ§Ù† 24 Ù‚Ø·Ø¹Ø© = 150 Ø±.Ø³
Ù…ÙƒØ¹Ø¨Ø§Øª Ù‚Ø±Øµ Ø¹Ù‚ÙŠÙ„ = 120 Ø±.Ø³
Ù„Ù‚ÙŠÙ…Ø§Øª = 120 Ø±.Ø³

-- ØªÙ…ÙˆØ± --
ØªÙ…Ø± Ù…Ø­Ø´ÙŠ Ø³ÙƒØ±ÙŠ = 200 Ø±.Ø³
ØªÙ…Ø± ÙˆØªÙŠÙ† Ù…Ø­Ø´ÙŠ = 280 Ø±.Ø³
ØªÙ…Ø± Ù…Ø­Ø´Ù‰ ÙØ§Ø®Ø± = 390 Ø±.Ø³
ØµÙŠÙ†ÙŠØ© ØªÙ…ÙˆØ± Ù…Ù„ÙƒÙŠ = 500 Ø±.Ø³
Ø¹Ù„Ø¨Ø© ØªÙ…ÙˆØ± (Ø³ÙƒØ±ÙŠ-Ø¹Ø¬ÙˆØ©-ØªÙŠÙ†) = 140 Ø±.Ø³

-- Ù…ÙØ±Ø²Ù†Ø§Øª --
Ø³Ø¨Ø±Ù†Ù‚ Ø±ÙˆÙ„Ø² Ù…ÙØ±Ø²Ù† 20 Ø­Ø¨Ø© = 50 Ø±.Ø³
ÙƒØ¨Ø© Ø¨Ø±ØºÙ„ Ù„Ø­Ù… Ù…ÙØ±Ø²Ù† 20 Ø­Ø¨Ø© = 60 Ø±.Ø³
Ø³Ù…Ø¨ÙˆØ³Ø© Ø¨Ù Ø¯Ø¬Ø§Ø¬/Ù„Ø­Ù… Ù…ÙØ±Ø²Ù† 20 Ø­Ø¨Ø© = 60 Ø±.Ø³
Ø³Ù…Ø¨ÙˆØ³Ø© Ø¨Ù Ø®Ø¶Ø±ÙˆØ§Øª/Ø¬Ø¨Ù† Ù…ÙØ±Ø²Ù† 25 Ø­Ø¨Ø© = 50 Ø±.Ø³
Ø³Ù…Ø¨ÙˆØ³Ø© Ù„Ù Ø¯Ø¬Ø§Ø¬/Ù„Ø­Ù… Ù…ÙØ±Ø²Ù† 20 Ø­Ø¨Ø© = 60 Ø±.Ø³
Ø³Ù…Ø¨ÙˆØ³Ø© Ù„Ù Ø®Ø¶Ø±ÙˆØ§Øª/Ø¨Ø·Ø§Ø·Ø³ Ù…ÙØ±Ø²Ù† 25 Ø­Ø¨Ø© = 50 Ø±.Ø³
Ù…Ø³Ø®Ù† Ù…ÙØ±Ø²Ù† 20 Ø­Ø¨Ø© = 50 Ø±.Ø³

== Ù‚ÙˆØ§Ø¹Ø¯ Ø§Ù„Ø§Ø³ØªØ®Ø±Ø§Ø¬ ==
- Ø§Ù„Ø§Ø³Ù…: Ù…Ù† "Ø§Ù„Ø§Ø³Ù…:" Ø£Ùˆ Ù…Ù† Ø°ÙƒØ± Ø§Ù„Ø§Ø³Ù… ÙÙŠ Ø§Ù„Ù…Ø­Ø§Ø¯Ø«Ø©
- Ø§Ù„Ù‡Ø§ØªÙ: Ø£ÙŠ Ø±Ù‚Ù… ÙŠØ¨Ø¯Ø£ Ø¨Ù€ 05 Ø£Ùˆ 966
- Ø§Ù„Ù…Ù†Ø·Ù‚Ø©: Ø§Ø¨Ø­Ø« Ø¹Ù† Ø§Ø³Ù… Ø§Ù„Ø­ÙŠ Ø£Ùˆ Ø§Ù„Ù…Ø¯ÙŠÙ†Ø© (Ø§Ù„Ù†Ø²Ù‡Ø©ØŒ Ø§Ù„Ø¬Ø§Ù…Ø¹ÙŠÙŠÙ†ØŒ Ø§Ù„ÙÙŠØµÙ„ÙŠØ© = Ø§Ù„Ø®Ø¨Ø±/Ø§Ù„Ø¯Ù…Ø§Ù…/Ø§Ù„Ø¸Ù‡Ø±Ø§Ù†)
- Ù†ÙˆØ¹ Ø§Ù„Ø·Ù„Ø¨: "pickup" Ø¥Ø°Ø§ Ø°ÙƒØ± "Ø§Ø³ØªÙ„Ø§Ù…" Ø£Ùˆ "Ø§Ø³ØªÙ„Ø§Ù… Ù…Ù† Ø§Ù„Ù…Ø­Ù„" ÙˆØ¥Ù„Ø§ "delivery"
- Ø§Ù„Ø£Ø±Ù‚Ø§Ù… Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©: Ù¡=1ØŒ Ù¢=2ØŒ Ù£=3ØŒ Ù¤=4ØŒ Ù¥=5ØŒ Ù¦=6ØŒ Ù§=7ØŒ Ù¨=8ØŒ Ù©=9ØŒ Ù¡Ù =10ØŒ Ù¢Ù =20ØŒ Ù£Ù =30ØŒ Ù¤Ù =40
- Ø§Ù„ÙƒÙ„Ù…Ø§Øª: Ø¹Ø´Ø±Ø©=10ØŒ Ø¹Ø´Ø±ÙŠÙ†=20ØŒ Ø«Ù„Ø§Ø«ÙŠÙ†=30ØŒ Ø£Ø±Ø¨Ø¹ÙŠÙ†=40ØŒ Ø®Ù…Ø³ÙŠÙ†=50
- Ø§Ù„Ø³Ø¹Ø± Ù„Ù„Ø­Ø¨Ø©: Ø¥Ø°Ø§ Ø·Ù„Ø¨ "30 Ø³Ù…Ø¨ÙˆØ³Ø© Ø¨Ù" = quantity:30, price:3
- Ø¥Ø°Ø§ Ø§Ù„Ø±Ø³Ø§Ù„Ø© Ù…Ù†Ø³Ù‚Ø© Ø¨Ù†Ø¬ÙˆÙ… (*Ø·Ù„Ø¨ Ø¬Ø¯ÙŠØ¯*) Ø§Ø³ØªØ®Ø±Ø¬ Ù…Ø¨Ø§Ø´Ø±Ø© Ù…Ù†Ù‡Ø§
- Ø§Ù„Ù…Ù„Ø§Ø­Ø¸Ø§Øª: ÙˆÙ‚Øª Ø§Ù„ØªØ³Ù„ÙŠÙ…ØŒ Ø·Ù„Ø¨Ø§Øª Ø®Ø§ØµØ© (Ù…Ù‚Ù„ÙŠØŒ Ù…Ø¹ Ø§Ù„ØµÙˆØµØŒ Ø­Ø§Ø±...)
- Ø§Ø­Ø³Ø¨ Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹ Ø§Ù„ÙØ±Ø¹ÙŠ ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹ Ù…Ù† Ø§Ù„Ø£ØµÙ†Ø§Ù
- Ø£Ø±Ø¬Ø¹ JSON ÙÙ‚Ø· Ø¨Ø¯ÙˆÙ† Ø£ÙŠ Ù†Øµ Ø¥Ø¶Ø§ÙÙŠ Ø£Ùˆ markdown`

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
      setError("ÙØ´Ù„ ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ø±Ø³Ø§Ù„Ø© â€” Ø­Ø§ÙˆÙ„ Ù…Ø±Ø© Ø£Ø®Ø±Ù‰")
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
    if (!parsed.customerName) { setError("Ø§Ù„Ø§Ø³Ù… Ù…Ø·Ù„ÙˆØ¨"); return }
    if (parsed.items.length === 0) { setError("ÙŠØ¬Ø¨ Ø¥Ø¶Ø§ÙØ© Ù…Ù†ØªØ¬ ÙˆØ§Ø­Ø¯ Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„"); return }
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
    if (!result) { setError("ÙØ´Ù„ Ø­ÙØ¸ Ø§Ù„Ø·Ù„Ø¨ â€” ØªØ­Ù‚Ù‚ Ù…Ù† Ø§Ù„Ø§ØªØµØ§Ù„"); return }
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
          Ø¥Ø¶Ø§ÙØ© Ø·Ù„Ø¨ Ù…Ù† ÙˆØ§ØªØ³Ø§Ø¨
        </div>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <div className="mt-3 bg-white rounded-3xl border border-gray-100 shadow-sm p-4 space-y-4">

          {success && (
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-2xl">
              <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-bold text-green-800">ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø·Ù„Ø¨ #{success} âœ“</p>
                <p className="text-xs text-green-600">ÙŠÙ…ÙƒÙ†Ùƒ Ø·Ø¨Ø§Ø¹ØªÙ‡ Ù…Ù† Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø·Ù„Ø¨Ø§Øª</p>
              </div>
              <button onClick={reset} className="mr-auto text-green-600 text-xs underline">Ø¥Ø¶Ø§ÙØ© Ø¢Ø®Ø±</button>
            </div>
          )}

          {!parsed && !success && (
            <>
              <div>
                <label className="block text-sm font-bold mb-1 text-gray-700">Ø§Ù„ØµÙ‚ Ø±Ø³Ø§Ù„Ø© ÙˆØ§ØªØ³Ø§Ø¨:</label>
                <p className="text-xs text-gray-400 mb-2">ÙŠÙÙ‡Ù… Ø§Ù„Ø±Ø³Ø§Ø¦Ù„ Ø§Ù„Ø¹Ø§Ø¯ÙŠØ© Ø¨Ø§Ù„Ø¹Ø§Ù…ÙŠØ© ÙˆØ§Ù„Ù…Ù†Ø³Ù‚Ø© Ù…Ù† Ø§Ù„Ù…ÙˆÙ‚Ø¹</p>
                <textarea
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                  placeholder={"Ù…Ø«Ø§Ù„ Ø¹Ø§Ù…ÙŠ:\nØ§Ø¨ÙŠ Ù£Ù  Ø³Ù…Ø¨ÙˆØ³Ù‡ Ø¨Ù Ø¯Ø¬Ø§Ø¬ Ù…Ù‚Ù„ÙŠ\nØ§Ø³Ù…ÙŠ Ù†ÙˆØ±Ù‡ Ø§Ù„Ø³Ø§Ø¹Ù‡ Ù§\nØ§Ù„Ù†Ø²Ù‡Ù‡\n\nØ£Ùˆ Ù…Ù† Ø§Ù„Ù…ÙˆÙ‚Ø¹:\n*Ø·Ù„Ø¨ Ø¬Ø¯ÙŠØ¯ Ù…Ù† Ø£Ù…Ù„ Ø³Ù†Ø§Ùƒ*\n*Ø§Ù„Ø§Ø³Ù…:* Ù…Ù†Ù‰..."}
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
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­Ù„ÙŠÙ„...</>
                  : <><Sparkles className="h-4 w-4" /> ØªØ­Ù„ÙŠÙ„ Ø¨Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ</>}
              </button>
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            </>
          )}

          {parsed && !success && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button onClick={reset} className="text-xs text-gray-400 flex items-center gap-1"><X className="h-3 w-3" /> Ø¥Ù„ØºØ§Ø¡</button>
                <p className="font-bold text-[#1e293b]">Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ø·Ù„Ø¨</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Ø§Ù„Ø§Ø³Ù… *</label>
                  <input value={parsed.customerName} onChange={e => updateField("customerName", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#f5f5f5] text-sm focus:outline-none text-right" dir="rtl" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Ø§Ù„Ù‡Ø§ØªÙ</label>
                  <input value={parsed.customerPhone} onChange={e => updateField("customerPhone", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#f5f5f5] text-sm focus:outline-none text-right" dir="rtl" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Ø§Ù„Ù…Ù†Ø·Ù‚Ø©</label>
                  <input value={parsed.customerArea} onChange={e => updateField("customerArea", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#f5f5f5] text-sm focus:outline-none text-right" dir="rtl" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Ù†ÙˆØ¹ Ø§Ù„Ø·Ù„Ø¨</label>
                  <select value={parsed.orderType} onChange={e => updateField("orderType", e.target.value as "delivery" | "pickup")}
                    className="w-full px-3 py-2 rounded-xl bg-[#f5f5f5] text-sm focus:outline-none text-right" dir="rtl">
                    <option value="delivery">ØªÙˆØµÙŠÙ„ ðŸš—</option>
                    <option value="pickup">Ø§Ø³ØªÙ„Ø§Ù… ðŸª</option>
                  </select>
                </div>
              </div>

              {parsed.notes ? (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Ù…Ù„Ø§Ø­Ø¸Ø§Øª</label>
                  <input value={parsed.notes} onChange={e => updateField("notes", e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-yellow-50 border border-yellow-200 text-sm focus:outline-none text-right" dir="rtl" />
                </div>
              ) : null}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <button onClick={addItem} className="text-xs text-blue-600 flex items-center gap-1 active:scale-95">
                    <Plus className="h-3 w-3" /> Ø¥Ø¶Ø§ÙØ© Ù…Ù†ØªØ¬
                  </button>
                  <label className="text-xs font-bold text-gray-700">Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª ({parsed.items.length})</label>
                </div>
                <div className="space-y-2">
                  {parsed.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-[#f5f5f5] rounded-xl">
                      <button onClick={() => removeItem(idx)} className="text-red-400 flex-shrink-0 active:scale-95">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <input value={item.name} onChange={e => updateItem(idx, "name", e.target.value)}
                        placeholder="Ø§Ø³Ù… Ø§Ù„Ù…Ù†ØªØ¬" dir="rtl"
                        className="flex-1 px-2 py-1.5 rounded-lg bg-white text-sm focus:outline-none text-right min-w-0" />
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <input type="number" value={item.quantity} onChange={e => updateItem(idx, "quantity", e.target.value)}
                          className="w-10 px-1 py-1.5 rounded-lg bg-white text-sm focus:outline-none text-center" />
                        <span className="text-xs text-gray-400">Ã—</span>
                        <input type="number" value={item.price} onChange={e => updateItem(idx, "price", e.target.value)}
                          placeholder="0" className="w-14 px-1 py-1.5 rounded-lg bg-white text-sm focus:outline-none text-center" />
                      </div>
                    </div>
                  ))}
                  {parsed.items.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-3 bg-[#f5f5f5] rounded-xl">Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ù†ØªØ¬Ø§Øª â€” Ø£Ø¶Ù ÙŠØ¯ÙˆÙŠØ§Ù‹</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹</label>
                  <input type="number" value={parsed.subtotal} onChange={e => updateField("subtotal", Number(e.target.value))}
                    className="w-full px-2 py-2 rounded-xl bg-[#f5f5f5] text-sm focus:outline-none text-center" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Ø§Ù„ØªÙˆØµÙŠÙ„</label>
                  <input type="number" value={parsed.deliveryFee} onChange={e => {
                    const fee = Number(e.target.value)
                    setParsed(p => p ? { ...p, deliveryFee: fee, total: p.subtotal + fee } : p)
                  }} className="w-full px-2 py-2 rounded-xl bg-[#f5f5f5] text-sm focus:outline-none text-center" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block font-bold">Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ</label>
                  <div className="w-full px-2 py-2 rounded-xl bg-[#1e293b] text-white text-sm text-center font-bold">
                    {parsed.total} Ø±.Ø³
                  </div>
                </div>
              </div>

              {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-xl">{error}</p>}

              <button onClick={handleSave} disabled={saving}
                className="w-full py-3.5 bg-green-600 text-white font-bold rounded-2xl text-sm active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {saving ? "Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø­ÙØ¸..." : "Ø­ÙØ¸ Ø§Ù„Ø·Ù„Ø¨ ÙˆØ¥Ø±Ø³Ø§Ù„Ù‡ Ù„Ù„Ù…Ø·Ø¨Ø®"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

