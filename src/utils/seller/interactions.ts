/**
 * Seller Storefront — Interaction Handlers
 * All JS interactions: Swiper init, dropdowns, sticky nav, form validation, floating actions
 */
import Swiper from "swiper";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/swiper-bundle.css";
import { showToast } from "../toast";

// ═══════════════════════════════════════════════════════════
// Swiper Initialization
// ═══════════════════════════════════════════════════════════

/**
 * Initialize all Swiper carousel instances
 */
export function initAllSwipers(): void {
  initHeroSwiper();
  initCertificatesSwiper();
  initCompanyCarousel();
  initMainProductsSwiper();
}

/**
 * Main Products Carousel (seller storefront)
 */
function initMainProductsSwiper(): Swiper | null {
  const el = document.querySelector(".main-products-swiper");
  if (!el) {
    // Alpine might render it later, retry once after a short delay
    setTimeout(() => {
      if (document.querySelector(".main-products-swiper")) {
        new Swiper(".main-products-swiper", {
          modules: [Navigation],
          slidesPerView: 1.2,
          spaceBetween: 12,
          navigation: { nextEl: ".main-products-next", prevEl: ".main-products-prev" },
          breakpoints: {
            480: { slidesPerView: 2, spaceBetween: 12 },
            640: { slidesPerView: 3, spaceBetween: 16 },
            1024: { slidesPerView: 4, spaceBetween: 16 },
            1280: { slidesPerView: 5, spaceBetween: 16 },
          },
        });
      }
    }, 800);
    return null;
  }

  return new Swiper(".main-products-swiper", {
    modules: [Navigation],
    slidesPerView: 1.2,
    spaceBetween: 12,
    navigation: { nextEl: ".main-products-next", prevEl: ".main-products-prev" },
    breakpoints: {
      480: { slidesPerView: 2, spaceBetween: 12 },
      640: { slidesPerView: 3, spaceBetween: 16 },
      1024: { slidesPerView: 4, spaceBetween: 16 },
      1280: { slidesPerView: 5, spaceBetween: 16 },
    },
  });
}

/**
 * Hero Banner Swiper (C3) — admin panelden gelen ayarlara gore dinamik init
 */
let heroSwiperInstance: Swiper | null = null;

function buildHeroSwiper(): Swiper | null {
  const el = document.querySelector<HTMLElement>(".store-hero__swiper");
  if (!el) {
    console.warn("[Hero Swiper] .store-hero__swiper elementi bulunamadi");
    return null;
  }

  const section = el.closest<HTMLElement>('[data-section="hero_banner"]');
  const mode = section?.getAttribute("data-hero-mode") || "slider";
  const dataSlideCount = section?.getAttribute("data-hero-slides");
  console.log("[Hero Swiper BUILD]", {
    mode,
    autoplayAttr: section?.getAttribute("data-hero-autoplay"),
    delayAttr: section?.getAttribute("data-hero-delay"),
    dataSlideCount,
    domSlideCount: el.querySelectorAll(".swiper-slide").length,
    elWidth: el.offsetWidth,
    elVisible: el.offsetWidth > 0 && el.offsetHeight > 0,
  });
  if (mode !== "slider") return null;

  const autoplay = section?.getAttribute("data-hero-autoplay") === "1";
  const delayAttr = parseInt(section?.getAttribute("data-hero-delay") || "5000", 10);
  const delay = Number.isFinite(delayAttr) && delayAttr >= 1000 ? delayAttr : 5000;

  const slideCount = el.querySelectorAll(".swiper-slide").length;
  if (slideCount === 0) {
    console.warn("[Hero Swiper] swiper-slide DOM elementi yok, init iptal");
    return null;
  }
  const enableLoop = slideCount > 1;

  // Eski instance varsa temizle (Alpine seller fetch sonrasi yeniden init icin)
  if (heroSwiperInstance) {
    try {
      heroSwiperInstance.destroy(true, true);
    } catch {
      /* ignore */
    }
    heroSwiperInstance = null;
  }

  heroSwiperInstance = new Swiper(el, {
    modules: [Autoplay, Pagination, Navigation],
    loop: enableLoop,
    autoplay:
      autoplay && slideCount > 1
        ? { delay, disableOnInteraction: false, pauseOnMouseEnter: true }
        : false,
    speed: 600,
    // observer: parent x-show degisince (Alpine loading->loaded) Swiper boyutu yeniden hesaplar
    observer: true,
    observeParents: true,
    observeSlideChildren: true,
    pagination: {
      el: ".store-hero__pagination",
      clickable: true,
      bulletClass: "store-hero__dot",
      bulletActiveClass: "store-hero__dot--active",
    },
    navigation:
      slideCount > 1
        ? {
            nextEl: ".store-hero__next",
            prevEl: ".store-hero__prev",
          }
        : false,
  });
  console.log("[Hero Swiper READY]", {
    slideCount,
    enableLoop,
    autoplayActive: autoplay && slideCount > 1,
    delay,
    swiperWidth: heroSwiperInstance?.width,
    hasNavigation: slideCount > 1,
  });
  return heroSwiperInstance;
}

