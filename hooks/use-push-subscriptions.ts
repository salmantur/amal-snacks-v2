"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { normalizePushSubscriptions, type PushSubscriptionRecord } from "@/lib/push"

const TABLE = "app_settings"
const KEY = "push_subscriptions"

export type PushStatus = "checking" | "unsupported" | "denied" | "subscribed" | "not-subscribed"

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

function deviceLabel(): string {
  if (typeof navigator === "undefined") return "جهاز"
  const ua = navigator.userAgent
  if (/iphone/i.test(ua)) return "آيفون"
  if (/ipad/i.test(ua)) return "آيباد"
  if (/android/i.test(ua)) return "أندرويد"
  return "متصفح"
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return true
  return window.matchMedia?.("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true
}

export function usePushSubscriptions() {
  const supabase = useMemo(() => createClient(), [])
  const [status, setStatus] = useState<PushStatus>("checking")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSupported = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window
  const needsHomeScreen = typeof navigator !== "undefined" && /iphone|ipad/i.test(navigator.userAgent) && !isStandalone()

  const refreshStatus = useCallback(async () => {
    if (!isSupported) {
      setStatus("unsupported")
      return
    }
    if (Notification.permission === "denied") {
      setStatus("denied")
      return
    }
    try {
      const registration = await navigator.serviceWorker.getRegistration("/sw.js")
      const existing = await registration?.pushManager.getSubscription()
      setStatus(existing ? "subscribed" : "not-subscribed")
    } catch {
      setStatus("not-subscribed")
    }
  }, [isSupported])

  useEffect(() => {
    refreshStatus()
  }, [refreshStatus])

  const subscribe = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      if (!isSupported) throw new Error("الإشعارات غير مدعومة على هذا الجهاز")
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!publicKey) throw new Error("لم يتم إعداد مفاتيح الإشعارات (VAPID) بعد")

      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        setStatus("denied")
        return
      }

      const registration = await navigator.serviceWorker.register("/sw.js")
      await navigator.serviceWorker.ready

      let subscription = await registration.pushManager.getSubscription()
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        })
      }

      const json = subscription.toJSON()
      const record: PushSubscriptionRecord = {
        endpoint: json.endpoint || "",
        keys: { p256dh: json.keys?.p256dh || "", auth: json.keys?.auth || "" },
        label: deviceLabel(),
        addedAt: new Date().toISOString(),
      }

      const { data } = await supabase.from(TABLE).select("value").eq("key", KEY).single()
      const current = normalizePushSubscriptions(data?.value)
      const next = [...current.filter((s) => s.endpoint !== record.endpoint), record]
      await supabase.from(TABLE).upsert({ key: KEY, value: next }, { onConflict: "key" })

      setStatus("subscribed")
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر تفعيل الإشعارات")
    } finally {
      setBusy(false)
    }
  }, [isSupported, supabase])

  const unsubscribe = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      const registration = await navigator.serviceWorker.getRegistration("/sw.js")
      const existing = await registration?.pushManager.getSubscription()
      const endpoint = existing?.endpoint
      if (existing) await existing.unsubscribe()

      if (endpoint) {
        const { data } = await supabase.from(TABLE).select("value").eq("key", KEY).single()
        const current = normalizePushSubscriptions(data?.value)
        const next = current.filter((s) => s.endpoint !== endpoint)
        await supabase.from(TABLE).upsert({ key: KEY, value: next }, { onConflict: "key" })
      }

      setStatus("not-subscribed")
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر إلغاء الإشعارات")
    } finally {
      setBusy(false)
    }
  }, [supabase])

  return { status, busy, error, isSupported, needsHomeScreen, subscribe, unsubscribe }
}
