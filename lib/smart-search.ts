import type { MenuItem } from "@/components/cart-provider"

type RankedItem = { item: MenuItem; score: number }

const ARABIC_DIACRITICS = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g
const TATWEEL = /\u0640/g
const ARABIC_VARIANTS = /[أإآٱ]/g
const NON_WORDS = /[^\u0621-\u064Aa-z0-9\s]/g
const MULTI_SPACE = /\s+/g

const EN_TO_AR_KEYBOARD: Record<string, string> = {
  q: "ض",
  w: "ص",
  e: "ث",
  r: "ق",
  t: "ف",
  y: "غ",
  u: "ع",
  i: "ه",
  o: "خ",
  p: "ح",
  "[": "ج",
  "]": "د",
  a: "ش",
  s: "س",
  d: "ي",
  f: "ب",
  g: "ل",
  h: "ا",
  j: "ت",
  k: "ن",
  l: "م",
  ";": "ك",
  "'": "ط",
  z: "ئ",
  x: "ء",
  c: "ؤ",
  v: "ر",
  b: "لا",
  n: "ى",
  m: "ة",
  ",": "و",
  ".": "ز",
  "/": "ظ",
}

const AR_TO_EN_KEYBOARD: Record<string, string> = {
  ض: "q",
  ص: "w",
  ث: "e",
  ق: "r",
  ف: "t",
  غ: "y",
  ع: "u",
  ه: "i",
  خ: "o",
  ح: "p",
  ج: "[",
  د: "]",
  ش: "a",
  س: "s",
  ي: "d",
  ب: "f",
  ل: "g",
  ا: "h",
  ت: "j",
  ن: "k",
  م: "l",
  ك: ";",
  ط: "'",
  ئ: "z",
  ء: "x",
  ؤ: "c",
  ر: "v",
  ى: "n",
  ة: "m",
  و: ",",
  ز: ".",
  ظ: "/",
}

function toLatinDigits(value: string): string {
  return value.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
}

function translateKeyboardLayout(value: string, map: Record<string, string>): string {
  return value
    .split("")
    .map((ch) => map[ch] ?? map[ch.toLowerCase()] ?? ch)
    .join("")
}

function getQueryVariants(rawQuery: string): string[] {
  const set = new Set<string>()
  const candidates = [
    rawQuery,
    translateKeyboardLayout(rawQuery, EN_TO_AR_KEYBOARD),
    translateKeyboardLayout(rawQuery, AR_TO_EN_KEYBOARD),
  ]

  for (const candidate of candidates) {
    const normalized = normalizeSearchText(candidate)
    if (normalized) set.add(normalized)
  }

  return Array.from(set)
}

export function normalizeSearchText(value: string): string {
  return toLatinDigits(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(ARABIC_DIACRITICS, "")
    .replace(TATWEEL, "")
    .replace(ARABIC_VARIANTS, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(NON_WORDS, " ")
    .replace(MULTI_SPACE, " ")
    .trim()
}

function levenshtein(a: string, b: string, maxDistance: number): number {
  if (Math.abs(a.length - b.length) > maxDistance) return maxDistance + 1
  const prev = new Array(b.length + 1)
  const curr = new Array(b.length + 1)

  for (let j = 0; j <= b.length; j++) prev[j] = j

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    let rowMin = curr[0]

    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
      if (curr[j] < rowMin) rowMin = curr[j]
    }

    if (rowMin > maxDistance) return maxDistance + 1
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j]
  }

  return prev[b.length]
}

function isSubsequence(query: string, target: string): boolean {
  let i = 0
  let j = 0
  while (i < query.length && j < target.length) {
    if (query[i] === target[j]) i++
    j++
  }
  return i === query.length
}

function fuzzyTokenMatch(queryToken: string, targetToken: string): boolean {
  if (queryToken === targetToken) return true
  if (targetToken.startsWith(queryToken)) return true
  if (targetToken.includes(queryToken)) return true
  if (queryToken.length >= 3 && isSubsequence(queryToken, targetToken)) return true

  const maxDistance = queryToken.length <= 4 ? 1 : 2
  return levenshtein(queryToken, targetToken, maxDistance) <= maxDistance
}

function buildHaystack(item: MenuItem): string {
  return normalizeSearchText([item.name, item.nameEn || "", item.description || "", ...(item.ingredients || [])].join(" "))
}

function scoreItem(query: string, queryTokens: string[], haystack: string, haystackTokens: string[]): number {
  if (!haystack) return 0
  if (haystack === query) return 1000

  const idx = haystack.indexOf(query)
  if (idx !== -1) {
    return Math.max(800 - idx, 500)
  }

  let matchedTokens = 0
  let score = 0
  for (const token of queryTokens) {
    if (!token) continue
    const matched = haystackTokens.some((target) => fuzzyTokenMatch(token, target))
    if (matched) {
      matchedTokens += 1
      score += 120
    }
  }

  if (queryTokens.length > 0 && matchedTokens === queryTokens.length) {
    score += 200
  }

  return score
}

export function smartFilterMenuItems(items: MenuItem[], rawQuery: string): MenuItem[] {
  const queryVariants = getQueryVariants(rawQuery)
  if (queryVariants.length === 0) return []

  const ranked: RankedItem[] = []

  for (const item of items) {
    const haystack = buildHaystack(item)
    const haystackTokens = haystack.split(" ").filter(Boolean)
    let bestScore = 0

    for (const query of queryVariants) {
      const queryTokens = query.split(" ").filter(Boolean)
      const score = scoreItem(query, queryTokens, haystack, haystackTokens)
      if (score > bestScore) bestScore = score
    }

    if (bestScore > 0) ranked.push({ item, score: bestScore })
  }

  ranked.sort((a, b) => b.score - a.score)
  return ranked.map((entry) => entry.item)
}
