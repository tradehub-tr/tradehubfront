import { t } from "../../i18n";
import { renderListingCard, upgradeListingCardMedia } from "../shared/ListingCard";
import { getMediaManifest, primeMediaManifests } from "../../lib/media/manifest";
/**
 * ProductListingGrid Component
 * iSTOC-style product listing grid for products page.
 * Responsive grid with hover zoom effect on product images.
 * Uses CSS transitions for smooth 500ms zoom animation.
 */

import type { ProductListingCard, ViewMode } from "../../types/productListing";
// Mock data import removed — grid is now API-driven

// Placeholder images removed — all images come from API now

/**
 * No results component for empty state
 */
function renderNoResults(): string {
  return `
    <div class="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <!-- Search illustration -->
      <div class="relative mb-6">
        <div class="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
          <svg class="h-12 w-12 text-gray-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </div>
        <!-- Small X badge -->
        <div class="absolute -top-1 -end-1 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
          <svg class="h-4 w-4 text-red-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">${t("products.noResults")}</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
        ${t("products.noResultsDesc")}
      </p>
      <button
        type="button"
        class="th-btn inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold transition-colors"
        data-filter-action="clear-all"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
        </svg>
        ${t("products.clearFilters")}
      </button>
    </div>
  `;
}

/** No-op — ProductListingGrid uses CSS grid, no JS initialization needed. */
export function initProductListingGrid(): void {}

/**
 * ProductListingGrid Component
 * Renders a responsive grid of product cards with hover zoom effect.
 *
 * @param products - Array of products to display (defaults to empty; grid is API-driven)
 * @returns HTML string for the product grid
 *
 * Grid Configuration (per spec):
 * - Mobile (< 768px): 2 columns
 * - Tablet (768px - 1023px): 3 columns
 * - Desktop (1024px - 1279px): 3 columns
 * - Wide desktop (1280px+): 5 columns
 * See src/style.css .product-grid for CSS implementation
 *
 * Hover Zoom Effect:
 * - transition-transform duration-500 ease-out
 * - group-hover/product:scale-110 (10% zoom)
 */
export function ProductListingGrid(products: ProductListingCard[] = []): string {
  if (products.length === 0) {
    return `
      <section aria-label="${t("products.productList")}" class="flex-1">
        <div
          class="group/grid grid grid-cols-2 lg:grid-cols-3 min-[1280px]:grid-cols-5 data-[list-mode=list]:!grid-cols-1 data-[list-mode=list]:!gap-3 product-grid"
          style="gap: var(--product-grid-gap, 16px);"
          data-list-mode="grid"
          role="list"
          aria-label="${t("products.productListLabel")}"
        >
          ${renderNoResults()}
        </div>
      </section>
    `;
  }

  return `
    <section aria-label="${t("products.productList")}" class="flex-1">
      <div
        class="group/grid grid grid-cols-2 lg:grid-cols-3 min-[1280px]:grid-cols-5 data-[list-mode=list]:!grid-cols-1 data-[list-mode=list]:!gap-3 product-grid"
        style="gap: var(--product-grid-gap, 16px);"
        data-list-mode="grid"
        role="list"
        aria-label="${t("products.productListLabel")}"
      >
        ${products.map((card) => `<div role="listitem" class="flex">${renderListingCard(card)}</div>`).join("")}
      </div>
    </section>
  `;
}

/**
 * Soğuk önbellekte İLK boyamanın manifesti beklediği tavan (ms).
 *
 * Gerekçe (rapor 91 §2.5 → rapor 95): manifest isteği ilan listesi geldikten
 * sonra atılabiliyor (kimlikler ancak o zaman belli) ve lokalde ~100 ms'te
 * dönüyor. Bu kadarlık bekleme, LCP adayının 399 KB ham PNG yerine ~12 KB
 * AVIF ile boyanmasını sağlıyor — 38 ham görsel / 7,2 MB'lık indirme hiç
 * başlamıyor. Tavan aşılırsa (uç yavaş/ölü) ızgara BUGÜNKÜ ham `<img>` ile
 * basılır ve manifest gelince `upgradeListingCardMedia` yerinde yükseltir;
 * yani en kötü durumda davranış eskisiyle aynıdır, sayfa asla 500 ms'ten
 * fazla bekletilmez.
 */
export const MANIFEST_FIRST_PAINT_WAIT_MS = 500;

/**
 * Render nöbet sayacı: bekleme sırasında yeni bir render başlarsa (hızlı filtre
 * tıklamaları) eskisi hem boyamayı hem yükseltmeyi bırakır — bayat ürün seti
 * asla taze setin üstüne yazılmaz.
 */
let _renderNobeti = 0;

