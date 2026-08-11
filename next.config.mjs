import bundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Compress responses
  compress: true,

  images: {
    // Serve modern formats (WebP/AVIF) — huge size reduction on mobile
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'eejlqdydoilbjpegxvbq.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // Cache images for 7 days
    minimumCacheTTL: 604800,
    // Reasonable device sizes for mobile-first
    deviceSizes: [390, 414, 768, 1024, 1280],
    imageSizes: [32, 64, 128, 256],
  },

  // Experimental features for faster builds and smaller bundles
  experimental: {
    optimizePackageImports: ['lucide-react', '@supabase/supabase-js'],
  },

  // @napi-rs/canvas ships a native .node binary - it must run as-is on the
  // server, not get bundled/rewritten by webpack/Turbopack.
  serverExternalPackages: ['@napi-rs/canvas'],

  // The print route reads a font file off disk at runtime (for the printer
  // ticket renderer) via a plain fs path, which Next's file tracer can miss -
  // force it into the deployed function bundle explicitly.
  outputFileTracingIncludes: {
    '/api/print-order': ['./app/fonts/thmanyah-sans/thmanyahsans-Regular.woff2'],
  },
}

export default withBundleAnalyzer(nextConfig)
