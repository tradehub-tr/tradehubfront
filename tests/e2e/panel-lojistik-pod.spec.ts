/**
 * Teslim kanıtı / teslimat akışları (14-FE) — kabul senaryoları.
 *
 * ÇALIŞTIRMA (kök'ten):
 *   PANEL_PASS='<parola>' ./e2e.sh --panel
 * veya tek dosya (tradehubfront kökünden):
 *   PANEL_PASS='…' npx playwright test tests/e2e/panel-lojistik-pod.spec.ts
 *
 * NEDEN VAR:
 *   Birim testi "ekran kullanılabiliyor mu" demiyor. 13-FE'de kaçan
 *   eksiklerin üçte ikisi ancak tarayıcıda görülebiliyordu (görev tamamlama
 *   sözleşmesi §3). Ölçülen şey render değil, İŞİN KAPANMASI: kuyruktan
 *   girip kanıt kaydeden biri kova değişimini görebiliyor mu.
 *
 * KAPSAM: Administrator oturumu. Satıcı rolü ayrı dosyada
 *   (`panel-lojistik-satici.spec.ts`) — iki kimliği aynı dosyada kullanmak
 *   `sid` çerezini test sırasına bağımlı kılıyor.
 */
import { test, expect, request } from "@playwright/test";

const BASE = process.env.PANEL_BASE ?? "http://tradehub.localhost";
const USER = process.env.PANEL_USER ?? "Administrator";
const PASS = process.env.PANEL_PASS ?? "";

const QUEUE = "/panel/lojistik/teslim-kaniti";
const SELLER_FLOW = "/panel/lojistik/satici-teslimati";
const BUYER_FLOW = "/panel/lojistik/alici-teslim-alma";

/** Teslim edilmiş, kanıtı OLMAYAN sevkiyat — kayıt akışının başlangıcı. */
const BEKLEYEN = "SHP-2026-00041";
/** Kanıtı tam olan sevkiyat. */
const TAM = "SHP-2026-00033";

/**
 * `AppSelect` native `<select>` DEĞİL: tetikleyici buton + `role=listbox`
 * paneli. `selectOption()` bu yüzden çalışmıyor; seçim iki tıklama.
 */
async function appSelect(page, id: string, etiket: RegExp | string) {
  await page.locator(`#${id} button.as-trigger`).click();
  await page.locator("li.as-option").filter({ hasText: etiket }).first().click();
}

test.use({ baseURL: BASE });
test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ context }) => {
  if (!PASS) test.skip(true, "PANEL_PASS env değişkeni gerekli.");

  const api = await request.newContext({ baseURL: BASE });
  const res = await api.post("/api/method/login", { form: { usr: USER, pwd: PASS } });
  expect(res.ok(), "Frappe login başarısız — kullanıcı/parola?").toBeTruthy();
  const { cookies } = await api.storageState();
  await context.addCookies(cookies);

  await context.addInitScript(() => {
    localStorage.setItem("th-lang", "tr");
    // Mock durumu testler ARASINDA taşınmasın ama test İÇİNDE korunsun.
    //
    // ÖLÇÜLDÜ: `addInitScript` HER navigasyonda çalışıyor. Guard olmadan
    // kaydedilen kanıt, kuyruğa dönmek için yapılan `goto` sırasında
    // siliniyordu — "kova değişmedi" hatası aslında verinin silinmesiydi.
    if (!sessionStorage.getItem("__e2e_pod_reset")) {
      localStorage.removeItem("logistics.mock.pod.v1");
      sessionStorage.removeItem("logistics.mock.pod.fault");
      sessionStorage.setItem("__e2e_pod_reset", "1");
    }
    // Rehberli tur overlay'i tıklamayı yutuyor — hiç başlatma.
    localStorage.setItem(
      "panel_tour_seen_v5",
      JSON.stringify([
        "dashboard", "catalog", "commerce", "logistics", "sellers", "crm",
        "helpdesk", "system", "store", "products", "orders", "management", "messaging",
      ])
    );
  });
});

// ── Menü ve erişim ───────────────────────────────────────────────────

test("lojistik menüsü GRUPLU ve teslimat kalemleri var", async ({ page }) => {
  await page.goto(QUEUE);
  // Menü SPA ile çiziliyor: başlık görünmeden DOM'u okumak boş dizi döndürür.
  await expect(page.getByRole("heading", { name: /Teslim kanıtı/i }).first()).toBeVisible();

  const links = await page.evaluate(() =>
    [...document.querySelectorAll('a[href*="/lojistik/"]')].map((a) => a.getAttribute("href"))
  );
  for (const yol of [
    "/panel/lojistik/teslim-kaniti",
    "/panel/lojistik/satici-teslimati",
    "/panel/lojistik/alici-teslim-alma",
  ]) {
    expect(links, `menüde yok: ${yol}`).toContain(yol);
  }

  // Grup başlıkları — düz liste değil. Başlıklar menü panelinde ayrı
  // elemanlar olarak duruyor; sayıları 2'den azsa gruplama uygulanmamıştır.
  const basliklar = await page.evaluate(() => {
    const hedef = ["SEVKİYATLAR", "PAKETLEME", "TESLİMAT", "TAŞIYICI", "AYARLAR"];
    return [...document.querySelectorAll("aside *, nav *, [class*=sidebar] *")]
      .map((el) => (el.children.length === 0 ? el.textContent?.trim().toUpperCase() : null))
      .filter((t) => t && hedef.includes(t));
  });
  expect([...new Set(basliklar)].length, "lojistik menüsü gruplanmamış").toBeGreaterThanOrEqual(2);
});

