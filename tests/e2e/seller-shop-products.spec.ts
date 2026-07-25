import { expect, test, type Page, type Route } from "@playwright/test";

const SELLER = {
  seller_code: "DEMO-001",
  slug: "demo-001",
  seller_name: "Demo Tedarikçi",
  rating: 4.8,
};

type SellerShopState = {
  filterByCategory(category: string, categoryType: string): void;
  sortBy: string;
  sortProducts(): void;
};

function productsFor(page: number, category: string | null) {
  const firstIndex = (page - 1) * 12 + 1;
  return Array.from({ length: 12 }, (_, index) => ({
    name: `P-${firstIndex + index}`,
    slug: `urun-${firstIndex + index}`,
    product_name: `${category || "Tüm"} Ürün ${firstIndex + index}`,
    price_min: "100",
    category: category || "seller-cat",
    product_category: category || "platform-cat",
  }));
}

async function mockSellerShop(page: Page, productRequests: URL[]): Promise<void> {
  await page.route("**/api/method/**", async (route: Route) => {
    const url = new URL(route.request().url());
    const method = url.pathname.split("/").pop() || "";

    if (method.endsWith("get_seller_products")) {
      productRequests.push(url);
      const pageNumber = Number(url.searchParams.get("page") || "1");
      const category = url.searchParams.get("category");
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ message: { products: productsFor(pageNumber, category), total: 36 } }),
      });
      return;
    }

    const message = method.endsWith("get_seller")
      ? SELLER
      : method.endsWith("get_storefront_layout")
        ? { sections: [{ type: "category_listing", order: 1, enabled: true, settings: {} }], theme: {} }
        : method.endsWith("get_seller_categories")
          ? { categories: [{ name: "platform-cat", category_name: "Platform", type: "platform" }] }
          : method.endsWith("get_session_user")
            ? { logged_in: false }
            : {};
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ message }) });
  });
}

test.describe("Seller shop — server pagination", () => {
  test("dolu mağazada ilk açılış yalnız page=1 ister; sayfa 2 kullanıcı niyetiyle gelir", async ({ page }) => {
    const productRequests: URL[] = [];
    await mockSellerShop(page, productRequests);
    await page.goto("/pages/seller/seller-shop.html?seller=DEMO-001#products");

    await expect(page.locator("#shop-products")).toBeVisible();
    await expect.poll(() => productRequests.length).toBe(1);
    expect(productRequests[0].searchParams.get("page")).toBe("1");
    expect(productRequests[0].searchParams.get("page_size")).toBe("12");

    await page.locator("#shop-products button[aria-label]").last().click();
    await expect.poll(() => productRequests.length).toBe(2);
    expect(productRequests[1].searchParams.get("page")).toBe("2");
    expect(productRequests[1].searchParams.get("page_size")).toBe("12");
  });

  test("platform kategori ve sıralama backend sözleşmesine taşınır", async ({ page }) => {
    const productRequests: URL[] = [];
    await mockSellerShop(page, productRequests);
    await page.goto("/pages/seller/seller-shop.html?seller=DEMO-001#products");
    await expect.poll(() => productRequests.length).toBe(1);

    await page.evaluate(() => {
      const root = document.querySelector<HTMLElement>("[x-data='sellerShop']");
      const state = (root as HTMLElement & { _x_dataStack: SellerShopState[] })._x_dataStack[0];
      state.filterByCategory("platform-cat", "platform");
    });
    await expect.poll(() => productRequests.length).toBe(2);
    expect(productRequests[1].searchParams.get("category")).toBe("platform-cat");
    expect(productRequests[1].searchParams.get("category_type")).toBe("platform");

    await page.evaluate(() => {
      const root = document.querySelector<HTMLElement>("[x-data='sellerShop']");
      const state = (root as HTMLElement & { _x_dataStack: SellerShopState[] })._x_dataStack[0];
      state.sortBy = "price_asc";
      state.sortProducts();
    });
    await expect.poll(() => productRequests.length).toBe(3);
    expect(productRequests[2].searchParams.get("sort")).toBe("price_asc");
  });
});
