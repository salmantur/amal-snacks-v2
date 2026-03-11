export interface BestSellerCardConfig {
  card_height: number
  card_radius: number
  content_width_percent: number
  content_right_px: number
  content_top_percent: number
  title_size_px: number
  description_size_px: number
  price_size_px: number
  size_dot_px: number
  size_label_px: number
  title_description_gap_px: number
  description_price_gap_px: number
  price_sizes_gap_px: number
  overlay_lead_alpha: number
  overlay_mid_alpha: number
  overlay_end_alpha: number
  overlay_mid_stop_percent: number
  overlay_end_stop_percent: number
}

export const BEST_SELLER_CARD_CONFIG_KEY = "best_seller_card_style_v2"

export const DEFAULT_BEST_SELLER_CARD_CONFIG: BestSellerCardConfig = {
  card_height: 360,
  card_radius: 30,
  content_width_percent: 48,
  content_right_px: 20,
  content_top_percent: 50,
  title_size_px: 34,
  description_size_px: 15,
  price_size_px: 28,
  size_dot_px: 40,
  size_label_px: 14,
  title_description_gap_px: 12,
  description_price_gap_px: 20,
  price_sizes_gap_px: 20,
  overlay_lead_alpha: 0.1,
  overlay_mid_alpha: 0.62,
  overlay_end_alpha: 0.98,
  overlay_mid_stop_percent: 55,
  overlay_end_stop_percent: 72,
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function toNumber(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function normalizeBestSellerCardConfig(value: unknown): BestSellerCardConfig {
  const raw = value && typeof value === "object" ? (value as Partial<BestSellerCardConfig>) : {}

  return {
    card_height: clamp(Math.round(toNumber(raw.card_height, DEFAULT_BEST_SELLER_CARD_CONFIG.card_height)), 280, 520),
    card_radius: clamp(Math.round(toNumber(raw.card_radius, DEFAULT_BEST_SELLER_CARD_CONFIG.card_radius)), 16, 48),
    content_width_percent: clamp(
      Math.round(toNumber(raw.content_width_percent, DEFAULT_BEST_SELLER_CARD_CONFIG.content_width_percent)),
      30,
      62
    ),
    content_right_px: clamp(Math.round(toNumber(raw.content_right_px, DEFAULT_BEST_SELLER_CARD_CONFIG.content_right_px)), 8, 48),
    content_top_percent: clamp(
      Math.round(toNumber(raw.content_top_percent, DEFAULT_BEST_SELLER_CARD_CONFIG.content_top_percent)),
      28,
      72
    ),
    title_size_px: clamp(Math.round(toNumber(raw.title_size_px, DEFAULT_BEST_SELLER_CARD_CONFIG.title_size_px)), 24, 52),
    description_size_px: clamp(
      Math.round(toNumber(raw.description_size_px, DEFAULT_BEST_SELLER_CARD_CONFIG.description_size_px)),
      12,
      24
    ),
    price_size_px: clamp(Math.round(toNumber(raw.price_size_px, DEFAULT_BEST_SELLER_CARD_CONFIG.price_size_px)), 20, 40),
    size_dot_px: clamp(Math.round(toNumber(raw.size_dot_px, DEFAULT_BEST_SELLER_CARD_CONFIG.size_dot_px)), 24, 56),
    size_label_px: clamp(Math.round(toNumber(raw.size_label_px, DEFAULT_BEST_SELLER_CARD_CONFIG.size_label_px)), 10, 20),
    title_description_gap_px: clamp(
      Math.round(toNumber(raw.title_description_gap_px, DEFAULT_BEST_SELLER_CARD_CONFIG.title_description_gap_px)),
      4,
      28
    ),
    description_price_gap_px: clamp(
      Math.round(toNumber(raw.description_price_gap_px, DEFAULT_BEST_SELLER_CARD_CONFIG.description_price_gap_px)),
      6,
      36
    ),
    price_sizes_gap_px: clamp(
      Math.round(toNumber(raw.price_sizes_gap_px, DEFAULT_BEST_SELLER_CARD_CONFIG.price_sizes_gap_px)),
      6,
      40
    ),
    overlay_lead_alpha: clamp(toNumber(raw.overlay_lead_alpha, DEFAULT_BEST_SELLER_CARD_CONFIG.overlay_lead_alpha), 0, 0.4),
    overlay_mid_alpha: clamp(toNumber(raw.overlay_mid_alpha, DEFAULT_BEST_SELLER_CARD_CONFIG.overlay_mid_alpha), 0.2, 0.9),
    overlay_end_alpha: clamp(toNumber(raw.overlay_end_alpha, DEFAULT_BEST_SELLER_CARD_CONFIG.overlay_end_alpha), 0.6, 1),
    overlay_mid_stop_percent: clamp(
      Math.round(toNumber(raw.overlay_mid_stop_percent, DEFAULT_BEST_SELLER_CARD_CONFIG.overlay_mid_stop_percent)),
      40,
      72
    ),
    overlay_end_stop_percent: clamp(
      Math.round(toNumber(raw.overlay_end_stop_percent, DEFAULT_BEST_SELLER_CARD_CONFIG.overlay_end_stop_percent)),
      58,
      92
    ),
  }
}

export function buildBestSellerOverlay(config: BestSellerCardConfig): string {
  return `linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,${config.overlay_lead_alpha}) 34%, rgba(255,255,255,${config.overlay_mid_alpha}) ${config.overlay_mid_stop_percent}%, rgba(255,255,255,${config.overlay_end_alpha}) ${config.overlay_end_stop_percent}%, rgba(255,255,255,1) 100%)`
}
