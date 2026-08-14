export type HomeLayoutVariant = "editorial" | "studio" | "soft" | "market" | "classic"

export interface HomeLayoutConfig {
  variant: HomeLayoutVariant
}

export const DEFAULT_HOME_LAYOUT_CONFIG: HomeLayoutConfig = {
  variant: "editorial",
}

export const HOME_LAYOUT_VARIANTS: { value: HomeLayoutVariant; label: string; description: string }[] = [
  { value: "editorial", label: "تحريري", description: "التصميم الافتراضي الحالي" },
  { value: "studio", label: "ستوديو", description: "شبكة مصورة بأسلوب معرض" },
  { value: "soft", label: "ناعم", description: "ألوان هادئة ومساحات مريحة" },
  { value: "market", label: "سوق", description: "كثافة أعلى، أقرب لتطبيقات التوصيل" },
  { value: "classic", label: "كلاسيكي", description: "تخطيط الصفحة الرئيسية القديم" },
]

export function normalizeHomeLayoutConfig(raw: unknown): HomeLayoutConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_HOME_LAYOUT_CONFIG
  const data = raw as Partial<HomeLayoutConfig>
  const valid = HOME_LAYOUT_VARIANTS.some((v) => v.value === data.variant)
  return { variant: valid ? (data.variant as HomeLayoutVariant) : DEFAULT_HOME_LAYOUT_CONFIG.variant }
}
