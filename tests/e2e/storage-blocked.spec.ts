/**
 * E2E — depolama engelliyken site AÇILMALI.
 *
 * Kusur (ölçüldü 16 Eyl 2026, alpha ve PROD birebir aynı): `localStorage`
 * erişimi SecurityError fırlattığında site hiç açılmıyordu — 75 element,
 * 0 başlık, 0 ürün kartı. Kısmi bozulma değil, tam kayıp.
 *
 * Erişim tek yerden gelmiyordu: `<head>` içindeki tema script'i, Alpine,
 * i18next'in cacheUserLanguage'ı ve currencyService. İkisi 3. parti kütüphane
 * olduğu için tek tek try/catch mümkün değildi; düzeltme `vite.config.ts`
 * içindeki `storageShimPlugin` ile GLOBAL yapıldı: depolama çalışmıyorsa
 * yerine bellek içi taklit konur.
 *
 * Bu test iki yönü birden korur: engelliyken site açılmalı, engelsizken
 * shim devreye GİRMEMELİ (gerçek Storage kalmalı, veri kalıcı olmalı).
 */
import { test, expect, type Page } from "@playwright/test";

/** Verilen depolama API'sini erişilemez yapar (tarayıcı ayarı taklidi). */
async function depolamayiEngelle(page: Page, adlar: string[]): Promise<void> {
  await page.addInitScript((liste: string[]) => {
    for (const ad of liste) {
      Object.defineProperty(window, ad, {
        get() {
          throw new DOMException("denied", "SecurityError");
        },
        configurable: true,
      });
    }
  }, adlar);
}

async function sayfaOlcusu(page: Page) {
  return page.evaluate(() => ({
    element: document.querySelectorAll("*").length,
    baslik: document.querySelectorAll("h1,h2").length,
  }));
}

test("localStorage engelliyken site açılır", async ({ page }) => {
  await depolamayiEngelle(page, ["localStorage"]);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);

  const o = await sayfaOlcusu(page);
  expect(o.element).toBeGreaterThan(500);
  expect(o.baslik).toBeGreaterThan(0);
});

test("sessionStorage engelliyken site açılır", async ({ page }) => {
  await depolamayiEngelle(page, ["sessionStorage"]);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);

  const o = await sayfaOlcusu(page);
  expect(o.element).toBeGreaterThan(500);
});

test("ikisi birden engelliyken site açılır", async ({ page }) => {
  await depolamayiEngelle(page, ["localStorage", "sessionStorage"]);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);

  const o = await sayfaOlcusu(page);
  expect(o.element).toBeGreaterThan(500);
  expect(o.baslik).toBeGreaterThan(0);
});

test("depolama çalışırken shim DEVREYE GİRMEZ — gerçek Storage ve kalıcılık korunur", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  const tip = await page.evaluate(() => {
    localStorage.setItem("__kalicilik_testi__", "1");
    return Object.prototype.toString.call(window.localStorage);
  });
  expect(tip).toBe("[object Storage]");

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const kalici = await page.evaluate(() => localStorage.getItem("__kalicilik_testi__"));
  expect(kalici).toBe("1");
});
