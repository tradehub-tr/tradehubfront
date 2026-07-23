/**
 * MediaViewer — mobil ürün detay tam ekran medya görüntüleyici (Faz 2).
 *
 * Giriş noktaları: galeri slaytına dokunma, küçük görsel şeridindeki
 * "Daha fazla" linki, gallery chip'lerindeki "Video" ve OptionsSheet renk
 * satırındaki büyütme ikonu (data-opt-expand). Üç mod arasında iç sekme
 * geçişi yapar — buradaki "Seçenekler" chip'i OptionsSheet'i AÇMAZ, sadece
 * renk varyantı slaytlarına geçer (mock `renderViewer` davranışı).
 */

import { getCurrentProduct } from "../../alpine/product";
import { t } from "../../i18n";
import { escapeHtml, sanitizeUrl } from "../../utils/sanitize";
import { toVideoEmbedHtml } from "./ProductVideoSection";
import type { ProductDetail, ProductVariant } from "../../types/product";

const VIEWER_ID = "pdmv-viewer";

export type MediaViewerMode = "photos" | "variants" | "video";

/** Aktif slayt modu — sadece "photos" modunda sayaç gösterilir. */
let currentMode: MediaViewerMode = "photos";

function getColorVariant(p: ProductDetail): ProductVariant | undefined {
  return p.variants.find((v) => v.type === "color");
}

/** Listing-level + varyant opsiyonu video URL'lerini tek listede toplar. */
export function collectVideoUrls(p: ProductDetail): string[] {
  const urls: string[] = [];
  if (p.videoUrl) urls.push(p.videoUrl);
  for (const variant of p.variants) {
    for (const opt of variant.options) {
      if (opt.videoUrl) urls.push(opt.videoUrl);
    }
  }
  return urls;
}

/** En spesifik kategori (categoryRanks level=0, yaprak) — "Benzer ürünleri bul" linki için. */
function mostSpecificCategorySlug(p: ProductDetail): string {
  const ranks = p.categoryRanks ?? [];
  const leaf = ranks.find((r) => r.level === 0) ?? ranks[0];
  return leaf?.slug ?? "";
}

const closeSvg = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>`;
const lensSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="11" cy="11" r="3.5"/><path d="m16 16-1.5-1.5"/></svg>`;

const chipCls =
  "th-no-press appearance-none focus:outline-none px-3 py-[5px] rounded-full text-xs font-semibold text-white/90 whitespace-nowrap leading-tight transition-colors duration-150 [&.pdmv-chip-active]:bg-white [&.pdmv-chip-active]:text-[#111827]";

const slideCls =
  "shrink-0 w-full [scroll-snap-align:start] aspect-square relative flex items-center justify-center bg-black";

/* ── Public HTML (bir kez, sayfaya eklenir) ──────────────────────── */

export function MediaViewer(): string {
  const p = getCurrentProduct();
  const hasColor = !!getColorVariant(p);
  const hasVideo = collectVideoUrls(p).length > 0;
  const slug = mostSpecificCategorySlug(p);

  const findSimilarHtml = slug
    ? `
    <a href="${escapeHtml(sanitizeUrl(`/pages/products.html?cat=${encodeURIComponent(slug)}`))}"
      class="th-no-press appearance-none focus:outline-none flex flex-col items-center gap-1 text-white text-[11.5px]">
      ${lensSvg}
      ${t("productGrid.findSimilar")}
    </a>`
    : "";

  const chipsHtml = `
    <button type="button" data-pdmv-mode="photos" class="pdmv-chip-active ${chipCls}">${t("product.mobilePhotosCounter")} <span id="pdmv-counter"></span></button>
    ${hasColor ? `<button type="button" data-pdmv-mode="variants" class="${chipCls}">${t("product.optionsSheetTitle")}</button>` : ""}
    ${hasVideo ? `<button type="button" data-pdmv-mode="video" class="${chipCls}">${t("product.videoTab")}</button>` : ""}
  `;

  return `
    <div id="${VIEWER_ID}" class="pdmv-hidden [&.pdmv-hidden]:hidden fixed inset-0 z-[220] bg-black opacity-0 pointer-events-none flex flex-col transition-opacity duration-200 motion-reduce:transition-none [&.pdmv-visible]:opacity-100 [&.pdmv-visible]:pointer-events-auto"
      role="dialog" aria-modal="true" aria-label="${t("product.productGallery")}" aria-hidden="true">
      <div class="flex items-start justify-between px-4 pt-3.5 pb-2">
        <button type="button" id="pdmv-close" class="th-no-press appearance-none focus:outline-none w-9 h-9 flex items-center justify-center text-white" aria-label="${t("prodUi.close")}">${closeSvg}</button>
        ${findSimilarHtml}
      </div>
      <div id="pdmv-strip" class="flex-1 flex items-center overflow-x-auto [scroll-snap-type:x_mandatory] [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"></div>
      <div class="flex justify-center px-4 pt-2.5 pb-3.5">
        <div class="flex gap-0.5 bg-black/50 rounded-full p-[3px] [backdrop-filter:blur(2px)]">${chipsHtml}</div>
      </div>
    </div>
  `;
}

