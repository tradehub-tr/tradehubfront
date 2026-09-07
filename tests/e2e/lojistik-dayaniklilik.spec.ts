import { expect, test, type Page } from "@playwright/test";

/**
 * Lojistik akışlarının DAYANIKLILIK turu — kötü koşullarda ne oluyor?
 *
 * Kabul testleri mutlu yolu ölçüyor; bu dosya mutsuz yolu: çift tıklama, ağ
 * hatası, geri tuşu, yenileme. Üçü de gerçek kullanıcıda sık, testlerde
 * nadir — ve hepsi sessiz veri kaybı üretebilecek yerler.
 *
 * BACKEND GEREKMEZ: lojistik ekranları `?mock=1` ile mock modunda; tek gerçek
 * uç olan sipariş listesi `page.route` ile taklit ediliyor.
 */

const SIPARISLER = "/pages/dashboard/orders.html";
const IADELERIM = "/pages/dashboard/returns.html";
const TALEP = "/pages/dashboard/return-request.html";
const SEVKIYAT = "SHP-2026-00041";

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

/** Konsol hatası + yakalanmamış istisna toplayıcı (gürültü süzgeçli). */
function hatalariTopla(page: Page): string[] {
  const gurultu = [/favicon/i, /Failed to load resource/i, /net::ERR_/i];
  const bulunan: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error" && !gurultu.some((r) => r.test(m.text()))) {
      bulunan.push(`console.error: ${m.text().slice(0, 200)}`);
    }
  });
  page.on("pageerror", (e) => bulunan.push(`pageerror: ${String(e.message).slice(0, 200)}`));
  return bulunan;
}

async function formuDoldur(page: Page, miktar = "2"): Promise<void> {
  const satir = page.locator("form li").first();
  await satir.getByRole("checkbox").check();
  const kutu = satir.locator('input[type="number"]');
  await expect(kutu).toBeEnabled();
  await kutu.fill(miktar);
  await page.locator("textarea").fill("Dayanıklılık turu — iki top kumaşta su hasarı var.");
}

test("D1 · ÇİFT TIKLAMA tek kayıt açıyor", async ({ page }) => {
  // Yavaş bağlantıda kullanıcı düğmeye iki kez basıyor. İki kayıt açılırsa
  // alıcı aynı iadeyi iki kez talep etmiş olur ve depo iki kez karşılar.
  await oturumAc(page);
  // Başlangıç sayısı — fixture'da zaten kayıt var; ölçülen şey FARK.
  await page.goto(`${IADELERIM}?mock=1`);
  await expect(page.getByTestId("return-row-link").first()).toBeVisible();
  const once = await page.getByTestId("return-row-link").count();

  await page.goto(`${TALEP}?mock=1&shipment=${SEVKIYAT}`);
  await formuDoldur(page);

  const gonder = page.getByRole("button", { name: /İade talebi gönder/ });
  // İki tıklama arka arkaya — ikincisi ilk istek uçarken gidiyor.
  await Promise.all([
    gonder.click(),
    gonder.click({ timeout: 2000 }).catch(() => {
      /* düğme kilitlendiyse ikinci tıklama düşer — beklenen davranış */
    }),
  ]);
  await expect(page).toHaveURL(/returns\.html\?name=RET-/);

  await page.goto(`${IADELERIM}?mock=1`);
  await expect(page.getByTestId("return-row-link").first()).toBeVisible();
  const sonra = await page.getByTestId("return-row-link").count();
  expect(sonra - once, `çift tıklama ${sonra - once} kayıt açtı — bir tane olmalıydı`).toBe(1);
});

test("D2 · GERİ TUŞU açılan talebi kaybetmiyor", async ({ page }) => {
  await oturumAc(page);
  await page.goto(`${TALEP}?mock=1&shipment=${SEVKIYAT}`);
  await formuDoldur(page, "3");
  await page.getByRole("button", { name: /İade talebi gönder/ }).click();
  await expect(page).toHaveURL(/returns\.html\?name=RET-/);
  const takipAdresi = page.url();

  // Geri → forma dön, ileri → takibe geri gel. Kayıt duruyor olmalı.
  await page.goBack();
  await page.goForward();
  await expect(page).toHaveURL(takipAdresi);
  await expect(page.getByRole("heading", { name: "İade takibi" })).toBeVisible();
  await expect(page.getByText(/3[^·]*istendi/)).toBeVisible();
});

