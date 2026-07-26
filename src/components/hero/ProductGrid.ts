/**
 * ProductGrid Component
 * Ana sayfa ürün vitrini — liste/arama sayfasıyla AYNI kartı kullanır
 * (shared/ListingCard) ama butonsuz: `renderListingCard(card, { showActions: false })`.
 * Tek kart bileşeni birden çok sayfada → "az kod, çok yer" (DRY).
 *
 * Veri kaynağı zaten ortak: searchListings() → ProductListingCard[]. Eski sürüm
 * bu veriyi ayrı bir ProductCard tipine yeniden map'leyip ayrı renderProductCard
 * ile basıyordu; o kopya kaldırıldı.
 */
import { searchListings } from "../../services/listingService";
import { initCurrency } from "../../services/currencyService";
import { renderListingCard, initProductSliders } from "../shared/ListingCard";
import {
  initListingFavoriteTriggers,
  syncListingFavoriteHearts,
} from "../products/initListingFavorites";
import { applyListingSocialProof } from "../products/initListingSocialProof";

const HOME_EAGER_CARD_COUNT = 8;
const HOME_PROGRESSIVE_ROOT_MARGIN = "200px";
const HOME_GRID_SKELETON_HEIGHT_CLASSES = [
  "min-h-[2240px]",
  "md:min-h-[1900px]",
  "lg:min-h-[1510px]",
  "xl:min-h-[1000px]",
  "2xl:min-h-[670px]",
];

function releaseProductGridSkeletonHeight(grid: HTMLElement): void {
  grid.classList.remove(...HOME_GRID_SKELETON_HEIGHT_CLASSES);
}

function showProductGridEmptyState(grid: HTMLElement): void {
  grid.querySelector("[data-home-section-skeleton]")?.remove();
  releaseProductGridSkeletonHeight(grid);
  const emptyState = document.getElementById("product-grid-empty");
  if (emptyState) emptyState.style.display = "";
}

function renderHomeCard(card: Parameters<typeof renderListingCard>[0], lazy: boolean): string {
  return `<div role="listitem" data-home-card="${card.id}" class="flex">${renderListingCard(card, {
    homeCompact: true,
    containImage: true,
    lazy,
  })}</div>`;
}

function renderHomeCardPlaceholder(cardId: string): string {
  return `
    <div
      data-home-card-placeholder="${cardId}"
      class="flex"
      aria-hidden="true"
    >
      <div class="w-full overflow-hidden rounded-md border border-gray-200 bg-white before:block before:aspect-square before:w-full before:animate-pulse before:bg-gray-200/70 after:block after:h-[128px] after:animate-pulse after:bg-gray-100/70"></div>
    </div>
  `;
}

function initProgressiveHomeCards(
  grid: HTMLElement,
  products: Parameters<typeof renderListingCard>[0][]
): void {
  if (!products.length) return;

  let mounted = false;
  let observer: IntersectionObserver | null = null;
  const mount = (): void => {
    if (mounted) return;
    mounted = true;
    observer?.disconnect();

    for (const card of products) {
      const placeholder = grid.querySelector<HTMLElement>(
        `[data-home-card-placeholder="${CSS.escape(card.id)}"]`
      );
      if (!placeholder) continue;
      const holder = document.createElement("div");
      holder.innerHTML = renderHomeCard(card, true);
      const cardElement = holder.firstElementChild;
      if (cardElement) placeholder.replaceWith(cardElement);
    }

    initProductSliders();
    syncListingFavoriteHearts(grid);
    void applyListingSocialProof(products, {
      root: grid,
      createMissingSlots: true,
    });
  };

  const trigger = grid.querySelector<HTMLElement>("[data-home-card-placeholder]");
  if (!trigger) return;

  if ("IntersectionObserver" in window) {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) mount();
      },
      { rootMargin: HOME_PROGRESSIVE_ROOT_MARGIN }
    );
    observer.observe(trigger);
    return;
  }

  // Eski WebView fallback'i: ana thread boşaldığında ikinci batch'i tamamla.
  const requestIdle = (window as unknown as {
    requestIdleCallback?: (callback: () => void) => number;
  }).requestIdleCallback;
  if (typeof requestIdle === "function") {
    requestIdle(mount);
  } else {
    globalThis.setTimeout(mount, 120);
  }
}

