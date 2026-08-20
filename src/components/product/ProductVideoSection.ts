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
import { ensureHlsHydration, hydrateHlsVideos, isHlsUrl } from "../../utils/hlsVideo";
import { escapeHtml, sanitizeUrl } from "../../utils/sanitize";

const VIDEO_CONTAINER_ID = "product-video-section";

/** Embed iframe src'ine autoplay parametrelerini ekler (mevcut query string'i korur). */
function withAutoplayParams(src: string, params: string): string {
  return src + (src.includes("?") ? "&" : "?") + params;
}

/** `poster="..."` özniteliği — poster verilmemiş ya da sanitize'ı geçememişse hiç basılmaz. */
function posterAttr(poster: string): string {
  // fallback "" — güvensiz kapak URL'i "#" olarak bile basılmasın, öznitelik düşsün.
  const safe = poster ? escapeHtml(sanitizeUrl(poster, "")) : "";
  return safe ? ` poster="${safe}"` : "";
}

/**
 * YouTube / Vimeo URL'lerini embed URL'ine çevirir, direkt video dosyası URL'lerini olduğu gibi bırakır.
 * `autoplay=true` ise video/iframe sayfa etkileşimi olmadan başlar — tarayıcı politikası gereği
 * sesli autoplay engellendiğinden bu durumda `muted` zorunlu (kullanıcı controls ile sesi açabilir).
 * `poster` yalnız `<video>` üreten dallarda anlamlıdır (embed iframe'lerde kapağı sağlayıcı basar).
 */
export function toVideoEmbedHtml(rawUrl: string, autoplay = false, poster = ""): string {
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

  // HLS manifesti (.m3u8): `src` DOĞRUDAN basılmaz — Safari dışındaki
  // tarayıcılar m3u8'i yerli çözemez, hls.js bağlamak gerekir. Element
  // `data-hls-src` ile işaretlenir; DOM'a girdiği anda gözlemci
  // (`ensureHlsHydration`) yerli desteğe ya da hls.js'e bağlar. hls.js bu
  // sayede yalnız HLS videosu gerçekten basılan sayfada, dinamik import ile iner.
  if (isHlsUrl(url)) {
    const safeSrc = escapeHtml(sanitizeUrl(url));
    if (!safeSrc) return "";
    const autoAttrs = autoplay ? " autoplay muted" : "";
    ensureHlsHydration();
    return `<video data-hls-src="${safeSrc}"${posterAttr(poster)} class="absolute inset-0 w-full h-full object-contain bg-black" controls${autoAttrs} preload="metadata" playsinline></video>`;
  }

  // MP4/WebM vb. direkt dosya
  if (/\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(url)) {
    const safeSrc = escapeHtml(sanitizeUrl(url));
    if (!safeSrc) return "";
    const autoAttrs = autoplay ? " autoplay muted" : "";
    return `<video src="${safeSrc}"${posterAttr(poster)} class="absolute inset-0 w-full h-full object-contain bg-black" controls${autoAttrs} preload="metadata" playsinline></video>`;
  }

  // Tanınmayan formatta anchor fallback
  const safeHref = escapeHtml(sanitizeUrl(url));
  if (!safeHref) return "";
  return `<a href="${safeHref}" target="_blank" rel="noopener" class="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-100 text-primary-600 underline">${t("prodUi.openVideo")}</a>`;
}

/** Ana video dalı bir `<video>` mi (iframe/anchor değil) — önizleme katmanı yalnız burada anlamlı. */
function isDirectVideoUrl(url: string): boolean {
  const u = (url || "").trim();
  if (!u) return false;
  return isHlsUrl(u) || /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(u);
}

