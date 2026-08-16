export interface CateringPhotosConfig {
  photos: (string | null)[]
}

export const CATERING_PHOTOS_KEY = "catering_photos"
export const CATERING_PHOTOS_SLOT_COUNT = 4

export const DEFAULT_CATERING_PHOTOS_CONFIG: CateringPhotosConfig = {
  photos: Array(CATERING_PHOTOS_SLOT_COUNT).fill(null),
}

export function normalizeCateringPhotosConfig(value: unknown): CateringPhotosConfig {
  const raw = value && typeof value === "object" ? (value as Partial<CateringPhotosConfig>) : {}
  const rawPhotos = Array.isArray(raw.photos) ? raw.photos : []

  const photos: (string | null)[] = []
  for (let i = 0; i < CATERING_PHOTOS_SLOT_COUNT; i++) {
    const entry = rawPhotos[i]
    photos.push(typeof entry === "string" && entry.trim() ? entry.trim() : null)
  }

  return { photos }
}
