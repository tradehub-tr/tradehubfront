/**
 * Seller storefront tabları, ilk boya sırasında yalnız seçili paneli oluşturur.
 * Her panel ilk niyette bir kez mount edilir; sonra gizlense bile yerinde kalır
 * ki kullanıcı state'i ve indirilen veri korunur.
 */
import { expect, test, type Page, type Route } from "@playwright/test";

const SELLER = {
  seller_code: "DEMO-001",
  slug: "demo-001",
  seller_name: "Demo Tedarikçi",
  rating: 4.7,
  review_count: 1,
  media_groups: [],
};

const PRODUCTS = {
  products: [{ name: "P-1", slug: "urun-1", product_name: "Örnek ürün", price_min: "100" }],
  total: 1,
};

async function mockBackend(page: Page, requests: string[]): Promise<void> {
  await page.route("**/api/method/**", async (route: Route) => {
    const url = new URL(route.request().url());
    const method = (url.pathname.split("/").pop() || "").split(".").pop() || "";
    requests.push(method);

    const message = method === "get_seller"
      ? SELLER
      : method === "get_seller_categories"
        ? { categories: [] }
        : method === "get_seller_products"
          ? PRODUCTS
          : method === "get_reviews"
            ? { reviews: [], total: 0 }
            : method === "get_session_user"
              ? { logged_in: false, csrf_token: "test" }
              : {};

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message }),
    });
  });
}

test.describe("Seller storefront — lazy profile tabs", () => {
  test("gizli paneller başlangıçta mount/fetch edilmez; ilk açılıştan sonra state korunur", async ({ page }) => {
    const requests: string[] = [];
    await mockBackend(page, requests);
    await page.goto("/pages/seller/seller-storefront.html?seller=DEMO-001");

    await expect(page.locator("#tab-overview")).toBeAttached();
    await expect(page.locator("#tab-reviews, #tab-products, #tab-videos, #tab-contact")).toHaveCount(0);
    expect(requests).not.toContain("get_reviews");

    const reviewsTab = page.locator("#store-tab-reviews");
    await reviewsTab.click();
    await expect(page.locator("#tab-reviews")).toBeVisible();
    await expect.poll(() => requests.filter((method) => method === "get_reviews").length).toBe(1);

    await page.locator("#store-tab-overview").click();
    await reviewsTab.click();
    expect(requests.filter((method) => method === "get_reviews")).toHaveLength(1);
  });

  test("sekme rolleri ve ok tuşu navigasyonu seçili paneli ilk niyette mount eder", async ({ page }) => {
    const requests: string[] = [];
    await mockBackend(page, requests);
    await page.goto("/pages/seller/seller-storefront.html?seller=DEMO-001");

    const tablist = page.getByRole("tablist");
    await expect(tablist).toBeVisible();
    const overviewTab = page.locator("#store-tab-overview");
    await expect(overviewTab).toHaveAttribute("aria-selected", "true");

    await overviewTab.focus();
    await page.keyboard.press("ArrowRight");
    const reviewsTab = page.locator("#store-tab-reviews");
    await expect(reviewsTab).toBeFocused();
    await expect(reviewsTab).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#tab-reviews")).toBeVisible();
  });

  test("doğrudan contact URL'si sadece contact panelini başlangıçta mount eder", async ({ page }) => {
    const requests: string[] = [];
    await mockBackend(page, requests);
    await page.goto("/pages/seller/seller-storefront.html?seller=DEMO-001&tab=contact");

    await expect(page.locator("#tab-contact")).toBeAttached();
    await expect(page.locator("#tab-overview, #tab-reviews, #tab-products, #tab-videos")).toHaveCount(0);
    expect(requests).not.toContain("get_reviews");
  });
});
