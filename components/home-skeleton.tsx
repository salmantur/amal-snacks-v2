// Instant-render fallback for the Suspense boundary around HomeData in
// app/page.tsx - shown while the (now cached, but still async) menu fetch
// resolves, so the customer sees a shaped, on-brand shell immediately
// instead of a blank white page. Colors match components/home-layout-preview.tsx's
// EditorialPreview so the swap-in doesn't flash.

const INK = "oklch(16% 0.01 280)"
const SURFACE = "oklch(98% 0.003 75)"
const IMG_BG = "oklch(93% 0.02 75)"
const BORDER = "oklch(93% 0.008 270)"

export function HomeSkeleton() {
  return (
    <div className="min-h-screen" dir="rtl" style={{ background: SURFACE }}>
      <div className="mx-auto flex min-h-screen max-w-[430px] flex-col" style={{ background: SURFACE }}>
        <div className="flex items-center justify-between px-5 pb-2.5 pt-[18px]">
          <span className="flex h-11 w-11 items-center justify-center">
            <span className="flex h-[34px] w-[34px] flex-col items-start justify-center gap-[5px]">
              <span className="h-[1.5px] w-[18px]" style={{ background: INK }} />
              <span className="h-[1.5px] w-[11px]" style={{ background: INK }} />
            </span>
          </span>
          <span className="font-serif-text text-[17px] font-black tracking-[0.2px]" style={{ color: INK }}>
            أمل سناك
          </span>
          <span className="h-11 w-11" />
        </div>

        <div className="px-5 pb-[22px] pt-5">
          <div className="h-9 w-2/3 animate-pulse rounded-full" style={{ background: IMG_BG }} />
        </div>

        <div className="px-5">
          <div className="flex gap-2 overflow-hidden border-b pb-3" style={{ borderColor: BORDER }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-20 flex-shrink-0 animate-pulse rounded-full" style={{ background: IMG_BG }} />
            ))}
          </div>
        </div>

        <div className="mt-2.5 px-5 pb-6">
          <div className="mb-3.5 h-4 w-24 animate-pulse rounded" style={{ background: IMG_BG }} />
          <div className="flex flex-col gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[280px] animate-pulse rounded-[24px]" style={{ background: IMG_BG }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
