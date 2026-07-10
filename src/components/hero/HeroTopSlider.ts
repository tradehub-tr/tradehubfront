/**
 * HeroTopSlider Component
 * Full-width promotional hero slider at the very top of the homepage
 * (Journal-theme style): centered active slide with neighbouring slides
 * peeking at the edges, stacked arrows on the right, autoplay progress dots.
 *
 * Content is DYNAMIC — managed from the admin panel (Hero Slide DocType) and
 * fetched via heroSliderService. Falls back to built-in slides when empty.
 */

import Swiper from "swiper";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/swiper-bundle.css";
import { t, getCurrentLang } from "../../i18n";
import {
  fetchActiveSlides,
  getCachedSlides,
  type HeroSlideItem,
} from "../../services/heroSliderService";
import { escapeHtml, sanitizeUrl, safeHexColor } from "../../utils/sanitize";

interface ResolvedSlide {
  label: string;
  title: string;
  description: string;
  buttonText: string;
  href: string;
  backgroundCss: string;
  textColor: string;
  align: "center" | "left" | "right";
  overlay: boolean;
}

const ALIGN_MAP: Record<ResolvedSlide["align"], string> = {
  center: "items-center text-center",
  left: "items-start text-left",
  right: "items-end text-right",
};

/**
 * Sanitize an admin-supplied CSS value for an inline `style` background.
 * It can be a gradient/color (not reducible to a single hex), so we cannot use
 * safeHexColor here. Instead we strip the tokens that enable CSS-injection /
 * clickjacking — url(), expression(), @import, JS schemes and the characters
 * that could close the declaration or break out of the style attribute — then
 * escapeHtml() the result before it reaches the attribute.
 */
