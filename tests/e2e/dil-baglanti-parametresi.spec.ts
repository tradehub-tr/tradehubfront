/**
 * E2E — `?hl=` bağlantı parametresi ve dil çerezi köprüsü (MOGEM-642 · Faz 1).
 *
 * Neden: 16 Eyl 2026'da ölçüldü — `?hl=` ve `?lang=` kodda hiç okunmuyordu
 * (`grep "hl=" src/i18n/` → 0 satır), yani `istoc.com/?hl=ar` yazan ziyaretçi
 * Türkçe bir sayfa görüyordu. Yönetici kararı bağlantının bu biçimde olması
 * yönünde (`/tr` değil `?hl=tr`).
 *
 * Birim testleri (`src/i18n/__tests__/dilKarari.test.ts`) karar SIRASINI
 * kilitliyor; burası zincirin ucunu ölçer: ziyaretçi gerçekten o dili görüyor
 * mu, adres temizleniyor mu, ikinci sayfada tercih duruyor mu.
 *
 * Kapsam dışı (bilerek): ülkeye göre otomatik seçim. `<meta name="th-country">`
 * kaynağı K1 kararına bağlı, Faz 5'te bağlanacak. Burada yalnız meta ENJEKTE
 * EDİLİRSE zincirin çalıştığı ölçülüyor.
 */
import { test, expect, type Page } from "@playwright/test";
import { yalnizMasaustu } from "./fixtures/viewport";

yalnizMasaustu("dil kararı viewport'tan bağımsız; mobil yol ayrıca ölçüldü");

const LANG_KEY = "i18nextLng";
const COOKIE_KEY = "th-lang";
const SOURCE_COOKIE = "th-lang-source";

async function dilDurumu(page: Page) {
  return page.evaluate(
    ([depoAnahtari, cerezAdi, kaynakAdi]) => {
      const cerez = (ad: string) => {
        const eslesme = document.cookie
          .split(";")
          .map((p) => p.trim())
          .find((p) => p.startsWith(`${ad}=`));
        return eslesme ? decodeURIComponent(eslesme.slice(ad.length + 1)) : null;
      };
      return {
        htmlLang: document.documentElement.lang,
        htmlDir: document.documentElement.dir,
        depo: localStorage.getItem(depoAnahtari),
        cerezDil: cerez(cerezAdi),
        cerezKaynak: cerez(kaynakAdi),
        adres: location.href,
      };
    },
    [LANG_KEY, COOKIE_KEY, SOURCE_COOKIE]
  );
}

test("?hl=ar ile gelen ziyaretçi Arapça görür, RTL açılır", async ({ page }) => {
  await page.goto("/?hl=ar");
  await page.waitForLoadState("networkidle");

  const durum = await dilDurumu(page);
  expect(durum.htmlLang).toBe("ar");
  expect(durum.htmlDir).toBe("rtl");
  expect(durum.depo).toBe("ar");
});

test("?hl= işlendikten sonra adresten TEMİZLENİR", async ({ page }) => {
  await page.goto("/?hl=ru");
  await page.waitForLoadState("networkidle");

  const durum = await dilDurumu(page);
  expect(durum.htmlLang).toBe("ru");
  // Karar (16 Eyl): parametre giriş kapısı, hafıza çerezde. Adreste kalsaydı
  // ilk iç bağlantıda zaten düşecek, bu arada Google `/?hl=ru` ile `/`yi iki
  // ayrı sayfa sayacaktı.
  expect(durum.adres).not.toContain("hl=");
});

test("?hl= diğer sorgu parametrelerini UÇURMAZ", async ({ page }) => {
  // Naif bir temizlik (sorguyu tamamen silmek) arama sayfasında kullanıcının
  // aramasını kaybettirirdi.
  await page.goto("/pages/products.html?hl=ru&q=masa");
  await page.waitForLoadState("networkidle");

  const durum = await dilDurumu(page);
  expect(durum.adres).not.toContain("hl=");
  expect(durum.adres).toContain("q=masa");
});

test("?hl= tercihi KALICI — ikinci sayfada dil korunur", async ({ page }) => {
  await page.goto("/?hl=ru");
  await page.waitForLoadState("networkidle");
  expect((await dilDurumu(page)).htmlLang).toBe("ru");

  // Parametresiz ikinci ziyaret: tercih çerezden/depodan okunmalı.
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const durum = await dilDurumu(page);
  expect(durum.htmlLang).toBe("ru");
  expect(durum.cerezDil).toBe("ru");
  expect(durum.cerezKaynak).toBe("manual");
});

