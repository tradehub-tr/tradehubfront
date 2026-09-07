/**
 * Lojistik ad alanı DÖRT DİLDE eksiksiz mi?
 *
 * NEDEN VAR — kardeşinden farkı: `katalogCevirisi.test.ts` katalog/enum
 * DEĞERLERİNİ denetliyor (panelden eklenen bir kodun çevirisi var mı).
 * Bu denetim ARAYÜZ METİNLERİNİ denetliyor: `shipment.*` altındaki her
 * anahtarın tr/en/ru/ar karşılığı var mı.
 *
 * Storefront alıcıya ait ve dört dil sunuyor. Eksik bir anahtar ekranda ham
 * `shipment.foo.bar` metni olarak çıkar — ve yalnız o dili kullanan
 * kullanıcıda çıkar, yani geliştirme sırasında görünmez. `defaultValue`
 * verilmediği sürece i18next anahtarın kendisini basar.
 *
 * NE DEĞİL: çevirinin DOĞRULUĞUNU denetlemiyor, VARLIĞINI denetliyor
 * (kardeşiyle aynı sınır). Yanlış çeviri insanın işi, eksik çeviri makinenin.
 */
import { describe, expect, it } from "vitest";

import ar from "../locales/ar";
import en from "../locales/en";
import ru from "../locales/ru";
import tr from "../locales/tr";

/** Referans dil TÜRKÇE: ürün kararları önce burada yazılıyor. */
const REFERANS = tr;
const DIGERLERI = { en, ru, ar } as const;

/** Denetlenen ad alanları — `translation.` sarmalının altındaki kökler. */
const AD_ALANLARI = ["shipment"] as const;

type Sozluk = Record<string, unknown>;

/** Bir nesnedeki tüm yaprak anahtar yollarını çıkarır (`a.b.c`). */
function yapraklar(nesne: unknown, onek = ""): string[] {
  if (nesne === null || typeof nesne !== "object") return onek ? [onek] : [];
  return Object.entries(nesne as Sozluk).flatMap(([k, v]) =>
    yapraklar(v, onek ? `${onek}.${k}` : k)
  );
}

function oku(sozluk: unknown, yol: string): unknown {
  return yol.split(".").reduce<unknown>((o, k) => (o as Sozluk)?.[k], sozluk);
}

describe("lojistik arayüz metinleri dört dilde eksiksiz", () => {
  const referansYollar = AD_ALANLARI.flatMap((ad) =>
    yapraklar(oku(REFERANS, `translation.${ad}`), ad)
  );

  it("denetim gerçekten tarıyor (alt sınır)", () => {
    // "0 eksik" ile "hiç bakmadım" aynı görünür.
    expect(referansYollar.length).toBeGreaterThan(200);
  });

  for (const [dil, sozluk] of Object.entries(DIGERLERI)) {
    it(`${dil}: eksik ya da boş anahtar yok`, () => {
      const eksik: string[] = [];
      const bos: string[] = [];
      for (const yol of referansYollar) {
        const deger = oku(sozluk, `translation.${yol}`);
        if (deger === undefined) eksik.push(yol);
        else if (typeof deger === "string" && deger.trim() === "") bos.push(yol);
      }
      // Düşerse: eksik anahtarları `src/i18n/locales/<dil>.ts`'e ekle.
      expect({ eksik, bos }).toEqual({ eksik: [], bos: [] });
    });
  }

  it("fazla anahtar yok — referansta olmayan çeviri ölü ağırlıktır", () => {
    const fazlalar: Record<string, string[]> = {};
    for (const [dil, sozluk] of Object.entries(DIGERLERI)) {
      const dilYollar = AD_ALANLARI.flatMap((ad) =>
        yapraklar(oku(sozluk, `translation.${ad}`), ad)
      );
      const fazla = dilYollar.filter((y) => !referansYollar.includes(y));
      if (fazla.length) fazlalar[dil] = fazla;
    }
    expect(fazlalar).toEqual({});
  });
});
