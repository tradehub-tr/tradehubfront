/**
 * TailoredSelectionsHero — "Kanal Şeridi × Veri Grafiği" hero'su.
 *
 * Tam genişlik sahne: solda künye (kategori adı + editoryal metin + opsiyonel
 * 30 günlük sipariş sparkline'ı), sağda beyaz kaideli ürün görseli; altta
 * kategori kanal şeridi. Seçim şerit butonlarıyla yapılır, sahne yeniden
 * render edilir — Swiper/coverflow ve görselden zemin rengi türetme kaldırıldı.
 */

import { t } from "../../i18n";
import type { TailoredCategory } from "../../types/tailoredSelections";
import { formatViews } from "../../utils/formatCount";
import { escapeHtml, sanitizeUrl } from "../../utils/sanitize";

const BADGE_ICONS: Record<string, string> = {
  personal:
    '<svg viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.784.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.049 9.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.673z"/></svg>',
  trend:
    '<svg viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3"><path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"/></svg>',
  quality:
    '<svg viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>',
};

const BADGE_LABELS: Record<string, string> = {
  personal: t("infoMisc.badgeInterest"),
  trend: t("infoMisc.badgeTrend"),
  quality: t("infoMisc.badgeQuality"),
};

function renderBadge(badge?: string | null): string {
  if (!badge) return "";
  const icon = BADGE_ICONS[badge];
  const label = BADGE_LABELS[badge];
  if (!icon || !label) return "";
  return `
    <span class="absolute top-3 end-3 z-10 inline-flex items-center gap-1 px-2 py-1 rounded-full"
          style="background: rgba(245,184,0,0.14); border: 1px solid rgba(245,184,0,0.45); color: #b98a00; font-size: 10px; font-weight: 800; letter-spacing: 0.3px;">
      ${icon}<span>${label}</span>
    </span>
  `;
}

/** "+%12" / "−%2" — Türkçe yüzde yazımı, işaret önde. */
function formatTrend(pct: number): string {
  return `${pct >= 0 ? "+" : "−"}%${Math.abs(Math.round(pct))}`;
}

