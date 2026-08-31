/**
 * 15-FE · İade akışı — uçtan uca (storefront, alıcı).
 *
 * Bu spec'in koruduğu iddia: **alıcı, backend hiç yazılmamışken bile iade
 * talebini baştan sona açabiliyor ve talebini izleyebiliyor.**
 * Birim testleri mock'un mantığını doğruluyor
 * (`services/__tests__/logisticsReturnMock.test.ts`); burası ekranın
 * gerçekten kullanılabildiğini gösteriyor.
 *
 * NEDEN ÖNEMLİ: iade talebi formu 13 Ağustos'tan 31 Ağustos'a kadar hiçbir
 * modda çalışmıyordu (`__thCreateReturn` köprüsü yoktu) ve forma kod
 * tabanında HİÇBİR bağlantı yoktu. Build, `tsc` ve birim testleri bunu
 * görmüyordu — `GOREV-TAMAMLAMA-SOZLESMESI` §3'ün tarif ettiği tam durum.
 *
 * Kabul senaryoları K1…K6 → `15-FE-iade-ekranlari-ANALIZ.md` §4.
 */
import { expect, test, type Page } from "@playwright/test";

const SIPARISLER = "/pages/dashboard/orders.html";
const IADELERIM = "/pages/dashboard/returns.html";
const TALEP = "/pages/dashboard/return-request.html";
/** Fixture'da teslim edilmiş sevkiyat — iade akışının girdisi. */
const SEVKIYAT = "SHP-2026-00041";
/** Fixture'da detayı olan iade — takip ekranının dolu hâli. */
const IADE = "RET-2026-00007";

/**
 * Sayfalar `requireAuth()` ile korumalı; oturum ucu taklit ediliyor.
 *
 * Dil burada kuruluyor: temiz bağlam İngilizce açılıyor ve Türkçe metin
 * arayan iddialar sessizce düşüyor (07-FE'de dokuz test bu yüzden kırmızıydı).
 */
async function oturumAc(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem("i18nextLng", "tr");
    localStorage.setItem(
      "istoc_cookie_prefs",
      JSON.stringify({ necessary: true, analytics: false, marketing: false })
    );
    // `istoc_return_mock` TEMİZLENMİYOR: Playwright her teste taze bağlam
    // veriyor, depo zaten boş. `addInitScript` HER gezinmede çalıştığı için
    // burada silmek, talep gönderildikten sonraki yönlendirmede yeni kaydı
    // da siliyordu — ekran "talep bulunamadı" gösteriyordu (ölçüldü 31 Ağu).
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

/**
 * Sipariş listesi GERÇEK uçtan geliyor (`order.get_my_orders`) — lojistik
 * mock'u onu kapsamıyor. K1 düğmenin sipariş kartında çizildiğini ölçüyor,
 * o yüzden liste dolu olmalı.
 *
 * Sipariş numarası fixture'daki sevkiyatla EŞLEŞMELİ: `returnEntry.esle()`
 * eşlemeyi `order` alanı üzerinden kuruyor ve `SHP-2026-00041` bu siparişe
 * bağlı. Uydurma bir numara düğmeyi hiç çizdirmezdi.
 */
async function siparisleriTaklitEt(page: Page): Promise<void> {
  await page.route("**/api/method/tradehub_core.api.order.get_my_orders*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        message: {
          success: true,
          total: 1,
          status_counts: { Completed: 1 },
          orders: [
            {
              name: "ORD-2026-00871",
              order_number: "ORD-2026-00871",
              order_date: "2026-08-09",
              grand_total: 18240,
              currency: "TRY",
              seller_name: "Kaya Hırdavat",
              status: "Completed",
              items: [
                {
                  product_name: "Pamuklu Kumaş Topu 40m",
                  quantity: 12,
                  unit_price: 1520,
                  total_price: 18240,
                },
              ],
            },
          ],
        },
      }),
    })
  );
}

async function ac(page: Page, yol: string): Promise<void> {
  await oturumAc(page);
  await siparisleriTaklitEt(page);
  await page.goto(yol);
}

/** Formu doldurup gönderir — K2'nin ortak adımı. */
async function talepDoldur(page: Page, miktar: string, aciklama: string): Promise<void> {
  const satir = page.locator("form li").first();
  await satir.getByRole("checkbox").check();
  const kutu = satir.locator('input[type="number"]');
  await expect(kutu, "kalem seçilince miktar kutusu açılmalı").toBeEnabled();
  await kutu.fill(miktar);
  await page.locator("textarea").fill(aciklama);
}

