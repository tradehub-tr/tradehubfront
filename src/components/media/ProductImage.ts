import { getMediaImageManifest, primeMediaManifests } from "../../lib/media/manifest";
import { escapeHtml, sanitizeUrl } from "../../utils/sanitize";
import { ResponsiveImage } from "./ResponsiveImage";

interface ProductImageOptions {
  listing: string;
  src: string;
  alt?: string;
  className: string;
  sizes: string;
  width: number;
  height: number;
  /**
   * Görünür alanda ilk boyamada gereken görsel (ör. sahne görseli): `loading`
   * yazılmaz. Varsayılan `false` → `loading="lazy"`; kapalı/ekran dışı UI'da
   * tarayıcı görseli ancak görünür olunca indirir.
   */
  eager?: boolean;
}

/**
 * Tek `<img>` yolunda sunulabilen modern biçimler, tercih sırasıyla.
 * WebP: 2026-09-30'dan itibaren ürün görseli merdiveni (192/384/768/1280).
 * AVIF: yeniden üretimi bitmemiş eski varlıkların merdiveni (geçiş uyumu).
 */
const MODERN_TYPES = ["image/avif", "image/webp"];

/** Sepet ve ödeme görselleri de ürünün aynı boyut merdivenini kullanır. */
export function ProductImage(options: ProductImageOptions): string {
  const { listing, src, alt = "", className, sizes, width, height, eager = false } = options;
  const manifest = getMediaImageManifest(listing, src);
  const modern = MODERN_TYPES.map((type) =>
    manifest?.sources.find((source) => source.type === type)
  ).find(Boolean);
  // Yedek `src`: merdivenin en büyük TÜREVİ. 2026-09-30'dan beri srcset'in son
  // adayı kare master'ın kendisi (≤2000 px) olabiliyor; `src`e o yazılmaz.
  const adaylar = (modern?.srcset.split(",") ?? [])
    .map((parca) => parca.trim().split(/\s+/)[0])
    .filter(Boolean);
  const modernSrc = adaylar.filter((aday) => aday !== src).at(-1) ?? adaylar.at(-1);
  const attrs = {
    "data-product-image-listing": listing,
    "data-product-image-source": src,
    "data-product-image-sizes": sizes,
  };
  return ResponsiveImage({
    manifest:
      manifest && modern && modernSrc ? { ...manifest, src: modernSrc, sources: [modern] } : null,
    fallback: () =>
      `<img src="${escapeHtml(sanitizeUrl(src))}" alt="${escapeHtml(alt)}" width="${width}" height="${height}" sizes="${escapeHtml(sizes)}" decoding="async"${eager ? "" : ' loading="lazy"'} class="${escapeHtml(className)}" ${Object.entries(
        attrs
      )
        .map(([key, value]) => `${key}="${escapeHtml(value)}"`)
        .join(" ")} />`,
    imgClass: className,
    alt,
    sizes,
    width,
    height,
    // Manifestin `loading`/`fetchpriority` alanına bırakılmaz: bu bileşen
    // küçük kutular içindir, LCP önceliği hiçbir zaman buradan verilmez.
    priority: false,
    eager,
    extraAttrs: attrs,
  });
}

/** Sayfa çizimini bekletmeden, gelen manifesti mevcut img düğümüne uygula. */
export async function hydrateProductImages(root: ParentNode = document): Promise<void> {
  const selector = "img[data-product-image-listing]";
  const images = Array.from(root.querySelectorAll<HTMLImageElement>(selector));
  // `primeMediaManifests` sözleşme gereği reddetmez; yine de bu fonksiyon
  // `void` ile çağrılıyor — hiçbir koşulda işlenmemiş ret bırakmasın.
  await primeMediaManifests(images.map((img) => img.dataset.productImageListing || "")).catch(
    () => undefined
  );
  for (const img of Array.from(root.querySelectorAll<HTMLImageElement>(selector))) {
    const html = ProductImage({
      listing: img.dataset.productImageListing || "",
      src: img.dataset.productImageSource || "",
      sizes: img.dataset.productImageSizes || "",
      alt: img.alt,
      className: img.className,
      width: Number(img.getAttribute("width")),
      height: Number(img.getAttribute("height")),
    });
    const template = document.createElement("template");
    template.innerHTML = html;
    const optimized = template.content.querySelector("img");
    if (!optimized?.srcset) continue;
    // Düğüm ve ona bağlı olaylar korunur. sizes/srcset, src'den önce yazılır.
    for (const name of ["sizes", "srcset", "src", "width", "height"]) {
      const value = optimized.getAttribute(name);
      if (value !== null && img.getAttribute(name) !== value) img.setAttribute(name, value);
    }
  }
}
