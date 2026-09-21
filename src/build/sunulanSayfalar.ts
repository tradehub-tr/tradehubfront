/**
 * SUNULAN SAYFALAR — ziyaretçiye giden HTML'lerin tek listesi.
 *
 * Neden ayrı modül: bu listeyi iki yer okuyor — Vite'ın build girdileri
 * (`vite.config.ts`) ve sayfa başlığı denetimi
 * (`src/i18n/__tests__/sayfaBasligiDenetimi.test.ts`). Liste iki yerde
 * kopyalanırsa biri sessizce bayatlar: denetim, build'in derlediği bir
 * sayfayı görmemeye başlar ve o sayfa denetimsiz kalır.
 *
 * Ölçüldü (21 Eyl 2026): denetim kendi kara listesini tutarken E2E koşusunun
 * ürettiği `test-results/` altındaki 69 trace HTML'ini "sunulan sayfa" sandı
 * ve iki test kırıldı. Kara liste her yeni üretilen klasörde güncellenmek
 * zorunda; beyaz liste (build ne derliyorsa o) kendiliğinden doğru kalır.
 *
 * NOT: `fast-glob` varsayılan olarak nokta ile başlayan dizinleri atlar,
 * bu yüzden `.lighthouseci/` gibi klasörler ayrıca elenmiyor — ölçüldü.
 */
import fg from "fast-glob";

/** Build'e ve denetime girmeyecek yollar. Gerekçeler satır satır. */
export const SAYFA_HARICLERI = [
  "node_modules/**",
  "dist/**",
  "ios/**",
  "android/**",
  // Geliştirici aracı — ziyaretçiye gitmiyor
  "**/style-test.html",
  "**/test-*.html",
  // Geliştirici dokümantasyonu build'e/dist'e girmesin (FE-3)
  "docs/**",
  // ANALYZE build'inin ürettiği bundle-stats.html'i build entry olarak ALMA —
  // yoksa kökte varken glob onu yakalayıp dist'e (dolayısıyla prod image'ına +
  // SW precache'e) sokuyor.
  "**/perf-reports/**",
  // Playwright koşum artefaktı. Bugün nokta klasörün altında olduğu için
  // zaten eleniyor; Playwright yerleşimi değiştirirse bu satır tutar.
  "test-results/**",
];

/** Ziyaretçiye sunulan HTML dosyaları — repo köküne göre göreli yollar. */
export function sunulanSayfalar(kok: string = process.cwd()): string[] {
  return fg.sync("**/*.html", { cwd: kok, ignore: SAYFA_HARICLERI });
}
