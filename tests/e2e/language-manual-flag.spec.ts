/**
 * E2E — elle dil seçimi "manual" olarak işaretlenmeli.
 *
 * Neden: ülkeye göre otomatik dil seçimi (MOGEM-642) devreye girdiğinde
 * kullanıcının kendi seçimini EZMEMESİ gerekiyor. i18next otomatik tespit
 * sonucunu da `i18nextLng`'ye yazdığı için tek başına o anahtar "kullanıcı
 * seçti mi?" sorusunu cevaplayamaz — ayrı `th-lang-source` işareti bunun için.
 *
 * Bu test seçim YOLLARINI koruyor; `dilSeciciDenetimi.test.ts` ise hiçbir
 * dosyanın anahtara doğrudan yazmadığını kaynak seviyesinde koruyor.
 *
 * Ölçüldü (16 Eyl, gerçek tarayıcı): dört yolun dördü de işareti yazıyor;
 * header'dan AR seçimi ayrıca `<html dir="rtl">` yapıyor.
 */
import { test, expect, type Page } from "@playwright/test";
import { yalnizMasaustu } from "./fixtures/viewport";

yalnizMasaustu("dil seçici header popover'ında; mobil yol BottomNav'da ayrıca ölçüldü");

const LANG_KEY = "i18nextLng";
const SOURCE_KEY = "th-lang-source";

async function cerezBannerKapat(page: Page): Promise<void> {
  // Banner tıklamaları perdeleyebiliyor; en gizlilik korumalı seçenek seçilir.
  const reddet = page.locator("button", { hasText: /Tümünü Reddet|Reject all/i }).first();
  if (await reddet.count()) await reddet.click().catch(() => {});
}

async function depolanan(page: Page) {
  return page.evaluate(
    ([k, s]) => ({ dil: localStorage.getItem(k), kaynak: localStorage.getItem(s) }),
    [LANG_KEY, SOURCE_KEY]
  );
}

test("header popover'dan dil seçimi 'manual' işaretlenir ve dil değişir", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(800);
  await cerezBannerKapat(page);

  const once = await depolanan(page);
  expect(once.kaynak).toBeNull();

  await page.locator('[data-popover-target="popover-language-currency"]').first().click();
  await page.selectOption("#lang-select", "EN");
  await page.locator("[data-locale-save]").first().click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1200);

  const sonra = await depolanan(page);
  expect(sonra.dil).toBe("en");
  expect(sonra.kaynak).toBe("manual");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("Arapça seçimi RTL yönünü açar", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(800);
  await cerezBannerKapat(page);

  await page.locator('[data-popover-target="popover-language-currency"]').first().click();
  await page.selectOption("#lang-select", "AR");
  await page.locator("[data-locale-save]").first().click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1200);

  const sonra = await depolanan(page);
  expect(sonra.dil).toBe("ar");
  expect(sonra.kaynak).toBe("manual");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});

test("footer bölge menüsünden seçim de 'manual' işaretlenir", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(800);
  await cerezBannerKapat(page);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.locator("#footer-region-btn").click();
  // #footer-lang-select özel menü bileşeniyle gizleniyor; applyFooterRegion()
  // değeri select'ten okuduğu için value set + gerçek apply tıklaması yeterli.
  await page.evaluate(() => {
    const s = document.getElementById("footer-lang-select") as HTMLSelectElement | null;
    if (s) {
      s.value = "en";
      s.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
  await page.locator("#footer-region-apply").click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1200);

  const sonra = await depolanan(page);
  expect(sonra.dil).toBe("en");
  expect(sonra.kaynak).toBe("manual");
});

test("dört dil de seçilebilir olmalı — header", async ({ page }) => {
  // AR/RU 3 Haz 2026'da eklendi ama yalnız header güncellendi; footer (21 Tem)
  // ve mobil hesap menüsü (25 Tem) ikişer dille yazıldı. Mobilde header gizli
  // olduğu için mobil kullanıcı AR/RU'yu hiçbir yoldan seçemiyordu.
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(800);
  await cerezBannerKapat(page);

  await page.locator('[data-popover-target="popover-language-currency"]').first().click();
  const diller = await page.$$eval("#lang-select option", (os) =>
    os.map((o) => (o as HTMLOptionElement).value.toLowerCase())
  );
  expect(diller.sort()).toEqual(["ar", "en", "ru", "tr"]);
});

test("dört dil de seçilebilir olmalı — footer", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(800);
  await cerezBannerKapat(page);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.locator("#footer-region-btn").click();
  const diller = await page.$$eval("#footer-lang-select option", (os) =>
    os.map((o) => (o as HTMLOptionElement).value.toLowerCase())
  );
  expect(diller.sort()).toEqual(["ar", "en", "ru", "tr"]);
});
