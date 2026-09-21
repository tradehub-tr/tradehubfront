/**
 * E2E'de DİL KURULUMU DENETİMİ — kaynak taraması.
 *
 * Neden var: MOGEM-642 Faz 1'de dil kararı sıkılaştı — `i18nextLng` artık
 * `th-lang-source=manual` işareti olmadan KULLANICI SEÇİMİ sayılmıyor
 * (otomatik ülke tespiti onu ezebilsin diye). İşaretsiz yazan testlerde karar
 * tarayıcı diline düşüyor; Playwright bağlamı `en-US` açıldığı için ekran
 * İngilizce çiziliyor ve Türkçe metin arayan HER iddia kırmızıya dönüyor.
 *
 * Ölçüldü (17 Eyl 2026): mock E2E paketinde 97 test kırmızıydı; dokuz
 * spec'ten altısı tam olarak bu yüzden düşüyordu. Tek satır (`th-lang-source`)
 * eklenince `storefront-teslim-alma` 13 kırıktan 16 geçene döndü.
 *
 * Kontrol listesi unutulur; denetim test olur. Yeni bir spec dili elle
 * kurduğunda bu test onu ilk koşuşta yakalar — kırmızı 97 teste değil tek bir
 * anlaşılır iddiaya düşer.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import en from "../locales/en";
import tr from "../locales/tr";

const E2E = join(process.cwd(), "tests", "e2e");

const specler = readdirSync(E2E).filter((a) => a.endsWith(".spec.ts"));

/**
 * "Bu metin Türkçe arayüz dizesi mi?" sorusu TAHMİNLE cevaplanmaz.
 *
 * İlk deneme Türkçeye özgü harf (çğıöşü) arıyordu; ölçüldü ki yetersiz —
 * "Sepete ekle", "Devam et", "Kaydet" gibi çok yaygın Türkçe dizeler o
 * harflerin hiçbirini taşımıyor ve denetim onları sessizce kaçırıyordu.
 *
 * Kesin ölçüt: metin TR sözlüğünde VAR ve EN karşılığı FARKLI. O zaman ekran
 * İngilizce açıldığında o metin DOM'da bulunmaz ve iddia düşer.
 */
function duzle(o: unknown, on = ""): Map<string, string> {
  const cikti = new Map<string, string>();
  if (typeof o !== "object" || o === null) return cikti;
  for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
    if (typeof v === "string") cikti.set(on ? `${on}.${k}` : k, v);
    else for (const [ak, av] of duzle(v, on ? `${on}.${k}` : k)) cikti.set(ak, av);
  }
  return cikti;
}

const TR_DIZELER = duzle(tr);
const EN_DIZELER = duzle(en);

/** TR'de olan ve EN'de FARKLI olan metinler — dile duyarlı arama hedefleri. */
const DILE_DUYARLI = new Set<string>(
  [...TR_DIZELER]
    .filter(([anahtar, deger]) => {
      const ing = EN_DIZELER.get(anahtar);
      return ing !== undefined && ing !== deger;
    })
    .map(([, deger]) => deger)
);

/** Kullanıcıya görünen metin arayan Playwright çağrıları. */
const METIN_ARAMA =
  /(getByText|getByRole|getByLabel|getByPlaceholder|getByTitle|getByAltText|hasText|toHaveText|toContainText)\s*\([^)]*?["'`]([^"'`]{4,})["'`]/g;

/**
 * Denetim dışı bırakılanlar — GEREKÇESİYLE.
 *
 * Ayrıca `panel-` önekli spec'ler tamamen dışarıda: panel Frappe cookie-login
 * ile açılıyor ve dili kullanıcının kayıtlı tercihinden geliyor, tarayıcı
 * diline DÜŞMÜYOR. Ölçüldü (21 Eyl 2026): panel bloğu geçiyor; panelin kendi
 * dil davranışını `panel-dil-butunlugu` ve `panel-ilk-boyama-dili` sınıyor.
 */
const DIL_MUAFIYETLERI: Record<string, string> = {
  "product-detail-variants.spec.ts":
    "Aranan metin arayüz dizesi DEĞİL, fixture VERİSİ: spec'in kendi mock'unda " +
    'tanımlı varyant etiketi (`label: "Siyah"`, satır 60-82). Uygulama mock ne ' +
    "verdiyse onu basıyor; arayüz dili değişse de o metin değişmez. TR sözlüğünde " +
    "de bulunması tesadüf (katalog renk adları çevrili). Ölçüldü: spec geçiyor.",
};

/** Yorumları soy — açıklamadaki metin sahte kırmızı üretmesin. */
function kodu(icerik: string): string {
  return icerik.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

/**
 * Dili hiç kurmayan ama dile duyarlı metin arayan spec'ler.
 * `muafiyetleriUygula=false` → muafiyet listesi YOK SAYILIR (bayatlık denetimi için).
 */
function dilKurmayanIhlaller(muafiyetleriUygula: boolean): string[] {
  const ihlaller: string[] = [];
  for (const ad of specler) {
    if (ad.startsWith("panel-")) continue;
    if (muafiyetleriUygula && DIL_MUAFIYETLERI[ad]) continue;
    const icerik = readFileSync(join(E2E, ad), "utf8");
    if (/setItem\(\s*["'`]i18nextLng["'`]/.test(icerik)) continue;
    for (const eslesme of kodu(icerik).matchAll(METIN_ARAMA)) {
      if (DILE_DUYARLI.has(eslesme[2])) {
        ihlaller.push(`${ad} → "${eslesme[2].slice(0, 40)}"`);
        break;
      }
    }
  }
  return ihlaller;
}