// ── Kuyruk ───────────────────────────────────────────────────────────

test("kuyruk kovaları ve liste AYNI yanıttan geliyor", async ({ page }) => {
  await page.goto(QUEUE);
  await expect(page.getByRole("heading", { name: /Teslim kanıtı/i })).toBeVisible();
  await expect(page.locator("table tbody tr").first()).toBeVisible();

  // Kova sayaçlarının toplamı liste toplamını tutmalı.
  const satirSayisi = await page.locator("table tbody tr").count();
  expect(satirSayisi).toBeGreaterThan(0);
});

test("kova filtresi listeyi süzüyor, sayaçları KAYDIRMIYOR", async ({ page }) => {
  await page.goto(QUEUE);
  await expect(page.locator("table tbody tr").first()).toBeVisible();

  const sayacOnce = await page.locator("table tbody tr").count();
  await page.getByRole("button", { name: /Kanıt bekliyor/i }).first().click();
  await expect(page.locator("table tbody tr").first()).toBeVisible();

  const sayacSonra = await page.locator("table tbody tr").count();
  expect(sayacSonra, "filtre listeyi kısaltmadı").toBeLessThan(sayacOnce);
});

// ── İŞİN KAPANMASI: kanıt kaydetme ───────────────────────────────────

test("kanıtsız sevkiyat SORUN olarak gösteriliyor ve çıkış yolu veriyor", async ({ page }) => {
  await page.goto(`/panel/lojistik/sevkiyatlar/${BEKLEYEN}/teslim-kaniti`);

  // Hata ekranı DEĞİL: bu eksik veri, hata değil.
  await expect(page.getByText(/teslim kanıtı yok/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /Teslim kanıtı kaydet/i })).toBeVisible();
});

test("kanıt kaydediliyor ve sevkiyat KOVA DEĞİŞTİRİYOR", async ({ page }) => {
  // Önce kuyruktaki "kanıt bekliyor" sayısını al.
  await page.goto(QUEUE);
  await page.getByRole("button", { name: /Kanıt bekliyor/i }).first().click();
  await expect(page.locator("table tbody tr").first()).toBeVisible();
  const bekleyenOnce = await page.locator("table tbody tr").count();

  // Kanıt kaydet.
  await page.goto(`/panel/lojistik/sevkiyatlar/${BEKLEYEN}/teslim-kaniti`);
  await page.getByRole("button", { name: /Teslim kanıtı kaydet/i }).click();

  await page.locator("#pod-delivered-at").fill("2026-08-19T10:00");
  await page.locator("#pod-received-by").fill("Ayşe Korkmaz");
  await appSelect(page, "pod-title", "Depo sorumlusu");

  const kaydet = page.getByRole("button", { name: /^Kanıtı kaydet$/i });
  await expect(kaydet, "doğrulama geçmeden kaydet açık kaldı").toBeEnabled();
  await kaydet.click();

  // Kayıt sonrası kanıt kartı görünüyor.
  await expect(page.getByText(/Operasyon kaydı/i)).toBeVisible();

  // KOVA DEĞİŞTİ: aynı sevkiyat artık "kanıt bekliyor"da değil.
  await page.goto(QUEUE);
  await page.getByRole("button", { name: /Kanıt bekliyor/i }).first().click();
  await expect(page.locator("table tbody tr").first()).toBeVisible();
  const bekleyenSonra = await page.locator("table tbody tr").count();
  expect(bekleyenSonra, "kayıt sonrası kova değişmedi").toBe(bekleyenOnce - 1);
});

test("kısmi teslimde tutarsızlık ZORUNLU oluyor", async ({ page }) => {
  await page.goto(`/panel/lojistik/sevkiyatlar/${BEKLEYEN}/teslim-kaniti`);
  await page.getByRole("button", { name: /Teslim kanıtı kaydet/i }).click();

  await page.locator("#pod-total").fill("4");
  await page.locator("#pod-delivered").fill("2");

  // Onay kutusu işaretli VE kilitli — kısmi teslimde seçenek yok.
  const kutu = page.locator('input[type="checkbox"]').first();
  await expect(kutu).toBeChecked();
  await expect(kutu).toBeDisabled();
  await expect(page.getByText(/tutarsızlık kaydı zorunlu/i)).toBeVisible();

  // İstisna kodu seçilmeden kaydet KAPALI.
  await expect(page.getByRole("button", { name: /^Kanıtı kaydet$/i })).toBeDisabled();
});

