/**
 * İade akışı (15-FE) — kabul senaryoları, admin panel.
 *
 * ÇALIŞTIRMA (kök'ten):
 *   PANEL_PASS='<parola>' ./e2e.sh --panel
 * veya tek dosya (tradehubfront kökünden):
 *   PANEL_PASS='…' npx playwright test tests/e2e/panel-lojistik-iade.spec.ts
 *
 * NEDEN VAR:
 *   Dört ekran (I1–I4) 18 Ağustos'tan beri bileşen olarak YAZILIYDI ve
 *   Storybook'ta duruyordu, ama manifestte `ready: false` ile kapalıydı ve
 *   `views/logistics/returns/` dizini BOŞTU. Yani kod vardı, ekran yoktu —
 *   hiçbir birim testi bunu söylemiyordu. Ölçülen şey render değil, İŞİN
 *   KAPANMASI: kuyruktan girip karar veren biri kuyruğun değiştiğini
 *   görebiliyor mu, depo kontrolü tutarı türetiyor mu, kapanış kilitliyor mu.
 *
 * KAPSAM: Administrator oturumu. Satıcı rolü ayrı dosyada
 *   (`panel-lojistik-satici.spec.ts`) — iki kimliği aynı dosyada kullanmak
 *   `sid` çerezini test sırasına bağımlı kılıyor.
 *
 * Kabul senaryoları K7…K14 → `15-FE-iade-ekranlari-ANALIZ.md` §4.
 */
import { test, expect, request } from "@playwright/test";

const BASE = process.env.PANEL_BASE ?? "http://tradehub.localhost";
const USER = process.env.PANEL_USER ?? "Administrator";
const PASS = process.env.PANEL_PASS ?? "";

const KUYRUK = "/panel/lojistik/iadeler";

/** Karar bekleyen talep — satıcı/platform akışının başlangıcı. */
const KARAR_BEKLEYEN = "RET-2026-00006";
/** Karara bağlanmış, depo kontrolü bekleyen talep. */
const KONTROL_BEKLEYEN = "RET-2026-00007";
/** Kapanmış talep — hiçbir ekran düzenlemeye izin vermemeli. */
const KAPALI = "RET-2026-00003";

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
    // `addInitScript` HER navigasyonda çalışıyor (14-FE'de ölçüldü). Guard
    // olmadan verilen karar, kuyruğa dönmek için yapılan `goto` sırasında
    // siliniyor ve "kuyruk değişmedi" hatası aslında verinin silinmesi oluyor.
    if (!sessionStorage.getItem("__e2e_iade_reset")) {
      localStorage.removeItem("logistics.mock.returns.v1");
      sessionStorage.removeItem("logistics.mock.returns.fault");
      sessionStorage.setItem("__e2e_iade_reset", "1");
    }
    // Rehberli tur overlay'i tıklamayı yutuyor — hiç başlatma.
    localStorage.setItem(
      "panel_tour_seen_v5",
      JSON.stringify([
        "dashboard",
        "catalog",
        "commerce",
        "logistics",
        "sellers",
        "crm",
        "helpdesk",
        "system",
        "store",
        "products",
        "orders",
        "management",
        "messaging",
      ])
    );
  });
});

// ── K7 · kuyruğa menüden ulaşma ──────────────────────────────────────

test("K7 · iade kuyruğuna MENÜDEN ulaşılıyor", async ({ page }, testInfo) => {
  // MASAÜSTÜ ölçümü. Panel menüsü mobilde kapalı açılıyor ve
  // `a[href*="/lojistik/"]` yalnız aktif kalemi buluyor; aynı sınırlama
  // panel-lojistik-{pod,paketleme,fiyatlandirma} ve panel-magaza-profili
  // spec'lerinde de var (ölçüldü 31 Ağu: beş menü testi yalnız
  // `chromium-mobile`'da düşüyor, beşi de aynı sebeple). Mobil menüyü açan
  // ortak yardımcı KALAN-ISLER'e madde olarak düştü — dört kardeş spec'i
  // birden ilgilendiriyor, tek görevde çözülmez.
  test.skip(testInfo.project.name.includes("mobile"), "Panel menüsü mobilde kapalı — KALAN-ISLER");

  // I1 `ready:false` iken menüde hiç yoktu. `LOGISTICS_MENU_GROUPS`'a da
  // eklenmesi gerekti; eksik olsaydı ekran başlıksız gruba düşerdi (A5).
  await page.goto(KUYRUK);
  await expect(page.getByRole("heading", { name: /İade kuyruğu/i }).first()).toBeVisible();

  const links = await page.evaluate(() =>
    [...document.querySelectorAll('a[href*="/lojistik/"]')].map((a) => a.getAttribute("href"))
  );
  expect(links, "menüde iade kalemi yok").toContain("/panel/lojistik/iadeler");
});

test("K7 · karar bekleyen talep ayırt ediliyor", async ({ page }) => {
  await page.goto(KUYRUK);
  await expect(page.getByText(KARAR_BEKLEYEN)).toBeVisible();
  // Durum süzgeç hapları TÜM kapsamı sayıyor (sözleşme §2.2).
  await expect(page.getByText(/Talep edildi/).first()).toBeVisible();
});

