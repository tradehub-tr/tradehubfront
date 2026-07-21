/**
 * E2E — Üreticiler sayfası facet filtreleri (B1).
 *
 * Sidebar seçenekleri backend `get_manufacturer_facets`'ten (üretici-sayılı) gelir.
 * Backend lokalde ayakta değil — `page.route()` ile mock'lanır. Sidebar yalnız arama
 * bağlamında (URL'de cat/q) render edildiği için `?cat=` ile açılır.
 */
import { test, expect, type Route, type Page } from "@playwright/test";

const FACETS_WIDE = {
  countries: [
    { value: "Turkey", label: "Turkey", count: 5 },
    { value: "China", label: "China", count: 3 },
  ],
  ratings: [{ value: "4", label: "4+", count: 3 }],
  foundedYears: [],
  managementCertifications: [{ value: "ISO 9001", label: "ISO 9001", count: 3 }],
  productCertifications: [],
  verifiedSupplierCount: 4,
  total: 8,
};

const FACETS_NARROW = {
  ...FACETS_WIDE,
  countries: [{ value: "Turkey", label: "Turkey", count: 5 }],
  managementCertifications: [{ value: "ISO 9001", label: "ISO 9001", count: 2 }],
  total: 5,
};

const SELLERS = { sellers: [], total: 8, page: 1, page_size: 20 };

async function mockBackend(page: Page): Promise<void> {
  await page.route("**/api/method/**", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: { data: [] } }),
    })
  );
  await page.route("**/api/method/tradehub_core.api.seller.get_sellers*", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: SELLERS }),
    })
  );
  await page.route(
    "**/api/method/tradehub_core.api.seller.get_manufacturer_facets*",
    (route: Route) => {
      // Bir ülke seçilince (country=Turkey) backend daraltılmış sayım döndürür.
      const narrowed = route.request().url().includes("country=Turkey");
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: { data: narrowed ? FACETS_NARROW : FACETS_WIDE } }),
      });
    }
  );
  await page.route("**/api/method/tradehub_core.api.v1.auth.get_session_user*", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: { user: "Guest", csrf_token: "test" } }),
    })
  );
}

test.describe("Üreticiler — facet filtreleri (B1)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("istoc_cookie_prefs", '{"necessary":true}');
      const s = document.createElement("style");
      s.textContent = '[x-data="cookieBanner"]{display:none !important}';
      (document.head || document.documentElement).appendChild(s);
    });
    await mockBackend(page);
  });

  test("Sidebar facet seçeneklerini üretici sayısıyla göstermeli", async ({ page }) => {
    await page.goto("/pages/manufacturers.html?cat=test");
    const sidebar = page.locator('aside[x-data="manufacturerFilters"]');
    // Tedarikçi ülkesi + yönetim sertifikası facet'ten count'lu render edilmeli.
    // (label + count ayrı span → satır bazında toContainText.)
    await expect(sidebar.locator("label", { hasText: "Turkey" })).toContainText("(5)", {
      timeout: 10_000,
    });
    await expect(sidebar.locator("label", { hasText: "ISO 9001" })).toContainText("(3)");
  });

  test("Ülke seçilince facet count'ları dinamik daralmalı (monotonic narrow)", async ({ page }) => {
    await page.goto("/pages/manufacturers.html?cat=test");
    const sidebar = page.locator('aside[x-data="manufacturerFilters"]');
    const isoRow = sidebar.locator("label", { hasText: "ISO 9001" });
    await expect(isoRow).toContainText("(3)", { timeout: 10_000 });

    // Turkey ülkesini seç → facet aktif filtreyle yeniden çekilir → mgmt cert 3→2.
    await sidebar.locator('input[type="checkbox"][value="Turkey"]').check();
    await expect(isoRow).toContainText("(2)", { timeout: 5_000 });
  });
});
