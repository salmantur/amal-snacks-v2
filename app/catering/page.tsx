import type { Metadata } from "next"
import { CateringFlow } from "@/components/catering-flow"

export const metadata: Metadata = {
  title: "كاترينج المناسبات | أمل سناك",
  description: "باقات كاترينج جاهزة لأي مناسبة — اختر باقتك وخصص أطباقك مع أمل سناك",
}

export default function CateringPage() {
  return <CateringFlow />
}
