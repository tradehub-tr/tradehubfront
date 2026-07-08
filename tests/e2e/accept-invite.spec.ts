/**
 * E2E — Alıcı ekip daveti kabul sayfası (/pages/auth/accept-invite.html).
 *
 * Backend lokalde yok — `page.route()` ile mock'lanır. Sayfa guest-erişimli;
 * URL'deki ?token= alınıp `accept_buyer_invite(token, full_name, password)`
 * endpoint'ine POST edilir. Bu spec: (1) token yoksa hata adımı, (2) geçerli
 * token ile form doldur → başarı adımı + doğru payload gönderimi.
 */
import { test, expect, type Route, type Page } from "@playwright/test";

async function mockBackend(page: Page): Promise<void> {
  // Catch-all önce eklenir; spesifik route'lar sonra eklendiği için önceliklidir.
  await page.route("**/api/method/**", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ message: { data: [] } }),
    })
  );
  // Guest session + CSRF token (api() POST öncesi çekilir).
  await page.route(
    "**/api/method/tradehub_core.api.v1.auth.get_session_user*",
    (route: Route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message: { logged_in: false, user: "Guest", csrf_token: "test" },
        }),
      })
  );
}

test("token yoksa 'Davet geçersiz' hata adımı gösterilir", async ({ page }) => {
  await mockBackend(page);
  await page.goto("/pages/auth/accept-invite.html");
  await expect(page.getByText("Davet geçersiz")).toBeVisible();
});

test("geçerli token ile form doldurulup hesap oluşturulur", async ({ page }) => {
  await mockBackend(page);

  let acceptCalled = false;
  let sentBody: Record<string, unknown> | null = null;
  await page.route(
    "**/api/method/tradehub_core.api.v1.buyer_team.accept_buyer_invite*",
    (route: Route) => {
      acceptCalled = true;
      sentBody = route.request().postDataJSON();
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: { success: true } }),
      });
    }
  );

  await page.goto("/pages/auth/accept-invite.html?token=abc123");

  // Form görünür (token var → 'form' adımı)
  await expect(page.locator("#ai-full-name")).toBeVisible();

  await page.fill("#ai-full-name", "Ali Veli");
  await page.fill("#ai-new-password", "Test1234"); // min8 + upper + lower + number

  const submit = page.getByRole("button", { name: /Hesabı Oluştur/ });
  await expect(submit).toBeEnabled();
  await submit.click();

  // Başarı adımı
  await expect(page.getByText("Hesabınız oluşturuldu")).toBeVisible();

  expect(acceptCalled).toBe(true);
  expect(sentBody).toMatchObject({ token: "abc123", full_name: "Ali Veli" });
});
