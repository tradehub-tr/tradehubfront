/**
 * SABİT TÜRKÇE METİN DENETİMİ — kullanıcıya gösterilen metin i18n'den gelmeli.
 *
 * NEDEN VAR: 21 Eylül 2026'da ölçüldü — `src/alpine/auth.ts` kullanıcıya
 * gösterilen DÖRT hata metnini sabit Türkçe yazıyordu, üstelik ikisinin i18n
 * karşılığı zaten vardı (`acceptInvite.errorDesc` birebir aynı metindi).
 * Sonuç Playwright sayfa anlık görüntüsünde görüldü:
 *
 *     heading   "Invalid invitation"                ← İngilizce
 *     paragraph "Davet linki geçersiz veya eksik."  ← Türkçe
 *     link      "Back to Homepage"                  ← İngilizce
 *
 * Yani İngilizce/Arapça/Rusça ziyaretçi KARIŞIK DİLDE ekran görüyordu. Kusur
 * ay(lar)ca fark edilmedi çünkü build'i kırmıyor, test kırmızıya düşürmüyor ve
 * Türkçe geliştirici ekranında doğru görünüyor.
 *
 * KAPSAM: yalnız `state.error = "..."` / `this.error = "..."` gibi DOĞRUDAN
 * kullanıcıya basılan atamalar taranır. Konsol mesajları, yorumlar, test
 * dosyaları ve i18n sözlüklerinin kendisi hariçtir.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const SRC = join(process.cwd(), "src");

/** Türkçeye özgü harfler — İngilizce metinde bulunmazlar. */
const TURKCE_HARF = /[çğıöşüÇĞİÖŞÜ]/;

/** Kullanıcıya gösterilen metin ataması: `.error = "..."` / `.message = "..."`. */
const ATAMA = /\.(error|message|errorText|hata)\s*=\s*"([^"]{8,})"/g;

/**
 * Bilinçli muafiyetler — GEREKÇESİYLE.
 * Muafiyet bayatlarsa (dosya artık ihlal etmiyorsa) test bunu söyler.
 */
const MUAFIYETLER: Record<string, string> = {};

function dosyalar(dizin: string): string[] {
  const cikti: string[] = [];
  for (const ad of readdirSync(dizin)) {
    const tam = join(dizin, ad);
    if (statSync(tam).isDirectory()) {
      if (ad === "locales" || ad === "__tests__") continue;
      cikti.push(...dosyalar(tam));
      continue;
    }
    if (!/\.(ts|js)$/.test(ad) || /\.(test|spec)\./.test(ad)) continue;
    cikti.push(tam);
  }
  return cikti;
}

/** Yorumları soy — açıklamadaki Türkçe metin sahte kırmızı üretmesin. */
function kodu(icerik: string): string {
  return icerik.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function ihlaller(): string[] {
  const bulunan: string[] = [];
  for (const yol of dosyalar(SRC)) {
    const gorece = relative(process.cwd(), yol);
    if (MUAFIYETLER[gorece]) continue;
    const kod = kodu(readFileSync(yol, "utf8"));
    for (const eslesme of kod.matchAll(ATAMA)) {
      const metin = eslesme[2];
      if (!TURKCE_HARF.test(metin)) continue;
      bulunan.push(`${gorece} → "${metin.slice(0, 50)}"`);
    }
  }
  return bulunan;
}

describe("kullanıcıya gösterilen metin i18n'den gelmeli", () => {
  it("tarama gerçekten çalışıyor (dosyalar okunabiliyor)", () => {
    expect(dosyalar(SRC).length).toBeGreaterThan(100);
  });

  it("hata/mesaj atamalarında sabit Türkçe metin yok", () => {
    expect(
      ihlaller(),
      "Bu atamalar kullanıcıya doğrudan basılıyor ve sabit Türkçe. Yabancı " +
        "ziyaretçi karışık dilde ekran görür. Çözüm: i18n anahtarı tanımlayıp " +
        "t('...') ile çağır; anahtar zaten varsa onu kullan."
    ).toEqual([]);
  });

  it("muafiyet listesi bayatlamadı", () => {
    const hala = new Set(ihlaller().map((s) => s.split(" → ")[0]));
    const bayat = Object.keys(MUAFIYETLER).filter((y) => !hala.has(y));
    expect(bayat, "Bu dosyalar artık ihlal etmiyor; muafiyeti silin").toEqual([]);
  });
});
