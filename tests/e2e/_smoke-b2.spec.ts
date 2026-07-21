/**
 * B-2 SMOKE — page-specific Alpine modüllerinin gerçek docker stack'te register
 * olduğunu doğrular. Mock DEĞİL: tradehub.localhost + Frappe cookie-login gerekir.
 *
 * Çalıştırma:
 *   SMOKE_PASS='<parola>' npx playwright test tests/e2e/_smoke-b2.spec.ts --project=chromium-desktop
 * (SMOKE_USER default: ali.bal@turksab.com — satıcı). Parola verilmezse gated
 * sayfalar "atlandı" olarak işaretlenir, public 5 sayfa yine test edilir.
 *
 * Kontrol: her sayfada modülün x-data kökü Alpine tarafından hydrate edildi mi
 * (_x_dataStack) + "<name> is not defined" / "Alpine Expression Error" konsol
 * hatası YOK. Wiring bozuksa Alpine tam bu hatayı verir.
 */
import { test, expect, request } from "@playwright/test";

const BASE = process.env.SMOKE_BASE ?? "http://tradehub.localhost";
const USER = process.env.SMOKE_USER ?? "ali.bal@turksab.com";
const PASS = process.env.SMOKE_PASS ?? process.env.PANEL_PASS ?? process.env.SELLER_PASS ?? "";

test.use({ baseURL: BASE });

type PageDef = { name: string; path: string; xdata: string; gated: boolean };

const PAGES: PageDef[] = [
  { name: "kyb", path: "/pages/dashboard/kyb.html", xdata: "kybPage", gated: true },
  { name: "messages", path: "/pages/dashboard/messages.html", xdata: "messagesComponent", gated: true },
  { name: "orders", path: "/pages/dashboard/orders.html", xdata: "ordersListComponent", gated: true },
  { name: "payment", path: "/pages/dashboard/payment.html", xdata: "paymentManagement", gated: true },
  { name: "settings", path: "/pages/dashboard/settings.html", xdata: "settingsLayout", gated: true },
  { name: "addresses", path: "/pages/dashboard/addresses.html", xdata: "addressesManager", gated: true },
  { name: "buyer-dashboard", path: "/pages/dashboard/buyer-dashboard.html", xdata: "buyerUserInfo", gated: true },
  { name: "sell-pricing", path: "/pages/seller/sell-pricing.html", xdata: "sellPricing", gated: false },
  { name: "application-pending", path: "/pages/seller/application-pending.html", xdata: "applicationPendingPage", gated: true },
  { name: "seller-storefront", path: "/pages/seller/seller-storefront.html", xdata: "sellerStorefront", gated: false },
  { name: "seller-dashboard", path: "/pages/seller/dashboard.html", xdata: "sellerDashboard", gated: false },
  { name: "seller-shop", path: "/pages/seller/seller-shop.html", xdata: "sellerShop", gated: false },
  // auth — requireGuest (giriş YAPMAMIŞ kullanıcı); login'siz test edilmeli
  { name: "register", path: "/pages/auth/register.html", xdata: "registerPage", gated: false },
  { name: "forgot-password", path: "/pages/auth/forgot-password.html", xdata: "forgotPasswordPage", gated: false },
  { name: "reset-password", path: "/pages/auth/reset-password.html", xdata: "resetPasswordPage", gated: false },
  { name: "accept-invite", path: "/pages/auth/accept-invite.html", xdata: "acceptInvitePage", gated: false },
  // products-filter — public listeleme sayfaları (categories CategoryFilterSidebar
  // kullanır, bu modül değil → dahil değil)
  { name: "products", path: "/pages/products.html", xdata: "filterSidebar", gated: false },
  { name: "manufacturers", path: "/pages/manufacturers.html", xdata: "searchHeader", gated: false },
];

// Frappe cookie-login → tüm testlerde paylaşılan storageState
test.beforeEach(async ({ context }) => {
  if (!PASS) return;
  const api = await request.newContext({ baseURL: BASE });
  const res = await api.post("/api/method/login", { form: { usr: USER, pwd: PASS } });
  expect(res.ok(), "Frappe login başarısız — SMOKE_USER/SMOKE_PASS?").toBeTruthy();
  const { cookies } = await api.storageState();
  await context.addCookies(cookies);
});

for (const p of PAGES) {
  test(`smoke: ${p.name} (x-data="${p.xdata}")`, async ({ page }) => {
    if (p.gated && !PASS) {
      test.skip(true, "gated sayfa — SMOKE_PASS verilmedi");
      return;
    }

    // Yalnız BU modülün x-data ismini içeren hatalar (pre-existing sayfa buglarını
    // sayma — amaç kendi modülümüzün register olduğunu doğrulamak).
    const alpineErrors: string[] = [];
    const mine = new RegExp(`${p.xdata}\\b.*is not defined|is not defined.*${p.xdata}\\b|Alpine Expression Error.*${p.xdata}\\b`);
    const capture = (t: string) => { if (mine.test(t) || new RegExp(`\\b${p.xdata}\\b is not defined`).test(t)) alpineErrors.push(t); };
    page.on("console", (msg) => { if (msg.type() === "error") capture(msg.text()); });
    page.on("pageerror", (err) => capture(String(err)));

    await page.goto(p.path, { waitUntil: "networkidle" });
    // Alpine start + requireAuth redirect için kısa bekleme
    await page.waitForTimeout(1200);

    const finalUrl = page.url();
    // requireAuth login'e attıysa doğrulayamayız — açıkça bildir (/giris clean-URL veya .html)
    if (/pages\/auth\/login\.html|\/giris/.test(finalUrl)) {
      throw new Error(`${p.name}: login'e redirect oldu (oturum geçersiz?) — doğrulanamadı. URL=${finalUrl}`);
    }

    // 1) x-data kökü Alpine tarafından hydrate edildi mi?
    const hydrated = await page.evaluate((name) => {
      const els = Array.from(document.querySelectorAll(`[x-data*="${name}"]`));
      if (els.length === 0) return { found: false, hydrated: false };
      // Alpine v3 hydrate edilen elemana _x_dataStack ekler
      const anyHydrated = els.some((el) => "_x_dataStack" in el);
      return { found: true, hydrated: anyHydrated };
    }, p.xdata);

    expect(hydrated.found, `${p.name}: x-data="${p.xdata}" kökü DOM'da yok`).toBeTruthy();
    expect(hydrated.hydrated, `${p.name}: x-data="${p.xdata}" Alpine tarafından hydrate EDİLMEDİ (modül register olmadı?)`).toBeTruthy();

    // 2) Alpine "is not defined" hatası olmamalı
    expect(alpineErrors, `${p.name}: Alpine konsol hataları: ${alpineErrors.join(" | ")}`).toEqual([]);
  });
}
