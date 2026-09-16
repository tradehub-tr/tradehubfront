/**
 * PANEL DİL BÜTÜNLÜĞÜ — Rusça ve Arapça ekranlar gerçekten o dilde mi?
 *
 * Çalıştırma:
 *   PANEL_PASS='<parola>' npx playwright test tests/e2e/panel-dil-butunlugu.spec.ts
 *   ./e2e.sh --panel   (parolayı .env.e2e'den okur)
 *
 * NEDEN BU TEST: panelin i18n'i `fallbackLocale: "en"` taşıyor. Bir ad alanı
 * ru/ar'da eksik olduğunda ekran BOZULMAZ — sessizce İngilizceye düşer. Yani
 * "çeviri eksik" hatası hiçbir yerde görünmez; kullanıcı yalnız yanlış dil
 * görür. Ölçüldü (16 Eyl 2026): `logistics, showcase, featureCatalog,
 * sellerPlan, sellerBackup` ad alanları ru.js ve ar.js'te HİÇ yoktu; Rus ve
 * Arap yöneticiler o ekranları tamamen İngilizce görüyordu.
 *
 * Bu yüzden denetim "ham anahtar var mı" diye bakmaz (fallback yüzünden hiç
 * çıkmaz) — ekranda O DİLE AİT bir metin arar. Çeviri düşerse İngilizce metin
 * gelir ve beklenti tutmaz.
 */
import { expect, request, test } from "@playwright/test";

const BASE = process.env.PANEL_BASE ?? "http://tradehub.localhost";
const USER = process.env.PANEL_USER ?? "Administrator";
const PASS = process.env.PANEL_PASS ?? "";

interface Ekran {
  ad: string;
  yol: string;
  /** Ekranda o dilde görünmesi beklenen metin (i18n kökünün `title`'ı). */
  bekle: { ru: string; ar: string };
  /**
   * Sekmeli sayfalarda hedef sekmenin etiketi. Sekme URL ile seçilemiyor
   * (`PermissionConsoleView` `activeTab`'ı yalnız bileşen içinde tutuyor),
   * bu yüzden tıklamak gerekiyor.
   */
  sekme?: { ru: string; ar: string };
}

const EKRANLAR: Ekran[] = [
  {
    ad: "Özellik kataloğu (featureCatalog)",
    yol: "/panel/permission-console",
    bekle: { ru: "Каталог функций", ar: "كتالوج الميزات" },
    sekme: { ru: "Каталог функций", ar: "كتالوج الميزات" },
  },
  {
    ad: "Kategori vitrini (showcase)",
    yol: "/panel/category-showcase",
    bekle: { ru: "Витрина категорий", ar: "واجهة الفئات" },
  },
  {
    ad: "Medya yedeğim (sellerBackup)",
    yol: "/panel/my-media-backup",
    bekle: { ru: "Резервная копия медиа", ar: "نسخة الوسائط الاحتياطية" },
  },
  {
    // `logistics` ad alanı 1.213 anahtarla panelin en büyük modülü ve en son
    // çevrileni; ekranın kendi başlığı o ad alanından geliyor.
    ad: "Lojistik panosu (logistics)",
    yol: "/panel/lojistik/pano",
    bekle: { ru: "Панель логистики", ar: "لوحة الخدمات اللوجستية" },
  },
  {
    ad: "Sevkiyat listesi (logistics.shipment)",
    yol: "/panel/lojistik/sevkiyatlar",
    bekle: { ru: "Отправления", ar: "الشحنات" },
  },
];

test.use({ baseURL: BASE });
test.describe.configure({ mode: "serial" });

