/**
 * E2E karakterizasyon — Varyant etkileşimi (variantMatrix.ts).
 *
 * `src/components/product/variantMatrix.ts` içindeki `getSelectedAxes()`,
 * `updateReadyBadge()`, `crossDisableVariants()` fonksiyonlarının bugünkü
 * DOM davranışını sabitler (Task 8.5). Task 9/10'da ProductInfo.ts ikiye
 * bölünürken bu selector'lar (`.variant-group[data-variant-label]`,
 * `.variant-option[data-variant-label]`, `.variant-option.active`,
 * `#pd-ready-badge`, `[data-ready-badge="mobile"]`) sessizce kırılırsa bu
 * paket kırmızı olmalı.
 *
 * Backend lokalde ayakta değil — `page.route()` ile mock'lanır (aynı desen:
 * product-detail-layout.spec.ts / product-detail-tabs.spec.ts).
 *
 * Bu bir KARAKTERİZASYON testidir: "olması gereken" değil, "bugün ne
 * oluyor" sabitlenir.
 */
import { test, expect, type Route, type Page } from "@playwright/test";

// Üretim class string'leri Tailwind arbitrary-variant selector'ları olarak
// "[&.active]:..." / "[&.is-out-of-stock]:..." metnini HER ZAMAN içeriyor —
// yani /active/ gibi saf substring regex'i, gerçek "active" class'ı hiç
// eklenmemiş olsa bile eşleşir (yanlış-pozitif). Gerçek token'ı yakalamak
// için başında boşluk/satır-başı, sonunda boşluk/satır-sonu arıyoruz.
function classToken(name: string): RegExp {
  return new RegExp(`(^|\\s)${name}(?=\\s|$)`);
}

// Renk (Siyah/Beyaz) × Beden (M/L) iki eksenli varyant + skuMatrix.
// Siyah+M = mevcut stok (default kombinasyon), Siyah+L = stok yok
// (cross-disable'ın gerçek bir işi olsun diye), Beyaz+M / Beyaz+L = stokta.
const PRODUCT: Record<string, unknown> = {
  id: "LST-TEST-0003",
  slug: "test-varyant-urunu",
  title: "Varyant Testi Ürünü",
  category: ["Tekstil"],
  images: ["https://example.com/img1.jpg"],
  priceTiers: [{ minQty: 1, maxQty: 99, price: 100 }],
  currency: "USD",
  moq: 1,
  unit: "adet",
  description: "Varyant etkileşimi e2e karakterizasyon testi için örnek ürün.",
  specs: [{ label: "Malzeme", value: "Pamuk" }],
  packagingSpecs: [],
  reviewCount: 0,
  rating: 0,
  outOfStock: false,
  supplier: {
    name: "Test Tedarikçi",
    display_name: "Test Tedarikçi",
    kybVerified: true,
    country: "TR",
    yearsInBusiness: 5,
  },
  variants: [
    {
      name: "Renk",
      displayName: "Renk",
      type: "image",
      options: [
        {
          variantId: "V-BLACK",
          label: "Siyah",
          displayLabel: "Siyah",
          value: "#000000",
          image: "https://example.com/black.jpg",
          available: true,
          isDefault: true,
        },
        {
          variantId: "V-WHITE",
          label: "Beyaz",
          displayLabel: "Beyaz",
          value: "#ffffff",
          image: "https://example.com/white.jpg",
          available: true,
        },
      ],
      skuMatrix: [
        {
          axis1: "Siyah",
          axis2: "M",
          available: true,
          stock: 10,
          price: 100,
          sku: "SKU-BLACK-M",
          variantId: "V-BLACK-M",
        },
        {
          axis1: "Siyah",
          axis2: "L",
          available: false,
          stock: 0,
          price: 100,
          sku: "SKU-BLACK-L",
          variantId: "V-BLACK-L",
        },
        {
          axis1: "Beyaz",
          axis2: "M",
          available: true,
          stock: 6,
          price: 100,
          sku: "SKU-WHITE-M",
          variantId: "V-WHITE-M",
        },
        {
          axis1: "Beyaz",
          axis2: "L",
          available: true,
          stock: 6,
          price: 100,
          sku: "SKU-WHITE-L",
          variantId: "V-WHITE-L",
        },
      ],
    },
    {
      name: "Beden",
      displayName: "Beden",
      type: "text",
      options: [
        { variantId: "V-M", label: "M", displayLabel: "M", value: "M", available: true },
        { variantId: "V-L", label: "L", displayLabel: "L", value: "L", available: true },
      ],
    },
  ],
};

// Aynı ürün, sadece listing-seviyesinde outOfStock:true — updateReadyBadge'in
// global bayrak kısayolunu (skuMatrix'ten bağımsız) karakterize etmek için.
const PRODUCT_OUT_OF_STOCK: Record<string, unknown> = {
  ...PRODUCT,
  id: "LST-TEST-0004",
  slug: "test-varyant-stok-yok",
  outOfStock: true,
};

function json(route: Route, message: unknown): Promise<void> {
  return route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ message }),
  });
}

async function mockBackend(page: Page, product: Record<string, unknown>): Promise<void> {
  // Catch-all EN BAŞTA — Playwright son eklenen handler'ı önce çalıştırır,
  // böylece spesifik route'lar catch-all'ı gölgeler (product-detail-tabs.spec.ts ile aynı desen).
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
    (route) =>
      json(route, {
        summary: { average_rating: 0, review_count: 0, rating_distribution: {}, aspect_averages: {} },
        reviews: [],
        total: 0,
        page: 1,
        page_size: 50,
        qa_total: 0,
      })
  );
  // listingService.ts:183 → response.message.data okur.
  await page.route("**/api/method/tradehub_core.api.listing.get_listing_detail*", (route) =>
    json(route, { data: product })
  );
}