function initHeroSwiper(): Swiper | null {
  const result = buildHeroSwiper();

  // Alpine x-show="!loading && seller" baslangicta gizli — gorunur olunca yeniden init et
  // Hero section gorunurluk degisimini izle, Swiper'i yeniden olustur ki dogru genislikte render edilsin
  const section = document.querySelector<HTMLElement>('[data-section="hero_banner"]');
  if (section) {
    const parentObserver = new MutationObserver(() => {
      // Parent x-show ile display:none -> '' olunca rebuild
      const swiperEl = document.querySelector<HTMLElement>(".store-hero__swiper");
      if (
        swiperEl &&
        swiperEl.offsetWidth > 0 &&
        (!heroSwiperInstance || heroSwiperInstance.width === 0)
      ) {
        buildHeroSwiper();
      }
    });
    // Tum atalardaki style/class degisimlerini izle (Alpine x-show display:none toggle)
    let parent: HTMLElement | null = section.parentElement;
    while (parent) {
      parentObserver.observe(parent, { attributes: true, attributeFilter: ["style", "class"] });
      parent = parent.parentElement;
    }
  }
  return result;
}

/**
 * Certificates Carousel Swiper (C8)
 */
function initCertificatesSwiper(): Swiper | null {
  const el = document.querySelector(".certificates__swiper");
  if (!el) return null;

  return new Swiper(".certificates__swiper", {
    modules: [Navigation, Pagination],
    slidesPerView: 4,
    spaceBetween: 16,
    loop: false,
    navigation: { nextEl: ".certificates__next", prevEl: ".certificates__prev" },
    pagination: { el: ".certificates__dots", clickable: true },
    breakpoints: {
      0: { slidesPerView: 1, spaceBetween: 8 },
      480: { slidesPerView: 2, spaceBetween: 12 },
      768: { slidesPerView: 3, spaceBetween: 16 },
      1024: { slidesPerView: 4, spaceBetween: 16 },
    },
  });
}

/**
 * Company Info Carousel — Variant B (C7)
 */
function initCompanyCarousel(): Swiper | null {
  const el = document.querySelector(".company-info__carousel-swiper");
  if (!el) return null;

  return new Swiper(".company-info__carousel-swiper", {
    modules: [Navigation],
    loop: true,
    speed: 500,
    navigation: { nextEl: ".company-info__next", prevEl: ".company-info__prev" },
  });
}

// ═══════════════════════════════════════════════════════════
// Store Header Interactions (C1) — Spec 4.6.1
// ═══════════════════════════════════════════════════════════

/**
 * Store Header — Follow button toggle, share action
 */
