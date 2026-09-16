/**
 * E2E — desteklenmeyen para birimi önerisi kullanıcıyı kilitlememeli.
 *
 * Kusur (ölçüldü 16 Eyl 2026, lokal + prod): backend'deki
 * `COUNTRY_CURRENCY_MAP` `GB→GBP` ve `CN/HK/TW→CNY` eşlemeleri taşıyor, ama
 * Supported Currency'de yalnız USD/TRY/EUR tanımlı. `X-Country: GB` ile gelen
 * istek `defaultCurrency: "GBP"` alıyordu; ön yüz bunu doğrulamadan
 * localStorage'a yazıyordu. O kodun ne kuru ne sembolü var ve seçicide
 * görünmediği için kullanıcı seçimini kendisi düzeltemiyordu.
 *
 * Düzeltme iki katmanlı: backend desteklenmeyen kodu USD'ye düşürüyor,
 * ön yüz de öneriyi ve depolanmış seçimi meta listesine karşı doğruluyor.
 * Bu test ön yüz katmanını koruyor — backend bir gün yine geçersiz kod
 * dönerse kullanıcı yine de kilitlenmemeli.
 *
 * Route sırası: spesifik currency route'u catch-all'dan SONRA kaydedilir
 * (Playwright'ta en son eklenen önce eşleşir).
 */
import { test, expect, type Route, type Page } from "@playwright/test";
import { yalnizMasaustu } from "./fixtures/viewport";

yalnizMasaustu("para birimi seçici header popover'ında; mobil karşılığı mobile-currency.spec.ts");

const STORAGE_KEY = "tradehub-currency";

/** GBP desteklenen listede YOK, ama backend onu öneriyor. */
const DESTEKLENMEYEN_ONERI = {
  currencies: [
    { code: "TRY", symbol: "₺", name: "Turkish Lira", nameTr: "Türk Lirası", decimalPlaces: 2 },
    { code: "USD", symbol: "$", name: "US Dollar", nameTr: "Amerikan Doları", decimalPlaces: 2 },
    { code: "EUR", symbol: "€", name: "Euro", nameTr: "Euro", decimalPlaces: 2 },
  ],
  rates: { USD: { USD: 1, EUR: 0.92, TRY: 38.5 } },
  defaultCurrency: "GBP",
  detectedCountry: "GB",
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
  await page.route(
    "**/api/method/tradehub_core.api.currency.get_currency_settings*",
    (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: DESTEKLENMEYEN_ONERI }),
      })
  );
}

test("desteklenmeyen öneri localStorage'a yazılmaz", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/pages/products.html");
  await page.waitForLoadState("networkidle");
  // initCurrency async — oturması beklenir.
  await page.waitForTimeout(800);

  const depolanan = await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY);
  expect(depolanan).not.toBe("GBP");

  // Seçici popover'ın içinde yaşıyor; açılmadan DOM'a girmiyor
  // (currency-list-rerender.spec.ts'te aynı tuzak not edilmiş).
  await page.locator('[data-popover-target="popover-language-currency"]').first().click();
  const secenekler = await page.$$eval("#currency-select option", (os) =>
    os.map((o) => (o as HTMLOptionElement).value)
  );
  expect(secenekler).not.toContain("GBP");
  // Seçilen değer her zaman seçicide bulunabilir olmalı.
  if (depolanan) expect(secenekler).toContain(depolanan);
});

test("önceden kilitlenmiş kullanıcının geçersiz seçimi temizlenir", async ({ page }) => {
  await mockBackend(page);
  await page.addInitScript(
    ([k, v]) => localStorage.setItem(k as string, v as string),
    [STORAGE_KEY, "GBP"]
  );
  await page.goto("/pages/products.html");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(800);

  const depolanan = await page.evaluate((k) => localStorage.getItem(k), STORAGE_KEY);
  expect(depolanan).not.toBe("GBP");
});
