import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  // Your Amal Snacks Database URL
  const SUPABASE_URL = "https://eejlqdydoilbjpegxvbq.supabase.co"

  // Your Correct 'anon' Key
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlamxxZHlkb2lsYmpwZWd4dmJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMjE4MTQsImV4cCI6MjA4NTc5NzgxNH0.J5pQRDXpjYWpoNqmpmh-3KRICK9ijcL0NRe06405JYA"

  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