// ── K8 · karar (I2) ──────────────────────────────────────────────────

test("K8 · gerekçesiz RED kaydedilemiyor", async ({ page }) => {
  await page.goto(`${KUYRUK}/${KARAR_BEKLEYEN}/karar`);
  await expect(page.getByRole("heading", { name: /İade kararı/i })).toBeVisible();

  await page.getByRole("button", { name: /^Reddet$/ }).click();
  // Not boşken uygula pasif olmalı — gerekçesiz red alıcıya "hayır" deyip
  // sebebini söylememek demek.
  await expect(page.getByRole("button", { name: /Kararı uygula/ })).toBeDisabled();
});

test("K8 · onay verilince kuyruk DEĞİŞİYOR", async ({ page }) => {
  await page.goto(`${KUYRUK}/${KARAR_BEKLEYEN}/karar`);
  await page.getByRole("button", { name: /^Onayla$/ }).click();
  await page.getByRole("button", { name: /Kararı uygula/ }).click();

  // Karar sonrası kuyruğa dönülüyor ve satır artık karar beklemiyor.
  await expect(page).toHaveURL(/\/lojistik\/iadeler$/);
  const satir = page.locator("li").filter({ hasText: KARAR_BEKLEYEN });
  await expect(satir.getByRole("button", { name: /Karara bağla/ })).toHaveCount(0);
});

test("K9 · onaylanan iadenin ters sevkiyatı AYNI ekranda bildiriliyor", async ({ page }) => {
  // Doğrulamak için başka ekrana gitmek gerekmiyor (kök CLAUDE.md §4.14c).
  await page.goto(`${KUYRUK}/${KONTROL_BEKLEYEN}/kontrol`);
  await expect(page.getByRole("heading", { name: /Depo kontrolü/i })).toBeVisible();
});

// ── K11 + K12 · depo kontrolü (I3) ───────────────────────────────────

test("K11 · kabul edilen ulaşandan fazlaysa kaydedilemiyor", async ({ page }) => {
  await page.goto(`${KUYRUK}/${KONTROL_BEKLEYEN}/kontrol`);

  const kart = page.locator("li").filter({ hasText: "Pamuklu" }).first();
  const ulasan = kart.locator('input[type="number"]').nth(0);
  const kabul = kart.locator('input[type="number"]').nth(1);

  await ulasan.fill("2");
  await kabul.fill("5");

  await expect(page.getByText(/fazla olamaz/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Kontrolü kaydet/ })).toBeDisabled();
});

test("K12 · iade tutarı kalem kararlarından TÜRÜYOR", async ({ page }) => {
  await page.goto(`${KUYRUK}/${KONTROL_BEKLEYEN}/kontrol`);

  const kart = page.locator("li").filter({ hasText: "Pamuklu" }).first();
  await kart.locator('input[type="number"]').nth(0).fill("6");
  await kart.locator('input[type="number"]').nth(1).fill("2");

  // 2 × 620 = 1.240 — operatör tutarı ELLE girmiyor, ekran türetiyor.
  await expect(page.getByText(/1[.,]240/)).toBeVisible();
});

// ── K13 · kapanış (I4) ───────────────────────────────────────────────

test("K13 · ön koşul eksikken kapatılamıyor ve EKSİĞİ söylüyor", async ({ page }) => {
  await page.goto(`${KUYRUK}/${KARAR_BEKLEYEN}/kapanis`);
  await expect(page.getByRole("heading", { name: /İade kapanışı/i })).toBeVisible();

  // Üç ön koşul ayrı satır; tek genel mesaj hangisinin eksik olduğunu
  // söylemezdi (sözleşme §2.7).
  await expect(page.getByText(/Karar verildi/)).toBeVisible();
  await expect(page.getByText(/Depo kontrolü tamamlandı/)).toBeVisible();
  await expect(page.getByText(/İade tutarı belirlendi/)).toBeVisible();
  await expect(page.getByRole("button", { name: /İadeyi kapat/ })).toBeDisabled();
});

// ── K14 · kapanmış kayıt değiştirilemez ──────────────────────────────

test("K14 · kapanmış talepte karar formu HİÇ çizilmiyor", async ({ page }) => {
  // Devre dışı bir form "aslında düzenlenebilir" izlenimi bırakıyor.
  await page.goto(`${KUYRUK}/${KAPALI}/karar`);
  await expect(page.getByText(/kapatıldı; karar değiştirilemez/)).toBeVisible();
  await expect(page.getByRole("button", { name: /^Onayla$/ })).toHaveCount(0);
});

test("K14 · kapanmış talepte kontrol ekranı da kilitli", async ({ page }) => {
  await page.goto(`${KUYRUK}/${KAPALI}/kontrol`);
  await expect(page.getByRole("button", { name: /Kontrolü kaydet/ })).toHaveCount(0);
});

// ── K15 · ölü buton yok ──────────────────────────────────────────────

test("K15 · kuyrukta karara bağlanmış talep için düğme çizilmiyor", async ({ page }) => {
  await page.goto(KUYRUK);
  const kapali = page.locator("li").filter({ hasText: KAPALI });
  await expect(kapali.getByRole("button", { name: /Karara bağla/ })).toHaveCount(0);
});
