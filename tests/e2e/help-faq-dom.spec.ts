import { expect, test } from "@playwright/test";

test("yardım merkezi mobil menüsünü açılana kadar DOM'a eklemez", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/pages/help/help-center.html");
  await page.waitForSelector("#help-center-root");

  await expect(page.locator("#hc-mobile-menu")).toHaveCount(0);

  const trigger = page.locator('button[aria-controls="hc-mobile-menu"]');
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();

  await expect(page.locator("#hc-mobile-menu")).toHaveCount(1);
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
});

test("SSS cevabını yalnız ilgili akordeon açıldığında DOM'a ekler ve ARIA durumunu korur", async ({ page }) => {
  await page.goto("/pages/help/faq-detail.html?cat=account&sub=accountLogin");
  await page.waitForSelector("#faq-detail-root");

  await expect(page.locator('[x-show="openItem === idx"]')).toHaveCount(0);

  const firstQuestion = page.locator("#faq-detail-root .space-y-3 button").first();
  await expect(firstQuestion).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#faq-answer-0")).toHaveCount(0);

  await firstQuestion.click();
  await expect(firstQuestion).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#faq-answer-0")).toHaveCount(1);

  await firstQuestion.click();
  await expect(firstQuestion).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#faq-answer-0")).toHaveCount(0);
});
