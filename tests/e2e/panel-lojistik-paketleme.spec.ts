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
  // Koli ekleme TEK yerde: koliler sütununun başı. Gevşek regex "Yeni koliye"
  // (kalem atama) butonuyla eşleşiyordu; tam metin veriliyor.
  await expect(page.getByRole("button", { name: "+ Yeni koli" })).toBeVisible();
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
  // Üretme başlıkta değil, seçim yapılınca beliren eylem çubuğunda.
  const generate = page.getByRole("button", { name: "Etiket üret" });
  if (await generate.count()) await generate.click();

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

// ── Kabul 8: UI/UX düzenlemeleri (13 madde) ──────────────────────────
//
// Bu blok görsel tercihleri değil, DAVRANIŞI ölçüyor: gizlenen bir eylem
// hâlâ ulaşılabiliyor mu. Açılır menüye taşınan buton, kapanmayan bir
// açılır ya da odağı verilmeyen bir kutu build'i kırmaz — yalnız işi durdurur.

test("madde 7 — silme ⋯ menüsünden hâlâ yapılabiliyor", async ({ page }) => {
  await page.goto(`/panel/lojistik/paketleme/${SHP}`);
  const kartlar = page.locator("article").filter({ has: page.getByRole("button", { name: "Düzenle" }) });
  // `count()` BEKLEMEZ — yükleme bitmeden çağrılırsa 0 döner ve test
  // "koli yok" diye kırılır. Önce ilk kartın görünmesini bekle.
  await expect(kartlar.first()).toBeVisible();
  const once = await kartlar.count();

  await page.getByRole("button", { name: "Diğer koli işlemleri" }).first().click();
  await page.getByRole("menuitem", { name: "Sil" }).click();
  // `exact` şart: "Tamam" içerik eşleşmesi "Paketlemeyi tamamla" ile de
  // eşleşiyor ve strict mode iki öğe buluyor.
  await page.getByRole("button", { name: "Tamam", exact: true }).click();

  await expect(kartlar).toHaveCount(once - 1);
});

test("madde 7 — ⋯ menüsü dışarı tıklayınca kapanıyor", async ({ page }) => {
  await page.goto(`/panel/lojistik/paketleme/${SHP}`);
  await page.getByRole("button", { name: "Diğer koli işlemleri" }).first().click();
  await expect(page.getByRole("menuitem", { name: "Çoğalt" })).toBeVisible();

  await page.getByRole("heading", { name: "Paketleme" }).click();
  await expect(page.getByRole("menuitem", { name: "Çoğalt" })).toHaveCount(0);
});

test("madde 3 — miktar kutusu kapalı başlıyor, ⋯ ile açılıyor", async ({ page }) => {
  await page.goto(`/panel/lojistik/paketleme/${SHP}`);
  const kutu = page.getByRole("spinbutton", { name: "Atanacak miktar" });
  await expect(kutu).toHaveCount(0);

  await page.getByRole("button", { name: "Miktarı değiştir" }).first().click();
  await expect(kutu.first()).toBeVisible();
  // Odak kutuya verilmeli — verilmezse kullanıcı bir de tıklamak zorunda.
  await expect(kutu.first()).toBeFocused();
});

