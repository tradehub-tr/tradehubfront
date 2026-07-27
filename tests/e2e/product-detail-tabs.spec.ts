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

  // Orta sütundaki puan satırının "N yorum" linki (ProductBuyBox) → Yorumlar bölümü.
  // Task 9'da ProductTitleBar'dan taşındı; hedef sekme kartının EN ÜSTÜ değil,
  // Yorumlar panelinin kendisi olmalı.
  test("yorum sayısı linki Yorumlar bölümünü görünür alana getirir", async ({ page }) => {
    const reviewsPanel = page.locator("#tab-content-reviews");
    // Test vacuous olmasın: bölüm başlangıçta ekran dışında.
    await expect(reviewsPanel).not.toBeInViewport();

    await page.locator("#pd-review-count-link").click();

    await expect(reviewsPanel).toBeInViewport();
    await expect(page.locator("#tab-btn-reviews")).toHaveAttribute("data-active", "true");
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

test("ürün detay yalnız etkin viewport bileşimini mount eder ve breakpoint değişiminde erişilebilir yüzeyi korur", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockBackend(page);
  await page.goto("/pages/product-detail.html?id=LST-TEST-0001");
  await page.waitForSelector("#product-tabs-section");

  await expect(page.locator("#pd-desktop-layout")).toHaveCount(1);
  await expect(page.locator("#pd-mobile-layout")).toHaveCount(0);
  await expect(page.locator("#pd-hero-gallery")).toBeVisible();
  await expect(page.locator("#product-tabs-section")).toBeVisible();
  await expect(page.locator("#pd-mobile-bar")).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("#pd-mobile-layout")).toHaveCount(1);
  await expect(page.locator("#pd-desktop-layout")).toHaveCount(0);
  await expect(page.locator("#pdm-gallery-wrap")).toBeVisible();
  await expect(page.locator("#pd-mobile-bar")).toBeVisible();
  await expect(page.locator("#pdm-bar-cart")).toBeEnabled();
  await page.locator("#pdm-bar-cart").click();
  await expect(page.locator("#pdm-sheet-options")).toBeVisible();

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator("#pd-desktop-layout")).toHaveCount(1);
  await expect(page.locator("#pd-mobile-layout")).toHaveCount(0);
  await expect(page.locator("#product-tabs-section")).toBeVisible();
});

test("tekrarlanan viewport geçişleri eski ürün layout document listenerlarını bırakmaz", async ({ page }) => {
  await page.addInitScript(() => {
    const originalAdd = document.addEventListener.bind(document);
    (window as Window & { __pdReviewListenerCalls?: number }).__pdReviewListenerCalls = 0;
    document.addEventListener = ((type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
      if (type !== "product-reviews-loaded") {
        originalAdd(type, listener, options);
        return;
      }
      const wrapped: EventListener = (event) => {
        window.__pdReviewListenerCalls = (window.__pdReviewListenerCalls ?? 0) + 1;
        if (typeof listener === "function") listener(event);
        else listener.handleEvent(event);
      };
      originalAdd(type, wrapped, options);
    }) as typeof document.addEventListener;
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockBackend(page);
  await page.goto("/pages/product-detail.html?id=LST-TEST-0001");
  await page.waitForSelector("#product-tabs-section");

  for (const width of [390, 1440, 390, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(page.locator(width >= 1024 ? "#pd-desktop-layout" : "#pd-mobile-layout")).toHaveCount(1);
  }

  const listenerCalls = await page.evaluate(() => {
    window.__pdReviewListenerCalls = 0;
    document.dispatchEvent(new CustomEvent("product-reviews-loaded", {
      detail: { reviews: [], summary: { review_count: 0 }, total: 0 },
    }));
    return window.__pdReviewListenerCalls;
  });

  // Son aktif desktop composition yalnız ProductBuyBox + ProductReviews
  // listenerlarını taşır; önceki mobile/desktop mountları event alamaz.
  expect(listenerCalls).toBe(2);
});
