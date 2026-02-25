import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  const SUPABASE_URL = "https://eejlqdydoilbjpegxvbq.supabase.co"
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlamxxZHlkb2lsYmpwZWd4dmJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMjE4MTQsImV4cCI6MjA4NTc5NzgxNH0.J5pQRDXpjYWpoNqmpmh-3KRICK9ijcL0NRe06405JYA"

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Can be ignored in Server Components
        }
      },
    },
  })
}