describe("E2E dil kurulumu", () => {
  it("taranacak spec bulundu (tarama gerçekten çalışıyor)", () => {
    expect(specler.length).toBeGreaterThan(20);
  });

  it("`i18nextLng` yazan her spec `th-lang-source` işaretini de yazıyor", () => {
    const ihlaller: string[] = [];
    for (const ad of specler) {
      const icerik = readFileSync(join(E2E, ad), "utf8");
      if (!/setItem\(\s*["'`]i18nextLng["'`]/.test(icerik)) continue;
      // Dizeyi ARAMAK yetmiyor: "th-lang-source" açıklama satırında da
      // geçiyor ve denetim sahte yeşil veriyordu (karşı kanıt turunda
      // ölçüldü — işaret satırı silindiği hâlde test geçti). Aranan şey
      // gerçek ÇAĞRI olmalı.
      if (!/setItem\(\s*["'`]th-lang-source["'`]/.test(icerik)) ihlaller.push(ad);
    }
    expect(
      ihlaller,
      "Bu spec'ler dili işaretsiz kuruyor; ekran İngilizce açılır ve Türkçe " +
        "metin arayan iddialar sessizce düşer. Çözüm: aynı `addInitScript` " +
        'içine `localStorage.setItem("th-lang-source", "manual")` ekle.'
    ).toEqual([]);
  });

  /**
   * KÖR NOKTA KAPATILDI (21 Eyl 2026).
   *
   * Üstteki denetim yalnız `i18nextLng` YAZAN spec'leri kontrol ediyordu
   * ("yazdıysan işareti de yaz"). Hiç dil kurmayan ama Türkçe metin arayan
   * spec'i görmüyordu — `accept-invite.spec.ts` tam bu boşluktan kaçtı ve
   * dört testi aylarca kırmızı tuttu.
   */
  it("dil muafiyetleri bayatlamadı", () => {
    // Muafiyet listesi çöplüğe dönmesin: bir dosya artık ihlal etmiyorsa
    // muafiyeti SİLİNMELİ. Ölçüldü (21 Eyl): ilk yazılan muafiyet
    // (`product-detail-layout.spec.ts`) tespit sözlük tabanlı hâle gelince
    // gereksizleşti; bu kapı olmasaydı listede kalırdı.
    const ihlalEdenler = new Set(dilKurmayanIhlaller(false).map((x) => x.split(" → ")[0]));
    const bayat = Object.keys(DIL_MUAFIYETLERI).filter((ad) => !ihlalEdenler.has(ad));
    expect(bayat, "Bu dosyalar artık ihlal etmiyor; muafiyeti silin").toEqual([]);
  });

  it("Türkçe metin arayan her spec dili SABİTLİYOR", () => {
    expect(
      dilKurmayanIhlaller(true),
      "Bu spec'ler Türkçe metin arıyor ama dili HİÇ kurmuyor. Playwright " +
        "bağlamı en-US açıldığı için ekran İngilizce çizilir ve iddia " +
        '"element bulunamadı" ile düşer. Çözüm: addInitScript içinde ' +
        'i18nextLng="tr" + th-lang-source="manual" yaz.'
    ).toEqual([]);
  });
});
