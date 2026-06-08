/**
 * E2E — sonraki sayfa prefetch (Task 9).
 *
 * Ürün listeleme sayfası ilk sonucu yükledikten sonra, backend `has_next: true`
 * döndürürse `filterEngine.fetchResults()` arka planda BİR SONRAKİ sayfayı
 * (`page=2`) prefetch eder. Böylece kullanıcı "sonraki"ye tıkladığında istek
 * ağdan değil cache'ten anında çözülür.
 *
 * Wire'da pagination parametresi `page` (listingService.ts: queryParams.set("page", ...)).
 * Bu test, kullanıcı HİÇBİR şeye tıklamadan `page=2` isteğinin atıldığını
 * (prefetch gerçekleşti) doğrular.
 *
 * Playwright route sırası: en SON eklenen route ilk eşleşir. Önce geniş
 * catch-all, sonra spesifik listing route'u eklenir — böylece get_listings
 * sayacı yalnızca gerçek listing isteğini sayar.
 */
import { test, expect, type Route, type Page } from "@playwright/test";

function listingEnvelope(page: number) {
  return {
    message: {
      data: [
        { id: `LST-${page}-1`, name: `Ürün ${page}-1`, price: "₺100,00", moq: "10 adet" },
        { id: `LST-${page}-2`, name: `Ürün ${page}-2`, price: "₺120,00", moq: "20 adet" },
      ] as Record<string, unknown>[],
      total: 100,
      page,
      page_size: 40,
      total_pages: 3,
      has_next: true,
      has_prev: page > 1,
    },
  };
}

/** İstek URL'sinden `page` query parametresini çıkar (yoksa 1 varsay). */
function pageOf(url: string): number {
  const value = new URL(url).searchParams.get("page");
  return value ? parseInt(value, 10) : 1;
}

async function registerRoutes(page: Page, onListingPage: (p: number) => void): Promise<void> {
  // 1) Geniş catch-all — diğer tüm /api/method/ çağrıları boş/uyumlu zarfla.
  await page.route("**/api/method/**", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: { data: [], csrf_token: "None" } }),
    })
  );

  // 2) Spesifik listing route'u — SONRA eklenir ki ilk eşleşen bu olsun.
  await page.route("**/api/method/tradehub_core.api.listing.get_listings*", (route: Route) => {
    const p = pageOf(route.request().url());
    onListingPage(p);
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(listingEnvelope(p)),
    });
  });
}

test("next page (page=2) is prefetched on initial load without user interaction", async ({
  page,
}) => {
  const requestedPages: number[] = [];
  await registerRoutes(page, (p) => requestedPages.push(p));

  await page.goto("/pages/products.html?cat=test");
  await page.waitForLoadState("networkidle");

  // Prefetch arka planda asenkron tetiklenir; kısa bir süre tanı.
  await expect
    .poll(() => requestedPages.filter((p) => p === 2).length, { timeout: 5000 })
    .toBeGreaterThanOrEqual(1);

  // Kullanıcı hiçbir şeye tıklamadı: ilk sayfa + prefetch'lenen 2. sayfa atıldı.
  expect(requestedPages).toContain(1);
  expect(requestedPages).toContain(2);
});

test("clicking next (page=2) is served from prefetch cache (no extra network)", async ({
  page,
}) => {
  const requestedPages: number[] = [];
  await registerRoutes(page, (p) => requestedPages.push(p));

  await page.goto("/pages/products.html?cat=test");
  await page.waitForLoadState("networkidle");

  // Prefetch'in page=2'yi çekmesini bekle.
  await expect
    .poll(() => requestedPages.filter((p) => p === 2).length, { timeout: 5000 })
    .toBeGreaterThanOrEqual(1);

  const page2Before = requestedPages.filter((p) => p === 2).length;

  // Pagination'da "2" butonuna tıkla.
  const nextBtn = page.locator('[data-page="2"]').first();
  await nextBtn.waitFor({ state: "visible", timeout: 5000 });
  await nextBtn.click();
  await page.waitForTimeout(500);

  // Tıklama sonrası YENİ bir page=2 isteği atılmamalı — staleTime(60s) içinde
  // prefetch cache'inden çözülür.
  expect(requestedPages.filter((p) => p === 2).length).toBe(page2Before);
});
