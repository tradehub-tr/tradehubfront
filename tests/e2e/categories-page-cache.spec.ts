/**
 * E2E — categories.html artık kendi get_mega_menu isteğini atmamalı (T15).
 *
 * Senaryo:
 * 1. products.html'e git → header MegaMenu loadCategories() üzerinden cache'i ısıtır.
 * 2. IndexedDB persist'in yazmasını bekle (1500ms).
 * 3. categories.html'e git → sayfa artık loadCategories() üzerinden okuduğu için
 *    yeni bir get_mega_menu isteği ATILMAMALIDIR.
 *
 * Bu test, değişiklik öncesinde FAIL (categories.html kendi isteğini atıyordu),
 * değişiklik sonrasında PASS (cache'ten okuyor) olur.
 */
import { test, expect, type Route, type Page } from "@playwright/test";

const CATEGORIES = [
  {
    id: "sektor-mutfak",
    name: "Mutfak",
    slug: "mutfak",
    icon_class: "",
    children: [
      { id: "grup-pisirme", name: "Pişirme", slug: "pisirme", image: "" },
    ],
  },
  {
    id: "sektor-tekstil",
    name: "Tekstil",
    slug: "tekstil",
    icon_class: "",
    children: [],
  },
];

async function mockBackend(page: Page): Promise<void> {
  // Catch-all for unrelated API calls (must be registered BEFORE specific routes)
  await page.route("**/api/method/**", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: { data: [] } }),
    })
  );
  await page.route(
    "**/api/method/tradehub_core.api.v1.auth.get_session_user*",
    (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: { user: "Guest", csrf_token: "test" } }),
      })
  );
}

test(
  "categories.html does not fire its own get_mega_menu when cache is warm",
  async ({ page }) => {
    await mockBackend(page);

    let categoryRequests = 0;
    // Specific route registered after catch-all — Playwright matches most-recently
    // registered route first, so this takes precedence over the catch-all above.
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

    // Step 1: warm the cache via products.html (header MegaMenu → loadCategories)
    await page.goto("/pages/products.html");
    await page.waitForLoadState("networkidle");
    // Wait for IndexedDB persister to write the cached result
    await page.waitForTimeout(1500);
    const afterFirst = categoryRequests;

    // Step 2: navigate to categories.html — should serve from cache, no new request
    await page.goto("/pages/categories.html");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    expect(afterFirst).toBeGreaterThanOrEqual(1);
    // categories.html must NOT add a new get_mega_menu request
    expect(categoryRequests).toBe(afterFirst);
  }
);
