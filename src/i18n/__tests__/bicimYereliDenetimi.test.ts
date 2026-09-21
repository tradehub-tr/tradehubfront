/**
 * BİÇİM YERELİ DENETİMİ — sayı/para/tarih sabit yerele çakılı mı.
 *
 * NEDEN VAR: 21 Eylül 2026'da ölçüldü — kaynakta 50'den fazla biçimlendirme
 * çağrısı vardı ve üç ayrı desenle hepsi Türkçeye çakılıydı:
 *   `toLocaleString("tr-TR")` · `new Intl.NumberFormat("tr-TR")` ·
 *   `lang === "tr" ? "tr-TR" : "en-US"`
 * Sonuç: Arapça ve Rusça ziyaretçi, arayüz kendi dilindeyken sayıları ve
 * tarihleri TÜRKÇE biçimde görüyordu. Rusçada binlik ayıracı BOŞLUKTUR;
 * `1.234` bir Rus okuyucu için ondalık gibi görünür.
 *
 * Kullanıcı kararı D1: biçim arayüz diline bağlanır. Bu denetim kararın
 * sessizce geri alınmasını engelliyor — yeni bir `tr-TR` eklendiğinde kırılır.
 *
 * MUAF OLANLAR gerekçesiyle aşağıda. En önemlisi `toLocaleLowerCase("tr-TR")`:
 * o bir BİÇİM değil, Türkçe harf katlaması (I/ı, İ/i). Arama normalleştirmesi
 * Türkçe veriye göre yapılıyor ve arayüz diline bağlanmamalı.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import fg from "fast-glob";
import { describe, expect, it } from "vitest";

const KOK = process.cwd();

/** Sabit yerel arayan desenler — üçü de 21 Eyl'de kaynakta bulundu. */
const SABIT_YEREL =
  /(toLocaleString|toLocaleDateString|Intl\.(?:NumberFormat|DateTimeFormat))\s*\(\s*["'](tr-TR|en-US|de-DE|ar-SA|ru-RU)["']/;

/** İki dilli eski desen: `lang === "tr" ? ... : ...` */
const IKI_DILLI = /["']tr-TR["']\s*:\s*["']en-US["']/;

const MUAF = new Set([
  // Yerel haritanın KENDİSİ — sabit yereller burada tanımlanıyor.
  "src/utils/numberLocale.ts",
]);

const KAYNAKLAR = fg
  .sync("src/**/*.ts", { cwd: KOK, ignore: ["**/__tests__/**", "**/*.test.ts", "**/*.d.ts"] })
  .filter((f) => !MUAF.has(f));

describe("biçim yereli denetimi", () => {
  it("taranan dosya sayısı makul (tarayıcı gerçekten dosya buluyor)", () => {
    // Karşı kanıt: glob bozulursa denetim boş küme üzerinde SESSİZCE geçer.
    expect(KAYNAKLAR.length).toBeGreaterThan(200);
  });

  it("hiçbir kaynakta sabit biçim yereli yok", () => {
    const ihlaller: string[] = [];
    for (const dosya of KAYNAKLAR) {
      const satirlar = readFileSync(join(KOK, dosya), "utf8").split("\n");
      satirlar.forEach((satir, i) => {
        // `toLocaleLowerCase("tr-TR")` biçim değil harf katlaması — muaf.
        if (satir.includes("toLocaleLowerCase")) return;
        if (SABIT_YEREL.test(satir) || IKI_DILLI.test(satir)) {
          ihlaller.push(`${dosya}:${i + 1}  ${satir.trim().slice(0, 90)}`);
        }
      });
    }
    expect(
      ihlaller,
      `Sabit biçim yereli bulundu. Arapça/Rusça ziyaretçi yanlış biçim görür.\n` +
        `Yerine \`numberLocale\` yardımcılarını kullan (sayiBicimle / paraBicimle / tarihBicimle).\n` +
        ihlaller.join("\n")
    ).toEqual([]);
  });
});
