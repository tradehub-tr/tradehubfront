/**
 * Elle çalıştırılan denetim araçları — CI suite'inin DIŞINDA.
 *
 * `playwright.config.ts` yalnız `tests/e2e`'yi tarıyor; oradaki her spec CI'da
 * koşuyor. `tests/tools` altındakiler ise Storybook build'i ve ayrı bir HTTP
 * sunucusu istiyor, her PR'da koşturulamaz — ama elle koşulabilmeleri gerek.
 *
 * Kullanım (`GOREV-TAMAMLAMA-SOZLESMESI.md` §6.1):
 *   npx playwright test --config playwright.tools.config.ts
 */
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/tools",
  timeout: 600_000,
  expect: { timeout: 5_000 },
  reporter: [["list"]],
  // Bu araçlar kendi sunucularına bağlanıyor (Storybook statik çıktısı),
  // Vite dev server'a ihtiyaçları yok.
  use: { trace: "off" },
  projects: [{ name: "chromium-desktop", use: { ...devices["Desktop Chrome"] } }],
});
