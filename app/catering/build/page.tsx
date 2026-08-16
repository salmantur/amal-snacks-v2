"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CateringBuilder } from "@/components/catering-builder"
import { getCateringTier } from "@/lib/catering"

function CateringBuildContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tier = getCateringTier(searchParams.get("tier") ?? "")

  useEffect(() => {
    if (!tier) router.replace("/catering")
  }, [tier, router])

  if (!tier) return null

  return <CateringBuilder tier={tier} />
}

export default function CateringBuildPage() {
  return (
    <Suspense fallback={null}>
      <CateringBuildContent />
    </Suspense>
  )
}
