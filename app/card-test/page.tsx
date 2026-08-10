"use client"

import { useMemo, useState, type MouseEvent } from "react"
import { useCart, type MenuItem } from "@/components/cart-provider"
import { SaudiRiyalIcon } from "@/components/ui/saudi-riyal-icon"
import { useMenu } from "@/hooks/use-menu"
import { useBestSellersConfig } from "@/hooks/use-best-sellers-config"
import { getBestSellerCandidates } from "@/lib/best-sellers"
import { cn } from "@/lib/utils"

/**
 * Isolated test page for comparing 5 product-card designs against the real live menu.
 * Not linked from anywhere in the app - reachable only by direct URL. Nothing here
 * touches the production home page or its components.
 */

type CardDesign = "2a" | "2b" | "1c" | "s1" | "s3" | "p1"

const DESIGNS: { id: CardDesign; label: string }[] = [
  { id: "2a", label: "2a — بلا حدود" },
  { id: "2b", label: "2b — بطاقة سوداء" },
  { id: "1c", label: "1c — إطار كريمي" },
  { id: "s1", label: "S1 — بطاقة مميزة أفقية" },
  { id: "s3", label: "S3 — بطاقة مميزة عمودية" },
  { id: "p1", label: "P1 — بطاقة عمودية كاملة العرض" },
]

function ImgPlaceholder({ item, className }: { item: MenuItem; className?: string }) {
  if (item.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={item.image} alt={item.name} className={cn("h-full w-full object-cover", className)} />
  }
  return (
    <div
      className={cn("flex h-full w-full items-center justify-center", className)}
      style={{ background: "repeating-linear-gradient(45deg,#eceae5 0 10px,#e4e1da 10px 20px)" }}
    />
  )
}

function Card2a({ item, onAdd }: { item: MenuItem; onAdd: (item: MenuItem, e: MouseEvent) => void }) {
  const [flashed, setFlashed] = useState(false)
  return (
    <div className="w-[210px] cursor-pointer transition-transform duration-200 hover:-translate-y-1 active:scale-[0.98]">
      <div className="relative aspect-square overflow-hidden rounded-[20px]">
        <ImgPlaceholder item={item} />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onAdd(item, e)
            setFlashed(true)
            window.setTimeout(() => setFlashed(false), 900)
          }}
          aria-label={`إضافة ${item.name} إلى السلة`}
          className={cn(
            "absolute left-2.5 top-2.5 flex h-[30px] w-[30px] items-center justify-center rounded-full border-none text-[15px] font-semibold leading-none shadow-[0_4px_10px_rgba(0,0,0,0.12)] backdrop-blur-md transition-transform active:scale-90",
            flashed ? "bg-green-600 text-white" : "bg-white/85 text-[#1e293b]"
          )}
        >
          {flashed ? "✓" : "+"}
        </button>
      </div>
      <div className="mt-4 text-right">
        <h3 className="m-0 text-[15px] font-semibold leading-[1.3] text-[#1e293b]">{item.name}</h3>
        <p className="mt-1.5 inline-flex items-center gap-1 text-[13px] font-medium tracking-[0.02em] text-[#a3a09a]">
          <span>{item.price}</span>
          <SaudiRiyalIcon className="h-[0.8em] w-[0.8em]" />
        </p>
      </div>
    </div>
  )
}

function Card2b({ item, onAdd }: { item: MenuItem; onAdd: (item: MenuItem, e: MouseEvent) => void }) {
  const [flashed, setFlashed] = useState(false)
  return (
    <div className="w-[210px] cursor-pointer rounded-[20px] bg-[#161513] p-3.5 transition-transform duration-200 hover:-translate-y-1 active:scale-[0.98]">
      <div className="relative aspect-square overflow-hidden rounded-[14px]">
        <ImgPlaceholder item={item} />
      </div>
      <div className="mt-4 flex items-end justify-between gap-2">
        <h3 className="m-0 text-[15px] font-semibold leading-[1.3] text-[#f5f3ee]">{item.name}</h3>
        <p className="m-0 flex flex-shrink-0 items-center gap-1 text-[14px] font-bold text-[#f5f3ee]">
          <span>{item.price}</span>
          <SaudiRiyalIcon className="h-[0.8em] w-[0.8em]" />
        </p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onAdd(item, e)
          setFlashed(true)
          window.setTimeout(() => setFlashed(false), 900)
        }}
        aria-label={`إضافة ${item.name} إلى السلة`}
        className={cn(
          "mt-3.5 h-[34px] w-full rounded-sm border text-[12px] font-medium tracking-[0.04em] transition-colors",
          flashed ? "border-transparent bg-[#f5f3ee] text-[#161513]" : "border-white/30 bg-transparent text-[#f5f3ee]"
        )}
      >
        {flashed ? "تمت" : "إضافة"}
      </button>
    </div>
  )
}

