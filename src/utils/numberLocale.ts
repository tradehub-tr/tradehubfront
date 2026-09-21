/**
 * Arayüz dili → sayı biçimlendirme yereli.
 *
 * NEDEN VAR: `getCurrentLang() === "en" ? "en-US" : "tr-TR"` deseni Arapça ve
 * Rusça ziyaretçiye TÜRKÇE sayı biçimi veriyordu (`1.234`). Rusçada binlik
 * ayırıcı BOŞLUKTUR ve nokta ondalık gibi okunabilir — yani `1.234` bir Rus
 * için "bin iki yüz otuz dört" değil "bir tam iki yüz otuz dört" görünümünde.
 *
 * ÖLÇÜLDÜ (21 Eyl 2026, gerçek tarayıcı, `toLocaleString`):
 *
 *   tr-TR → 1.234 · 45.678
 *   en-US → 1,234 · 45,678
 *   ar    → 1,234 · 45,678     ← Latin rakam
 *   ar-SA → ١٬٢٣٤ · ٤٥٬٦٧٨     ← Doğu Arap rakamı
 *   ru-RU → 1 234 · 45 678
 *
 * Arapça için BÖLGESİZ `"ar"` kullanılıyor: bölgeli `ar-SA`/`ar-EG` Doğu Arap
 * rakamı (٣٤٥) üretir ve bir B2B pazaryerinde ürün/sipariş sayılarının o
 * rakamlarla çıkması istenmiyor. Bu bilinçli bir karar — bölge kodu eklenecekse
 * önce hangi rakam kümesinin isteneceği kararlaştırılmalı.
 *
 * KAPSAM — 21 Eylül 2026'da GENİŞLETİLDİ (kullanıcı kararı D1).
 *
 * Bu yorum eskiden *"PARA biçimlendirmesi `currency.ts`'in işi, burayı oraya
 * uygulama"* diyordu. O kural kaldırıldı çünkü kod tabanı kendi içinde
 * çelişiyordu: lojistik modülü tutarı ARAYÜZ diline bağlıyordu
 * (`presentation.ts` → `bicimYereli()`), `currency.ts` ise sabitliyordu. Aynı
 * ekranda lojistik tutarı Rusça biçimde, ürün fiyatı Türkçe biçimde
 * çıkabiliyordu.
 *
 * Üstelik `currency.ts`'teki sabitleme bir NUMARAYDI: TL biçimini elde etmek
 * için ALMANCA yerel (`de-DE`) kullanılıyordu, çünkü Almanca da `1.234,56`
 * yazıyor. Yani kod "Almanca" diyor ama "Türk Lirası biçimi" kastediyordu —
 * okuyan herkesin yanılacağı bir satır.
 *
 * KARAR: sayaç, tarih ve PARA — üçü de arayüz diline bağlanır.
 * Para birimi SEMBOLÜ (₺/$/€) elbette para birimine bağlı kalır; dile bağlanan
 * yalnız BİÇİM (binlik/ondalık ayıracı ve sıralama).
 */
import { getCurrentLang } from "../i18n";

/** Arayüz dil kodu → `Intl` yereli. Bilinmeyen dil Türkçeye düşer. */
const YEREL: Record<string, string> = {
  tr: "tr-TR",
  en: "en-US",
  ar: "ar",
  ru: "ru-RU",
};

/** Aktif arayüz dilinin sayı yereli. */
export function aktifSayiYereli(): string {
  return YEREL[getCurrentLang()] ?? YEREL.tr;
}

/** Bir sayacı aktif arayüz dilinin biçiminde yazar. */
export function sayiBicimle(n: number): string {
  return n.toLocaleString(aktifSayiYereli());
}

/**
 * Bir tutarı aktif arayüz dilinin biçiminde yazar — SEMBOLSÜZ.
 *
 * Sembolü çağıran ekler (`${symbol}${paraBicimle(n)}`) çünkü sembolün yeri
 * dile göre değişiyor: Rusçada tutar sonrası (`1 234,56 ₺`), Türkçe ve
 * İngilizcede tutar öncesi. Tek bir `style: "currency"` çağrısı bunu kendi
 * halleder ama para birimi KODUNU da ister; `currency.ts` bazı yerlerde
 * yalnız sembol taşıyor, kod taşımıyor.
 */
export function paraBicimle(n: number, secenekler?: Intl.NumberFormatOptions): string {
  return n.toLocaleString(aktifSayiYereli(), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...secenekler,
  });
}

/**
 * Tam sayı tutarda kesir kuyruğunu atar — `1.234,00` yerine `1.234`.
 *
 * Kuyruğu düz metin olarak (`,00` / `.00`) kesmek YANLIŞ: ondalık ayıracı
 * yerele göre değişiyor, Rusçada `,` Türkçede `,` İngilizcede `.`. Sabit bir
 * dize aramak, yerel değişince sessizce çalışmaz olur. Onun yerine sayının
 * kendisine bakılıyor.
 */
export function paraBicimleKisa(n: number): string {
  return Number.isInteger(n)
    ? n.toLocaleString(aktifSayiYereli(), { maximumFractionDigits: 0 })
    : paraBicimle(n);
}

/** Tarih + saati aktif arayüz dilinin biçiminde yazar. */
export function tarihSaatBicimle(
  d: Date | string | number,
  secenekler?: Intl.DateTimeFormatOptions
): string {
  const t = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(t.getTime())) return "";
  return t.toLocaleString(aktifSayiYereli(), secenekler);
}

/** Bir tarihi aktif arayüz dilinin biçiminde yazar. */
export function tarihBicimle(
  d: Date | string | number,
  secenekler?: Intl.DateTimeFormatOptions
): string {
  const t = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(t.getTime())) return "";
  return t.toLocaleDateString(aktifSayiYereli(), secenekler);
}

/**
 * Biçimlendiricileri Alpine ifadelerinin görebileceği yere koyar.
 *
 * NEDEN GEREKLİ: bazı ekranlar Alpine `x-data`/`x-text` ifadelerini TEMPLATE
 * STRING içinde yazıyor (ör. `CompanyProfile.ts`, `OrdersPageLayout.ts`).
 * O metin tarayıcıda Alpine tarafından değerlendiriliyor; modül import'ları
 * oraya ulaşmıyor. TypeScript de fark etmiyor — import "kullanılmıyor" görünür
 * ve silinirse ekran çalışma anında patlar.
 *
 * `window.__thDil` deseninin kardeşi; aynı gerekçeyle global.
 */
export function bicimleyicileriYayinla(): void {
  (window as unknown as { __thBicim?: unknown }).__thBicim = {
    sayi: sayiBicimle,
    para: paraBicimle,
    paraKisa: paraBicimleKisa,
    tarih: tarihBicimle,
    tarihSaat: tarihSaatBicimle,
  };
}
