/**
 * E2E — listingService (searchListings) IndexedDB persist davranışı (Task 7).
 *
 * Backend lokalde ayakta değil — `page.route()` ile mock'lanır. Ürün listeleme
 * endpoint'i `tradehub_core.api.listing.get_listings` (api() → Frappe
 * `{ message: { data: [...], total, page, total_pages, has_next, has_prev } }`
 * zarfı). Ürün listeleme sayfası (`products.html` → `src/pages/products.ts` →
 * `filterEngine.fetchResults()`) grid'i bu fonksiyon üzerinden doldurur.
 *
 * Migrasyon ÖNCESİ: aynı filtre kombinasyonuyla ikinci sayfa yüklemesi yeni bir
 * `get_listings` fetch'i atar → istek sayısı artar.
 * Migrasyon SONRASI: queryFetch + IndexedDB persister ilk yüklemenin sonucunu
 * saklar; aynı param'lar staleTime (60s) içinde cache'ten okunur → yeni fetch yok.
 *
 * Playwright route sırası: en SON eklenen route ilk eşleşir. Bu yüzden önce
 * geniş catch-all (**\/api/method/**) eklenir, sonra spesifik listing route'u —
 * böylece get_listings sayacı yalnızca gerçek listing isteğini sayar.
 */
import { test, expect, type Route, type Page } from "@playwright/test";

const LISTING_RESPONSE = {
  message: {
    data: [] as Record<string, unknown>[],
    total: 0,
    page: 1,
    page_size: 24,
    total_pages: 1,
    has_next: false,
    has_prev: false,
  },
};

async function registerRoutes(page: Page, onListing: () => void): Promise<void> {
  // 1) Geniş catch-all — diğer tüm /api/method/ çağrıları (auth, categories,
  //    currency, theme vb.) boş/uyumlu zarfla yanıtlanır.
  await page.route("**/api/method/**", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: { data: [], csrf_token: "None" } }),
    })
  );

  // 2) Spesifik listing route'u — SONRA eklenir ki ilk eşleşen bu olsun.
  await page.route("**/api/method/tradehub_core.api.listing.get_listings*", (route: Route) => {
    onListing();
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(LISTING_RESPONSE),
    });
  });
}

test("same filter combination served from cache within staleTime (no refetch)", async ({
  page,
}) => {
  let listingRequests = 0;
  await registerRoutes(page, () => {
    listingRequests++;
  });

  await page.goto("/pages/products.html?cat=test");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500); // persister flush
  const first = listingRequests;

  await page.goto("/pages/products.html?cat=test"); // same params
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  expect(first).toBeGreaterThanOrEqual(1);
  // staleTime(60s) içinde aynı param → cache'ten, yeni istek yok.
  expect(listingRequests).toBe(first);
});
