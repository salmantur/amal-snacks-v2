export interface CateringCardColors {
  background: string
  background_highlighted: string
  border: string
  text: string
  text_highlighted: string
  muted_text: string
  muted_text_highlighted: string
  accent: string
}

export const CATERING_CARD_COLORS_KEY = "catering_card_colors"

// Hex equivalents of the oklch() constants EditorialCateringLanding used to hardcode
// (components/home-layout-preview.tsx), so the first admin visit shows the exact
// colors already live rather than a jump.
export const DEFAULT_CATERING_CARD_COLORS: CateringCardColors = {
  background: "#ffffff",
  background_highlighted: "#0c0d12",
  border: "#dbdee5",
  text: "#0c0d12",
  text_highlighted: "#ffffff",
  muted_text: "#595d69",
  muted_text_highlighted: "#cececf",
  accent: "#c44037",
}

function normalizeHexColor(value: unknown, fallback: string): string {
  const raw = String(value || "").trim()
  return /^#[0-9a-fA-F]{6}$/.test(raw) ? raw : fallback
}

export function normalizeCateringCardColors(value: unknown): CateringCardColors {
  const raw = value && typeof value === "object" ? (value as Partial<CateringCardColors>) : {}

  return {
    background: normalizeHexColor(raw.background, DEFAULT_CATERING_CARD_COLORS.background),
    background_highlighted: normalizeHexColor(raw.background_highlighted, DEFAULT_CATERING_CARD_COLORS.background_highlighted),
    border: normalizeHexColor(raw.border, DEFAULT_CATERING_CARD_COLORS.border),
    text: normalizeHexColor(raw.text, DEFAULT_CATERING_CARD_COLORS.text),
    text_highlighted: normalizeHexColor(raw.text_highlighted, DEFAULT_CATERING_CARD_COLORS.text_highlighted),
    muted_text: normalizeHexColor(raw.muted_text, DEFAULT_CATERING_CARD_COLORS.muted_text),
    muted_text_highlighted: normalizeHexColor(raw.muted_text_highlighted, DEFAULT_CATERING_CARD_COLORS.muted_text_highlighted),
    accent: normalizeHexColor(raw.accent, DEFAULT_CATERING_CARD_COLORS.accent),
  }
}
