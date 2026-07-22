/**
 * ProductVideoSection
 *
 * Ürün detay sayfasında galeri ile tablar arasında render olan tanıtım videosu bölümü.
 * Hem listing-level `videoUrl` hem de seçili varyantın videosunu gösterir.
 *
 * Varyant değiştiğinde DOM'u kendini günceller (custom event `product-variant-change`
 * dinlemesi veya global swap fn'i üzerinden).
 */

import { getCurrentProduct } from "../../alpine/product";
import { t } from "../../i18n";
import { escapeHtml, sanitizeUrl } from "../../utils/sanitize";

const VIDEO_CONTAINER_ID = "product-video-section";

/** Embed iframe src'ine autoplay parametrelerini ekler (mevcut query string'i korur). */
function withAutoplayParams(src: string, params: string): string {
  return src + (src.includes("?") ? "&" : "?") + params;
}

/**
 * YouTube / Vimeo URL'lerini embed URL'ine çevirir, direkt video dosyası URL'lerini olduğu gibi bırakır.
 * `autoplay=true` ise video/iframe sayfa etkileşimi olmadan başlar — tarayıcı politikası gereği
 * sesli autoplay engellendiğinden bu durumda `muted` zorunlu (kullanıcı controls ile sesi açabilir).
 */
export function toVideoEmbedHtml(rawUrl: string, autoplay = false): string {
  const url = (rawUrl || "").trim();
  if (!url) return "";

  // YouTube: watch?v=ID, youtu.be/ID, embed/ID
  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  if (yt) {
    const src = autoplay
      ? withAutoplayParams(`https://www.youtube.com/embed/${yt[1]}`, "autoplay=1&mute=1")
      : `https://www.youtube.com/embed/${yt[1]}`;
    return `<iframe src="${src}" class="absolute inset-0 w-full h-full" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  }

  // Vimeo
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) {
    const src = autoplay
      ? withAutoplayParams(`https://player.vimeo.com/video/${vm[1]}`, "autoplay=1&muted=1")
      : `https://player.vimeo.com/video/${vm[1]}`;
    return `<iframe src="${src}" class="absolute inset-0 w-full h-full" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
  }

  // Direkt embed URL
  if (url.includes("/embed/") || url.includes("player.vimeo.com")) {
    const safeSrc = escapeHtml(sanitizeUrl(autoplay ? withAutoplayParams(url, "autoplay=1&muted=1") : url));
    if (!safeSrc) return "";
    return `<iframe src="${safeSrc}" class="absolute inset-0 w-full h-full" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
  }

  // MP4/WebM vb. direkt dosya
  if (/\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(url)) {
    const safeSrc = escapeHtml(sanitizeUrl(url));
    if (!safeSrc) return "";
    const autoAttrs = autoplay ? " autoplay muted" : "";
    return `<video src="${safeSrc}" class="absolute inset-0 w-full h-full object-contain bg-black" controls${autoAttrs} preload="metadata" playsinline></video>`;
  }

  // Tanınmayan formatta anchor fallback
  const safeHref = escapeHtml(sanitizeUrl(url));
  if (!safeHref) return "";
  return `<a href="${safeHref}" target="_blank" rel="noopener" class="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-100 text-primary-600 underline">${t("prodUi.openVideo")}</a>`;
}

function renderVideoPlayer(videoUrl: string, label: string): string {
  if (!videoUrl) return "";
  return `
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-base md:text-lg font-bold text-gray-900">${label}</h2>
    </div>
    <div class="relative rounded-lg overflow-hidden shadow-sm bg-black" style="padding-top:56.25%">
      ${toVideoEmbedHtml(videoUrl)}
    </div>
  `;
}

export function ProductVideoSection(): string {
  const p = getCurrentProduct();
  const listingVideo = p.videoUrl || "";
  // Varyant videoları ileride geldiğinde data-attribute'lara yerleşir; şimdilik sadece listing.
  const initialVideo = listingVideo;
  const hidden = !initialVideo;

  return `
    <section id="${VIDEO_CONTAINER_ID}"
      data-listing-video="${escapeHtml(listingVideo)}"
      class="${hidden ? "hidden " : ""}mt-4 p-4 rounded-lg border border-gray-200 bg-white">
      ${renderVideoPlayer(initialVideo, t("prodUi.promoVideo"))}
    </section>
  `;
}

/**
 * Varyant seçildiğinde video swap et.
 * variantVideoUrl boş/yoksa listing'in kendi videosuna düşer.
 */
export function setProductVideo(variantVideoUrl: string): void {
  const el = document.getElementById(VIDEO_CONTAINER_ID);
  if (!el) return;
  const listingVideo = el.getAttribute("data-listing-video") || "";
  const nextUrl = variantVideoUrl || listingVideo;

  if (!nextUrl) {
    el.classList.add("hidden");
    el.innerHTML = "";
    return;
  }
  el.classList.remove("hidden");
  el.innerHTML = renderVideoPlayer(
    nextUrl,
    variantVideoUrl ? t("prodUi.variantVideo") : t("prodUi.promoVideo")
  );
}

export function initProductVideoSection(): void {
  // Varyant seçiminde custom event dinle
  document.addEventListener("product-variant-change", ((e: CustomEvent) => {
    const videoUrl: string = e.detail?.videoUrl || "";
    setProductVideo(videoUrl);
  }) as EventListener);
}
