import { NextResponse } from "next/server"
import { fetchMenuItems } from "@/lib/fetch-menu"

// Keep the public menu fast on mobile while allowing admin changes to appear soon.
export const revalidate = 30

export async function GET() {
  const { data, error } = await fetchMenuItems()
  const cacheControl =
    process.env.NODE_ENV === "production"
      ? "public, s-maxage=30, stale-while-revalidate=300"
      : "no-store, max-age=0"

  if (error && (!data || data.length === 0)) {
    return NextResponse.json(
      { error, data: null },
      {
        status: 500,
        headers: { "Cache-Control": cacheControl },
      }
    )
  }

  return NextResponse.json(
    { data, error },
    {
      headers: { "Cache-Control": cacheControl },
    }
  )
}
