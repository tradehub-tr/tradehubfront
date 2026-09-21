/**
 * ProductGrid Component
 * Ana sayfa ürün vitrini — liste/arama sayfasıyla AYNI kartı, AYNI görünümle kullanır
 * (shared/ListingCard); tek fark butonsuz: `renderListingCard(card, { showActions: false })`.
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
// `ListingCartDrawer` statik import edilmez: SharedCartDrawer zincirini ana
// sayfanın modulepreload grafiğine sokuyordu (MOGEM-638 §2.4). Kartlar DOM'a
// girdikten sonra dinamik yüklenir (initProductGrid içinde).

const HOME_EAGER_CARD_COUNT = 8;

/**
 * Ana sayfa ızgarasının istediği ürün sayısı — TEK KAYNAK.
 *
 * Hem ağ isteğinin `page_size`ı hem de iskeletin çizdiği yer tutucu sayısı
 * buradan okunur. İkisi ayrışırsa iskelet yanlış yer ayırır ve içerik gelince
 * sayfa zıplar.
 *
 * 14 = büyük ekran gridinin (2xl: 7 kolon) tam 2 satırı — alt satırda boşluk kalmasın.
 */
const HOME_GRID_PAGE_SIZE = 14;
const HOME_PROGRESSIVE_ROOT_MARGIN = "200px";
/**
 * İskeleti kaldırır.
 *
 * 2026-09-21: eskiden ızgara kabından beş sabit `min-h-[...]` sınıfı
 * siliniyordu. O yaklaşım YAPISAL OLARAK yanlıştı — kart yüksekliği viewport
 * GENİŞLİĞİYLE ölçekleniyor, sabit px ise bir kırılma noktası ARALIĞI boyunca
 * sabit kalıyor. Ölçüldü (beş genişlikte): `xl` aralığında (1024-1535) gerçek
 * içerik 1058px'den 1133px'e çıkıyor, yani tek bir sayı 8px'lik bütçeyi o
 * aralıkta asla tutturamaz. Bugüne kadar test yalnız 1280'de koştuğu için
 * tek bir sayı ayarlanmaya çalışılmıştı.
 *
 * Yeni yaklaşım: iskelet de gerçek kartla AYNI geometriyi taşıyan yer
 * tutuculardan oluşuyor (`renderHomeCardPlaceholder`), sayısı da ağ isteğinin
 * `page_size`ıyla aynı sabitten geliyor. Yükseklik artık tarayıcı tarafından
 * hesaplanıyor; sütun sayısı ve kart genişliği değişse de kendiliğinden uyuyor.
 */
function releaseProductGridSkeletonHeight(grid: HTMLElement): void {
  grid.querySelectorAll("[data-home-section-skeleton]").forEach((el) => el.remove());
}

function showProductGridEmptyState(grid: HTMLElement): void {
  // Tek çağrı yeter: yardımcı artık TÜM iskelet hücrelerini kaldırıyor.
  releaseProductGridSkeletonHeight(grid);
  const emptyState = document.getElementById("product-grid-empty");
  if (emptyState) emptyState.style.display = "";
}

function renderHomeCard(card: Parameters<typeof renderListingCard>[0], lazy: boolean): string {
  // Liste/arama sayfasındaki kartla BİREBİR aynı görünüm ve davranış: görsel,
  // başlık, "Yeni ürün" sosyal kanıt şeridi, fiyat, "Minimum sipariş" satırı ve
  // aksiyon butonları (Sepete ekle / Sohbet et — masaüstünde hover'da, mobilde
  // her zaman). Butonlar 2026-09-07'ye kadar ana sayfada kapalıydı; kullanıcı
  // kararıyla açıldı. Sepet çekmecesi + sohbet tetikleyicileri main.ts'te kurulur.
  // Eski `homeCompact` kipi (MOQ'suz, şeritsiz, object-contain) aynı gün bırakıldı.
  return `<div role="listitem" data-home-card="${card.id}" class="flex">${renderListingCard(card, {
    sizesRegion: "home/hero_showcase_grid",
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
      <!--
        Metin bloğu ölçülerek belirlendi (21 Eyl 2026, beş genişlikte):
        gerçek kartın görsel altındaki alan = kart yüksekliği − kart genişliği
        − kenarlık → 393px'te 139 · 768/1280/1536'da 170 · 1024'te 188.
        Dar kartta (2 sütun) kart daha kompakt çiziliyor, bu yüzden md den
        itibaren 170. 1024'teki 188 başlık sarmasından geliyor ve yer tutucu
        gerçek metni çizmediği için birebir yakalanamıyor — kalan sapma orada.
        Eskiden 128 sabitti ve her yer tutucu gerçek karttan ~42px KISAydı.
      -->
      <div class="w-full overflow-hidden rounded-md border border-gray-200 bg-white before:block before:aspect-square before:w-full before:animate-pulse before:bg-gray-200/70 after:block after:h-[139px] after:animate-pulse after:bg-gray-100/70 md:after:h-[170px]"></div>
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
  const requestIdle = (
    window as unknown as {
      requestIdleCallback?: (callback: () => void) => number;
    }
  ).requestIdleCallback;
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

  return (
    initCurrency()
      // 14 = büyük ekran gridinin (2xl: 7 kolon) tam 2 satırı — alt satırda boşluk kalmasın.
      // verified_supplier: anasayfa vitrini KYB doğrulanmamış satıcı ürünü göstermez.
      .then(() => searchListings({ page_size: HOME_GRID_PAGE_SIZE, verified_supplier: true }))
      .then(async (result) => {
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
        // "Sepete ekle" → paylaşımlı sepet çekmecesi (listeleme sayfasıyla aynı
        // kurulum). Dinamik import: kartlar zaten ekranda, çekmece kodu arkadan gelir.
        const { initListingCartDrawer } = await import("../products/ListingCartDrawer");
        initListingCartDrawer(result.products);
      })
      .catch((err) => {
        console.warn("[ProductGrid] API load failed:", err);
        showProductGridEmptyState(grid);
      })
  );
}

export function ProductGrid(): string {
  return `
    <section
      data-theme-section="productgrid"
      data-home-section="product-grid"
      data-home-section-state="pending"
      aria-label="Recommended Products"
      aria-busy="true"
      class="py-3 lg:py-7"
      style="background-color: var(--product-bg, #f4f4f4);"
    >
      <div class="container-wide">
        <div
          id="home-product-grid"
          class="group/grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7 product-grid home-product-grid"
          style="gap: var(--product-grid-gap, 16px);"
          data-list-mode="grid"
          role="list"
          aria-label="Product listings"
        >
          ${Array.from({ length: HOME_GRID_PAGE_SIZE }, () => renderHomeCardPlaceholder("skeleton"))
            .join("")
            .replace(/data-home-card-placeholder="skeleton"/g, "data-home-section-skeleton")}
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
