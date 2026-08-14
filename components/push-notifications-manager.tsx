"use client"

import { BellRing, Loader2, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePushSubscriptions } from "@/hooks/use-push-subscriptions"

export function PushNotificationsManager() {
  const { status, busy, error, isSupported, needsHomeScreen, subscribe, unsubscribe } = usePushSubscriptions()

  return (
    <section className="rounded-2xl border border-admin-border-soft bg-white p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Smartphone className="h-5 w-5 text-admin-muted" />
        <h3 className="font-bold text-base">Push Notifications</h3>
      </div>

      <p className="text-sm text-admin-muted-2">
        Get a phone notification for every new order, even when this page isn&apos;t open. Free, no Telegram required.
      </p>

      {!isSupported ? (
        <p className="rounded-xl border border-admin-border-soft bg-admin-bg px-3 py-2 text-sm text-admin-muted-2">
          هذا المتصفح لا يدعم الإشعارات.
        </p>
      ) : needsHomeScreen ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800" dir="rtl">
          على الآيفون: أضف هذا الموقع إلى الشاشة الرئيسية أولاً (زر المشاركة ← إضافة إلى الشاشة الرئيسية)، ثم افتحه من هناك لتفعيل الإشعارات.
        </p>
      ) : (
        <div className="flex items-center justify-between rounded-xl border border-admin-border-soft px-3 py-2">
          <div className="flex items-center gap-2">
            <BellRing className="h-4 w-4 text-admin-muted" />
            <span className="text-sm font-medium text-admin-muted">
              {status === "subscribed" ? "Enabled on this device" : status === "denied" ? "Blocked in browser settings" : "Not enabled on this device"}
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            variant={status === "subscribed" ? "secondary" : "default"}
            disabled={busy || status === "checking" || status === "denied"}
            onClick={() => (status === "subscribed" ? unsubscribe() : subscribe())}
            className="rounded-full"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : status === "subscribed" ? "Disable" : "Enable"}
          </Button>
        </div>
      )}

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </section>
  )
}
