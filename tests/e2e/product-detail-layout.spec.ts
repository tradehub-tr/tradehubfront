import { test, expect, type Route, type Page } from "@playwright/test";

// product-detail-tabs.spec.ts ile aynı mock payload — get_listing_detail shape'i.
const PRODUCT: Record<string, unknown> = {
  id: "LST-TEST-0002",
  slug: "test-3-kolon-urun",
  title: "Üç Kolon Test Ürünü",
  category: ["Hırdavat"],
  images: ["https://example.com/img1.jpg"],
  priceTiers: [{ minQty: 1, maxQty: 99, price: 100 }],
  currency: "USD",
  moq: 1,
  unit: "adet",
  description: "Üç sütunlu düzen testi için örnek ürün açıklaması.",
  specs: [{ label: "Malzeme", value: "Çelik" }],
  packagingSpecs: [],
  reviewCount: 0,
  rating: 0,
  supplier: {
    name: "Test Tedarikçi A.Ş.",
    display_name: "Test Tedarikçi A.Ş.",
    kybVerified: true,
    country: "TR",
    yearsInBusiness: 8,
  },
};

async function mockApi(page: Page): Promise<void> {
  await page.route("**/api/method/**", (route: Route) => {
    const url = route.request().url();
    if (url.includes("get_listing_detail")) {
      // get_listing_detail service (listingService.ts:183) reads
      // response.message.data — not response.message directly — same shape
      // used by product-detail-tabs.spec.ts's mockBackend().
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: { data: PRODUCT } }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: {} }),
    });
  });
}

test.describe("Ürün detay — 3 sütunlu masaüstü düzeni", () => {
  test("1440px'de üç sütun yan yana durur", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockApi(page);
    await page.goto("/pages/product-detail.html?id=LST-TEST-0002");

    const left = page.locator("#pd-hero-left");
    const center = page.locator("#pd-hero-center");
    const right = page.locator("#pd-hero-info");
    await expect(left).toBeVisible();
    await expect(center).toBeVisible();
    await expect(right).toBeVisible();

    const [lBox, cBox, rBox] = await Promise.all([
      left.boundingBox(),
      center.boundingBox(),
      right.boundingBox(),
    ]);
    // Üçü de aynı satırda: sol < orta < sağ (x ekseninde artan), y'leri yakın.
    expect(lBox!.x).toBeLessThan(cBox!.x);
    expect(cBox!.x).toBeLessThan(rBox!.x);
    expect(Math.abs(lBox!.y - rBox!.y)).toBeLessThan(40);
    // Sol sütun 465px'i aşmaz.
    expect(lBox!.width).toBeLessThanOrEqual(470);
  });

  test("1100px'de sağ sütun ortanın altına iner", async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 900 });
    await mockApi(page);
    await page.goto("/pages/product-detail.html?id=LST-TEST-0002");

    const center = page.locator("#pd-hero-center");
    const right = page.locator("#pd-hero-info");
    await expect(center).toBeVisible();
    await expect(right).toBeVisible();

    const [cBox, rBox] = await Promise.all([center.boundingBox(), right.boundingBox()]);
    // Sağ panel artık ortanın ALTINDA.
    expect(rBox!.y).toBeGreaterThan(cBox!.y);
  });
});
