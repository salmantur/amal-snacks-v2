"use client"

import { useState } from "react"
import { Printer, Check, X } from "lucide-react"
import { usePrinterConfig } from "@/hooks/use-printer-config"
import { printOrder } from "@/lib/print-order-client"
import type { Order } from "@/lib/data"
import { AdminPageHeader } from "../page-header"

function buildTestOrder(): Order {
  return {
    id: "test",
    orderNumber: 0,
    customerName: "طباعة تجريبية",
    customerPhone: "0500000000",
    customerAddress: "—",
    orderType: "pickup",
    items: [{ name: "صنف تجريبي", quantity: 1, price: 0 }],
    total: 0,
    status: "pending",
    notes: "هذه طباعة تجريبية للتأكد من اتصال الطابعة",
    scheduledTime: null,
    createdAt: new Date(),
  }
}

export default function PrinterPage() {
  const { config, loading, saveConfig } = usePrinterConfig()
  const [ip, setIp] = useState("")
  const [saving, setSaving] = useState(false)
  const [savedNotice, setSavedNotice] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<"success" | string | null>(null)

  const currentIp = ip || config.ip

  async function handleSave() {
    setSaving(true)
    await saveConfig({ ip: currentIp })
    setSaving(false)
    setSavedNotice(true)
    setTimeout(() => setSavedNotice(false), 2000)
  }

  async function handleTestPrint() {
    setTesting(true)
    setTestResult(null)
    try {
      await printOrder(buildTestOrder(), { ip: currentIp })
      setTestResult("success")
    } catch (err) {
      setTestResult(err instanceof Error ? err.message : "فشل الاتصال بالطابعة")
    } finally {
      setTesting(false)
    }
  }

  return (
    <div dir="rtl">
      <AdminPageHeader title="الطابعة" description="عنوان الطابعة الحراري (IP) المستخدم لطباعة الطلبات" />

      <div className="mx-auto max-w-lg space-y-4 p-4 sm:p-8">
        <div className="rounded-lg border border-admin-border-soft bg-white p-4">
          <p className="mb-1 text-xs text-admin-muted-2">
            هذا الإعداد مشترك بين جميع الأجهزة — تعديله هنا يحدّثه فورًا لكل من يفتح لوحة التحكم،
            بما في ذلك الطباعة التلقائية عند استلام طلب جديد.
          </p>

          <label className="mt-3 block text-xs font-semibold text-admin-muted">عنوان IP</label>
          {loading ? (
            <div className="mt-1.5 h-11 animate-pulse rounded-lg bg-admin-bg" />
          ) : (
            <input
              type="text"
              defaultValue={config.ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="192.168.100.205"
              dir="ltr"
              className="mt-1.5 w-full rounded-lg bg-admin-bg px-3 py-2.5 font-admin-mono text-sm focus:outline-none"
            />
          )}

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || loading}
              className="flex items-center gap-2 rounded-lg bg-admin-ink px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              {saving ? "جاري الحفظ..." : "حفظ"}
            </button>
            {savedNotice ? <span className="text-xs font-semibold text-emerald-700">تم الحفظ ✓</span> : null}
          </div>
        </div>

        <div className="rounded-lg border border-admin-border-soft bg-white p-4">
          <p className="mb-3 text-sm font-bold text-admin-ink">اختبار الاتصال</p>
          <button
            type="button"
            onClick={() => void handleTestPrint()}
            disabled={testing || loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-admin-border bg-white p-3 text-sm font-semibold transition-colors hover:bg-admin-bg disabled:opacity-50"
          >
            <Printer className="h-4 w-4" />
            {testing ? "جاري الطباعة..." : "طباعة تجريبية"}
          </button>

          {testResult === "success" ? (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              <Check className="h-4 w-4 shrink-0" />
              تم الاتصال بالطابعة بنجاح
            </div>
          ) : testResult ? (
            <div className="mt-3 flex items-start gap-2 whitespace-pre-line rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              <X className="mt-0.5 h-4 w-4 shrink-0" />
              {testResult}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
