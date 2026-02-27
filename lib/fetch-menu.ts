import { createClient } from "@supabase/supabase-js"
import type { MenuItem } from "@/components/cart-provider"

const SUPABASE_URL = "https://eejlqdydoilbjpegxvbq.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlamxxZHlkb2lsYmpwZWd4dmJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMjE4MTQsImV4cCI6MjA4NTc5NzgxNH0.J5pQRDXpjYWpoNqmpmh-3KRICK9ijcL0NRe06405JYA"

export async function fetchMenuItems(): Promise<{ data: MenuItem[]; error: string | null }> {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    const { data, error } = await supabase.from("menu").select("*").eq("in_stock", true)

    if (error) {
      return { error: `${error.code}: ${error.message}`, data: [] }
    }

    if (!data || data.length === 0) {
      return { error: "No items found in menu table", data: [] }
    }

    const items: MenuItem[] = data.map((item: Record<string, unknown>) => {
      let imageValue = String(item.image || item.img || item.image_url || item.photo || item.picture || "")

      if (imageValue.includes(",")) {
        imageValue = imageValue.split(",")[0].trim()
      }

      if (imageValue && !imageValue.startsWith("http")) {
        imageValue = `${SUPABASE_URL}/storage/v1/object/public/Menu/${imageValue}`
      }

      let ingredients: string[] = []
      const ingredientsRaw = item.ingredients
      if (ingredientsRaw) {
        if (typeof ingredientsRaw === "string") {
          ingredients = ingredientsRaw.split(",").map((s: string) => s.trim()).filter(Boolean)
        } else if (Array.isArray(ingredientsRaw)) {
          ingredients = ingredientsRaw.map(String)
        }
      }

      return {
        id: String(item.id),
        name: String(item.name || ""),
        nameEn: String(item.name_en || ""),
        description: String(item.description || ""),
        price: Number(item.price) || 0,
        image: imageValue,
        category: String(item.category || ""),
        ingredients,
        limit: Number(item.limit) || 0,
        inStock: item.in_stock !== false,
      }
    })

    return { data: items, error: null }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Unknown server error",
      data: [],
    }
  }
}