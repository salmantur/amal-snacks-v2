import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const SUPABASE_URL = "https://eejlqdydoilbjpegxvbq.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlamxxZHlkb2lsYmpwZWd4dmJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMjE4MTQsImV4cCI6MjA4NTc5NzgxNH0.J5pQRDXpjYWpoNqmpmh-3KRICK9ijcL0NRe06405JYA"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only protect /admin routes (but not /admin/login itself)
  if (!pathname.startsWith("/admin") || pathname === "/admin/login") {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  // Not logged in → redirect to login page
  if (!user) {
    const loginUrl = new URL("/admin/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: ["/admin/:path*"],
}
