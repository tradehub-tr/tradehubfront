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

// Active-bullet progress ring geometry (r=11 → circumference ≈ 69.12)
const RING_CIRCUMFERENCE = 69.12;

const ALIGN_MAP: Record<ResolvedSlide["align"], string> = {
  center: "items-center text-center",
  left: "items-start text-left",
  right: "items-end text-right",
};

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Built-in fallback slides shown when the admin has not added any yet. */
function defaultSlides(): ResolvedSlide[] {
  const base = [
    {
      labelKey: "heroBanner.newSuppliers",
      titleKey: "heroBanner.newSuppliersDesc",
      descKey: "heroBanner.newSuppliersText",
      ctaKey: "heroBanner.seeMore",
      href: "/ureticiler",
      backgroundCss: "linear-gradient(120deg, #0c2e61 0%, #1f5fae 50%, #2f80ed 100%)",
    },
    {
      labelKey: "heroBanner.trendAlert",
      titleKey: "heroBanner.topPicked",
      descKey: "heroBanner.topPickedText",
      ctaKey: "heroBanner.exploreNow",
      href: "/cok-satanlar",
      backgroundCss: "linear-gradient(120deg, #11694a 0%, #1f9e6f 50%, #34c98a 100%)",
    },
    {
      labelKey: "heroBanner.fastCustomization",
      titleKey: "heroBanner.privateLabelDesc",
      descKey: "heroBanner.privateLabelText",
      ctaKey: "heroBanner.startRequest",
      href: "/pages/dashboard/rfq-form.html",
      backgroundCss: "linear-gradient(120deg, #3b2c8f 0%, #5a4bd6 50%, #7c6ef0 100%)",
    },
  ];
  return base.map((b) => ({
    label: t(b.labelKey),
    title: t(b.titleKey),
    description: t(b.descKey),
    buttonText: t(b.ctaKey),
    href: b.href,
    backgroundCss: b.backgroundCss,
    textColor: "#ffffff",
    align: "center",
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

function renderSlide(s: ResolvedSlide): string {
  const align = ALIGN_MAP[s.align] ?? ALIGN_MAP.center;
  const overlay = s.overlay ? `<div class="absolute inset-0 bg-black/35"></div>` : "";
  const href = s.href || "#";
  return `
    <div class="swiper-slide">
      <a href="${escapeAttr(href)}" class="hero-top-slide-link group relative block h-full overflow-hidden rounded-md shadow-sm transition-transform duration-200 ease-out">
        <div class="absolute inset-0" style="background: ${s.backgroundCss};"></div>
        ${overlay}
        <div class="relative z-10 flex h-full flex-col justify-center gap-1.5 p-3 sm:gap-4 sm:p-10 xl:p-14 ${align}" style="color: ${escapeAttr(s.textColor)};">
          ${
            s.label
              ? `<span class="inline-flex max-w-full items-center truncate rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1f5fae] shadow-sm sm:px-3 sm:text-[11px]">${escapeHtml(s.label)}</span>`
              : ""
          }
          <h2 class="line-clamp-2 max-w-2xl text-xl font-extrabold leading-tight sm:text-3xl sm:leading-[1.1] md:text-4xl lg:text-5xl xl:text-6xl">${escapeHtml(s.title)}</h2>
          ${
            s.description
              ? `<p class="line-clamp-2 max-w-md text-sm leading-snug opacity-90 sm:text-base lg:text-lg">${escapeHtml(s.description)}</p>`
              : ""
          }
          ${
            s.buttonText
              ? `<span class="mt-1 inline-flex w-fit items-center justify-center rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#0c2e61] shadow-lg transition-transform group-hover:scale-[1.03] sm:mt-2 sm:px-9 sm:py-3 sm:text-sm lg:text-base">${escapeHtml(s.buttonText)}</span>`
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

const BULLET_STYLES = [
  "[&_.hero-top-bullet]:relative [&_.hero-top-bullet]:flex [&_.hero-top-bullet]:h-6 [&_.hero-top-bullet]:w-6 sm:[&_.hero-top-bullet]:h-7 sm:[&_.hero-top-bullet]:w-7 [&_.hero-top-bullet]:items-center [&_.hero-top-bullet]:justify-center [&_.hero-top-bullet]:cursor-pointer",
  "[&_.hero-top-dot]:h-1.5 [&_.hero-top-dot]:w-1.5 sm:[&_.hero-top-dot]:h-2 sm:[&_.hero-top-dot]:w-2 [&_.hero-top-dot]:rounded-full [&_.hero-top-dot]:bg-white/55 [&_.hero-top-dot]:transition-colors",
  "[&_.hero-top-bullet-active_.hero-top-dot]:bg-white",
  "[&_.hero-top-ring]:absolute [&_.hero-top-ring]:inset-0 [&_.hero-top-ring]:h-6 [&_.hero-top-ring]:w-6 sm:[&_.hero-top-ring]:h-7 sm:[&_.hero-top-ring]:w-7 [&_.hero-top-ring]:origin-center [&_.hero-top-ring]:-rotate-90 [&_.hero-top-ring]:opacity-0",
  "[&_.hero-top-bullet-active_.hero-top-ring]:opacity-100",
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
        <div class="hero-top-pagination absolute inset-x-0 bottom-4 z-20 mx-auto flex w-fit items-center justify-center gap-1"></div>
      </div>

      <div class="absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-3 md:flex xl:right-6">
        ${arrowButton("next")}
        ${arrowButton("prev")}
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
    initialSlide: slideCount >= 3 ? 1 : 0,
    centeredSlides: true,
    spaceBetween: 10,
    loop: slideCount > 1,
    loopAdditionalSlides: 2,
    observer: true,
    observeParents: true,
    speed: 650,
    breakpoints: {
      640: { slidesPerView: 1.12, spaceBetween: 16 },
      1280: { slidesPerView: 1.16, spaceBetween: 20 },
    },
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
        `<button type="button" class="${className} th-no-press" aria-label="Go to slide">
          <span class="hero-top-dot"></span>
          <svg class="hero-top-ring" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <circle cx="14" cy="14" r="11" stroke="white" stroke-width="2" stroke-linecap="round" stroke-dasharray="${RING_CIRCUMFERENCE}" stroke-dashoffset="${RING_CIRCUMFERENCE}"></circle>
          </svg>
        </button>`,
    },
  });

  // Drive the active bullet's progress ring with the autoplay timer.
  swiperInstance.on("autoplayTimeLeft", (_s, _time, progress) => {
    const circle = root.querySelector<SVGCircleElement>(
      ".hero-top-bullet-active .hero-top-ring circle"
    );
    if (circle) circle.style.strokeDashoffset = String(RING_CIRCUMFERENCE * progress);
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