function sparklineSvg(series: number[]): string {
  const W = 240;
  const H = 42;
  const PAD = 3;
  const min = Math.min(...series);
  const span = Math.max(...series) - min || 1;
  const pts = series.map((v, i) => {
    const x = (i / (series.length - 1)) * (W - PAD * 2) + PAD;
    const y = H - PAD - ((v - min) / span) * (H - PAD * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const [endX, endY] = pts[pts.length - 1].split(",");
  return `
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" class="block w-full h-[42px]" aria-hidden="true">
      <polyline points="${pts.join(" ")}" fill="none" stroke="#f5b800" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="${endX}" cy="${endY}" r="3" fill="#f5b800"/>
    </svg>
  `;
}

/** Sahnedeki sparkline kartı — seri verisi yoksa hiç render edilmez. */
function renderSparkCard(category: TailoredCategory): string {
  const series = category.series;
  if (!series || series.length < 2) return "";
  const trendHtml =
    typeof category.trendPct === "number"
      ? `<b class="text-xs font-bold tabular-nums ${category.trendPct >= 0 ? "text-green-400" : "text-[#8f8f88]"}">${formatTrend(category.trendPct)}</b>`
      : "";
  return `
    <div class="max-w-[420px] rounded-md border border-white/10 bg-white/[0.03] px-4 pt-3 pb-2 mb-4">
      <div class="flex items-baseline justify-between gap-2.5 mb-1">
        <span class="text-[11.5px] text-[#8f8f88]">${t("tailoredPage.orderVolume")}</span>
        ${trendHtml}
      </div>
      ${sparklineSvg(series)}
    </div>
  `;
}

function renderStage(category: TailoredCategory): string {
  const descHtml = category.description
    ? `<p class="text-sm leading-relaxed text-[#b9b9b2] line-clamp-3 mt-2 mb-4 max-w-[52ch]">${escapeHtml(category.description)}</p>`
    : `<div class="mt-2 mb-4"></div>`;
  return `
    <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_clamp(190px,24vw,280px)] lg:gap-7 items-center rounded-md border border-white/10 bg-[#161615] p-5 lg:p-7">
      <div>
        <p class="text-[12.5px] font-semibold text-[#8f8f88]">${t("tailoredPage.pickedForYou")}</p>
        <h2 class="text-white font-bold leading-tight text-[22px] lg:text-[27px] mt-1.5">${escapeHtml(category.title)}</h2>
        ${descHtml}
        ${renderSparkCard(category)}
        <button type="button" data-ts-cta class="th-btn inline-flex items-center gap-2">
          ${t("tailoredPage.viewProducts")}
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5-5 5M6 12h12"/></svg>
        </button>
      </div>
      <div class="relative order-first lg:order-none mx-auto w-full max-w-[250px] lg:max-w-none aspect-square rounded-md bg-[#f5f5f3] grid place-items-center p-4 lg:p-6 overflow-hidden">
        ${renderBadge(category.badge)}
        <img
          src="${escapeHtml(sanitizeUrl(category.imageSrc))}"
          alt="${escapeHtml(category.title)}"
          loading="eager"
          class="w-full h-full object-contain mix-blend-multiply"
        />
      </div>
    </div>
  `;
}

function renderChannel(category: TailoredCategory, isActive: boolean): string {
  const slug = category.slug || category.id;
  const views = category.viewsCount || 0;
  const viewsHtml =
    views > 0
      ? `<span class="truncate">${t("tailored.views", { count: formatViews(views) })}</span>`
      : "";
  const trendHtml =
    typeof category.trendPct === "number"
      ? `<span class="inline-flex items-center gap-0.5 flex-none font-bold ${category.trendPct >= 0 ? "text-green-400" : "text-[#8f8f88]"}">
           <svg class="w-[9px] h-[9px]" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 17l6-6 4 4 8-8"/></svg>${formatTrend(category.trendPct)}
         </span>`
      : "";
  const stateCls = isActive
    ? "border-[#f5b800]/85 bg-white/[0.06]"
    : "border-white/10 hover:border-white/25";
  return `
    <button type="button" role="tab" aria-selected="${isActive}" data-slug="${escapeHtml(slug)}"
            class="th-no-press flex-none w-[190px] lg:w-auto min-w-0 flex items-center gap-2.5 rounded-md border ${stateCls} px-3 py-2 text-start cursor-pointer transition-colors duration-150 motion-reduce:transition-none">
      <span class="flex-none w-9 h-9 rounded-md bg-[#f5f5f3] grid place-items-center p-1 overflow-hidden">
        <img src="${escapeHtml(sanitizeUrl(category.imageSrc))}" alt="" loading="lazy" class="w-full h-full object-contain mix-blend-multiply"/>
      </span>
      <span class="min-w-0 flex-1">
        <b class="block text-white text-[12.5px] font-semibold leading-tight truncate">${escapeHtml(category.title)}</b>
        <span class="flex items-center gap-1.5 text-[11px] tabular-nums ${isActive ? "text-white/70" : "text-[#8f8f88]"}">
          ${viewsHtml}${trendHtml}
        </span>
      </span>
    </button>
  `;
}

// Modül state'i — renderTailoredHero doldurur, şerit tıklamaları günceller.
let heroCategories: TailoredCategory[] = [];
let heroActiveSlug = "";
let heroOnChange: ((slug: string) => void) | undefined;

function slugOf(c: TailoredCategory): string {
  return c.slug || c.id;
}

function paint(): void {
  const stage = document.getElementById("ts-hero-stage");
  const strip = document.getElementById("ts-hero-strip");
  if (!stage || !strip) return;
  const active =
    heroCategories.find((c) => slugOf(c) === heroActiveSlug) || heroCategories[0];
  if (!active) return;
  stage.innerHTML = renderStage(active);
  strip.innerHTML = heroCategories
    .map((c) => renderChannel(c, slugOf(c) === heroActiveSlug))
    .join("");
}

/** Sahneyi anında yeniden boyar, kısa bir fade-in ile yumuşatır (reduced-motion'da animasyonsuz). */
function repaintStageWithFade(): void {
  paint();
  const stage = document.getElementById("ts-hero-stage");
  if (stage && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    stage.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: "ease-out" });
  }
}

/** Hero'yu verilen kategorilerle doldurur (API yanıtı geldikten sonra çağrılır). */
export function renderTailoredHero(categories: TailoredCategory[], activeSlug?: string): void {
  heroCategories = categories;
  heroActiveSlug = activeSlug || (categories[0] ? slugOf(categories[0]) : "");
  paint();
}

/** Aktif kategoriyi dışarıdan günceller (popstate) — onCategoryChange TETİKLEMEZ. */
export function setTailoredHeroActive(slug: string): void {
  if (slug === heroActiveSlug) return;
  heroActiveSlug = slug;
  repaintStageWithFade();
}

export function initTailoredSelectionsHero(options?: {
  onCategoryChange?: (slug: string) => void;
}): void {
  heroOnChange = options?.onCategoryChange;
  const section = document.getElementById("ts-hero-section");
  if (!section) return;

  section.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const channel = target.closest<HTMLButtonElement>("[data-slug]");
    if (channel) {
      const slug = channel.dataset.slug!;
      if (slug !== heroActiveSlug) {
        heroActiveSlug = slug;
        repaintStageWithFade();
        // Şerit innerHTML ile yeniden kurulduğu için klavye odağını yeni butona geri ver
        document
          .querySelector<HTMLButtonElement>(`#ts-hero-strip [data-slug="${CSS.escape(slug)}"]`)
          ?.focus({ preventScroll: true });
        heroOnChange?.(slug);
      }
      return;
    }
    if (target.closest("[data-ts-cta]")) {
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      document
        .getElementById("ts-product-grid")
        ?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
    }
  });
}

