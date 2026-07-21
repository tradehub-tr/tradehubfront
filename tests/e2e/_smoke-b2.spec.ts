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

type PageDef = { name: string; path: string; xdata: string; gated: boolean; seedCart?: boolean };

// Boş sepette CartPage x-data="cartPage" render ETMEZ (empty-state). cartPage'i
// doğrulamak için misafir localStorage sepetine 1 ürün seed edilir.
const SEED_CART = {
  suppliers: [{ id: "S1", name: "Test", href: "#", selected: true, products: [{ id: "P1", title: "Test", href: "#", tags: [], moqLabel: "", favoriteIcon: "", deleteIcon: "", selected: true, skus: [{ id: "SKU1", skuImage: "", variantText: "", unitPrice: 10, currency: "₺", unit: "adet", quantity: 5, minQty: 1, maxQty: 100, selected: true, baseUnitPrice: 10, basePriceAddon: 0, baseCurrency: "TRY" }] }] }],
  shippingFee: 0, discount: 0, currency: "TRY",
};

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
  // cart — public (misafir sepeti); async render (skeleton → currency → fetch → cartPage)
  { name: "cart", path: "/pages/cart.html", xdata: "cartPage", gated: false, seedCart: true },
  // help — 3 public + 3 gated (ticket sayfaları)
  { name: "help-center", path: "/pages/help/help-center.html", xdata: "helpCenter", gated: false },
  { name: "faq", path: "/pages/help/faq.html", xdata: "faqPage", gated: false },
  { name: "faq-detail", path: "/pages/help/faq-detail.html", xdata: "faqDetail", gated: false },
  { name: "help-ticket-new", path: "/pages/help/help-ticket-new.html", xdata: "ticketForm", gated: true },
  { name: "help-tickets", path: "/pages/help/help-tickets.html", xdata: "ticketsList", gated: true },
  { name: "help-ticket", path: "/pages/help/help-ticket.html", xdata: "ticketDetail", gated: true },
  // product split — loginModal (listeleme, küçük) + imageGallery (product-detail, ağır)
  { name: "top-deals", path: "/pages/top-deals.html", xdata: "loginModal", gated: false },
  { name: "tailored-selections", path: "/pages/tailored-selections.html", xdata: "loginModal", gated: false },
  // product-detail veri gerektirir (?id=<listing>); LST-00082 dev DB'de mevcut
  { name: "product-detail", path: "/pages/product-detail.html?id=LST-00082", xdata: "imageGallery", gated: false },
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

    if (p.seedCart) {
      await page.addInitScript((c) => localStorage.setItem("tradehub_cart", JSON.stringify(c)), SEED_CART);
    }

    await page.goto(p.path, { waitUntil: "networkidle" });
    // Alpine start + requireAuth redirect + async render (cart) için bekleme
    await page.waitForTimeout(p.seedCart ? 3500 : 1200);

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
