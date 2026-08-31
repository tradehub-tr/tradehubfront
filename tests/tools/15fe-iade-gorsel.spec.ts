/**
 * 15-FE · İade ekranlarının GÖRSEL turu — `GOREV-TAMAMLAMA-SOZLESMESI` §2.5.
 *
 * NEDEN VAR: 12-FE'de üç kusur (kırık imza/fotoğraf, tekrar eden unvan, hiç
 * çizilmeyen belge düğmesi) yalnız gözle bulundu; 15 E2E testi hiçbirini
 * görmemişti. Bu araç ekranların HER HÂLİNİN görüntüsünü alıyor ki teslimden
 * önce bakılabilsin.
 *
 * NE DEĞİL: iddia doğrulayan bir test değil — çıktı üretiyor. Bakılacak şey
 * "render oldu mu" değil:
 *   · görsel/belge bağlantıları gerçekten açılıyor mu, kırık kutu var mı?
 *   · aynı bilgi iki kez yazıyor mu?
 *   · boş/hata hâllerinde ekran ne diyor?
 *   · mobil genişlikte bir şey kesiliyor mu?
 *
 * CI SUITE'İNDE DEĞİL (`tests/tools`, ayrı config): her PR'da 20 görüntü
 * üretmenin anlamı yok, teslim öncesi elle koşuluyor.
 *
 *   npx playwright test --config playwright.tools.config.ts 15fe-iade-gorsel
 */
import { mkdirSync } from "node:fs";

import { expect, test, type Page } from "@playwright/test";

const KOK = "http://localhost:5173";
const CIKTI = "tests/tools/gorseller/15-fe";

/** Fixture'da teslim edilmiş sevkiyat — iade akışının girdisi. */
const SEVKIYAT = "SHP-2026-00041";
/** Fixture'da detayı olan iade — takip ekranının dolu hâli. */
const IADE = "RET-2026-00007";

test.beforeAll(() => {
  mkdirSync(CIKTI, { recursive: true });
});

/**
 * Sayfalar `requireAuth()` ile korumalı; oturum ucu taklit ediliyor.
 *
 * Dil burada kuruluyor: temiz bağlam İngilizce açılıyor ve Türkçe ekranı
 * görmek isteyen bu tur yanlış dilde görüntü alırdı.
 */
async function oturumAc(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem("i18nextLng", "tr");
    localStorage.setItem(
      "istoc_cookie_prefs",
      JSON.stringify({ necessary: true, analytics: false, marketing: false })
    );
  });
  await page.route("**/api/method/tradehub_core.api.v1.auth.get_session_user*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        message: {
          logged_in: true,
          user: {
            name: "alici@ornek.com",
            email: "alici@ornek.com",
            full_name: "Test Alıcı",
            is_seller: false,
            is_admin: false,
          },
        },
      }),
    })
  );
}

/** Mock durumunu SIFIRLAYARAK açar — önceki senaryonun kalıntısı taşınmasın. */
async function ac(page: Page, yol: string): Promise<void> {
  await oturumAc(page);
  await page.addInitScript(() => {
    try {
      localStorage.removeItem("istoc_return_mock");
    } catch {
      /* gizli sekme — mock zaten bellekten çalışıyor */
    }
  });
  await page.goto(`${KOK}${yol}`);
  await page.waitForLoadState("networkidle");
}

async function cek(page: Page, ad: string): Promise<void> {
  await page.screenshot({ path: `${CIKTI}/${ad}.png`, fullPage: true });
}

