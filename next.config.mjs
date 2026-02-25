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
}

export default nextConfig
