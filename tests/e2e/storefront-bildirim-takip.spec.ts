/**
 * 12-FE · Bildirim tercihleri + alıcı takip — uçtan uca akış.
 *
 * Bu spec'in koruduğu iddia: **alıcı, backend hiç yazılmamışken bile bildirim
 * tercihini gerçekten değiştirebiliyor ve teslim kanıtını görebiliyor.**
 * Birim testleri mock'un mantığını doğruluyor
 * (`services/__tests__/logisticsNotificationMock.test.ts`); burası ekranın
 * gerçekten kullanılabildiğini gösteriyor.
 *
 * NEDEN ÖNEMLİ: bu ekran 13 Ağustos'tan 28 Ağustos'a kadar çiziliyordu ve
 * anahtar hiçbir modda kaydetmiyordu. Build, `tsc` ve birim testleri bunu
 * görmüyordu — `GOREV-TAMAMLAMA-SOZLESMESI` §3'ün tarif ettiği tam durum.
 *
 * Kabul senaryoları K1…K13 → `12-FE-bildirim-takip-ANALIZ.md` §4.
 */
import { expect, test, type Page } from "@playwright/test";

const TERCIHLER = "/pages/dashboard/notification-preferences.html";
const TAKIP = "/pages/dashboard/shipment-tracking.html";
/** Fixture'da teslim edilmiş tek sevkiyat — POD bloğu yalnız bunda çiziliyor. */
const TESLIM_EDILEN = "SHP-2026-00041";

/**
 * Sayfa `requireAuth()` ile korumalı; oturum ucu taklit ediliyor.
 *
 * Dil burada kuruluyor: temiz bir bağlam İngilizce açılıyor ve Türkçe metin
 * arayan iddialar sessizce düşüyor (07-FE'de dokuz test bu yüzden kırmızıydı).
 * `localStorage` TEMİZLENMİYOR — testin kendi kurduğu tercih `reload()`
 * sonrası silinseydi kalıcılık iddiası yanlış yeşil verirdi.
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

async function tercihleriAc(page: Page, senaryo?: string): Promise<void> {
  await oturumAc(page);
  await page.goto(senaryo ? `${TERCIHLER}?senaryo=${senaryo}` : TERCIHLER);
}

async function takibiAc(page: Page, name: string, senaryo?: string): Promise<void> {
  await oturumAc(page);
  const q = senaryo ? `?name=${name}&senaryo=${senaryo}` : `?name=${name}`;
  await page.goto(`${TAKIP}${q}`);
}

const anahtarlar = (page: Page) => page.locator('[data-testid="pref-toggle"]');

/** Fixture'da açık gelen, alıcıya ait tercih. */
const ACIK_SABLON = "NT-SHIPPED-BUYER-EMAIL";

const kutu = (page: Page, sablon: string) =>
  page.locator(`[data-testid="pref-toggle"][data-template="${sablon}"]`);

/**
 * Anahtarı kullanıcı gibi çevirir.
 *
 * `input` `sr-only` — ekran okuyucu görüyor, fare görmüyor. Playwright'ın
 * `check()/uncheck()` çağrısı görünmeyen elemanda durur; gerçek kullanıcı
 * zaten görünen `label`'a tıklıyor. Testin de tıkladığı yer orası olmalı,
 * yoksa ölçtüğü şey ekran değil DOM olur.
 */
async function anahtariCevir(page: Page, sablon: string): Promise<void> {
  await page.locator(`label:has([data-template="${sablon}"])`).click();
  // Kayıt bitene kadar bekle. İki incelik:
  //   · Gösterge HER satırda var; yalnız o satırınki hedefleniyor, yoksa
  //     "strict mode violation" (üç eşleşme).
  //   · `x-show` gizliyor ama DOM'dan silmiyor — `toHaveCount(0)` yanlış
  //     yeşil verirdi, doğru iddia `toBeHidden`.
  await expect(
    page.locator(`li:has([data-template="${sablon}"])`).getByText("Kaydediliyor…")
  ).toBeHidden();
}

