/**
 * `sizes` tablosu — TÜRETİLMİŞ VERİ, ELLE DÜZENLENMEZ.
 *
 * KAYNAK
 * ------
 * Bu dosyadaki tip birliği + `MEDIA_SIZES` bloğu `tradehub_core` deposunda şu
 * komutun ÇIKTISININ BİREBİR KOPYASIDIR (elle satır satır yazılmaz):
 *
 *     cd tradehub_core
 *     PYTHONPATH=. python3 -m tradehub_core.media.pipeline.delivery.sizes --emit-ts
 *
 * O modül dizgeleri `media/pipeline/simulator/placements.json`'daki gerçek
 * kutu kuralından türetir (`simulator/srcset.py::sizes_attribute`) ve
 * `docs/reports/03-render-envanteri.md` §3'teki ELLE ÖLÇÜLMÜŞ piksel tablosuna
 * karşı doğrular (`python3 -m tradehub_core.media.pipeline.delivery.sizes`,
 * argümansız — `tests/test_delivery_sizes.py` aynısını CI'da sınar).
 *
 * 2026-09-30 (wave 3) — TAM YENİDEN ÜRETİM: storefront kopyası
 * 2026-08-18'den beri elle senkronlanıyordu ve `--emit-ts` komutunun
 * `placements.json`'a işlenmiş iki düzeltmeyi hiç almamıştı:
 *
 * (a) Ana sayfa ızgarasının kırılım noktaları `tradehubfront/src/style.css`
 *     içinde EZİLMİŞ (`--breakpoint-md:640px, --breakpoint-lg:768px,
 *     --breakpoint-xl:1024px` — Tailwind v4 varsayılanları DEĞİL). Derlenmiş
 *     CSS'te doğrulandı: `dist/assets/*.css` içinde `xl\:grid-cols-6` kuralı
 *     `@media(min-width:1024px)` altında çıkıyor. `placements.json`'un
 *     `breakpoints` bloğu bunu zaten doğru modelliyordu — storefront kopyası
 *     geride kalmıştı, kırılım noktalarının KENDİSİ hiçbir zaman yanlış
 *     değildi (2026-09-29 dalga 2 raporundaki "1024'te /6 yazıyor, ızgara 4
 *     sütun" notu, derlenmiş CSS'e bakılmadan varsayılan Tailwind kırılımıyla
 *     kıyaslanmış — yanlış çıkarım; gerçek hata (b)'dir).
 * (b) T-115 kart-kenarlığı düzeltmesi: `shared/ListingCard.ts` sarmalayıcısı
 *     `border` taşıyor, sütun başına 2px. Bu, `placements.json`'a işlenmişti
 *     ama kopyaya hiç gelmemişti — kutu ızgara sütunundan ~2px BÜYÜK
 *     hesaplanıyordu. `sizes` gerçekte olduğundan büyük olunca tarayıcı bazı
 *     viewport/DPR kombinasyonlarında gereğinden bir basamak büyük `srcset`
 *     adayı seçiyordu (bkz.
 *     `.superpowers/sdd/2026-09-29-urun-gorseli-kare/wave3-A-sizes-report.md`).
 *
 * Ayrıca üç bileşendeki (`hero/ProductGrid.ts`,
 * `tailored-selections/TailoredProductGrid.ts`, `top-deals/TopDealsGrid.ts`)
 * `data-media-sizes` öznitelikleri bu tablodan BAĞIMSIZ, elle yazılmış
 * kopyalardı — yalnız geç yükseltmede (`ListingCard.ts` `[data-media-sizes]`
 * fallback'i) devreye giriyorlardı, bu yüzden ilk boyamadaki ölçümlerde
 * fark görünmüyordu. Üçü de `mediaSizesFor(...)` çağrısına çevrildi — tek
 * kaynak bu tablo.
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
 * yeniden çalıştırın, çıktıyı ELLE DÜZENLEMEDEN buraya kopyalayın.
 *
 * BİLİNEN AÇIK (kapsam dışı, 2026-09-30'da regenerate sırasında görüldü):
 * `tradehub_core` tarafında `python3 -m tradehub_core.media.pipeline.delivery.sizes`
 * (argümansız doğrulama) ve `tests/test_delivery_sizes.py` şu an KIRMIZI —
 * T-115 kenarlık düzeltmesi uygulandıktan sonra `docs/reports/03-render-envanteri.md`
 * §3'teki ELLE ÖLÇÜLMÜŞ tablo 2px/4-8px tazelenmemiş (24 açıklanmamış sapma).
 * `--emit-ts` çıktısı bu dosyaya yine de aktarıldı — sapma raporun ESKİ
 * olmasından kaynaklanıyor, üretilen `sizes` doğru tarafta (T-115 sonrası
 * gerçek DOM'u yansıtıyor). Raporu/testi tazelemek backend işi, bu görevin
 * kapsamı dışında.
 *
 * Son eşitleme: 2026-09-30 (tam tablo, `--emit-ts`).
 */