/* ── Slide renderers per mode ─────────────────────────────────────── */

function renderPhotosSlides(p: ProductDetail): string {
  return p.images
    .map(
      (img) => `
      <div class="${slideCls}">
        ${
          img.src
            ? `<img class="max-w-full max-h-full object-contain select-none" src="${escapeHtml(sanitizeUrl(img.src))}" alt="${escapeHtml(img.alt)}" width="800" height="800" decoding="async" draggable="false">`
            : ""
        }
      </div>`
    )
    .join("");
}

function renderVariantSlides(p: ProductDetail): string {
  const colorVariant = getColorVariant(p);
  if (!colorVariant) return "";
  return colorVariant.options
    .map((opt) => {
      const label = opt.displayLabel || opt.label;
      return `
      <div class="${slideCls}">
        ${
          opt.thumbnail
            ? `<img class="max-w-full max-h-full object-contain select-none" src="${escapeHtml(sanitizeUrl(opt.thumbnail))}" alt="${escapeHtml(label)}" width="800" height="800" decoding="async" draggable="false">`
            : ""
        }
        <span class="absolute end-3.5 bottom-3.5 bg-black/55 text-white text-xs px-2.5 py-1 rounded-full">${escapeHtml(label)}</span>
      </div>`;
    })
    .join("");
}

function renderVideoSlides(p: ProductDetail): string {
  return collectVideoUrls(p)
    .map((url) => `<div class="${slideCls}">${toVideoEmbedHtml(url)}</div>`)
    .join("");
}

function slideCountFor(mode: MediaViewerMode, p: ProductDetail): number {
  if (mode === "photos") return p.images.length;
  if (mode === "variants") return getColorVariant(p)?.options.length ?? 0;
  return collectVideoUrls(p).length;
}

/* ── State sync ────────────────────────────────────────────────────── */

function updateCounter(index: number, total: number): void {
  const el = document.getElementById("pdmv-counter");
  if (!el) return;
  el.textContent = currentMode === "photos" && total > 0 ? `${index + 1}/${total}` : "";
}

function updateActiveChip(mode: MediaViewerMode): void {
  document
    .querySelectorAll<HTMLButtonElement>(`#${VIEWER_ID} [data-pdmv-mode]`)
    .forEach((btn) => btn.classList.toggle("pdmv-chip-active", btn.dataset.pdmvMode === mode));
}

function renderSlides(mode: MediaViewerMode, startIndex: number): void {
  const strip = document.getElementById("pdmv-strip");
  if (!strip) return;
  currentMode = mode;

  const p = getCurrentProduct();
  strip.innerHTML =
    mode === "photos"
      ? renderPhotosSlides(p)
      : mode === "variants"
        ? renderVariantSlides(p)
        : renderVideoSlides(p);

  updateCounter(startIndex, slideCountFor(mode, p));
  requestAnimationFrame(() => {
    strip.scrollLeft = startIndex * strip.clientWidth;
  });
}

/* ── Open / close ──────────────────────────────────────────────────── */

function isVisible(): boolean {
  return !!document.getElementById(VIEWER_ID)?.classList.contains("pdmv-visible");
}

function closeViewer(): void {
  const viewer = document.getElementById(VIEWER_ID);
  if (!viewer) return;
  viewer.classList.remove("pdmv-visible");
  viewer.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  const onEnd = () => viewer.classList.add("pdmv-hidden");
  viewer.addEventListener("transitionend", onEnd, { once: true });
  setTimeout(onEnd, 250);
}

/** Galeri slaytı, "Daha fazla" linki, gallery chip'i veya OptionsSheet
 *  büyütme ikonundan çağrılır. Masaüstünde viewer DOM'a hiç eklenmediği
 *  için (mobil-only init guard) no-op olur. */
export function openMediaViewer(mode: MediaViewerMode, index = 0): void {
  const viewer = document.getElementById(VIEWER_ID);
  if (!viewer) return;

  viewer.classList.remove("pdmv-hidden");
  viewer.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  renderSlides(mode, index);
  updateActiveChip(mode);

  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      viewer.classList.add("pdmv-visible");
      document.getElementById("pdmv-close")?.focus();
    })
  );
}

export function initMediaViewer(): void {
  const viewer = document.getElementById(VIEWER_ID);
  if (!viewer) return;

  document.getElementById("pdmv-close")?.addEventListener("click", closeViewer);

  viewer.querySelectorAll<HTMLButtonElement>("[data-pdmv-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.pdmvMode as MediaViewerMode;
      renderSlides(mode, 0);
      updateActiveChip(mode);
    });
  });

  const strip = document.getElementById("pdmv-strip");
  strip?.addEventListener(
    "scroll",
    () => {
      if (currentMode !== "photos" || strip.clientWidth === 0) return;
      const idx = Math.round(strip.scrollLeft / strip.clientWidth);
      updateCounter(idx, slideCountFor("photos", getCurrentProduct()));
    },
    { passive: true }
  );

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isVisible()) closeViewer();
  });
}
