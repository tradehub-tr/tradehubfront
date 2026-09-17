/**
 * 07-FE · Alıcı teslim alma — uçtan uca akış.
 *
 * Bu spec'in koruduğu iddia: **alıcı, backend hiç yazılmamışken bile teslim
 * alma işini baştan sona bitirebiliyor.** Birim testleri mock'un mantığını
 * doğruluyor (`services/__tests__/logisticsPickupMock.test.ts`); burası
 * ekranın gerçekten kullanılabildiğini gösteriyor — kaçan eksiklerin üçte
 * ikisi ancak tarayıcıda görülebiliyordu (`GOREV-TAMAMLAMA-SOZLESMESI` §3).
 *
 * Mock-tabanlı: backend gerekmiyor, oturum ucu `page.route` ile taklit
 * ediliyor. Kabul senaryoları A1…A17 → `07-FE-alici-teslim-alma-ANALIZ.md` §4.
 */
import { expect, test, type Page } from "@playwright/test";

const TESLIM_ALMA_SAYFASI = "/pages/dashboard/shipment-tracking.html";

/**
 * Sayfa `requireAuth()` ile korumalı; oturum ucu taklit ediliyor.
 *
 * Dil de burada kuruluyor: temiz bir tarayıcı bağlamı **İngilizce** açılıyor
 * (i18next `navigator`'a düşüyor) ve Türkçe metin arayan her iddia sessizce
 * düşüyor. Ölçüldü — ekran doğru çiziliyordu, testler "Delivery appointment"
 * görüp "Teslimat randevusu" aradığı için dokuzu birden kırmızıydı.
 *
 * Yalnız dil yazılıyor: `addInitScript` HER navigasyonda koşuyor, burada
 * `localStorage` temizlenseydi testin kendi kurduğu randevu ve deneme sayacı
 * `reload()` sonrası silinir ve kalıcılık iddiası yanlış yeşil verirdi.
 */