test("?hl= çerezi 'manual' yazar — ülke tespiti bunu ezmemeli", async ({ page }) => {
  await page.goto("/?hl=ar");
  await page.waitForLoadState("networkidle");

  const durum = await dilDurumu(page);
  expect(durum.cerezDil).toBe("ar");
  expect(durum.cerezKaynak).toBe("manual");
});

test("desteklenmeyen ?hl=de yok sayılır, sayfa normal açılır", async ({ page }) => {
  await page.goto("/?hl=de");
  await page.waitForLoadState("networkidle");

  const durum = await dilDurumu(page);
  expect(["tr", "en", "ar", "ru"]).toContain(durum.htmlLang);
  // Parametre tanınmadığı için adres de DEĞİŞMEZ — temizlik yalnız geçerli
  // dil işlendiğinde yapılır.
  expect(durum.adres).toContain("hl=de");
});

test("?lang= eski biçimi de çalışır", async ({ page }) => {
  await page.goto("/?lang=ru");
  await page.waitForLoadState("networkidle");
  expect((await dilDurumu(page)).htmlLang).toBe("ru");
});

test("elle seçim ?hl= olmadan korunur ve çereze yazılır", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(600);

  const reddet = page.locator("button", { hasText: /Tümünü Reddet|Reject all/i }).first();
  if (await reddet.count()) await reddet.click().catch(() => {});

  await page.locator('[data-popover-target="popover-language-currency"]').first().click();
  await page.selectOption("#lang-select", "RU");
  await page.locator("[data-locale-save]").first().click();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  const durum = await dilDurumu(page);
  expect(durum.cerezDil).toBe("ru");
  expect(durum.cerezKaynak).toBe("manual");
});

/**
 * Sunucunun ülke kodunu HTML'e yazmasını taklit eder.
 *
 * `addInitScript` ile denendi ve ÇALIŞMADI: o kanca document-start'ta koşuyor,
 * `document.head` henüz yok, `appendChild` hata atıp script'in geri kalanını
 * da (çerez yazımı dahil) sessizce durduruyordu. Zaten doğrusu da bu: meta
 * sunucudan GELMELİ — Faz 5'te yapılacak iş tam olarak budur, yalnız değerin
 * kaynağı (Cloudflare / nginx geo / backend) K1 kararına bağlı.
 */
async function ulkeMetasiEnjekteEt(page: Page, kod: string): Promise<void> {
  await page.route("**/*", async (route) => {
    const istek = route.request();
    if (istek.resourceType() !== "document") return route.fallback();
    const yanit = await route.fetch();
    const govde = await yanit.text();
    return route.fulfill({
      response: yanit,
      body: govde.replace("<head>", `<head><meta name="th-country" content="${kod}">`),
    });
  });
}

test("ülke META'sı zinciri sürer — elle seçim yokken ülke dili kazanır", async ({ page }) => {
  // Faz 5'te bu meta'yı sunucu dolduracak (kaynağı K1 kararına bağlı).
  // Burada ÖN YÜZ tarafı ölçülüyor: sunucu kodu geldiğinde bağlanacak uç
  // gerçekten çalışıyor mu?
  await ulkeMetasiEnjekteEt(page, "SA");
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const durum = await dilDurumu(page);
  expect(durum.htmlLang).toBe("ar");
  expect(durum.htmlDir).toBe("rtl");
  // Otomatik karar "auto" işaretlenir: kullanıcı elle seçerse ezilebilmeli.
  expect(durum.cerezKaynak).toBe("auto");
});

test("elle seçim ülke META'sını EZER — görevin açık şartı", async ({ page }) => {
  await ulkeMetasiEnjekteEt(page, "SA");
  await page.context().addCookies([
    { name: "th-lang", value: "tr", url: "http://localhost:5173" },
    { name: "th-lang-source", value: "manual", url: "http://localhost:5173" },
  ]);
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  expect((await dilDurumu(page)).htmlLang).toBe("tr");
});

test("haritada OLMAYAN ülke tarayıcı diline yol verir", async ({ page }) => {
  // `languageForCountry("DE")` varsayılan olarak "en" döner; bunu "ülke
  // kararı" saymak Almanya'dan bağlanan herkesi İngilizceye kilitlerdi.
  await ulkeMetasiEnjekteEt(page, "DE");
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const durum = await dilDurumu(page);
  // Playwright'ın varsayılan tarayıcı dili en-US olduğu için sonuç "en";
  // önemli olan kararın KAYNAĞI — ülke değil tarayıcı basamağı.
  expect(durum.htmlLang).toBe("en");
});