test.describe("Ürün detay — varyant etkileşimi (karakterizasyon)", () => {
  test.beforeEach(async ({ page }) => {
    await mockBackend(page, PRODUCT);
    await page.goto("/pages/product-detail.html?id=LST-TEST-0003");
    await page.waitForSelector("#pd-variations-section");
  });

  test("her iki eksen kendi seçenekleriyle .variant-option olarak render edilir", async ({
    page,
  }) => {
    const renkGroup = page.locator('.variant-group[data-variant-label="Renk"]');
    const bedenGroup = page.locator('.variant-group[data-variant-label="Beden"]');
    await expect(renkGroup).toBeVisible();
    await expect(bedenGroup).toBeVisible();

    await expect(renkGroup.locator(".variant-option")).toHaveCount(2);
    await expect(bedenGroup.locator(".variant-option")).toHaveCount(2);

    await expect(
      renkGroup.locator('.variant-option[data-variant-label="Siyah"]')
    ).toHaveCount(1);
    await expect(
      renkGroup.locator('.variant-option[data-variant-label="Beyaz"]')
    ).toHaveCount(1);
    await expect(bedenGroup.locator('.variant-option[data-variant-label="M"]')).toHaveCount(1);
    await expect(bedenGroup.locator('.variant-option[data-variant-label="L"]')).toHaveCount(1);
  });

  test("bir seçeneğe tıklamak .active ekler ve grup etiketini günceller", async ({ page }) => {
    const renkGroup = page.locator('.variant-group[data-variant-label="Renk"]');
    const siyahBtn = renkGroup.locator('.variant-option[data-variant-label="Siyah"]');
    const beyazBtn = renkGroup.locator('.variant-option[data-variant-label="Beyaz"]');

    // Başlangıçta Siyah (isDefault:true) aktif.
    await expect(siyahBtn).toHaveClass(classToken("active"));
    await expect(renkGroup.locator(".variant-selected-label")).toHaveText("Siyah");

    await beyazBtn.click();

    await expect(beyazBtn).toHaveClass(classToken("active"));
    await expect(siyahBtn).not.toHaveClass(classToken("active"));
    await expect(renkGroup.locator(".variant-selected-label")).toHaveText("Beyaz");
  });

  test("çapraz eksen devre dışı bırakma — stok olmayan kombinasyon disabled olur", async ({
    page,
  }) => {
    const bedenGroup = page.locator('.variant-group[data-variant-label="Beden"]');
    const mBtn = bedenGroup.locator('.variant-option[data-variant-label="M"]');
    const lBtn = bedenGroup.locator('.variant-option[data-variant-label="L"]');

    // Başlangıçta Renk=Siyah aktif; Siyah+L skuMatrix'te available:false → L
    // devre dışı gelir. Bu ilk durum RENDER anında statik hesaplanır
    // (renderVariant → isOptionAvailableForColor), DOM sorgusuna bağlı değil;
    // init sonundaki crossDisableVariants çağrısı ise aynı durumu çalışma
    // zamanında (ve her tıklamada) yeniden hesaplar. İki mekanizma ayrıdır.
    await expect(lBtn).toBeDisabled();
    await expect(lBtn).toHaveClass(/opacity-40/);
    await expect(lBtn).toHaveClass(/line-through/);
    await expect(mBtn).toBeEnabled();

    // Renk=Beyaz seçilince Beyaz+L skuMatrix'te available:true → L açılır.
    const beyazBtn = page.locator(
      '.variant-group[data-variant-label="Renk"] .variant-option[data-variant-label="Beyaz"]'
    );
    await beyazBtn.click();

    await expect(lBtn).toBeEnabled();
    await expect(lBtn).not.toHaveClass(/opacity-40/);
    await expect(lBtn).not.toHaveClass(/line-through/);

    // Tekrar Renk=Siyah'a dönünce L yeniden devre dışı kalır (Siyah+L hâlâ stoksuz).
    const siyahBtn = page.locator(
      '.variant-group[data-variant-label="Renk"] .variant-option[data-variant-label="Siyah"]'
    );
    await siyahBtn.click();

    await expect(lBtn).toBeDisabled();
    await expect(lBtn).toHaveClass(/opacity-40/);
  });

  test("ready-to-ship rozeti başlangıçta stoklu (Siyah+M mevcut) kombinasyonu yansıtır", async ({
    page,
  }) => {
    const badge = page.locator("#pd-ready-badge");
    await expect(badge).toBeVisible();
    await expect(badge).not.toHaveClass(classToken("is-out-of-stock"));
    // t("product.readyToShip") metni — tam string'e bağımlı kalmamak için
    // out-of-stock class'ının YOK olduğunu asıl sinyal olarak kullanıyoruz.
  });
});

test.describe("Ürün detay — ready-to-ship rozeti (listing-seviyesi outOfStock bayrağı)", () => {
  test("listing outOfStock:true olduğunda rozet stok-yok metnine döner", async ({ page }) => {
    await mockBackend(page, PRODUCT_OUT_OF_STOCK);
    await page.goto("/pages/product-detail.html?id=LST-TEST-0004");
    await page.waitForSelector("#pd-variations-section");

    const badge = page.locator("#pd-ready-badge");
    await expect(badge).toBeVisible();
    await expect(badge).toHaveClass(classToken("is-out-of-stock"));
  });
});
