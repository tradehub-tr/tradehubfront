/**
 * E2E — currencyService IndexedDB persist davranışı (Task 6).
 *
 * Backend lokalde ayakta değil — `page.route()` ile mock'lanır. Para birimi
 * endpoint'i `tradehub_core.api.currency.get_currency_settings` (api() →
 * Frappe `{ message: CurrencySettings }` zarfı). `initCurrency()` ortak
 * header/sayfa bootstrap'ları üzerinden tüm sayfalarda çağrılır.
 *
 * Migrasyon SONRASI: queryFetch + IndexedDB persister ilk yüklemenin sonucunu
 * saklar → 2. sayfa yüklemesi cache'ten okur, yeni fetch atılmaz.
 *
 * NOT (red→green sınırlaması): Migrasyon ÖNCESİ kod da rate'leri localStorage'da
 * cache'liyordu (TTL 30 dk), bu yüzden 2. navigasyonda eski kod da refetch
 * yapmayabilirdi. Dolayısıyla bu test "navigasyonlar arası refetch yok" guard'ı
 * olarak YEŞİL doğrular; eski localStorage rate-cache'in kaldırıldığı diff ile
 * teyit edilir.
 */
import { test, expect, type Route, type Page } from "@playwright/test";

const CURRENCY_SETTINGS = {
  currencies: [
    { code: "USD", symbol: "$", name: "US Dollar", nameTr: "Amerikan Doları", decimalPlaces: 2 },
    { code: "EUR", symbol: "€", name: "Euro", nameTr: "Euro", decimalPlaces: 2 },
    { code: "TRY", symbol: "₺", name: "Turkish Lira", nameTr: "Türk Lirası", decimalPlaces: 2 },
  ],
  rates: {
    USD: { USD: 1, EUR: 0.92, TRY: 38.5 },
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

test("currency rates fetched once across navigations (IndexedDB persist)", async ({ page }) => {
  await mockBackend(page);

  // Specific currency route registered AFTER the catch-all: Playwright matches
  // most-recently-added routes first, so this takes precedence over **/method/**.
  let rateRequests = 0;
  await page.route(
    "**/api/method/tradehub_core.api.currency.get_currency_settings*",
    (route: Route) => {
      rateRequests++;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: CURRENCY_SETTINGS }),
      });
    }
  );

  await page.goto("/pages/products.html");
  await page.waitForLoadState("networkidle");
  // Persister'ın IndexedDB'ye yazması async — 2. navigasyondan önce yazımı bekle.
  await page.waitForTimeout(1500);
  const first = rateRequests;

  await page.goto("/pages/cart.html");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  expect(first).toBeGreaterThanOrEqual(1);
  expect(rateRequests).toBe(first); // 2. yükleme: IndexedDB'den, yeni fetch yok
});