export function initStoreHeaderInteractions(): void {
  const followBtn = document.querySelector(".store-header__follow-btn") as HTMLButtonElement;
  if (followBtn) {
    followBtn.addEventListener("click", () => {
      const isFollowing = followBtn.classList.toggle("store-header__follow-btn--active");
      followBtn.textContent = isFollowing ? "Takip Ediliyor" : "Takip Et";
      followBtn.setAttribute("aria-pressed", String(isFollowing));
    });
  }

  const shareBtn = document.querySelector(".store-header__share-btn") as HTMLButtonElement;
  if (shareBtn) {
    shareBtn.addEventListener("click", () => {
      if (navigator.share) {
        navigator.share({ title: document.title, url: window.location.href });
      } else {
        navigator.clipboard.writeText(window.location.href);
      }
    });
  }
}

// ═══════════════════════════════════════════════════════════
// Store Nav Interactions (C2)
// ═══════════════════════════════════════════════════════════

/**
 * Store Nav Dropdown Toggle
 */
export function initStoreNavDropdowns(): void {
  const dropdownTriggers = document.querySelectorAll(".store-nav__item--dropdown");

  dropdownTriggers.forEach((trigger) => {
    const dropdown = trigger.nextElementSibling as HTMLElement;
    if (!dropdown) return;

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = !dropdown.classList.contains("hidden");
      closeAllDropdowns();
      if (!isOpen) {
        dropdown.classList.remove("hidden");
        trigger.setAttribute("aria-expanded", "true");
        // Rotate chevron
        const chevron = trigger.querySelector("svg");
        if (chevron) (chevron as SVGElement).style.transform = "rotate(180deg)";
      }
    });
  });

  // Close on click outside
  document.addEventListener("click", () => closeAllDropdowns());

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAllDropdowns();
  });
}

function closeAllDropdowns(): void {
  document.querySelectorAll(".store-nav__dropdown").forEach((dd) => {
    dd.classList.add("hidden");
  });
  document.querySelectorAll(".store-nav__item--dropdown").forEach((trigger) => {
    trigger.setAttribute("aria-expanded", "false");
    const chevron = trigger.querySelector("svg");
    if (chevron) (chevron as unknown as HTMLElement).style.transform = "";
  });
}

/**
 * Store Nav Sticky Scroll Handler
 */
export function initStickyNav(): void {
  const nav = document.getElementById("store-nav");
  if (!nav) return;

  window.addEventListener(
    "scroll",
    () => {
      if (window.scrollY > 10) {
        nav.classList.add("store-nav--scrolled");
      } else {
        nav.classList.remove("store-nav--scrolled");
      }
    },
    { passive: true }
  );
}

/**
 * Store Nav Search Input
 */
export function initSearchInput(): void {
  const searchInput = document.querySelector(".store-nav__search-input") as HTMLInputElement;
  const searchBtn = document.querySelector(".store-nav__search-btn") as HTMLButtonElement;

  if (!searchInput || !searchBtn) return;

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch(searchInput.value.trim());
    }
    if (e.key === "Escape") {
      searchInput.value = "";
      searchInput.blur();
    }
  });

  searchBtn.addEventListener("click", (e) => {
    e.preventDefault();
    handleSearch(searchInput.value.trim());
  });
}

function handleSearch(query: string): void {
  if (query.length < 2) return;
  const searchUrl = `?search=${encodeURIComponent(query)}`;
  window.location.href = searchUrl;
}

/**
 * Mobile Hamburger Menu Toggle
 */