// <üretilmiş:media-sizes> — ELLE DÜZENLEME; `--emit-ts` çıktısı

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

/** Bölge → `sizes` özniteliği (`placements.json` + `srcset.py`'den türetilir). */
export const MEDIA_SIZES: Readonly<Record<MediaSizesRegion, string>> = {
  "cart_checkout/drawer_thumb": "(min-width: 480px) 64px, 56px",
  "cart_checkout/product_item": "(min-width: 480px) 60px, 40px",
  "cart_checkout/sku_row": "(min-width: 480px) 40px, 36px",
  "cart_checkout/summary_strip": "(min-width: 480px) 64px, 56px",
  "home/hero_showcase_grid":
    "(min-width: 1536px) calc((min(100vw, 1840px) - 64px - 110px) / 7), (min-width: 1024px) calc((min(100vw, 1840px) - 32px - 92px) / 6), (min-width: 768px) calc((min(100vw, 1840px) - 32px - 56px) / 4), (min-width: 640px) calc((min(100vw, 1840px) - 32px - 38px) / 3), calc((min(100vw, 1840px) - 32px - 20px) / 2)",
  "home/tailored_grid":
    "(min-width: 1536px) calc((min(100vw, 1840px) - 64px - 64px) / 5), (min-width: 1024px) calc((min(100vw, 1840px) - 32px - 64px) / 5), (min-width: 768px) calc((min(100vw, 1840px) - 32px - 48px) / 4), (min-width: 640px) calc((min(100vw, 1840px) - 32px - 24px) / 3), calc((min(100vw, 1840px) - 32px - 12px) / 2)",
  "home/top_deals":
    "(min-width: 1920px) calc((min(100vw, 1840px) - 64px - 109.5px) / 6), (min-width: 1536px) calc((min(100vw, 1840px) - 64px - 105.5px) / 6), (min-width: 1440px) calc((min(100vw, 1840px) - 32px - 105.5px) / 6), (min-width: 1000px) calc((min(100vw, 1840px) - 32px - 102.5px) / 6), (min-width: 850px) calc((min(100vw, 1840px) - 32px - 84.2px) / 5), (min-width: 768px) calc((min(100vw, 1840px) - 32px - 67.3px) / 4), (min-width: 550px) calc((min(100vw, 1840px) - 32px - 42px) / 3), (min-width: 480px) calc((min(100vw, 1840px) - 32px - 29px) / 2), calc((min(100vw, 1840px) - 32px - 24px) / 2)",
  "listing/brand_grid":
    "(min-width: 1536px) calc((min(100vw, 1840px) - 64px - 64px) / 5), (min-width: 1280px) calc((min(100vw, 1840px) - 32px - 64px) / 5), (min-width: 768px) calc((min(100vw, 1840px) - 32px - 32px) / 3), calc((min(100vw, 1840px) - 32px - 16px) / 2)",
  "listing/card_grid":
    "(min-width: 1536px) calc((min(100vw, 1840px) - 64px - 344px) / 5), (min-width: 1280px) calc((min(100vw, 1840px) - 32px - 344px) / 5), (min-width: 1024px) calc((min(100vw, 1840px) - 32px - 312px) / 3), (min-width: 768px) calc((min(100vw, 1840px) - 32px - 296px) / 3), (min-width: 480px) calc((min(100vw, 1840px) - 32px - 16px) / 2), calc((min(100vw, 1840px) - 32px - 20px) / 2)",
  "product_detail/lightbox_main": "calc(min(82vh, 720px) - 84px)",
  "product_detail/lightbox_thumb": "52px",
  "product_detail/main_image":
    "(min-width: 1536px) 502px, (min-width: 1280px) 377px, (min-width: 1024px) 300px, 100vw",
  "product_detail/related_slider":
    "(min-width: 1280px) calc((min(100vw, 1736px) - 490px - 64px) / 5), (min-width: 1024px) calc((min(100vw, 1736px) - 348px - 48px) / 4), (min-width: 960px) calc((min(100vw, 1840px) - 32px - 48px) / 4), (min-width: 640px) calc((min(100vw, 1840px) - 32px - 28px) / 3), (min-width: 480px) calc((min(100vw, 1840px) - 32px - 14.4px) / 2.2), calc((min(100vw, 1840px) - 32px - 4.8px) / 1.4)",
  "product_detail/thumb_rail": "70px",
  "seller_shop/product_grid":
    "(min-width: 1024px) calc((min(100vw, 1200px) - 64px - 338px) / 4), (min-width: 768px) calc((min(100vw, 1200px) - 64px - 306px) / 3), (min-width: 480px) calc((min(100vw, 1200px) - 32px - 66px) / 3), calc((min(100vw, 1200px) - 32px - 50px) / 2)",
};

// </üretilmiş:media-sizes>

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
