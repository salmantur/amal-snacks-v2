import { Suspense } from "react"
import { unstable_cache } from "next/cache"
import { SWRConfig } from "swr"
import type { Metadata } from "next"
import { HomeLayoutPreview } from "@/components/home-layout-preview"
import { HomeSkeleton } from "@/components/home-skeleton"
import { fetchMenuItems } from "@/lib/fetch-menu"
import { decodeMenuItems } from "@/lib/text"

export const metadata: Metadata = {
  title: "كاترينج المناسبات | أمل سناك",
  description: "باقات كاترينج جاهزة لأي مناسبة — اختر باقتك وخصص أطباقك مع أمل سناك",
}

// Same cached menu fetch as app/page.tsx (same cache tag, so both share one
// warm entry) - /catering renders the same editorial home shell (header,
// sticky category bar) with the "كاترينج المناسبات" pill active, so it needs
// the same menu data available for switching back to a regular category.
const getCachedMenu = unstable_cache(async () => fetchMenuItems(), ["home-page-menu"], {
  revalidate: 30,
  tags: ["menu"],
})

async function CateringData() {
  const { data, error } = await getCachedMenu()
  const menuFallback = { data: decodeMenuItems(data), error }

  return (
    <SWRConfig value={{ fallback: { "/api/menu": menuFallback } }}>
      <HomeLayoutPreview variant="editorial" />
    </SWRConfig>
  )
}

export default function CateringPage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <CateringData />
    </Suspense>
  )
}