async function oturumAc(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // MOGEM-642 Faz 1: dil seçimi artık `th-lang-source=manual`
    // işareti olmadan KULLANICI SEÇİMİ sayılmıyor (otomatik tespit onu
    // ezebilsin diye). İşaretsiz yazılan `i18nextLng` sessizce yok
    // sayılıyor, karar tarayıcı diline düşüyor ve ekran İngilizce
    // açılıyor — Türkçe metin arayan her iddia kırmızıya dönüyordu.
    localStorage.setItem("i18nextLng", "tr");
    localStorage.setItem("th-lang-source", "manual");
    // Çerez onay bandı ekranın ALTINI kaplıyor ve mobilde teslim onayı
    // düğmesini yutuyor (375×667'de ölçüldü: "subtree intercepts pointer
    // events"). Gerçek kullanıcı bandı bir kez kapatıp devam ediyor; test de
    // aynısını yapıyor — yoksa ölçtüğü şey ekran değil, bant olur.
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

async function ekraniAc(page: Page, senaryo?: string): Promise<void> {
  await oturumAc(page);
  await page.goto(senaryo ? `${TESLIM_ALMA_SAYFASI}?senaryo=${senaryo}` : TESLIM_ALMA_SAYFASI);
  await expect(
    page.getByRole("heading", { name: /Teslim onayı|Teslimat randevusu/ }).first()
  ).toBeVisible();
}

test.describe("07-FE · alıcı teslim alma", () => {
  test("A2 · teslim noktası ve teslim onayı ekranda", async ({ page }) => {
    await ekraniAc(page);
    await expect(page.getByText("İkitelli OSB").first()).toBeVisible();
    await expect(page.getByTestId("confirm-code-form")).toBeVisible();
  });

  test("A3+A4 · randevu alınır ve sayfa yenilenince DURUR", async ({ page }) => {
    await ekraniAc(page);

    // Kapsayıcıya scope'lu: sayfada üç `select` var (dil, para birimi, slot)
    // ve `page.locator("select").first()` randevu formuna ait DEĞİL.
    const form = page.getByTestId("appointment-form");

    // Yarını seç — geçmiş tarih koruması bugüne izin vermeyebilir.
    const yarin = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    await form.getByTestId("appointment-date").fill(yarin);

    // Storefront native `<select>`'i gizleyip kendi menüsünü çiziyor
    // (`components/shared/SelectMenu.ts` → `data-select-menu-enhanced`).
    // `selectOption` gizli elemanda zaman aşımına düşüyor; gerçek kullanıcı
    // yolu tetikleyiciyi açıp seçeneği tıklamak.
    await form.locator('[aria-haspopup="listbox"]').click();
    await page.locator('[data-select-menu-value="09-12"]').click();

    await form.getByTestId("appointment-submit").click();

    await expect(page.getByTestId("appointment-current")).toContainText("09:00");

    // KALICILIK: yeniden yükle, randevu hâlâ orada olmalı.
    await page.reload();
    await expect(page.getByTestId("appointment-current")).toContainText("09:00");
  });

  test("A9 · yanlış kod deneme hakkını gösterir, teslimi tamamlamaz", async ({ page }) => {
    await ekraniAc(page);
    await page.getByTestId("confirm-code-input").fill("0000");
    await page.getByTestId("confirm-submit").click();

    // Kapsayıcıya scope'lu: aynı metni taşıyan ikinci bir `x-show` düğümü
    // süre bloğunda da var (gizli) ve scope'suz locator ikisini birden yakalar.
    await expect(
      page.getByTestId("confirm-code-form").getByText(/Kod doğrulanamadı/)
    ).toBeVisible();
    await page.reload();
    await expect(page.getByTestId("confirm-attempts")).toContainText("2");
  });

  test("A8+A14 · doğru kod teslimi tamamlar, form kaybolur", async ({ page }) => {
    await ekraniAc(page);
    // Örnek kod sıfırlama şeridinde yazıyor — gerçek akışta SMS ile gelir.
    await expect(page.getByTestId("pickup-mock-bar")).toContainText("482913");

    await page.getByTestId("confirm-code-input").fill("482913");
    await page.getByTestId("confirm-submit").click();

    await expect(page.getByText(/Teslimat tamamlandı/)).toBeVisible();
    await expect(page.getByTestId("confirm-code-form")).toHaveCount(0);
  });

  test("A14+ · iş bitince randevu formu KALKAR ve metin gerçeği söyler", async ({ page }) => {
    await ekraniAc(page, "tamamlandi");

    await expect(page.getByText(/Teslimat tamamlandı/)).toBeVisible();

    // Teslim alınmış sevkiyatın randevusu değiştirilemez.
    await expect(page.getByTestId("appointment-form")).toHaveCount(0);

    // "Teslim kanıtını aşağıdan görebilirsiniz" diyordu — aşağıda hiçbir şey
    // yoktu (POD bloğu 14-FE'nin ve yalnız `Delivered` durumunda çiziliyor).
    await expect(page.getByText(/Teslim kanıtını aşağıdan/)).toHaveCount(0);
  });

  test("A6 · tüm saat aralıkları doluyken form çizilmez, yol gösterilir", async ({ page }) => {
    await ekraniAc(page, "slot-dolu");

    await expect(page.getByTestId("appointment-no-slots")).toBeVisible();
    // Form HİÇ çizilmiyor: seçilecek bir şey yokken tarih/saat sormak,
    // kullanıcıyı boşuna uğraştırıp aynı yere döndürürdü.
    await expect(page.getByTestId("appointment-submit")).toHaveCount(0);
    // Ve "ne yapayım" sorusu cevapsız kalmıyor.
    await expect(page.getByText(/Başka bir tarih seçin/)).toBeVisible();
  });

  test("A10 · kilitli sevkiyatta kod formu HİÇ çizilmez", async ({ page }) => {
    await ekraniAc(page, "kilitli");
    await expect(page.getByTestId("confirm-locked")).toBeVisible();
    await expect(page.getByTestId("confirm-code-form")).toHaveCount(0);
  });

  test("A11 · süresi dolmuş kod ayrı ekran gösterir ve yeni kod verir", async ({ page }) => {
    await ekraniAc(page, "sure-doldu");

    // Kilit değil: çıkışı olan bir durum, kırmızı değil amber.
    await expect(page.getByTestId("confirm-expired")).toBeVisible();
    await expect(page.getByTestId("confirm-locked")).toHaveCount(0);

    await page.getByTestId("confirm-resend").click();
    await expect(page.getByTestId("confirm-code-form")).toBeVisible();
    await expect(page.getByTestId("confirm-countdown")).toBeVisible();
  });

  test("A12 · ödeme tamamlanmadan kod formu HİÇ çizilmez", async ({ page }) => {
    await ekraniAc(page, "odeme-bekliyor");
    await expect(page.getByText(/Ödeme tamamlanmadan teslim alınamaz/)).toBeVisible();
    await expect(page.getByTestId("confirm-code-form")).toHaveCount(0);
    await expect(page.getByRole("link", { name: /Ödemeye git/ })).toBeVisible();
  });

  test("A13 · kod istemeyen sevkiyat tek tuşla onaylanır", async ({ page }) => {
    await ekraniAc(page, "kodsuz");
    await page.getByTestId("confirm-no-code").click();
    await expect(page.getByText(/Teslimat tamamlandı/)).toBeVisible();
  });

  test("A15 · kargo sevkiyatında randevu ve teslim onayı HİÇ çıkmaz", async ({ page }) => {
    await oturumAc(page);
    await page.goto(`${TESLIM_ALMA_SAYFASI}?senaryo=kargo`);
    // Takip çizelgesi 12-FE'nin bloğu — o çizilmeye devam ediyor.
    await expect(page.getByText(/Örnek veri modu/).first()).toBeVisible();
    await expect(page.getByTestId("confirm-code-form")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Teslimat randevusu" })).toHaveCount(0);
  });

  test("A17 · demo verisi sıfırlanabilir", async ({ page }) => {
    await ekraniAc(page);
    await page.getByTestId("confirm-code-input").fill("0000");
    await page.getByTestId("confirm-submit").click();
    // Kapsayıcıya scope'lu: aynı metni taşıyan ikinci bir `x-show` düğümü
    // süre bloğunda da var (gizli) ve scope'suz locator ikisini birden yakalar.
    await expect(
      page.getByTestId("confirm-code-form").getByText(/Kod doğrulanamadı/)
    ).toBeVisible();

    await page.getByTestId("pickup-mock-reset").click();
    await expect(page.getByTestId("confirm-attempts")).toHaveCount(0);
  });
});

/**
 * A1 · Ekrana giriş yolu.
 *
 * Ayrı bir `describe`: sipariş listesi başka bir uç (`get_my_orders`) ve
 * başka bir sayfa. Bu testin koruduğu iddia: **alıcı teslim alma ekranına
 * siparişler sayfasından ulaşabiliyor** — ulaşılamayan ekran teslim edilmiş
 * sayılmıyor (`GOREV-TAMAMLAMA-SOZLESMESI` §2).
 */
test.describe("A1 · siparişler sayfasından giriş", () => {
  /** Biri teslim alınmayı bekliyor (mock sevkiyat listesiyle eşleşiyor), biri kargoda. */
  const SIPARISLER = [
    {
      name: "ORD-1",
      order_number: "ORD-2026-00840",
      order_date: "2026-08-20",
      grand_total: 15429.4,
      currency: "TRY",
      seller_name: "Örnek Tedarikçi",
      status: "Delivering",
      status_color: "text-blue-600",
      items: [],
    },
    {
      name: "ORD-2",
      order_number: "ORD-2026-00871",
      order_date: "2026-08-21",
      grand_total: 980,
      currency: "TRY",
      seller_name: "Başka Tedarikçi",
      status: "Delivering",
      status_color: "text-blue-600",
      items: [],
    },
  ];

  test("teslim alınacak siparişte düğme VAR, kargodakinde YOK", async ({ page }) => {
    await oturumAc(page);
    await page.route("**/api/method/tradehub_core.api.order.get_my_orders*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: { success: true, orders: SIPARISLER, total: SIPARISLER.length },
        }),
      })
    );

    await page.goto("/pages/dashboard/orders.html");
    await expect(page.getByText("ORD-2026-00840").first()).toBeVisible();

    // Eşleme sipariş listesini beklemiyor; düğme biraz sonra beliriyor.
    const dugme = page.getByTestId("order-pickup-link");
    await expect(dugme).toHaveCount(1);
    await expect(dugme).toBeVisible();

    // Doğru sevkiyata götürüyor mu?
    await expect(dugme).toHaveAttribute("href", /name=SHP-2026-00035/);
  });
});

