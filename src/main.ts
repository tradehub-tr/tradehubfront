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
  HeroSidePanel,
  initHeroSidePanel,
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

// Ürün vitrini kart aksiyonları: "Sepete ekle" → paylaşımlı sepet çekmecesi,
// "Sohbet et" → sohbet penceresi (listeleme sayfasıyla aynı kurulum, 2026-09-07).
// Sepet çekmecesi + sevkiyat penceresi burada STATİK import edilmez (MOGEM-638
// §2.4): `ListingCartDrawer → SharedCartDrawer` ve `CartDrawer → alpine/product
// → WriteReviewModal/uploader/dropzone…` zincirleri ana sayfanın statik
// grafiğine giriyor, Vite hepsini `modulepreload` ediyordu (44 preload / 1 MB,
// ilk boyamadan önce). Dinamik import: `mountCartOverlays()` aşağıda.
import { mountChatPopup, initChatTriggers } from "./components/chat-popup";

// Alpine.js
import { startAlpine } from "./alpine";

// Utilities
import { initAnimatedPlaceholder } from "./utils/animatedPlaceholder";
import { markHomeReadyAfterInitialTasks } from "./performance/homeReadiness";
import { loadCategories } from "./services/categoryService";
import {
  fetchActiveShowcase,
  getCachedShowcase,
  isCacheFresh,
} from "./services/categoryShowcaseService";

interface DeferredHomeSection {
  name: string;
  init: () => void | Promise<void>;
}

const HOME_SECTION_ROOT_MARGIN = "600px";

/**
 * Fold-altındaki ağır vitrinleri yalnız kullanıcı yaklaştığında başlatır.
 * Bölüm kabukları ilk HTML'de sabit yüksekliği korur; veri/etkileşim katmanı
 * ise observer eşiğinde bir kez çalışır ve tekrar görünürlükte yeniden kurulmaz.
 */
function initDeferredHomeSections(sections: readonly DeferredHomeSection[]): void {
  const mounted = new WeakSet<HTMLElement>();
  let observer: IntersectionObserver | null = null;

  const mount = (section: HTMLElement, init: DeferredHomeSection["init"]): void => {
    if (mounted.has(section)) return;
    mounted.add(section);
    observer?.unobserve(section);
    section.dataset.homeSectionState = "loading";

    void Promise.resolve()
      .then(init)
      .catch((error) => {
        console.warn(`[home] ${section.dataset.homeSection} init failed:`, error);
      })
      .finally(() => {
        section.dataset.homeSectionState = "mounted";
        section.setAttribute("aria-busy", "false");
      });
  };

  if (!("IntersectionObserver" in window)) {
    for (const definition of sections) {
      const section = document.querySelector<HTMLElement>(
        `[data-home-section="${definition.name}"]`
      );
      if (section) mount(section, definition.init);
    }
    return;
  }

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const section = entry.target as HTMLElement;
        const definition = sections.find(
          (candidate) => candidate.name === section.dataset.homeSection
        );
        if (definition) mount(section, definition.init);
      }
    },
    { rootMargin: HOME_SECTION_ROOT_MARGIN }
  );

  for (const definition of sections) {
    const section = document.querySelector<HTMLElement>(`[data-home-section="${definition.name}"]`);
    if (section) observer.observe(section);
  }
}

// Kategori vitrini hero'nun hemen altında. Önce boş/stale bir kabuk basıp
// sonradan yüksek bir bento grid eklemek, aşağıdaki hero alanını viewport'tan
// iterek ölçülebilir CLS üretiyordu. İlk görünür düzeni API'nin güncel sonucu
// ile bir kez kuruyoruz; initCategoryShowcase aynı payload'ı tekrar kullanır.
//
// MOGEM-638 §2.2/§7-9: bu `await` ilk boyamayı API turuna bağlıyordu — sayfada
// tek bir piksel çizilmeden önce `get_active_tiles` bitmek zorundaydı (mobil
// Slow-4G'de saniyeler). Taze yerel kopya varsa düzen ONDAN kurulur ve sayfa
// hemen boyanır; `initCategoryShowcase` arka planda gerçek sonucu çekip yalnız
// imza değişmişse bölümü değiştirir. İlk ziyaret (kopya yok) eski yolda kalır:
// boş kabuk basıp sonra yüksek bir grid eklemek ölçülmüş CLS kaynağıydı.
const showcaseFromCache = isCacheFresh();
const initialCategoryShowcase = showcaseFromCache
  ? getCachedShowcase()
  : await fetchActiveShowcase();