async function oturumAc(context: import("@playwright/test").BrowserContext, dil: "ru" | "ar") {
  const api = await request.newContext({ baseURL: BASE });
  const res = await api.post("/api/method/login", { form: { usr: USER, pwd: PASS } });
  expect(res.ok(), "Frappe login başarısız — kullanıcı/parola?").toBeTruthy();
  const { cookies } = await api.storageState();
  await context.addCookies(cookies);

  await context.addInitScript((secilen) => {
    localStorage.setItem("th-lang", secilen);
    // Rehberli tur overlay'i (`fixed inset-0 z-[9999]`) tıklamayı yutuyor.
    // İki tür tur var (`stores/tour.js`): bölüm turları kendi id'leriyle,
    // SAYFA turları `page:<anahtar>` biçiminde işaretleniyor — ölçüldü:
    // yalnız bölümleri işaretlemek yetmiyor, permission-console'un sayfa turu
    // yine açılıyor ve sekme tıklamasını engelliyor.
    localStorage.setItem(
      "panel_tour_seen_v5",
      JSON.stringify([
        "dashboard",
        "catalog",
        "commerce",
        "logistics",
        "sellers",
        "crm",
        "helpdesk",
        "system",
        "store",
        "products",
        "orders",
        "management",
        "messaging",
        "page:permission-console",
        "page:category-showcase",
        "page:my-media-backup",
      ])
    );
  }, dil);
}

test.beforeEach(async () => {
  if (!PASS) test.skip(true, "PANEL_PASS env değişkeni gerekli.");
});

for (const dil of ["ru", "ar"] as const) {
  test.describe(`panel dili: ${dil}`, () => {
    for (const ekran of EKRANLAR) {
      test(`${ekran.ad} ${dil} dilinde görünüyor`, async ({ context, page }) => {
        await oturumAc(context, dil);
        await page.goto(ekran.yol);
        await page.waitForLoadState("networkidle");

        if (ekran.sekme) {
          // Sayfa sekme şeridini İKİ kez çiziyor (dar ekran `chip` + geniş ekran
          // `tab-btn`); biri her zaman gizli. `:visible` olmadan tıklama gizli
          // kopyaya düşüp zaman aşımına uğruyor.
          await page
            .locator('[role="tab"]:visible')
            .filter({ hasText: ekran.sekme[dil] })
            .first()
            .click();
          await page.waitForLoadState("networkidle");
        }

        const govde = await page.locator("body").innerText();
        expect(
          govde,
          `${ekran.yol} ekranı ${dil} dilinde "${ekran.bekle[dil]}" göstermiyor — ` +
            `ad alanı eksikse i18n sessizce İngilizceye düşer.`
        ).toContain(ekran.bekle[dil]);
      });
    }

    test(`sol menüdeki lojistik bölümü ${dil} dilinde`, async ({ context, page }, testInfo) => {
      // `nav.*` ad alanı ru/ar'da eksikken menüde "Logistics" İngilizce
      // görünüyordu — ölçüldü 16 Eyl 2026, Rusça arayüzün ortasında.
      //
      // YALNIZ MASAÜSTÜ: dar ekranda sol menü hiç çizilmiyor, sayfada yalnız
      // ekranın kendi başlığı kalıyor ("Витрина категорий"). Bu dosya
      // `e2e.sh`'ın spec listesine 16 Eyl'de eklenene kadar HİÇ koşmamıştı,
      // bu yüzden mobil kısıtı da o güne kadar görülmedi.
      const genislik = testInfo.project.use.viewport?.width ?? 1280;
      test.skip(genislik < 1024, "Sol menü yalnız geniş ekranda çiziliyor.");

      await oturumAc(context, dil);
      await page.goto(EKRANLAR[1].yol);
      await page.waitForLoadState("networkidle");

      const menu = await page.locator("body").innerText();
      const beklenen = dil === "ru" ? "Логистика" : "الخدمات اللوجستية";
      expect(menu, `menüde "${beklenen}" bekleniyordu`).toContain(beklenen);
      expect(menu, "menüde çevrilmemiş 'Logistics' kalmamalı").not.toContain("Logistics");
    });

    if (dil === "ar") {
      test("Arapça seçiliyken sayfa yönü RTL", async ({ context, page }) => {
        await oturumAc(context, "ar");
        await page.goto(EKRANLAR[1].yol);
        await page.waitForLoadState("networkidle");

        const yon = await page.evaluate(() => document.documentElement.getAttribute("dir"));
        expect(yon, "Arapça arayüzde dir=rtl bekleniyor").toBe("rtl");
      });
    }
  });
}
