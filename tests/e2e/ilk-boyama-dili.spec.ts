/**
 * E2E — İLK BOYAMA DİLİ (MOGEM-642 · Faz 2).
 *
 * Birim testleri (`src/i18n/__tests__/ilkBoyamaDili.test.ts`) script'in
 * KARARINI ve enjeksiyonun yerini kilitliyor. Burası zincirin ucunu ölçer:
 * tarayıcı sayfayı ilk boyadığında `<html lang>`, `dir` ve sekme başlığı
 * gerçekten doğru dilde mi.
 *
 * ── Ölçülen kusur (17 Eyl 2026, dist + nginx, 400 kbps / 4x CPU, `/?hl=ar`)
 *   447 ms    sekme başlığı → "iStoc | Global B2B Toptan Satış ve Ticaret…"
 *   12.307 ms lang: tr → ar · dir: (yok) → rtl · başlık Arapçaya döndü
 * Yani Arapça bağlantıyla gelen ziyaretçi 11,9 saniye Türkçe bir sekme
 * başlığı ve `lang="tr"` görüyordu.
 *
 * ── Neden "JS'i kapat" testi ────────────────────────────────────────────────
 * Aşağıdaki ilk blok BÜTÜN script isteklerini iptal eder. Modül zinciri hiç
 * çalışmaz, geriye yalnız `<head>`'deki satır içi script kalır. Faz 1'de
 * ölçülen tuzak tam buydu: dil seçicisi seçimden sonra sayfayı yenilediği
 * için `writeLangCookie` çağrısı SİLİNSE bile iki E2E yeşil kalmıştı. Bir
 * testin neyi ölçtüğü, ölçtüğü şeyi tek başına bırakmadıkça belli olmuyor.
 */
import { expect, test, type Page } from "@playwright/test";
import { yalnizMasaustu } from "./fixtures/viewport";

yalnizMasaustu("ilk boyama kararı viewport'tan bağımsız");

/** Bütün script isteklerini iptal eder — geriye satır içi <head> kalır. */
async function jsKapat(page: Page) {
  await page.route(/\.(ts|js|mjs|tsx)(\?.*)?$/, (route) => route.abort());
  await page.route("**/@vite/**", (route) => route.abort());
  await page.route("**/node_modules/**", (route) => route.abort());
}

async function belgeDurumu(page: Page) {
  return page.evaluate(() => ({
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
    baslik: document.title,
    karar: (window as unknown as { __thDil?: { lang: string; kaynak: string } }).__thDil,
  }));
}

