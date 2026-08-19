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
  await expect(page.locator("table tbody tr").first()).toBeVisible();
  const rows = await page.locator("table tbody tr").count();

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