const HALLER: { ad: string; yol: string }[] = [
  // M-A · giriş kapısı — düğme sipariş kartında mı?
  { ad: "MA-1-siparis-listesi", yol: "/pages/dashboard/orders.html?mock=1" },
  // M-B · talep formu
  {
    ad: "MB-1-form-normal",
    yol: `/pages/dashboard/return-request.html?mock=1&shipment=${SEVKIYAT}`,
  },
  {
    ad: "MB-2-pencere-kapali",
    yol: `/pages/dashboard/return-request.html?mock=1&senaryo=pencere-kapali&shipment=${SEVKIYAT}`,
  },
  {
    ad: "MB-3-kalem-kalmadi",
    yol: `/pages/dashboard/return-request.html?mock=1&senaryo=kalem-kalmadi&shipment=${SEVKIYAT}`,
  },
  // M-C · alıcı takibi
  { ad: "MC-1-liste", yol: "/pages/dashboard/returns.html?mock=1" },
  { ad: "MC-2-takip-detay", yol: `/pages/dashboard/returns.html?mock=1&name=${IADE}` },
  { ad: "MC-3-bos", yol: "/pages/dashboard/returns.html?mock=1&senaryo=bos" },
  // Kırma turu (31 Ağu): sözleşmenin üç durumu hiç veri üretmiyordu ve
  // zaman çizgisinin o dalları bir kez bile çizilmemişti.
  {
    ad: "MC-5-reddedildi",
    yol: `/pages/dashboard/returns.html?mock=1&senaryo=reddedildi&name=${IADE}`,
  },
  { ad: "MC-6-yolda", yol: `/pages/dashboard/returns.html?mock=1&senaryo=yolda&name=${IADE}` },
  { ad: "MC-4-yetkisiz", yol: "/pages/dashboard/returns.html?mock=1&senaryo=yetkisiz" },
  // Gerçek mod — mock kapalıyken ekran ne diyor? (kırma turu sorusu)
  {
    ad: "MB-4-gercek-mod",
    yol: `/pages/dashboard/return-request.html?mock=0&shipment=${SEVKIYAT}`,
  },
];

for (const hal of HALLER) {
  test(`masaüstü · ${hal.ad}`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await ac(page, hal.yol);
    await cek(page, hal.ad);
  });
}

/**
 * RTL turu — storefront dört dil destekliyor ve Arapça SAĞDAN SOLA akıyor.
 *
 * Yeni ekranın riski somut: zaman çizgisi mantıksal kenar sınıflarıyla
 * (`start-*`, `ps-*`) kurulu ve liste satırındaki ok `rtl:rotate-180`
 * taşıyor. Biri fiziksel sınıfa (`left-*`) kayarsa Arapça arayüzde çizgi
 * metnin üstüne biner — yalnız gözle görülür.
 */
test("RTL · Arapça iade takibi", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await oturumAc(page);
  await page.addInitScript(() => localStorage.setItem("i18nextLng", "ar"));
  await page.goto(`${KOK}/pages/dashboard/returns.html?mock=1&name=${IADE}`);
  await page.waitForLoadState("networkidle");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await cek(page, "RTL-ar-takip-detay");
});

/** Mobil tur — storefront alıcıya ait ve alıcılar telefondan bakıyor. */
for (const hal of HALLER.slice(0, 6)) {
  test(`mobil · ${hal.ad}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await ac(page, hal.yol);
    await cek(page, `mobil-${hal.ad}`);
  });
}

/**
 * Etiket bağlantısı GERÇEKTEN açılıyor mu?
 *
 * 12-FE'de POD medyası `/files/...` yollarına işaret ediyordu ve ekranda kırık
 * kutu çıkıyordu; hiçbir test yakalamamıştı çünkü hepsi "alan dolu mu" diye
 * bakıyordu. Bu kontrol çıktı üretmiyor, iddia doğruluyor — turun tek testi.
 */
test("iade etiketi açılabilir bir belge", async ({ page }) => {
  await ac(page, `/pages/dashboard/returns.html?mock=1&name=${IADE}`);
  const link = page.getByTestId("return-label-link");
  await expect(link).toBeVisible();
  const href = await link.getAttribute("href");
  expect(href, "etiket bir dosya YOLU değil, gömülü belge olmalı").toMatch(
    /^data:image\/svg\+xml;base64,/
  );
});
