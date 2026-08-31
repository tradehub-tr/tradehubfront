/**
 * Katalog / enum değerlerinin DÖRT DİLDE karşılığı var mı?
 *
 * NEDEN VAR — ölçülmüş gerçek (15-FE, 31 Ağu):
 *   `shipment_exception_code` bir KATALOG: yönetici panelden yeni kod
 *   ekleyebiliyor. Storefront o kodu katalogdan gelen etiketle değil i18n'den
 *   çeviriyor (`t("shipment.exception.<KOD>", { defaultValue: kod })`) çünkü
 *   katalog satırı TEK DİLLİ bir etiket taşıyor. Katalogda sekiz kod vardı,
 *   i18n'de tr/en/ru/ar'ın dördünde sekizer çeviri — ve ikisini bağlayan
 *   **hiçbir test yoktu**. Panelden çevirisiz eklenen dokuzuncu kod alıcıya
 *   ham `YENI_KOD` metni olarak çıkardı, dört dilde birden, sessizce.
 *
 *   15-FE'nin K-4 kararı iade nedenlerini de kataloğa taşıyor; aynı açık
 *   oraya da yayılacaktı. Bu denetim ikisini birden kapatıyor.
 *
 * NE DEĞİL: çevirinin DOĞRULUĞUNU denetlemiyor, varlığını denetliyor.
 * Yanlış çeviri insanın işi; eksik çeviri makinenin.
 */
import { describe, expect, it } from "vitest";

import exceptionCodeJson from "../../mocks/logistics/shipment_exception_code.json";
import ar from "../locales/ar";
import en from "../locales/en";
import ru from "../locales/ru";
import tr from "../locales/tr";

const DILLER = { tr, en, ru, ar } as const;

/**
 * Sözlükler `{ translation: { … } }` sarmalıyla dışa aktarılıyor (i18next
 * kaynak biçimi); `t("shipment.exception.X")` çağrısı o sarmalın İÇİNDEN
 * okuyor. Önek eklenmezse denetim her anahtarı "eksik" sanar.
 */
function oku(sozluk: unknown, yol: string): unknown {
  return `translation.${yol}`
    .split(".")
    .reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], sozluk);
}

/**
 * Sözleşmeden gelen değer kümeleri → i18n ad alanı.
 *
 * Yeni bir katalog/enum ekranda gösterilmeye başlandığında buraya bir satır
 * eklenir. Satır eklenmezse denetim o kümeyi hiç görmez — bu yüzden aşağıda
 * ayrıca "taranan küme sayısı" alt sınırı var.
 */
const KUMELER: { ad: string; adAlani: string; degerler: string[] }[] = [
  {
    ad: "shipment_exception_code (KATALOG — panelden eklenebilir)",
    adAlani: "shipment.exception",
    degerler: exceptionCodeJson.default.data.items.map(
      (r) => (r as { exception_code: string }).exception_code
    ),
  },
  {
    ad: "return_reason (15-FE K-4 ile KATALOĞA taşınıyor)",
    adAlani: "shipment.returnReason",
    degerler: ["damaged", "wrong_item", "missing_parts", "not_as_described", "other"],
  },
  {
    ad: "return_request.status (sözleşme sabiti)",
    adAlani: "shipment.returnStatus",
    degerler: ["requested", "approved", "rejected", "in_transit", "inspecting", "closed"],
  },
];

describe("katalog ve enum değerleri dört dilde çevrili", () => {
  for (const kume of KUMELER) {
    for (const [dil, sozluk] of Object.entries(DILLER)) {
      it(`${kume.ad} — ${dil}`, () => {
        const eksik = kume.degerler.filter(
          (deger) => typeof oku(sozluk, `${kume.adAlani}.${deger}`) !== "string"
        );
        expect(
          eksik,
          `${dil}: ${kume.adAlani} altında karşılığı olmayan değer — ekranda ham anahtar görünür`
        ).toEqual([]);
      });
    }
  }

  it("kaynakta olmayan fazlalık çeviri anahtarı yok", () => {
    // Ters yön: katalogdan silinen bir kodun çevirisi sözlükte kalırsa kimse
    // fark etmez ve sözlük şişer. Yalnız `tr` üzerinden bakılıyor; diğer
    // diller yukarıdaki denetimle zaten `tr` ile hizalanıyor.
    for (const kume of KUMELER) {
      const blok = oku(tr, kume.adAlani) as Record<string, string> | undefined;
      const fazla = Object.keys(blok ?? {}).filter((k) => !kume.degerler.includes(k));
      expect(fazla, `${kume.adAlani}: kaynakta olmayan çeviri anahtarı`).toEqual([]);
    }
  });

  it("taranan küme sayısı beklenenin altına düşmedi", () => {
    // Liste bozulup 0 küme kalırsa yukarıdaki testler sessizce yeşil kalırdı.
    expect(KUMELER.length).toBeGreaterThanOrEqual(3);
    expect(KUMELER.every((k) => k.degerler.length > 0)).toBe(true);
  });
});
