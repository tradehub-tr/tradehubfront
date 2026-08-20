/**
 * Lighthouse CI (FE-2) — CWV bütçe takibi.
 *
 * Koşum (lokal): LHCI_COLLECT_URL=https://preview.example.com npx -y @lhci/cli autorun --config=lighthouserc.cjs
 * Jenkins'te NON-BLOCKING stage olarak koşulur (plan JNK-1 notu) — kırmızı
 * skor build'i düşürmez, trend raporu üretir.
 *
 * Hedefler (plan FAZ 2 / CWV): LCP < 2.5s, CLS < 0.1, TBT < 300ms.
 */
const collectBaseUrl = (
  process.env.LHCI_COLLECT_URL ||
  process.env.PERF_BASE_URL ||
  "http://traderup.localhost"
).replace(/\/$/, "");
// İlk kabul koşularında warning olarak kalır. Baseline olgunlaştıktan sonra CI
// işi `LHCI_ASSERT_MODE=strict` ile çağırır; takvim/sprint tarihi kodlanmaz.
const assertionLevel = process.env.LHCI_ASSERT_MODE === "strict" ? "error" : "warn";

/**
 * Ürün detay sayfası bir ürün kimliği İSTER (`product-detail.ts:92` → `?id=`).
 * Kimliksiz çağrıldığında sayfa boş-durum ekranını basar ("Aradığınız ürün
 * mevcut değil…") ve Lighthouse o ekranı ölçer — yani ürün detayının gerçek
 * başarımı ÖLÇÜLMEMİŞ olur. 2026-08-20 koşumunda tam olarak bu oldu: LCP
 * düğümünün metni boş-durum cümlesiydi (docs/reports/62 §T-124).
 *
 * Varsayılan kimlik canlı veritabanından alındı (Active bir Listing). Ortama
 * göre değişebileceği için değiştirilebilir bırakıldı; kimlik geçersizse
 * sayfa yine boş durumu basar, o yüzden koşum çıktısında LCP düğümünün
 * gerçekten ürün görseli olduğu KONTROL EDİLMELİ.
 */
const detailListingId = process.env.LHCI_LISTING_ID || "LST-00202";

module.exports = {
  ci: {
    collect: {
      url: [
        `${collectBaseUrl}/`,
        `${collectBaseUrl}/pages/products.html`,
        `${collectBaseUrl}/pages/product-detail.html?id=${detailListingId}`,
        // Kategori sayfası kabul kapsamında DEĞİLDİ ve ilk kez 2026-08-20'de
        // ölçüldü: CLS 0,5396 — bütçenin 5,4 katı, üç koşumda da bit-aynı.
        // 0,5394'ü tek bir `<footer>` düğümünden geliyor (docs/reports/62 §T-004).
        // Ölçülmeyen sayfa "geçti" sayılamaz; kapsama alındı.
        `${collectBaseUrl}/pages/categories.html`,
      ],
      numberOfRuns: 3,
      settings: { preset: "desktop" },
    },
    assert: {
      assertions: {
        "largest-contentful-paint": [assertionLevel, { maxNumericValue: 2500 }],
        "cumulative-layout-shift": [assertionLevel, { maxNumericValue: 0.1 }],
        "total-blocking-time": [assertionLevel, { maxNumericValue: 300 }],
        "categories:performance": [assertionLevel, { minScore: 0.8 }],
        "categories:seo": [assertionLevel, { minScore: 0.9 }],
      },
    },
    upload: { target: "filesystem", outputDir: "./perf-reports/lhci" },
  },
};
