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
    rating: 4.9,
    reviewCount: 365,
    responseTime: "≤3sa",
    onTimeDelivery: 100,
    mainMarkets: ["Türkiye", "Almanya", "İngiltere"],
    reorderRate: 17,
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

    // Satıcı kartı sol sütunda, galerinin altında.
    const panel = page.locator("#pd-seller-panel");
    const gallery = page.locator("#pd-hero-gallery");
    await expect(panel).toBeVisible();
    const [pBox, gBox] = await Promise.all([panel.boundingBox(), gallery.boundingBox()]);
    // Sol sütunun kendi yatay aralığı İÇİNDE (orta sütunun solunda VE sol sütunun solundan geride değil).
    expect(pBox!.x).toBeGreaterThanOrEqual(lBox!.x);
    expect(pBox!.x).toBeLessThan(cBox!.x);
    // Panelin üst kenarı galerinin alt kenarından sonra gelir (galerinin ALTINDA, üstünde değil).
    expect(pBox!.y).toBeGreaterThanOrEqual(gBox!.y + gBox!.height);
    // Eski yatay güven şeridi masaüstü düzende artık yok.
    await expect(page.locator("#pd-seller-strip")).toHaveCount(0);
  });

  test("1100px'de sağ sipariş rayı DARALIR ama yan yana kalır", async ({ page }) => {
    // BU TEST ESKİDEN "sağ sütun ortanın altına iner" diyordu ve düzen
    // değiştiğinde güncellenmedi. Bugünkü davranış `product-detail.ts`
    // içinde yazılı: 1024–1279 bandında sağ ray KAYBOLMAZ, 300px'e daralır;
    // 1280+'da 394px olur. Yani sütun aşağı inmiyor — inceliyor.
    await page.setViewportSize({ width: 1100, height: 900 });
    await mockApi(page);
    await page.goto("/pages/product-detail.html?id=LST-TEST-0002");

    const center = page.locator("#pd-hero-center");
    const right = page.locator("#pd-hero-info");
    await expect(center).toBeVisible();
    await expect(right).toBeVisible();

    const [cBox, rBox] = await Promise.all([center.boundingBox(), right.boundingBox()]);
    // Aynı satırda duruyorlar: sağ ray ortanın ALTINA inmiyor.
    expect(rBox!.y).toBeCloseTo(cBox!.y, 0);
    // Ve sağındalar — üst üste binmiyorlar.
    expect(rBox!.x).toBeGreaterThan(cBox!.x);
    // Dar banttaki genişlik 300px (1280+'da 394px olur).
    expect(rBox!.width).toBeCloseTo(300, 0);
  });

  test("1280px'de sağ sipariş rayı 394px'e genişler", async ({ page }) => {
    // Bandın öteki ucu: aynı kuralın ikinci yarısı ölçülmeden kalmasın.
    await page.setViewportSize({ width: 1280, height: 900 });
    await mockApi(page);
    await page.goto("/pages/product-detail.html?id=LST-TEST-0002");

    const right = page.locator("#pd-hero-info");
    await expect(right).toBeVisible();
    const rBox = await right.boundingBox();
    expect(rBox!.width).toBeCloseTo(394, 0);
  });

  test("satıcı kartı dört metriği ve ana pazarları gösterir", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockApi(page);
    await page.goto("/pages/product-detail.html?id=LST-TEST-0002");

    const panel = page.locator("#pd-seller-panel");
    await expect(panel).toBeVisible();
    await expect(panel.locator("[data-seller-metric]")).toHaveCount(4);
    await expect(panel).toContainText("4.9/5 (365)");
    await expect(panel).toContainText("17%");
    await expect(panel.locator("[data-seller-markets]")).toContainText("Türkiye, Almanya");
  });
});