export function initMobileMenu(): void {
  const hamburger = document.querySelector(".store-nav__hamburger") as HTMLButtonElement;
  const mobileMenu = document.getElementById("store-nav-mobile-menu");

  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.contains("store-nav__mobile-menu--open");
    if (isOpen) {
      mobileMenu.classList.remove("store-nav__mobile-menu--open");
      hamburger.setAttribute("aria-expanded", "false");
    } else {
      mobileMenu.classList.add("store-nav__mobile-menu--open");
      hamburger.setAttribute("aria-expanded", "true");
    }
  });

  // Mobile dropdown toggles
  const mobileTriggers = document.querySelectorAll(".store-nav__mobile-dropdown-trigger");
  mobileTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const targetId = (trigger as HTMLElement).dataset.dropdown;
      if (!targetId) return;
      const target = document.getElementById(targetId);
      if (!target) return;
      const isOpen = !target.classList.contains("hidden");
      if (isOpen) {
        target.classList.add("hidden");
      } else {
        target.classList.remove("hidden");
      }
      // Rotate chevron
      const chevron = trigger.querySelector("svg");
      if (chevron) {
        (chevron as unknown as HTMLElement).style.transform = isOpen ? "" : "rotate(180deg)";
      }
    });
  });

  // Close on click outside nav
  document.addEventListener("click", (e) => {
    const nav = document.getElementById("store-nav");
    if (nav && !nav.contains(e.target as Node)) {
      mobileMenu.classList.remove("store-nav__mobile-menu--open");
      hamburger.setAttribute("aria-expanded", "false");
    }
  });
}

// ═══════════════════════════════════════════════════════════
// Contact Form (C12)
// ═══════════════════════════════════════════════════════════

/**
 * Contact Form Submit + Validation
 */
export function initContactForm(): void {
  const textarea = document.querySelector(".contact-form__textarea") as HTMLTextAreaElement;
  const counter = document.querySelector(".contact-form__counter") as HTMLSpanElement;
  const sendBtn = document.querySelector(".contact-form__send") as HTMLButtonElement;
  const checkbox = document.querySelector("#business-card") as HTMLInputElement;

  if (!textarea || !counter || !sendBtn) return;

  // Seller code — data-seller-slug on <main>
  const sellerCode =
    document.querySelector<HTMLElement>("[data-seller-slug]")?.dataset.sellerSlug || "";

  const API = (import.meta.env.VITE_API_URL ?? "") as string;

  // Character counter
  textarea.addEventListener("input", () => {
    const len = textarea.value.length;
    counter.textContent = `${len}/8000`;
    counter.className = "contact-form__counter absolute right-3 bottom-3 text-[12px]";

    if (len >= 8000) {
      counter.classList.add("text-[#ef4444]");
    } else if (len >= 7500) {
      counter.classList.add("text-[#f97316]");
    } else {
      counter.classList.add("text-[#9ca3af]");
    }
  });

  // Submit
  sendBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const msg = textarea.value.trim();
    if (msg.length < 5) {
      textarea.classList.add("border-[#ef4444]", "focus:ring-[#ef4444]/20");
      textarea.focus();
      return;
    }
    textarea.classList.remove("border-[#ef4444]", "focus:ring-[#ef4444]/20");

    sendBtn.disabled = true;
    sendBtn.textContent = "Gönderiliyor...";

    try {
      // allow_guest=True endpoint için CSRF header göndermiyoruz
      // (header gönderilirse Frappe doğrulama yapar ve başarısız olur)
      const body = new URLSearchParams({
        seller_code: sellerCode,
        message: msg,
        share_business_card: checkbox?.checked ? "1" : "0",
      });

      // credentials: 'omit' → cookie gönderilmez → Frappe guest olarak işler → CSRF gerekmez
      const res = await fetch(`${API}/method/tradehub_core.api.seller.send_inquiry`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        credentials: "omit",
        body: body.toString(),
      });
      const data = await res.json();
      if (data.message?.success) {
        showToast({ message: "Mesajınız başarıyla gönderildi!", type: "success" });
        textarea.value = "";
        counter.textContent = "0/8000";
        counter.className =
          "contact-form__counter absolute right-3 bottom-3 text-[12px] text-[#9ca3af]";
      } else {
        const errMsg = data._server_messages
          ? JSON.parse(JSON.parse(data._server_messages)[0])?.message
          : "Mesaj gönderilemedi.";
        showToast({ message: errMsg || "Mesaj gönderilemedi. Tekrar deneyin.", type: "error" });
      }
    } catch {
      showToast({ message: "Bağlantı hatası. Tekrar deneyin.", type: "error" });
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = "Gönder";
    }
  });
}

