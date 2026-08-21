/**
 * Lojistik paketleme/etiket — SATICI ROLÜ kabul senaryoları.
 *
 * ÇALIŞTIRMA (kök'ten):
 *   SELLER_PASS='<satıcı parolası>' ./e2e.sh --seller
 * veya tek dosya (tradehubfront kökünden):
 *   SELLER_PASS='…' npx playwright test tests/e2e/panel-lojistik-satici.spec.ts
 *
 * NEDEN AYRI DOSYA:
 *   `panel-lojistik-paketleme.spec.ts` Administrator ile giriyor. Aynı dosyada
 *   iki kimlik kullanmak `sid` çerezini test sırasına bağımlı hâle getiriyor —
 *   kimin oturumuyla koşulduğu okunmaz olurdu. Rol ayrı dosya, ayrı parola.
 *
 * NEDEN VAR:
 *   Panel hem satıcıya hem admin'e hizmet ediyor ve iki menü AYRI yapılardan
 *   besleniyor. 13-FE'de ekran satıcı menüsüne hiç eklenmemişti ve bu ancak
 *   kullanıcı sorunca ortaya çıktı; admin oturumuyla koşan hiçbir test onu
 *   göremezdi. Görünüm modları da aynı riski taşıyor: admin'de çalışan toggle,
 *   satıcıda yetki köprüsü yüzünden ekranı boş bırakabilir.
 *
 * KAPSAM: yalnız Ali'nin iki ekranı (G0 paketleme kuyruğu, G2 etiket).
 */
import { test, expect, request } from "@playwright/test";

const BASE = process.env.PANEL_BASE ?? "http://tradehub.localhost";
const USER = process.env.SELLER_USER ?? "ali.bal@turksab.com";
const PASS = process.env.SELLER_PASS ?? "";

const QUEUE = "/panel/lojistik/paketleme";
const SHP = "SHP-2026-00042";

