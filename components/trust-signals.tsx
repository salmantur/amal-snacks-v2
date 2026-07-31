"use client"

import { Percent } from "lucide-react"
import { useDiscountConfig } from "@/hooks/use-discount-config"

function formatAutoDiscountLabel(type: "percent" | "fixed", value: number): string {
  return type === "percent" ? `خصم ${value}% تلقائي على طلبك` : `خصم ${value} ريال تلقائي على طلبك`
}

/**
 * Small trust/urgency strip shown right under the hero. Every chip reflects
 * something actually true right now (live discount config) rather than
 * invented copy.
 */
export function TrustSignals() {
  const { config: discountConfig, loading } = useDiscountConfig()

  const showAutoDiscount =
    !loading && discountConfig.enabled && discountConfig.autoDiscountEnabled && discountConfig.autoDiscountValue > 0

  if (!showAutoDiscount) return null

  return (
    <div className="mx-4 mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden" dir="rtl">
      <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
        <Percent className="h-3.5 w-3.5" />
        {formatAutoDiscountLabel(discountConfig.autoDiscountType, discountConfig.autoDiscountValue)}
      </span>
    </div>
  )
}
