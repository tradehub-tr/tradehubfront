/**
 * Ülke tablosu üretecinin tip bildirimleri.
 *
 * Neden ayrı dosya: üreteç düz `.mjs` — Node'un doğrudan çalıştırabilmesi için
 * (derleme adımı olmadan `node scripts/ulke-tablosu-uret.mjs`). Ama birim
 * testleri TypeScript ve `strict` açık; tipsiz bir modülü import etmek
 * `tsc --noEmit`'te TS7016 veriyor. Bildirimler burada durunca hem script
 * derlemesiz kalıyor hem testler tip güvenli oluyor.
 */

export declare const BLOK_BASI: string;
export declare const BLOK_SONU: string;

/** `COUNTRY_LANG_MAP`'teki ülke kodlarını kaynak metinden ayrıştırır. */
export declare function ulkeleriOku(tsKaynak: string): string[];

/** "1.2.3.4" ya da "2a01:1b0::" → sayısal değer ve IP sürümü. */
export declare function ipAyristir(metin: string): { deger: bigint; surum: 4 | 6 };

/** Sayısal değeri IP metnine çevirir; IPv6'da `::` kısaltması uygulanır. */
export declare function ipYaz(deger: bigint, surum: 4 | 6): string;

/** [bas, son] kapalı aralığını en az sayıda CIDR bloğuna böler. */
export declare function araligiCidrlereBol(bas: bigint, son: bigint, surum: 4 | 6): string[];

/** DB-IP CSV metninden `geo` satırlarını üretir; bozuk kayıtları sayar. */
export declare function tabloUret(
  csvMetni: string,
  ulkeler: string[]
): { satirlar: string[]; atlanan: number };

/** `geo` bloğunu başlık, atıf ve varsayılan değerle birlikte kurar. */
export declare function bloguKur(satirlar: string[], veriAyi: string): string;

/** Bloğu şablona yerleştirir; varsa tümüyle değiştirir, yoksa açar. */
export declare function sablonaYerlestir(sablon: string, blok: string): string;

/** Şablondaki mevcut bloğu döndürür; yoksa null. */
export declare function bloguOku(sablon: string): string | null;

/** `YYYY-MM` biçiminde ay; `geri` kadar önceki ay. */
export declare function aydanAy(tarih?: Date, geri?: number): string;
