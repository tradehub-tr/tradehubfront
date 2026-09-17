/**
 * E2E — PANELDE İLK BOYAMA DİLİ (MOGEM-642 · Faz 2).
 *
 * Neden panelin ayrı bir testi var: panel Vue SPA, storefront Vite MPA.
 * Panelde `initializeI18n()` belge yönünü ancak `await loadStartupMessages()`
 * bittikten SONRA uyguluyor (`src/i18n/index.js`), yani sözlük parçası ağdan
 * gelene kadar Arapça kullanıcı `lang="tr"` ve LTR bir belge görüyor.
 * Ölçüldü 17 Eyl 2026 (dist + nginx, çerez `th-lang=ar`): nitelikler 217 ms'te
 * düzeliyordu; `index.html`'e konan satır içi script ~1 ms'te yazıyor.
 *
 * Giriş GEREKMİYOR: karar çerezden/adresten veriliyor, oturumdan değil.
 * Testin oturum açmaması bilinçli — kusuru oturum açma akışına bağlamak,
 * giriş bozulduğunda bu testi de sessizce kör ederdi.
 *
 * Çalıştırma: ./e2e.sh --panel
 */
import { expect, test, type Page } from "@playwright/test";

const BASE = process.env.PANEL_BASE ?? "http://tradehub.localhost";

test.use({ baseURL: BASE });

/** Bütün script isteklerini iptal eder — geriye satır içi <head> kalır. */
async function jsKapat(page: Page) {
  await page.route(/\.(ts|js|mjs|tsx)(\?.*)?$/, (route) => route.abort());
  await page.route("**/assets/**", (route) => route.abort());
}

async function belgeDurumu(page: Page) {
  return page.evaluate(() => ({
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
    karar: (window as unknown as { __thDil?: { lang: string; kaynak: string } }).__thDil,
  }));
}

test("storefront'ta seçilen dil panelde İLK BOYAMADA geçerli (JS inmeden)", async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: "th-lang", value: "ar", url: BASE },
    { name: "th-lang-source", value: "manual", url: BASE },
  ]);
  await jsKapat(page);
  await page.goto("/panel/", { waitUntil: "domcontentloaded" });

  const d = await belgeDurumu(page);
  expect(d.lang).toBe("ar");
  expect(d.dir).toBe("rtl");
  expect(d.karar).toEqual({ lang: "ar", kaynak: "manual" });
});

test("storefront'un OTOMATİK kararı (auto çerezi) panelde de ilk boyamada geçerli", async ({
  page,
  context,
}) => {
  // Panelin kendi ülke tespiti YOK; storefront'un kararını miras alıyor.
  await context.addCookies([
    { name: "th-lang", value: "ru", url: BASE },
    { name: "th-lang-source", value: "auto", url: BASE },
  ]);
  await jsKapat(page);
  await page.goto("/panel/", { waitUntil: "domcontentloaded" });

  const d = await belgeDurumu(page);
  expect(d.lang).toBe("ru");
  expect(d.dir).toBe("ltr");
  expect(d.karar?.kaynak).toBe("auto");
});

test("?hl=ar panelde de ilk boyamada geçerli", async ({ page }) => {
  await jsKapat(page);
  await page.goto("/panel/?hl=ar", { waitUntil: "domcontentloaded" });

  const d = await belgeDurumu(page);
  expect(d.lang).toBe("ar");
  expect(d.dir).toBe("rtl");
  expect(d.karar?.kaynak).toBe("hl");
});

test("JS indikten sonra panel kararı DEĞİŞTİRMİYOR", async ({ page, context }) => {
  // İki taraf aynı sırayı uyguluyor (birim testi `admin-panel/frontend/src/
  // i18n/__tests__/ilkBoyamaDili.test.js` kilitliyor); burada zincirin
  // ucunda da aynı kaldığı görülüyor.
  await context.addCookies([
    { name: "th-lang", value: "ar", url: BASE },
    { name: "th-lang-source", value: "manual", url: BASE },
  ]);
  await page.goto("/panel/", { waitUntil: "domcontentloaded" });
  const erken = await belgeDurumu(page);
  expect(erken.lang).toBe("ar");

  // Uygulama gerçekten kurulana kadar bekle. `networkidle` panelde hiç
  // gelmiyor (soket bağlantısı açık kalıyor) — ölçüldü 17 Eyl 2026.
  await page.locator("#app *").first().waitFor({ state: "attached", timeout: 30_000 });
  await page.waitForTimeout(1500);
  const gec = await belgeDurumu(page);
  expect(gec.lang).toBe("ar");
  expect(gec.dir).toBe("rtl");
});