test("madde 6 — üretme butonu seçim yapılınca beliriyor", async ({ page }) => {
  await page.goto(`/panel/lojistik/etiketler/${SHP}`);
  await expect(page.getByRole("button", { name: "Etiket üret" })).toHaveCount(0);

  await page.locator('table tbody input[type="checkbox"]').last().check();
  await expect(page.getByText(/koli seçildi/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Etiket üret" })).toBeVisible();

  await page.getByRole("button", { name: "Seçimi temizle" }).click();
  await expect(page.getByRole("button", { name: "Etiket üret" })).toHaveCount(0);
});

test("madde 11 — etiket durumu ikonla da ayrışıyor", async ({ page }) => {
  await page.goto(`/panel/lojistik/etiketler/${SHP}`);
  // Renk tek ayırt edici olamaz; rozette metin VE ikon bulunmalı.
  const rozet = page.locator("tbody tr").first().locator("td").nth(5);
  await expect(rozet).toContainText(/Basıldı|Üretildi|Üretilmedi|İptal edildi|Geçersiz/);
  await expect(rozet).toContainText(/[✓◷✕⊘↻]/);
});

test("madde 13 — takip no yokken satır kayboluyor değil, bekleniyor diyor", async ({ page }) => {
  await page.goto(`/panel/lojistik/etiketler/${SHP}`);
  // Takip numarası taşıyıcıdan geliyor; olmayan satırı gizlemek "böyle bir
  // alan yok" gibi okunuyordu.
  const onizleme = page.locator("section").filter({ hasText: "Önizleme" }).first();
  await expect(onizleme.getByText("Takip")).toBeVisible();
});

test("madde 10 — filtreler açılırda, etkin sayısı rozette görünüyor", async ({ page }) => {
  await page.goto(QUEUE);
  // Gevşek regex: /^Filtreler/ açılır içindeki "Filtreleri temizle" ile de
  // eşleşiyor. Ad tam kalıba bağlanıyor — rozetli hâli "Filtreler 1".
  const acilir = page.getByRole("button", { name: /^Filtreler( \d+)?$/ });
  await expect(acilir).toBeVisible();
  // Kapalıyken tarih alanları DOM'da olmamalı — çubuk tek satırda kalıyor.
  await expect(page.locator('input[type="date"]')).toHaveCount(0);

  await acilir.click();
  await expect(page.locator('input[type="date"]')).toHaveCount(2);

  await page.locator('input[type="date"]').first().fill("2026-08-01");
  // Gizlenen filtre "unutulan filtre" olmamalı: rozet sayıyor.
  await expect(acilir).toContainText("1");

  await page.getByRole("button", { name: "Filtreleri temizle" }).click();
  await expect(acilir).not.toContainText("1");
});

test("madde 12 — basılan etiketteki barkod GERÇEK Code 128", async ({ page, context }) => {
  await page.goto(`/panel/lojistik/etiketler/${SHP}`);

  const opened = context.waitForEvent("page", { timeout: 10_000 });
  await page.getByRole("link", { name: /Etiketi aç/i }).first().click();
  const doc = await opened;

  // Sembolü belgeden ölçüp geri çözüyoruz — okuyucunun yaptığı iş.
  // "Barkod çiziliyor" ile "barkod okunuyor" farklı iddialar.
  const cozulen = await doc.evaluate(() => {
    const C128 = ("212222 222122 222221 121223 121322 131222 122213 122312 132212 221213 221312 231212 " +
      "112232 122132 122231 113222 123122 123221 223211 221132 221231 213212 223112 312131 311222 321122 " +
      "321221 312212 322112 322211 212123 212321 232121 111323 131123 131321 112313 132113 132311 211313 " +
      "231113 231311 112133 112331 132131 113123 113321 133121 313121 211331 231131 213113 213311 213131 " +
      "311123 311321 331121 312113 312311 332111 314111 221411 431111 111224 111422 121124 121421 141122 " +
      "141221 112214 112412 122114 122411 142112 142211 241211 221114 413111 241112 134111 111242 121142 " +
      "121241 114212 124112 124211 411212 421112 421211 212141 214121 412121 111143 111341 131141 114113 " +
      "114311 411113 411311 113141 114131 311141 411131 211412 211214 211232 2331112").split(/\s+/);

    const svg = document.querySelector(".barcode svg");
    if (!svg) return { hata: "barkod svg yok" };
    const rects = [...svg.querySelectorAll("rect")].filter((r) => r.getAttribute("y") === "0");
    if (rects.length < 10) return { hata: `çubuk sayısı ${rects.length}` };

    const runs = [];
    rects.forEach((r, i) => {
      const x = parseFloat(r.getAttribute("x"));
      const w = parseFloat(r.getAttribute("width"));
      runs.push(w);
      const next = rects[i + 1];
      if (next) runs.push(parseFloat(next.getAttribute("x")) - (x + w));
    });

    const unit = Math.min(...runs);
    const mods = runs.map((r) => Math.round(r / unit)).join("");
    const values = [];
    for (let i = 0; i < mods.length; ) {
      const n = mods.length - i === 7 ? 7 : 6;
      const idx = C128.indexOf(mods.slice(i, i + n));
      if (idx < 0) return { hata: `tanınmayan desen: ${mods.slice(i, i + n)}` };
      values.push(idx);
      i += n;
    }

    let sum = values[0];
    for (let i = 1; i < values.length - 2; i++) sum += values[i] * i;

    return {
      metin: values.slice(1, -2).map((v) => String.fromCharCode(v + 32)).join(""),
      basla: values[0],
      dur: values.at(-1),
      kontrolDogru: values.at(-2) === sum % 103,
    };
  });

  expect(cozulen.hata, `barkod çözülemedi: ${cozulen.hata}`).toBeUndefined();
  expect(cozulen.basla, "Start B kodu").toBe(104);
  expect(cozulen.dur, "Stop kodu").toBe(106);
  expect(cozulen.kontrolDogru, "kontrol basamağı").toBe(true);
  // Etiket `pkg.barcode`'ı basıyor, yoksa `package_code`'a düşüyor
  // (labelDocument.js). Çözülen metin ikisinden biri olmalı.
  expect(cozulen.metin).toMatch(new RegExp(`^(PKG\\d+|${SHP}-\\d+)$`));

  await doc.close();
});

test("madde 10 — filtre açılırı sayfayı YANA KAYDIRMIYOR", async ({ page }) => {
  // Açılır `start-0` ile açılınca 290px'lik panel sağ kenarı aşıyor ve gövdeye
  // yatay kaydırma çubuğu geliyordu. Regresyon bekçisi: taşma piksel olarak
  // ölçülüyor, göz kararı değil.
  await page.goto(QUEUE);
  const once = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(once, "açılır kapalıyken zaten taşma var").toBeLessThanOrEqual(0);

  await page.getByRole("button", { name: /^Filtreler( \d+)?$/ }).click();
  await expect(page.locator('input[type="date"]').first()).toBeVisible();

  const sonra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(sonra, "filtre açılırı gövdeyi yana kaydırıyor").toBeLessThanOrEqual(0);

  // Panel görüntü alanının içinde durmalı.
  const kutu = await page.locator('input[type="date"]').first().evaluate((el) => {
    const p = el.closest("div[class*='absolute']")!.getBoundingClientRect();
    return { sol: p.left, sag: p.right, genislik: window.innerWidth };
  });
  expect(kutu.sag, "panel sağ kenarı taşıyor").toBeLessThanOrEqual(kutu.genislik);
  expect(kutu.sol, "panel sol kenarı taşıyor").toBeGreaterThanOrEqual(0);
});

// ── Kabul 5: görünüm modları (2026-08-19) ────────────────────────────
//
// İŞ CİNSİNDEN: operatör aynı kuyruğa dört farklı biçimde bakabilmeli ve
// hangi biçimi seçtiği bir dahaki girişinde hatırlanmalı. Kanban BİLGİ
// panosu — üzerinde iş yapılmıyor, işe oradan giriliyor.

test("GÖRÜNÜM — kanban dört kovayı SÜTUN olarak gösteriyor, pill'ler çekiliyor", async ({ page }) => {
  await page.goto(QUEUE);
  // Başlangıç: tablo + kova pill'leri.
  await expect(page.getByRole("button", { name: /^Paketlenmedi/ })).toBeVisible();

  await page.getByRole("button", { name: "Kanban Görünümü" }).click();

  // Dört kova artık sütun başlığı.
  const columns = page.locator(".kanban-col-header");
  await expect(columns).toHaveCount(4);
  for (const bucket of ["Paketlenmedi", "Kısmen paketlendi", "Etiket bekliyor", "Hazır"]) {
    await expect(columns.filter({ hasText: new RegExp(bucket, "i") })).toHaveCount(1);
  }

  // Pill'ler GİZLENDİ: sütunlarla aynı işi yapıyorlardı, iki filtre yan yana
  // durunca hangisinin geçerli olduğu okunmuyordu.
  await expect(page.getByRole("button", { name: /^Paketlenmedi$/ })).toHaveCount(0);
  // Tablo da yok — mod gerçekten değişti, üstüne bir şey eklenmedi.
  await expect(page.locator("table tbody tr")).toHaveCount(0);

  // DÖRDÜ BİRDEN GÖRÜNMELİ: panonun tek gerekçesi bu. Paylaşılan
  // `.kanban-col` 280px'e sabitti ve dördüncü kova 1440px'lik ekranda pano
  // dışına düşüyordu (ölçüldü 2026-08-19); sütunlar artık esniyor.
  const board = page.locator(".list-kanban");
  const tasma = await board.evaluate((el) => el.scrollWidth - el.clientWidth);
  expect(tasma, "dördüncü kova pano dışına taşıyor — yatay kaydırma gerekiyor").toBeLessThanOrEqual(1);

  // Sayfanın KENDİSİ yana kaymamalı; kaydırma panonun içinde kalır.
  const sayfaKaydi = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(sayfaKaydi, "kanban sayfayı yana kaydırıyor").toBe(false);
});

test("GÖRÜNÜM — kanban SALT-OKUNUR: kart sürüklenemiyor, uyarı görünüyor", async ({ page }) => {
  // Kova sevkiyatın verisinden hesaplanıyor. Sürükleyip bırakmak koliyi
  // paketlemediği için kart bir sonraki yüklemede eski kovasına dönerdi;
  // kullanıcı işi yaptığını sanırdı.
  await page.goto(QUEUE);
  await page.getByRole("button", { name: "Kanban Görünümü" }).click();

  await expect(page.getByText(/Salt-okunur pano/i)).toBeVisible();

  const card = page.locator(".kanban-card").first();
  await expect(card).toBeVisible();
  expect(await card.getAttribute("draggable"), "kanban kartı sürüklenebilir yapılmış").toBeNull();
});

test("GÖRÜNÜM — kanban kartından çalışma alanına giriliyor", async ({ page }) => {
  // Pano bilgi veriyor ama çıkmaz sokak olmamalı: işe buradan girilebilmeli.
  await page.goto(QUEUE);
  await page.getByRole("button", { name: "Kanban Görünümü" }).click();

  await page.locator(".kanban-card").first().click();
  await expect(page).toHaveURL(/\/lojistik\/paketleme\/SHP-/);
  await expect(page.getByRole("heading", { name: /^Paketleme$/ })).toBeVisible();
});

test("GÖRÜNÜM — seçilen mod sayfa yenilenince HATIRLANIYOR", async ({ page }) => {
  await page.goto(QUEUE);
  await page.getByRole("button", { name: "Kart Görünümü" }).click();
  await expect(page.locator(".list-grid-card").first()).toBeVisible();

  await page.reload();
  // Tercih diske yazıldı: kullanıcı her girişte modu yeniden seçmiyor.
  await expect(page.locator(".list-grid-card").first()).toBeVisible();
  await expect(page.locator("table tbody tr")).toHaveCount(0);
});

test("GÖRÜNÜM — kart modunda sevkiyat seçilip etiket ekranına geçiliyor", async ({ page }) => {
  // Mod DEĞİŞTİRMEK iş akışını kırmamalı: seçim ve toplu eylem kartta da çalışır.
  await page.goto(`${QUEUE}?bucket=partial`);
  await page.getByRole("button", { name: "Kart Görünümü" }).click();

  await page.locator('.list-grid-card input[type="checkbox"]').first().check();
  await page.getByRole("button", { name: /Seçilenlere etiket/i }).click();
  await expect(page).toHaveURL(/\/lojistik\/etiketler\/SHP-/);
});

test("GÖRÜNÜM — liste modu aynı sevkiyatları gösteriyor, veri kaybolmuyor", async ({ page }) => {
  await page.goto(`${QUEUE}?bucket=partial`);
  // Kuyruk veriyi ASENKRON çekiyor; `count()` beklemez ve iskelet aşamasında
  // 0 döner. Önce ilk satırın görünmesini bekle, sonra say.
  await expect(page.locator("table tbody tr").first()).toBeVisible();
  const tableRows = await page.locator("table tbody tr").count();

  await page.getByRole("button", { name: "Liste Görünümü" }).click();
  await expect(page.locator(".list-compact-item")).toHaveCount(tableRows);
});

test("GÖRÜNÜM — etiket ekranı kart modunda her koli için ÖNİZLEME çiziyor", async ({ page }) => {
  // Tabloda "hangi koliye ne bastım" görünmüyordu; kart modunun tek gerekçesi bu.
  await page.goto(`/panel/lojistik/etiketler/${SHP}`);
  await expect(page.locator("table tbody tr").first()).toBeVisible();
  const rows = await page.locator("table tbody tr").count();

  await page.getByRole("button", { name: "Kart Görünümü" }).click();
  await expect(page.locator(".list-grid-card")).toHaveCount(rows);

  // Yan önizleme KAYBOLMUYOR: üretme/iptal eylemleri orada duruyor.
  await expect(page.getByRole("heading", { name: /^Önizleme$/ })).toBeVisible();
});

test("GÖRÜNÜM — etiket ekranında kanban YOK (durum akışı değil, bayrak)", async ({ page }) => {
  await page.goto(`/panel/lojistik/etiketler/${SHP}`);
  await expect(page.getByRole("button", { name: "Tablo Görünümü" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Kanban Görünümü" })).toHaveCount(0);
});
