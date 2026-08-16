# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Amal Snacks — a Next.js 16 (App Router) storefront + admin back-office for an Arabic-language snacks/food business in Saudi Arabia. Customers browse the menu and check out anonymously (no accounts); orders are placed via a form and confirmed/handled over WhatsApp. Staff manage everything (menu, orders, banners, pricing, delivery areas, discounts) through `/admin`.

## Commands

```
npm run dev      # start dev server
npm run build    # production build
npm run start    # run production build
npm run lint     # eslint .
```

There is no test suite in this repo (no test runner configured, no `*.test.*`/`*.spec.*` files).

## Architecture

### Routing — flat App Router, no route groups

- `app/page.tsx` — public storefront home. Supports `?homeui=studio|soft|market` to preview alternate home layouts via `HomeLayoutPreview`.
- `app/checkout/page.tsx`, `app/confirmation/page.tsx` — checkout flow and post-order confirmation (builds a WhatsApp deep link).
- `app/admin/page.tsx` — admin dashboard: Kanban order board with realtime feed, plus tabs for banner/stock/categories/sales/colors/delivery/discounts/alerts editors.
- `app/admin/items/page.tsx` — menu item CRUD.
- `app/admin/login/page.tsx` — Supabase email/password sign-in.
- `app/api/*` — Route Handlers act as the only backend (no separate server):
  - `api/menu` — public GET, cached (`revalidate = 30`).
  - `api/menu/chat` — rate-limited (20 req/min/IP) proxy to Google Gemini (`gemini-1.5-flash-latest`) for a menu chat assistant. Requires `GEMINI_API_KEY` (not in `.env.example`).
  - `api/orders` — POST: validates with Zod and **re-prices every item server-side from the `menu` table**; never trusts client-submitted prices.
  - `api/vitals` — Web Vitals beacon receiver (just logs, no external sink).

  There used to be an `api/webhook/print` route here too: a Supabase DB-webhook receiver that auto-printed on every `orders` INSERT by pushing directly from Vercel to the printer's IP over the internet, which required forwarding a router port to the printer via a No-IP dynamic DNS hostname — with no authentication on the printer's own HTTP endpoint. That route has been removed. Auto-print on new orders can optionally be handled by `scripts/print-daemon/` (see its README), a standalone script meant to run on a device physically on the printer's LAN, subscribing to Supabase Realtime instead of being pushed to over the internet — not currently deployed (no always-on device on-site), kept for if/when one is added.

  There was also an `api/print-order` route for the manual "print" button in `/admin`, which had the same Vercel-reaches-the-printer-directly dependency as the old webhook. It's been replaced: the print button now builds the ticket and calls the printer's ePOS-Print endpoint **directly from the browser**, over HTTPS, using `lib/thermal-printer.ts`'s `buildTicketXml`/`sendTicketToPrinter` (a browser-canvas counterpart to `lib/print-ticket-server.ts`'s Node/`@napi-rs/canvas` renderer, which remains in use by `scripts/print-daemon/`). This requires the printer's ePOS-Print endpoint to run on HTTPS with a certificate each printing device trusts (browsers block a mixed-content `fetch` from this HTTPS-served app to a plain-`http://` LAN device) — see `/admin/printer` for the one-time setup note. It only works when the device pressing "print" is on the same LAN as the printer, which is expected here since staff print from on-site.

### Auth

- **`proxy.ts`** at the repo root is Next.js 16's renamed middleware convention (`export function proxy(request)` + `config.matcher`, replaces `middleware.ts`). It gates every `/admin/*` route except `/admin/login`: builds a Supabase SSR client from request cookies, calls `auth.getUser()`, redirects to `/admin/login` if unauthenticated.
- Auth is Supabase email/password only, for a small fixed set of staff accounts. There is no customer auth anywhere — the storefront and checkout are fully anonymous, and there's no role/permission system beyond "has a valid session."
- No service-role/admin Supabase key exists in the codebase; all writes (including from API routes) use the anon key and rely on RLS policies configured in the Supabase dashboard, not in this repo.

### Supabase clients — three separate constructions, don't mix them up

- `lib/supabase/client.ts` — browser client (`createBrowserClient`), used by client components/hooks for reads, mutations, and realtime subscriptions.
- `lib/supabase/server.ts` — server client (`createServerClient`) bound to `next/headers` `cookies()`, for RSC/server contexts.
- `proxy.ts` builds its own inline `createServerClient` bound to the `NextRequest`/`NextResponse` cookie jar, since middleware/proxy has no access to `next/headers`.
- Most `app/api/*` routes bypass both of the above and call `createClient(url, key)` from `@supabase/supabase-js` directly with the anon key.
- `lib/supabase/config.ts`'s `getSupabaseConfig()` returns placeholder values when `NEXT_PHASE === "phase-production-build"` so `next build` doesn't fail in environments without env vars configured; it throws otherwise if the URL/key are missing.

### Database (no migrations/types in-repo — schema lives only in Supabase)

Reconstructed from usage across `lib/orders.ts`, `app/api/orders/route.ts`, `lib/fetch-menu.ts`, `lib/delivery-areas.ts`:

