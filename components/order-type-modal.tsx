"use client"

import { ShoppingBag, Truck, X, MapPin } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface OrderTypeModalProps {
  open: boolean
  onSelect: (type: "pickup" | "delivery") => void
  onClose: () => void
}

const SHOP_ADDRESS = "الدمام، حي الفيصلية، شارع الأمير محمد بن فهد"
const SHOP_MAPS_URL = "https://maps.google.com/?q=26.4207,50.0888" // update with your real coords

export function OrderTypeModal({ open, onSelect, onClose }: OrderTypeModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm p-0 border-0 rounded-3xl overflow-hidden gap-0">
        {/* Green header area */}
        <div className="relative bg-gradient-to-b from-[var(--checkout-green)] to-[var(--checkout-green)] pt-10 pb-12 px-6 text-center">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
          >
            <X className="h-4 w-4 text-white" />
          </button>

          {/* Illustration */}
          <div className="flex items-end justify-center gap-3 mb-6">
            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center">
              <ShoppingBag className="h-10 w-10 text-white" />
            </div>
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-2">
              <Truck className="h-7 w-7 text-white" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">كيف تريد طلبك؟</h2>
          <p className="text-white/70 text-sm">اختر طريقة الاستلام</p>
        </div>

        {/* Buttons */}
        <div className="bg-white px-6 pt-6 pb-8 space-y-3 -mt-4 rounded-t-3xl relative z-10">

          {/* Pickup button */}
          <button
            onClick={() => onSelect("pickup")}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl border-2 border-[var(--checkout-green)] text-[var(--checkout-green)] font-bold text-lg hover:bg-[var(--checkout-green)]/5 transition-colors"
          >
            <ShoppingBag className="h-5 w-5" />
            استلام من المحل
          </button>

          {/* Shop address */}
          <a
            href={SHOP_MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground hover:text-[var(--checkout-green)] transition-colors"
          >
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="text-right">{SHOP_ADDRESS}</span>
          </a>

          {/* Delivery button */}
          <button
            onClick={() => onSelect("delivery")}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-[var(--checkout-green)] text-white font-bold text-lg hover:bg-[var(--checkout-green)] transition-colors"
          >
            <Truck className="h-5 w-5" />
            توصيل للمنزل
          </button>

          {/* Just browsing */}
          <button
            onClick={onClose}
            className="w-full py-2 text-muted-foreground text-sm hover:text-foreground transition-colors"
          >
            متابعة التصفح
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}