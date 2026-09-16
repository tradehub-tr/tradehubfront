/**
 * ÜLKE → DİL eşlemesinin sözleşmesi (MOGEM-642).
 *
 * Korunan iddialar:
 *  1. Haritadaki her ülke, desteklenen dört dilden birini döndürür.
 *  2. Haritada olmayan ülke ve bozuk/boş girdi İngilizceye düşer — görevin
 *     "ülke tespiti bozulursa site açılmaya devam etsin" şartı budur.
 *  3. Kapsam kararları sabittir: Arapça 18 ülke (Arap Ligi'nin 22 üyesinden
 *     MR/SO/DJ/KM hariç), Rusça yalnız RU, Türkçe yalnız TR.
 *
 * Bu eşleme ülke kodunun kaynağından bağımsızdır; Cloudflare, nginx geo ya da
 * backend — hangisi verirse versin sonuç aynıdır.
 */
import { describe, expect, it } from "vitest";

import {
  COUNTRY_LANG_MAP,
  SUPPORTED_LANGS,
  VARSAYILAN_DIL,
  languageForCountry,
} from "../languageChoice";

/** Arap Ligi'nin 22 üyesi — dördü bilinçli olarak haritada YOK. */
const ARAP_LIGI_TAMAMI = [
  "SA",
  "AE",
  "QA",
  "KW",
  "BH",
  "OM",
  "YE",
  "JO",
  "LB",
  "SY",
  "IQ",
  "PS",
  "EG",
  "LY",
  "TN",
  "DZ",
  "MA",
  "SD",
  "MR",
  "SO",
  "DJ",
  "KM",
];
const ARAPCA_DISINDA_BIRAKILAN = ["MR", "SO", "DJ", "KM"];

describe("COUNTRY_LANG_MAP", () => {
  it("haritadaki her değer desteklenen bir dil", () => {
    for (const [ulke, dil] of Object.entries(COUNTRY_LANG_MAP)) {
      expect(SUPPORTED_LANGS, `${ulke} desteklenmeyen dile işaret ediyor`).toContain(dil);
    }
  });

  it("ülke kodları iki harfli ve BÜYÜK yazılmış", () => {
    for (const ulke of Object.keys(COUNTRY_LANG_MAP)) {
      expect(ulke).toMatch(/^[A-Z]{2}$/);
    }
  });
});

describe("languageForCountry", () => {
  it("Türkiye Türkçe açar", () => {
    expect(languageForCountry("TR")).toBe("tr");
  });

  it("Rusya Rusça açar", () => {
    expect(languageForCountry("RU")).toBe("ru");
  });

  it("Arapça listesindeki 18 ülkenin hepsi Arapça açar", () => {
    const arapcaOlmali = ARAP_LIGI_TAMAMI.filter((u) => !ARAPCA_DISINDA_BIRAKILAN.includes(u));
    expect(arapcaOlmali).toHaveLength(18);
    for (const ulke of arapcaOlmali) {
      expect(languageForCountry(ulke), `${ulke} Arapça açmalı`).toBe("ar");
    }
  });

  it("bilinçli olarak dışarıda bırakılan dört ülke İngilizce açar", () => {
    // MR/SO/DJ/KM: Arap Ligi üyesi ama Arapça baskın arayüz dili değil.
    for (const ulke of ARAPCA_DISINDA_BIRAKILAN) {
      expect(languageForCountry(ulke), `${ulke} İngilizce açmalı`).toBe("en");
    }
  });

  it("haritada olmayan ülkeler İngilizce açar", () => {
    for (const ulke of ["DE", "FR", "US", "CN", "JP", "BR", "KZ", "BY", "UA"]) {
      expect(languageForCountry(ulke), `${ulke} İngilizce açmalı`).toBe("en");
    }
  });

  it("biçim farklarını normalize eder", () => {
    for (const girdi of ["tr", "Tr", " TR ", "tr-TR"]) {
      expect(languageForCountry(girdi), `${girdi} Türkçe açmalı`).toBe("tr");
    }
  });

  it("üç harfli ülke kodları desteklenmez, İngilizceye düşer", () => {
    // Ölçüldü 16 Eyl 2026: körü körüne ilk iki harfi almak öngörülemez sonuç
    // veriyordu — "SAU" → "SA" (Suudi Arabistan) ve "EGY" → "EG" (Mısır)
    // tesadüfen DOĞRU eşleşirken "TUR" → "TU" hiçbir şeye denk gelmiyordu.
    // Artık biçim açıkça doğrulanıyor; kaynaklarımız zaten alpha-2 üretir.
    for (const girdi of ["TUR", "RUS", "EGY", "SAU", "DEU"]) {
      expect(languageForCountry(girdi), `${girdi} İngilizce açmalı`).toBe("en");
    }
  });

  it("boş, bozuk ve tanımsız girdide çökmez, İngilizceye düşer", () => {
    for (const girdi of ["", "  ", "X", "12", "??", null, undefined]) {
      expect(languageForCountry(girdi)).toBe(VARSAYILAN_DIL);
    }
    expect(VARSAYILAN_DIL).toBe("en");
  });

  it("her zaman desteklenen bir dil döndürür — rastgele girdilerde bile", () => {
    const girdiler = ["ZZ", "!!", "999", "türkiye", "SAUDI", "  ru  ", "EN"];
    for (const girdi of girdiler) {
      expect(SUPPORTED_LANGS).toContain(languageForCountry(girdi));
    }
  });
});
