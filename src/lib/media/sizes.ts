/**
 * `sizes` tablosu — TÜRETİLMİŞ VERİ, ELLE DÜZENLENMEZ.
 *
 * KAYNAK
 * ------
 * Bu dosyadaki her dizge `tradehub_core` deposunda şu komutun çıktısıdır:
 *
 *     python3 -m tradehub_core.media.pipeline.delivery.sizes
 *
 * O modül dizgeleri `media/pipeline/simulator/placements.json`'daki gerçek
 * kutu kuralından türetir ve `docs/reports/03-render-envanteri.md` §3'teki
 * ELLE ÖLÇÜLMÜŞ piksel tablosuna karşı doğrular. Bu depoya kopyalandığı andaki
 * doğrulama sonucu: **71 satır denetlendi, açıklanmamış sapma 0**
 * (tek bilinen sapma `product_detail/related_slider` @390px — Swiper'ın
 * `(n−1) × spaceBetween` formülü, rapor tek boşluk düşüyor).
 *
 * NEDEN BURADA SABİT, BACKEND'DEN GELMİYOR
 * ----------------------------------------
 * Manifest ucu (`get_manifest`) her görsel için bir `sizes` taşıyor ama o
 * değer SLOT bazlı (`product.image`); oysa aynı slot ürün detayda 502px,
 * listeleme kartında 226px, sepet satırında 40px kutuya oturuyor. Kutuyu
 * bilen taraf CSS'i yazan taraftır — yani burası. `ResponsiveImage` bu
 * tablodaki değeri manifestinkinin ÜSTÜNE yazar (`picture.py`'deki
 * `PictureOptions.sizes` ile aynı öncelik).
 *
 * GÜNCELLEME KURALI
 * -----------------
 * Bir ızgaranın sütun sayısı / boşluğu / kapsayıcı genişliği değiştiğinde bu
 * dosya KENDİLİĞİNDEN yanlış olur ve hiçbir hata çıkmaz: tarayıcı sessizce
 * yanlış basamağı indirir. Değişikliği `placements.json`'a da işleyip komutu
 * yeniden çalıştırın, çıktıyı buraya kopyalayın.
 *
 * Son eşitleme: 2026-08-18.
 */

/** `placements.json`'daki `sayfa/bölge` anahtarları. */
export type MediaSizesRegion =
  | "cart_checkout/drawer_thumb"
  | "cart_checkout/product_item"
  | "cart_checkout/sku_row"
  | "cart_checkout/summary_strip"
  | "home/hero_showcase_grid"
  | "home/tailored_grid"
  | "home/top_deals"
  | "listing/brand_grid"
  | "listing/card_grid"
  | "product_detail/lightbox_main"
  | "product_detail/lightbox_thumb"
  | "product_detail/main_image"
  | "product_detail/related_slider"
  | "product_detail/thumb_rail"
  | "seller_shop/product_grid";

/**
 * Bölge → `sizes` özniteliği. Değerler yukarıdaki komutun çıktısının birebir
 * kopyasıdır; satır sırası da komutun (alfabetik) sırasıdır ki gelecekteki
 * eşitlemede `diff` okunabilir kalsın.
 */