- **`menu`** — product catalog (`name`, `name_en`, `price`, `category`, `ingredients` — doubles as variant options in `label::price` form, `in_stock`, `is_featured`, `images`, `package_items`, etc.).
- **`orders`** — `order_number`, `customer_name/phone/area`, `order_type` (`delivery`|`pickup`), `items` (jsonb), `subtotal`/`delivery_fee`/`total`, `status` (`pending`|`preparing`|`ready`|`delivered`), `scheduled_time`. Realtime-enabled; the admin dashboard's primary sync path is a `postgres_changes` subscription (`lib/orders.ts` `subscribeToOrders()`), with 60s polling as a fallback only.
- **`app_settings`** — generic `key`/`value` (jsonb) store acting as a de-facto CMS for everything admin-configurable: discount config, delivery areas, banner config, best-seller config, order-schedule config, theme colors. `lib/delivery-areas.ts` has a `legacy_table`/`fallback` tier system implying an older dedicated delivery-areas table may still exist.

There is no customer/user table.

### Config-as-`app_settings` hook pattern

Many `hooks/use-*-config.ts` files (`use-banner-config`, `use-best-sellers-config`, `use-delivery-areas`, `use-discount-config`, `use-order-schedule-config`, `use-theme-config`, etc.) all follow the same shape: client-side fetch of one row from `app_settings`, normalized into a typed config with `DEFAULT_*` fallbacks. When adding a new admin-editable setting, follow this existing pattern rather than creating a dedicated table.

### Cart / state management

- `components/cart-provider.tsx` — React Context, no external state library. Persists `items` and `deliveryInfo` to `localStorage` (`amal_cart_items`, `amal_delivery_info`) with a 7-day TTL and runtime shape validation before trusting stored JSON.
- Cart line identity is a composite key: `cartKey = id::sortedSelectedIngredients` (`getCartKey`) — the same product with different selected options are distinct line items, not quantity-merged.
- Menu data fetching uses SWR (`hooks/use-menu.ts`) against `/api/menu`, with a `decodePossibleMojibake()` pass (`lib/text.ts`) applied to every text field to repair UTF-8/Windows-1252 mojibake that comes from the DB/CSV imports.

### RTL / Arabic-first, no i18n framework

- `app/layout.tsx` sets `<html lang="ar" dir="rtl">`; `Tajawal` (Arabic+Latin) is the only font. There is effectively one hardcoded locale — no `next-intl`/`next-i18next`.
- `arabic-reshaper` is a listed dependency but is **not used anywhere in source** — don't rely on it being wired up.
- Arabic-text handling is ad hoc: `lib/text.ts` fixes mojibake; `lib/smart-search.ts` does Arabic diacritic/tatweel normalization plus an EN→AR keyboard-layout remap for fuzzy search.
- `lib/thermal-printer.ts` and `app/api/webhook/print/route.ts` render both Arabic and English on kitchen tickets since the thermal printer doesn't reliably shape Arabic; bilingual fields (`name`/`name_en`) exist for this reason.

### Styling

- `app/globals.css` is the live stylesheet (defines all CSS custom properties used by the Tailwind/shadcn theme). **`styles/globals.css` is a stale, unused leftover from the original scaffold** — don't edit it expecting it to take effect.
- Tailwind theme uses `hsl(var(--x))` CSS-variable tokens (shadcn convention) plus custom `amal-*` brand color tokens.
- shadcn/ui config lives in `components.json`; full component set lives in `components/ui/`. `components/` itself is flat (not split into `storefront/`/`admin/` subfolders) — components are distinguished by filename/purpose instead (e.g. cart: `cart-provider.tsx`/`cart-bar.tsx`/`cart-sheet.tsx`; admin editors: `*-manager.tsx`/`*-editor.tsx`).

### Path aliases

`@/*` maps to the repo root (there is no `src/` directory) — e.g. `@/components`, `@/lib/supabase/client`, `@/hooks/use-menu`.

### Linting

`eslint.config.mjs` deliberately disables several stricter Next/React/TS default rules project-wide: `react-hooks/immutability`, `react-hooks/set-state-in-effect`, `react-hooks/purity`, `react/no-unescaped-entities`, `@typescript-eslint/no-require-imports`, `prefer-const`, `@typescript-eslint/no-explicit-any`. This is intentional — don't "fix" these patterns unprompted.

### Environment variables

`.env.example` only lists `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `PRINTER_IP`. Also required by code but absent from `.env.example`:
- `GEMINI_API_KEY` — required for `/api/menu/chat` to function at all.
- `CHAT_API_SECRET` — optional; if unset, that endpoint's auth check is a no-op.

`scripts/print-daemon/` (the kitchen auto-print daemon, not part of the Vercel deploy) has its own separate `.env.example` — see its README.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` — alternate fallback key name accepted by `lib/supabase/config.ts`.

`next.config.mjs` also hardcodes a specific Supabase project ref in `images.remotePatterns` (`eejlqdydoilbjpegxvbq.supabase.co`) — update this if the Supabase project ever changes.