// ── K1 · giriş kapısı ────────────────────────────────────────────────

test("K1 · alıcı iadeyi sipariş listesinden başlatabiliyor", async ({ page }) => {
  // 31 Ağustos'a kadar forma HİÇBİR bağlantı yoktu; ekran yalnız adres elle
  // yazılarak açılıyordu. Bu test o boşluğun geri gelmesini engelliyor.
  await ac(page, `${SIPARISLER}?mock=1`);

  const dugme = page.getByTestId("order-return-link").first();
  await expect(dugme).toBeVisible();
  await dugme.click();

  await expect(page).toHaveURL(new RegExp("return-request\\.html\\?shipment="));
  await expect(page.getByRole("heading", { name: "İade talebi" })).toBeVisible();
});

// ── K2 · talep açma + miktar + kalıcılık ────────────────────────────

test("K2 · kalem, miktar ve gerekçeyle talep açılıyor", async ({ page }) => {
  await ac(page, `${TALEP}?mock=1&shipment=${SEVKIYAT}`);

  await talepDoldur(page, "6", "İki top kumaşta su hasarı var, ambalaj yırtılmış.");
  await page.getByRole("button", { name: /İade talebi gönder/ }).click();

  // Yeni talebin KENDİ takip sayfasına düşülüyor — listede aranmıyor.
  await expect(page).toHaveURL(/returns\.html\?name=RET-2026-\d{5}/);
  await expect(page.getByRole("heading", { name: "İade takibi" })).toBeVisible();
});

test("K2 · girilen MİKTAR gerçekten kaydediliyor", async ({ page }) => {
  // 🔴 Bu testin varlık sebebi: miktar kutusunun `x-model`'i yoktu ve
  // girilen değer gönderimde kayboluyordu (analiz §3.2). Kalemin tamamı
  // iade edilmiş sayılıyordu.
  await ac(page, `${TALEP}?mock=1&shipment=${SEVKIYAT}`);
  await talepDoldur(page, "4", "Dört top hasarlı geldi, kalanı sağlam.");
  await page.getByRole("button", { name: /İade talebi gönder/ }).click();
  await expect(page).toHaveURL(/returns\.html\?name=/);

  await expect(page.getByText(/4 istendi/)).toBeVisible();
});

test("K2 · açılan talep sayfa yenilenince DURUYOR", async ({ page }) => {
  await ac(page, `${TALEP}?mock=1&shipment=${SEVKIYAT}`);
  await talepDoldur(page, "2", "İki top kumaşta su hasarı tespit edildi.");
  await page.getByRole("button", { name: /İade talebi gönder/ }).click();
  await expect(page).toHaveURL(/returns\.html\?name=/);

  const adres = page.url();
  await page.reload();
  await expect(page).toHaveURL(adres);
  await expect(page.getByText(/2 istendi/)).toBeVisible();
});

test("K2 · gerekçe kısaysa gönderilemiyor", async ({ page }) => {
  await ac(page, `${TALEP}?mock=1&shipment=${SEVKIYAT}`);
  const satir = page.locator("form li").first();
  await satir.getByRole("checkbox").check();
  await page.locator("textarea").fill("bozuk");

  await expect(page.getByRole("button", { name: /İade talebi gönder/ })).toBeDisabled();
});

// ── K3 · iade penceresi ──────────────────────────────────────────────

test("K3 · pencere kapalıysa form HİÇ çizilmiyor, sebebi yazıyor", async ({ page }) => {
  await ac(page, `${TALEP}?mock=1&senaryo=pencere-kapali&shipment=${SEVKIYAT}`);

  await expect(page.locator("form")).toHaveCount(0);
  await expect(page.getByText(/İade süresi doldu/)).toBeVisible();
  // Kaç günlük pencere olduğu SUNUCUDAN geliyor (sözleşme §2.1).
  await expect(page.getByText(/15 gün/)).toBeVisible();
});

test("K3 · iade edilecek kalem kalmadıysa kendi sebebini söylüyor", async ({ page }) => {
  await ac(page, `${TALEP}?mock=1&senaryo=kalem-kalmadi&shipment=${SEVKIYAT}`);
  await expect(page.getByText(/zaten iade edildi/)).toBeVisible();
});

// ── K4 · talebi izleme ───────────────────────────────────────────────