function Card1c({ item, onAdd }: { item: MenuItem; onAdd: (item: MenuItem, e: MouseEvent) => void }) {
  const [flashed, setFlashed] = useState(false)
  return (
    <div className="w-[220px] cursor-pointer rounded-[18px] border border-[#ece7de] bg-[#fdfbf8] p-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_30px_-16px_rgba(15,23,42,0.14)] active:scale-[0.98]">
      <div className="relative aspect-square overflow-hidden rounded-xl">
        <ImgPlaceholder item={item} />
      </div>
      <h3 className="m-0 mt-3 text-right text-[15px] font-bold leading-[1.3] text-[#1e293b]">{item.name}</h3>
      <div className="mt-2.5 h-px bg-[#ece7de]" />
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <p className="m-0 inline-flex items-center gap-1 text-[15px] font-extrabold text-[#a45c2f]">
          <span>{item.price}</span>
          <SaudiRiyalIcon className="h-[0.85em] w-[0.85em]" />
        </p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onAdd(item, e)
            setFlashed(true)
            window.setTimeout(() => setFlashed(false), 900)
          }}
          aria-label={`إضافة ${item.name} إلى السلة`}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] text-[15px] font-black leading-none transition-transform active:scale-90",
            flashed ? "border-[#a45c2f] bg-[#a45c2f] text-white" : "border-[#a45c2f] bg-transparent text-[#a45c2f]"
          )}
        >
          {flashed ? "✓" : "+"}
        </button>
      </div>
    </div>
  )
}

function CardS1({ item }: { item: MenuItem }) {
  return (
    <div
      className="w-[480px] max-w-full cursor-pointer overflow-hidden rounded-[34px] border border-[#ece6e6] p-4 shadow-[0_24px_55px_rgba(15,23,42,0.10)] transition-transform duration-200 hover:-translate-y-1 active:scale-[0.985]"
      style={{ background: "linear-gradient(135deg,#fcfbfa 0%,#f7f4ef 48%,#ffffff 100%)" }}
    >
      <div className="grid grid-cols-[1.08fr_0.92fr]">
        <div className="relative min-h-[220px] overflow-hidden rounded-[28px]">
          <ImgPlaceholder item={item} />
          <div
            className="absolute inset-y-0 end-0 w-[60px]"
            style={{ background: "linear-gradient(to left, rgba(255,255,255,0) 0%, rgba(255,255,255,0.78) 62%, rgba(255,255,255,1) 100%)" }}
          />
        </div>
        <div className="flex flex-col justify-center px-3 py-4 text-right">
          <h3 className="font-serif-text m-0 text-[28px] font-black leading-[0.95] text-black">{item.name}</h3>
          <p className="mt-3.5 text-[13px] leading-[1.7] text-black/85">{item.description}</p>
          <div className="mt-4">
            <span className="inline-flex items-center gap-1 rounded-[26px] bg-white px-5 py-3 text-[20px] font-black text-black shadow-[0_14px_28px_rgba(0,0,0,0.14)]">
              {item.price}
              <SaudiRiyalIcon className="h-[0.85em] w-[0.85em]" />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function CardS3({ item }: { item: MenuItem }) {
  return (
    <div className="w-[320px] max-w-full cursor-pointer overflow-hidden rounded-[36px] border border-[#e9d8d8] bg-white p-3 shadow-[0_24px_54px_rgba(15,23,42,0.14)] transition-transform duration-200 hover:-translate-y-1 active:scale-[0.985]">
      <div className="relative min-h-[420px] overflow-hidden rounded-[30px]">
        <ImgPlaceholder item={item} />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.48) 36%, rgba(255,255,255,0.86) 72%, rgba(255,255,255,0.95) 100%)",
          }}
        />
        <div className="absolute inset-x-0 top-0 px-[22px] pt-6 text-right">
          <span className="inline-flex rounded-full px-3.5 py-1 text-[13px] font-bold text-white" style={{ background: "rgba(200,164,77,0.8)" }}>
            صناعة يدوية فاخرة
          </span>
          <h3 className="m-0 mt-5 text-[32px] font-black leading-none text-[#10162f]">{item.name}</h3>
          <p className="ms-auto mt-4 max-w-[90%] text-[13px] leading-[1.7] text-[#10162f]/82">{item.description}</p>
        </div>
        <div className="absolute inset-x-0 bottom-0 px-[22px] pb-6 text-right">
          <div className="inline-flex items-center gap-1 text-[32px] font-black leading-none" style={{ color: "#f44784" }}>
            {item.price}
            <SaudiRiyalIcon className="h-[0.85em] w-[0.85em]" />
          </div>
        </div>
      </div>
    </div>
  )
}

