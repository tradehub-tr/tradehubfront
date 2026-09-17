/**
 * E2E — ÜLKEYE GÖRE OTOMATİK DİL (MOGEM-642 · Faz 5).
 *
 * Görevin çekirdek isteği: "Kullanıcı siteye ilk kez girdiğinde, bağlandığı
 * ülkeye göre uygun dil otomatik açılmalı." Bu spec o zincirin TARAYICI
 * ucunu ölçer.
 *
 * ── İŞ BÖLÜMÜ (önemli) ─────────────────────────────────────────────────────
 * Zincir iki parçalı:
 *   1. nginx ziyaretçinin IP'sinden ülkeyi bulup `th-country` çerezine yazar.
 *   2. Tarayıcıdaki açılış script'i o çerezi okuyup dili seçer.
 *
 * Burası (2)'yi ölçüyor: çerez verildiğinde doğru dil açılıyor mu, öncelik
 * sırası doğru mu. (1) ayrı bir takımda ölçülüyor —
 * `scripts/ulke-tablosu-dogrula.sh` (`npm run check:ulke`), üretim nginx
 * imajına karşı 30 iddia. İkisinin BİRLEŞİMİ de orada, gerçek tarayıcıyla.
 *
 * Neden burada nginx koşmuyor: bu spec mock E2E paketinin parçası ve Vite dev
 * sunucusuna karşı koşuyor; dev sunucusu `nginx.conf.template`i hiç
 * görmüyor. Çerezi elle vermek, nginx'in yaptığı şeyin aynısı.
 *
 * ── Tarayıcı dili SABİTLENDİ ───────────────────────────────────────────────
 * `locale: "en-US"`: ülke bilinmediğinde zincir tarayıcı diline düşüyor.
 * Koşucunun yerel ayarı Türkçe olsaydı "ülke yokken İngilizce" iddiası
 * makineden makineye değişirdi.
 */
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { yalnizMasaustu } from "./fixtures/viewport";

yalnizMasaustu("ülke kararı viewport'tan bağımsız");

test.use({ locale: "en-US" });

const BASE = "http://localhost:5173";

/** nginx'in yaptığı şeyi taklit eder: ülke çerezini yazar. */
async function ulkeyiKur(context: BrowserContext, ulke: string): Promise<void> {
  await context.addCookies([{ name: "th-country", value: ulke, url: BASE }]);
}

async function belgeDurumu(page: Page) {
  return page.evaluate(() => ({
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
    karar: (window as unknown as { __thDil?: { lang: string; kaynak: string } }).__thDil,
    dilCerezi: (document.cookie.match(/(?:^|;\s*)th-lang=([a-z]{2})/) || [])[1] ?? null,
    kaynakCerezi: (document.cookie.match(/(?:^|;\s*)th-lang-source=([a-z]+)/) || [])[1] ?? null,
  }));
}

test.describe("ülke → dil", () => {
  for (const [ulke, dil, yon] of [
    ["TR", "tr", "ltr"],
    ["RU", "ru", "ltr"],
    ["SA", "ar", "rtl"],
    ["AE", "ar", "rtl"],
    ["EG", "ar", "rtl"],
  ] as const) {
    test(`${ulke} → ${dil} (${yon})`, async ({ page, context }) => {
      await ulkeyiKur(context, ulke);
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const d = await belgeDurumu(page);
      expect(d.lang).toBe(dil);
      expect(d.dir).toBe(yon);
      expect(d.karar).toEqual({ lang: dil, kaynak: "country" });
    });
  }

  test("haritada olmayan ülke (DE) → tarayıcı diline düşer, site açılır", async ({
    page,
    context,
  }) => {
    // Görev metni: "Almanya gibi dili desteklenmeyen bir ülkenin bağlantısında
    // İngilizce açılmalı."
    await ulkeyiKur(context, "DE");
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const d = await belgeDurumu(page);
    expect(d.lang).toBe("en");
    expect(d.karar?.kaynak).toBe("browser");
    await expect(page.locator("#app")).not.toBeEmpty();
  });

  test("ülke HİÇ bilinmiyorsa İngilizce açılır ve site çalışır", async ({ page }) => {
    // Görev metni: "Ülke tespitinde sorun yaşanırsa site açılmaya devam edecek."
    // nginx ülkeyi bulamazsa çerezi HİÇ göndermiyor — burada da çerez yok.
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const d = await belgeDurumu(page);
    expect(d.lang).toBe("en");
    await expect(page.locator("#app")).not.toBeEmpty();
  });
});

