const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

export function getSupabaseConfig() {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    const isProductionBuild =
      typeof window === "undefined" &&
      (process.env.NEXT_PHASE === "phase-production-build" ||
        process.env.npm_lifecycle_event === "build")

    if (isProductionBuild) {
      return {
        url: "https://placeholder.supabase.co",
        publishableKey: "build-placeholder",
      }
    }

    throw new Error("Missing Supabase environment variables")
  }

  return {
    url: SUPABASE_URL,
    publishableKey: SUPABASE_PUBLISHABLE_KEY,
  }
}