function safeBackgroundCss(value: unknown, fallback: string): string {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  const dangerous = /url\s*\(|expression\s*\(|@import|javascript:|vbscript:|data:|[;{}<>\\]/i;
  return dangerous.test(raw) ? fallback : raw;
}

// Sarı İmza: iSTOC sarısı degrade (doku katmanı renderSlide'da ayrıca eklenir)
const FALLBACK_BG = "linear-gradient(115deg, #ffc41f 0%, #f5b800 55%, #e6a800 100%)";

// Slide dokularının döngüsü: halftone nokta → diyagonal çizgi → ışık patlaması.
// Admin degradesinin ÜZERİNE düşük opaklıkta binen dekoratif katman; slide
// index'ine göre dinamik seçilir, admin hangi rengi seçerse seçsin doku korunur.
const SLIDE_TEXTURES = [
  "radial-gradient(rgba(90,60,0,.13) 1.4px, transparent 1.4px) 0 0/20px 20px",
  "repeating-linear-gradient(135deg, rgba(90,60,0,.10) 0px, rgba(90,60,0,.10) 2px, transparent 2px, transparent 18px)",
  "radial-gradient(560px 320px at 85% 15%, rgba(255,255,255,.30), transparent 62%)",
];

/** Built-in fallback slides shown when the admin has not added any yet. */
function defaultSlides(): ResolvedSlide[] {
  const base = [
    {
      labelKey: "heroBanner.trendAlert",
      titleKey: "heroBanner.topPicked",
      descKey: "heroBanner.topPickedText",
      ctaKey: "heroBanner.exploreNow",
      href: "/cok-satanlar",
      backgroundCss: FALLBACK_BG,
    },
    {
      labelKey: "heroBanner.newSuppliers",
      titleKey: "heroBanner.newSuppliersDesc",
      descKey: "heroBanner.newSuppliersText",
      ctaKey: "heroBanner.seeMore",
      href: "/ureticiler",
      backgroundCss: "linear-gradient(115deg, #f7bd0e 0%, #eaaa00 60%, #d39c00 100%)",
    },
    {
      labelKey: "heroBanner.fastCustomization",
      titleKey: "heroBanner.privateLabelDesc",
      descKey: "heroBanner.privateLabelText",
      ctaKey: "heroBanner.startRequest",
      href: "/pages/dashboard/rfq-form.html",
      backgroundCss: "linear-gradient(115deg, #ffcd3d 0%, #f5b800 70%)",
    },
  ];
  return base.map((b) => ({
    label: t(b.labelKey),
    title: t(b.titleKey),
    description: t(b.descKey),
    buttonText: t(b.ctaKey),
    href: b.href,
    backgroundCss: b.backgroundCss,
    textColor: "#1a1a1a",
    align: "left",
    overlay: false,
  }));
}

function normalize(item: HeroSlideItem, lang: string): ResolvedSlide {
  const pick = (tr: string, en: string): string => (lang === "tr" ? tr : en || tr);
  return {
    label: pick(item.label_tr, item.label_en),
    title: pick(item.title_tr, item.title_en),
    description: pick(item.description_tr, item.description_en),
    buttonText: pick(item.button_text_tr, item.button_text_en),
    href: item.button_href || "",
    backgroundCss: item.background_css,
    textColor: item.text_color || "#ffffff",
    align: item.content_align || "center",
    overlay: Boolean(item.overlay),
  };
}

function buildSlides(items: HeroSlideItem[], lang: string): ResolvedSlide[] {
  return items.length ? items.map((it) => normalize(it, lang)) : defaultSlides();
}

function renderSlide(s: ResolvedSlide, index: number): string {
  const align = ALIGN_MAP[s.align] ?? ALIGN_MAP.center;
  const overlay = s.overlay ? `<div class="absolute inset-0 bg-black/35"></div>` : "";
  const href = s.href || "#";
  const backgroundCss = safeBackgroundCss(s.backgroundCss, FALLBACK_BG);
  const texture = SLIDE_TEXTURES[index % SLIDE_TEXTURES.length];
  return `
    <div class="swiper-slide">
      <a href="${escapeHtml(sanitizeUrl(href))}" class="hero-top-slide-link group relative block h-full overflow-hidden rounded-md shadow-sm transition-transform duration-200 ease-out">
        <div class="absolute inset-0" style="background: ${escapeHtml(backgroundCss)};"></div>
        <div class="pointer-events-none absolute inset-0" style="background: ${texture};"></div>
        ${overlay}
        <div class="relative z-10 flex h-full flex-col justify-center gap-1.5 p-4 sm:gap-3 sm:px-12 sm:py-6 md:px-16 ${align}" style="color: ${safeHexColor(s.textColor, "#ffffff")};">
          ${
            s.label
              ? `<span class="inline-flex max-w-full items-center truncate rounded-full bg-[#1a1a1a] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#f5b800] sm:px-3 sm:text-[11px] 2xl:px-4 2xl:py-1.5 2xl:text-xs">${escapeHtml(s.label)}</span>`
              : ""
          }
          <h2 class="line-clamp-2 max-w-2xl text-lg font-extrabold leading-tight tracking-tight sm:text-xl sm:leading-[1.15] lg:text-2xl">${escapeHtml(s.title)}</h2>
          ${
            s.description
              ? `<p class="line-clamp-2 max-w-md text-xs leading-snug opacity-80 sm:text-[13px]">${escapeHtml(s.description)}</p>`
              : ""
          }
          ${
            s.buttonText
              ? `<span class="mt-1 inline-flex w-fit shrink-0 items-center justify-center rounded-full bg-[#1a1a1a] px-4 py-1.5 text-[11px] font-semibold text-white shadow-md transition-transform group-hover:scale-[1.03] sm:mt-2 sm:px-5 sm:py-2 sm:text-xs">${escapeHtml(s.buttonText)}</span>`
              : ""
          }
        </div>
      </a>
    </div>
  `;
}

const arrowButton = (dir: "prev" | "next"): string => `
  <button
    type="button"
    class="hero-top-${dir} th-no-press flex h-11 w-11 items-center justify-center rounded-full bg-white/85 text-gray-700 shadow-lg backdrop-blur-sm transition-[background-color,color] duration-200 ease-out hover:bg-white hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 dark:bg-gray-700/85 dark:text-gray-200 dark:hover:bg-gray-700"
    aria-label="${dir === "next" ? "Next slide" : "Previous slide"}"
  >
    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${dir === "next" ? "m9 5 7 7-7 7" : "M15 19 8 12l7-7"}"/>
    </svg>
  </button>
`;

// Dot pagination: ortalanmış klasik noktalar; aktif nokta mürekkep renginde
// hafifçe uzayarak (pill) hangi slide'da olunduğunu gösterir.
const BULLET_STYLES = [
  "[&_.hero-top-bullet]:block [&_.hero-top-bullet]:h-2 [&_.hero-top-bullet]:w-2 [&_.hero-top-bullet]:rounded-full [&_.hero-top-bullet]:bg-black/25 [&_.hero-top-bullet]:cursor-pointer [&_.hero-top-bullet]:transition-all [&_.hero-top-bullet]:duration-200",
  "[&_.hero-top-bullet-active]:w-5 [&_.hero-top-bullet-active]:bg-[#1a1a1a]",
].join(" ");

export function HeroTopSlider(): string {
  // Synchronous skeleton from cached (or fallback) slides — no empty flash.
  const slides = buildSlides(getCachedSlides(), getCurrentLang());
  return `
    <div class="group/hero-top relative hero-top-slider h-full ${BULLET_STYLES}">
      <div class="swiper hero-top-swiper relative h-full !overflow-hidden">
        <div class="swiper-wrapper">
          ${slides.map(renderSlide).join("")}
        </div>
        <div class="hero-top-pagination absolute inset-x-0 bottom-4 z-20 mx-auto flex w-fit items-center justify-center gap-2"></div>
      </div>

      <div class="absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 md:block">
        ${arrowButton("prev")}
      </div>
      <div class="absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 md:block">
        ${arrowButton("next")}
      </div>
    </div>
  `;
}

let swiperInstance: Swiper | null = null;
let lastSignature = "";
let lastItems: HeroSlideItem[] = [];

function createSwiper(sliderEl: HTMLElement, root: HTMLElement, slideCount: number): void {
  const prevButton = root.querySelector<HTMLButtonElement>(".hero-top-prev");
  const nextButton = root.querySelector<HTMLButtonElement>(".hero-top-next");
  const paginationElement = root.querySelector<HTMLElement>(".hero-top-pagination");

  swiperInstance = new Swiper(sliderEl, {
    modules: [Autoplay, Navigation, Pagination],
    slidesPerView: 1,
    spaceBetween: 10,
    loop: slideCount > 1,
    observer: true,
    observeParents: true,
    speed: 650,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
      pauseOnMouseEnter: true,
    },
    navigation: { prevEl: prevButton, nextEl: nextButton },
    pagination: {
      el: paginationElement,
      clickable: true,
      bulletClass: "hero-top-bullet",
      bulletActiveClass: "hero-top-bullet-active",
      renderBullet: (_index, className) =>
        `<button type="button" class="${className} th-no-press" aria-label="Go to slide"></button>`,
    },
  });
}

function mount(root: HTMLElement, items: HeroSlideItem[], lang: string): void {
  const slides = buildSlides(items, lang);
  const signature = `${lang}|${items.map((i) => i.name).join(",") || "default"}`;
  if (signature === lastSignature && swiperInstance) return;
  lastSignature = signature;

  const wrapper = root.querySelector<HTMLElement>(".swiper-wrapper");
  const sliderEl = root.querySelector<HTMLElement>(".hero-top-swiper");
  if (!wrapper || !sliderEl) return;

  swiperInstance?.destroy(true, true);
  swiperInstance = null;
  wrapper.innerHTML = slides.map(renderSlide).join("");
  createSwiper(sliderEl, root, slides.length);
}

export function initHeroTopSlider(): void {
  const root = document.querySelector<HTMLElement>(".hero-top-slider");
  if (!root) return;

  // Mount from cache first (matches the synchronous skeleton), then refresh.
  lastItems = getCachedSlides();
  mount(root, lastItems, getCurrentLang());

  fetchActiveSlides()
    .then((items) => {
      lastItems = items;
      mount(root, items, getCurrentLang());
    })
    .catch(() => {});

  window.addEventListener("languageChanged", () => {
    mount(root, lastItems, getCurrentLang());
  });
}
