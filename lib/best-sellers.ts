interface BestSellerSortableItem {
  id: string
  name: string
  nameEn?: string
  category: string
  isFeatured?: boolean
}

function isMusakhan<T extends BestSellerSortableItem>(item: T): boolean {
  const ar = (item.name || "").replace(/\s+/g, "")
  const en = (item.nameEn || "").trim().toLowerCase()
  return ar.includes("مسخن") || en.includes("musakhan") || en.includes("muskhan")
}

export function getBestSellerCandidates<T extends BestSellerSortableItem>(menuItems: T[], orderedIds: string[] = []): T[] {
  const originalIndex = new Map(menuItems.map((item, index) => [item.id, index]))
  const configuredOrder = new Map(orderedIds.map((id, index) => [id, index]))

  const musakhanCandidates = menuItems.filter((item) => isMusakhan(item) && item.category !== "frozen")
  const musakhanCategoryPriority = (category: string): number => {
    if (category === "trays") return 0
    if (category === "sandwiches") return 1
    if (category === "appetizers") return 2
    return 3
  }

  const selectedMusakhan = [...musakhanCandidates].sort((a, b) => {
    const priorityDiff = musakhanCategoryPriority(a.category) - musakhanCategoryPriority(b.category)
    if (priorityDiff !== 0) return priorityDiff
    return (originalIndex.get(a.id) ?? 0) - (originalIndex.get(b.id) ?? 0)
  })[0]

  const selected = menuItems.filter(
    (item) => item.category === "trays" || item.isFeatured || (selectedMusakhan ? item.id === selectedMusakhan.id : false)
  )

  return Array.from(new Map(selected.map((item) => [item.id, item])).values()).sort((a, b) => {
    const configuredA = configuredOrder.get(a.id)
    const configuredB = configuredOrder.get(b.id)

    if (configuredA !== undefined && configuredB !== undefined) return configuredA - configuredB
    if (configuredA !== undefined) return -1
    if (configuredB !== undefined) return 1

    const aIsTray = a.category === "trays"
    const bIsTray = b.category === "trays"
    if (aIsTray && !bIsTray) return -1
    if (!aIsTray && bIsTray) return 1
    if (selectedMusakhan && a.id === selectedMusakhan.id && b.id !== selectedMusakhan.id) return -1
    if (selectedMusakhan && b.id === selectedMusakhan.id && a.id !== selectedMusakhan.id) return 1
    if (a.isFeatured && !b.isFeatured) return -1
    if (!a.isFeatured && b.isFeatured) return 1
    return (originalIndex.get(a.id) ?? 0) - (originalIndex.get(b.id) ?? 0)
  })
}
