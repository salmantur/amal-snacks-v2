"use client"

import dynamic from "next/dynamic"
import { AdminPageHeader } from "../page-header"

const TelegramSettingsManager = dynamic(
  () => import("@/components/telegram-settings-manager").then((m) => ({ default: m.TelegramSettingsManager })),
  { loading: () => <div className="py-16 text-center text-sm text-muted-foreground">جارِ التحميل...</div> }
)

const PushNotificationsManager = dynamic(
  () => import("@/components/push-notifications-manager").then((m) => ({ default: m.PushNotificationsManager })),
  { loading: () => <div className="py-16 text-center text-sm text-muted-foreground">جارِ التحميل...</div> }
)

export default function AlertsPage() {
  return (
    <div dir="rtl">
      <AdminPageHeader title="تنبيهات الطلبات" />
      <div className="mx-auto max-w-lg space-y-4 p-4 md:p-6">
        <PushNotificationsManager />
        <TelegramSettingsManager />
      </div>
    </div>
  )
}
