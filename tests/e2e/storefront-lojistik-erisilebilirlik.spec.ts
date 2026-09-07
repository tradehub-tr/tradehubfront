import axeCore from "axe-core";
import { expect, test, type Page } from "@playwright/test";

/**
 * Storefront lojistik ekranlarının gerçek Chromium'da WCAG taraması.
 *
 * NEDEN VAR: panel tarafında iki denetim vardı (`media-accessibility.spec.ts`
 * ve 7 Eyl'de eklenen `logistics/a11y.spec.ts`), storefront'ta HİÇ yoktu.
 * Oysa storefront alıcıya ait ve alıcı telefondan bakıyor — erişilebilirlik
 * borcunun en pahalı olduğu yer burası.
 *
 * İKİ VIEWPORT: config hem `chromium-desktop` hem `chromium-mobile` projesi
 * tanımlıyor, bu dosya ikisinde de koşuyor. Dokunma hedefi ve odak sırası
 * ihlalleri dar ekranda çıkıyor.
 *
 * KAPI YALNIZ `critical` VE `serious`: panel denetimleriyle aynı eşik.
 *
 * MUAFİYET YOK. Bir dönem `.th-btn-outline` metni marka turuncusuyla
 * (#db7300, 3.24:1) basıldığı için dar bir muafiyet taşıyordu; 8 Eyl 2026'da
 * token `primary-700`e (#ad5b00, 4.95:1) alınınca borç kapandı ve muafiyet
 * silindi. Yeni bir borç için muafiyet eklenecekse DAR (yalnız o düğüm) ve
 * BAYATLAMAYAN (borç kapanınca kırılan bir test ile) olmalı.
 *
 * NE DEĞİL: çeviri, içerik ya da tasarım denetimi değil. Yalnız makine
 * tarafından ölçülebilen WCAG ihlalleri — bunlar tartışmasız kusurdur.
 */

type AxeNode = { target?: unknown; failureSummary?: string; html?: string };
type AxeViolation = { id: string; impact?: string | null; help: string; nodes: AxeNode[] };

const SAYFALAR: { ad: string; yol: string }[] = [
  { ad: "sevkiyat takibi", yol: "/pages/dashboard/shipment-tracking.html?mock=1" },
  { ad: "iadelerim", yol: "/pages/dashboard/returns.html?mock=1" },
  {
    ad: "iade talebi",
    yol: "/pages/dashboard/return-request.html?mock=1&shipment=SHP-2026-00041",
  },
  { ad: "bildirim tercihleri", yol: "/pages/dashboard/notification-preferences.html?mock=1" },
];

async function oturumAc(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem("i18nextLng", "tr");
    // Çerez bandı mobilde alt düğmeleri yutuyor ve taramaya da girer.
    localStorage.setItem(
      "istoc_cookie_prefs",
      JSON.stringify({ necessary: true, analytics: false, marketing: false })
    );
  });
  await page.route("**/api/method/tradehub_core.api.v1.auth.get_session_user*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        message: {
          logged_in: true,
          user: {
            name: "alici@ornek.com",
            email: "alici@ornek.com",
            full_name: "Test Alıcı",
            is_seller: false,
            is_admin: false,
          },
        },
      }),
    })
  );
}

async function engelleyenIhlaller(page: Page): Promise<AxeViolation[]> {
  await page.addScriptTag({ content: axeCore.source });
  const ihlaller = await page.evaluate(async () => {
    const axe = (
      globalThis as typeof globalThis & {
        axe: {
          run: (
            root: Document,
            options: Record<string, unknown>
          ) => Promise<{ violations: AxeViolation[] }>;
        };
      }
    ).axe;
    const sonuc = await axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
      },
    });
    return sonuc.violations;
  });
  return ihlaller.filter((v) => v.impact === "critical" || v.impact === "serious");
}

function ayrinti(ihlaller: AxeViolation[]): string {
  return ihlaller
    .map(
      (v) =>
        `${v.impact} ${v.id}: ${v.help}\n${v.nodes
          .map((n) => `  ${JSON.stringify(n.target)} — ${n.failureSummary || n.html || ""}`)
          .join("\n")}`
    )
    .join("\n\n");
}

for (const { ad, yol } of SAYFALAR) {
  test(`${ad}: critical/serious axe bulgusu yok`, async ({ page }) => {
    await oturumAc(page);
    await page.goto(yol);
    await expect(page.locator("body")).toBeVisible();
    // Alpine hidrasyonu bitmeden tarama yanlış sonuç verir (x-cloak açılıyor).
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 15_000 });

    const ihlaller = await engelleyenIhlaller(page);
    expect(ihlaller.length, `${ad} (${yol}):\n${ayrinti(ihlaller)}`).toBe(0);
  });
}

