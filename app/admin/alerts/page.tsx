"use client"

import dynamic from "next/dynamic"
import { AdminPageHeader } from "../page-header"

const TelegramSettingsManager = dynamic(
  () => import("@/components/telegram-settings-manager").then((m) => ({ default: m.TelegramSettingsManager })),
  { loading: () => <div className="py-16 text-center text-sm text-muted-foreground">جارِ التحميل...</div> }
)

export default function AlertsPage() {
  return (
    <div dir="rtl">
      <AdminPageHeader title="تنبيهات تيليجرام" />
      <div className="mx-auto max-w-lg p-4 md:p-6">
        <TelegramSettingsManager />
      </div>
    </div>
  )
}
