"use client"

import { ShoppingBag, Truck, X, MapPin } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface OrderTypeModalProps {
  open: boolean
  onSelect: (type: "pickup" | "delivery") => void
  onClose: () => void
}

type ModalStyle = "aurora" | "crystal" | "midnight"

const SHOP_ADDRESS = "الدمام، حي الفيصلية، شارع الأمير محمد بن فهد"
const SHOP_MAPS_URL = "https://maps.google.com/?q=26.4207,50.0888"

function getModalStyle(): ModalStyle {
  if (typeof window === "undefined") return "aurora"
  const value = new URLSearchParams(window.location.search).get("modal")
  if (value === "crystal" || value === "midnight" || value === "aurora") return value
  return "aurora"
}

export function OrderTypeModal({ open, onSelect, onClose }: OrderTypeModalProps) {
  const style = getModalStyle()

  const theme =
    style === "crystal"
      ? {
          shell:
            "rounded-3xl border border-white/55 bg-gradient-to-br from-white/80 via-white/50 to-white/30 backdrop-blur-2xl",
          glow:
            "bg-[radial-gradient(circle_at_12%_14%,rgba(255,255,255,0.9),transparent_35%),radial-gradient(circle_at_88%_80%,rgba(180,220,255,0.35),transparent_45%)]",
          title: "text-slate-800",
          subtitle: "text-slate-600",
          buttonA: "border border-white/70 bg-white/55 text-slate-800 hover:bg-white/70",
          buttonB: "border border-sky-200/70 bg-sky-100/60 text-sky-900 hover:bg-sky-100/80",
          close: "bg-white/60 border-white/70 text-slate-700",
          map: "text-slate-600 hover:text-slate-800",
        }
      : style === "midnight"
        ? {
            shell:
              "rounded-3xl border border-cyan-200/30 bg-gradient-to-br from-slate-900/85 via-slate-800/75 to-slate-900/85 backdrop-blur-2xl",
            glow:
              "bg-[radial-gradient(circle_at_14%_12%,rgba(56,189,248,0.25),transparent_35%),radial-gradient(circle_at_88%_82%,rgba(16,185,129,0.2),transparent_40%)]",
            title: "text-white",
            subtitle: "text-white/75",
            buttonA: "border border-cyan-200/35 bg-cyan-300/20 text-cyan-100 hover:bg-cyan-300/30",
            buttonB: "border border-emerald-200/35 bg-emerald-300/20 text-emerald-100 hover:bg-emerald-300/30",
            close: "bg-white/10 border-white/25 text-white",
            map: "text-white/70 hover:text-white",
          }
        : {
            shell:
              "rounded-3xl border border-white/40 bg-gradient-to-br from-white/60 via-white/35 to-white/20 backdrop-blur-2xl",
            glow:
              "bg-[radial-gradient(circle_at_10%_12%,rgba(255,255,255,0.85),transparent_35%),radial-gradient(circle_at_90%_80%,rgba(255,255,255,0.25),transparent_45%)]",
            title: "text-white",
            subtitle: "text-white/85",
            buttonA: "border border-white/50 bg-white/35 text-white hover:bg-white/45",
            buttonB: "border border-white/50 bg-white/20 text-white hover:bg-white/30",
            close: "bg-white/35 border-white/50 text-white",
            map: "text-white/85 hover:text-white",
          }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm w-[min(24rem,calc(100vw-2rem))] p-0 border-0 rounded-3xl overflow-hidden gap-0 bg-transparent shadow-none [&>button]:hidden">
        <div className={`relative overflow-hidden ${theme.shell}`}>
          <div className={`pointer-events-none absolute inset-0 ${theme.glow}`} />
          <div className="pointer-events-none absolute inset-[1px] rounded-3xl border border-white/30" />

          <div className="relative px-6 pt-8 pb-6 text-center">
            <button
              onClick={onClose}
              className="absolute top-4 left-4 w-9 h-9 rounded-full backdrop-blur flex items-center justify-center border border-white/80 bg-black/35 text-white shadow-md outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-0"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-end justify-center gap-3 mb-5">
              <div className="w-20 h-20 bg-yellow-100/85 border border-yellow-200/80 rounded-3xl flex items-center justify-center backdrop-blur">
                <ShoppingBag className="h-9 w-9 text-yellow-700" />
              </div>
              <div className="w-14 h-14 bg-pink-100/85 border border-pink-200/80 rounded-2xl flex items-center justify-center mb-2 backdrop-blur">
                <Truck className="h-7 w-7 text-pink-700" />
              </div>
            </div>

            <h2 className={`text-3xl font-black mb-1 ${theme.title}`}>كيف تريد طلبك؟</h2>
            <p className={`text-sm font-medium ${theme.subtitle}`}>اختر طريقة الاستلام</p>
          </div>

          <div className="relative px-5 pb-5 space-y-3">
            <button
              onClick={() => onSelect("pickup")}
              className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-extrabold text-xl shadow-[0_8px_20px_rgba(0,0,0,0.15)] transition-colors ${theme.buttonA}`}
            >
              <ShoppingBag className="h-5 w-5" />
              استلام من المحل
            </button>

            <a
              href={SHOP_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 px-2 py-1 text-sm transition-colors ${theme.map}`}
            >
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="text-right">{SHOP_ADDRESS}</span>
            </a>

            <button
              onClick={() => onSelect("delivery")}
              className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-extrabold text-xl shadow-[0_8px_20px_rgba(0,0,0,0.15)] transition-colors ${theme.buttonB}`}
            >
              <Truck className="h-5 w-5" />
              توصيل للمنزل
            </button>

            <button onClick={onClose} className={`w-full py-2 text-sm transition-colors ${theme.map}`}>
              متابعة التصفح
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
