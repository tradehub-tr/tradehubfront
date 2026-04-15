/**
 * ProductVideoSection
 *
 * Ürün detay sayfasında galeri ile tablar arasında render olan tanıtım videosu bölümü.
 * Hem listing-level `videoUrl` hem de seçili varyantın videosunu gösterir.
 *
 * Varyant değiştiğinde DOM'u kendini günceller (custom event `product-variant-change`
 * dinlemesi veya global swap fn'i üzerinden).
 */

import { getCurrentProduct } from '../../alpine/product';

const VIDEO_CONTAINER_ID = 'product-video-section';

/** YouTube / Vimeo URL'lerini embed URL'ine çevirir, direkt video dosyası URL'lerini olduğu gibi bırakır. */
export function toVideoEmbedHtml(rawUrl: string): string {
  const url = (rawUrl || '').trim();
  if (!url) return '';

  // YouTube: watch?v=ID, youtu.be/ID, embed/ID
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (yt) {
    return `<iframe src="https://www.youtube.com/embed/${yt[1]}" class="absolute inset-0 w-full h-full" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  }

  // Vimeo
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) {
    return `<iframe src="https://player.vimeo.com/video/${vm[1]}" class="absolute inset-0 w-full h-full" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
  }

  // Direkt embed URL
  if (url.includes('/embed/') || url.includes('player.vimeo.com')) {
    return `<iframe src="${url}" class="absolute inset-0 w-full h-full" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
  }

  // MP4/WebM vb. direkt dosya
  if (/\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(url)) {
    return `<video src="${url}" class="absolute inset-0 w-full h-full object-contain bg-black" controls preload="metadata" playsinline></video>`;
  }

  // Tanınmayan formatta anchor fallback
  return `<a href="${url}" target="_blank" rel="noopener" class="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-100 text-primary-600 underline">Videoyu aç</a>`;
}

function renderVideoPlayer(videoUrl: string, label: string): string {
  if (!videoUrl) return '';
  return `
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-base md:text-lg font-bold text-gray-900">${label}</h3>
    </div>
    <div class="relative rounded-lg overflow-hidden shadow-sm bg-black" style="padding-top:56.25%">
      ${toVideoEmbedHtml(videoUrl)}
    </div>
  `;
}

export function ProductVideoSection(): string {
  const p = getCurrentProduct() as any;
  const listingVideo = (p.videoUrl || '') as string;
  // Varyant videoları ileride geldiğinde data-attribute'lara yerleşir; şimdilik sadece listing.
  const initialVideo = listingVideo;
  const hidden = !initialVideo;

  return `
    <section id="${VIDEO_CONTAINER_ID}"
      data-listing-video="${listingVideo}"
      class="${hidden ? 'hidden ' : ''}mt-4 p-4 rounded-lg border border-gray-200 bg-white">
      ${renderVideoPlayer(initialVideo, 'Tanıtım Videosu')}
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
  const listingVideo = el.getAttribute('data-listing-video') || '';
  const nextUrl = variantVideoUrl || listingVideo;

  if (!nextUrl) {
    el.classList.add('hidden');
    el.innerHTML = '';
    return;
  }
  el.classList.remove('hidden');
  el.innerHTML = renderVideoPlayer(
    nextUrl,
    variantVideoUrl ? 'Varyant Videosu' : 'Tanıtım Videosu',
  );
}

export function initProductVideoSection(): void {
  // Varyant seçiminde custom event dinle
  document.addEventListener('product-variant-change', ((e: CustomEvent) => {
    const videoUrl: string = e.detail?.videoUrl || '';
    setProductVideo(videoUrl);
  }) as EventListener);
}