/** İskelet blok — API yanıtı gelene kadar sahne/şerit yer tutucusu. */
function skeletonHtml(): string {
  const chip = `<div class="flex-none w-[190px] lg:w-auto h-[54px] rounded-md bg-white/[0.05] animate-pulse motion-reduce:animate-none"></div>`;
  return `
    <div id="ts-hero-stage">
      <div class="rounded-md border border-white/10 bg-[#161615] p-5 lg:p-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_clamp(190px,24vw,280px)] lg:gap-7 items-center">
        <div class="animate-pulse motion-reduce:animate-none">
          <div class="h-3 w-32 rounded bg-white/[0.08]"></div>
          <div class="h-6 w-48 rounded bg-white/[0.12] mt-3"></div>
          <div class="h-3 w-full max-w-[380px] rounded bg-white/[0.08] mt-4"></div>
          <div class="h-3 w-3/4 max-w-[300px] rounded bg-white/[0.08] mt-2"></div>
          <div class="h-10 w-36 rounded-md bg-white/[0.1] mt-6"></div>
        </div>
        <div class="order-first lg:order-none mx-auto w-full max-w-[250px] lg:max-w-none aspect-square rounded-md bg-white/[0.06] animate-pulse motion-reduce:animate-none"></div>
      </div>
    </div>
    <div id="ts-hero-strip" role="tablist" aria-label="${t("tailoredPage.title")}"
         class="flex gap-2.5 overflow-x-auto scrollbar-hide lg:grid lg:grid-cols-3 xl:grid-cols-6 mt-3 pb-1">
      ${chip.repeat(6)}
    </div>
  `;
}

export function TailoredSelectionsHero(): string {
  return `
    <section
      id="ts-hero-section"
      class="relative overflow-hidden pt-[72px] xl:pt-9 pb-10"
      style="background-color: var(--ts-hero-bg, #0b0b0a);"
    >
      <div class="container-boxed">
        <div class="hidden xl:flex items-baseline justify-between gap-4 mb-5">
          <h1 class="text-white font-bold leading-tight" style="font-size: 26px;">
            <span data-i18n="tailoredPage.title">${t("tailoredPage.title")}</span>
          </h1>
        </div>
        ${skeletonHtml()}
      </div>

      <!-- Triangle indicator -->
      <div class="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-end" aria-hidden="true">
        <svg fill="none" height="15" viewBox="0 0 32 15" width="32" class="block">
          <path d="M14.683 1.25513C15.437 0.595339 16.5631 0.595338 17.317 1.25513L30.9322 13.1683C32.115 14.2033 31.396 16.1423 29.8322 16.1423H2.16788C0.604044 16.1423 -0.114946 14.2033 1.0678 13.1683L14.683 1.25513Z" fill="white"/>
        </svg>
      </div>
    </section>
  `;
}
