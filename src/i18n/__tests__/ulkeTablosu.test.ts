/**
 * ÜLKE TABLOSU ÜRETECİ — birim testleri (MOGEM-642 · Faz 5).
 *
 * Neden burada: üreteç `scripts/` altında ama kilitlediği sözleşme i18n'in —
 * ülke listesi `languageChoice.ts`'ten geliyor ve tablo dil kararını besliyor.
 * `vitest.config.ts` yalnız `src/**` tarıyor; testi oraya koymak, üretecin
 * sessizce test dışı kalmasını engelliyor (Faz 1'de bir E2E spec'i koşum
 * listesine eklenmediği için aylarca hiç çalışmamıştı).
 *
 * Ağ YOK: testler indirmez, örnek CSV metniyle çalışır. CI'ın dış servise
 * bağımlı olmaması bilinçli.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  BLOK_BASI,
  BLOK_SONU,
  araligiCidrlereBol,
  aydanAy,
  bloguKur,
  bloguOku,
  ipAyristir,
  ipYaz,
  sablonaYerlestir,
  tabloUret,
  ulkeleriOku,
} from "../../../scripts/ulke-tablosu-uret.mjs";
import { COUNTRY_LANG_MAP } from "../languageChoice";

const KOK = process.cwd();

describe("ülke listesi tek kaynaktan okunuyor", () => {
  const kaynak = readFileSync(join(KOK, "src/i18n/languageChoice.ts"), "utf8");

  it("`COUNTRY_LANG_MAP` kaynak dosyadan ayrıştırılabiliyor", () => {
    expect(ulkeleriOku(kaynak).length).toBeGreaterThanOrEqual(20);
  });

  it("ayrıştırılan liste modüldeki haritayla BİREBİR aynı", () => {
    // Bu testin varlık sebebi: üreteçte ikinci bir ülke listesi tutulmasın.
    // Haritaya ülke eklenip tablo üretilmezse, o ülkeden gelen ziyaretçi
    // sessizce İngilizce görür — kusur ancak aylar sonra fark edilirdi.
    expect(ulkeleriOku(kaynak).sort()).toEqual(Object.keys(COUNTRY_LANG_MAP).sort());
  });

  it("harita bozuksa net hata veriyor (sessiz boş liste üretmiyor)", () => {
    expect(() => ulkeleriOku("const baska = {};")).toThrow(/COUNTRY_LANG_MAP bulunamadı/);
  });
});

describe("IP ayrıştırma ve yazma", () => {
  it.each([
    ["0.0.0.0", 0n],
    ["1.2.3.4", 16909060n],
    ["255.255.255.255", 4294967295n],
  ])("IPv4 %s", (metin, beklenen) => {
    expect(ipAyristir(metin as string).deger).toBe(beklenen);
    expect(ipYaz(beklenen as bigint, 4)).toBe(metin);
  });

  it.each([
    ["::", "::"],
    ["::1", "::1"],
    ["2a01:1b0::", "2a01:1b0::"],
    ["2001:db8:0:0:0:0:0:1", "2001:db8::1"],
    ["2a02:ff0:1234:5678:9abc:def0:1234:5678", "2a02:ff0:1234:5678:9abc:def0:1234:5678"],
  ])("IPv6 %s → %s", (girdi, beklenenYazim) => {
    const { deger, surum } = ipAyristir(girdi as string);
    expect(surum).toBe(6);
    expect(ipYaz(deger, 6)).toBe(beklenenYazim);
  });

  it("geçersiz IPv4 hata veriyor", () => {
    expect(() => ipAyristir("1.2.3")).toThrow();
    expect(() => ipAyristir("1.2.3.999")).toThrow();
  });
});

describe("aralık → CIDR bölme", () => {
  it("tam blok tek CIDR olur", () => {
    const b = ipAyristir("5.1.2.0").deger;
    const s = ipAyristir("5.1.2.255").deger;
    expect(araligiCidrlereBol(b, s, 4)).toEqual(["5.1.2.0/24"]);
  });

  it("tek adres /32 olur", () => {
    const b = ipAyristir("8.8.8.8").deger;
    expect(araligiCidrlereBol(b, b, 4)).toEqual(["8.8.8.8/32"]);
  });

  it("hizasız aralık birden çok bloğa bölünür ve aralığı AŞMAZ", () => {
    const b = ipAyristir("1.0.0.1").deger;
    const s = ipAyristir("1.0.0.6").deger;
    const cidrler = araligiCidrlereBol(b, s, 4);
    expect(cidrler).toEqual(["1.0.0.1/32", "1.0.0.2/31", "1.0.0.4/31", "1.0.0.6/32"]);
    // Kapsama kontrolü: bloklar tam olarak [b, s] aralığını örtmeli
    let toplam = 0n;
    for (const c of cidrler) toplam += 1n << (32n - BigInt(c.split("/")[1]));
    expect(toplam).toBe(s - b + 1n);
  });

  it("IPv6 aralığı bölünebiliyor", () => {
    const b = ipAyristir("2a01:1b0::").deger;
    const s = ipAyristir("2a01:1b7:ffff:ffff:ffff:ffff:ffff:ffff").deger;
    expect(araligiCidrlereBol(b, s, 6)).toEqual(["2a01:1b0::/29"]);
  });
});

describe("tablo üretimi", () => {
  const ORNEK = [
    "1.0.0.0,1.0.0.255,AU",
    "5.1.2.0,5.1.2.255,TR",
    "8.8.8.0,8.8.8.255,US",
    "95.108.213.0,95.108.213.255,RU",
    "188.49.0.0,188.49.255.255,SA",
    "2a01:1b0::,2a01:1b7:ffff:ffff:ffff:ffff:ffff:ffff,TR",
    "bozuk,satir",
    "9.9.9.9,geçersiz,TR",
  ].join("\n");

  it("yalnız istenen ülkeler tabloya giriyor", () => {
    const { satirlar } = tabloUret(ORNEK, ["TR", "RU", "SA"]);
    expect(satirlar).toContain("    5.1.2.0/24 TR;");
    expect(satirlar).toContain("    95.108.213.0/24 RU;");
    expect(satirlar).toContain("    188.49.0.0/16 SA;");
    expect(satirlar).toContain("    2a01:1b0::/29 TR;");
    expect(satirlar.join("\n")).not.toContain(" AU;");
    expect(satirlar.join("\n")).not.toContain(" US;");
  });

  it("bozuk kayıt üretimi DURDURMUYOR, sayılıyor", () => {
    // 717 bin satırlık veride tek bozuk kayıt yüzünden tabloyu hiç
    // üretememek, o kaydı kaybetmekten daha kötü olurdu.
    const { satirlar, atlanan } = tabloUret(ORNEK, ["TR", "RU", "SA"]);
    expect(satirlar.length).toBeGreaterThan(0);
    expect(atlanan).toBe(1); // "9.9.9.9,geçersiz,TR" — "bozuk,satir" 3 alan değil, hiç sayılmaz
  });

  it("hiç eşleşme yoksa boş döner (sessizce yanlış üretmez)", () => {
    expect(tabloUret(ORNEK, ["ZZ"]).satirlar).toEqual([]);
  });
});

describe("blok kurma ve şablona yerleştirme", () => {
  const SATIRLAR = ["    5.1.2.0/24 TR;", "    95.108.213.0/24 RU;"];

  it("blok atıf ve varsayılan taşıyor", () => {
    const blok = bloguKur(SATIRLAR, "2026-09");
    expect(blok).toContain("DB-IP");
    expect(blok).toContain("CC BY 4.0");
    expect(blok).toContain("geo $ulke_kodu {");
    expect(blok).toContain('default "";');
    expect(blok).toContain("2026-09 · 2 kayıt");
  });

  it("şablonda blok yokken `server {` bloğundan ÖNCE açılıyor", () => {
    const sablon = "map $a $b {\n  default 1;\n}\n\nserver {\n  listen 80;\n}\n";
    const cikti = sablonaYerlestir(sablon, bloguKur(SATIRLAR, "2026-09"));
    expect(cikti.indexOf(BLOK_BASI)).toBeLessThan(cikti.indexOf("server {"));
    expect(cikti).toContain("map $a $b {"); // mevcut içerik korunuyor
  });

  it("ikinci koşumda blok ÇİFTLENMİYOR, değiştiriliyor", () => {
    const sablon = "server {\n  listen 80;\n}\n";
    const bir = sablonaYerlestir(sablon, bloguKur(SATIRLAR, "2026-09"));
    const iki = sablonaYerlestir(bir, bloguKur(SATIRLAR, "2026-10"));
    expect(iki.split(BLOK_BASI).length - 1).toBe(1);
    expect(iki).toContain("2026-10");
    expect(iki).not.toContain("2026-09");
  });

  it("blok başı var sonu yoksa NET hata (sessizce bozmuyor)", () => {
    expect(() => sablonaYerlestir(`${BLOK_BASI}\nyarim`, "x")).toThrow(/sonu yok/);
  });

  it("`bloguOku` yazılan bloğu aynen geri veriyor (--check bunun üstünde çalışır)", () => {
    const blok = bloguKur(SATIRLAR, "2026-09");
    const sablon = sablonaYerlestir("server {\n}\n", blok);
    expect(bloguOku(sablon)).toBe(blok);
    expect(bloguOku("server {\n}\n")).toBeNull();
  });
});

describe("veri ayı seçimi", () => {
  it("bu ay ve önceki ay doğru biçimde üretiliyor", () => {
    const t = new Date(Date.UTC(2026, 0, 3)); // 3 Ocak 2026
    expect(aydanAy(t, 0)).toBe("2026-01");
    expect(aydanAy(t, 1)).toBe("2025-12"); // yıl sınırı
  });
});

describe("üretilen tablo nginx.conf.template'te GERÇEKTEN var", () => {
  const sablon = readFileSync(join(KOK, "nginx.conf.template"), "utf8");

  it("blok şablonda mevcut", () => {
    expect(sablon).toContain(BLOK_BASI);
    expect(sablon).toContain(BLOK_SONU);
  });

  it("`COUNTRY_LANG_MAP`'teki HER ülke tabloda temsil ediliyor", () => {
    // Denetim: haritaya ülke eklenip tablo üretilmezse burası kırmızı olur.
    const blok = bloguOku(sablon) ?? "";
    const eksik = Object.keys(COUNTRY_LANG_MAP).filter((k) => !blok.includes(` ${k};`));
    expect(eksik, `tabloda karşılığı olmayan ülkeler: ${eksik.join(", ")}`).toEqual([]);
  });

  it("varsayılan boş — eşleşmeyen IP 'bilmiyorum'a düşer", () => {
    expect(bloguOku(sablon)).toContain('default "";');
  });
});
