/**
 * Media Watch Page — Entry Point
 * /medya/v/{slug}
 *
 * Task 4 (2026-08-26 medya-watch-page) — vitrin izleme sayfası. Backend
 * `media_public.get_watch_page(slug)` (allow_guest) tek veri kaynağı;
 * bulunamayan/private slug 404 zarfı fırlatır (`frappe.DoesNotExistError`).
 *
 * NOT — tek dilli sayfa (koordinatör ruling'i): sayfa içeriği yalnız Türkçe
 * basılır; `t()` ile çevrilmez.
 *
 * Prod'da nginx `location ~ ^/medya/v/([a-z0-9-]+)$` TÜM istekleri (bot/insan
 * ayrımı yok — `/media/<id>` bloğuyla birebir desen) backend
 * `page_resolver.render_media_watch`'a proxy'ler; o da bu dosyanın build
 * çıktısını (`pages/media-watch.html`) okuyup <head>'e SEO enjekte eder ve
 * gövdeyi (bu script) olduğu gibi döner — bilinmeyen slug'da zaten backend
 * 404.html'e düşer, eski slug'da 301 verir. Buradaki fetch/404 dalı yalnız
 * dev sunucusunda (Vite pretty-rewrite, backend'siz) ve savunma amaçlı.
 */

// T-123: RUM montajı — MPA ortak boot (çift başlatmaya karşı korumalı).
import "../lib/rum/boot";
import "../style.css";
import { escapeHtml, sanitizeUrl } from "../utils/sanitize";
import { callMethod } from "../utils/api";
import { applyServerSeo } from "../seo/setPageMeta";
import { getListingUrl } from "../utils/listingUrl";
import { toPosterOnlyHtml, toVideoEmbedHtml } from "../components/product/ProductVideoSection";
import {
  TopBar,
  SubHeader,
  initStickyHeaderSearch,
  MegaMenu,
  initMegaMenu,
  initHeaderCart,
} from "../components/header";
import { mountChatPopup, initChatTriggers } from "../components/chat-popup";
import { initLanguageSelector } from "../components/header/TopBar";
import { FooterLinks } from "../components/footer";
import { FloatingPanel, BottomNav, initBottomNav } from "../components/floating";
import { startAlpine } from "../alpine";

export interface WatchPageSource {
  src: string;
  type: string;
}

export interface WatchPageLicense {
  creator: string;
  creditText: string;
  copyrightNotice: string;
  licenseUrl: string;
  acquireLicensePageUrl: string;
}

export interface WatchPageListing {
  slug: string;
  title: string;
  image: string;
}

export interface WatchPageResponse {
  title: string;
  caption: string;
  description: string;
  transcript: string;
  posterUrl: string;
  sources: WatchPageSource[];
  captionsUrl: string;
  durationSec: number;
  uploadDate: string;
  license: WatchPageLicense;
  listings: WatchPageListing[];
  indexable: boolean;
  canonical: string;
  robots: string;
}

// ── Pure helpers — DOM'suz, Vitest kapsamı (media-watch.test.ts) ────────────

/**
 * `/medya/v/<slug>` slug'ını path'ten okur — `brand.ts:getSlugFromUrl` ile aynı desen (nginx dahili
 * rewrite tarayıcı URL'ini path olarak bırakır, query'ye çevirmez).
 */
export function getSlugFromPath(pathname: string): string {
  const match = (pathname || "").match(/^\/medya\/v\/([^/]+)/);
  return match ? decodeURIComponent(match[1]).trim() : "";
}

/**
 * `?t=<saniye>` başlangıç saniyesi. Geçersiz/eksik/negatif/sonlu-olmayan
 * değer `null` döner — yanlış bir saniyeye atlamaktansa hiç atlamamak yeğdir.
 */
export function parseSeekSeconds(search: string): number | null {
  const raw = new URLSearchParams(search || "").get("t");
  if (raw === null || raw.trim() === "") return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
}

export interface LicenseRow {
  label: string;
  value: string;
}

/** Lisans satırı — TAM 5 alandan yalnız DOLU olanlar basılır (boş satır yok). */
export function buildLicenseRows(license: WatchPageLicense | null | undefined): LicenseRow[] {
  if (!license) return [];
  const rows: Array<[string, string | undefined]> = [
    ["Üretici", license.creator],
    ["Kredi", license.creditText],
    ["Telif", license.copyrightNotice],
    ["Lisans", license.licenseUrl],
    ["Lisans edinme", license.acquireLicensePageUrl],
  ];
  return rows
    .filter(([, value]) => !!(value && value.trim()))
    .map(([label, value]) => ({ label, value: (value as string).trim() }));
}

// ── Render ───────────────────────────────────────────────────────────────────

function renderPlayer(data: WatchPageResponse): string {
  const mainSrc = data.sources?.[0]?.src || "";
  const poster = data.posterUrl || "";
  const player = mainSrc
    ? toVideoEmbedHtml(mainSrc, false, poster, data.captionsUrl || "")
    : toPosterOnlyHtml(poster, data.title || "");
  return `
    <div
      class="relative rounded-md overflow-hidden bg-black"
      style="padding-top:56.25%"
      data-watch-video-frame
    >
      ${player}
    </div>
  `;
}

