"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { categories as hardcodedCategories } from "@/lib/data"

export interface Category {
  id: string
  label: string
  dbCategories: string[]
  isVisible: boolean
  sortOrder: number
  isCustom: boolean
  sections?: { dbCategory: string; label: string }[]
}

// Sections config for built-in categories that have sub-sections
const SECTIONS_CONFIG: Record<string, { dbCategory: string; label: string }[]> = {
  platters_breakfast: [
    { dbCategory: "platters", label: "البلاترات" },
    { dbCategory: "breakfast_heaters", label: "سخانات الفطور" },
  ],
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    supabase
      .from("categories")
      .select("*")
      .order("sort_order")
      .then(({ data, error }) => {
        if (error || !data || data.length === 0) {
          // Fallback to hardcoded categories
          setCategories(
            hardcodedCategories.map((c, i) => ({
              id: c.id,
              label: c.label,
              dbCategories: c.dbCategories,
              isVisible: true,
              sortOrder: i + 1,
              isCustom: false,
              sections: c.sections,
            }))
          )
        } else {
          setCategories(
            data.map((row) => ({
              id: row.id,
              label: row.label,
              dbCategories: row.db_categories,
              isVisible: row.is_visible,
              sortOrder: row.sort_order,
              isCustom: row.is_custom,
              sections: SECTIONS_CONFIG[row.id],
            }))
          )
        }
        setLoading(false)
      })
  }, [])

  return { categories, loading }
}

export async function saveCategory(cat: Omit<Category, "sections">): Promise<void> {
  const supabase = createClient()
  await supabase.from("categories").upsert({
    id: cat.id,
    label: cat.label,
    db_categories: cat.dbCategories,
    is_visible: cat.isVisible,
    sort_order: cat.sortOrder,
    is_custom: cat.isCustom,
  }, { onConflict: "id" })
}

export async function deleteCategory(id: string): Promise<void> {
  const supabase = createClient()
  await supabase.from("categories").delete().eq("id", id)
}

export async function updateCategoryVisibility(id: string, isVisible: boolean): Promise<void> {
  const supabase = createClient()
  await supabase.from("categories").update({ is_visible: isVisible }).eq("id", id)
}
