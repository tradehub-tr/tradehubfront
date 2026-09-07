import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * ZAMAN BOMBASI DENETİMİ — test dosyalarında GELECEK tarih sabiti yasak.
 *
 * NEDEN VAR: 7 Eylül 2026'da `logisticsPickupMock.test.ts`'in dört testi
 * birden düştü ("A past date cannot be selected"). Kusur mock'ta değildi;
 * test hafta içi bir gün olarak "2026-09-02" yazıyordu ve o gün beş gün
 * önce geçmişti. Mock geçmiş tarihli randevuyu doğru biçimde reddediyordu —
 * yani üründe hata yoktu, testte vardı.
 *
 * KURAL NEDEN "SABİT TARİH YASAK" DEĞİL: geçmiş tarih sabiti zararsızdır —
 * anlamı bir daha değişmez, iyi bir fixture'dır (created_at: 2026-08-15).
 * Tehlikeli olan yalnızca BUGÜN HÂLÂ GELECEKTE olan sabittir; o, patlama
 * günü belli bir bombadır. Denetim tam olarak bunu ayırt eder, bu yüzden
 * gürültü yapmaz.
 *
 * YORUMLAR TARANMAZ: gerekçe metinleri (bu blok dâhil) tarih anıyor;
 * taransaydı denetim kendi açıklamasını ihlal sayardı.
 *
 * Kardeşi: `admin-panel/frontend/src/__tests__/zamanBombasi.test.js`.
 */

const BU_DOSYA = fileURLToPath(import.meta.url);
// Denetim kendi örneklerini taşır (öz-test 2099 tarihleri kullanıyor);
// kendini tararsa kendi kuralını ihlal eder.
const KOK = join(dirname(BU_DOSYA), "../..");
const TARANAN_DIZINLER = ["src", "tests"];
const ATLANAN = new Set(["node_modules", "dist", "playwright", "test-results", "coverage"]);
const TEST_DOSYASI = /\.(test|spec)\.(js|ts|mjs|cjs)$/;

function testDosyalari(dizin: string): string[] {
  let sonuc: string[] = [];
  let girdiler: string[];
  try {
    girdiler = readdirSync(dizin);
  } catch {
    return sonuc;
  }
  for (const ad of girdiler) {
    if (ATLANAN.has(ad)) continue;
    const tam = join(dizin, ad);
    if (statSync(tam).isDirectory()) sonuc = sonuc.concat(testDosyalari(tam));
    else if (TEST_DOSYASI.test(ad)) sonuc.push(tam);
  }
  return sonuc;
}

/** Yorumları boşlukla doldurur — satır ve sütun sayısı korunur. */
export function yorumlariSil(kaynak: string): string {
  return kaynak
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, onek: string) => onek + " ".repeat(m.length - onek.length));
}

export function gelecekTarihleriBul(
  kaynak: string,
  bugunISO: string
): { satir: number; tarih: string }[] {
  const bulunan: { satir: number; tarih: string }[] = [];
  yorumlariSil(kaynak)
    .split("\n")
    .forEach((satir, i) => {
      for (const eslesme of satir.matchAll(/["'`](20\d{2}-\d{2}-\d{2})/g)) {
        if (eslesme[1] > bugunISO) bulunan.push({ satir: i + 1, tarih: eslesme[1] });
      }
    });
  return bulunan;
}

describe("zaman bombası denetimi", () => {
  it("hiçbir test dosyası bugünden ileri bir tarihi sabit yazmaz", () => {
    const bugun = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    const bugunISO = `${bugun.getFullYear()}-${p(bugun.getMonth() + 1)}-${p(bugun.getDate())}`;

    const dosyalar = TARANAN_DIZINLER.flatMap((d) => testDosyalari(join(KOK, d))).filter(
      (dosya) => dosya !== BU_DOSYA
    );
    // ALT SINIR: "0 bulgu" ile "hiç bakmadım" aynı görünür (e2e-testing.md).
    expect(dosyalar.length).toBeGreaterThan(50);

    const bombalar = dosyalar.flatMap((dosya) =>
      gelecekTarihleriBul(readFileSync(dosya, "utf8"), bugunISO).map(
        (b) => `${relative(KOK, dosya)}:${b.satir} → ${b.tarih}`
      )
    );

    // Düşerse: sabit yazma, `new Date()`'ten türet (örn. `yakinHaftaIciGun()`).
    expect(bombalar).toEqual([]);
  });

  it("kendi kuralını ölçer — yorum muaf, kod değil", () => {
    expect(gelecekTarihleriBul('const a = "2099-01-01";', "2026-09-07")).toEqual([
      { satir: 1, tarih: "2099-01-01" },
    ]);
    expect(gelecekTarihleriBul('// bkz. "2099-01-01"', "2026-09-07")).toEqual([]);
    expect(gelecekTarihleriBul('/* "2099-01-01" */', "2026-09-07")).toEqual([]);
    expect(gelecekTarihleriBul('const a = "2020-01-01";', "2026-09-07")).toEqual([]);
    // URL'deki `//` yorum değil — protokol ayıracı yutulursa kod kör olur.
    expect(gelecekTarihleriBul('fetch("https://x/y?d=2099-01-01");', "2026-09-07")).toEqual([]);
  });
});
