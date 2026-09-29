/**
 * XSS temizleme (`src/utils/sanitize.ts`) — GERÇEK tarayıcıda (MOGEM-685 F-01).
 *
 * NEDEN BİRİM TESTİ DEĞİL: vitest'in `happy-dom` ortamında DOMPurify güvenilmez
 * çalışıyor — ölçüldü (28 Eyl 2026): `isSupported: true` diyor ama
 * `<p>a</p><script>…` girdisinden `<script>`'i BIRAKIYOR, `<svg><g onload>`'da olay
 * niteliğini bırakıyor, zararsız `<h2>`'yi siliyor. Oradaki bir test ya sahte
 * kırmızı ya sahte yeşil verir. Burada Vite geliştirme sunucusu `sanitize.ts`'i
 * olduğu gibi Chromium'a yüklüyor: gerçek ayrıştırıcı + projenin gerçek ayarı.
 *
 * NEDEN VAR: storefront'un tek çalışma-zamanı XSS savunması DOMPurify ve F-01'de
 * sürümü değişti (3.4.8 → 3.4.16). Davranışın değişmediğini sabitler; aynı spec
 * iki sürümle de koşuldu.
 */
import { test, expect, type Page } from "@playwright/test";

type Sonuc = Record<string, { zengin: string; kisa: string }>;

const SALDIRILAR = {
  script: "<p>a</p><script>alert(1)</script>",
  onerror: '<img src="x" onerror="alert(1)">',
  javascriptHref: '<a href="javascript:alert(1)">t</a>',
  svgOnload: '<svg><g onload="alert(1)"></g></svg>',
  iframe: '<iframe src="https://kotu.example"></iframe>',
  styleNitelik: '<p style="position:fixed;inset:0">x</p>',
  styleEtiket: "<style>body{display:none}</style><p>x</p>",
};
const YASAK: Record<keyof typeof SALDIRILAR, RegExp> = {
  script: /<script/i,
  onerror: /onerror/i,
  javascriptHref: /javascript:/i,
  svgOnload: /onload/i,
  iframe: /<iframe/i,
  styleNitelik: /style=/i,
  styleEtiket: /<style/i,
};
const MESRU =
  "<h2>Özellikler</h2><table><tr><td>Ağırlık</td></tr></table>" +
  '<img src="/files/a.jpg" alt="ürün"><ul><li>madde</li></ul><b>kalın</b><a href="https://istoc.com">x</a>';

async function temizle(page: Page): Promise<Sonuc> {
  // Hafif, aynı kökenli bir sayfa: modül yalnız köken ister, uygulama boot'u değil.
  await page.goto("/robots.txt");
  return page.evaluate(
    async ([girdiler]) => {
      // Yol tarayıcıda Vite'a gider; tsc'nin modül çözümüne girmesin diye değişkenle.
      const yol = "/src/utils/sanitize.ts";
      const m = (await import(/* @vite-ignore */ yol)) as {
        sanitizeRichHtml: (x: string) => string;
        sanitizeHtml: (x: string) => string;
      };
      const out: Record<string, { zengin: string; kisa: string }> = {};
      for (const [ad, html] of Object.entries(girdiler)) {
        out[ad] = { zengin: m.sanitizeRichHtml(html), kisa: m.sanitizeHtml(html) };
      }
      return out;
    },
    [{ ...SALDIRILAR, mesru: MESRU }] as const
  );
}

test.describe("sanitize.ts — gerçek Chromium", () => {
  test.skip(
    ({ viewport }) => (viewport?.width ?? 0) < 1024,
    "tarayıcı motoru aynı; tek profil yeter"
  );

  test("saldırı kalıpları iki temizleyicide de etkisizleşir", async ({ page }) => {
    const s = await temizle(page);
    for (const ad of Object.keys(SALDIRILAR) as Array<keyof typeof SALDIRILAR>) {
      expect.soft(s[ad].zengin, `sanitizeRichHtml · ${ad}`).not.toMatch(YASAK[ad]);
      expect.soft(s[ad].kisa, `sanitizeHtml · ${ad}`).not.toMatch(YASAK[ad]);
    }
  });

  test("meşru biçim zengin temizleyicide korunur", async ({ page }) => {
    const { zengin } = (await temizle(page)).mesru;
    for (const parca of [
      "<h2>Özellikler</h2>",
      "<td>Ağırlık</td>",
      'src="/files/a.jpg"',
      "<li>madde</li>",
      "<b>kalın</b>",
      'href="https://istoc.com"',
    ]) {
      expect.soft(zengin, parca).toContain(parca);
    }
  });

  test("kısa temizleyici izin listesi dışını düşürür, metni ve <b>'yi korur", async ({ page }) => {
    const { kisa } = (await temizle(page)).mesru;
    expect(kisa).not.toMatch(/<h2|<img|<table/i);
    expect(kisa).toContain("Özellikler");
    expect(kisa).toContain("<b>kalın</b>");
  });
});
