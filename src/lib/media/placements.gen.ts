// ÜRETİLMİŞ DOSYA — ELLE DÜZENLEME.
// Kaynak: tradehub_core/tradehub_core/media/pipeline/simulator/placements.json (preview_places)
// Üretici (tradehub_core kökünde): python3 -m tradehub_core.media.pipeline.delivery.sizes --emit-placements storefront > ../tradehubfront/src/lib/media/placements.gen.ts

/** Önizleme penceresiyle ORTAK yerlerin `sizes` dizgeleri. */
export const STORE_PLACE_SIZES = {
  galleryMain: "(min-width: 768px) 500px, 100vw",
  galleryThumb: "120px",
  manufacturerGallery: "(min-width: 1024px) 220px, 165px",
  shopHeaderLogoDesktop: "140px",
  shopHeaderLogoMobile: "48px",
} as const;
