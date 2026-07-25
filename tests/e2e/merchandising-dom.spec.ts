import { expect, test } from "@playwright/test";

test("fırsatlar mobil sticky başlığını yalnız hero görünümden çıktıktan sonra mount eder ve gradient id'leri benzersizdir", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const dealRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("tradehub_core.api.listing.get_listings")) {
      dealRequests.push(request.url());
    }
  });
  await page.goto("/pages/top-deals.html");
  await page.waitForSelector("#td-mobile-hero-sentinel");

  expect(await page.locator("#td-sticky-mobile-header").count()).toBe(0);
  const duplicateIds = await page.locator("[id]").evaluateAll((nodes) => {
    const counts = new Map<string, number>();
    nodes.forEach((node) => counts.set(node.id, (counts.get(node.id) ?? 0) + 1));
    return [...counts.entries()].filter(([, count]) => count > 1);
  });
  expect(duplicateIds).toEqual([]);

  await page.locator("#td-mobile-hero-sentinel").scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 900);
  await expect(page.locator("#td-sticky-mobile-header")).toHaveCount(1);
  await expect.poll(() => dealRequests.length).toBeGreaterThan(0);
  expect(dealRequests.some((url) => url.includes("page_size=24"))).toBe(true);
});

test("çok satanlar girişleri mobil sticky header DOM'unu scroll öncesi üretmez", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto("/pages/top-ranking.html");
  await page.waitForSelector("#tr-mobile-hero-sentinel");
  await expect(page.locator("#tr-sticky-mobile-header")).toHaveCount(0);

  await page.goto("/pages/top-ranking-category.html?cat=fixture-category");
  await page.waitForSelector("#trc-mobile-hero-sentinel");
  await expect(page.locator("#tr-sticky-mobile-header")).toHaveCount(0);
});
