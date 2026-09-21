import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { sunulanSayfalar } from "../../build/sunulanSayfalar";
import ar from "../locales/ar";
import en from "../locales/en";
import ru from "../locales/ru";
import tr from "../locales/tr";

const KOK = process.cwd();

/**
 * Hangi HTML'ler denetlenir: Vite'ın build girdisi NE İSE O.
 *
 * İlk sürüm kendi kara listesini tutuyordu ve E2E koşusunun ürettiği
 * `test-results/` altındaki 69 trace HTML'ini "sunulan sayfa" sandı (ölçüldü
 * 21 Eyl). Kara liste her yeni üretilen klasörde elle güncellenmek zorunda;
 * build'in listesi ise tanımı gereği doğru — derlenen her sayfa ziyaretçiye
 * gidiyor, gitmeyen hiçbir sayfa derlenmiyor.
 */
const SAYFALAR = sunulanSayfalar(KOK);

function anahtariCoz(sozluk: Record<string, unknown>, yol: string): unknown {
  return yol.split(".").reduce<unknown>((a, p) => (a as Record<string, unknown>)?.[p], sozluk);
}

describe("sayfa başlığı denetimi", () => {
  it("taranan sayfa sayısı makul (tarayıcı gerçekten dosya buluyor)", () => {
    // Karşı kanıt: HARIC listesi yanlışlıkla her şeyi elerse denetim boş
    // küme üzerinde koşar ve SESSİZCE geçer. Alt sınır onu yakalar.
    expect(SAYFALAR.length).toBeGreaterThan(50);
  });

  it.each(SAYFALAR)("%s başlığı data-i18n anahtarı taşıyor", (sayfa) => {
    const html = readFileSync(join(KOK, sayfa), "utf8");
    expect(
      html,
      `${sayfa}: <title> data-i18n taşımıyor — sekme başlığı her dilde Türkçe kalır`
    ).toMatch(/<title\s+data-i18n="[^"]+"/);
  });

  it("her başlık anahtarı DÖRT locale'de de dolu", () => {
    // Locale modülleri i18next'in beklediği `{ translation: { … } }` kabuğunda
    // geliyor; `data-i18n` anahtarları o kabuğun İÇİNDEN başlıyor.
    const diller = Object.fromEntries(
      Object.entries({ tr, en, ar, ru }).map(([dil, m]) => [
        dil,
        (m as { translation: Record<string, unknown> }).translation,
      ])
    );
    const eksikler: string[] = [];
    for (const sayfa of SAYFALAR) {
      const html = readFileSync(join(KOK, sayfa), "utf8");
      const anahtar = /<title\s+data-i18n="([^"]+)"/.exec(html)?.[1];
      if (!anahtar) continue;
      for (const [dil, sozluk] of Object.entries(diller)) {
        const deger = anahtariCoz(sozluk, anahtar);
        if (typeof deger !== "string" || !deger.trim()) {
          eksikler.push(`${sayfa} → ${anahtar} (${dil})`);
        }
      }
    }
    expect(eksikler, `Karşılığı olmayan başlık anahtarları:\n${eksikler.join("\n")}`).toEqual([]);
  });
});