function CardP1({ item, onAdd }: { item: MenuItem; onAdd: (item: MenuItem, e: MouseEvent) => void }) {
  const [count, setCount] = useState(0)
  return (
    <div className="flex w-full max-w-[420px] flex-col gap-3.5">
      <div className="relative h-[280px] overflow-hidden rounded-[24px] shadow-[0_16px_32px_-20px_rgba(20,15,10,0.32)]">
        <ImgPlaceholder item={item} />
        <div className="absolute left-3.5 top-3.5 flex h-8 items-center rounded-full bg-[#faf7f4]/88 px-3.5 text-[14px] font-extrabold text-[#1e293b] shadow-[0_1px_2px_rgba(0,0,0,0.06)] backdrop-blur-md">
          <PriceWithRiyal item={item} />
        </div>
      </div>
      <div className="flex flex-col items-center gap-1.5 px-2 text-center">
        <span className="font-serif-text text-[19px] font-black leading-[1.3] text-[#1e293b]">{item.name}</span>
        <p className="m-0 text-[13.5px] leading-[1.7] text-[#7a7266]">{item.description}</p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onAdd(item, e)
            setCount((c) => c + 1)
          }}
          className={cn(
            "mt-1 flex h-[42px] w-auto shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-5.5 text-[13px] font-bold leading-none text-white transition-colors",
            count > 0 ? "bg-[#1e293b]" : "bg-[#e94a3a]"
          )}
        >
          {count > 0 ? `في الطلب · ${count}` : "اضف للطلب"}
        </button>
      </div>
    </div>
  )
}

function PriceWithRiyal({ item }: { item: MenuItem }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span>{item.price}</span>
      <SaudiRiyalIcon className="h-[0.8em] w-[0.8em]" />
    </span>
  )
}

export default function CardTestPage() {
  const { menuItems, isLoading } = useMenu()
  const { addItem } = useCart()
  const { orderIds } = useBestSellersConfig()
  const [design, setDesign] = useState<CardDesign>("2a")

  const items = useMemo(() => getBestSellerCandidates(menuItems, orderIds).slice(0, 8), [menuItems, orderIds])

  const handleAdd = (item: MenuItem) => addItem(item, 1)

  return (
    <main dir="rtl" className="min-h-screen bg-[#f2ede4] px-5 py-8 font-sans">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-[13px] font-semibold text-amber-900">
          صفحة اختبار غير مرتبطة بالموقع — لمقارنة تصاميم بطاقة المنتج على بيانات حقيقية من "الأكثر طلبًا". الإضافة للسلة هنا تعمل فعليًا (سلة حقيقية).
        </div>

        <h1 className="font-serif-text m-0 mb-1 text-[28px] font-black text-[#1a1714]">تصاميم بطاقة المنتج</h1>
        <p className="m-0 mb-6 text-[14px] text-[#7a7266]">اختر تصميمًا لمعاينته على المنتجات الحقيقية أدناه.</p>

        <div className="mb-8 flex flex-wrap gap-2">
          {DESIGNS.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDesign(d.id)}
              className={cn(
                "rounded-full px-4 py-2 text-[13px] font-bold transition-colors",
                design === d.id ? "bg-[#1a1714] text-white" : "border border-[#ddd6c7] bg-white text-[#4a453c]"
              )}
            >
              {d.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-[#7a7266]">جاري التحميل…</p>
        ) : items.length === 0 ? (
          <p className="text-[#7a7266]">لا توجد منتجات لعرضها.</p>
        ) : design === "s1" || design === "s3" ? (
          <div className="flex flex-col items-start gap-6">
            {items.map((item) => (design === "s1" ? <CardS1 key={item.id} item={item} /> : <CardS3 key={item.id} item={item} />))}
          </div>
        ) : design === "p1" ? (
          <div className="mx-auto flex max-w-[420px] flex-col gap-9">
            {items.map((item) => (
              <CardP1 key={item.id} item={item} onAdd={handleAdd} />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-6">
            {items.map((item) =>
              design === "2a" ? (
                <Card2a key={item.id} item={item} onAdd={handleAdd} />
              ) : design === "2b" ? (
                <Card2b key={item.id} item={item} onAdd={handleAdd} />
              ) : (
                <Card1c key={item.id} item={item} onAdd={handleAdd} />
              )
            )}
          </div>
        )}
      </div>
    </main>
  )
}
