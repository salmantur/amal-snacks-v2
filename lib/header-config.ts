export interface HeaderConfig {
  logo_text: string
  logo_image_url: string | null
  background_color: string
  icon_color: string
  menu_icon_style: "lines" | "dots" | "hidden"
}

export const DEFAULT_HEADER_CONFIG: HeaderConfig = {
  logo_text: "أمل سناك",
  logo_image_url: null,
  background_color: "#ffffff",
  icon_color: "#0f172a",
  menu_icon_style: "lines",
}

export function normalizeHeaderConfig(raw: unknown): HeaderConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_HEADER_CONFIG
  const data = raw as Partial<HeaderConfig>
  return {
    logo_text: typeof data.logo_text === "string" && data.logo_text.trim() ? data.logo_text : DEFAULT_HEADER_CONFIG.logo_text,
    logo_image_url: typeof data.logo_image_url === "string" && data.logo_image_url.trim() ? data.logo_image_url : null,
    background_color:
      typeof data.background_color === "string" && data.background_color.trim()
        ? data.background_color
        : DEFAULT_HEADER_CONFIG.background_color,
    icon_color: typeof data.icon_color === "string" && data.icon_color.trim() ? data.icon_color : DEFAULT_HEADER_CONFIG.icon_color,
    menu_icon_style:
      data.menu_icon_style === "dots" || data.menu_icon_style === "hidden" ? data.menu_icon_style : DEFAULT_HEADER_CONFIG.menu_icon_style,
  }
}
