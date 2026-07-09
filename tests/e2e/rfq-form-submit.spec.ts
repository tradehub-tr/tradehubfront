/**
 * E2E — RFQ form gönderimi (/pages/dashboard/rfq-form.html).
 *
 * Backend lokalde yok — `page.route()` ile mock'lanır. Bu spec, capability-tabanlı
 * RFQ düzeltmesinin FRONTEND tarafını doğrular: alıcı (can_buy) session'ıyla form
 * doldurulup gönderilince create_rfq'ya POST atılır ve başarıda rfq-success'e
 * yönlenilir. (İzin mantığının kendisi backend fonksiyonel testiyle doğrulanır.)
 */
import { test, expect, type Route, type Page } from "@playwright/test";

function buyer() {
  return {
    email: "ali.bal@turksab.com",
    full_name: "Ali Giyim",
    first_name: "Ali",
    member_id: "TH-TEST",
    roles: ["All"],
    is_admin: false,
    is_seller: true,
    is_buyer: true,
    has_seller_profile: true,
    email_verified: true,
    pending_seller_application: false,
    rejected_seller_application: false,
    seller_profile: "SEL-TEST",
    account_type: "Business",
    can_buy: true,
    can_sell: true,
    kyc_status: "Verified",
    kyb_status: "Verified",
  };
}

async function mockBackend(page: Page): Promise<void> {
  await page.route("**/api/method/**", (route: Route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ message: { data: [] } }) })
  );
  await page.route("**/api/method/tradehub_core.api.v1.auth.get_session_user*", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: { logged_in: true, csrf_token: "test", user: buyer() } }),
    })
  );
  await page.route("**/api/method/tradehub_core.api.currency.get_currency_settings*", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        message: {
          currencies: [{ code: "TRY", symbol: "₺", name: "L", nameTr: "L", decimalPlaces: 2 }],
          rates: { TRY: { TRY: 1 } },
          defaultCurrency: "TRY",
          detectedCountry: "TR",
          baseCurrency: "TRY",
        },
      }),
    })
  );
  await page.route("**/api/method/tradehub_core.api.cart.get_cart*", (route: Route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ message: { suppliers: [], summary: {} } }) })
  );
}

test("alıcı formu doldurup gönderince create_rfq POST edilir ve başarıda yönlenir", async ({ page }) => {
  await mockBackend(page);

  let createCalled = false;
  let sentBody: Record<string, unknown> | null = null;
  await page.route("**/api/method/tradehub_core.api.rfq.create_rfq*", (route: Route) => {
    createCalled = true;
    sentBody = route.request().postDataJSON();
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: { success: true, rfq_id: "RFQ-TEST" } }),
    });
  });

  await page.goto("/pages/dashboard/rfq-form.html");
  await expect(page.locator("#rfq-product-name")).toBeVisible({ timeout: 15000 });

  // Form alanlarını doldur
  await page.fill("#rfq-product-name", "sanda");
  await page.fill("#rfq-requirements", "Deneme açıklama");
  await page.fill("#rfq-quantity", "1");
  // Kategori (normalde picker/API ile), birim (normalde kategori sonrası yüklenir)
  // ve onay kutusunu doğrudan set ediyoruz — amaç submit→POST akışını doğrulamak.
  await page.evaluate(() => {
    (document.getElementById("rfq-category") as HTMLInputElement).value = "cat-123";
    const unit = document.getElementById("rfq-unit") as HTMLSelectElement;
    unit.disabled = false;
    unit.innerHTML = '<option value="Adet">Adet</option>';
    unit.value = "Adet";
    (document.getElementById("rfq-agree-rules") as HTMLInputElement).checked = true;
  });

  await page.click("#rfq-detail-form button[type='submit']");

  await page.waitForURL("**/pages/dashboard/rfq-success.html", { timeout: 10000 });
  expect(createCalled).toBe(true);
  expect(sentBody).toMatchObject({ product_name: "sanda", quantity: 1, unit: "Adet", category: "cat-123" });
});