// ═══════════════════════════════════════════════════════════
// Floating Actions (C13)
// ═══════════════════════════════════════════════════════════

/**
 * Floating Button Click Handlers
 */
export function initFloatingActions(): void {
  const contactBtn = document.querySelector(".floating-actions__btn--contact");
  const chatBtn = document.querySelector(".floating-actions__btn--chat");

  contactBtn?.addEventListener("click", () => {
    document.getElementById("contact-form")?.scrollIntoView({ behavior: "smooth" });
  });

  chatBtn?.addEventListener("click", () => {
    document.dispatchEvent(new CustomEvent("store:open-chat"));
  });
}

// ═══════════════════════════════════════════════════════════
// Gallery Lightbox (C11)
// ═══════════════════════════════════════════════════════════

/**
 * Gallery Lightbox (Placeholder)
 */
export function initGalleryLightbox(): void {
  const galleryItems = document.querySelectorAll(".gallery__item");
  galleryItems.forEach((item) => {
    item.addEventListener("click", () => {
      const img = item.querySelector("img") as HTMLImageElement;
      if (!img) return;
      // Placeholder: lightbox modal — integration pending
      document.dispatchEvent(
        new CustomEvent("store:lightbox-open", { detail: { src: img.src, alt: img.alt } })
      );
    });
  });
}

// ═══════════════════════════════════════════════════════════
// Master Init
// ═══════════════════════════════════════════════════════════

/**
 * Initialize all seller storefront interactions
 */
export function initSellerStorefront(): void {
  initAllSwipers();
  initStoreHeaderInteractions();
  // initStoreNavDropdowns(); // Migrated to Alpine.js
  initStickyNav();
  initSearchInput();
  // initMobileMenu(); // Migrated to Alpine.js
  initContactForm();
  initFloatingActions();
  initGalleryLightbox();
  // initCompanyProfileTabs(); // Migrated to Alpine.js
}

// ═══════════════════════════════════════════════════════════
// C14: Company Profile Tabs
// ═══════════════════════════════════════════════════════════

export function initCompanyProfileTabs(): void {
  const mainTabs = document.querySelectorAll(".company-profile__main-tab");
  const tabContents = document.querySelectorAll(".company-profile__tab-content");

  // Main Tabs (Hesabım, Yorumlar, Ürünler)
  mainTabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = (tab as HTMLButtonElement).dataset.target;
      if (!targetId) return;

      // Update Tab Visuals
      mainTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      // Show Selected Content
      tabContents.forEach((content) => {
        if (content.id === targetId) {
          content.classList.remove("hidden");
          // small delay for transition effect
          setTimeout(() => content.classList.add("active"), 10);
        } else {
          content.classList.remove("active");
          content.classList.add("hidden");
        }
      });
    });
  });

  // Inner Links (e.g. from Overview -> Reviews)
  const tabLinks = document.querySelectorAll(".company-profile__tab-link");
  tabLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = (link as HTMLAnchorElement).dataset.target;
      if (!targetId) return;

      const correspondingTab = document.querySelector(
        `.company-profile__main-tab[data-target="${targetId}"]`
      ) as HTMLButtonElement;
      if (correspondingTab) {
        correspondingTab.click(); // trigger the visual update
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  });

  // Inner Products Category Quick Filters (Visual Only for now)
  const prodCats = document.querySelectorAll(".company-profile__prod-cat");
  prodCats.forEach((cat) => {
    cat.addEventListener("click", (e) => {
      e.preventDefault();
      prodCats.forEach((c) => c.classList.remove("active", "border-gray-900", "text-gray-900"));
      prodCats.forEach((c) => c.classList.add("border-transparent", "text-gray-500"));

      cat.classList.remove("border-transparent", "text-gray-500");
      cat.classList.add("active", "border-gray-900", "text-gray-900");
    });
  });
}
