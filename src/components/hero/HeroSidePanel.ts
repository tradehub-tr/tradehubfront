/**
 * HeroSidePanel — Hero'nun yanındaki "En İyi Fırsatlar" mini rotator'ı + RFQ
 * kartı (Sarı İmza split-hero düzeninin sağ kolonu). Fırsatlar TopDeals ile
 * aynı kaynaktan gelir (is_deal=1, en yüksek indirim önce) ve 4 sn ritimle
 * kendi kendine döner (hover'da durur, prefers-reduced-motion'da kapalı).
 * Geri sayım gün sonuna kadar canlı işler. Fırsat yoksa kart gizlenir,
 * RFQ kartı kalır.
 */

import { t } from "../../i18n";
import { formatStartingPrice } from "../../utils/currency";
import { initCurrency } from "../../services/currencyService";
import { searchListings } from "../../services/listingService";
import { getListingUrl } from "../../utils/listingUrl";
import { escapeHtml, sanitizeUrl } from "../../utils/sanitize";

const DEAL_COUNT = 4;
const ROTATE_MS = 4000;

interface SideDeal {
  name: string;
  href: string;
  price: string;
  originalPrice?: string;
  discountPercent?: number;
  imageSrc: string;
  moqCount: number;
}

function flameIcon(): string {
  return `<svg class="h-4 w-4 shrink-0 text-[#f5b800]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`;
}

function renderDealSlide(deal: SideDeal, index: number): string {
  const badge =
    deal.discountPercent && deal.discountPercent > 0
      ? `<span class="absolute start-1.5 top-1.5 z-10 rounded-sm bg-[#f5b800] px-1.5 py-0.5 text-[10px] font-extrabold leading-none text-[#1a1a1a]">-%${deal.discountPercent}</span>`
      : "";
  const img = deal.imageSrc
    ? `<img src="${escapeHtml(sanitizeUrl(deal.imageSrc))}" alt="${escapeHtml(deal.name)}" loading="lazy" class="h-full w-full object-contain">`
    : `<div class="flex h-full w-full items-center justify-center text-neutral-600"><svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z"/></svg></div>`;
  const oldPrice = deal.originalPrice
    ? `<span class="text-[11px] text-white/45 line-through tabular-nums">${escapeHtml(deal.originalPrice)}</span>`
    : "";
  const moqText = t("topDeals.moq", { count: deal.moqCount, unit: t("topDeals.pieces") });
  return `
    <a href="${escapeHtml(sanitizeUrl(deal.href))}"
       class="hero-deal-slide pointer-events-none absolute inset-0 flex flex-col gap-1.5 px-3.5 pb-1 opacity-0 transition-opacity duration-500 motion-reduce:transition-none data-[state=on]:pointer-events-auto data-[state=on]:opacity-100 no-underline appearance-none focus:outline-none"
       data-state="${index === 0 ? "on" : "off"}">
      <span class="relative min-h-0 flex-1 overflow-hidden rounded-md bg-white p-1">${badge}${img}</span>
      <span class="truncate text-[13px] font-semibold text-white">${escapeHtml(deal.name)}</span>
      <span class="flex items-baseline gap-2">
        <span class="text-[17px] font-extrabold leading-none text-white tabular-nums">${escapeHtml(deal.price)}</span>
        ${oldPrice}
      </span>
      <span class="text-[11px] leading-none text-neutral-400">${moqText}</span>
    </a>`;
}

