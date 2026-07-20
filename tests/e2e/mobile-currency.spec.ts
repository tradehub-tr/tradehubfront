/**
 * E2E — Mobil para birimi seçici (A1).
 *
 * BottomNav (mobil, `xl:hidden`) hesap overlay'inde Para Birimi satırı + dinamik picker.
 * Backend lokalde ayakta değil — `page.route()` ile mock'lanır.
 */
import { test, expect, type Route, type Page } from "@playwright/test";

const CURRENCY_SETTINGS = {
  currencies: [
    { code: "TRY", symbol: "₺", name: "Turkish Lira", nameTr: "Türk Lirası", decimalPlaces: 2 },
    { code: "USD", symbol: "$", name: "US Dollar", nameTr: "Amerikan Doları", decimalPlaces: 2 },
    { code: "EUR", symbol: "€", name: "Euro", nameTr: "Euro", decimalPlaces: 2 },
  ],
  rates: { USD: { USD: 1, TRY: 40, EUR: 0.9 }, TRY: { TRY: 1, USD: 0.025, EUR: 0.023 } },
  defaultCurrency: "TRY",
  detectedCountry: "TR",
  baseCurrency: "TRY",
};

async function mockBackend(page: Page): Promise<void> {
  await page.route("**/api/method/**", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: { data: [] } }),
    })
  );
  await page.route("**/api/method/tradehub_core.api.currency.get_currency_settings*", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: CURRENCY_SETTINGS }),
    })
  );
  await page.route("**/api/method/tradehub_core.api.v1.auth.get_session_user*", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: { user: "Guest", csrf_token: "test" } }),
    })
  );
}

test.describe("Mobil — para birimi seçici (A1)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    // Cookie banner mobilde bottom-nav'ın üstüne binip tıklamayı yutar — consent'i baştan ver.
    await page.addInitScript(() => {
      localStorage.setItem("istoc_cookie_prefs", '{"necessary":true,"analytics":false,"marketing":false}');
      const s = document.createElement("style");
      s.textContent = '[x-data="cookieBanner"]{display:none !important}';
      (document.head || document.documentElement).appendChild(s);
    });
    await mockBackend(page);
  });

  test("Hesap overlay'inde Para Birimi satırı 3 seçenekle açılmalı ve seçili işaretlenmeli", async ({
    page,
  }) => {
    await page.addInitScript(() => localStorage.setItem("tradehub-currency", "TRY"));
    await page.goto("/pages/products.html");

    await page.locator("#bottom-nav-account").click();
    const currencyBtn = page.locator("#account-currency-btn");
    await expect(currencyBtn).toBeVisible({ timeout: 10_000 });
    // Seçili birim değer satırında görünmeli (₺ TRY).
    await expect(page.locator("#account-currency-value")).toContainText("TRY");

    await currencyBtn.click();
    const picker = page.locator("#account-currency-picker");
    await expect(picker.locator("[data-currency-switch]")).toHaveCount(3);
    // Seçili (TRY) satırının check span'ı (2. span) görünür, seçili olmayan (USD) gizli olmalı.
    await expect(picker.locator('[data-currency-switch="TRY"] span').nth(1)).toBeVisible();
    await expect(picker.locator('[data-currency-switch="USD"] span').nth(1)).toBeHidden();

    await page.screenshot({ path: "test-results/mobile-currency-picker.png" });
  });

  test("Para birimi seçilince kaydedilip sayfa yenilenmeli", async ({ page }) => {
    // Yalnızca İLK yüklemede TRY tohumla — reload'da tekrar yazıp USD seçimini ezmesin.
    await page.addInitScript(() => {
      if (!sessionStorage.getItem("__cur_seeded")) {
        localStorage.setItem("tradehub-currency", "TRY");
        sessionStorage.setItem("__cur_seeded", "1");
      }
    });
    await page.goto("/pages/products.html");

    await page.locator("#bottom-nav-account").click();
    await page.locator("#account-currency-btn").click();
    await page.locator('[data-currency-switch="USD"]').click();

    // setSelectedCurrency localStorage'a yazar, sonra reload olur.
    await page.waitForLoadState("domcontentloaded");
    const stored = await page.evaluate(() => localStorage.getItem("tradehub-currency"));
    expect(stored).toBe("USD");
  });
});