/**
 * Hover/inline önizleme katmanı — poster→önizleme→tam video kademesinin görsel yüzü.
 *
 * Kısa, SESSİZ, döngülü klip poster üstünde `opacity-0` başlar; `bindVideoPreview`
 * hover/odakta görünür kılıp oynatır. `preload="none"`: kaynak ilk oynatmaya
 * kadar İNMEZ (soğuk sayfada bant harcamaz). `pointer-events-none`: tıklamalar
 * altındaki ana videonun `controls`una geçer. `motion-reduce:hidden`: reduced-motion
 * altında CSS düzeyinde de gizli (JS ayrıca hiç oynatmaz). `aria-hidden`+`tabindex=-1`:
 * dekoratif — erişilebilirlik ağacına ve tab sırasına girmez.
 */
function previewOverlay(previewSrc: string, videoUrl: string): string {
  if (!previewSrc || !isDirectVideoUrl(videoUrl)) return "";
  const safe = escapeHtml(sanitizeUrl(previewSrc, ""));
  if (!safe) return "";
  return `<video data-listing-preview-clip src="${safe}" class="absolute inset-0 w-full h-full object-contain opacity-0 pointer-events-none transition-opacity duration-300 motion-reduce:hidden" muted loop playsinline preload="none" aria-hidden="true" tabindex="-1"></video>`;
}

function renderVideoPlayer(videoUrl: string, label: string, poster = "", previewSrc = ""): string {
  if (!videoUrl) return "";
  return `
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-base md:text-lg font-bold text-gray-900">${label}</h2>
    </div>
    <div class="relative rounded-lg overflow-hidden shadow-sm bg-black" style="padding-top:56.25%" data-video-frame>
      ${toVideoEmbedHtml(videoUrl, false, poster)}
      ${previewOverlay(previewSrc, videoUrl)}
    </div>
  `;
}

export function ProductVideoSection(): string {
  const p = getCurrentProduct();
  // W8 — kaynak tercihi: HLS master (varsa) > optimize mp4 türevi > ham URL.
  // API türev basmadığında (dış YouTube/Vimeo adresi, bayrak kapalı, eski
  // ilan) ikisi de boş kalır ve bugünkü ham `videoUrl` davranışı sürer.
  const listingVideo = p.videoHlsSrc || p.videoSrc || p.videoUrl || "";
  // Kapak: API `videoPoster` (W8'den beri manifest posteri de aynı alandan akıyor).
  const listingPoster = p.videoPoster || "";
  // W8 — hareketli önizleme klibi (kısa/sessiz mp4 türevi). Yoksa boş kalır ve
  // önizleme katmanı hiç basılmaz (bugünkü poster→tam video davranışı sürer).
  const listingPreview = p.videoPreviewSrc || "";
  // Varyant videoları ileride geldiğinde data-attribute'lara yerleşir; şimdilik sadece listing.
  const initialVideo = listingVideo;
  const hidden = !initialVideo;

  return `
    <section id="${VIDEO_CONTAINER_ID}"
      data-listing-video="${escapeHtml(listingVideo)}"
      data-listing-poster="${escapeHtml(listingPoster)}"
      data-listing-preview="${escapeHtml(listingPreview)}"
      class="${hidden ? "hidden " : ""}mt-4 p-4 rounded-lg border border-gray-200 bg-white">
      ${renderVideoPlayer(initialVideo, t("prodUi.promoVideo"), listingPoster, listingPreview)}
    </section>
  `;
}

/** `prefers-reduced-motion: reduce` — kullanıcı hareketi azaltmayı seçmiş mi. */
function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Önizleme kademesini bağla: hover/odakta kısa SESSİZ klibi oynat, ayrılınca
 * durdur. Poster→önizleme→tam video kademesi. Erişilebilirlik + reduced-motion:
 *  - `prefers-reduced-motion: reduce` → hiç oynatmaz (poster durur; CSS de gizler).
 *  - Klip dekoratif (`aria-hidden`); klavye odağı da tetikler (`focusin`).
 *  - Kullanıcı GERÇEK videoyu başlatınca (ana `<video>` `play`) klip kalıcı
 *    sökülür — iki video aynı anda çalmaz, ses çakışmaz.
 * Idempotent: `data-preview-bound` ile çift bağlanmaz (swap sonrası güvenli).
 */
