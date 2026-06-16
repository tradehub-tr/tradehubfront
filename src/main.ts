import "./style.css";
import { initFlowbite } from "flowbite";
import { applyTheme, loadTheme } from "./utils/themeStorage";

// Site geneli tema — HEAD inline script'i (vite.config.ts → themeBootstrapPlugin)
// cache'ten uygulayıp arka planda fetch ediyor. Burada sadece yerel geliştirici
// drawer'ının override'larını remote'un üzerine tekrar uyguluyoruz ki dev
// deneyimi bozulmasın.
(() => {
  const localDev = loadTheme();
  if (Object.keys(localDev).length) applyTheme(localDev);
})();

// i18n
import { t } from "./i18n";
import { initLanguageSelector } from "./components/header/TopBar";
import { initHeaderNotice } from "./components/header/HeaderNotice";

// Header components
import {
  TopBar,
  initMobileDrawer,
  SubHeader,
  initStickyHeaderSearch,
  MegaMenu,
  initMegaMenu,
  initHeaderCart,
} from "./components/header";

// Hero components
import {
  CategoryBrowse,
  initCategoryBrowse,
  RecommendationSlider,
  initRecommendationSlider,
  HeroSideBannerSlider,
  initHeroSideBannerSlider,
  HeroTopSlider,
  initHeroTopSlider,
  MobileCategoryBar,
  initMobileCategoryBar,
  TopDeals,
  initTopDeals,
  TopRanking,
  initTopRanking,
  TailoredSelections,
  initTailoredSelections,
  ProductGrid,
  initProductGrid,
} from "./components/hero";

// Category showcase (bento grid)
import { CategoryShowcase, initCategoryShowcase } from "./components/category";

// Footer components
import { FooterLinks } from "./components/footer";

// Floating components
import { FloatingPanel, BottomNav, initBottomNav } from "./components/floating";

// Alpine.js
import { startAlpine } from "./alpine";

// Utilities
import { initAnimatedPlaceholder } from "./utils/animatedPlaceholder";

const appEl = document.querySelector<HTMLDivElement>("#app")!;
// Shell JS ile basıldığında ani pop yerine yumuşak opacity girişi:
// başta saydam, init bitince rAF içinde opacity-100'e geç (motion-reduce fallback'li).
appEl.classList.add(
  "relative",
  "opacity-0",
  "transition-opacity",
  "duration-200",
  "ease-out",
  "motion-reduce:transition-none",
);
appEl.innerHTML = `
  <!-- Sticky Header (global, stays sticky across full page) -->
  <div id="sticky-header" class="sticky top-0 z-(--z-header) bg-white dark:bg-gray-900">
    ${TopBar()}
    ${SubHeader()}
  </div>

  <!-- Mobile Category Bar (iSTOC-style, mobile/tablet only) -->
  ${MobileCategoryBar()}

  <!-- Mega Menu (fixed overlay, positioned by JS) -->
  ${MegaMenu()}

  <!-- Main Content -->
  <main>
    <!-- Top Hero: Full-width promotional banner slider (Journal-style) -->
    <section class="pt-1 pb-2 xl:pt-3 xl:pb-4" aria-label="${t("commonNav.featuredCampaigns")}">
      <div class="container-boxed">
        <div class="rounded-md bg-gray-50 px-3 py-2 sm:px-4 sm:py-3 lg:py-4">
          <div class="mx-auto w-full max-w-[1280px] 2xl:max-w-[1680px]">
            <div class="h-[200px] sm:h-[340px] lg:h-[400px] xl:h-[430px] 2xl:h-[480px]">
              ${HeroTopSlider()}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Category Showcase: Bento grid (journal-style) -->
    <section class="pt-1 pb-2 xl:py-6" aria-label="Kategori vitrini">
      <div class="container-boxed">
        ${CategoryShowcase()}
      </div>
    </section>

    <!-- Hero: Categories + Recommendation Slider + Right Banner Slider -->
    <section class="pt-1 pb-2 xl:py-6" aria-label="Browse categories and recommendations">
      <div class="container-boxed">
        <div class="flex flex-col xl:flex-row gap-(--space-card-gap) items-stretch">
          <div class="hidden xl:block xl:w-[300px] xl:flex-shrink-0">
            ${CategoryBrowse()}
          </div>
          <div class="h-[200px] sm:h-[260px] xl:h-[300px] flex-1 min-w-0">
            ${RecommendationSlider()}
          </div>
          <div class="hidden h-[300px] xl:block xl:w-[340px] xl:flex-shrink-0">
            ${HeroSideBannerSlider()}
          </div>
        </div>
      </div>
    </section>

    <!-- Top Deals Section -->
    ${TopDeals()}

    <!-- Top Ranking Section -->
    ${TopRanking()}

    <!-- Tailored Selections Section -->
    ${TailoredSelections()}

    <!-- Product Grid Section -->
    ${ProductGrid()}
  </main>

  <!-- Footer Section -->
  <footer>
    ${FooterLinks()}
  </footer>

  <!-- Floating Panel -->
  ${FloatingPanel()}

  <!-- Bottom Navigation (mobile/tablet) -->
  ${BottomNav()}

`;

// Initialize custom component behaviors FIRST (before Flowbite can interfere)
initMegaMenu();

// Initialize Flowbite for other interactive components
initFlowbite();

// Initialize Alpine.js (FloatingPanel is now Alpine-driven)
startAlpine();

// Initialize remaining custom behaviors
initStickyHeaderSearch();
initHeroTopSlider();
initCategoryBrowse();
initMobileCategoryBar();
initRecommendationSlider();
initHeroSideBannerSlider();

initTopDeals();
initTopRanking();
initTailoredSelections();
initProductGrid();

initMobileDrawer();
initBottomNav();
initHeaderCart();
initLanguageSelector();
// Header notice'ı arka planda taze veriyle güncelle (cache zaten gösterildi)
void initHeaderNotice();
// Kategori vitrini bento grid'i arka planda taze veriyle güncelle
void initCategoryShowcase();
initAnimatedPlaceholder("#topbar-compact-search-input");

// İçerik enjekte edilip init tamamlandıktan sonra shell'i yumuşakça göster.
requestAnimationFrame(() => {
  appEl.classList.remove("opacity-0");
  appEl.classList.add("opacity-100");
});
