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
 * ⚠ KAPSAM: bu yardımcı SAYAÇLAR içindir (ürün adedi, sıralama). PARA
 * biçimlendirmesi `utils/currency.ts`'in işi ve orada bilinçli olarak sabit
 * yereller kullanılıyor (`de-DE`, `en-US`) — para birimi gösterimi arayüz
 * diline bağlı değildir, para birimine bağlıdır. Burayı oraya uygulama.
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
