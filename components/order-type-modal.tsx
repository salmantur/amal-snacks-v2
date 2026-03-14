"use client"

import { useState } from "react"
import { Check, Store, Truck } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface OrderTypeModalProps {
  open: boolean
  onSelect: (type: "pickup" | "delivery") => void
  onClose: () => void
}

type OrderType = "pickup" | "delivery"

export function OrderTypeModal({
  open,
  onSelect,
  onClose,
}: OrderTypeModalProps) {
  const [selectedType, setSelectedType] = useState<OrderType | null>(null)

  const handleSelect = (type: OrderType) => {
    if (selectedType) return
    setSelectedType(type)

    window.setTimeout(() => {
      onSelect(type)
      setSelectedType(null)
    }, 180)
  }

  const isSelected = (type: OrderType) => selectedType === type
  const isLocked = selectedType !== null

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setSelectedType(null)
          onClose()
        }
      }}
    >
      <DialogContent className="max-h-[min(88dvh,40rem)] w-[min(92vw,28rem)] overflow-y-auto rounded-[2rem] border border-white/70 bg-[radial-gradient(circle_at_top,#fff8fb_0%,#f5eff3_48%,#efe6ec_100%)] p-0 shadow-[0_32px_90px_rgba(8,18,45,0.22)] [&>button]:hidden">
        <div className="px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 sm:pb-6">
          <div className="text-center">
            <p className="text-[0.7rem] font-semibold tracking-[0.24em] text-[#9b7a86]">
              PICKUP OR DELIVERY
            </p>
            <h2 className="mt-2 text-[1.7rem] font-black tracking-tight text-[#08122d] sm:text-[1.9rem]">
              اختر طريقة استلام الطلب
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#6f7382]">
              اختر الخيار المناسب لك وسنكمل الطلب بالخطوات التالية.
            </p>
          </div>

          <div className="mt-5 grid gap-3">
            <button
              type="button"
              onClick={() => handleSelect("delivery")}
              disabled={isLocked}
              className={cn(
                "relative min-h-[11rem] rounded-[1.6rem] border px-4 py-5 text-center transition-all duration-200 sm:min-h-[11.5rem]",
                isSelected("delivery")
                  ? "border-[#ef3d7f] bg-[#fff4f8] shadow-[0_18px_45px_rgba(239,61,127,0.16)]"
                  : "border-[#e1dde1] bg-white/85 hover:border-[#ef3d7f]/35 hover:bg-white",
              )}
            >
              {isSelected("delivery") ? (
                <span className="absolute -right-2.5 -top-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-[#ef3d7f] text-white shadow-[0_10px_24px_rgba(239,61,127,0.28)]">
                  <Check className="h-4 w-4" />
                </span>
              ) : null}

              <div
                className={cn(
                  "mx-auto flex h-20 w-20 items-center justify-center rounded-full",
                  isSelected("delivery") ? "bg-[#f8dce6]" : "bg-[#f3f4f6]",
                )}
              >
                <Truck
                  className={cn(
                    "h-8 w-8",
                    isSelected("delivery") ? "text-[#ef3d7f]" : "text-[#9aa3af]",
                  )}
                />
              </div>

              <p className="mt-4 text-xl font-black tracking-tight text-[#08122d] sm:text-[1.4rem]">
                توصيل للمنزل
              </p>
              <p className="mt-1.5 text-sm leading-6 text-[#6f7382]">
                نوصله إلى موقعك في الموعد المحدد.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleSelect("pickup")}
              disabled={isLocked}
              className={cn(
                "relative min-h-[11rem] rounded-[1.6rem] border px-4 py-5 text-center transition-all duration-200 sm:min-h-[11.5rem]",
                isSelected("pickup")
                  ? "border-[#ef3d7f] bg-[#fff7ea] shadow-[0_18px_45px_rgba(241,181,20,0.14)]"
                  : "border-[#e1dde1] bg-white/85 hover:border-[#f1b514]/40 hover:bg-white",
              )}
            >
              {isSelected("pickup") ? (
                <span className="absolute -right-2.5 -top-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-[#ef3d7f] text-white shadow-[0_10px_24px_rgba(239,61,127,0.28)]">
                  <Check className="h-4 w-4" />
                </span>
              ) : null}

              <div
                className={cn(
                  "mx-auto flex h-20 w-20 items-center justify-center rounded-full",
                  isSelected("pickup") ? "bg-[#ffe7b0]" : "bg-[#fff3d5]",
                )}
              >
                <Store
                  className={cn(
                    "h-8 w-8",
                    isSelected("pickup") ? "text-[#ef3d7f]" : "text-[#d8a100]",
                  )}
                />
              </div>

              <p className="mt-4 text-xl font-black tracking-tight text-[#08122d] sm:text-[1.4rem]">
                استلام من المحل
              </p>
              <p className="mt-1.5 text-sm leading-6 text-[#6f7382]">
                استلم الطلب بنفسك بدون رسوم توصيل.
              </p>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
