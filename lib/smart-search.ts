import type { MenuItem } from "@/components/cart-provider"

type RankedItem = { item: MenuItem; score: number }

const ARABIC_DIACRITICS = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g
const TATWEEL = /\u0640/g
const ARABIC_VARIANTS = /[أإآٱ]/g
const NON_WORDS = /[^\u0621-\u064Aa-z0-9\s]/g
const MULTI_SPACE = /\s+/g

function toLatinDigits(value: string): string {
  return value.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
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
  return normalizeSearchText(
    [
      item.name,
      item.nameEn || "",
      item.description || "",
      ...(item.ingredients || []),
    ].join(" ")
  )
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
  const query = normalizeSearchText(rawQuery)
  if (!query) return []

  const queryTokens = query.split(" ").filter(Boolean)
  const ranked: RankedItem[] = []

  for (const item of items) {
    const haystack = buildHaystack(item)
    const haystackTokens = haystack.split(" ").filter(Boolean)
    const score = scoreItem(query, queryTokens, haystack, haystackTokens)
    if (score > 0) ranked.push({ item, score })
  }

  ranked.sort((a, b) => b.score - a.score)
  return ranked.map((entry) => entry.item)
}