test("D3 · sipariş ucu 500 dönerse ekran SEBEP söylüyor, sessiz kalmıyor", async ({ page }) => {
  await oturumAc(page);
  await page.route("**/api/method/tradehub_core.api.order.get_my_orders*", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ exception: "InternalServerError" }),
    })
  );
  await page.goto(`${SIPARISLER}?mock=1`);

  // Hata şeridi isteğin DÖNMESİNİ bekliyor — anında okumak erken oluyor.
  const uyari = page.getByRole("alert").filter({ hasText: /yüklenemedi|tekrar deneyin/i });
  await expect(uyari, "500 yanıtında ekran gerekçe göstermiyor").toBeVisible({ timeout: 10_000 });

  // ASIL İDDİA: boş liste ile hata AYNI ŞEY DEĞİL. Hata anında "Henüz sipariş
  // yok" yazmak yalan — kullanıcının siparişi olabilir, ekran onu göremiyor.
  // Üstelik yanındaki "Ürün tedarik edin ve sipariş verin" yönlendirmesi
  // kullanıcıyı yanlış işe sokuyor (`GOREV-TAMAMLAMA-SOZLESMESI` §2: boş
  // durum ile hata durumu ayrı ayrı denetlenir).
  await expect(
    page.getByRole("heading", { name: /Henüz sipariş yok/i }),
    "hata durumunda 'Henüz sipariş yok' boş durumu da çiziliyor — yanlış bilgi"
  ).toHaveCount(0);
});

test("D4 · kayıt REDDEDİLİRSE gerekçe görünüyor ve form yeniden denenebiliyor", async ({
  page,
}) => {
  // Mock'un `kayit-hatasi` senaryosu (§2.4 tetiklenebilir hata) iade formunda
  // HİÇ denenmemişti — ölçüldü 7 Eyl 2026; aynı adlı senaryo yalnız bildirim
  // mock'unda test ediliyordu. Denenemeyen hata yolu, olmayan hata yoludur.
  //
  // İlk sürüm bunu ÇEVRİMDIŞI ile ölçüyordu; yanlıştı: lojistik mock'u
  // localStorage'da çalıştığı için kayıt çevrimdışıyken de oluşuyor, tıkanan
  // şey yalnız `window.location.href` gezinmesi oluyordu. Yani test ürünün
  // değil taklitin yapısını ölçüyordu.
  const hatalar = hatalariTopla(page);
  await oturumAc(page);
  await page.goto(`${TALEP}?mock=1&senaryo=kayit-hatasi&shipment=${SEVKIYAT}`);
  await formuDoldur(page);

  const gonder = page.getByRole("button", { name: /İade talebi gönder/ });
  await gonder.click();

  // 1) Gerekçe GÖRÜNÜYOR — sessizce yutulmuyor.
  await expect(
    page.getByText(/oluşturulamadı|hata|başarısız/i).first(),
    "reddedilen kayıtta gerekçe gösterilmiyor"
  ).toBeVisible({ timeout: 10_000 });

  // 2) Takip sayfasına GİDİLMİYOR — olmayan kayda yönlendirme yalan olurdu.
  await expect(page).not.toHaveURL(/returns\.html\?name=/);

  // 3) Form YENİDEN DENENEBİLİR: `submitting` bayrağı serbest bırakılmış
  //    olmalı. (Başarı yolunda bayrak bilerek AÇIK kalıyor — D1'deki çift
  //    gönderim yarışı bu yüzden kapandı; hata yolunda kilitli kalırsa
  //    kullanıcı tekrar deneyemez. İkisi aynı kodun iki dalı, ikisi de
  //    ölçülüyor.)
  await expect(gonder, "hata sonrası gönder düğmesi kilitli kaldı").toBeEnabled();

  // 4) Yakalanmamış istisna yok.
  expect(hatalar).toEqual([]);
});