/**
 * Re-render the product grid in-place with a new set of products.
 * Called by the filter engine when filters/sort change.
 *
 * SOĞUK YÜKLEME SÖZLEŞMESİ (rapor 91 §2.5'in kapanışı):
 *  - Önbellek sıcaksa (ya da bayrak kapalıysa) davranış eskisi gibi fiilen
 *    senkrondur — `primeMediaManifests` çözülmüş promise döner, bekleme yok.
 *  - Önbellek SOĞUKSA ilk boyama manifesti en çok `MANIFEST_FIRST_PAINT_WAIT_MS`
 *    bekler; yetişirse kartlar İLK boyamada `<picture>`/srcset ile çıkar (LCP
 *    adayı türev indirir), yetişmezse ham basılır ve manifest gelince
 *    `upgradeListingCardMedia` yerinde terfi ettirir.
 *
 * @returns Izgara DOM'a basıldığında çözülen promise — çağıran, ızgara DOM'una
 *   dokunan init'leri (slider, sosyal kanıt, favori) bundan SONRA koşmalı.
 */
export async function rerenderProductGrid(products: ProductListingCard[]): Promise<void> {
  const grid = document.querySelector<HTMLElement>(".product-grid");
  if (!grid) return;

  const nobet = ++_renderNobeti;

  // Preserve the current view mode
  const isListView = grid.dataset.listMode === "list";

  const kimlikler = products.map((p) => p.id).filter(Boolean);
  // `primeMediaManifests` asla fırlatmaz; sıcak önbellekte istek atmadan
  // çözülmüş promise döner. W10 (rapor 101 §İş1): backend İLK kartın (LCP adayı)
  // görsel manifestini `get_listings` yanıtına gömüyor ve `mapListingCard` onu
  // önbelleğe tohumluyor; bu tur o kartı `_taze` görüp ATLAR — yani ağ turu
  // "yalnız KALAN kartlar" için atılır. Böylece LCP adayının `<picture>`si bu
  // tura BAĞLI değildir: tur zaman aşımına uğrasa (uç yavaş) bile ilk kart
  // gömülü türevle (AVIF/WebP) basılır, yalnız kalan kartlar ham düşer.
  const manifestHazir = primeMediaManifests(kimlikler);

  // Soğuk mu? Önbellekte OLMAYAN en az bir ilan varsa soğuktur. "Önbellekte
  // boş manifest" de bir bilgidir (türev yok / bayrak kapalı) ve sıcak sayılır.
  // NOT: Bekleme KALDIRILMADI — kaldırılsaydı kalan görünür kartlar ham `<img>`
  // ile eager basılıp rapor 95'in kapattığı 7 MB ham indirmeyi geri getirirdi
  // (LCP adayı gömülü olsa bile). Tohum yalnız LCP adayını turdan çıkarır.
  const soguk = kimlikler.some((kimlik) => !getMediaManifest(kimlik));

  let yetisti = true;
  if (soguk && products.length > 0) {
    yetisti = await Promise.race([
      manifestHazir.then(() => true),
      new Promise<boolean>((resolve) =>
        setTimeout(() => resolve(false), MANIFEST_FIRST_PAINT_WAIT_MS)
      ),
    ]);
    // Bekleme sırasında yeni render başladıysa bu set bayat — hiç basma.
    if (nobet !== _renderNobeti) return;
  }

  if (products.length === 0) {
    grid.innerHTML = renderNoResults();
  } else {
    grid.innerHTML = products
      .map(
        (card, i) =>
          // İlk kart sayfanın LCP ADAYI: görseli `fetchpriority="high"` + eager
          // basılır (W7-2/A2 deseni — `<link rel=preload>` yerine doğrudan img
          // önceliği: ızgara işaretlemesi tek görevde kurulup basılıyor, ayrı
          // preload bağlantısının kapatacağı bir keşif boşluğu yok). TEK kart:
          // hepsine `high` vermek önceliği anlamsızlaştırır.
          `<div role="listitem" class="flex">${renderListingCard(card, i === 0 ? { priorityImage: true } : {})}</div>`
      )
      .join("");
  }

  // Re-apply list view classes if it was in list mode
  if (isListView) {
    setGridViewMode("list");
  } else {
    // Ensure all grid classes are correct just in case
    setGridViewMode("grid");
  }

  // Tavan aşıldıysa ham basıldı; manifest NE ZAMAN gelirse gelsin basılı
  // kartları yerinde terfi ettir (W7-2 hydration deseninin kart karşılığı).
  if (!yetisti) {
    void manifestHazir.then(() => {
      if (nobet !== _renderNobeti) return;
      upgradeListingCardMedia(grid);
    });
  }
}

/**
 * Export helper to render grid with custom products
 */
export { renderNoResults };

/**
 * Toggle grid between 'grid' and 'list' view modes using Tailwind classes.
 */
export function setGridViewMode(mode: ViewMode): void {
  const grid = document.querySelector<HTMLElement>(".product-grid");
  if (!grid) return;

  // data-list-mode attribute controls layout via Tailwind group-data variants
  grid.dataset.listMode = mode === "list" ? "list" : "grid";
}
