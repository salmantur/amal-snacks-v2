"use client"

import { Check, Store, Truck } from "lucide-react"
import { useState } from "react"
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
      <DialogContent className="h-[100dvh] w-screen max-w-none rounded-none border-0 bg-[#f3eef1] p-0 shadow-none [&>button]:hidden">
        <div className="flex min-h-full flex-col px-6 pb-10 pt-24">
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-7">
            <button
              type="button"
              onClick={() => handleSelect("delivery")}
              disabled={isLocked}
              className={cn(
                "relative min-h-[18rem] rounded-[2rem] border-2 bg-[#f6eff2] px-6 py-8 text-center transition-all duration-200",
                isSelected("delivery")
                  ? "border-[#ef3d7f] shadow-[0_20px_50px_rgba(239,61,127,0.16)]"
                  : "border-[#dfe3e7] bg-[#f8f8f8]",
              )}
            >
              {isSelected("delivery") ? (
                <span className="absolute -right-4 -top-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#ef3d7f] text-white shadow-[0_10px_25px_rgba(239,61,127,0.28)]">
                  <Check className="h-7 w-7" />
                </span>
              ) : null}

              <div
                className={cn(
                  "mx-auto flex h-32 w-32 items-center justify-center rounded-full",
                  isSelected("delivery") ? "bg-[#f3d7e1]" : "bg-[#f1f1f1]",
                )}
              >
                <Truck
                  className={cn(
                    "h-14 w-14",
                    isSelected("delivery") ? "text-[#ef3d7f]" : "text-[#b9bfc7]",
                  )}
                />
              </div>

              <p className="mt-10 text-3xl font-black tracking-tight text-[#08122d]">
                توصيل للمنزل
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleSelect("pickup")}
              disabled={isLocked}
              className={cn(
                "relative min-h-[18rem] rounded-[2rem] border-2 bg-[#f8f8f8] px-6 py-8 text-center transition-all duration-200",
                isSelected("pickup")
                  ? "border-[#ef3d7f] shadow-[0_20px_50px_rgba(239,61,127,0.16)]"
                  : "border-[#dfe3e7]",
              )}
            >
              {isSelected("pickup") ? (
                <span className="absolute -right-4 -top-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#ef3d7f] text-white shadow-[0_10px_25px_rgba(239,61,127,0.28)]">
                  <Check className="h-7 w-7" />
                </span>
              ) : null}

              <div
                className={cn(
                  "mx-auto flex h-32 w-32 items-center justify-center rounded-full",
                  isSelected("pickup") ? "bg-[#f3d7e1]" : "bg-[#efe1bb]",
                )}
              >
                <Store
                  className={cn(
                    "h-14 w-14",
                    isSelected("pickup") ? "text-[#ef3d7f]" : "text-[#f1b514]",
                  )}
                />
              </div>

              <p className="mt-10 text-3xl font-black tracking-tight text-[#08122d]">
                استلام من المحل
              </p>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