export function HeroSidePanel(): string {
  return `
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:h-[360px] xl:grid-cols-1 xl:grid-rows-[minmax(0,1fr)_auto]">
      <div id="hero-deals" class="relative flex h-[230px] min-h-0 flex-col overflow-hidden rounded-md border border-[#2a271f] bg-[#141310] xl:h-auto">
        <div class="flex items-center justify-between px-3.5 pb-1.5 pt-3">
          <span class="flex items-center gap-1.5 text-[13px] font-extrabold text-white">
            ${flameIcon()}
            ${t("heroSide.bestDeals")}
          </span>
        </div>
        <div id="hero-deals-stage" class="relative min-h-0 flex-1">
          <div class="absolute inset-0 flex animate-pulse flex-col gap-2 px-3.5">
            <div class="min-h-0 flex-1 rounded-md bg-neutral-800"></div>
            <div class="h-3 w-3/4 rounded bg-neutral-800"></div>
            <div class="h-4 w-1/2 rounded bg-neutral-800"></div>
          </div>
        </div>
        <div class="flex items-center justify-between px-3.5 pb-2.5 pt-1.5">
          <span id="hero-deals-dots" class="flex gap-1.5"></span>
          <a href="/pages/top-deals.html" class="text-[11px] font-bold text-[#f5b800] no-underline appearance-none focus:outline-none hover:text-[#ffd75e]">${t("heroSide.allDeals")} ›</a>
        </div>
      </div>
      <a href="/pages/dashboard/rfq-form.html"
         class="flex items-center gap-3 rounded-md border border-[var(--color-border,#e5e5e5)] bg-white p-3.5 no-underline appearance-none focus:outline-none transition-colors duration-150 hover:border-[#f5b800]">
        <svg class="h-6 w-6 shrink-0 text-[#d39c00]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 15h6M9 11h2"/></svg>
        <span class="min-w-0">
          <span class="block text-[12.5px] font-bold leading-tight text-[#171717]">${t("heroSide.rfqTitle")}</span>
          <span class="block truncate text-[10.5px] text-[#737373]">${t("heroSide.rfqDesc")}</span>
        </span>
        <span class="ms-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f5b800] text-[#1a1a1a]">
          <svg class="h-3.5 w-3.5 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </span>
      </a>
    </div>`;
}

function startRotation(card: HTMLElement, slides: HTMLElement[], dots: HTMLElement[]): void {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let idx = 0;
  let timer: number | null = null;

  const show = (i: number): void => {
    idx = (i + slides.length) % slides.length;
    slides.forEach((s, k) => (s.dataset.state = k === idx ? "on" : "off"));
    dots.forEach((d, k) => (d.dataset.state = k === idx ? "on" : "off"));
  };
  const stop = (): void => {
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  };
  const play = (): void => {
    stop();
    if (!reduced && slides.length > 1) timer = window.setInterval(() => show(idx + 1), ROTATE_MS);
  };

  dots.forEach((d, k) =>
    d.addEventListener("click", () => {
      show(k);
      play();
    })
  );
  card.addEventListener("mouseenter", stop);
  card.addEventListener("mouseleave", play);
  play();
}

export function initHeroSidePanel(): void {
  const card = document.getElementById("hero-deals");
  const stage = document.getElementById("hero-deals-stage");
  const dotsWrap = document.getElementById("hero-deals-dots");
  if (!card || !stage || !dotsWrap) return;

  initCurrency()
    .then(() => searchListings({ is_deal: true, page_size: DEAL_COUNT, sort_by: "discount" }))
    .then((result) => {
      if (result.products.length === 0) {
        card.style.display = "none";
        return;
      }
      const deals: SideDeal[] = result.products.slice(0, DEAL_COUNT).map((p) => ({
        name: p.name,
        href: getListingUrl({ id: p.id, href: p.href }),
        price: formatStartingPrice(p.price) || p.price,
        originalPrice: p.originalPrice || undefined,
        discountPercent:
          p.discountPercentage && p.discountPercentage > 0
            ? Math.round(p.discountPercentage)
            : undefined,
        imageSrc: p.imageSrc || "",
        moqCount: parseInt(p.moq) || 1,
      }));

      stage.innerHTML = deals.map(renderDealSlide).join("");
      dotsWrap.innerHTML = deals
        .map(
          (_, i) =>
            `<button type="button" class="th-no-press h-1.5 w-1.5 cursor-pointer rounded-full bg-white/25 transition-colors data-[state=on]:bg-[#f5b800]" data-state="${i === 0 ? "on" : "off"}" aria-label="${t("heroSide.bestDeals")} ${i + 1}"></button>`
        )
        .join("");

      const slides = Array.from(stage.querySelectorAll<HTMLElement>(".hero-deal-slide"));
      const dots = Array.from(dotsWrap.querySelectorAll<HTMLElement>("button"));
      startRotation(card, slides, dots);
    })
    .catch((err) => {
      console.warn("[HeroSidePanel] fırsatlar yüklenemedi:", err);
      card.style.display = "none";
    });
}
