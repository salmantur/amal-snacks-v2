import { defineConfig, devices } from "@playwright/test"

const PORT = 3100

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || "/opt/pw-browsers/chromium",
        },
      },
    },
  ],
  webServer: {
    // A production build + `next start` instead of `next dev`: dev mode compiles
    // routes on-demand on first request, which is slow/variable enough that a
    // Playwright `.click()` issued right after `page.goto()` can land before
    // hydration finishes and silently do nothing (the click doesn't queue - it's
    // just lost). A prebuilt server hydrates near-instantly, so interactions are
    // deterministic.
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: {
      // No live Supabase project is available in this environment. These are
      // syntactically valid but unreachable, so client-side reads (e.g. ThemeLoader)
      // fail quietly instead of throwing "Missing Supabase environment variables" -
      // fine for the routes these e2e tests exercise, which don't depend on Supabase.
      NEXT_PUBLIC_SUPABASE_URL: "https://test-project.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    },
  },
})
