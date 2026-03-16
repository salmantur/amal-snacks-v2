"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { categories as hardcodedCategories } from "@/lib/data"
import { decodePossibleMojibake } from "@/lib/text"

export interface Category {
  id: string
  label: string
  dbCategories: string[]
  isVisible: boolean
  sortOrder: number
  isCustom: boolean
  sections?: { dbCategory: string; label: string }[]
}

const SECTIONS_CONFIG: Record<string, { dbCategory: string; label: string }[]> = {
  platters_breakfast: [
    { dbCategory: "platters", label: "البلاترات" },
    { dbCategory: "breakfast_heaters", label: "سخانات الفطور" },
  ],
}

function normalizeSections(sections?: { dbCategory: string; label: string }[]) {
  return sections?.map((section) => ({
    ...section,
    label: decodePossibleMojibake(section.label),
  }))
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
          setCategories(
            hardcodedCategories.map((c, i) => ({
              id: c.id,
              label: decodePossibleMojibake(c.label),
              dbCategories: c.dbCategories,
              isVisible: true,
              sortOrder: i + 1,
              isCustom: false,
              sections: normalizeSections(c.sections),
            })),
          )
        } else {
          setCategories(
            data.map((row) => ({
              id: row.id,
              label: decodePossibleMojibake(row.label),
              dbCategories: row.db_categories,
              isVisible: row.is_visible,
              sortOrder: row.sort_order,
              isCustom: row.is_custom,
              sections: normalizeSections(SECTIONS_CONFIG[row.id]),
            })),
          )
        }
        setLoading(false)
      })
  }, [])

  return { categories, loading }
}

export async function saveCategory(cat: Omit<Category, "sections">): Promise<void> {
  const supabase = createClient()
  await supabase.from("categories").upsert(
    {
      id: cat.id,
      label: cat.label,
      db_categories: cat.dbCategories,
      is_visible: cat.isVisible,
      sort_order: cat.sortOrder,
      is_custom: cat.isCustom,
    },
    { onConflict: "id" },
  )
}

export async function deleteCategory(id: string): Promise<void> {
  const supabase = createClient()
  await supabase.from("categories").delete().eq("id", id)
}

export async function updateCategoryVisibility(
  id: string,
  isVisible: boolean,
): Promise<void> {
  const supabase = createClient()
  await supabase.from("categories").update({ is_visible: isVisible }).eq("id", id)
}
