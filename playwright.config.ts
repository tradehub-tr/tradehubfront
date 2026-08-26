import { defineConfig, devices } from "@playwright/test";

const startViteServer = process.env.PERF_FIXTURE_TEST !== "1";

/**
 * Playwright config for tradehubfront filter E2E suite.
 * Lokal backend yok — testler `page.route()` ile API mock'lar.
 * Vite dev server otomatik başlatılır (webServer).
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    headless: true,
    viewport: { width: 1280, height: 800 },
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    /**
     * Mobil — 2026-08-26'da eklendi.
     *
     * Storefront alıcıya ait ve alıcılar telefondan bakıyor, ama suite'in
     * tamamı yalnız 1280×800'de koşuyordu. İlk denemede 19 test düştü;
     * hiçbiri gerçek bir uygulama hatası değildi — hepsi masaüstü viewport
     * varsayımıyla yazılmış testlerdi (mobilde farklı bileşen mount ediliyor,
     * filtre paneli çekmeceye giriyor, çerez bandı alt düğmeleri yutuyor).
     * On dokuzu da mobil yoluna uyarlandı, sonra bu proje kalıcı oldu.
     */
    { name: "chromium-mobile", use: { ...devices["Pixel 5"] } },
  ],
  webServer: startViteServer
    ? {
        command: "npm run dev",
        url: "http://localhost:5173",
        reuseExistingServer: true,
        timeout: 60_000,
      }
    : undefined,
});
