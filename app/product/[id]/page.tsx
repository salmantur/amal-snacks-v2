"use client"

import { useParams, useRouter } from "next/navigation"
import { useMenu } from "@/hooks/use-menu"
import { TrayPicker } from "@/components/tray-picker"

export default function ProductPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { menuItems, isLoading } = useMenu()
  const item = menuItems.find((menuItem) => menuItem.id === params.id)

  const hasIngredients = (item?.ingredients?.length || 0) > 0
  const isTraySizeVariant =
    item?.category === "trays" && item.limit === 1 && hasIngredients && (item.ingredients || []).some((ingredient) => ingredient.includes("::"))

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground" dir="rtl">
        جارِ التحميل...
      </div>
    )
  }

  if (!item || !isTraySizeVariant) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center" dir="rtl">
        <p className="text-sm text-muted-foreground">{!item ? "لم يتم العثور على هذا المنتج." : "هذا المنتج لا يدعم صفحة العرض هذه حاليًا."}</p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="rounded-full bg-foreground px-5 py-2.5 text-sm font-bold text-background"
        >
          العودة للرئيسية
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-0 md:flex md:items-center md:justify-center md:p-9">
      <div className="mx-auto h-screen w-full overflow-hidden bg-[#f7f2ea] shadow-none md:h-[860px] md:max-w-[420px] md:rounded-[38px] md:shadow-[0_40px_80px_-30px_rgba(20,15,10,0.42)]">
        <TrayPicker item={item} onBack={() => router.back()} onAdded={() => router.push("/")} />
      </div>
    </div>
  )
}
