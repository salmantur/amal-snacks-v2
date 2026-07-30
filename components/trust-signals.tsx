"use client"

import { MessageCircle, Percent, Store } from "lucide-react"
import { useDiscountConfig } from "@/hooks/use-discount-config"
import { WHATSAPP_NUMBER } from "@/lib/data"
import { trackStorefrontEvent } from "@/lib/storefront-events"

function formatAutoDiscountLabel(type: "percent" | "fixed", value: number): string {
  return type === "percent" ? `خصم ${value}% تلقائي على طلبك` : `خصم ${value} ريال تلقائي على طلبك`
}

/**
 * Small trust/urgency strip shown right under the hero. Every chip reflects
 * something actually true right now (live discount config, real pickup
 * policy, real WhatsApp number) rather than invented copy.
 */
export function TrustSignals() {
  const { config: discountConfig, loading } = useDiscountConfig()

  const showAutoDiscount =
    !loading && discountConfig.enabled && discountConfig.autoDiscountEnabled && discountConfig.autoDiscountValue > 0

  return (
    <div className="mx-4 mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden" dir="rtl">
      {showAutoDiscount ? (
        <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
          <Percent className="h-3.5 w-3.5" />
          {formatAutoDiscountLabel(discountConfig.autoDiscountType, discountConfig.autoDiscountValue)}
        </span>
      ) : null}

      <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
        <Store className="h-3.5 w-3.5" />
        استلام من المحل بدون رسوم توصيل
      </span>

      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackStorefrontEvent("trust_signal_whatsapp_clicked", {})}
        className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#25D366]/25 bg-[#25D366]/10 px-3 py-1.5 text-xs font-bold text-[#1f8f48]"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        تواصل مباشر عبر واتساب
      </a>
    </div>
  )
}
