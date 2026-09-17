/**
 * Satıcı sevkiyat ekranı — uçtan uca akış (S2 · S8).
 *
 * Korunan iddia: **satıcı, backend yazılmamışken bile sevkiyat oluşturup
 * koli girebiliyor ve yaptığı iş sayfa yenilenince duruyor.**
 *
 * Bu ekran hiçbir FE görevinin kapsamında değil (`KALAN-ISLER.md` →
 * "Sahipsiz"): `MOGEM-602` onu sayıyor ama `LOGISTICS-TASK-SPLIT.md`'nin 13
 * FE satırından hiçbiri almıyor. 2026-08-26'ya kadar `__thCreateShipment` ve
 * `__thSavePackage` köprüleri tanımsızdı — form çiziliyor, düğmeye basılıyor
 * ve hiçbir şey olmuyordu.
 */
import { expect, test, type Page } from "@playwright/test";

const SAYFA = "/pages/seller/shipment.html";

async function oturumAc(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // MOGEM-642 Faz 1: dil seçimi artık `th-lang-source=manual`
    // işareti olmadan KULLANICI SEÇİMİ sayılmıyor (otomatik tespit onu
    // ezebilsin diye). İşaretsiz yazılan `i18nextLng` sessizce yok
    // sayılıyor, karar tarayıcı diline düşüyor ve ekran İngilizce
    // açılıyor — Türkçe metin arayan her iddia kırmızıya dönüyordu.
    localStorage.setItem("i18nextLng", "tr");
    localStorage.setItem("th-lang-source", "manual");
    // Çerez bandı alttaki düğmeleri yutuyor (07-FE ölçümü).
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
            name: "satici@ornek.com",
            email: "satici@ornek.com",
            full_name: "Test Satıcı",
            is_seller: true,
            has_seller_profile: true,
          },
        },
      }),
    })
  );
}

/**
 * Sevkiyat oluşturur ve adını döndürür.
 *
 * Kanal `BUYER_PICKUP`'a çevriliyor: varsayılan `CARGO` taşıyıcı zorunlu
 * kılıyor ve taşıyıcı seçilmeden form "Kargo firması seçin" diyor. Testin
 * amacı taşıyıcı doğrulamasını değil AKIŞI ölçmek.
 *
 * Native `<select>` gizli (`SelectMenu` enhance ediyor) — gerçek kullanıcı
 * yolu tetikleyiciyi açıp seçeneği tıklamak.
 */
async function sevkiyatOlustur(page: Page): Promise<void> {
  const form = page.locator("form");
  await form.locator('[aria-haspopup="listbox"]').first().click();
  await page.locator('[data-select-menu-value="BUYER_PICKUP"]').click();
  await page.getByTestId("seller-submit").click();
  await expect(page).toHaveURL(/shipment\.html\?name=SHP-/);
}

test.describe("satıcı sevkiyat — S2 oluşturma", () => {
  test("kalem seçilip sevkiyat oluşturulur ve sevkiyat ekranına gidilir", async ({ page }) => {
    await oturumAc(page);
    // `?name=` YOK → oluşturma ekranı.
    await page.goto(SAYFA);

    await expect(page.getByRole("heading", { name: /Sevkiyat oluştur/ })).toBeVisible();
    await expect(page.getByTestId("seller-mock-bar")).toBeVisible();

    // Kalemler varsayılan seçili geliyor; en az biri işaretli olmalı.
    // Kalemler VARSAYILAN SEÇİLİ — tam gönderi kural, kısmi gönderi istisna.
    await expect(page.getByTestId("seller-item").first()).toBeChecked();

    await sevkiyatOlustur(page);
    await expect(page.getByText(/SHP-2026-9/).first()).toBeVisible();
  });

  test("seçim listeleri KATALOGDAN geliyor — ekrana gömülü değil", async ({ page }) => {
    await oturumAc(page);
    await page.goto(SAYFA);

    // `shipping_channel` fixture'ında beş kanal var; ekrana gömülü listede
    // dördü vardı. Katalogdan beslendiğinin en ucuz kanıtı sayı.
    const kanal = page.getByTestId("seller-channel");
    await expect(kanal.locator("option")).toHaveCount(5);
  });
});

test.describe("satıcı sevkiyat — S8 paketleme", () => {
  test("koli eklenir, listede görünür ve YENİLEYİNCE DURUR", async ({ page }) => {
    await oturumAc(page);

    // Önce bir sevkiyat oluştur.
    await page.goto(SAYFA);
    await sevkiyatOlustur(page);

    // Koli formu: ölçüler girilmeden düğme pasif.
    const ekle = page.getByTestId("packing-add");
    await expect(ekle).toBeDisabled();

    for (const [ad, deger] of [
      ["weight_kg", "2"],
      ["length_cm", "30"],
      ["width_cm", "20"],
      ["height_cm", "15"],
    ] as const) {
      await page.getByTestId(`packing-${ad}`).fill(deger);
    }
    await expect(ekle).toBeEnabled();
    await ekle.click();

    // Koli listede.
    await expect(page.getByText(/-K01/).first()).toBeVisible();

    // KALICILIK.
    await page.reload();
    await expect(page.getByText(/-K01/).first()).toBeVisible();
  });

  test("demo verisi sıfırlanabilir", async ({ page }) => {
    await oturumAc(page);
    await page.goto(SAYFA);
    await sevkiyatOlustur(page);

    await page.getByTestId("seller-mock-reset").click();
    // Sıfırlama oluşturma ekranına döndürüyor.
    await expect(page.getByRole("heading", { name: /Sevkiyat oluştur/ })).toBeVisible();
  });
});
