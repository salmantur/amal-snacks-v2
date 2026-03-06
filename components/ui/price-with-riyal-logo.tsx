import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { SaudiRiyalIcon } from "@/components/ui/saudi-riyal-icon"

interface PriceWithRiyalLogoProps {
  value: ReactNode
  className?: string
  iconClassName?: string
}

export function PriceWithRiyalLogo({ value, className, iconClassName }: PriceWithRiyalLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-1 align-middle", className)}>
      <span>{value}</span>
      <SaudiRiyalIcon className={cn("h-[0.9em] w-[0.9em]", iconClassName)} />
    </span>
  )
}

