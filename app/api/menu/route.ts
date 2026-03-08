import { NextResponse } from "next/server"
import { fetchMenuItems } from "@/lib/fetch-menu"

// Always serve fresh menu data so admin changes appear immediately.
export const revalidate = 0
export const dynamic = "force-dynamic"

export async function GET() {
  const { data, error } = await fetchMenuItems()
  const cacheControl = "no-store, max-age=0"

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
