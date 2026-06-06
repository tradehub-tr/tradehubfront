/**
 * E2E — categoryService IndexedDB persist davranışı (Task 5).
 *
 * Backend lokalde ayakta değil — `page.route()` ile mock'lanır. Kategori
 * endpoint'i `tradehub_core.api.category.get_mega_menu` (callMethod → Frappe
 * `{ message: ApiCategory[] }` zarfı).
 *
 * Migrasyon ÖNCESİ: her sayfa yüklemesi loadCategories()'i yeniden çağırır →
 * 2. sayfada yeni bir fetch atılır.
 * Migrasyon SONRASI: queryFetch + IndexedDB persister ilk yüklemenin sonucunu
 * saklar → 2. sayfa yüklemesi cache'ten okur, yeni fetch yok.
 *
 * NOT: İki navigasyon da `products.html`'e gider çünkü ortak header (MegaMenu →
 * initMegaMenu) `categoryService.loadCategories()` üzerinden — yani migre edilen
 * yol üzerinden — kategori çeker. `categories.html` ayrıca sayfa-içi DOĞRUDAN
 * bir `callMethod(get_mega_menu)` daha yapıyor (servisi atlayan, bu task
 * kapsamı DIŞINDA bir yol); o sayfa kullanılırsa cache davranışı değil o
 * bağımsız çağrı ölçülürdü.
 */
import { test, expect, type Route, type Page } from "@playwright/test";

const CATEGORIES = [
  {
    id: "sektor-mutfak",
    name: "Mutfak",
    slug: "mutfak",
    children: [
      { id: "grup-pisirme", name: "Pişirme", slug: "pisirme", children: [] },
    ],
  },
  {
    id: "sektor-tekstil",
    name: "Tekstil",
    slug: "tekstil",
    children: [],
  },
];

async function mockBackend(page: Page): Promise<void> {
  await page.route("**/api/method/**", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: { data: [] } }),
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

test("categories fetched once across two page loads (IndexedDB persist)", async ({ page }) => {
  await mockBackend(page);

  let categoryRequests = 0;
  await page.route(
    "**/api/method/tradehub_core.api.category.get_mega_menu*",
    (route: Route) => {
      categoryRequests++;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: CATEGORIES }),
      });
    }
  );

  await page.goto("/pages/products.html?cat=test");
  await page.waitForLoadState("networkidle");
  // Persister'ın IndexedDB'ye yazması async — 2. navigasyondan önce yazımı bekle.
  await page.waitForTimeout(1500);
  const afterFirst = categoryRequests;

  await page.goto("/pages/products.html?cat=other");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  expect(afterFirst).toBeGreaterThanOrEqual(1);
  expect(categoryRequests).toBe(afterFirst); // 2. yükleme: IndexedDB'den, yeni fetch yok
});