test.describe("modül zinciri HİÇ çalışmadan — yalnız <head> script'i", () => {
  test("?hl=ar → lang=ar, dir=rtl, başlık Arapça", async ({ page }) => {
    await jsKapat(page);
    await page.goto("/?hl=ar", { waitUntil: "domcontentloaded" });

    const d = await belgeDurumu(page);
    expect(d.lang).toBe("ar");
    expect(d.dir).toBe("rtl");
    expect(d.karar).toEqual({ lang: "ar", kaynak: "hl" });
    // Sekme başlığı: JS'ten önce görünen TEK dil parçası.
    expect(d.baslik).not.toContain("Toptan Satış");
    expect(d.baslik).toMatch(/[؀-ۿ]/); // Arap alfabesi
  });

  test("?hl=ru → lang=ru, dir açıkça ltr", async ({ page }) => {
    await jsKapat(page);
    await page.goto("/?hl=ru", { waitUntil: "domcontentloaded" });

    const d = await belgeDurumu(page);
    expect(d.lang).toBe("ru");
    expect(d.dir).toBe("ltr");
    expect(d.baslik).toMatch(/[Ѐ-ӿ]/); // Kiril
  });

  test("elle seçim çerezi (panelde seçilmiş olabilir) ilk boyamada geçerli", async ({
    page,
    context,
  }) => {
    await context.addCookies([
      { name: "th-lang", value: "ar", url: "http://localhost:5173" },
      { name: "th-lang-source", value: "manual", url: "http://localhost:5173" },
    ]);
    await jsKapat(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const d = await belgeDurumu(page);
    expect(d.lang).toBe("ar");
    expect(d.dir).toBe("rtl");
    expect(d.karar?.kaynak).toBe("manual");
  });

  test("ülke meta'sı DOLDURULUNCA ilk boyamada ülke dili açılır (Faz 5 kancası)", async ({
    page,
  }) => {
    // Sunucu bu meta'yı bugün `XX` bırakıyor (kaynak K1 kararına bağlı).
    // Burada nginx/backend'in Faz 5'te yapacağı şey taklit ediliyor: değeri
    // doldur, zincirin geri kalanı çalışıyor mu?
    await page.route("**/", async (route) => {
      const yanit = await route.fetch();
      const govde = (await yanit.text()).replace(
        '<meta name="th-country" content="XX" />',
        '<meta name="th-country" content="SA" />'
      );
      await route.fulfill({ response: yanit, body: govde });
    });
    await jsKapat(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const d = await belgeDurumu(page);
    expect(d.karar).toEqual({ lang: "ar", kaynak: "country" });
    expect(d.dir).toBe("rtl");
  });

  test("hiçbir ipucu yoksa ülke meta'sı XX iken davranış DEĞİŞMEZ", async ({ page }) => {
    // Faz 5 bağlanana kadar `XX` = "bilmiyorum". Ülke basamağı atlanır ve
    // karar tarayıcı diline düşer — yani Faz 1'deki davranışın aynısı.
    await jsKapat(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const d = await belgeDurumu(page);
    expect(d.karar?.kaynak).not.toBe("country");
  });
});

test.describe("JS gecikirken sayfa doğru dilde duruyor", () => {
  test.setTimeout(90_000);

  /**
   * ⚠ Burada BİLEREK "ilk boyamada yanlış dil boyanıyor mu" ölçülmüyor.
   * Denendi ve ÇÜRÜTÜLDÜ (17 Eyl 2026): storefront'un 71 sayfasının gövdesi
   * `<div id="app">` kabuğu, içerik JS ile çiziliyor. Yani ilk boyama zaten
   * modül zincirinden SONRA geliyor; "önce Türkçe metin, sonra Arapça metin"
   * diye bir boyama hiç olmuyor. O kurguyla yazılan test, düzeltme geri
   * alındığında bile yeşil kaldı — yani hiçbir şey ölçmüyordu (ağ 500 kbps'e,
   * CPU 4x'e kısıtlıyken bile).
   *
   * Ölçülebilen gerçek kusur ZAMANLAMA: `<html lang>`, `dir` ve sekme
   * başlığı, uygulamanın JS'i inene kadar yanlış dilde duruyordu (dist+nginx,
   * 400 kbps: 12,3 saniye). Aşağıdaki test script isteklerini geciktirip tam
   * o pencereye bakıyor.
   */
  test("script'ler 3 sn gecikirken bile lang/dir/başlık ilk andan doğru", async ({ page }) => {
    // YALNIZ giriş script'i geciktirilir. Her modül isteğini geciktirmek dev
    // sunucusunda yüzlerce isteği üst üste bindirip testi zaman aşımına
    // uğratıyordu; giriş gecikince zincirin tamamı zaten başlayamıyor.
    let geciktirildi = false;
    await page.route(/\.(ts|js|mjs|tsx)(\?.*)?$/, async (route) => {
      if (!geciktirildi) {
        geciktirildi = true;
        await new Promise((r) => setTimeout(r, 3000));
      }
      await route.continue();
    });

    await page.goto("/?hl=ar", { waitUntil: "commit" });
    const erken = await belgeDurumu(page);
    expect(erken.lang, "modül zinciri inmeden lang doğru olmalı").toBe("ar");
    expect(erken.dir).toBe("rtl");
    expect(erken.baslik).toMatch(/[\u0600-\u06FF]/);

    // Gecikme bitince modül zinciri kararı DEĞİŞTİRMEMELİ: iki taraf aynı
    // sırayı uyguluyor (birim testi `ilkBoyamaDili.test.ts` bunu kilitliyor),
    // burada zincirin ucunda da aynı kaldığı görülüyor.
    // Uygulama gerçekten kurulana kadar bekle (networkidle dev sunucusunda
    // HMR soketi yüzünden hiç gelmiyor).
    await page.locator("#app *").first().waitFor({ state: "attached", timeout: 60_000 });
    const gec = await belgeDurumu(page);
    expect(gec.lang).toBe("ar");
    expect(gec.dir).toBe("rtl");
  });
});
