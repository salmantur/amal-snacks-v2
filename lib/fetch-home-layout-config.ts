import { createClient } from "@supabase/supabase-js"
import { DEFAULT_HOME_LAYOUT_CONFIG, normalizeHomeLayoutConfig, type HomeLayoutConfig } from "@/lib/home-layout-config"

export async function fetchHomeLayoutConfig(): Promise<HomeLayoutConfig> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await supabase.from("app_settings").select("value").eq("key", "home_layout_config").single()
    return normalizeHomeLayoutConfig(data?.value)
  } catch {
    return DEFAULT_HOME_LAYOUT_CONFIG
  }
}