/** Load real products from API and re-render the grid. */
export function initProductGrid(): Promise<void> {
  const grid = document.getElementById("home-product-grid");
  if (!grid) return Promise.resolve();

  // Kart etkileşimleri (slider okları/dot, favori kalbi) document-delegation +
  // idempotent guard'lı — grid basılmadan önce bağlanması güvenli.
  initProductSliders();
  initListingFavoriteTriggers();

  return initCurrency()
    // 14 = büyük ekran gridinin (2xl: 7 kolon) tam 2 satırı — alt satırda boşluk kalmasın.
    // verified_supplier: anasayfa vitrini KYB doğrulanmamış satıcı ürünü göstermez.
    .then(() => searchListings({ page_size: 14, verified_supplier: true }))
    .then((result) => {
      if (result.products.length === 0) {
        showProductGridEmptyState(grid);
        return;
      }

      // Hide empty state
      const emptyState = document.getElementById("product-grid-empty");
      if (emptyState) emptyState.style.display = "none";

      const eagerProducts = result.products.slice(0, HOME_EAGER_CARD_COUNT);
      const progressiveProducts = result.products.slice(HOME_EAGER_CARD_COUNT);

      // İlk satırı/viewport bütçesini gerçek kartlarla, kalan sabit alanı hafif
      // placeholder'larla kur. Böylece 14 zengin kartın DOM'u ilk anda oluşmaz.
      releaseProductGridSkeletonHeight(grid);
      grid.innerHTML = eagerProducts
        .map((card) => renderHomeCard(card, false))
        .concat(progressiveProducts.map((card) => renderHomeCardPlaceholder(card.id)))
        .join("");

      // Kartlar DOM'a girdi → favori kalplerini mevcut favori durumuna göre doldur.
      initProductSliders();
      syncListingFavoriteHearts(grid);
      // Sosyal kanıt: sinyali olan kartların ad↔fiyat arası slotunu dinamik
      // (dönen) etiketle doldur — grid innerHTML yazıldıktan SONRA çağrılır.
      void applyListingSocialProof(eagerProducts, {
        root: grid,
        createMissingSlots: true,
      });
      initProgressiveHomeCards(grid, progressiveProducts);
    })
    .catch((err) => {
      console.warn("[ProductGrid] API load failed:", err);
      showProductGridEmptyState(grid);
    });
}

export function ProductGrid(): string {
  return `
    <section
      data-theme-section="productgrid"
      data-home-section="product-grid"
      data-home-section-state="pending"
      aria-label="Recommended Products"
      aria-busy="true"
      style="background-color: var(--product-bg, #f4f4f4); padding-top: 28px; padding-bottom: 28px;"
    >
      <div class="container-wide">
        <div
          id="home-product-grid"
          class="group/grid grid min-h-[2240px] grid-cols-2 md:min-h-[1900px] md:grid-cols-3 lg:min-h-[1510px] lg:grid-cols-4 xl:min-h-[1000px] xl:grid-cols-6 2xl:min-h-[670px] 2xl:grid-cols-7 product-grid home-product-grid"
          style="gap: var(--product-grid-gap, 16px);"
          data-list-mode="grid"
          role="list"
          aria-label="Product listings"
        >
          <div
            data-home-section-skeleton
            class="col-span-full h-full min-h-[2240px] animate-pulse rounded-md bg-gray-200/70 md:min-h-[1900px] lg:min-h-[1510px] xl:min-h-[1000px] 2xl:min-h-[670px]"
            aria-hidden="true"
          ></div>
          <div
            id="product-grid-empty"
            data-home-section-empty
            class="col-span-full flex min-h-[320px] items-center justify-center py-12"
            style="display:none;"
          >
            <div class="text-center">
              <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
              <p class="text-sm text-gray-400">Yakında yeni ürünler eklenecek</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}
