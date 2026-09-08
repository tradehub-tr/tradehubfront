/**
 * Platform tespiti — App Store uyum bayrağı (Abonelik İptali + App Store Uyum
 * Paketi, FE-1).
 *
 * `isIosApp()` true iken hiçbir satış yüzeyi render edilmez: paket kartı,
 * paket fiyatı, "abone ol / ücretsiz dene" CTA'sı, havale-IBAN bilgisi
 * (Apple Guideline 3.1.1/3.1.3 anti-steering). iOS copy'lerinde harici
 * ödemeye HİÇBİR atıf yapılmaz ("web sitemizden yönetin" dahil).
 *
 * İki sinyal (OR):
 *  1. Capacitor bridge — storefront bundle'ı native'de çalışırken.
 *  2. UA işareti "istocApp/ios" — capacitor.config.ts `ios.appendUserAgent`
 *     build-time ekler; bridge'in garanti olmadığı webview yüzeylerinde
 *     (ör. /panel admin-panel) tek güvenilir ortak sinyal.
 *
 * UA spoofing güvenlik sınırı değildir — bu bayrak yalnız görsel uyum içindir;
 * gerçek yetki kararları her zaman backend'de verilir.
 */
import { Capacitor } from "@capacitor/core";

export function isIosApp(): boolean {
  try {
    if (Capacitor.getPlatform() === "ios") return true;
  } catch {
    /* Capacitor bridge yoksa UA fallback'ine düş */
  }
  return typeof navigator !== "undefined" && navigator.userAgent.includes("istocApp/ios");
}