const appEl = document.querySelector<HTMLDivElement>("#app")!;
// FE-2 (CWV): opacity-0 giriş gating'i KALDIRILDI (UX onaylı karar,
// 2026-07-23). İçerik saydam beklerken LCP tüm init bitene kadar
// ölçülemiyordu; artık markup boyanır boyanmaz görünür.
appEl.classList.add("relative");
appEl.innerHTML = `
  <h1 class="sr-only" data-i18n="pageTitle.homeHeading">${t("pageTitle.homeHeading")}</h1>
  <!-- Sticky Header (global, stays sticky across full page) -->
  <div id="sticky-header" class="sticky top-0 z-(--z-header) bg-white dark:bg-gray-900" style="padding-top:env(safe-area-inset-top,0px)">
    ${TopBar()}
    ${SubHeader()}
  </div>

  <!-- Mobile Category Bar (iSTOC-style, mobile/tablet only) -->
  ${MobileCategoryBar()}

  <!-- Mega Menu (fixed overlay, positioned by JS) -->
  ${MegaMenu()}

  <!-- Main Content -->
  <main>
    <!-- Top Hero: Split hero — Sarı İmza slider + En İyi Fırsatlar/RFQ yan paneli -->
    <section class="pt-1 pb-3 xl:pt-3 xl:pb-4" aria-label="${t("commonNav.featuredCampaigns")}">
      <div class="container-boxed">
        <div class="grid gap-3 xl:grid-cols-[minmax(0,1fr)_312px]">
          <div class="h-[280px] min-w-0 sm:h-[360px]">
            ${HeroTopSlider()}
          </div>
          ${HeroSidePanel()}
        </div>
      </div>
    </section>

    <!-- Category Showcase: Bento grid (journal-style) -->
    <section class="py-3 xl:py-6" aria-label="Kategori vitrini">
      <div class="container-boxed">
        ${CategoryShowcase(initialCategoryShowcase)}
      </div>
    </section>

    <!-- Hero: Categories + Recommendation Slider + Right Banner Slider -->
    <section class="py-3 xl:py-6" aria-label="Browse categories and recommendations">
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

  <!-- Vitrin kartlarının "Sepete ekle" çekmecesi + sevkiyat seçim penceresi:
       ilk boyamadan sonra dinamik yüklenip buraya takılır (mountCartOverlays) -->
  <div id="home-cart-overlays"></div>

`;

// Initialize custom component behaviors FIRST (before Flowbite can interfere)
const megaMenuReady = initMegaMenu();

// Initialize Flowbite for other interactive components
initFlowbite();

// Vitrin kartlarındaki "Sohbet et" için sohbet penceresi + tetikleyiciler
// (Alpine'dan önce; listeleme sayfasındaki sırayla aynı).
mountChatPopup();
initChatTriggers();

// Initialize Alpine.js (FloatingPanel is now Alpine-driven)
startAlpine();

