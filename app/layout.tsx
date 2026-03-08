import React from "react"
import type { Metadata, Viewport } from 'next'
import { Tajawal } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/components/cart-provider'
import { ThemeLoader } from '@/components/theme-loader'
import { WebVitalsReporter } from "@/components/web-vitals-reporter"

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '700', '800'],
  variable: '--font-tajawal',
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: 'أمل سناك | Amal Snacks',
  description: 'أفضل الوجبات المثلجة والساخنة بجودة عالمية مختارة لك',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'أمل سناك' },
  openGraph: {
    title: 'أمل سناك | Amal Snacks',
    description: 'أفضل الوجبات المثلجة والساخنة بجودة عالمية مختارة لك',
    type: 'website',
    locale: 'ar_SA',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'أمل سناك | Amal Snacks',
    description: 'أفضل الوجبات المثلجة والساخنة بجودة عالمية مختارة لك',
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#FB7185',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const themePreloadScript = `
    (function () {
      try {
        var raw = localStorage.getItem("amal_theme_colors");
        if (!raw) return;
        var cfg = JSON.parse(raw);
        if (!cfg) return;
        var root = document.documentElement;
        function hexToHsl(hex) {
          if (!hex || typeof hex !== "string" || hex.length < 7) return null;
          var r = parseInt(hex.slice(1, 3), 16) / 255;
          var g = parseInt(hex.slice(3, 5), 16) / 255;
          var b = parseInt(hex.slice(5, 7), 16) / 255;
          var max = Math.max(r, g, b), min = Math.min(r, g, b);
          var h = 0, s = 0, l = (max + min) / 2;
          if (max !== min) {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
            else if (max === g) h = ((b - r) / d + 2) / 6;
            else h = ((r - g) / d + 4) / 6;
          }
          return Math.round(h * 360) + " " + Math.round(s * 100) + "% " + Math.round(l * 100) + "%";
        }
        if (cfg.primary) root.style.setProperty("--primary", hexToHsl(cfg.primary));
        if (cfg.primary_foreground) root.style.setProperty("--primary-foreground", hexToHsl(cfg.primary_foreground));
        if (cfg.primary) root.style.setProperty("--ring", hexToHsl(cfg.primary));
        if (cfg.checkout_green) root.style.setProperty("--checkout-green", cfg.checkout_green);
        if (cfg.background) {
          var bg = hexToHsl(cfg.background);
          root.style.setProperty("--background", bg);
          root.style.setProperty("--card", bg);
        }
        if (cfg.bar_background) {
          root.style.setProperty("--bar-background", cfg.bar_background);
          var bar = hexToHsl(cfg.bar_background);
          root.style.setProperty("--muted", bar);
          root.style.setProperty("--amal-grey", bar);
        }
        if (cfg.item_card_background) root.style.setProperty("--item-card-bg", cfg.item_card_background);
        if (cfg.item_card_title) root.style.setProperty("--item-card-title", cfg.item_card_title);
        if (cfg.item_card_description) root.style.setProperty("--item-card-desc", cfg.item_card_description);
        if (cfg.item_card_price) root.style.setProperty("--item-card-price", cfg.item_card_price);
      } catch (e) {}
    })();
  `

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://eejlqdydoilbjpegxvbq.supabase.co" />
        <link rel="dns-prefetch" href="https://eejlqdydoilbjpegxvbq.supabase.co" />
        <link rel="preconnect" href="https://wa.me" />
        <link rel="dns-prefetch" href="https://wa.me" />
        <script dangerouslySetInnerHTML={{ __html: themePreloadScript }} />
      </head>
      <body className={`${tajawal.variable} font-sans antialiased`}>
        <CartProvider>
          <WebVitalsReporter />
          <ThemeLoader />
          {children}
        </CartProvider>
      </body>
    </html>
  )
}
