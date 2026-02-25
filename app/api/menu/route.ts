import { NextResponse } from "next/server"
import { fetchMenuItems } from "@/lib/fetch-menu"

// Revalidate cache every 60 seconds
export const revalidate = 300

export async function GET() {
  const { data, error } = await fetchMenuItems()

  if (error && (!data || data.length === 0)) {
    return NextResponse.json(
      { error, data: null },
      {
        status: 500,
        headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
      }
    )
  }

  return NextResponse.json(
    { data, error },
    {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    }
  )
}