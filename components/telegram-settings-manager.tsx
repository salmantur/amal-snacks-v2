"use client"

import { useEffect, useMemo, useState } from "react"
import { BellRing, Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useTelegramConfig } from "@/hooks/use-telegram-config"
import { normalizeTelegramConfig, type TelegramConfig } from "@/lib/telegram"

export function TelegramSettingsManager() {
  const { config, loading, saveConfig } = useTelegramConfig()
  const [draft, setDraft] = useState<TelegramConfig>(config)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    setDraft(config)
  }, [config])

  const hasChanges = useMemo(
    () => JSON.stringify(normalizeTelegramConfig(draft)) !== JSON.stringify(normalizeTelegramConfig(config)),
    [draft, config]
  )

  function update(patch: Partial<TelegramConfig>) {
    setDraft((prev) => ({ ...prev, ...patch }))
  }

  async function handleSave() {
    setSaving(true)
    setStatus(null)
    try {
      await saveConfig(draft)
      setStatus("Saved.")
    } catch {
      setStatus("Failed to save.")
    } finally {
      setSaving(false)
    }
  }

  async function handleTest() {
    setTesting(true)
    setStatus(null)
    try {
      const response = await fetch("/api/notifications/telegram/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const data = (await response.json()) as { ok?: boolean; error?: string }
      if (!response.ok || !data.ok) {
        setStatus(data.error || "Telegram test failed.")
      } else {
        setStatus("Telegram test sent.")
      }
    } catch {
      setStatus("Telegram test failed.")
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-500">Loading...</div>
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-gray-600" />
            <h3 className="font-bold text-base">Telegram Alerts</h3>
          </div>
          <button
            type="button"
            onClick={() => update({ enabled: !draft.enabled })}
            className={cn(
              "h-10 px-4 rounded-full text-sm font-semibold transition-colors",
              draft.enabled ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"
            )}
          >
            {draft.enabled ? "Enabled" : "Disabled"}
          </button>
        </div>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-gray-700">Bot Token</span>
          <Input
            type="password"
            value={draft.botToken}
            onChange={(e) => update({ botToken: e.target.value })}
            placeholder="123456:ABC..."
            dir="ltr"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-gray-700">Chat ID</span>
          <Input
            value={draft.chatId}
            onChange={(e) => update({ chatId: e.target.value })}
            placeholder="-1001234567890"
            dir="ltr"
          />
        </label>

        <div className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2">
          <span className="text-sm font-medium text-gray-700">Auto notify on new order</span>
          <button
            type="button"
            onClick={() => update({ notifyOnNewOrder: !draft.notifyOnNewOrder })}
            className={cn(
              "h-9 px-3 rounded-full text-xs font-semibold",
              draft.notifyOnNewOrder ? "bg-primary text-primary-foreground" : "bg-gray-100 text-gray-600"
            )}
          >
            {draft.notifyOnNewOrder ? "ON" : "OFF"}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button type="button" onClick={handleSave} disabled={saving || !hasChanges} className="h-11 rounded-xl">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleTest}
            disabled={testing || !draft.enabled || !draft.botToken || !draft.chatId}
            className="h-11 rounded-xl"
          >
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="mr-1">Test</span>
          </Button>
        </div>

        {status ? <p className="text-xs text-gray-500">{status}</p> : null}
      </section>
    </div>
  )
}
