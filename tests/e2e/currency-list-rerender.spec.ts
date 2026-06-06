/**
 * E2E — currency picker rebuilds after async rates load (Task 6 follow-up).
 *
 * Regression: TopBar() renders synchronously at bootstrap, BEFORE initCurrency()
 * resolves. At first render only the 3 hard-coded defaults (TRY/USD/EUR) are
 * available, so `#currency-select` showed only those. After the async fetch
 * populated the full backend list there was NO re-render → a user whose
 * currency is e.g. GBP could not find it in the picker until a manual reload.
 *
 * Fix: currencyService fires "currency-changed" once initCurrency populates the
 * list; TopBar listens and rebuilds the `<option>` list + mobile pills,
 * preserving the selected value.
 *
 * This test mocks the endpoint to return MORE than the 3 defaults (adds GBP, CNY)
 * and asserts the extra currency ends up in `#currency-select` after load.
 *
 * Route-ordering caveat: the specific currency route must be registered AFTER
 * the catch-all api/method glob so Playwright (most-recently-added wins)
 * matches it first.
 */
import { test, expect, type Route, type Page } from "@playwright/test";

const CURRENCY_SETTINGS = {
  currencies: [
    { code: "TRY", symbol: "₺", name: "Turkish Lira", nameTr: "Türk Lirası", decimalPlaces: 2 },
    { code: "USD", symbol: "$", name: "US Dollar", nameTr: "Amerikan Doları", decimalPlaces: 2 },
    { code: "EUR", symbol: "€", name: "Euro", nameTr: "Euro", decimalPlaces: 2 },
    { code: "GBP", symbol: "£", name: "British Pound", nameTr: "İngiliz Sterlini", decimalPlaces: 2 },
    { code: "CNY", symbol: "¥", name: "Chinese Yuan", nameTr: "Çin Yuanı", decimalPlaces: 2 },
  ],
  rates: {
    USD: { USD: 1, EUR: 0.92, TRY: 38.5, GBP: 0.79, CNY: 7.25 },
  },
  defaultCurrency: "USD",
  detectedCountry: "US",
  baseCurrency: "USD",
};

async function mockBackend(page: Page): Promise<void> {
  await page.route("**/api/method/tradehub_core.api.v1.auth.get_session_user*", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: { user: "Guest", csrf_token: "test" } }),
    })
  );
  await page.route("**/api/method/**", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: { data: [] } }),
    })
  );
}

test("currency picker is rebuilt with backend currencies after async load", async ({ page }) => {
  await mockBackend(page);

  // Specific currency route AFTER the catch-all so it takes precedence.
  // Delay the response so the synchronous TopBar render definitely happens
  // first with only the defaults — proving the picker is rebuilt afterwards.
  await page.route(
    "**/api/method/tradehub_core.api.currency.get_currency_settings*",
    async (route: Route) => {
      await new Promise((r) => setTimeout(r, 250));
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: CURRENCY_SETTINGS }),
      });
    }
  );

  await page.goto("/pages/products.html");
  await page.waitForLoadState("networkidle");
  // initCurrency resolve + rebuild listener fire is async — settle determinism.
  await page.waitForTimeout(800);

  const select = page.locator("#currency-select");
  await expect(select).toHaveCount(1);

  // The extra backend currency (GBP) must be present after the async rebuild —
  // i.e. the picker was NOT left stuck on the 3 defaults.
  const gbpCount = await select.locator('option[value="GBP"]').count();
  expect(gbpCount).toBe(1);

  // Sanity: the full backend list is present (5 options), not just 3 defaults.
  const optionCount = await select.locator("option").count();
  expect(optionCount).toBe(5);
});