test("K4 · alıcı talebini kendi ekranından izliyor", async ({ page }) => {
  await ac(page, `${IADELERIM}?mock=1&name=${IADE}`);

  await expect(page.getByRole("heading", { name: "İade takibi" })).toBeVisible();
  // Zaman çizgisinin dört adımı ve satıcı kararının gerekçesi.
  await expect(page.getByText("Talep alındı")).toBeVisible();
  await expect(page.getByText("Satıcı onayladı")).toBeVisible();
  await expect(page.getByText(/Hasar fotoğrafları incelendi/)).toBeVisible();
  await expect(page.getByText("Depoda kontrol ediliyor")).toBeVisible();
  // Tutar ve kalem kırılımı.
  await expect(page.getByText(/Beklenen iade tutarı/)).toBeVisible();
  await expect(page.getByText(/6 istendi · 6 ulaştı · 4 kabul/)).toBeVisible();
});

test("K4 · listeden detaya gidiliyor", async ({ page }) => {
  await ac(page, `${IADELERIM}?mock=1`);
  await page.getByTestId("return-row-link").first().click();
  await expect(page).toHaveURL(/returns\.html\?name=RET-/);
  await expect(page.getByRole("heading", { name: "İade takibi" })).toBeVisible();
});

test("K4 · hiç talep yoksa sonraki adım gösteriliyor", async ({ page }) => {
  await ac(page, `${IADELERIM}?mock=1&senaryo=bos`);
  await expect(page.getByText(/Henüz iade talebiniz yok/)).toBeVisible();
  await expect(page.getByRole("link", { name: /Siparişlerime git/ })).toBeVisible();
});

// ── K5 · iade etiketi ────────────────────────────────────────────────

test("K5 · iade etiketi gerçekten açılabiliyor", async ({ page }) => {
  // 12-FE'de POD medyası `/files/...` yollarına işaret ediyordu ve ekranda
  // kırık kutu çıkıyordu; hiçbir test yakalamamıştı çünkü hepsi "alan dolu
  // mu" diye bakıyordu.
  await ac(page, `${IADELERIM}?mock=1&name=${IADE}`);

  const link = page.getByTestId("return-label-link");
  await expect(link).toBeVisible();
  const href = await link.getAttribute("href");
  expect(href, "etiket dosya YOLU değil, gömülü belge olmalı").toMatch(
    /^data:image\/svg\+xml;base64,/
  );
});

// ── K6 · rol izolasyonu ──────────────────────────────────────────────

test("K6 · alıcı satıcı karar bağlantısı GÖRMÜYOR", async ({ page }) => {
  // 🔴 31 Ağustos'a kadar alıcı sayfası satıcı bileşenini çiziyordu:
  // "Karara bağla" düğmeleri ve satıcı başlığı görünüyordu (analiz §3.3).
  await ac(page, `${IADELERIM}?mock=1`);

  await expect(page.getByRole("link", { name: /Karara bağla/ })).toHaveCount(0);
  await expect(page.locator('a[href*="/pages/seller/"]')).toHaveCount(0);
});

test("K6 · alıcı BAŞKASININ iadesini görmüyor", async ({ page }) => {
  // Fixture iki alıcının kaydını taşıyor; süzgeç mock'ta (sunucu da
  // uygulamalı — sözleşme §6.1).
  await ac(page, `${IADELERIM}?mock=1`);

  await expect(page.getByText("RET-2026-00007")).toBeVisible();
  await expect(page.getByText("RET-2026-00006")).toHaveCount(0);
});

test("K6 · yetkisiz yanıtta ekran sebebini söylüyor", async ({ page }) => {
  await ac(page, `${IADELERIM}?mock=1&senaryo=yetkisiz`);
  await expect(page.getByText(/yetkiniz yok/)).toBeVisible();
});

// ── Gerçek mod — mock canlıya sızmıyor ───────────────────────────────

test("gerçek modda mock verisi GÖRÜNMÜYOR", async ({ page }) => {
  // 12-FE'de ölçülen 🔴 kusur: mock modülü ortamı hiç sormuyordu ve canlıda
  // sahte veri görünüyordu. Bu test o kapının açık kalmasını engelliyor.
  await ac(page, `${TALEP}?mock=0&shipment=${SEVKIYAT}`);

  await expect(page.locator("form")).toHaveCount(0);
  await expect(page.getByText(/henüz bağlı değil/)).toBeVisible();
  await expect(page.getByText("api.v1.returns.get_return_eligibility")).toBeVisible();
});