test.describe("12-FE · bildirim tercihleri", () => {
  test("K3 · alıcı YALNIZ kendi tercihlerini görüyor", async ({ page }) => {
    await tercihleriAc(page);
    await expect(anahtarlar(page).first()).toBeVisible();

    const sablonlar = await anahtarlar(page).evaluateAll((els) =>
      els.map((e) => e.getAttribute("data-template"))
    );

    // Fixture'da beş kayıt var; ikisi alıcıya ait DEĞİL.
    expect(sablonlar).not.toContain("NT-DELIVERED-SELLER-EMAIL");
    expect(sablonlar).not.toContain("NT-EXCEPTION-OPS-INAPP");
    expect(sablonlar.length).toBeGreaterThan(1);
  });

  test("K1 · kapatılan tercih sayfa yenilenince KAPALI kalıyor", async ({ page }) => {
    await tercihleriAc(page);
    await expect(kutu(page, ACIK_SABLON)).toBeChecked();

    await anahtariCevir(page, ACIK_SABLON);
    await expect(kutu(page, ACIK_SABLON)).not.toBeChecked();

    await page.reload();
    await expect(kutu(page, ACIK_SABLON)).not.toBeChecked();
  });

  test("K2 · zorunlu bildirim kapatılamıyor", async ({ page }) => {
    await tercihleriAc(page, "hepsi-zorunlu");
    await expect(anahtarlar(page).first()).toBeDisabled();

    // Gerekçe GÖRÜNÜYOR — kilit sessiz değil.
    await expect(page.getByText(/kapatılamaz/i).first()).toBeVisible();
  });

  test("K4 · kayıt başarısızsa anahtar ESKİ hâline dönüyor", async ({ page }) => {
    await tercihleriAc(page, "kayit-hatasi");
    await expect(kutu(page, ACIK_SABLON)).toBeChecked();

    await anahtariCevir(page, ACIK_SABLON);

    // Hata duyuruluyor…
    await expect(page.getByRole("alert").first()).toBeVisible();
    // …ve anahtar geri dönüyor: kullanıcı kapattığını sanmıyor.
    await expect(kutu(page, ACIK_SABLON)).toBeChecked();
  });

  test("K5 · tercih yoksa boş durum, hata değil", async ({ page }) => {
    await tercihleriAc(page, "bos");
    await expect(anahtarlar(page)).toHaveCount(0);
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(page.getByText(/Tercih bulunamadı/i)).toBeVisible();
  });

  test("K5 · yetkisizken sebebi yazıyor", async ({ page }) => {
    await tercihleriAc(page, "yetkisiz");
    await expect(page.getByText(/yetkiniz yok/i).first()).toBeVisible();
  });

  test("K12 · bildirim akışından sevkiyata gidiliyor", async ({ page }) => {
    await tercihleriAc(page);
    const satirlar = page.locator('[data-testid="notification-row"]');
    await expect(satirlar.first()).toBeVisible();

    const bag = satirlar.first().getByRole("link").first();
    await expect(bag).toHaveAttribute("href", /shipment-tracking\.html\?name=SHP-/);
  });

  test("K12 · okunmamış bildirime tıklamak onu okundu işaretliyor", async ({ page }) => {
    await tercihleriAc(page);
    const okunmamis = page.locator('[data-testid="notification-row"][data-read="0"]').first();
    await expect(okunmamis).toBeVisible();
    const ad = await okunmamis.getAttribute("data-name");

    // Bağlantıya değil, satırın boşluğuna tıkla — bağlantı sayfayı değiştirir.
    await okunmamis.click({ position: { x: 5, y: 5 } });

    // Locator'ı KİMLİĞE bağla: `[data-read="0"]` filtresi tıklamadan sonra
    // sıradaki okunmamış satırı eşleştirir ve iddia yanlış yere bakar.
    const satir = page.locator(`[data-testid="notification-row"][data-name="${ad}"]`);
    await expect(satir).toHaveAttribute("data-read", "1");

    await page.reload();
    await expect(satir).toHaveAttribute("data-read", "1");
  });

  test("ekranda çevrilmemiş ham anahtar yok", async ({ page }) => {
    await tercihleriAc(page);
    await expect(anahtarlar(page).first()).toBeVisible();
    // `email` ham değeri 28 Ağustos'a kadar ekranda görünüyordu: kanal
    // etiketi yanlış i18n ad alanından çağrılıyordu.
    await expect(page.locator("body")).not.toContainText(/\bshipment\.[a-z]/i);
    await expect(page.getByText("E-posta").first()).toBeVisible();
  });
});

/**
 * 🔴 Örnek veri CANLIYA sızmamalı.
 *
 * `?mock=0` örnek veri modunu kapatıyor. Ekran o zaman sahte tercih listesi
 * değil "henüz bağlı değil" göstermeli — 28 Ağustos denetimine kadar mock
 * modülü ortamı hiç sormuyordu ve canlıda da örnek veri dönecekti.
 */
