"use client"

import dynamic from "next/dynamic"

const CategoryManager = dynamic(
  () => import("@/components/category-manager").then((m) => ({ default: m.CategoryManager })),
  { loading: () => <div className="py-16 text-center text-sm text-muted-foreground">جارِ التحميل...</div> }
)

export default function ItemsCategoriesPage() {
  return (
    <div className="mx-auto max-w-lg p-4 md:p-6">
      <CategoryManager />
    </div>
  )
}
