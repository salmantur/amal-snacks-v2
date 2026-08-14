import webpush from "web-push"
import type { NewOrderPushPayload, PushSubscriptionRecord } from "@/lib/push"

let configured = false

function ensureConfigured(): boolean {
  if (configured) return true
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) return false
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@amalsnacks.com", publicKey, privateKey)
  configured = true
  return true
}

export async function sendPushToSubscriptions(
  subscriptions: PushSubscriptionRecord[],
  payload: NewOrderPushPayload
): Promise<{ staleEndpoints: string[] }> {
  const staleEndpoints: string[] = []
  if (subscriptions.length === 0 || !ensureConfigured()) return { staleEndpoints }

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          JSON.stringify(payload)
        )
      } catch (error) {
        const statusCode = (error as { statusCode?: number })?.statusCode
        if (statusCode === 404 || statusCode === 410) {
          staleEndpoints.push(sub.endpoint)
        } else {
          console.error("Push send failed", statusCode, error instanceof Error ? error.message : error)
        }
      }
    })
  )

  return { staleEndpoints }
}