function renderHeading(data: WatchPageResponse): string {
  const captionHtml = data.caption
    ? `<p class="text-sm md:text-base text-gray-600 mt-1">${escapeHtml(data.caption)}</p>`
    : "";
  const descriptionHtml = data.description
    ? `<p class="text-sm text-gray-700 mt-3 leading-relaxed whitespace-pre-wrap">${escapeHtml(data.description)}</p>`
    : "";
  return `
    <div class="mt-4">
      <h1 class="text-xl md:text-2xl font-bold text-gray-900">${escapeHtml(data.title || "Video")}</h1>
      ${captionHtml}
      ${descriptionHtml}
    </div>
  `;
}

function renderTranscript(data: WatchPageResponse): string {
  if (!data.transcript || !data.transcript.trim()) return "";
  return `
    <details class="mt-4 rounded-md border border-gray-200 bg-white p-3">
      <summary class="cursor-pointer text-sm font-semibold text-gray-900">Transkript</summary>
      <p class="text-sm text-gray-700 mt-2 leading-relaxed whitespace-pre-wrap">${escapeHtml(data.transcript)}</p>
    </details>
  `;
}

function renderLicense(data: WatchPageResponse): string {
  const rows = buildLicenseRows(data.license);
  if (rows.length === 0) return "";
  const itemsHtml = rows
    .map(({ label, value }) => {
      const isUrl = /^https?:\/\//i.test(value);
      const safeValue = isUrl
        ? `<a href="${escapeHtml(sanitizeUrl(value, ""))}" target="_blank" rel="noopener" class="text-primary-600 hover:underline">${escapeHtml(value)}</a>`
        : escapeHtml(value);
      return `<span class="text-gray-500">${escapeHtml(label)}:</span> ${safeValue}`;
    })
    .join(`<span class="mx-2 text-gray-300">·</span>`);
  return `
    <p class="mt-3 text-xs text-gray-500 flex flex-wrap items-center gap-x-1 gap-y-1">${itemsHtml}</p>
  `;
}

function renderListings(listings: WatchPageListing[]): string {
  if (!listings || listings.length === 0) return "";
  const cardsHtml = listings
    .map((listing) => {
      const href = escapeHtml(getListingUrl({ slug: listing.slug }));
      const imgSrc = listing.image ? escapeHtml(sanitizeUrl(listing.image, "")) : "";
      const imgHtml = imgSrc
        ? `<img src="${imgSrc}" alt="${escapeHtml(listing.title)}" class="w-full aspect-square object-contain bg-white" loading="lazy" decoding="async" />`
        : `<div class="w-full aspect-square bg-gray-100"></div>`;
      return `
        <a href="${href}" class="th-no-press block rounded-md border border-gray-200 bg-white overflow-hidden hover:shadow-sm transition-shadow duration-150 motion-reduce:transition-none">
          ${imgHtml}
          <p class="text-xs text-gray-800 p-2 line-clamp-2">${escapeHtml(listing.title)}</p>
        </a>
      `;
    })
    .join("");
  return `
    <section class="mt-8">
      <h2 class="text-base md:text-lg font-bold text-gray-900 mb-3">Bu videoyu içeren ürünler</h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">${cardsHtml}</div>
    </section>
  `;
}

/** `?t=` başlangıç saniyesini video hazır olur olmaz uygular. */
function applyInitialSeek(video: HTMLVideoElement | null, seconds: number | null): void {
  if (!video || seconds === null) return;
  const seek = (): void => {
    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : Infinity;
    video.currentTime = Math.min(seconds, duration);
  };
  if (video.readyState >= 1) seek();
  else video.addEventListener("loadedmetadata", seek, { once: true });
}

function renderNotFoundAndBail(): void {
  window.location.replace("/404.html");
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const slug = getSlugFromPath(window.location.pathname);
  if (!slug) {
    renderNotFoundAndBail();
    return;
  }

  let data: WatchPageResponse;
  try {
    data = await callMethod<WatchPageResponse>("tradehub_core.api.media_public.get_watch_page", {
      slug,
    });
  } catch (err) {
    console.error("[Media Watch Page] load failed:", err);
    renderNotFoundAndBail();
    return;
  }

  applyServerSeo({
    title: data.title ? `${data.title} | iStoc` : "Video | iStoc",
    description: data.description || data.caption || undefined,
    canonical: data.canonical || undefined,
    robots: data.robots || undefined,
    og_type: "video.other",
    og_title: data.title || undefined,
    og_description: data.description || data.caption || undefined,
    og_image: data.posterUrl || undefined,
  });

  const appEl = document.querySelector<HTMLDivElement>("#app");
  if (!appEl) return;
  appEl.innerHTML = `
    <div id="sticky-header" class="sticky top-0 z-(--z-header) border-b border-gray-200 bg-white transition-colors duration-200">
      ${TopBar()}
      ${SubHeader()}
    </div>

    ${MegaMenu()}

    <main>
      <div class="container-boxed py-6">
        ${renderPlayer(data)}
        ${renderHeading(data)}
        ${renderTranscript(data)}
        ${renderLicense(data)}
        ${renderListings(data.listings)}
      </div>
    </main>

    ${FooterLinks()}
    ${FloatingPanel()}

    <!-- Bottom Navigation (mobile/tablet) -->
    ${BottomNav()}
  `;

  const video = appEl.querySelector<HTMLVideoElement>("[data-watch-video-frame] video");
  applyInitialSeek(video, parseSeekSeconds(window.location.search));

  initStickyHeaderSearch();
  initMegaMenu();
  initHeaderCart();
  initLanguageSelector();
  mountChatPopup();
  initChatTriggers();
  startAlpine();
  initBottomNav();
}

main().catch((err) => {
  console.error("[Media Watch Page] fatal error:", err);
});
