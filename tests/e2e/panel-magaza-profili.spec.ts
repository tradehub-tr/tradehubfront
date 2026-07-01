/**
 * Mağaza Profilleri (Admin Seller Profile) panel — Faz 0/1/5 görsel doğrulama.
 *
 * ÇALIŞTIRMA (tradehubfront kökünden):
 *   PANEL_PASS='<administrator_parolasi>' npx playwright test tests/e2e/panel-magaza-profili.spec.ts --headed
 *
 * Gerekli: docker stack ayakta (tradehub.localhost erişilir), admin-panel build'li.
 * Kimlik: Frappe cookie-login (/api/method/login) ile sid çerezi context'e yazılır —
 * login UI'ına bağımlı değil.
 *
 * NOT: Performans sekmesindeki alan etiketleri (TR) sizin DocType label'larınıza
 * göre değişebilir; aşağıdaki metinleri panelde görünenle teyit edin.
 */
import { test, expect, request } from "@playwright/test";

const BASE = process.env.PANEL_BASE ?? "http://tradehub.localhost";
const USER = process.env.PANEL_USER ?? "Administrator";
const PASS = process.env.PANEL_PASS ?? "";

test.use({ baseURL: BASE });

// Gerçek backend + tek panel oturumuna karşı koşuyor; paralel worker'lar tab
// tıklamalarında yarış/zaman aşımı üretiyor. Seri koş (dosya içi tek worker).
test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ context }) => {
  if (!PASS) test.skip(true, "PANEL_PASS env değişkeni gerekli (admin parolası).");
  const api = await request.newContext({ baseURL: BASE });
  const res = await api.post("/api/method/login", { form: { usr: USER, pwd: PASS } });
  expect(res.ok(), "Frappe login başarısız — kullanıcı/parola?").toBeTruthy();
  const { cookies } = await api.storageState();
  await context.addCookies(cookies);
  // Rehberli tur (GuidedTour.vue) z-[9999] overlay'i (ve iç .absolute.inset-0 skip katmanı)
  // paralel koşularda tıklamayı yarışlı biçimde engelliyor. Overlay'i tamamen gizle —
  // display:none alt ağacı da hit-test dışına çıkarır. (Bu akışta z-[9999] modal açılmıyor.)
  await context.addInitScript(() => {
    // Panel dilini TR'ye sabitle (i18n key: th-lang) — branding "Mağaza Profilleri" TR'de.
    // Aksi hâlde fresh context navigator diline / en'e düşer ("Store Profiles").
    localStorage.setItem("th-lang", "tr");
    const s = document.createElement("style");
    s.textContent = ".fixed.inset-0.z-\\[9999\\]{display:none !important}";
    (document.head || document.documentElement).appendChild(s);
  });
});

/**
 * Panel açılışında otomatik başlayan rehberli tur (GuidedTour.vue) `z-[9999]`
 * overlay'iyle tıklamayı engelliyor. Escape ile kapatılıyor (tour store skip()).
 * Overlay yoksa sessizce geçer.
 */
async function dismissTour(page: import("@playwright/test").Page): Promise<void> {
  const overlay = page.locator("div.fixed.inset-0.z-\\[9999\\]");
  for (let i = 0; i < 4; i++) {
    if (!(await overlay.count())) return;
    await page.keyboard.press("Escape");
    await overlay.first().waitFor({ state: "detached", timeout: 1500 }).catch(() => {});
  }
}

/**
 * DocTypeFormView alanları: <div><label class="form-label">{{label}}</label><input/></div>.
 * Label input'a `for=` ile bağlı değil, o yüzden label metnini içeren field div'inin
 * kontrolünü döndürürüz. Değer v-model/`:value` ile property'ye yazılır → toHaveValue çalışır.
 */
function fieldControl(page: import("@playwright/test").Page, label: string) {
  return page
    .locator(`div:has(> label.form-label:has-text("${label}")) :is(input, textarea, select)`)
    .first();
}

test("Faz 0 — liste başlığı 'Mağaza Profilleri'", async ({ page }) => {
  await page.goto("/panel/app/Admin%20Seller%20Profile");
  await page.waitForLoadState("networkidle").catch(() => {});
  await dismissTour(page);
  // DocTypeListView h1 = doctypeLabel (i18n doctypeNames["Admin Seller Profile"] = "Mağaza Profilleri")
  await expect(page.getByRole("heading", { name: /Mağaza Profilleri/i })).toBeVisible({
    timeout: 15_000,
  });
  // Eski İngilizce başlık görünmemeli
  await expect(page.getByText("Admin Seller Profile")).toHaveCount(0);
});

test("Faz 1 — adres/vergi verisi dinamik dolu (SEL-00001)", async ({ page }) => {
  await page.goto("/panel/app/Admin%20Seller%20Profile/SEL-00001");
  // Vue SPA (DocTypeFormView): sekmeler role="tab" değil, dtf-tabs içinde düz <button>
  const tabs = page.locator('[data-tour="dtf-tabs"]');
  await tabs.waitFor();
  await dismissTour(page);
  // İletişim tab: şehir + adres dinamik dolu (city idx 34, address_line1 idx 32; tab_iletisim 27-38)
  await tabs.getByRole("button", { name: /İletişim/i }).click();
  await expect(fieldControl(page, "şehir")).toHaveValue("Adana"); // city
  await expect(fieldControl(page, "Adres")).toHaveValue(/Bursa/); // address_line1
  // NOT: Vergi Dairesi (tax_office) "Şirket Profili" tab'ında (idx 18), İletişim'de değil.
});

test("Faz 5 — Performans: total_orders/score_grade var, health_score yok", async ({ page }) => {
  await page.goto("/panel/app/Admin%20Seller%20Profile/SEL-00001");
  const tabs = page.locator('[data-tour="dtf-tabs"]');
  await tabs.waitFor();
  await dismissTour(page);
  await tabs.getByRole("button", { name: /Performans/i }).click();
  // total_orders gerçek değer (SEL-00001 = 5), read-only alan
  await expect(fieldControl(page, "Toplam Sipariş")).toHaveValue("5");
  // Gizlenen alanların (Property Setter hidden=1) etiketleri DOM'da olmamalı:
  await expect(page.getByText(/Sağlık Skoru|Health Score/i)).toHaveCount(0);
  await expect(page.getByText(/Zamanında Teslim|On Time Delivery/i)).toHaveCount(0);
});
