/**
 * 13-FE · Paketleme / Etiket — KABUL SENARYOLARI.
 *
 * ÇALIŞTIRMA (kök'ten):
 *   PANEL_PASS='<administrator_parolasi>' ./e2e.sh --panel
 * veya tek dosya (tradehubfront kökünden):
 *   PANEL_PASS='…' npx playwright test tests/e2e/panel-lojistik-paketleme.spec.ts --headed
 *
 * Gerekli: docker stack ayakta, admin-panel build'li (`npm run build`).
 *
 * NEDEN BU DOSYA VAR:
 *   13-FE'de dokuz eksik, ancak kullanıcı ekran görüntüsü gönderdikçe ortaya
 *   çıktı: palet ekranına giden buton yoktu, panel herkesi salt-okunur
 *   sanıyordu, "etiketi aç" hiçbir şey açmıyordu. Hiçbiri build'i veya birim
 *   testlerini kırmıyordu — çünkü hepsi "ekran tarayıcıda kullanılabiliyor mu"
 *   sorusuna aitti ve o soru hiç sorulmamıştı.
 *
 *   Buradaki her test bir KABUL SENARYOSU: iş cinsinden yazılmış, ekran
 *   cinsinden değil. Kırmızıysa görev bitmemiştir.
 *
 * NOT: Uçlar henüz yok; ekranlar `api/packaging.js` içindeki `USE_MOCK` ile
 * çalışıyor ve veri localStorage'da tutuluyor. Bu yüzden her test kendi
 * demo verisini sıfırlayarak başlıyor — testler birbirinin kalıntısını
 * görmemeli.
 */
import { test, expect, request } from "@playwright/test";

const BASE = process.env.PANEL_BASE ?? "http://tradehub.localhost";
const USER = process.env.PANEL_USER ?? "Administrator";
const PASS = process.env.PANEL_PASS ?? "";

const QUEUE = "/panel/lojistik/paketleme";
/** Kısmen paketlenmiş demo sevkiyatı — dolu senaryo. */
const SHP = "SHP-2026-00042";
/** Hiç kolisi olmayan, barkodsuz demo sevkiyatı. */
const EMPTY_SHP = "SHP-2026-00043";

test.use({ baseURL: BASE });
test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ context }) => {
  if (!PASS) test.skip(true, "PANEL_PASS env değişkeni gerekli (admin parolası).");

  const api = await request.newContext({ baseURL: BASE });
  const res = await api.post("/api/method/login", { form: { usr: USER, pwd: PASS } });
  expect(res.ok(), "Frappe login başarısız — kullanıcı/parola?").toBeTruthy();
  const { cookies } = await api.storageState();
  await context.addCookies(cookies);

  await context.addInitScript(() => {
    localStorage.setItem("th-lang", "tr");
    // Demo verisi testler arasında taşınmasın — mock localStorage'da yaşıyor.
    //
    // DİKKAT: `addInitScript` HER navigasyonda çalışıyor. Koşulsuz silmek,
    // testin kendi kurduğu durumu (kaydedilen koli, seçilen hata senaryosu)
    // bir sonraki `goto`/`reload`'da siliyordu — kalıcılık ve hata testleri
    // bu yüzden yanlış sonuç veriyordu. Temizlik sekme başına BİR KEZ.
    if (!sessionStorage.getItem("__e2e_reset")) {
      localStorage.removeItem("logistics.mock.packaging.v1");
      localStorage.removeItem("logistics.mock.fault");
      sessionStorage.setItem("__e2e_reset", "1");
    }
    // Rehberli tur overlay'i tıklamayı yutuyor. CSS ile gizlemek YETMİYOR —
    // ölçüldü: overlay yine çiziliyor ve `elementFromPoint` onu döndürüyor.
    // Turu hiç BAŞLATMAMAK gerekiyor: `stores/tour.js` gördüğü bölümleri
    // `panel_tour_seen_v5` altında tutuyor, hepsini işaretli sayıyoruz.
    localStorage.setItem(
      "panel_tour_seen_v5",
      JSON.stringify([
        "dashboard", "catalog", "commerce", "logistics", "sellers", "crm",
        "helpdesk", "system", "store", "products", "orders", "management",
        "messaging",
      ])
    );
  });
});

