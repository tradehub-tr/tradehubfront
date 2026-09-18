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
}

/** Sepet ve ödeme görselleri de ürünün aynı AVIF boyut merdivenini kullanır. */
export function ProductImage(options: ProductImageOptions): string {
  const { listing, src, alt = "", className, sizes, width, height } = options;
  const manifest = getMediaImageManifest(listing, src);
  const avif = manifest?.sources.find((source) => source.type === "image/avif");
  const avifSrc = avif?.srcset.split(",").at(-1)?.trim().split(/\s+/)[0];
  const attrs = {
    "data-product-image-listing": listing,
    "data-product-image-source": src,
    "data-product-image-sizes": sizes,
  };
  return ResponsiveImage({
    manifest: manifest && avif && avifSrc ? { ...manifest, src: avifSrc, sources: [avif] } : null,
    fallback: () =>
      `<img src="${escapeHtml(sanitizeUrl(src))}" alt="${escapeHtml(alt)}" width="${width}" height="${height}" sizes="${escapeHtml(sizes)}" decoding="async" loading="lazy" class="${escapeHtml(className)}" ${Object.entries(
        attrs
      )
        .map(([key, value]) => `${key}="${escapeHtml(value)}"`)
        .join(" ")} />`,
    imgClass: className,
    alt,
    sizes,
    width,
    height,
    extraAttrs: attrs,
  });
}

/** Sayfa çizimini bekletmeden, gelen manifesti mevcut img düğümüne uygula. */
export async function hydrateProductImages(root: ParentNode = document): Promise<void> {
  const selector = "img[data-product-image-listing]";
  const images = Array.from(root.querySelectorAll<HTMLImageElement>(selector));
  await primeMediaManifests(images.map((img) => img.dataset.productImageListing || ""));
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
