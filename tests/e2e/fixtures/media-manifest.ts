/**
 * T-141 medya E2E'leri için ORTAK KURGU — `get_manifest_batch` gövdesi üretici.
 *
 * Neden ayrı dosya: T-141'in vitrin tarafındaki senaryolarının hepsi aynı iki
 * ucu kurguluyor (`get_listing_detail` + `media_manifest.get_manifest_batch`).
 * Kurguyu her spec'te tekrar yazmak, gövde şeması değiştiğinde üç dosyada üç
 * ayrı yalan bırakırdı.
 *
 * Şema kaynağı — UYDURULMADI:
 *   · `src/lib/media/manifest.ts` (`MediaListingManifest`, `MediaImageManifest`)
 *   · Backend `tradehub_core/api/media_manifest.py::get_manifest_batch`
 *   · `_partiGetir()` gövdeyi `body.message.manifests[<ilan>]` altından okur ve
 *     `message.enabled === false` görürse OTURUM BOYUNCA bir daha istek atmaz.
 *
 * Bu dosya mevcut hiçbir fixture'ı değiştirmez; yalnız yenisini ekler.
 */

/** `MediaManifestSource` — bir biçim ailesinin srcset'i. */
export interface KurguKaynak {
  type: string;
  srcset: string;
  sizes: string;
}

/** `MediaImageManifest` — tek görselin teslim manifesti. */
export interface KurguGorselManifesti {
  slot_key: string;
  src: string;
  sizes: string;
  alt: string;
  loading: string;
  decoding: string;
  fetchpriority: string;
  width: number;
  height: number;
  aspect_ratio: number;
  sources: KurguKaynak[];
}

/** `MediaManifestImage` — galeri kaydı. `manifest: null` = "türev henüz yok". */
export interface KurguGorsel {
  file_url: string;
  alt_text: string;
  primary: boolean;
  asset: string;
  manifest: KurguGorselManifesti | null;
}

/**
 * `sizes` dizgesi — `lib/media/sizes.ts::mediaSizesFor` çağıranda EZİYOR, yani
 * manifestinki yalnız yedek. Yine de gerçekçi bir değer veriyoruz.
 */
const VARSAYILAN_SIZES = "(max-width: 1023px) 100vw, 800px";

/**
 * Bir görselin türev manifestini kur.
 *
 * @param fileUrl  Ham dosya adresi — ilan `<img src>`inde bunu taşır.
 * @param genislikler  Üretilmiş türev genişlikleri (srcset descriptor'ları).
 * @param olcu  Türevin İÇSEL ölçüsü: [genişlik, yükseklik]. `ResponsiveImage`
 *              ölçü yoksa üretimi DURDURUR (CLS kuralı), bu yüzden zorunlu.
 */
export function gorselManifesti(
  fileUrl: string,
  genislikler: number[],
  olcu: [number, number],
  ekler: Partial<KurguGorselManifesti> = {}
): KurguGorselManifesti {
  const taban = fileUrl.replace(/\.[a-z0-9]+$/i, "");
  const srcsetFor = (uzanti: string): string =>
    genislikler.map((w) => `${taban}-${w}.${uzanti} ${w}w`).join(", ");
  const [w, h] = olcu;
  return {
    slot_key: "product.image",
    src: `${taban}-${genislikler[genislikler.length - 1]}.jpg`,
    sizes: VARSAYILAN_SIZES,
    alt: "",
    loading: "eager",
    decoding: "sync",
    fetchpriority: "high",
    width: w,
    height: h,
    aspect_ratio: h ? w / h : 0,
    // Biçim sırası backend `FORMAT_ORDER` ile aynı: AVIF → WebP → JPEG.
    // `ResponsiveImage` SONUNCUYU `<img srcset>`e, kalanını `<source>`a basar.
    sources: [
      { type: "image/avif", srcset: srcsetFor("avif"), sizes: VARSAYILAN_SIZES },
      { type: "image/webp", srcset: srcsetFor("webp"), sizes: VARSAYILAN_SIZES },
      { type: "image/jpeg", srcset: srcsetFor("jpg"), sizes: VARSAYILAN_SIZES },
    ],
    ...ekler,
  };
}

/** Galeri kaydı — `manifest: null` verilirse "türev yok" demektir. */
export function galeriKaydi(
  fileUrl: string,
  manifest: KurguGorselManifesti | null,
  primary = false
): KurguGorsel {
  return {
    file_url: fileUrl,
    alt_text: "",
    primary,
    asset: `AST-${fileUrl.replace(/\W+/g, "-")}`,
    manifest,
  };
}

/**
 * `get_manifest_batch` yanıt gövdesi (Frappe `{message: ...}` zarfı dâhil).
 *
 * `enabled: false` verildiğinde istemci devre kesiciyi kurar; o hâli test
 * etmek için `enabled` parametresi var.
 */
export function manifestYaniti(
  listing: string,
  images: KurguGorsel[],
  enabled = true
): { message: Record<string, unknown> } {
  return {
    message: {
      enabled,
      manifests: {
        [listing]: {
          listing,
          slot: "product.image",
          enabled,
          fallback: "",
          images,
          suppressed: 0,
        },
      },
    },
  };
}

/** Bayrak KAPALI gövdesi — `manifests` boş, `enabled: false`. */
export function kapaliYanit(): { message: Record<string, unknown> } {
  return { message: { enabled: false, manifests: {} } };
}