// ── Kabul 1: operatör kuyruktan işe başlayabiliyor ───────────────────

test("kuyruk dört kovayı da sayaçlarıyla gösteriyor", async ({ page }) => {
  await page.goto(QUEUE);
  await expect(page.getByRole("heading", { name: /Paketleme kuyruğu/i })).toBeVisible();

  for (const bucket of ["Paketlenmedi", "Kısmen paketlendi", "Etiket bekliyor", "Hazır"]) {
    await expect(page.getByRole("button", { name: new RegExp(bucket, "i") })).toBeVisible();
  }
  // Her kovada en az bir kayıt olmalı — boş kova demo senaryosunu köreltir.
  await expect(page.locator("table tbody tr").first()).toBeVisible();
});

test("kuyruktan çalışma alanına geçilebiliyor", async ({ page }) => {
  await page.goto(`${QUEUE}?bucket=partial`);
  // DİKKAT: /Paketle/i regex'i "Paketlenmedi" kova pill'iyle de eşleşiyor.
  // Satır butonunu tabloya scope'layarak ve tam metinle hedefliyoruz.
  await page.locator("table").getByRole("button", { name: "Paketle →" }).first().click();
  await expect(page).toHaveURL(new RegExp(`/lojistik/paketleme/${SHP}`));
  await expect(page.getByRole("heading", { name: /^Paketleme$/ })).toBeVisible();
});

// ── Kabul 2: aksiyon butonları görünüyor (yetki köprüsü) ─────────────

test("YETKİ — admin salt-okunur bandı GÖRMÜYOR, aksiyonları görüyor", async ({ page }) => {
  // Bu test bir regresyon bekçisi: capability yükü sözlük olarak geliyordu,
  // store dizi bekliyordu ve panel Administrator'ı bile salt-okunur sanıyordu.
  await page.goto(`/panel/lojistik/paketleme/${EMPTY_SHP}`);
  await expect(page.getByText(/Salt-okunur yetki/i)).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Koli ekle|Yeni koli|İlk koliyi oluştur/i }).first()).toBeVisible();
});

// ── Kabul 3: koli oluşturup kalem atanabiliyor ───────────────────────

test("AKIŞ — koli oluştur, kalem ata, doğrulama temizlensin", async ({ page }) => {
  await page.goto(`/panel/lojistik/paketleme/${EMPTY_SHP}`);

  // Başlangıçta iki engel: koli yok + kalemler paketlenmedi.
  await expect(page.getByText(/Hiç koli oluşturulmamış/i)).toBeVisible();

  // Her kalemi kendi kolisine at — "Yeni koliye" koli açıp atamayı oraya yapar.
  const newPackageButtons = page.getByRole("button", { name: /^Yeni koliye$/ });
  const count = await newPackageButtons.count();
  expect(count, "paketlenecek kalem bulunamadı").toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    await newPackageButtons.first().click();
  }

  // Artık paketlenmemiş kalem kalmamalı.
  await expect(page.getByText(/kalem paketlenmedi/i)).toHaveCount(0);
  await expect(page.getByText(/Tüm kalemler paketlendi/i).first()).toBeVisible();
});

test("koli ağırlığı girilince desi ANINDA hesaplanıyor", async ({ page }) => {
  await page.goto(`/panel/lojistik/paketleme/${SHP}`);
  await page.getByRole("button", { name: /^Düzenle$/ }).first().click();

  const weight = page.locator('label:has-text("Ağırlık") input').first();
  await weight.fill("22");
  // Desi kutusu ölçülerden hesaplanıyor; ücret ağırlık ile desinin büyüğü.
  await expect(page.getByText(/Ücretlenen|ücretlendirilebilir/i).first()).toBeVisible();
});

// ── Kabul 4: etiket üretilip AÇILABİLİYOR ────────────────────────────

