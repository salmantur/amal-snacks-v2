import type { MenuItem } from "@/components/cart-provider"

export function decodePossibleMojibake(value: string): string {
  if (!value) return value
  if (!/[ÃØÙÂâð]/.test(value)) return value

  try {
    const bytes = Uint8Array.from(
      Array.from(value).map((char) => char.charCodeAt(0) & 0xff),
    )
    const decoded = new TextDecoder("utf-8").decode(bytes)
    return decoded.includes("�") ? value : decoded
  } catch {
    return value
  }
}

/** Applies decodePossibleMojibake to every text field on a menu item - shared
 *  between the client fetcher (hooks/use-menu.ts) and the server-side fetch
 *  used to seed SWR's initial data, so both produce identical output. */
export function decodeMenuItems(items: MenuItem[]): MenuItem[] {
  return items.map((item) => ({
    ...item,
    name: decodePossibleMojibake(item.name || ""),
    nameEn: decodePossibleMojibake(item.nameEn || ""),
    description: decodePossibleMojibake(item.description || ""),
    ingredients: Array.isArray(item.ingredients)
      ? item.ingredients.map((ingredient) => decodePossibleMojibake(String(ingredient || "")))
      : item.ingredients,
    packageItems: Array.isArray(item.packageItems)
      ? item.packageItems.map((pkg) => ({
          ...pkg,
          label: decodePossibleMojibake(String(pkg.label || "")),
        }))
      : item.packageItems,
  }))
}