// Sepet çekmecesi + sevkiyat penceresi: Alpine başladıktan sonra dinamik
// import ile gelir ve slot'a takılır; Alpine yeni düğümleri MutationObserver
// ile kendisi başlatır. İlk boyamayı beklemez, ama modulepreload grafiğine de
// girmez — indirme ilk boyamayla yarışmaz, onun ardından paralel akar.
async function mountCartOverlays(): Promise<void> {
  const [{ ListingCartDrawer }, { ShippingModal, initShippingModal }] = await Promise.all([
    import("./components/products/ListingCartDrawer"),
    import("./components/product/CartDrawer"),
  ]);
  const slot = document.getElementById("home-cart-overlays");
  if (!slot) return;
  slot.innerHTML = `${ListingCartDrawer()}${ShippingModal()}`;
  initShippingModal();
}
void mountCartOverlays();

// Initialize remaining custom behaviors
initStickyHeaderSearch();
const categoryBrowseReady = initCategoryBrowse();
const mobileCategoryBarReady = initMobileCategoryBar();
initHeroSideBannerSlider();

const bottomNavReady = initBottomNav();
initHeaderCart();
initLanguageSelector();
initAnimatedPlaceholder("#topbar-compact-search-input");

// İlk dalgada DOM üreten async işler bitmeden ölçüm işaretini koyma. Kapalı
// menü/cart gibi etkileşimle çalışan veya kullanıcıya özel arka plan işleri
// ve fold-altı vitrinler özellikle burada yok; bunların gecikmesi perf
// ölçümünü sonsuza dek bekletmemeli.
const homeReady = markHomeReadyAfterInitialTasks(appEl, [
  // Kategori ağacı ve onu DOM'a işleyen dört tüketici ilk ölçümden önce tamamlanır.
  loadCategories(),
  megaMenuReady,
  categoryBrowseReady,
  mobileCategoryBarReady,
  bottomNavReady,
  initHeaderNotice(),
  // Kopyadan kurulduysa init API'ye gidip gerçek veriyi doğrular (imza
  // değişmişse bölümü değiştirir); API'den kurulduysa aynı payload yeniden kullanılır.
  initCategoryShowcase(showcaseFromCache ? undefined : initialCategoryShowcase),
  initHeroTopSlider(),
  initHeroSidePanel(),
  initRecommendationSlider(),
]);

// Üst içerik son yüksekliğine ulaşmadan observer kurmak, aşağıdaki bölümlerin
// geçici olarak 600px eşiğine girip erken fetch edilmesine yol açar. Önce üst
// dalgayı ve bir render karesini bitir, sonra stabil konumları gözlemle.
void homeReady.then(() => {
  initDeferredHomeSections([
    // Pilot sırası: kişiselleştirilmiş alan + ürün vitrini, ardından fırsatlar
    // ve sıralama. Observer görünürlük sırasını belirler; liste yalnız stabil
    // kayıt ve test sırası sağlar.
    { name: "tailored-selections", init: initTailoredSelections },
    { name: "product-grid", init: initProductGrid },
    { name: "top-deals", init: initTopDeals },
    { name: "top-ranking", init: initTopRanking },
  ]);
});

// ── T-123: RUM montajı — AÇIK (2026-08-20) ───────────────────────────────────
// Zincirin sunucu tarafı KURULU: uç
// `POST /api/method/tradehub_core.api.rum.collect` + `Media RUM Sample`
// DocType. İstemci çekirdeği `src/lib/rum/` altında vendor'landı (köken:
// admin-panel/frontend/src/lib/media/rum/).
//
// Eski engel kalktı: `web-vitals@^6` kuruldu (Apache-2.0, 0 bağımlılık —
// denetim: tradehub_core/docs/reports/60-fe3-rum.md §11).
//
// Montaj `./lib/rum/boot` üzerinden: bu bir MPA — main.ts YALNIZ ana sayfa
// girişidir; aynı boot modülü TÜM `src/pages/*` girişlerinden de import
// edilir. Örneklem %10 (rapor 60 §8) boot içinde; çift-başlatma koruması
// ve gerekçe `src/lib/rum/boot.ts`'te. Telemetri sayfayı ASLA kırmaz:
// startRum fırlatmamayı taahhüt eder; uç ulaşılamazsa toplayıcı susar.
import "./lib/rum/boot";