export function bindVideoPreview(container: HTMLElement | null): void {
  if (!container) return;
  const frame = container.querySelector<HTMLElement>("[data-video-frame]");
  if (!frame || frame.dataset.previewBound === "1") return;
  const clip = frame.querySelector<HTMLVideoElement>("[data-listing-preview-clip]");
  if (!clip) return;
  frame.dataset.previewBound = "1";

  // Hareket azaltma: hiç bağlama — poster sabit kalır.
  if (prefersReducedMotion()) return;

  const main = frame.querySelector<HTMLVideoElement>("video:not([data-listing-preview-clip])");
  let sokuldu = false;

  const oynat = (): void => {
    if (sokuldu) return;
    // Ana video gerçekten oynuyorsa önizleme devreye girmez.
    if (main && !main.paused && !main.ended) return;
    clip.classList.remove("opacity-0");
    clip.classList.add("opacity-100");
    void clip.play?.().catch(() => {
      /* preload=none / kaynak yok / autoplay reddi — sessiz düş, poster kalır */
    });
  };

  const durdur = (): void => {
    clip.classList.add("opacity-0");
    clip.classList.remove("opacity-100");
    try {
      clip.pause();
      clip.currentTime = 0;
    } catch {
      /* jsdom / yüklenmemiş kaynak — yok say */
    }
  };

  const sok = (): void => {
    if (sokuldu) return;
    sokuldu = true;
    frame.removeEventListener("pointerenter", oynat);
    frame.removeEventListener("pointerleave", durdur);
    frame.removeEventListener("focusin", oynat);
    frame.removeEventListener("focusout", durdur);
    durdur();
    clip.remove();
  };

  frame.addEventListener("pointerenter", oynat);
  frame.addEventListener("pointerleave", durdur);
  // Klavye erişilebilirliği: odak çerçeve içine girince de önizle.
  frame.addEventListener("focusin", oynat);
  frame.addEventListener("focusout", durdur);
  // Kullanıcı gerçek videoyu başlatınca önizlemeyi kalıcı sök.
  if (main) main.addEventListener("play", sok, { once: true });
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
  // Kapak ve önizleme yalnız listing videosuna ait — varyant videosunda yanlış
  // kapak/klip göstermektense hiç göstermemek doğru.
  const listingPoster = el.getAttribute("data-listing-poster") || "";
  const listingPreview = el.getAttribute("data-listing-preview") || "";
  el.classList.remove("hidden");
  el.innerHTML = renderVideoPlayer(
    nextUrl,
    variantVideoUrl ? t("prodUi.variantVideo") : t("prodUi.promoVideo"),
    variantVideoUrl ? "" : listingPoster,
    variantVideoUrl ? "" : listingPreview
  );
  // Gözlemci zaten yakalar; elle çağrı swap → oynatma gecikmesini kısaltır
  // (data-hls-bound işareti çift bağlanmayı önlüyor).
  hydrateHlsVideos(el);
  // Swap yeni bir çerçeve bastı — önizleme kademesini yeniden bağla (listing'e
  // dönüldüyse klip var, varyanttaysa hiç overlay yok → no-op).
  bindVideoPreview(el);
}

export function initProductVideoSection(opts: { signal?: AbortSignal } = {}): void {
  // İlk render'ın önizleme kademesini bağla.
  bindVideoPreview(document.getElementById(VIDEO_CONTAINER_ID));
  // Varyant seçiminde custom event dinle. `signal` verilirse (product-detail
  // responsive layout yaşam döngüsü) viewport değişiminde layout yeniden mount
  // edildiğinde bu global dinleyici KALDIRILIR — yoksa her masaüstü mount'unda
  // üst üste birikir ve tek varyant değişiminde setProductVideo defalarca koşar.
  document.addEventListener(
    "product-variant-change",
    ((e: CustomEvent) => {
      const videoUrl: string = e.detail?.videoUrl || "";
      setProductVideo(videoUrl);
    }) as EventListener,
    opts.signal ? { signal: opts.signal } : undefined
  );
}
