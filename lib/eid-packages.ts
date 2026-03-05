import type { MenuItem } from "@/components/cart-provider"

function isSecondEidPackage(name: string): boolean {
  // second / package 2 / #2 / ?????? / ??????? / ?
  return (
    /\b(second|2nd|package\s*2|pack\s*2|#\s*2)\b/.test(name) ||
    /(?:^|\s)2(?:\s|$)/.test(name) ||
    /\u0627\u0644\u062b\u0627\u0646\u064a|\u0627\u0644\u062b\u0627\u0646\u064a\u0629|\u0662/.test(name)
  )
}

export function getEidRequiredHeaters(item: Pick<MenuItem, "category" | "name" | "nameEn" | "limit">): number {
  if (item.category !== "eid") {
    return item.limit || 0
  }

  const text = `${item.name || ""} ${item.nameEn || ""}`.toLowerCase()
  if (isSecondEidPackage(text)) {
    return 6
  }

  return item.limit || 4
}
