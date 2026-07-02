/**
 * Tedarikçi Profili (seller-dashboard) — self-servis mağaza profili E2E.
 *
 * ÇALIŞTIRMA (tradehubfront kökünden):
 *   SELLER_PASS='<parola>' npx playwright test tests/e2e/seller-dashboard-profil.spec.ts
 *
 * Gerekli: docker stack ayakta (tradehub.localhost), storefront dist güncel.
 * Kimlik: Frappe cookie-login (/api/method/login) — SELLER_USER satıcı hesabı.
 *
 * Kapsam (bu oturumun "Tedarikçi Profili" görevi):
 *  - Vergi No / Vergi Dairesi (Şirket Profili) + IBAN (İletişim) READ-ONLY.
 *  - Toplanmayan adres alanları (adres2/ilçe/posta) formda YOK.
 *  - get_my_profile allowlist alanları yükleniyor (seller_name/tax_id/iban dolu).
 */
import { test, expect, request } from "@playwright/test";

const BASE = process.env.PANEL_BASE ?? "http://tradehub.localhost";
const USER = process.env.SELLER_USER ?? "ali.bal@turksab.com";
const PASS = process.env.SELLER_PASS ?? "";

test.use({ baseURL: BASE });
test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ context }) => {
  if (!PASS) test.skip(true, "SELLER_PASS env değişkeni gerekli (satıcı parolası).");
  const api = await request.newContext({ baseURL: BASE });
  const res = await api.post("/api/method/login", { form: { usr: USER, pwd: PASS } });
  expect(res.ok(), "Frappe login başarısız — satıcı kullanıcı/parola?").toBeTruthy();
  const { cookies } = await api.storageState();
  await context.addCookies(cookies);
  // Fresh context navigator dili en'e düşer → tab label'ları İngilizce olur.
  // Storefront i18next dil anahtarı "i18nextLng" (src/i18n/index.ts) — TR'ye sabitle;
  // locator'lar TR label ("Hesabım", "Şirket Profili") bekliyor.
  await context.addInitScript(() => localStorage.setItem("i18nextLng", "tr"));
});

/** Dashboard #app render + satıcı görünümü hazır olana kadar bekle.
 *  Local docker gateway sayfayı /pages/... altında servis ediyor (prod'da clean
 *  URL nginx.conf.template ile map'lenir). "Hesabım" header hesap butonuyla da
 *  eşleştiği için, yalnız dashboard nav'ında olan "Şirket Profili" tab'ını bekle. */
async function gotoDashboard(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/pages/seller/dashboard.html");
  // init() → get_current_user → get_my_profile; satıcı doğrulanınca tab'lar görünür.
  await expect(page.getByRole("button", { name: "Şirket Profili" })).toBeVisible({
    timeout: 20_000,
  });
}

/** Tab nav butonuna tıkla (i18n label). Buton erişilebilir adında ikon+metin
 *  span'ları arası boşluk olduğu için exact:true kırılır — normalize substring. */
async function openTab(page: import("@playwright/test").Page, label: string): Promise<void> {
  await page.getByRole("button", { name: label }).first().click();
}

test("get_my_profile yükleniyor — Vergi No dolu (SEL-00001)", async ({ page }) => {
  await gotoDashboard(page);
  await openTab(page, "Şirket Profili");
  // Vergi No / TC No alanı get_my_profile'dan dolu gelmeli (SEL-00001 tax_id).
  const taxId = page.locator('input[x-model="form.company.tax_id"]');
  await expect(taxId).toHaveValue("10843944508");
});

test("Vergi No + Vergi Dairesi READ-ONLY (satıcı düzenleyemez)", async ({ page }) => {
  await gotoDashboard(page);
  await openTab(page, "Şirket Profili");
  await expect(page.locator('input[x-model="form.company.tax_id"]')).toHaveAttribute("readonly", "");
  await expect(page.locator('input[x-model="form.company.tax_office"]')).toHaveAttribute(
    "readonly",
    ""
  );
});

test("IBAN READ-ONLY + toplanmayan adres alanları YOK", async ({ page }) => {
  await gotoDashboard(page);
  await openTab(page, "İletişim");
  // IBAN read-only (KYB/finansal kanal)
  await expect(page.locator('input[x-model="form.contact.iban"]')).toHaveAttribute("readonly", "");
  // Kaldırılan alanlar: form state'te bile olmamalı (af65e86).
  await expect(page.locator('[x-model="form.contact.address_line2"]')).toHaveCount(0);
  await expect(page.locator('[x-model="form.contact.district"]')).toHaveCount(0);
  await expect(page.locator('[x-model="form.contact.postal_code"]')).toHaveCount(0);
  // Editable kalanlar: Adres (address_line1) + Şehir (city) düzenlenebilir.
  await expect(page.locator('input[x-model="form.contact.address_line1"]')).not.toHaveAttribute(
    "readonly",
    ""
  );
});

/**
 * Performans kartları: get_my_profile artık score_grade/total_orders/rating
 * döndürüyor → gerçek değer, "undefined" ASLA. health_score kartı ise
 * kaldırıldı (kaynağı güvenilmez; Admin panelde de hidden=1) — DOM'da olmamalı.
 */
test("Hesabım performans kartları gerçek değer gösterir, health_score kartı yok", async ({
  page,
}) => {
  await gotoDashboard(page);
  await openTab(page, "Hesabım");
  // Kaldırılan kart: "Sağlık Skoru" satırı DOM'da olmamalı.
  await expect(page.getByText("Sağlık Skoru")).toHaveCount(0);
  // Kalan kartlar gerçek değerle dolu (SEL-00001: score_grade=A, total_orders=5).
  const gradeRow = page.locator('div.flex:has(> span:text-is("Not")) span').last();
  await expect(gradeRow).toHaveText("A");
  const ordersRow = page.locator('div.flex:has(> span:text-is("Toplam Sipariş")) span').last();
  await expect(ordersRow).toHaveText("5");
  // Hiçbir kart "undefined" göstermemeli.
  await expect(page.getByText(/undefined/i)).toHaveCount(0);
});
