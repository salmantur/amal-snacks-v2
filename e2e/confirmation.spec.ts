import { test, expect, type Page } from "@playwright/test"

/**
 * The confirmation page is reached at the end of checkout via a `router.push`
 * carrying the order's details as query params (see app/checkout/page.tsx's
 * submit handler) - it renders entirely from `useSearchParams()` and doesn't
 * call Supabase itself, so it can be exercised directly without needing a
 * live backend or walking through the full menu-browsing -> checkout flow.
 *
 * wa.me is a real external domain this sandboxed environment has no route to,
 * so rather than letting `window.open()` actually try to navigate a popup
 * there (which just hangs/fails on a proxy tunnel error), `window.open` is
 * replaced with a spy before each page loads. That's also just a more direct
 * way to assert what URL the app tried to hand off to WhatsApp, without
 * depending on the real browser's popup-blocking heuristics for a
 * script-triggered (non-gesture) open.
 */
async function installWindowOpenSpy(page: Page) {
  await page.addInitScript(() => {
    ;(window as unknown as { __opens: string[] }).__opens = []
    window.open = (url?: string | URL) => {
      ;(window as unknown as { __opens: string[] }).__opens.push(String(url ?? ""))
      return null
    }
  })
}

function getOpens(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as unknown as { __opens: string[] }).__opens)
}

function confirmationUrl(params: Record<string, string>) {
  return `/confirmation?${new URLSearchParams(params).toString()}`
}

const WHATSAPP_TEXT = "طلب جديد\nشاي × 2 = 30 SAR"
const WA_LINK = `https://wa.me/966500000000?text=${encodeURIComponent(WHATSAPP_TEXT)}`

test.describe("Order confirmation page", () => {
  test("renders the order summary and auto-opens WhatsApp with the correct deep link", async ({ page }) => {
    await installWindowOpenSpy(page)

    await page.goto(
      confirmationUrl({
        name: "سلمان",
        area: "الخبر",
        total: "155",
        discount: "10",
        code: "SAVE10",
        type: "delivery",
        time: "اليوم - 5:00 م",
        wa: WA_LINK,
        waOpened: "0",
      })
    )

    // Order summary reflects the values passed through from checkout.
    await expect(page.getByText("سلمان")).toBeVisible()
    await expect(page.getByText("توصيل إلى الخبر")).toBeVisible()
    await expect(page.getByText("اليوم - 5:00 م")).toBeVisible()
    await expect(page.getByText(/عبر الكود SAVE10/)).toBeVisible()

    // Landing with waOpened=0 must auto-trigger the WhatsApp handoff exactly
    // once, with the number and message text preserved byte-for-byte.
    await page.waitForFunction(() => (window as unknown as { __opens: string[] }).__opens.length > 0)
    const opens = await getOpens(page)
    expect(opens).toHaveLength(1)
    const openedUrl = new URL(opens[0])
    expect(openedUrl.origin + openedUrl.pathname).toBe("https://wa.me/966500000000")
    expect(openedUrl.searchParams.get("text")).toBe(WHATSAPP_TEXT)

    await expect(page.getByRole("button", { name: /فتح واتساب مرة أخرى/ })).toBeVisible()
  })

  test("does not auto-open WhatsApp again when waOpened=1 (desktop already handed off from checkout)", async ({
    page,
  }) => {
    await installWindowOpenSpy(page)

    await page.goto(
      confirmationUrl({
        name: "سلمان",
        area: "",
        total: "50",
        discount: "0",
        code: "",
        type: "pickup",
        time: "",
        wa: WA_LINK,
        waOpened: "1",
      })
    )

    await expect(page.getByText("استلام من المحل")).toBeVisible()
    // Give any stray auto-open effect a moment to fire before asserting it didn't.
    await page.waitForTimeout(500)
    expect(await getOpens(page)).toEqual([])
    await expect(page.getByRole("button", { name: /فتح واتساب مرة أخرى/ })).toBeVisible()
  })

  test("editing the WhatsApp message changes the text sent on the manual send button's click", async ({ page }) => {
    await installWindowOpenSpy(page)

    await page.goto(
      confirmationUrl({
        name: "سلمان",
        area: "",
        total: "50",
        discount: "0",
        type: "pickup",
        wa: WA_LINK,
        waOpened: "1", // Suppress the auto-open effect so only the manual click is under test.
      })
    )

    await page.getByRole("button", { name: "تعديل" }).click()
    const textarea = page.getByLabel("نص رسالة واتساب")
    await textarea.fill("نص معدل من العميل")

    await page.getByRole("button", { name: /واتساب/ }).click()

    const opens = await getOpens(page)
    expect(opens).toHaveLength(1)
    expect(new URL(opens[0]).searchParams.get("text")).toBe("نص معدل من العميل")
  })

  test("shows a fallback message and disables sending when no wa param is present", async ({ page }) => {
    await page.goto(confirmationUrl({ name: "سلمان", area: "", total: "50", discount: "0", type: "pickup" }))

    const sendButton = page.getByRole("button", { name: "إرسال الطلب عبر واتساب" })
    await expect(sendButton).toBeDisabled()
  })
})
