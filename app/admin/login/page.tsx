"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Lock } from "lucide-react"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة")
      setLoading(false)
    } else {
      router.push("/admin")
      router.refresh()
    }
  }

  return (
    <main className="min-h-screen bg-amal-grey flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-sm bg-background rounded-3xl shadow-xl p-8">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Lock className="h-8 w-8 text-primary" />
        </div>

        <h1 className="text-2xl font-bold text-center text-foreground mb-1">لوحة التحكم</h1>
        <p className="text-sm text-muted-foreground text-center mb-8">للموظفين فقط</p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@example.com"
              className="w-full px-4 py-3 rounded-xl bg-amal-grey border border-transparent focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-right"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-amal-grey border border-transparent focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-right"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center bg-red-50 py-2 px-4 rounded-xl">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-medium text-base hover:bg-primary/90 transition-colors disabled:opacity-60 mt-2"
          >
            {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
          </button>
        </form>
      </div>
    </main>
  )
}