/**
 * Gerçek mod (`?mock=0`) — uçlar yokken ekran ne diyor.
 *
 * Bu testin koruduğu iddia: **ekran uydurmuyor.** Uç yazılmadan önce
 * "Teslim aldım" düğmesi çizilirse tıklayan alıcı hata alır; boş slot listesi
 * "uygun randevu kalmadı" derse alıcı sistemin baktığını ve bulamadığını
 * sanır. İkisi de 2026-08-26 kapanış denetiminde ölçüldü.
 */
test.describe("gerçek mod · uçlar bağlı değil", () => {
  test("ölü düğme çizilmez, 'bağlı değil' denir", async ({ page }) => {
    await oturumAc(page);
    // `?mock=0` örnek veri modunu kapatıyor; sevkiyat gerçek uçtan gelmediği
    // için sayfa hata ekranına düşmesin diye detay ucu da taklit ediliyor.
    await page.route("**/api/method/tradehub_core.api.v1.shipment.get_shipment_detail*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: {
            ok: true,
            data: {
              name: "SHP-2026-00035",
              order: "ORD-2026-00840",
              status: "Ready for Pickup",
              shipment_type: "Buyer Pickup",
              pickup_location: "İkitelli OSB, Bağcılar Cad. No:12",
            },
          },
        }),
      })
    );

    await page.goto("/pages/dashboard/shipment-tracking.html?mock=0&name=SHP-2026-00035");

    // Teslim noktası yine görünüyor — o bilgi sevkiyattan geliyor, uç istemiyor.
    await expect(page.getByText("İkitelli OSB").first()).toBeVisible();

    // Ama hiçbir eylem düğmesi yok.
    await expect(page.getByTestId("confirm-no-code")).toHaveCount(0);
    await expect(page.getByTestId("confirm-submit")).toHaveCount(0);
    await expect(page.getByTestId("appointment-submit")).toHaveCount(0);

    // Ve "uygun randevu kalmadı" DENMİYOR — sistem hiç bakmadı.
    await expect(page.getByTestId("appointment-no-slots")).toHaveCount(0);
    await expect(page.getByText(/api\.v1\.pickup\./).first()).toBeVisible();
  });
});

