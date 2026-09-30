/**
 * E2E (mock) — Alıcı panosu kullanıcı kartı sayaçları: Mesajlar · Teklifler · Kuponlar.
 *
 * Kusur (13 Nis – 30 Eyl 2026): "Mesajlar" sipariş sayısını gösteriyordu (tek siparişli
 * alıcıda "Mesajlar: 1"), "Teklifler" hiç dolmuyordu ve kimliksiz rfq-quotes.html'e
 * gidiyordu, "Kuponlar" siparişler sayfasına bağlıydı.
 *
 * Mock veride sipariş sayısı (5) bilerek okunmamış mesaj toplamından (3 + 1 = 4) farklı:
 * eski kod ekrana 5 yazar, doğrusu 4.
 */
import { test, expect, type Route, type Page } from "@playwright/test";

const json = (route: Route, message: unknown) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ message }),
  });

async function mockBackend(page: Page, sohbetDussun = false, dil = "tr"): Promise<void> {
  await page.addInitScript((d) => {
    localStorage.setItem("i18nextLng", d);
    localStorage.setItem("th-lang-source", "manual");
  }, dil);
  // Catch-all önce; spesifik route'lar sonra eklendiği için önceliklidir.
  await page.route("**/api/method/**", (route) => json(route, { data: [] }));
  // Boş sepet şekli şart: catch-all yanıtında `suppliers` yok, CartStore hata fırlatıp
  // sayfa açılışını startAlpine()'dan önce kesiyor (ölçüldü: "this.suppliers is not iterable").
  await page.route("**/api/method/tradehub_core.api.cart.get_cart*", (route) =>
    json(route, { suppliers: [], summary: {} })
  );
  await page.route("**/api/method/tradehub_core.api.v1.auth.get_session_user*", (route) =>
    json(route, {
      logged_in: true,
      user: {
        email: "alici@ornek.test",
        full_name: "Deneme Alıcı",
        first_name: "Deneme",
        last_name: "Alıcı",
        member_id: "M-1",
        roles: ["Buyer"],
        is_admin: false,
        is_seller: false,
        is_buyer: true,
        has_seller_profile: false,
        email_verified: true,
        pending_seller_application: false,
        seller_profile: null,
        can_buy: true,
      },
    })
  );
  await page.route("**/api/method/tradehub_core.api.order.get_order_counts*", (route) =>
    json(route, { success: true, counts: { all: 5 } })
  );
  await page.route("**/api/method/tradehub_core.api.chat.list_my_threads*", (route) =>
    sohbetDussun
      ? route.fulfill({ status: 502, body: "TeamsLike erişilemedi" })
      : json(route, [
          { id: 11, unread_count: 3, seller: { full_name: "Satıcı A" } },
          { id: 12, unread_count: 1, seller: { full_name: "Satıcı B" } },
          { id: 13, unread_count: 0, seller: { full_name: "Satıcı C" } },
        ])
  );
  await page.route("**/api/method/tradehub_core.api.v1.dashboard.get_buyer_analytics*", (route) =>
    json(route, {
      kpis: {
        total_spend: { amount: 0, currency: "TRY", change_pct: 0, trend: "neutral" },
        active_orders: { count: 0, shipping: 0, preparing: 0 },
        pending_quotes: { quote_count: 2, rfq_count: 1 },
        negotiation_savings: { amount: 0, avg_discount_pct: 0, currency: "TRY" },
      },
      spending_trend: { labels: [], spend: [], orders: [] },
      category_breakdown: [],
    })
  );
  await page.route("**/api/method/tradehub_core.api.cart.get_buyer_coupons*", (route) =>
    json(route, { available: 4 })
  );
}

const sayac = (page: Page, ad: string) => page.locator(`[x-text="${ad}"]`);

test("sayaçlar doğru kaynaktan dolar, bağlantılar doğru sayfaya gider", async ({ page }) => {
  await mockBackend(page);
  let analitikIstegi = 0;
  page.on("request", (r) => {
    if (r.url().includes("get_buyer_analytics")) analitikIstegi += 1;
  });
  await page.goto("/pages/dashboard/buyer-dashboard.html");

  await expect(sayac(page, "statsMessages")).toHaveText("4"); // 3 + 1 okunmamış, 5 sipariş DEĞİL
  await expect(sayac(page, "statsQuotations")).toHaveText("2");
  await expect(sayac(page, "statsCoupons")).toHaveText("4");

  // Mesajlar → mesajlar sayfası; Teklifler → talepler listesi; Kuponlar tıklanamaz.
  await expect(sayac(page, "statsMessages").locator("xpath=..")).toHaveAttribute(
    "href",
    "/pages/dashboard/messages.html"
  );
  await expect(sayac(page, "statsQuotations").locator("xpath=..")).toHaveAttribute(
    "href",
    "/pages/dashboard/inquiries.html"
  );
  await expect(sayac(page, "statsCoupons").locator("xpath=ancestor::a")).toHaveCount(0);

  // Kart ve analitik bölümü aynı ucu paylaşır — sayfa başına tek istek.
  await page.waitForLoadState("networkidle");
  expect(analitikIstegi).toBe(1);
});

test("sohbet servisi düşerse Mesajlar 0, diğer sayaçlar etkilenmez", async ({ page }) => {
  await mockBackend(page, true);
  await page.goto("/pages/dashboard/buyer-dashboard.html");
  await expect(sayac(page, "statsQuotations")).toHaveText("2");
  await expect(sayac(page, "statsCoupons")).toHaveText("4");
  await expect(sayac(page, "statsMessages")).toHaveText("0");
});

// KPI kartı başlıkları eskiden sabit Türkçeydi (data/buyerAnalytics.ts); İngilizce arayüzde
// "Toplam Harcama" + "vs. last month" yan yana çiziliyordu.
for (const [dil, beklenen] of [
  ["en", ["Total Spend", "Active Orders", "Pending Quotes", "Negotiation Savings"]],
  ["tr", ["Toplam Harcama", "Aktif Sipariş", "Bekleyen Teklif", "Pazarlık Tasarrufu"]],
] as const) {
  test(`KPI başlıkları arayüz dilini izler (${dil})`, async ({ page }) => {
    await mockBackend(page, false, dil);
    await page.goto("/pages/dashboard/buyer-dashboard.html");
    const basliklar = page.locator("#bd-kpi-grid > * p:first-child");
    await expect(basliklar).toHaveText([...beklenen]);
  });
}