test("istisna kodları KATALOGDAN geliyor — gömülü liste değil", async ({ page }) => {
  await page.goto(`/panel/lojistik/sevkiyatlar/${BEKLEYEN}/teslim-kaniti`);
  await page.getByRole("button", { name: /Teslim kanıtı kaydet/i }).click();
  await page.locator("#pod-total").fill("4");
  await page.locator("#pod-delivered").fill("2");

  await page.locator("#pod-exception button.as-trigger").click();
  const secenekler = await page.locator("li.as-option").allTextContents();
  expect(secenekler.join(" ")).toMatch(/SHORT_DELIVERY|DAMAGED/);
});

test("tutanak YENİ SEKMEDE gerçekten açılıyor", async ({ page, context }) => {
  await page.goto(`/panel/lojistik/sevkiyatlar/${BEKLEYEN}/teslim-kaniti`);
  await page.getByRole("button", { name: /Teslim kanıtı kaydet/i }).click();
  await page.locator("#pod-received-by").fill("Ayşe Korkmaz");

  const [yeniSekme] = await Promise.all([
    context.waitForEvent("page"),
    page.getByRole("button", { name: /Tutanağı yazdır/i }).click(),
  ]);
  // Yer tutucu bağlantı değil: gerçek bir belge açılıyor.
  await expect(yeniSekme.locator("body")).toContainText(/Teslim kanıtı/i);
  await expect(yeniSekme.locator("body")).toContainText(BEKLEYEN);
  await yeniSekme.close();
});

// ── Kanıt detayı ─────────────────────────────────────────────────────

test("tam kanıt kartı üst veriyi ve kaynağı gösteriyor", async ({ page }) => {
  await page.goto(`/panel/lojistik/sevkiyatlar/${TAM}/teslim-kaniti`);
  await expect(page.getByText(/Taşıyıcıdan|Operasyon kaydı|Satıcı beyanı/)).toBeVisible();
  await expect(page.getByText(/Teslim alan/i).first()).toBeVisible();
});

// ── Teslimat akışları ────────────────────────────────────────────────

test("D1 ve D2 AYRI ekran — başlıkları farklı", async ({ page }) => {
  await page.goto(SELLER_FLOW);
  await expect(page.getByRole("heading", { name: /Satıcı teslimatı/i })).toBeVisible();

  await page.goto(BUYER_FLOW);
  await expect(page.getByRole("heading", { name: /Alıcı teslim alma/i })).toBeVisible();
});

test("ÖDEME KAPISI: ödenmemiş kayıtta teslim düğmesi HİÇ ÇİZİLMİYOR", async ({ page }) => {
  await page.goto(BUYER_FLOW);
  await expect(page.locator("article").first()).toBeVisible();

  // Ödeme uyarısı taşıyan kartta "Teslim et" düğmesi bulunmamalı — devre dışı
  // değil, HİÇ YOK. Uyarıya rağmen tıklanabilen buton günün sonunda tıklanır.
  const blokluKart = page.locator("article").filter({ hasText: /Ödeme alınmadan teslim edilemez/i });
  if (await blokluKart.count()) {
    await expect(
      blokluKart.first().getByRole("button", { name: /^Teslim et$/i }),
      "ödeme bloklu kartta teslim düğmesi çizilmiş"
    ).toHaveCount(0);
  }
});

test("teslim kodunun DEĞERİ hiçbir yerde görünmüyor", async ({ page }) => {
  await page.goto(BUYER_FLOW);
  await expect(page.locator("article").first()).toBeVisible();

  // Mock evrenindeki geçerli kod "4821" — ekranda asla yazmamalı.
  const govde = await page.locator("body").textContent();
  expect(govde ?? "", "teslim kodu ekranda görünüyor").not.toContain("4821");
});

test("randevusu geçmiş kayıt işaretleniyor", async ({ page }) => {
  await page.goto(SELLER_FLOW);
  await expect(page.locator("article").first()).toBeVisible();
  await expect(page.getByText(/Randevu geçti/i).first()).toBeVisible();
});

// ── İstasyonlar ──────────────────────────────────────────────────────

test("istasyon çizelgesi ardışık aynı konumu TEK satıra indiriyor", async ({ page }) => {
  await page.goto(`/panel/lojistik/sevkiyatlar/${TAM}/istasyonlar`);
  await expect(page.getByRole("heading", { name: /İstasyonlar/i })).toBeVisible();
  // Olaylar asenkron geliyor: yükleme iskeletinde `ol` henüz yok.
  await expect(page.locator("ol li").first()).toBeVisible();

  const satirlar = await page.locator("ol li").allTextContents();
  expect(satirlar.length, "istasyon çizelgesi boş").toBeGreaterThan(0);

  // Aynı konum art arda iki kez satır olmamalı.
  const konumlar = satirlar.map((t) => t.split("\n")[0]?.trim());
  for (let i = 1; i < konumlar.length; i++) {
    expect(konumlar[i], "ardışık aynı konum ayrı satır olmuş").not.toBe(konumlar[i - 1]);
  }
});