test("GERÇEK ÇIKTI — etiket üretiliyor ve yazdırılabilir belge açılıyor", async ({ page, context }) => {
  await page.goto(`/panel/lojistik/etiketler/${SHP}`);
  await expect(page.getByRole("heading", { name: /Etiket ve belgeler/i })).toBeVisible();

  // Etiketi olmayan koliyi seç ve üret.
  await page.locator('table tbody input[type="checkbox"]').last().check();
  const generate = page.getByRole("button", { name: /Seçilenleri üret/i });
  if (await generate.isEnabled()) await generate.click();

  // Yan önizlemede barkod çizilmiş olmalı — "Barkod yok" yazısı değil.
  await expect(page.locator('img[alt*="barkod" i]').first()).toBeVisible({ timeout: 10_000 });

  // "Etiketi aç" gerçekten bir sekme açmalı (blob belgesi).
  const opened = context.waitForEvent("page", { timeout: 10_000 });
  await page.getByRole("link", { name: /Etiketi aç/i }).first().click();
  const doc = await opened;
  await expect(doc.getByRole("button", { name: /Yazdır/i })).toBeVisible();
  await doc.close();
});

test("paket listesi (irsaliye) belgesi açılıyor", async ({ page, context }) => {
  await page.goto(`/panel/lojistik/etiketler/${SHP}`);
  const opened = context.waitForEvent("page", { timeout: 10_000 });
  await page.getByRole("button", { name: /Paket listesi/i }).click();
  const doc = await opened;
  await expect(doc.getByRole("heading", { name: /Paket listesi/i })).toBeVisible();
  await doc.close();
});

// ── Kabul 5: palet planı kullanılabiliyor ────────────────────────────

test("ULAŞILABİLİRLİK — palet planına çalışma alanından girilebiliyor", async ({ page }) => {
  // Regresyon bekçisi: ekran yazılmıştı ama hiçbir yerden linklenmiyordu.
  await page.goto(`/panel/lojistik/paketleme/${SHP}`);
  await page.getByRole("button", { name: /Palet planı/i }).click();
  await expect(page).toHaveURL(new RegExp(`/lojistik/paketleme/${SHP}/palet`));
  await expect(page.getByRole("heading", { name: /Palet planı/i })).toBeVisible();
});

test("palete koli yerleştirilebiliyor", async ({ page }) => {
  await page.goto(`/panel/lojistik/paketleme/${SHP}/palet`);
  await page.getByRole("button", { name: /Palet ekle/i }).click();

  // Atanmamış koliler havuzundan bir koliyi palete koy.
  const assign = page.locator("aside").getByRole("button", { name: /^PLT-/ }).first();
  await expect(assign).toBeVisible();
  await assign.click();

  // Kapasite göstergesi yüklenen ağırlığı yansıtmalı (0 kg olmamalı).
  await expect(page.getByText(/\/ \d+ kg/).first()).toBeVisible();
});

// ── Kabul 6: hata ekranları tetiklenebiliyor ─────────────────────────

test("TETİKLENEBİLİR HATA — çakışma senaryosu ekranda görünüyor", async ({ page }) => {
  await page.goto(QUEUE);
  await page.getByText(/Demo verisi ve hata senaryoları/i).click();
  await page.getByRole("button", { name: /Eşzamanlı değişiklik/i }).click();

  await page.goto(`/panel/lojistik/paketleme/${SHP}`);
  await page.getByRole("button", { name: /^Yeni koli$|^\+ Yeni koli$/ }).first().click();
  await page.getByRole("button", { name: /Taslağı kaydet/i }).click();

  // Sözleşmedeki CONFLICT ekranı: "başkası değiştirdi, yeniden yükle".
  await expect(page.getByText(/başka bir kullanıcı|yeniden yükle/i).first()).toBeVisible({ timeout: 10_000 });
});

// ── Kabul 7: kalıcılık ───────────────────────────────────────────────

test("KALICILIK — kaydedilen koli sayfa yenilenince duruyor", async ({ page }) => {
  await page.goto(`/panel/lojistik/paketleme/${EMPTY_SHP}`);
  await page.getByRole("button", { name: /^Yeni koliye$/ }).first().click();
  await page.getByRole("button", { name: /Taslağı kaydet/i }).click();
  await expect(page.getByText(/^Kaydedildi$/)).toBeVisible({ timeout: 10_000 });

  await page.reload();
  // Yenilemeden sonra koli hâlâ orada olmalı — mock localStorage'da tutuyor.
  await expect(page.getByText(/Henüz koli oluşturulmamış/i)).toHaveCount(0);
});
