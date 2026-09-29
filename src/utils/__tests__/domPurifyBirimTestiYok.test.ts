/**
 * DOMPurify'lı temizleme BİRİM testinde sınanmaz — Playwright'ta sınanır.
 *
 * vitest ortamı happy-dom; orada `DOMPurify.isSupported === true` ama temizlik YAPILMIYOR
 * (MOGEM-685 F-01, 28 Eyl 2026 ölçüldü: `<p>a</p><script>…` girdisinden `<script>` kalıyor,
 * `<svg><g onload>`'da olay niteliği kalıyor). Böyle bir birim testi yanlış güven verir: temizlik
 * bozulsa da yeşil kalır. Gerçek tarayıcı testi: `tests/e2e/sanitize-tarayici.spec.ts`.
 *
 * 29 Eyl 2026 (bulgu 3): bugün böyle bir test YOK — `escapeHtml`/`sanitizeUrl` DOMPurify
 * kullanmıyor, onların birim testleri geçerli. Bu kapı tuzağın ileride kurulmasını önler.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const SRC = join(process.cwd(), "src");
const DOMPURIFY_LI = /\b(sanitizeHtml|sanitizeRichHtml|safeInnerHTML)\b|from\s+["']dompurify["']/;

function testDosyalari(dizin: string): string[] {
  return readdirSync(dizin).flatMap((ad) => {
    const yol = join(dizin, ad);
    if (statSync(yol).isDirectory()) return testDosyalari(yol);
    return /\.test\.ts$/.test(ad) ? [yol] : [];
  });
}

describe("DOMPurify'lı temizleme birim testinde sınanmıyor", () => {
  it("hiçbir birim testi DOMPurify'lı fonksiyon kullanmıyor", () => {
    const bu = relative(SRC, __filename);
    const ihlal = testDosyalari(SRC)
      .map((yol) => relative(SRC, yol))
      .filter((yol) => yol !== bu)
      .filter((yol) => DOMPURIFY_LI.test(readFileSync(join(SRC, yol), "utf8")));
    expect(
      ihlal,
      "happy-dom'da DOMPurify temizlemiyor — bu testleri tests/e2e/sanitize-tarayici.spec.ts'e taşı"
    ).toEqual([]);
  });
});
