# Kitchen print daemon

Prints kitchen tickets automatically when a new order comes in, by running
**on a device physically on the same LAN as the printer** instead of pushing
print jobs from Vercel over the internet.

## Why this exists

The previous setup forwarded a router port to the printer (via a No-IP
dynamic DNS hostname) so the Vercel-hosted `api/webhook/print` route could
reach it. That meant the printer's unauthenticated ePOS-Print HTTP endpoint
was reachable from the open internet — anyone who found the hostname/port
could send arbitrary print jobs or probe the printer's firmware.

This daemon only ever makes *outbound* connections (to Supabase). Nothing
needs to be reachable from the internet, so the router port forward and the
No-IP hostname can be removed once this is verified working.

## Setup

Requirements: a device that's always on and connected to both the internet
and the printer's LAN (e.g. a Raspberry Pi, or an existing on-site PC/mini
PC). Needs Node 18+. On Raspberry Pi, use a 64-bit OS — the printer-rendering
dependency (`@napi-rs/canvas`) doesn't ship prebuilt binaries for 32-bit ARM.

1. Clone this repo onto the device and `npm install` from the repo root.
2. Copy the env template and fill in your Supabase project's URL/anon key
   (same values as the main app's `.env`):
   ```
   cp scripts/print-daemon/.env.example scripts/print-daemon/.env
   ```
   The printer IP and Telegram alert settings are **not** set here — the
   daemon reads them live from the `app_settings` table (`printer_config`,
   `telegram_alerts`), same as the admin dashboard, so they stay in sync
   with whatever staff configure in `/admin`.
3. Install pm2 globally and start the daemon:
   ```
   npm install -g pm2
   pm2 start scripts/print-daemon/ecosystem.config.js
   pm2 save
   pm2 startup   # run the command it prints, so it survives reboots
   ```
4. Verify: place a test order and watch `pm2 logs amal-print-daemon`. You
   should see `Printed order #...`. If a print fails, or the connection to
   Supabase drops for more than ~5 minutes, the daemon sends a Telegram
   alert using the same bot/chat configured for order notifications
   (`app_settings.telegram_alerts`), if enabled.

## Once it's verified working

Two manual cleanup steps, not something this codebase can do for you:

1. **Remove the router port forward** pointed at the printer, and retire the
   No-IP hostname/DDNS entry — the printer no longer needs to be reachable
   from the internet.
2. **Remove the Supabase DB webhook** that used to call `api/webhook/print`
   on new order inserts (Database → Webhooks, in the Supabase dashboard) —
   that route no longer exists in the app.

## Known follow-up (out of scope here)

`app/api/print-order/route.ts` — the manual "print" button in `/admin` — also
calls the printer directly from Vercel, for the same reason the old webhook
did (the admin dashboard is served over HTTPS, so the browser can't fetch an
`http://` printer endpoint directly due to mixed-content restrictions). That
route has the same "printer must be reachable from Vercel" dependency this
daemon was built to remove for auto-print. Once the port forward above is
removed, the manual reprint button will stop working until it's migrated to
go through this daemon (or another LAN-local path) too — that migration
wasn't part of this change.
