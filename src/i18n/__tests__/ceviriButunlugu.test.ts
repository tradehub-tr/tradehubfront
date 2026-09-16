/**
 * ÇEVİRİ BÜTÜNLÜĞÜ — tr referans, diğer üç dilde eksik anahtar olmamalı.
 *
 * Neden: Arapça arayüzde ham anahtarlar ekrana basılıyordu
 * (`heroSide.bestDeals` gibi) — kullanıcı çeviri yerine kod adı görüyordu.
 * Ölçüldü 16 Eyl 2026: ar ve ru'da 11'er anahtar eksikti, altısı ana sayfada
 * görünüyordu.
 *
 * BİLİNEN_EKSİKLER mevcut durumu dondurur: listedekiler bugünün borcu,
 * YENİ bir eksik eklenirse test kırmızıya döner. Borç kapandıkça liste
 * küçültülür — büyütülmez.
 */
import { describe, expect, it } from "vitest";

import ar from "../locales/ar";
import en from "../locales/en";
import ru from "../locales/ru";
import tr from "../locales/tr";

/**
 * Üç dilde birden eksik olan, TR'de yeni eklenip hiç çevrilmemiş anahtarlar.
 *
 * 16 Eyl 2026: liste BOŞALDI. İçindeki beş `sellPage.*` anahtarı çevrilmedi,
 * SİLİNDİ — ölçüldü ki hiçbiri çağrılmıyordu ve üçünün kullanılan karşılığı
 * zaten dört dilde vardı (`heroTitle`, `heroImageAlt`, `dedicatedTurkishSupport`
 * — sonuncusu `manufacturersFocusedSupport` ile birebir aynı metin).
 *
 * Liste boş kalmalı: TR'ye yeni anahtar eklenip diğer dillere eklenmezse test
 * kırmızıya döner. Buraya madde eklemek borç yazmaktır — önce çevirmeyi dene.
 */
const BILINEN_EKSIKLER = new Set<string>([]);

type Sozluk = Record<string, unknown>;

function duzles(o: Sozluk, onek = "", cikti = new Set<string>()): Set<string> {
  for (const [k, v] of Object.entries(o || {})) {
    const yol = onek ? `${onek}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) duzles(v as Sozluk, yol, cikti);
    else cikti.add(yol);
  }
  return cikti;
}

const trAnahtarlar = duzles(tr as Sozluk);
const diller: Array<[string, Sozluk]> = [
  ["en", en as Sozluk],
  ["ar", ar as Sozluk],
  ["ru", ru as Sozluk],
];

describe("çeviri bütünlüğü", () => {
  it("tr referans sözlüğü beklenen büyüklükte (tarama çalışıyor)", () => {
    expect(trAnahtarlar.size).toBeGreaterThan(6000);
  });

  for (const [ad, sozluk] of diller) {
    it(`${ad}: tr'de olup burada olmayan YENİ anahtar yok`, () => {
      const mevcut = duzles(sozluk);
      const eksik = [...trAnahtarlar].filter((k) => !mevcut.has(k) && !BILINEN_EKSIKLER.has(k));
      expect(
        eksik,
        `${ad}.ts'te ${eksik.length} çevrilmemiş anahtar var. Ekrana ham anahtar basılır:\n${eksik.slice(0, 20).join("\n")}`
      ).toEqual([]);
    });
  }

  /**
   * TERS YÖN — tr'de olmayıp çeviri dosyasında duran anahtar.
   *
   * Yukarıdaki denetim yalnız "eksik"e bakıyordu; bir anahtar tr'den silinince
   * ar/ru kopyaları geride kalıyor ve hiçbir test bunu görmüyordu. Ölçüldü
   * (16 Eyl 2026): ar.ts ve ru.ts'te tr'de ve en'de karşılığı olmayan, kodda
   * hiç çağrılmayan 11 yetim anahtar vardı (`mega.*`, `footer.*`,
   * `cart.movedToFavorites`) — silindiler.
   *
   * `_one`/`_other` gibi i18next ÇOĞUL biçimleri meşru istisnadır: Türkçe
   * tekil/çoğul ayrımı yapmadığı için tr.ts'te karşılıkları yoktur.
   */
  const COGUL_SONEKLERI = /_(one|other|few|many|two|zero)$/;

  for (const [ad, sozluk] of diller) {
    it(`${ad}: tr'de olmayan yetim anahtar yok`, () => {
      const mevcut = duzles(sozluk);
      const yetim = [...mevcut].filter((k) => !trAnahtarlar.has(k) && !COGUL_SONEKLERI.test(k));
      expect(
        yetim,
        `${ad}.ts'te ${yetim.length} yetim anahtar var — tr'den silinmiş ama burada kalmış:\n${yetim.slice(0, 20).join("\n")}`
      ).toEqual([]);
    });
  }

  it("ana sayfa hero paneli dört dilde de çevrili", () => {
    // Bu blok Arapça ekranda ham görünen kusurun ta kendisiydi.
    const heroAnahtarlar = [...trAnahtarlar].filter((k) => k.startsWith("translation.heroSide."));
    expect(heroAnahtarlar.length).toBeGreaterThan(0);
    for (const [ad, sozluk] of diller) {
      const mevcut = duzles(sozluk);
      const eksik = heroAnahtarlar.filter((k) => !mevcut.has(k));
      expect(eksik, `${ad}.ts heroSide eksik: ${eksik.join(", ")}`).toEqual([]);
    }
  });

  it("çeviri borcu SIFIR — bilinen eksikler listesi boş", () => {
    // 16 Eyl 2026'da boşaldı. Yeniden dolması, "çeviremedim, muaf tutayım"
    // demenin yoludur; eşik gevşetilmeden önce anahtarın gerçekten gerekli
    // olduğu (bir yerden çağrıldığı) doğrulanmalı.
    expect([...BILINEN_EKSIKLER]).toEqual([]);
  });
});
