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

const E2E = join(process.cwd(), "tests", "e2e");

const specler = readdirSync(E2E).filter((a) => a.endsWith(".spec.ts"));

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
});