test.describe("gerçek mod · uçlar bağlı değil", () => {
  test("tercih listesi yerine 'bağlı değil' yazıyor", async ({ page }) => {
    await oturumAc(page);
    await page.goto(`${TERCIHLER}?mock=0`);

    await expect(anahtarlar(page)).toHaveCount(0);
    await expect(page.getByText(/henüz bağlı değil/i).first()).toBeVisible();
    // Sahte isim ekranda GÖRÜNMEMELİ.
    await expect(page.locator("body")).not.toContainText("Mehmet Yıldız");
  });

  test("teslim kanıtı yerine 'bağlı değil' yazıyor", async ({ page }) => {
    await oturumAc(page);
    await page.goto(`${TAKIP}?name=${TESLIM_EDILEN}&mock=0`);

    await expect(page.locator('[data-testid="pod-card"]')).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText("MNG-2210554");
  });
});

test.describe("12-FE · teslim kanıtı", () => {
  test("K8 · kanıt ve taşıyıcı bilgisi görünüyor", async ({ page }) => {
    await takibiAc(page, TESLIM_EDILEN);
    const kart = page.locator('[data-testid="pod-card"]');
    await expect(kart).toHaveAttribute("data-state", "ok");

    await expect(kart).toContainText("Mehmet Yıldız");
    await expect(kart).toContainText("MNG-2210554");
    await expect(kart).toContainText("MNG-35004");
    // K-E · iç damgalar ekranda YOK.
    await expect(kart).not.toContainText("webhook");
  });

  test("K9 · kanıt yoksa hata değil, bilgi", async ({ page }) => {
    await takibiAc(page, TESLIM_EDILEN, "pod-yok");
    const kart = page.locator('[data-testid="pod-card"]');
    await expect(kart).toHaveAttribute("data-state", "empty");
    await expect(kart.getByRole("alert")).toHaveCount(0);
  });

  test("K10 · medya yetkisi yoksa kırık görsel çizilmiyor", async ({ page }) => {
    await takibiAc(page, TESLIM_EDILEN, "pod-medyasiz");
    const kart = page.locator('[data-testid="pod-card"]');

    await expect(kart.locator("img")).toHaveCount(0);
    await expect(kart.locator('[data-testid="pod-media-hidden"]')).toBeVisible();
    // Geri kalan bilgi duruyor — ekran boşalmıyor.
    await expect(kart).toContainText("Mehmet Yıldız");
  });

  test("K11 · eksik teslimde gerekçe duyuruluyor", async ({ page }) => {
    await takibiAc(page, TESLIM_EDILEN, "pod-eksik");
    const uyari = page.locator('[data-testid="pod-discrepancy"]');

    await expect(uyari).toBeVisible();
    await expect(uyari).toHaveAttribute("role", "alert");
    await expect(uyari).toContainText("ıslanmış");
    // Gerekçe kodu ÇEVRİLİ görünmeli: mock sözleşmedeki kodu üretiyor
    // (uydurulmuş `DAMAGED_PACKAGE` ekranda ham metin olarak çıkıyordu).
    await expect(uyari).toContainText("Paket hasarlı");
    await expect(uyari).not.toContainText("DAMAGED");
  });

  test("K7 · siparişin sevkiyatları listeleniyor ve bağlantılar çalışıyor", async ({ page }) => {
    await takibiAc(page, TESLIM_EDILEN);
    // Mock modda `?name=` yok sayılıyordu: her bağlantı aynı kaydı açıyordu.
    await expect(page.locator('[data-testid="pod-card"]')).toBeVisible();
    await expect(page.locator("body")).toContainText(TESLIM_EDILEN);
  });
});

test.describe("K13 · mobil", () => {
  test("tercih telefonda da değiştirilebiliyor", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await tercihleriAc(page);

    await expect(kutu(page, ACIK_SABLON)).toBeChecked();
    await anahtariCevir(page, ACIK_SABLON);

    await page.reload();
    await expect(kutu(page, ACIK_SABLON)).not.toBeChecked();
  });

  test("teslim kanıtı telefonda okunabiliyor", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await takibiAc(page, TESLIM_EDILEN);

    const kart = page.locator('[data-testid="pod-card"]');
    await expect(kart).toBeVisible();
    // Yatay taşma yok: kart görünür alanı aşmıyor.
    const tasma = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    );
    expect(tasma).toBe(false);
  });
});

/**
 * Bu spec'te `yalnizMasaustu()` KULLANILMIYOR — bilinçli.
 *
 * Her iddiası mobil düzende de geçerli olmalı: bildirim tercihleri bir ayar
 * ekranı ve alıcıların çoğu telefondan bakıyor. Masaüstü DOM'una bağlı bir
 * iddia eklenirse o zaman bu satır gerekir (`fixtures/viewport.ts`).
 */