/**
 * Mobil görünüm.
 *
 * Bu testin koruduğu iddia: **alıcı işi telefonundan bitirebiliyor.**
 * Storefront'ta hiçbir E2E mobil viewport'ta koşmuyordu (`playwright.config.ts`
 * yalnız `chromium-desktop` tanımlıyor); 07-FE kapanış denetiminde bu eksik
 * ölçüldü. Teslim alma ekranı alıcıya ait ve alıcı depoya giderken telefonuna
 * bakıyor — masaüstünde doğrulanmış bir akış burada yeterli kanıt değil.
 *
 * 375×667: iPhone SE / 8 sınıfı, bugün hâlâ en dar yaygın ekran.
 */
test.describe("mobil · 375×667", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("teslim alma akışı telefonda da bitiyor", async ({ page }) => {
    await ekraniAc(page);

    // 1) Yatay kaydırma YOK — taşan bir kutu tüm sayfayı kaydırılabilir yapar.
    const tasma = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(tasma).toBeLessThanOrEqual(1); // 1px yuvarlama payı

    // 2) Kod girişi ve düğmesi ekranda ve dokunulabilir.
    const input = page.getByTestId("confirm-code-input");
    await expect(input).toBeVisible();
    const kutu = await input.boundingBox();
    expect(kutu!.width).toBeLessThanOrEqual(375);
    // Dokunma hedefi en az 32px — parmakla isabet edilebilsin.
    expect(kutu!.height).toBeGreaterThanOrEqual(32);

    // 3) Akış gerçekten kapanıyor.
    await input.fill("482913");
    await page.getByTestId("confirm-submit").click();
    await expect(page.getByText(/Teslimat tamamlandı/)).toBeVisible();
  });

  test("randevu formu telefonda kullanılabiliyor", async ({ page }) => {
    await ekraniAc(page);
    const form = page.getByTestId("appointment-form");

    const yarin = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    await form.getByTestId("appointment-date").fill(yarin);
    await form.locator('[aria-haspopup="listbox"]').click();
    await page.locator('[data-select-menu-value="09-12"]').click();
    await form.getByTestId("appointment-submit").click();

    await expect(page.getByTestId("appointment-current")).toContainText("09:00");
  });
});