test.use({ baseURL: BASE });
test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ context }) => {
  if (!PASS) test.skip(true, "SELLER_PASS env değişkeni gerekli (satıcı parolası).");

  const api = await request.newContext({ baseURL: BASE });
  const res = await api.post("/api/method/login", { form: { usr: USER, pwd: PASS } });
  expect(res.ok(), "Frappe login başarısız — satıcı kullanıcı/parola?").toBeTruthy();
  const { cookies } = await api.storageState();
  await context.addCookies(cookies);

  await context.addInitScript(() => {
    localStorage.setItem("th-lang", "tr");
    if (!sessionStorage.getItem("__e2e_reset")) {
      localStorage.removeItem("logistics.mock.packaging.v1");
      localStorage.removeItem("logistics.mock.fault");
      localStorage.removeItem("logistics.mock.pod.v1");
      sessionStorage.setItem("__e2e_reset", "1");
    }
    // Rehberli tur overlay'i tıklamayı yutuyor — hiç başlatma.
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

// ── Kimlik ve menü ───────────────────────────────────────────────────

test("SATICI — gerçekten satıcı oturumu (admin değil)", async ({ page }) => {
  // Bu testin varlık sebebi: parola yanlışsa ya da hesap admin'e terfi etmişse
  // aşağıdaki testler "satıcıda çalışıyor" der ama aslında admin'i ölçer.
  await page.goto(QUEUE);
  const session = await page.evaluate(async () => {
    const res = await fetch("/api/method/tradehub_core.api.v1.auth.get_session_user");
    return (await res.json()).message?.user ?? {};
  });
  expect(Boolean(session.is_seller), "hesap satıcı değil").toBe(true);
  expect(Boolean(session.is_admin), "hesap ADMIN — satıcı testi geçersiz").toBe(false);
});

test("SATICI — Paketleme menüde var ve menü admin'in ALT KÜMESİ", async ({ page }) => {
  await page.goto(QUEUE);
  await expect(page.getByRole("heading", { name: /Paketleme kuyruğu/i })).toBeVisible();

  const links = await page.evaluate(() =>
    [...document.querySelectorAll('a[href*="/lojistik/"]')].map((a) => a.getAttribute("href"))
  );
  // G0 rol matrisi (2026-08-19) + 14-FE menü kaydı sonrası satıcının GÖRMESİ
  // GEREKEN kalemler. Liste 13-FE'de yalnız paketlemeydi; matris sevkiyatları,
  // 14-FE de teslimat grubunu açtı.
  for (const gorunmeli of [
    "/panel/lojistik/paketleme",
    "/panel/lojistik/sevkiyatlar",
    "/panel/lojistik/sevkiyatlar/yeni",
    "/panel/lojistik/teslim-kaniti",
    "/panel/lojistik/satici-teslimati",
    "/panel/lojistik/alici-teslim-alma",
  ]) {
    expect(links, `satıcı menüsünde olmalı: ${gorunmeli}`).toContain(gorunmeli);
  }

  // Platform ekranları satıcıya KAPALI: katalog/ayar/taşıyıcı hesabı/durum
  // eşlemesi admin işi. Menüde görünürlerse satıcı tıklar ve yetki hatası yer.
  //
  // NOT: "/panel/lojistik/sevkiyatlar" bu listeden ÇIKARILDI — G0 matrisi
  // (Bora, 2026-08-19) sevkiyat listesini satıcıya açtı ve `module_navigation_spec`
  // kaydı eklendi. Test bayatlamıştı; 13-FE'de yazıldığında karar farklıydı.
  for (const yasak of [
    "/panel/lojistik/kataloglar",
    "/panel/lojistik/ayarlar",
    "/panel/lojistik/tasiyici-hesaplari",
    "/panel/lojistik/durum-eslemesi",
  ]) {
    expect(links, `satıcı menüsünde olmamalı: ${yasak}`).not.toContain(yasak);
  }
});

// ── Görünüm modları — satıcıda da tam çalışıyor ──────────────────────

test("SATICI — kuyruk dört görünüm modunu da sunuyor", async ({ page }) => {
  await page.goto(QUEUE);
  await expect(page.locator("table tbody tr").first()).toBeVisible();

  // Toggle admin'dekiyle aynı: dört düğme.
  await expect(page.locator(".view-mode-toggle button")).toHaveCount(4);
  for (const mod of ["Tablo Görünümü", "Kart Görünümü", "Kanban Görünümü", "Liste Görünümü"]) {
    await expect(page.getByRole("button", { name: mod })).toBeVisible();
  }
});

test("SATICI — kanban dört kovayı gösteriyor ve SALT-OKUNUR", async ({ page }) => {
  await page.goto(QUEUE);
  await page.getByRole("button", { name: "Kanban Görünümü" }).click();

  await expect(page.locator(".kanban-col-header")).toHaveCount(4);
  await expect(page.getByText(/Salt-okunur pano/i)).toBeVisible();

  const card = page.locator(".kanban-card").first();
  await expect(card).toBeVisible();
  expect(await card.getAttribute("draggable"), "satıcıda kanban kartı sürüklenebilir").toBeNull();

  // Kova pill'leri kanbanda çekiliyor — admin'dekiyle aynı davranış.
  await expect(page.getByRole("button", { name: /^Paketlenmedi$/ })).toHaveCount(0);
});

test("SATICI — kanban kartından kendi çalışma alanına giriyor", async ({ page }) => {
  await page.goto(QUEUE);
  await page.getByRole("button", { name: "Kanban Görünümü" }).click();
  await page.locator(".kanban-card").first().click();

  await expect(page).toHaveURL(/\/lojistik\/paketleme\/SHP-/);
  await expect(page.getByRole("heading", { name: /^Paketleme$/ })).toBeVisible();
});

test("SATICI — mod tercihi sayfa yenilenince hatırlanıyor", async ({ page }) => {
  await page.goto(QUEUE);
  await page.getByRole("button", { name: "Kart Görünümü" }).click();
  await expect(page.locator(".list-grid-card").first()).toBeVisible();

  await page.reload();
  await expect(page.locator(".list-grid-card").first()).toBeVisible();
  await expect(page.locator("table tbody tr")).toHaveCount(0);
});

test("SATICI — etiket ekranı üç mod sunuyor, kanban YOK", async ({ page }) => {
  await page.goto(`/panel/lojistik/etiketler/${SHP}`);
  // Ekranda İKİ tablo var (koliler + 20-FE taşıyıcı seçenekleri); çıplak
  // `table tbody tr` ikisini toplayıp kart sayısıyla karşılaştırmayı bozuyor.
  // Erişilebilir ada bağlanıyoruz — ekran okuyucunun ayırdığı yerden.
  const koliler = page.getByRole("table", { name: "Koliler" });
  await expect(koliler.locator("tbody tr").first()).toBeVisible();
  const rows = await koliler.locator("tbody tr").count();

  await expect(page.locator(".view-mode-toggle button")).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Kanban Görünümü" })).toHaveCount(0);

  await page.getByRole("button", { name: "Kart Görünümü" }).click();
  await expect(page.locator(".list-grid-card")).toHaveCount(rows);
  // Yan önizleme satıcıda da duruyor — eylemler orada.
  await expect(page.getByRole("heading", { name: /^Önizleme$/ })).toBeVisible();
});

// ── Rol farkı: satıcı GÖRMEMESİ gerekeni görmüyor ────────────────────

test("SATICI — DEMO geliştirici paneli GÖRÜNMÜYOR", async ({ page }) => {
  // Panel bir geliştirici aracı: satıcı "Yetki hatası" senaryosunu seçip kendi
  // ekranını kilitleyebiliyor ve nedenini anlayamıyor (13-FE'de ölçüldü).
  // Görünüm modları eklenirken başlık satırı yeniden düzenlendi — bu testin
  // işi o düzenlemenin paneli yanlışlıkla satıcıya açmadığını doğrulamak.
  await page.goto(QUEUE);
  await expect(page.locator("table tbody tr").first()).toBeVisible();
  await expect(page.getByText(/Demo verisi ve hata senaryoları/i)).toHaveCount(0);
});

// ── 14-FE · Teslim kanıtı ve teslimat akışları (satıcı rolü) ─────────

const POD_QUEUE = "/panel/lojistik/teslim-kaniti";
const SELLER_FLOW = "/panel/lojistik/satici-teslimati";

/** `AppSelect` native `<select>` değil: tetikleyici buton + listbox paneli. */
async function appSelect(page, id: string, etiket: RegExp | string) {
  await page.locator(`#${id} button.as-trigger`).click();
  await page.locator("li.as-option").filter({ hasText: etiket }).first().click();
}

test("SATICI — K4: kanıt kuyruğunda YALNIZ kendi sevkiyatları", async ({ page }) => {
  // Tenant izolasyonu gerçek uçta backend'de; mock onu taklit ediyor. Sabit
  // bir satıcı adına bağlıyken bu ekran satıcıda BOŞ kalıyordu (ölçüldü
  // 2026-08-19) — mock artık oturumdaki satıcıya uyarlanıyor.
  await page.goto(POD_QUEUE);
  await expect(page.getByRole("heading", { name: /Teslim kanıtı/i }).first()).toBeVisible();
  await expect(page.locator("table tbody tr").first()).toBeVisible();

  // Satıcı görünümünde "Satıcı" sütunu HİÇ çizilmiyor: kendi kayıtlarına
  // bakan birine her satırda kendi adını yazmak gürültü.
  const basliklar = await page.locator("table thead th").allTextContents();
  expect(basliklar.join("|"), "satıcı görünümünde Satıcı sütunu var").not.toMatch(/Satıcı/);

  // "Kendi sevkiyatlarınız" rozeti listenin neden kısa olduğunu söylüyor.
  await expect(page.getByText(/Kendi sevkiyatlarınız/i).first()).toBeVisible();
});

test("SATICI — K4: BAŞKASININ sevkiyatına erişemiyor", async ({ page }) => {
  // Tohumda "Yıldız Nalbur"a ait sevkiyat var; satıcı onu URL'den açmaya
  // çalışınca yetki hatası görmeli — boş ekran değil.
  await page.goto("/panel/lojistik/sevkiyatlar/SHP-2026-00047/teslim-kaniti");
  await expect(page.getByText(/yetkiniz yok|size ait değil|erişim/i).first()).toBeVisible({ timeout: 10_000 });
});

test("SATICI — K5: kendi kanıtını kaydediyor, kayıt SATICI BEYANI damgası taşıyor", async ({ page }) => {
  await page.goto(POD_QUEUE);
  await expect(page.locator("table tbody tr").first()).toBeVisible();

  // Kanıt bekleyen kendi sevkiyatını aç.
  await page.getByRole("button", { name: /Kanıt bekliyor/i }).first().click();
  await expect(page.locator("table tbody tr").first()).toBeVisible();
  await page.getByRole("link", { name: /Kanıtı aç/i }).first().click();

  await page.getByRole("button", { name: /Teslim kanıtı kaydet/i }).click();
  await page.locator("#pod-delivered-at").fill("2026-08-19T11:00");
  await page.locator("#pod-received-by").fill("Mehmet Demir");
  await appSelect(page, "pod-title", "Depo sorumlusu");
  await page.getByRole("button", { name: /^Kanıtı kaydet$/i }).click();

  // DAMGA SUNUCUDA belirleniyor: satıcının kaydı "operasyon kaydı" olamaz.
  await expect(page.getByText(/Satıcı beyanı/i).first()).toBeVisible();
});

test("SATICI — K5: düzeltme yetkisi YOK", async ({ page }) => {
  // Satıcı kendi beyanını sessizce değiştirebilseydi denetim izi anlamsızdı.
  // Kanıtı OLAN kendi sevkiyatına doğrudan gidiliyor: kova üzerinden gitmek
  // testi tohumdaki kova dağılımına bağlar ve kırılgan olur.
  await page.goto("/panel/lojistik/sevkiyatlar/SHP-2026-00033/teslim-kaniti");
  await expect(page.getByText(/Taşıyıcıdan|Operasyon kaydı|Satıcı beyanı/).first()).toBeVisible();

  await expect(
    page.getByRole("button", { name: /Teslim kanıtını düzelt/i }),
    "satıcıya düzeltme düğmesi çizilmiş"
  ).toHaveCount(0);
});

test("SATICI — teslimat akışında kendi kayıtları ve teslim düğmesi", async ({ page }) => {
  await page.goto(SELLER_FLOW);
  await expect(page.getByRole("heading", { name: /Satıcı teslimatı/i })).toBeVisible();
  await expect(page.getByText(/Kendi sevkiyatlarınız/i).first()).toBeVisible();

  // Kendi aracıyla teslim satıcının fiziksel işi (K-M): ekran ona AÇIK.
  await expect(page.getByText(/Bu ekran satıcı menüsünde yok/i)).toHaveCount(0);
});

// ═══════════════════════════════════════════════════════════════════════
//  FİYATLANDIRMA (20-FE) — satıcı rolü kabul senaryoları
//
//  Analiz raporu §5'teki S6, S7, S8, S9, S13. Admin tarafı ayrı dosyada
//  (`panel-lojistik-fiyatlandirma.spec.ts`).
//
//  Bu blok NEDEN burada: 20-FE'nin en kritik kararı (K2 · iki yönlü maliyet
//  maskeleme) yalnız satıcı oturumunda görülebiliyor. Admin oturumuyla koşan
//  hiçbir test "satıcı kendi maliyetini görüyor mu" sorusunu soramaz.
// ═══════════════════════════════════════════════════════════════════════

const FIYATLARIM = "/panel/lojistik/tarifeler";
const KURALLARIM = "/panel/lojistik/fiyat-kurallari";
const HESAPLA = "/panel/lojistik/fiyat-simulasyonu";

test("SATICI — S13: fiyatlandırma menüde VAR ve üç kalem açılıyor", async ({ page }) => {
  await page.goto(FIYATLARIM);
  // 13-FE'de tam bu unutulmuştu: ekran yazıldı, satıcı menüsüne eklenmedi.
  await expect(page.getByRole("heading", { name: /Kargo fiyatlarım/i })).toBeVisible();

  const links = await page.evaluate(() =>
    [...document.querySelectorAll('a[href*="/lojistik/"]')].map((a) => a.getAttribute("href"))
  );
  for (const yol of [FIYATLARIM, KURALLARIM, HESAPLA]) {
    expect(links, `satıcı menüsünde yok: ${yol}`).toContain(yol);
  }
});

test("SATICI — S7: KENDİ maliyetini görüyor, PLATFORMUNKİNİ görmüyor", async ({ page }) => {
  await page.goto(KURALLARIM);
  await expect(page.getByRole("heading", { name: /Kargo kurallarım/i })).toBeVisible();

  // Kendi kuralında alış tutarı GÖRÜNÜYOR (para birimi işaretiyle).
  const kendi = page.locator("article").filter({ hasText: /Aras anlaşmam/i }).first();
  await expect(kendi.getByText(/Alış:/)).toBeVisible();
  await expect(kendi.getByText(/Alış:\s*₺|Alış:\s*[\d.,]+/)).toBeVisible();

  // Platform kuralında alış MASKELİ — "—" ve gerekçeli ipucu.
  const platform = page.locator("article").filter({ hasText: /İç Anadolu/i }).first();
  const maskeli = platform.locator('[title*="satıcıya kapalı"]');
  await expect(maskeli.first(), "platform maliyeti satıcıya AÇIK görünüyor").toBeVisible();
});

test("SATICI — S13b: platform kuralını DÜZENLEYEMİYOR", async ({ page }) => {
  await page.goto(KURALLARIM);
  const platform = page.locator("article").filter({ hasText: /İç Anadolu/i }).first();

  // Yetkisize çalışmayacak düğme çizmek, ona backend hatası yedirmek demek.
  await expect(platform.getByRole("button", { name: /^Sil$/i })).toHaveCount(0);
  await expect(platform.getByText(/salt-okunur/i)).toBeVisible();
});

test("SATICI — S6: kendi kuralını tanımlayabiliyor", async ({ page }) => {
  await page.goto(KURALLARIM);
  await page.getByRole("button", { name: /Kendi kuralım/i }).click();
  await expect(page.getByText(/Nasıl bir kural kuracaksın/i)).toBeVisible();

  await page.getByText(/Kendi aracımla teslim/i).first().click();

  // Sahip alanı KİLİTLİ: satıcı başka satıcı adına kural yazamaz.
  const sahip = page.locator('input[disabled]').first();
  await expect(sahip).toBeVisible();

  // "Zorunlu" anahtarı satıcıda HİÇ YOK (kapı uçta, burada yalnız kolaylık).
  await expect(page.getByText(/Zorunlu kural/i)).toHaveCount(0);

  const ad = `E2E · kendi rotam ${Date.now()}`;
  // Etikete bağlan: çıplak `input[type="text"]` panelin ÜST ÇUBUĞUNDAKİ genel
  // arama kutusunu yakalıyor, ad hiç dolmuyordu (ölçüldü 2026-08-21).
  await page.getByLabel(/Kural adı/).fill(ad);
  await page.getByRole("button", { name: /^Kaydet$/i }).click();
  await expect(page.getByText(ad)).toBeVisible({ timeout: 10_000 });
});

test("SATICI — S8: kendi yükü için fiyat hesaplatabiliyor ve GEREKÇEYİ görüyor", async ({ page }) => {
  await page.goto(HESAPLA);
  await expect(page.getByRole("heading", { name: /Fiyat hesapla/i })).toBeVisible();

  // Satıcı SEÇİCİSİ satıcıda YOK — kendi yükünden başkasını hesaplayamaz.
  await expect(page.getByLabel(/^Satıcı$/i)).toHaveCount(0);

  await page.getByRole("button", { name: /Hesapla/i }).click();
  await expect(page.getByText(/Neden bu fiyat çıktı/i)).toBeVisible({ timeout: 10_000 });

  // Kendi taşıyıcı hesapları rozetle ayrışıyor.
  await expect(page.getByText(/kendi anlaşmam/i).first()).toBeVisible();
});

test("SATICI — S3: zararına kural KAYDETMEDEN ÖNCE uyarı veriyor", async ({ page }) => {
  // Kabul senaryosu S3'ün asıl yarısı. Admin tarafındaki eşi maskelemeyi
  // doğruluyor (zararı GÖRMEMELİ); uyarının GÖRÜNDÜĞÜ yer sahibinin ekranı.
  // Tohumda "İstanbul içi · kendi aracım" bilerek zararda: alış 80, satış 0.
  await page.goto(KURALLARIM);
  await page
    .locator("article")
    .filter({ hasText: /kendi aracım/i })
    .first()
    .getByRole("button", { name: /Düzenle|İncele/ })
    .click();

  await expect(page.getByText(/Bu kuralla ne olur/i)).toBeVisible({ timeout: 10_000 });

  // Uyarı METİNLE duruyor — kırmızı marj tek başına yeterli değil.
  const uyari = page.getByRole("alert").filter({ hasText: /zararda/i });
  await expect(uyari).toBeVisible();
  // Ve NE YAPILACAĞINI söylüyor, "hata var" demiyor.
  await expect(uyari).toContainText(/taban ücreti|kademe fiyatını/i);
});

test("SATICI — S15: fiyatlandırma ekranlarında DEMO paneli GÖRÜNMÜYOR", async ({ page }) => {
  // 13-FE'de ölçülen kusurun aynısı: panel bir GELİŞTİRİCİ aracı. Satıcı
  // "Yetki hatası" senaryosunu seçip kendi ekranını kilitleyebiliyor ve
  // nedenini anlayamıyor. Üç ekranın üçünde de kapalı olmalı — biri
  // unutulursa kapı yine açık kalır, o yüzden üçü de tek tek geziliyor.
  for (const yol of [FIYATLARIM, KURALLARIM, HESAPLA]) {
    await page.goto(yol);
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(
      page.getByText(/Demo verisi ve hata senaryoları/i),
      `DEMO paneli satıcıya açık: ${yol}`
    ).toHaveCount(0);
    // Hata tetikleyicisi de sızmamalı — panel gizlense bile düğme kalırsa
    // satıcı yine kendi ekranını kilitleyebilir.
    await expect(page.getByRole("button", { name: /Yetki hatası/i })).toHaveCount(0);
  }
});

test("SATICI — S9: etiket akışında taşıyıcı seçimi VAR ve varsayılan İŞARETLİ", async ({ page }) => {
  await page.goto(`/panel/lojistik/etiketler/${SHP}`);
  await expect(page.getByRole("heading", { name: /Etiket/i }).first()).toBeVisible();

  // ŞARTLI ATLAMA YOK: teklifler ASENKRON geliyor ve `count()` beklemiyor —
  // "kural tanımlı değil" diye atlayan bir dal, aslında sadece yarışı
  // kaybediyordu ve K8 hiç doğrulanmıyordu (ölçüldü 2026-08-21).
  // SHP-2026-00042 tohum veride simüle edilebilir; teklif GELMEK ZORUNDA.
  const tablo = page.getByRole("table", { name: "Taşıyıcı seçenekleri" });
  await expect(tablo).toBeVisible({ timeout: 10_000 });

  // K4 kararı: sistem en uygunu ÖNCEDEN işaretler — kabul ediliyorsa ek tık
  // yok (CLAUDE.md §4.14). İşaretli radyo, "en uygun" rozetiyle aynı satırda.
  const onerilen = tablo.locator("tbody tr").filter({ hasText: /en uygun/i });
  await expect(onerilen).toHaveCount(1);
  await expect(onerilen.locator('[role="radio"][aria-checked="true"]')).toHaveCount(1);

  // Değiştirmek TEK TIK: başka bir kullanılabilir satıra tıklamak yeter.
  const digeri = tablo
    .locator("tbody tr")
    .filter({ has: page.locator('[role="radio"]') })
    .filter({ hasNotText: /en uygun/i })
    .first();
  // Tohum veride bu sevkiyat için en az iki KULLANILABİLİR hesap var; koşullu
  // dal bırakmıyoruz, yoksa seçim değiştirme hiç denenmemiş olur.
  await expect(digeri).toHaveCount(1);
  await digeri.click();
  await expect(digeri.locator('[role="radio"][aria-checked="true"]')).toHaveCount(1);
  await expect(onerilen.locator('[role="radio"][aria-checked="true"]')).toHaveCount(0);

  // Kendi anlaşması ile platformunki ayrışıyor — hangi hesaptan gittiği belli.
  await expect(tablo.getByText(/kendi anlaşmam/i).first()).toBeVisible();
});