export const MEDIA_SIZES: Readonly<Record<MediaSizesRegion, string>> = {
  "cart_checkout/drawer_thumb": "(min-width: 480px) 64px, 56px",
  "cart_checkout/product_item": "(min-width: 480px) 60px, 40px",
  "cart_checkout/sku_row": "(min-width: 480px) 40px, 36px",
  "cart_checkout/summary_strip": "(min-width: 480px) 64px, (min-width: 380px) 56px, 48px",
  "home/hero_showcase_grid":
    "(min-width: 1536px) calc((min(100vw, 1840px) - 64px - 96px) / 7), " +
    "(min-width: 1024px) calc((min(100vw, 1840px) - 32px - 80px) / 6), " +
    "(min-width: 768px) calc((min(100vw, 1840px) - 32px - 48px) / 4), " +
    "(min-width: 640px) calc((min(100vw, 1840px) - 32px - 32px) / 3), " +
    "calc((min(100vw, 1840px) - 32px - 16px) / 2)",
  "home/tailored_grid":
    "(min-width: 1536px) calc((min(100vw, 1840px) - 64px - 64px) / 5), " +
    "(min-width: 1024px) calc((min(100vw, 1840px) - 32px - 64px) / 5), " +
    "(min-width: 768px) calc((min(100vw, 1840px) - 32px - 48px) / 4), " +
    "(min-width: 640px) calc((min(100vw, 1840px) - 32px - 24px) / 3), " +
    "calc((min(100vw, 1840px) - 32px - 12px) / 2)",
  "home/top_deals":
    "(min-width: 1536px) calc((min(100vw, 1840px) - 64px - 80px) / 6), " +
    "(min-width: 1000px) calc((min(100vw, 1840px) - 32px - 80px) / 6), " +
    "(min-width: 850px) calc((min(100vw, 1840px) - 32px - 64px) / 5), " +
    "(min-width: 768px) calc((min(100vw, 1840px) - 32px - 48px) / 4), " +
    "(min-width: 550px) calc((min(100vw, 1840px) - 32px - 24px) / 3), " +
    "(min-width: 480px) calc((min(100vw, 1840px) - 32px - 12px) / 2), " +
    "calc((min(100vw, 1840px) - 32px - 8px) / 2)",
  "listing/brand_grid":
    "(min-width: 1536px) calc((min(100vw, 1840px) - 64px - 64px) / 5), " +
    "(min-width: 1280px) calc((min(100vw, 1840px) - 32px - 64px) / 5), " +
    "(min-width: 768px) calc((min(100vw, 1840px) - 32px - 32px) / 3), " +
    "calc((min(100vw, 1840px) - 32px - 16px) / 2)",
  "listing/card_grid":
    "(min-width: 1536px) calc((min(100vw, 1840px) - 64px - 344px) / 5), " +
    "(min-width: 1280px) calc((min(100vw, 1840px) - 32px - 344px) / 5), " +
    "(min-width: 1024px) calc((min(100vw, 1840px) - 32px - 312px) / 3), " +
    "(min-width: 768px) calc((min(100vw, 1840px) - 32px - 296px) / 3), " +
    "calc((min(100vw, 1840px) - 32px - 16px) / 2)",
  // Kutusu viewport YÜKSEKLİĞİNE bağlı; `sizes` yüksekliği koşul olarak
  // ifade edemez ama `vh` birimini değer olarak taşıyabilir.
  "product_detail/lightbox_main": "calc(min(82vh, 720px) - 84px)",
  "product_detail/lightbox_thumb": "52px",
  "product_detail/main_image":
    "(min-width: 1536px) 502px, (min-width: 1280px) 377px, (min-width: 1024px) 300px, 100vw",
  "product_detail/related_slider":
    "(min-width: 1280px) calc((min(100vw, 1736px) - 490px - 64px) / 5), " +
    "(min-width: 1024px) calc((min(100vw, 1736px) - 348px - 48px) / 4), " +
    "(min-width: 960px) calc((min(100vw, 1840px) - 32px - 48px) / 4), " +
    "(min-width: 640px) calc((min(100vw, 1840px) - 32px - 28px) / 3), " +
    "(min-width: 480px) calc((min(100vw, 1840px) - 32px - 14.4px) / 2.2), " +
    "calc((min(100vw, 1840px) - 32px - 4.8px) / 1.4)",
  "product_detail/thumb_rail": "70px",
  "seller_shop/product_grid":
    "(min-width: 1024px) calc((min(100vw, 1200px) - 64px - 96px) / 4), " +
    "(min-width: 768px) calc((min(100vw, 1200px) - 64px - 64px) / 3), " +
    "(min-width: 480px) calc((min(100vw, 1200px) - 32px - 64px) / 3), " +
    "calc((min(100vw, 1200px) - 32px - 48px) / 2)",
};

/**
 * Bölgenin `sizes` dizgesi. Tanınmayan anahtar boş dizge döner — UYDURMAZ.
 *
 * Boş `sizes` bir eksiklik BİLDİRİMİDİR: `ResponsiveImage` o durumda
 * manifestin kendi `sizes`ine düşer, o da boşsa öznitelik hiç yazılmaz
 * (tarayıcı `100vw` varsayar). Yanlış bir dizge yazmak yerine hiç yazmamak,
 * en azından ölçümde görünür kalır.
 */
export function mediaSizesFor(region: string): string {
  return MEDIA_SIZES[region as MediaSizesRegion] ?? "";
}
