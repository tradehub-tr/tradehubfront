/**
 * E2E — Ürün detay sekmeleri: anchor / scroll davranışı.
 *
 * Backend lokalde ayakta değil — `page.route()` ile `/api/method/...` mock'lanır.
 * Bu paket, ProductTabs'ın eski "tab-switching" (içerik gizle/göster) yerine
 * artık "anchor scroll" davrandığını doğrular:
 *   - Tüm bölümler AYNI ANDA görünür (hiçbiri display:none değil)
 *   - Sekmeye tıklayınca ilgili bölüme scroll edilir ve o sekme aktif olur
 *   - Başlangıçta ilk sekme (Açıklama) aktif
 */
import { test, expect, type Route, type Page } from "@playwright/test";

// get_listing_detail → mapListingDetail(raw) beklediği backend shape (hepsi opsiyonel).
const PRODUCT: Record<string, unknown> = {
  id: "LST-TEST-0001",
  slug: "test-lokma-anahtar-takimi",
  title: "Krom-Vanadyum Çelik Lokma Anahtar Takımı",
  category: ["Hırdavat"],
  images: ["https://example.com/img1.jpg"],
  priceTiers: [{ minQty: 1, maxQty: 99, price: 100 }],
  currency: "USD",
  moq: 1,
  unit: "adet",
  description:
    "Profesyonel atölye ve sanayi kullanımı için krom-vanadyum çelik lokma anahtar takımı. Yüksek tork dayanımı, kaymaz sap ve korozyon direnci.",
  specs: [
    { label: "Malzeme", value: "Krom-Vanadyum Çelik (Cr-V)" },
    { label: "Menşei", value: "Türkiye" },
    { label: "Net Ağırlık", value: "4.06 kg" },
  ],
  packagingSpecs: [{ label: "Paket İçeriği", value: "24 parça + çanta" }],
  reviewCount: 0,
  rating: 0,
  supplier: {
    name: "İstanbul Hırdavat Merkezi",
    display_name: "İstanbul Hırdavat Merkezi",
    kybVerified: true,
    country: "TR",
    yearsInBusiness: 48,
  },
};

const REVIEW_PAGE: Record<string, unknown> = {
  summary: {
    average_rating: 3.9,
    review_count: 30,
    rating_distribution: {},
    aspect_averages: {},
  },
  reviews: [],
  total: 0,
  page: 1,
  page_size: 50,
  qa_total: 0,
};

const SECTION_IDS = ["description", "attributes", "reviews", "company"] as const;

function json(route: Route, message: unknown): Promise<void> {
  return route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ message }),
  });
}

async function mockBackend(page: Page): Promise<void> {
  // Catch-all EN BAŞTA — Playwright son eklenen handler'ı önce çalıştırır,
  // böylece spesifik route'lar catch-all'ı gölgeler.
  await page.route("**/api/method/**", (route) => json(route, {}));
  await page.route("**/api/method/tradehub_core.api.v1.auth.get_session_user*", (route) =>
    json(route, { user: "Guest", csrf_token: "test" })
  );
  await page.route("**/api/method/tradehub_core.api.theme.get_public_theme*", (route) =>
    json(route, { overrides: {} })
  );
  await page.route("**/api/method/tradehub_core.api.currency.get_currency_settings*", (route) =>
    json(route, {})
  );
  await page.route(
    "**/api/method/tradehub_core.api.listing.get_related_listings_grouped*",
    (route) => json(route, { data: [] })
  );
  await page.route(
    "**/api/method/tradehub_core.api.storefront_api.get_storefront_review_page*",
    (route) => json(route, REVIEW_PAGE)
  );
  await page.route("**/api/method/tradehub_core.api.listing.get_listing_detail*", (route) =>
    json(route, { data: PRODUCT })
  );
}

test.describe("Ürün detay — anchor sekmeler", () => {
  test.beforeEach(async ({ page }) => {
    await mockBackend(page);
    await page.goto("/pages/product-detail.html?id=LST-TEST-0001");
    await page.waitForSelector("#product-tabs-section");
  });

  test("tüm bölümler aynı anda görünür — içerik gizlenmiyor", async ({ page }) => {
    for (const id of SECTION_IDS) {
      await expect(page.locator(`#tab-content-${id}`)).toBeVisible();
    }
    // Her bölümün kendi başlığı var (hepsi alt alta göründüğü için şart)
    await expect(page.locator("#tab-heading-description")).toBeVisible();
    await expect(page.locator("#tab-heading-attributes")).toBeVisible();
    await expect(page.locator("#tab-heading-company")).toBeVisible();
  });

  test("başlangıçta ilk sekme (Açıklama) aktif", async ({ page }) => {
    await expect(page.locator("#tab-btn-description")).toHaveAttribute("data-active", "true");
    await expect(page.locator("#tab-btn-company")).toHaveAttribute("data-active", "false");
  });

  test("sekmeye tıklayınca ilgili bölüme scroll eder ve o sekme aktif olur", async ({ page }) => {
    const companyBtn = page.locator("#tab-btn-company");
    await companyBtn.click();

    // Tedarikçi bölümü görünür alana kaymalı
    await expect(page.locator("#tab-content-company")).toBeInViewport();
    // Aktif sekme güncellenmeli
    await expect(companyBtn).toHaveAttribute("data-active", "true");
    await expect(page.locator("#tab-btn-description")).toHaveAttribute("data-active", "false");
  });

  test("kaydırınca scroll-spy başlangıç sekmesini bırakır", async ({ page }) => {
    // Başta Açıklama aktif
    await expect(page.locator("#tab-btn-description")).toHaveAttribute("data-active", "true");
    // Sayfayı en alt bölüme kadar kaydır
    await page.locator("#tab-content-company").scrollIntoViewIfNeeded();
    // scroll-spy devreye girmeli: Açıklama artık aktif değil, tam 1 sekme aktif kalır
    await expect(page.locator("#tab-btn-description")).toHaveAttribute("data-active", "false");
    await expect(page.locator('.product-tab-btn[data-active="true"]')).toHaveCount(1);
  });
});
