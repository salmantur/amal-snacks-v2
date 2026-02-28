import React from "react"
import type { Metadata, Viewport } from 'next'
import { Tajawal } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/components/cart-provider'
import { ThemeLoader } from '@/components/theme-loader'

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
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://eejlqdydoilbjpegxvbq.supabase.co" />
        <link rel="dns-prefetch" href="https://eejlqdydoilbjpegxvbq.supabase.co" />
      </head>
      <body className={`${tajawal.variable} font-sans antialiased`}>
        <CartProvider>
          <ThemeLoader />
          {children}
        </CartProvider>
      </body>
    </html>
  )
}
