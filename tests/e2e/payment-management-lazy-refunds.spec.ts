import { expect, test } from "@playwright/test";

const user = {
  email: "buyer@example.test",
  full_name: "Test Buyer",
  first_name: "Test",
  last_name: "Buyer",
  member_id: "BUY-1",
  roles: ["Buyer"],
  is_admin: false,
  is_seller: false,
  is_buyer: true,
  has_seller_profile: false,
  pending_seller_application: false,
  seller_profile: null,
};

test("ödeme yönetimi iade verisini yalnız İadeler sekmesi ilk açıldığında yükler", async ({ page }) => {
  let paymentRequests = 0;
  let refundRequests = 0;

  await page.route("**/api/method/**", async (route) => {
    const url = route.request().url();
    if (url.includes("get_session_user")) {
      await route.fulfill({ json: { message: { logged_in: true, user } } });
      return;
    }
    if (url.includes("get_recent_payments")) {
      paymentRequests += 1;
      await route.fulfill({ json: { message: { message: { success: true, payments: [], total: 0, page: 1, page_size: 10 } } } });
      return;
    }
    if (url.includes("get_recent_refunds")) {
      refundRequests += 1;
      await route.fulfill({ json: { message: { message: { success: true, refunds: [], total: 0, page: 1, page_size: 10 } } } });
      return;
    }
    await route.fulfill({ json: { message: {} } });
  });

  await page.goto("/pages/dashboard/payment.html");
  await page.waitForSelector('[x-data="paymentManagement"]');
  await expect.poll(() => paymentRequests).toBe(1);
  expect(refundRequests).toBe(0);
  await expect(page.locator("[data-payment-management-refunds-panel]")).toHaveCount(0);

  const refundsTab = page.locator('[data-payment-management-tab="refunds"]');
  await refundsTab.click();
  await expect.poll(() => refundRequests).toBe(1);
  await expect(page.locator("[data-payment-management-refunds-panel]")).toHaveCount(1);

  await page.locator('[data-payment-management-tab="payments"]').click();
  await refundsTab.click();
  expect(refundRequests).toBe(1);
});