test.describe("öncelik sırası — ülke her şeyi ezmez", () => {
  test("elle seçim ülkeyi EZER (görevin 4. maddesi)", async ({ page, context }) => {
    // "Kullanıcının elle seçtiği dil hatırlanacak. Sonraki ziyaretlerde
    // otomatik ülke tespiti bu seçimi değiştirmeyecek."
    await ulkeyiKur(context, "SA");
    await context.addCookies([
      { name: "th-lang", value: "tr", url: BASE },
      { name: "th-lang-source", value: "manual", url: BASE },
    ]);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const d = await belgeDurumu(page);
    expect(d.lang).toBe("tr");
    expect(d.karar?.kaynak).toBe("manual");
  });

  test("`?hl=` ülkeyi EZER (paylaşılan bağlantı kazanır)", async ({ page, context }) => {
    await ulkeyiKur(context, "SA");
    await page.goto("/?hl=ru");
    await page.waitForLoadState("networkidle");

    const d = await belgeDurumu(page);
    expect(d.lang).toBe("ru");
    expect(d.karar?.kaynak).toBe("hl");
  });

  test("ülke kararı elle seçim SAYILMAZ — sonraki ziyarette yeniden bakılır", async ({
    page,
    context,
  }) => {
    // Kritik ayrım: ülkeden gelen karar çereze "auto" olarak yazılıyor.
    // "manual" yazılsaydı, kullanıcı ülke değiştirdiğinde (taşınma, seyahat)
    // ilk tahmine sonsuza kadar kilitlenirdi.
    await ulkeyiKur(context, "SA");
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const d = await belgeDurumu(page);
    expect(d.dilCerezi).toBe("ar");
    expect(d.kaynakCerezi).toBe("auto");
  });
});

test.describe("panel köprüsü — ülke kararı panele de geçiyor mu", () => {
  test("ülkeden gelen dil ortak çereze yazılıyor (panel onu miras alır)", async ({
    page,
    context,
  }) => {
    // Faz 1'de kurulan köprü: storefront `th-lang` + `th-lang-source` yazar,
    // panel aynı çerezleri okur. Ülke kaynağı bu köprüyle İLK KEZ birleşiyor —
    // panelin kendi ülke tespiti yok, storefront'un kararını miras alıyor.
    await ulkeyiKur(context, "RU");
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const cerezler = await context.cookies(BASE);
    const dil = cerezler.find((c) => c.name === "th-lang");
    const kaynak = cerezler.find((c) => c.name === "th-lang-source");
    expect(dil?.value).toBe("ru");
    expect(kaynak?.value).toBe("auto");
    // Panel tarafının bu çerezi okuduğu `panel-dil-koprusu.spec.ts`'te ölçülüyor.
  });
});

test.describe("modül zinciri inmeden — yalnız <head> script'i", () => {
  test("ülke çerezi ilk boyamada dili belirliyor (JS paketi kapalı)", async ({ page, context }) => {
    // Faz 2'nin kurgusu: dil kararı `<head>`de, uygulamanın JS'i inmeden
    // veriliyor. Ülke kaynağı da o script'ten okunuyor mu — burada script
    // TEK BAŞINA bırakılıyor.
    await ulkeyiKur(context, "SA");
    await page.route(/\.(ts|js|mjs|tsx)(\?.*)?$/, (route) => route.abort());
    await page.route("**/@vite/**", (route) => route.abort());
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const d = await belgeDurumu(page);
    expect(d.lang).toBe("ar");
    expect(d.dir).toBe("rtl");
    expect(d.karar).toEqual({ lang: "ar", kaynak: "country" });
  });
});
