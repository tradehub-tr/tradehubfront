# Top Ranking Category — Adanmış "Top 100" Sayfası — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Yeni adanmış "Top Ranking Category" sayfası oluştur (Amazon "Best Sellers in X" benzeri); mevcut top-ranking flat modunu kaldır; tüm kategori-yönelimli linkleri yeni sayfaya yönlendir; ürün kartlarındaki "Karşılaştır" checkbox'ını kaldır.

**Architecture:** Yeni `/pages/top-ranking-category.html` sayfası, mevcut `searchListings` API'sini `category + sort_by + page_size=50` ile çağırır. Sıra rozeti (#1..#100) frontend'de hesaplanır. Mevcut `TopRankingHero/Filters/SortPills` bileşenleri yeniden kullanılır; yeni grid + sayfalama bileşenleri eklenir. Backend değişikliği yoktur. Mevcut top-ranking sayfasındaki flat mod ve onu besleyen kod kaldırılır; sekmeler ve kart başlıkları artık yeni sayfaya `<a href>` ile yönlendirir.

**Tech Stack:** TypeScript, Vite, Alpine.js v3, Tailwind v4, Flowbite, i18next. Test framework yok — doğrulama `tsc --noEmit` + `eslint` + dev sunucuda manuel browser testi.

**Spec:** `docs/superpowers/specs/2026-05-06-top-ranking-category-page-design.md`

**Çalışma dizini:** `/home/metin/Desktop/istoc cı-cd/tradehubfront/` (tüm komutlar bu dizinden çalıştırılır; git de bu dizinin repo'su).

**Kritik notlar:**
- Vite config (`vite.config.ts:142-150`) `**/*.html` glob'u ile tüm HTML dosyalarını otomatik entry olarak alır — yeni sayfa için manuel rollup config gerekmez.
- Bu projede otomatik test yok; her commit öncesi `npx tsc --noEmit && npx eslint src/` çalıştırılır.
- Tarayıcı doğrulamaları için: `npm run dev` → tarayıcıda `http://tradehub.localhost:5173/pages/top-ranking-category.html?cat=demo-cat-mutfak` (veya local Vite portu).

---

## File Structure

**Yeni dosyalar:**

| Dosya | Sorumluluk |
|---|---|
| `pages/top-ranking-category.html` | Sayfa shell — `<div id="app">` + script tag |
| `src/pages/top-ranking-category.ts` | Alpine `topRankingCategoryPage` data, page assembly, URL state |
| `src/components/top-ranking-category/index.ts` | Re-exports |
| `src/components/top-ranking-category/TopRankingCategoryHero.ts` | Hero (başlık + ürün sayısı + dropdown) |
| `src/components/top-ranking-category/TopRankingCategoryGrid.ts` | Rank rozetli kart render fonksiyonu + grid template |
| `src/components/top-ranking-category/TopRankingCategoryPagination.ts` | `[‹ Önceki] [1] [2] [Sonraki ›]` |

**Düzenlenen dosyalar:**

| Dosya | Değişiklik |
|---|---|
| `src/types/topRanking.ts` | `RankedProduct.rank` tipini `1\|2\|3` → `number` yap; `averageRating?` ve `ratingCount?` ekle |
| `src/pages/top-ranking.ts` | Flat mod state ve metotları kaldır |
| `src/components/top-ranking/TopRankingGrid.ts` | `mode === 'flat'` template'i ve `renderRankingFlatCard` kaldır |
| `src/components/top-ranking/TopRankingCategoryTabs.ts` | Kategori sekmesi `<button @click>` → `<a href>`; "Tümü" `<button>` kalır |
| `src/components/top-ranking/TopRankingFilters.ts` | `applyCategoryFilter` çağrılarına ana kategori seçildiğinde redirect logic ekle (page hint flag aracılığıyla) |
| `src/components/hero/TopRanking.ts` (line 47) | `href` `/pages/products.html?cat=...&sort=orders` → `/pages/top-ranking-category.html?cat=...&sort=hot-selling&page=1` |
| `src/components/products/ProductListingGrid.ts` (lines 125-131) | "Karşılaştır" `<label>` bloğu sil |
| `src/i18n/locales/tr.ts` | `topRankingCategoryPage` blok ekle, `topRankingPage` altına `breadcrumbTopRanking` |
| `src/i18n/locales/en.ts` | Aynı anahtarları İngilizce ekle |

---

## Task 1 — Tipleri genişlet

**Files:**
- Modify: `tradehubfront/src/types/topRanking.ts`

- [ ] **Step 1: Mevcut dosyayı oku**

```bash
cd "/home/metin/Desktop/istoc cı-cd/tradehubfront"
cat src/types/topRanking.ts
```

- [ ] **Step 2: Tipleri genişlet**

`src/types/topRanking.ts` içeriğini bu hale getir:

```typescript
export interface RankedProduct {
  id: string;
  name: string;
  href: string;
  price: string;
  imageSrc: string;
  moq: string;
  /** 1..100 — rank rozetinde gösterilen sıra. Grouped modda 1|2|3, flat/category sayfada 1..100. */
  rank: number;
  /** 0..5 — backend `mapListingCard` `rating` alanından kopyalanır. Yoksa undefined. */
  averageRating?: number;
  /** Backend `mapListingCard` `reviewCount` alanından. Yoksa undefined. */
  ratingCount?: number;
}

export interface RankingCategoryGroup {
  id: string;
  name: string;
  nameKey: string;
  categoryId: string;
  /** URL-friendly slug for the category. Used by the storefront listing
   * link so the products page receives a slug (not a UUID-shaped name). */
  slug?: string;
  products: RankedProduct[];
}
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: PASS (mevcut grouped kart render `rank` alanını 1|2|3 olarak atadığı için number'a uyumlu — daraltma yok, sadece genişletme).

- [ ] **Step 4: Commit**

```bash
git add src/types/topRanking.ts
git commit -m "types: extend RankedProduct with rank as number and rating fields"
```

---

## Task 2 — i18n anahtarlarını ekle

**Files:**
- Modify: `tradehubfront/src/i18n/locales/tr.ts`
- Modify: `tradehubfront/src/i18n/locales/en.ts`

- [ ] **Step 1: Mevcut topRankingPage bloğunu lokalize et (tr)**

`src/i18n/locales/tr.ts` içinde `topRankingPage:` bloğundan **önce** (yani aynı parent içinde, ondan önce gelen anahtardan sonra) yeni bir blok ekle. Yer: dosyada `topRankingPage:` satırını bul, ondan **hemen önce** şu bloğu ekle:

```typescript
topRankingCategoryPage: {
  heroTitlePrefix: "En Çok Satanlar — ",
  heroSubtitlePrefix: "{{count}} ürün · ",
  heroSubtitleSuffix: "Veri odaklı sıralamalarla trendleri keşfedin",
  breadcrumb: "En Çok Satanlar",
  empty: "Bu kategoride henüz sıralama oluşmadı.",
  paginationPrevious: "Önceki",
  paginationNext: "Sonraki",
  pageLabel: "Sayfa {{page}}",
  ratingCount: "({{count}})",
  missingCategory: "Kategori belirtilmedi",
  goHome: "Ana Sayfa'ya Dön",
},
```

- [ ] **Step 2: en.ts için aynı blok**

`src/i18n/locales/en.ts` içinde aynı konuma:

```typescript
topRankingCategoryPage: {
  heroTitlePrefix: "Best Sellers — ",
  heroSubtitlePrefix: "{{count}} products · ",
  heroSubtitleSuffix: "Discover trends with data-driven rankings",
  breadcrumb: "Best Sellers",
  empty: "No ranking data for this category yet.",
  paginationPrevious: "Previous",
  paginationNext: "Next",
  pageLabel: "Page {{page}}",
  ratingCount: "({{count}})",
  missingCategory: "No category specified",
  goHome: "Back to Home",
},
```

- [ ] **Step 3: Typecheck + lint**

```bash
npx tsc --noEmit && npx eslint src/i18n/
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/i18n/locales/tr.ts src/i18n/locales/en.ts
git commit -m "i18n: add topRankingCategoryPage keys (tr+en)"
```

---

## Task 3 — Sayfalama bileşeni (TopRankingCategoryPagination)

**Files:**
- Create: `tradehubfront/src/components/top-ranking-category/TopRankingCategoryPagination.ts`

- [ ] **Step 1: Bileşeni yaz**

```typescript
/**
 * TopRankingCategoryPagination — `[‹ Önceki] [1] [2] [Sonraki ›]`
 *
 * Davranış:
 *  - totalPages <= 1  → render YOK (parent zaten x-show ile gizler)
 *  - totalPages == 2  → 2 sayfa butonu + Önceki/Sonraki
 *  - Aktif sayfa primary renkte, pasif yüzey renginde
 *  - Sayfa 1'de Önceki disabled; sayfa 2'de Sonraki disabled
 *
 * Parent Alpine state: { page: number, totalPages: number, goToPage(n) }
 */

import { t } from "../../i18n";

export function TopRankingCategoryPagination(): string {
  return `
    <nav
      class="flex items-center justify-center gap-2 mt-8 mb-4"
      aria-label="Pagination"
      x-show="totalPages > 1"
      x-cloak
    >
      <button
        type="button"
        class="px-3 py-2 rounded-md border border-border-default text-sm font-medium text-text-secondary bg-surface hover:bg-surface-raised transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="page === 1 || loading"
        @click="goToPage(page - 1)"
        data-i18n="topRankingCategoryPage.paginationPrevious"
      >&lsaquo; ${t("topRankingCategoryPage.paginationPrevious")}</button>

      <template x-for="n in totalPages" :key="'page-' + n">
        <button
          type="button"
          class="min-w-[40px] px-3 py-2 rounded-md text-sm font-semibold transition-colors"
          :class="page === n
            ? 'bg-primary-500 text-white'
            : 'border border-border-default text-text-secondary bg-surface hover:bg-surface-raised'"
          :disabled="loading"
          @click="goToPage(n)"
          x-text="n"
          :aria-current="page === n ? 'page' : null"
        ></button>
      </template>

      <button
        type="button"
        class="px-3 py-2 rounded-md border border-border-default text-sm font-medium text-text-secondary bg-surface hover:bg-surface-raised transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="page >= totalPages || loading"
        @click="goToPage(page + 1)"
        data-i18n="topRankingCategoryPage.paginationNext"
      >${t("topRankingCategoryPage.paginationNext")} &rsaquo;</button>
    </nav>
  `;
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/top-ranking-category/TopRankingCategoryPagination.ts
git commit -m "feat(top-ranking-category): add Pagination component"
```

---

## Task 4 — Grid + rank rozetli kart (TopRankingCategoryGrid)

**Files:**
- Create: `tradehubfront/src/components/top-ranking-category/TopRankingCategoryGrid.ts`

- [ ] **Step 1: Bileşeni yaz**

```typescript
/**
 * TopRankingCategoryGrid — Adanmış Top Ranking Category sayfasının ürün grid'i.
 *
 * Mevcut `TopRankingGrid` flat modundan farkları:
 *  - Büyük rank rozeti (#1..#100). #1/#2/#3 canlı renk; #4+ koyu nötr.
 *  - Yıldız + ortalama + count satırı (rating > 0 ise).
 *  - Ürün adı 2 satır clamp.
 *  - "Karşılaştır" checkbox, sepete ekle vb. yok.
 *
 * Parent Alpine state: { products: RankedProduct[], loading: boolean, page: number }
 */

import { t } from "../../i18n";
import { formatPrice } from "../../utils/currency";
import type { RankedProduct } from "../../types/topRanking";

const PAGE_SIZE = 50;

function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function moqCount(moq: string | undefined): number {
  if (!moq) return 1;
  const m = String(moq).match(/(\d+)/);
  return m ? parseInt(m[1], 10) || 1 : 1;
}

function moqLabel(moq: string | undefined): string {
  return t("common.moq", { count: moqCount(moq), unit: t("common.moqUnit") });
}

/** Rozet renk seçici — 1/2/3 canlı, 4+ nötr. */
function rankBadgeClass(rank: number): string {
  if (rank === 1) return "bg-success-500";
  if (rank === 2) return "bg-info-500";
  if (rank === 3) return "bg-warning-500";
  return "bg-secondary-700";
}

/** Yıldız simgeleri — 5 yıldız, dolu/yarım/boş. */
function renderStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return (
    "★".repeat(full) +
    (half ? "☆" : "") +
    "☆".repeat(empty)
  );
}

/**
 * Tek bir rank kartını render et. `rank` parametresi, parent'in
 * (page-1)*PAGE_SIZE + index + 1 ile hesapladığı 1..100 değeri.
 */
export function renderRankedCategoryCard(product: RankedProduct, rank: number): string {
  const safeName = escapeHtml(product.name);
  const safeMoq = escapeHtml(product.moq);
  const safeImg = escapeHtml(product.imageSrc || "");
  const safeHref = escapeHtml(product.href || "#");
  const badgeClass = rankBadgeClass(rank);

  const rating = product.averageRating || 0;
  const ratingCount = product.ratingCount || 0;
  const ratingHtml = rating > 0
    ? `
      <div class="flex items-center gap-1.5 mt-1">
        <span class="text-warning-500 text-xs leading-none" aria-hidden="true">${renderStars(rating)}</span>
        <span class="text-xs text-text-secondary">${rating.toFixed(1)}</span>
        ${ratingCount > 0 ? `<span class="text-xs text-text-tertiary">${t("topRankingCategoryPage.ratingCount", { count: ratingCount })}</span>` : ""}
      </div>
    `
    : "";

  return `
    <a href="${safeHref}" class="group/product flex flex-col bg-surface border border-border-default rounded-md p-2 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200" aria-label="${safeName}">
      <div class="relative aspect-square w-full overflow-hidden rounded-md bg-surface-raised mb-2">
        <img
          src="${safeImg}"
          alt="${safeName}"
          loading="lazy"
          class="w-full h-full object-cover transition-transform duration-300 group-hover/product:scale-105"
        />
        <span
          class="absolute top-1.5 left-1.5 w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center rounded-md text-xs sm:text-sm font-bold text-white shadow-sm ${badgeClass}"
          aria-label="Rank ${rank}"
        >#${rank}</span>
      </div>
      <p class="text-sm font-medium text-text-primary line-clamp-2 min-h-[2.5em]">${safeName}</p>
      ${ratingHtml}
      <p class="text-base font-bold text-text-primary mt-1">${formatPrice(product.price)}</p>
      <p class="text-xs text-text-tertiary mt-0.5 truncate">${escapeHtml(moqLabel(safeMoq))}</p>
    </a>
  `;
}

function renderSkeletonCard(): string {
  return `
    <div class="bg-surface border border-border-default rounded-md p-2 animate-pulse">
      <div class="aspect-square w-full rounded-md bg-gray-200 mb-2"></div>
      <div class="h-4 w-3/4 rounded bg-gray-200"></div>
      <div class="h-3 w-1/2 rounded bg-gray-200 mt-2"></div>
      <div class="h-4 w-1/3 rounded bg-gray-200 mt-2"></div>
    </div>
  `;
}

export function TopRankingCategoryGrid(): string {
  return `
    <section class="mt-4" aria-label="Top ranking products">
      <div
        class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4"
        role="list"
        aria-label="Ranking products"
      >
        <template x-for="(product, idx) in products" :key="product.id + '-' + idx">
          <div role="listitem" x-html="renderCard(product, (page - 1) * ${PAGE_SIZE} + idx + 1)"></div>
        </template>

        <!-- Skeletons on initial load only -->
        <template x-if="loading && products.length === 0">
          <div role="listitem">${renderSkeletonCard()}</div>
        </template>
        <template x-if="loading && products.length === 0">
          <div role="listitem">${renderSkeletonCard()}</div>
        </template>
        <template x-if="loading && products.length === 0">
          <div role="listitem">${renderSkeletonCard()}</div>
        </template>
        <template x-if="loading && products.length === 0">
          <div role="listitem">${renderSkeletonCard()}</div>
        </template>
        <template x-if="loading && products.length === 0">
          <div role="listitem">${renderSkeletonCard()}</div>
        </template>
      </div>

      <!-- Inline loader for page-change requests (when there is already data) -->
      <div class="flex items-center justify-center py-4" x-show="loading && products.length > 0" x-cloak>
        <div class="h-6 w-6 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin"></div>
      </div>

      <!-- Empty state -->
      <div
        class="flex items-center justify-center py-16"
        x-show="!loading && products.length === 0"
        x-cloak
      >
        <div class="text-center">
          <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
          </svg>
          <p class="text-sm text-gray-400" data-i18n="topRankingCategoryPage.empty">${t("topRankingCategoryPage.empty")}</p>
        </div>
      </div>
    </section>
  `;
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/top-ranking-category/TopRankingCategoryGrid.ts
git commit -m "feat(top-ranking-category): add Grid component with rank badges and ratings"
```

---

## Task 5 — Hero bileşeni (TopRankingCategoryHero)

**Files:**
- Create: `tradehubfront/src/components/top-ranking-category/TopRankingCategoryHero.ts`

- [ ] **Step 1: Bileşeni yaz**

```typescript
/**
 * TopRankingCategoryHero — Adanmış sayfanın hero bandı.
 *
 * Mevcut TopRankingHero ile birebir görsel kimlik (krem-sarı gradient,
 * decorative circles), ama:
 *  - Başlık dinamik: "En Çok Satanlar — <Kategori Adı>"
 *  - Subtitle ürün sayısını içerir
 *  - Mevcut TopRankingFilters yeniden kullanılır (kullanıcı buradan başka
 *    kategoriye atlayabilir)
 *
 * Parent Alpine state: { categoryName: string, totalProducts: number }
 */

import { t } from "../../i18n";
import { TopRankingFilters } from "../top-ranking/TopRankingFilters";

export function TopRankingCategoryHero(): string {
  return `
    <div class="relative">
      <div class="relative z-10 container-boxed py-2 sm:py-4 lg:py-10 lg:py-14 text-center">
        <!-- Title + subtitle: desktop only -->
        <div class="hidden lg:block">
          <h1
            class="text-3xl sm:text-[40px] md:text-[44px] font-bold leading-tight text-secondary-800"
          >
            <span data-i18n="topRankingCategoryPage.heroTitlePrefix">${t("topRankingCategoryPage.heroTitlePrefix")}</span><span x-text="categoryName"></span>
          </h1>
          <p class="mt-1 text-sm sm:text-base font-medium text-secondary-500">
            <span x-text="$t('topRankingCategoryPage.heroSubtitlePrefix', { count: totalProducts })"></span><span data-i18n="topRankingCategoryPage.heroSubtitleSuffix">${t("topRankingCategoryPage.heroSubtitleSuffix")}</span>
          </p>
        </div>

        <div class="flex justify-center">
          ${TopRankingFilters()}
        </div>
      </div>
    </div>
  `;
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/top-ranking-category/TopRankingCategoryHero.ts
git commit -m "feat(top-ranking-category): add Hero component reusing TopRankingFilters"
```

---

## Task 6 — Bileşenleri index.ts'den export et

**Files:**
- Create: `tradehubfront/src/components/top-ranking-category/index.ts`

- [ ] **Step 1: Index dosyasını yaz**

```typescript
export { TopRankingCategoryHero } from "./TopRankingCategoryHero";
export { TopRankingCategoryGrid, renderRankedCategoryCard } from "./TopRankingCategoryGrid";
export { TopRankingCategoryPagination } from "./TopRankingCategoryPagination";
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/top-ranking-category/index.ts
git commit -m "feat(top-ranking-category): add barrel export"
```

---

## Task 7 — HTML shell

**Files:**
- Create: `tradehubfront/pages/top-ranking-category.html`

- [ ] **Step 1: Shell HTML yaz**

```html
<!DOCTYPE html>
<html lang="tr">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>En Çok Satanlar — Kategori | iSTOC</title>
  <link rel="icon" type="image/png" sizes="32x32" href="/images/istoc-favicon-32.png" />
</head>

<body>
  <div id="app"></div>
  <script type="module" src="/src/pages/top-ranking-category.ts"></script>
</body>

</html>
```

- [ ] **Step 2: Commit**

```bash
git add pages/top-ranking-category.html
git commit -m "feat(top-ranking-category): add HTML entry"
```

---

## Task 8 — Page entry (Alpine data + assembly)

**Files:**
- Create: `tradehubfront/src/pages/top-ranking-category.ts`

- [ ] **Step 1: Page entry'yi yaz**

```typescript
/**
 * Top Ranking Category Page — Entry Point
 *
 * URL: /pages/top-ranking-category.html?cat=<slug>&sort=<key>&page=<1|2>
 *
 * Bir kategoriye özgü Top 100 sayfası. Mevcut `searchListings` API'sini
 * `category + sort_by + page_size=50` ile çağırır; sıra rozetlerini
 * (page-1)*50 + index + 1 ile hesaplar; klasik sayfalama gösterir.
 */

import "../style.css";
import Alpine from "alpinejs";
import { initFlowbite } from "flowbite";
import { t } from "../i18n";

import {
  TopBar,
  initMobileDrawer,
  SubHeader,
  MegaMenu,
  initMegaMenu,
  initHeaderCart,
} from "../components/header";
import { initLanguageSelector } from "../components/header/TopBar";
import { Breadcrumb } from "../components/shared/Breadcrumb";
import { FooterLinks } from "../components/footer";
import { FloatingPanel } from "../components/floating";
import { startAlpine } from "../alpine";
import {
  TopRankingStickyMobileHeader,
  TopRankingMobileHeader,
  TopRankingSortPills,
} from "../components/top-ranking";
import {
  TopRankingCategoryHero,
  TopRankingCategoryGrid,
  TopRankingCategoryPagination,
  renderRankedCategoryCard,
} from "../components/top-ranking-category";
import { searchListings } from "../services/listingService";
import { initCurrency } from "../services/currencyService";
import { loadCategories, type ApiCategory } from "../services/categoryService";
import type { RankedProduct } from "../types/topRanking";
import { initAnimatedPlaceholder } from "../utils/animatedPlaceholder";

const PAGE_SIZE = 50;
const MAX_PAGES = 2;

type SortKey = "hot-selling" | "most-popular" | "best-reviewed";

const SORT_KEY_TO_BACKEND: Record<SortKey, string> = {
  "hot-selling": "orders",
  "most-popular": "views",
  "best-reviewed": "rating",
};

const VALID_SORTS: SortKey[] = ["hot-selling", "most-popular", "best-reviewed"];

function parseSearchParams(): { cat: string; sort: SortKey; page: number } {
  const sp = new URLSearchParams(window.location.search);
  const cat = (sp.get("cat") || "").trim();
  const sortRaw = (sp.get("sort") || "hot-selling").trim() as SortKey;
  const sort: SortKey = VALID_SORTS.includes(sortRaw) ? sortRaw : "hot-selling";
  const pageRaw = parseInt(sp.get("page") || "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 && pageRaw <= MAX_PAGES ? pageRaw : 1;
  return { cat, sort, page };
}

function syncUrl(cat: string, sort: SortKey, page: number): void {
  const sp = new URLSearchParams();
  if (cat) sp.set("cat", cat);
  sp.set("sort", sort);
  sp.set("page", String(page));
  const url = `${window.location.pathname}?${sp.toString()}`;
  window.history.replaceState({}, "", url);
}

Alpine.data("topRankingCategoryPage", () => ({
  // URL state
  category: "",
  page: 1,
  activeSort: "hot-selling" as SortKey,

  // Data
  products: [] as RankedProduct[],
  totalProducts: 0,
  totalPages: 1,
  loading: false,
  categoryName: "",
  apiCategories: [] as ApiCategory[],

  // Mevcut TopRankingFilters'ın beklediği state
  // (ana TopRanking sayfasındakiyle uyumlu; dropdown'un çalışması için gerekli)
  categoryDropdownOpen: false,
  categoryDropdownLevel: 1 as 1 | 2,
  selectedMainCategory: null as string | null,
  pendingSubCategory: null as string | null,
  showCategorySheet: false,
  // Dropdown'da "Tümü" gözükmesi için
  activeTab: "all" as string,
  activeCategory: "all" as string,

  init() {
    const parsed = parseSearchParams();
    this.category = parsed.cat;
    this.activeSort = parsed.sort;
    this.page = parsed.page;
    this.activeCategory = parsed.cat || "all";
    this.activeTab = parsed.cat || "all";
    this.selectedMainCategory = parsed.cat || null;

    loadCategories()
      .then((cats) => {
        this.apiCategories = cats;
        this.resolveCategoryName();
      })
      .catch((err) => console.warn("[TopRankingCategory] Category load failed:", err));

    initCurrency()
      .then(() => this.fetchPage())
      .catch((err) => console.warn("[TopRankingCategory] Init failed:", err));
  },

  resolveCategoryName(): void {
    if (!this.category) {
      this.categoryName = "";
      return;
    }
    for (const main of this.apiCategories) {
      if (main.slug === this.category) {
        this.categoryName = main.name;
        return;
      }
      const sub = main.children?.find((c) => c.slug === this.category);
      if (sub) {
        this.categoryName = sub.name;
        return;
      }
    }
    // Bulunamadı — boş bırak (template fallback gösterebilir)
    this.categoryName = "";
  },

  async fetchPage(): Promise<void> {
    if (!this.category) {
      this.products = [];
      this.totalProducts = 0;
      this.totalPages = 1;
      return;
    }
    if (this.loading) return;
    this.loading = true;
    try {
      const result = await searchListings({
        category: this.category,
        sort_by: SORT_KEY_TO_BACKEND[this.activeSort],
        page: this.page,
        page_size: PAGE_SIZE,
      });
      const incoming: RankedProduct[] = (result.products || []).map((p) => ({
        id: p.id || "",
        name: p.name || "",
        href: p.href || `/pages/product-detail.html?id=${p.id}`,
        price: p.price || "",
        imageSrc: p.imageSrc || "",
        moq: p.moq || "1",
        rank: 0, // grid'de (page-1)*50 + idx + 1 ile hesaplanır
        averageRating: typeof p.rating === "number" ? p.rating : undefined,
        ratingCount: typeof p.reviewCount === "number" ? p.reviewCount : undefined,
      }));
      this.products = incoming;
      this.totalProducts = result.searchHeader?.totalProducts || incoming.length;
      this.totalPages = Math.min(MAX_PAGES, Math.max(1, Math.ceil(this.totalProducts / PAGE_SIZE)));
      // page clamp (kategori 1 sayfaya düştüyse ve URL'de page=2 vardıysa)
      if (this.page > this.totalPages) {
        this.page = this.totalPages;
        syncUrl(this.category, this.activeSort, this.page);
      }
    } catch (err) {
      console.warn("[TopRankingCategory] fetchPage failed:", err);
      this.products = [];
      this.totalProducts = 0;
      this.totalPages = 1;
    } finally {
      this.loading = false;
    }
  },

  setSort(sortMode: string): void {
    if (this.activeSort === sortMode) return;
    this.activeSort = sortMode as SortKey;
    this.page = 1;
    syncUrl(this.category, this.activeSort, this.page);
    this.fetchPage();
  },

  goToPage(n: number): void {
    if (n < 1 || n > this.totalPages || n === this.page) return;
    this.page = n;
    syncUrl(this.category, this.activeSort, this.page);
    this.fetchPage().then(() => {
      const el = document.getElementById("trc-grid-anchor");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  },

  renderCard(product: RankedProduct, rank: number): string {
    return renderRankedCategoryCard(product, rank);
  },

  // Mevcut TopRankingFilters dropdown'unun beklediği metodlar
  openCategoryDropdown(): void {
    const isDesktop = window.innerWidth >= 1024;
    if (isDesktop) {
      this.categoryDropdownOpen = !this.categoryDropdownOpen;
    } else {
      this.showCategorySheet = true;
    }
    // Dropdown level seçilmiş kategoriye göre
    if (this.selectedMainCategory) {
      const mainCat = this.apiCategories.find((c) => c.slug === this.selectedMainCategory);
      const hasChildren = !!(mainCat?.children && mainCat.children.length > 0);
      this.categoryDropdownLevel = hasChildren ? 2 : 1;
    } else {
      this.categoryDropdownLevel = 1;
    }
  },

  openCategoryLevel2(mainCatId: string): void {
    this.selectedMainCategory = mainCatId;
    this.pendingSubCategory = null;
    this.categoryDropdownLevel = 2;
  },

  goBackToLevel1(): void {
    this.categoryDropdownLevel = 1;
  },

  /**
   * Dropdown'da seçim uygulandığında: ana kategori veya alt kategori seçildiyse
   * yeni Top Ranking Category sayfasına git; "Tümü" seçildiyse ana top-ranking
   * sayfasına dön.
   */
  applyCategoryFilter(): void {
    this.categoryDropdownOpen = false;
    const mainCat = this.selectedMainCategory;
    const finalCat = this.pendingSubCategory || mainCat;
    if (!finalCat) {
      // "Tümü" → ana top-ranking sayfasına git
      window.location.href = "/pages/top-ranking.html";
      return;
    }
    // Aynı kategori seçildiyse fetch yap (sayfa yenileme yerine)
    if (finalCat === this.category) {
      return;
    }
    const sp = new URLSearchParams();
    sp.set("cat", finalCat);
    sp.set("sort", this.activeSort);
    sp.set("page", "1");
    window.location.href = `/pages/top-ranking-category.html?${sp.toString()}`;
  },

  get selectedCategoryLabel(): string {
    if (!this.category) return t("topRankingPage.allCategories");
    return this.categoryName || this.category;
  },

  $t(key: string, params?: Record<string, unknown>): string {
    return t(key, params);
  },
}));

/* ── Page Assembly ── */

const parsed = parseSearchParams();

const breadcrumbItems = [
  { label: t("topRankingCategoryPage.breadcrumb"), href: "/pages/top-ranking.html" },
  { label: parsed.cat || t("topRankingCategoryPage.missingCategory") },
];

const appEl = document.querySelector<HTMLDivElement>("#app")!;
appEl.classList.add("relative");
appEl.innerHTML = `
  <div id="sticky-header" class="hidden lg:block z-[30] border-b border-gray-200 bg-white">
    ${TopBar()}
    ${SubHeader()}
  </div>

  ${MegaMenu()}

  ${TopRankingStickyMobileHeader()}

  <main x-data="topRankingCategoryPage">
    <div id="trc-mobile-hero-sentinel">
      ${TopRankingMobileHeader()}
    </div>

    <section class="relative z-20" style="background: linear-gradient(0deg, var(--color-primary-100, #fdf0c3) 1%, var(--color-primary-50, #fef9e7) 100%);">
      <div class="hidden lg:block absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-10 left-[5%] w-48 h-48 rounded-full bg-primary-200/20"></div>
        <div class="absolute top-1/3 right-[3%] w-36 h-36 rounded-full bg-primary-200/15"></div>
      </div>
      <div class="hidden lg:block relative z-10 container-boxed pt-2 lg:pt-3">
        ${Breadcrumb(breadcrumbItems)}
      </div>
      ${TopRankingCategoryHero()}
    </section>

    <div id="sticky-tabs" class="sticky top-0 z-10 bg-surface transition-shadow duration-200">
      <div class="container-boxed">
        ${TopRankingSortPills()}
      </div>
    </div>

    <section id="trc-grid-anchor" class="pb-8 lg:pb-12" style="background: var(--products-bg, #f9fafb);">
      <div class="container-boxed">
        ${TopRankingCategoryGrid()}
        ${TopRankingCategoryPagination()}
      </div>
    </section>
  </main>

  <footer>
    ${FooterLinks()}
  </footer>

  ${FloatingPanel()}
`;

initMegaMenu();
initFlowbite();
startAlpine();
initHeaderCart();
initMobileDrawer();
initLanguageSelector();
initAnimatedPlaceholder("#topbar-compact-search-input");
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: PASS. Eğer `top-ranking/index.ts` `TopRankingMobileHeader`, `TopRankingStickyMobileHeader`, `TopRankingSortPills` export etmiyorsa hata verir — Task 9'da düzeltilecek. Hata varsa şimdilik not al ve Task 9'a geç.

- [ ] **Step 3: Commit**

```bash
git add src/pages/top-ranking-category.ts
git commit -m "feat(top-ranking-category): add page entry with Alpine data and assembly"
```

---

## Task 9 — top-ranking barrel export'unu doğrula

**Files:**
- Modify: `tradehubfront/src/components/top-ranking/index.ts` (gerekirse)

- [ ] **Step 1: Mevcut barrel'ı oku**

```bash
cat src/components/top-ranking/index.ts
```

- [ ] **Step 2: Eksik export varsa ekle**

Aşağıdaki named export'ların hepsi `index.ts`'te olmalı:

```typescript
export { TopRankingHero, TopRankingMobileHeader, TopRankingStickyMobileHeader } from "./TopRankingHero";
export { TopRankingCategoryTabs, initRankingCategoryTabs } from "./TopRankingCategoryTabs";
export { TopRankingSortPills } from "./TopRankingSortPills";
export { TopRankingGrid, renderRankingGroupCard } from "./TopRankingGrid";
export { TopRankingFilters } from "./TopRankingFilters";
```

`renderRankingFlatCard` BU AŞAMADA hâlâ export ediliyor olabilir — Task 12'de TopRankingGrid.ts içinden silindiğinde bu satır da temizlenecek. Şu an dokunma.

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 4: Commit (varsa değişiklik)**

```bash
git add src/components/top-ranking/index.ts
git commit -m "chore(top-ranking): ensure barrel exports MobileHeader and SortPills"
```

Eğer dosyada zaten her şey vardıysa commit yok — sıradaki task'a geç.

---

## Task 10 — Smoke test: yeni sayfa render oluyor mu?

**Files:**
- (Test çalıştırma — kod değişikliği yok)

- [ ] **Step 1: Dev sunucu başlat**

Ayrı terminalde:

```bash
cd "/home/metin/Desktop/istoc cı-cd/tradehubfront"
npm run dev
```

- [ ] **Step 2: Tarayıcıda doğrula**

Aşağıdakileri **gerçek backend bağlıyken** kontrol et (kullanıcı `tradehub.localhost` kullanıyor; port Vite çıkışına bakılır):

`http://tradehub.localhost:5173/pages/top-ranking-category.html?cat=demo-cat-mutfak&sort=hot-selling&page=1`

Beklenen:
- Sayfa yükleniyor (beyaz ekran yok, JS hatası yok).
- Hero: "En Çok Satanlar — Mutfak Aksesuarları", subtitle ürün sayısı.
- Sıralama pillları görünüyor, "Çok satan" aktif.
- Grid: 5 sütun (desktop), her kartta sol üstte rank rozeti (#1 yeşil, #2 mavi, #3 turuncu, #4+ koyu).
- Yıldız satırı sadece rating > 0 olan kartlarda.
- Footer ve TopBar render oluyor.

- [ ] **Step 3: Edge case'ler**

Dene:
- `?cat=` boş → empty state ("Bu kategoride henüz sıralama oluşmadı.").
- `?cat=demo-cat-mutfak&page=99` → otomatik sayfa 1 veya totalPages'e clamp.
- `?cat=demo-cat-mutfak&sort=invalid` → otomatik `hot-selling`.

- [ ] **Step 4: Sorun varsa not al, düzelt, commit**

Eğer sorun yoksa:

```bash
git log --oneline -1
echo "Smoke test passed"
```

Commit yok (sadece doğrulama adımı).

---

## Task 11 — Anasayfa 6-kart linklerini güncelle

**Files:**
- Modify: `tradehubfront/src/components/hero/TopRanking.ts` (line ~47)

- [ ] **Step 1: Mevcut href satırını bul**

```bash
grep -n "products.html" src/components/hero/TopRanking.ts
```

- [ ] **Step 2: Href'i güncelle**

`src/components/hero/TopRanking.ts` içinde:

**Eski:**
```typescript
const href = `/pages/products.html?cat=${encodeURIComponent(cat.slug || cat.id)}&sort=orders`;
```

**Yeni:**
```typescript
const href = `/pages/top-ranking-category.html?cat=${encodeURIComponent(cat.slug || cat.id)}&sort=hot-selling&page=1`;
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 4: Browser smoke test**

Anasayfaya git (`/index.html` veya `/`), "En Çok Satanlar" bölümündeki 6 karttan birine tıkla → yeni Top Ranking Category sayfasına gitmeli.

- [ ] **Step 5: Commit**

```bash
git add src/components/hero/TopRanking.ts
git commit -m "feat(homepage): link top-ranking cards to dedicated category page"
```

---

## Task 12 — Top Ranking sayfasından flat modu kaldır

**Files:**
- Modify: `tradehubfront/src/pages/top-ranking.ts`
- Modify: `tradehubfront/src/components/top-ranking/TopRankingGrid.ts`
- Modify: `tradehubfront/src/components/top-ranking/index.ts` (varsa `renderRankingFlatCard` export'u)

- [ ] **Step 1: top-ranking.ts'den flat state ve metotları sil**

`src/pages/top-ranking.ts` içinde aşağıdaki kalemleri sil:

1. Üstteki `flatProducts`, `flatNextPage` field tanımları.
2. `mode: 'grouped' | 'flat'` tipini sadece sabit `'grouped'` haline çevir veya tamamen kaldır.
3. `fetchActive` dispatcher'ını kaldır; doğrudan `fetchGroupedPage` kullan.
4. `fetchFlatPage` fonksiyonunu tamamen sil.
5. `renderFlatCard` metodunu sil.
6. `setTab` içinde `tabId === 'all'` dışındaki davranışı yeniden yaz: kategori sekmesi/dropdown bu sayfada **artık fetch yapmaz** — `<a href>` ile yönlendirilir (Task 13). `setTab` sadece "Tümü" için anlamlı olur. Bu metodu basitleştir veya sil.
7. `setSort`, `loadMore` doğrudan `fetchGroupedPage` çağırsın.

Yeniden yazılmış `topRankingPage` Alpine data nesnesinin iskeleti:

```typescript
Alpine.data('topRankingPage', () => ({
  init() {
    loadCategories().then(cats => { this.apiCategories = cats; })
      .catch(err => console.warn('[TopRanking] Category load failed:', err));
    initCurrency()
      .then(() => this.fetchGroupedPage(true))
      .catch(err => console.warn('[TopRanking] Init failed:', err));
  },

  activeTab: 'all' as string,
  activeCategory: 'all' as string,
  activeSort: 'hot-selling' as SortKey,

  categoryDropdownOpen: false,
  categoryDropdownLevel: 1 as 1 | 2,
  selectedMainCategory: null as string | null,
  pendingSubCategory: null as string | null,
  showCategorySheet: false,
  showTabSheet: false,

  canScrollLeft: false,
  canScrollRight: true,

  nextPage: 1,
  loading: false,
  hasMore: true,
  totalCategories: 0,

  apiCategories: [] as ApiCategory[],
  allGroups: [] as RankingCategoryGroup[],

  get visibleGroups(): RankingCategoryGroup[] { return this.allGroups; },
  get visibleGroupCount(): number { return this.allGroups.length; },

  async fetchGroupedPage(reset = false): Promise<void> {
    if (this.loading) return;
    if (!reset && !this.hasMore) return;
    this.loading = true;
    if (reset) {
      this.nextPage = 1;
      this.hasMore = true;
      this.allGroups = [];
      this.totalCategories = 0;
    }
    try {
      const result = await getTopRankingGrouped(
        this.nextPage,
        GROUPS_PER_PAGE,
        PRODUCTS_PER_GROUP,
        undefined,
        this.activeSort,
      );
      const incoming = (result.groups || []).map(toRankingGroup);
      this.allGroups = reset ? incoming : this.allGroups.concat(incoming);
      this.totalCategories = result.totalCategories || this.allGroups.length;
      this.hasMore = result.hasNext;
      this.nextPage = (result.page || this.nextPage) + 1;
    } catch (err) {
      console.warn('[TopRanking] fetchGroupedPage failed:', err);
      this.hasMore = false;
    } finally {
      this.loading = false;
    }
  },

  setSort(sortMode: string): void {
    if (this.activeSort === sortMode) return;
    this.activeSort = sortMode as SortKey;
    this.fetchGroupedPage(true);
  },

  loadMore(): void { this.fetchGroupedPage(false); },

  renderGroupCard(group: RankingCategoryGroup): string {
    return renderRankingGroupCard(group);
  },

  scrollTabs(direction: 'left' | 'right'): void {
    const el = (this.$refs as Record<string, HTMLElement>).tabsScroll;
    if (!el) return;
    const scrollAmount = 200;
    el.scrollLeft += direction === 'left' ? -scrollAmount : scrollAmount;
  },

  updateScrollState(): void {
    const el = (this.$refs as Record<string, HTMLElement>).tabsScroll;
    if (!el) return;
    this.canScrollLeft = el.scrollLeft > 0;
    this.canScrollRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 1;
  },

  openCategoryLevel2(mainCatId: string): void {
    this.selectedMainCategory = mainCatId;
    this.pendingSubCategory = null;
    this.categoryDropdownLevel = 2;
  },

  goBackToLevel1(): void { this.categoryDropdownLevel = 1; },

  /**
   * "Tümü" seçildiğinde aynı sayfada grouped'a dön; bir kategori seçildiğinde
   * yeni adanmış sayfaya yönlendir.
   */
  applyCategoryFilter(): void {
    this.categoryDropdownOpen = false;
    const mainCat = this.selectedMainCategory;
    const finalCat = this.pendingSubCategory || mainCat;
    if (!finalCat) {
      // "Tümü" — bu sayfada kal, grouped'ı yeniden yükle
      this.activeTab = 'all';
      this.activeCategory = 'all';
      this.fetchGroupedPage(true);
      return;
    }
    const sp = new URLSearchParams();
    sp.set('cat', finalCat);
    sp.set('sort', this.activeSort);
    sp.set('page', '1');
    window.location.href = `/pages/top-ranking-category.html?${sp.toString()}`;
  },

  openCategoryDropdown(): void {
    const isDesktop = window.innerWidth >= 1024;
    const opening = isDesktop ? !this.categoryDropdownOpen : true;
    if (opening) {
      this.selectedMainCategory = null;
      this.pendingSubCategory = null;
      this.categoryDropdownLevel = 1;
    }
    if (isDesktop) {
      this.categoryDropdownOpen = opening;
    } else {
      this.showCategorySheet = true;
    }
  },

  get selectedCategoryLabel(): string {
    return t('topRankingPage.allCategories');
  },

  $t(key: string): string { return t(key); },
}));
```

`Page Assembly` kısmı değişmez. `appEl.innerHTML` içindeki `TopRankingCategoryTabs` referansı Task 13'te güncellenecek.

- [ ] **Step 2: TopRankingGrid.ts'den flat template ve renderRankingFlatCard'ı sil**

`src/components/top-ranking/TopRankingGrid.ts` içinde:

1. `renderRankingFlatCard` fonksiyonunun TAMAMI silinir (`export function renderRankingFlatCard...` bloğu).
2. `TopRankingGrid()` içindeki `<template x-if="mode === 'flat'">` bloğu **tamamen** silinir.
3. `<template x-if="mode === 'grouped'">` template wrapper'ı kaldırılır (artık tek mod var) — alttaki div doğrudan render edilir. Yani:

**Eski:**
```html
<template x-if="mode === 'grouped'">
  <div id="top-ranking-grid" ...>
    ...
  </div>
</template>
```

**Yeni:**
```html
<div id="top-ranking-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-5"
     role="list" aria-label="Ranking category groups">
  <template x-for="group in allGroups" :key="group.id">
    <div role="listitem" x-html="renderGroupCard(group)"></div>
  </template>
  <template x-if="loading && allGroups.length === 0">
    <div role="listitem">${renderSkeletonCard()}</div>
  </template>
  <template x-if="loading && allGroups.length === 0">
    <div role="listitem">${renderSkeletonCard()}</div>
  </template>
  <template x-if="loading && allGroups.length === 0">
    <div role="listitem">${renderSkeletonCard()}</div>
  </template>
</div>
```

4. Empty state ve load-more `x-show` koşullarındaki `flatProducts.length` referansları kaldırılır (sadece `allGroups.length` kalır).

- [ ] **Step 3: index.ts barrel'dan renderRankingFlatCard export'unu kaldır**

```bash
grep -n "renderRankingFlatCard" src/components/top-ranking/index.ts
```

Eğer export edilmişse kaldır.

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```

Expected: PASS. Eğer top-ranking.ts hâlâ `renderRankingFlatCard` import ediyorsa, import satırını sil.

- [ ] **Step 5: Browser smoke test**

`/pages/top-ranking.html` → "Tümü" sekmesi grouped grid göstermeli, "Daha fazla yükle" çalışmalı, sıralama pillları çalışmalı. Henüz kategori sekmesine TIKLAMA — Task 13'e kadar `setTab` davranışı kaldırılmadı.

- [ ] **Step 6: Commit**

```bash
git add src/pages/top-ranking.ts src/components/top-ranking/TopRankingGrid.ts src/components/top-ranking/index.ts
git commit -m "refactor(top-ranking): remove flat mode (replaced by dedicated category page)"
```

---

## Task 13 — Kategori sekmelerini ve kart başlıklarını yeni sayfaya yönlendir

**Files:**
- Modify: `tradehubfront/src/components/top-ranking/TopRankingCategoryTabs.ts`
- Modify: `tradehubfront/src/components/top-ranking/TopRankingGrid.ts` (categoryHref güncelle)

- [ ] **Step 1: TopRankingCategoryTabs'ta sekme `<button>`'ları `<a>`'ya çevir**

`src/components/top-ranking/TopRankingCategoryTabs.ts` içinde:

**Desktop tab strip — kategori `<template x-for>` bloğu:**

**Eski:**
```html
<template x-for="cat in apiCategories" :key="'tab-' + cat.slug">
  <button
    type="button"
    class="top-ranking-tab flex-shrink-0 whitespace-nowrap px-[10px] sm:px-4 py-2 sm:py-3 text-[11px] sm:text-sm transition-colors border-b-[3px] border-transparent"
    :class="activeTab === cat.slug
      ? '!border-secondary-800 !text-text-primary font-semibold'
      : 'text-text-tertiary hover:text-text-primary'"
    @click="setTab(cat.slug)"
    x-text="cat.name"
  ></button>
</template>
```

**Yeni:**
```html
<template x-for="cat in apiCategories" :key="'tab-' + cat.slug">
  <a
    :href="'/pages/top-ranking-category.html?cat=' + encodeURIComponent(cat.slug) + '&sort=' + activeSort + '&page=1'"
    class="top-ranking-tab flex-shrink-0 whitespace-nowrap px-[10px] sm:px-4 py-2 sm:py-3 text-[11px] sm:text-sm transition-colors border-b-[3px] border-transparent text-text-tertiary hover:text-text-primary"
    x-text="cat.name"
  ></a>
</template>
```

"Tümü" sekmesi `<button @click="setTab('all')">` olarak **kalır** (aynı sayfa davranışı).

**Mobil bottom sheet — kategori `<template x-for>` bloğu (aynı dosyanın alt yarısında):**

**Eski:**
```html
<template x-for="cat in apiCategories" :key="'sheet-' + cat.slug">
  <button
    type="button"
    class="flex items-center w-full px-5 py-4 text-left transition-colors border-b border-gray-50 active:bg-gray-50"
    @click="setTab(cat.slug); showTabSheet = false"
  >
    ...
  </button>
</template>
```

**Yeni:**
```html
<template x-for="cat in apiCategories" :key="'sheet-' + cat.slug">
  <a
    :href="'/pages/top-ranking-category.html?cat=' + encodeURIComponent(cat.slug) + '&sort=' + activeSort + '&page=1'"
    class="flex items-center w-full px-5 py-4 text-left transition-colors border-b border-gray-50 active:bg-gray-50"
  >
    <span class="flex-1 text-[15px] text-gray-600" x-text="cat.name"></span>
    <span class="flex-shrink-0 w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center transition-colors">
      <span class="w-2 h-2 rounded-full bg-transparent transition-colors"></span>
    </span>
  </a>
</template>
```

(Mobilde radio rozeti artık sadece "Tümü" için anlamlı; kategori için statik gri.)

"Tümü" mobil item `<button @click="setTab('all'); showTabSheet = false">` kalır.

- [ ] **Step 2: TopRankingGrid kart başlığını yeni sayfaya yönlendir**

`src/components/top-ranking/TopRankingGrid.ts` içinde `categoryHref` fonksiyonunu güncelle:

**Eski:**
```typescript
function categoryHref(group: RankingCategoryGroup): string {
  const slug = group.slug || group.categoryId || group.id;
  return `/pages/products.html?cat=${encodeURIComponent(slug)}&sort=orders`;
}
```

**Yeni:**
```typescript
function categoryHref(group: RankingCategoryGroup): string {
  const slug = group.slug || group.categoryId || group.id;
  return `/pages/top-ranking-category.html?cat=${encodeURIComponent(slug)}&sort=hot-selling&page=1`;
}
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 4: Browser smoke test**

`/pages/top-ranking.html` →
1. "Tümü" sekmesi: aynı sayfada grouped görünüm.
2. Bir kategori sekmesine (örn. "Mutfak") tıkla → yeni sayfaya gitmeli.
3. Bir kart başlığına (örn. "Market Ürünleri") tıkla → yeni sayfaya gitmeli.
4. Mobil bottom sheet'te kategori seç → yeni sayfaya gitmeli.

- [ ] **Step 5: Commit**

```bash
git add src/components/top-ranking/TopRankingCategoryTabs.ts src/components/top-ranking/TopRankingGrid.ts
git commit -m "feat(top-ranking): redirect category tabs and card headers to dedicated page"
```

---

## Task 14 — "Karşılaştır" checkbox'ını ürün kartlarından kaldır

**Files:**
- Modify: `tradehubfront/src/components/products/ProductListingGrid.ts` (lines 125-131)

- [ ] **Step 1: Checkbox bloğunu sil**

`src/components/products/ProductListingGrid.ts` dosyasında 125-131 numaralı satır aralığını sil:

**Silinecek blok:**
```html
<!-- ${t("products.addToCompare")} checkbox (visible on hover) -->
<label class="absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2 py-1 rounded bg-white/90 shadow-sm text-[11px] text-gray-700 cursor-pointer opacity-0 group-hover/img:opacity-100 transition-opacity"
       onclick="event.preventDefault(); event.stopPropagation();">
  <input type="checkbox" class="w-3.5 h-3.5 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
         data-compare-id="${card.id}" onclick="event.stopPropagation();" />
  ${t("products.addToCompare")}
</label>
```

Yerine sadece bir önceki yorum (`<!-- arrowsHtml/dotsHtml ... -->`) ve sonraki bloğun (`<!-- Camera icon (bottom-left) - DISABLED -->`) arasında boş satır kalır.

- [ ] **Step 2: i18n anahtarı `products.addToCompare`'ı silme**

`tr.ts` ve `en.ts` içinde `products.addToCompare` anahtarı **kalır** (geri eklenebilsin diye). Sadece çağrı silinir.

- [ ] **Step 3: Typecheck + lint**

```bash
npx tsc --noEmit && npx eslint src/components/products/ProductListingGrid.ts
```

Expected: PASS.

- [ ] **Step 4: Browser smoke test**

`/pages/products.html?cat=demo-cat-mutfak` → ürün kartının üzerine hover'la → sağ üstte "Karşılaştır" checkbox **görünmemeli**.

- [ ] **Step 5: Commit**

```bash
git add src/components/products/ProductListingGrid.ts
git commit -m "feat(products): remove inactive Karşılaştır checkbox from product cards"
```

---

## Task 15 — Tam regresyon doğrulaması

**Files:**
- (Test çalıştırma — kod değişikliği yok)

- [ ] **Step 1: Lint + typecheck temiz**

```bash
cd "/home/metin/Desktop/istoc cı-cd/tradehubfront"
npx tsc --noEmit && npx eslint "src/**/*.{ts,js}"
```

Expected: PASS.

- [ ] **Step 2: Build çalışıyor**

```bash
npm run build
```

Expected: PASS (yeni HTML otomatik input'a girer; rollup çıktısı `dist/pages/top-ranking-category.html` ve eşleşen JS chunk'ları üretmeli).

- [ ] **Step 3: Manuel browser regresyon checklist**

`npm run dev` ile aşağıdaki kontrolleri tek tek yap:

| Sayfa / akış | Beklenen |
|---|---|
| Anasayfa "En Çok Satanlar" 6 kart | Karta tıklayınca `/pages/top-ranking-category.html` açılır |
| `/pages/top-ranking.html` "Tümü" | Grouped grid, "Daha fazla yükle", sıralama pillları çalışıyor |
| `/pages/top-ranking.html` kategori sekmesi (Mutfak vs.) | Yeni sayfaya yönleniyor |
| `/pages/top-ranking.html` kart başlığı (Market Ürünleri vs.) | Yeni sayfaya yönleniyor |
| `/pages/top-ranking.html` mobil bottom sheet kategori | Yeni sayfaya yönleniyor |
| `/pages/top-ranking-category.html?cat=demo-cat-mutfak` | Hero başlığı doğru, grid 5 sütun, rozetler renkli, yıldız satırı var |
| Yeni sayfa: sıralama pili "En popüler" | URL `?sort=most-popular` olur, grid yeniden yüklenir |
| Yeni sayfa: 50+ ürün → sayfa 2 butonu | Sayfa 2'ye geç, URL `?page=2`, rozetler #51..#100 |
| Yeni sayfa: geri tuşu | URL state geri yükleniyor (replaceState olduğu için aslında sadece son state — kabul edilebilir) |
| Yeni sayfa: hero dropdown'dan başka kategori seç | Yeni sayfaya navigate ediyor |
| Yeni sayfa: hero dropdown'dan "Tümü" seç | `/pages/top-ranking.html`'e gidiyor |
| `/pages/products.html?cat=...` | Ürün kartı hover'ında "Karşılaştır" görünmüyor |
| Mobil viewport (375px): yeni sayfa | 2 sütun grid, sticky pill'ler, sayfalama düzgün |

- [ ] **Step 4: Sorun yoksa final commit yok**

Sorun varsa düzelt → ek commit; yoksa sonraki adıma geç.

---

## Task 16 — Spec'i implementation klasörüne kopyala

**Files:**
- Copy: `docs/superpowers/specs/2026-05-06-top-ranking-category-page-design.md` → `tradehubfront/docs/superpowers/specs/2026-05-06-top-ranking-category-page-design.md`

- [ ] **Step 1: Spec'i tradehubfront git repo'suna taşı (versiyon kontrolüne girsin)**

```bash
cd "/home/metin/Desktop/istoc cı-cd/tradehubfront"
mkdir -p docs/superpowers/specs docs/superpowers/plans
cp "../docs/superpowers/specs/2026-05-06-top-ranking-category-page-design.md" docs/superpowers/specs/
cp "../docs/superpowers/plans/2026-05-06-top-ranking-category-page.md" docs/superpowers/plans/
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/
git commit -m "docs: add Top Ranking Category page design spec and plan"
```

---

## Self-Review (plan yazıldıktan sonra)

**Spec kapsamı:**
- §1 Amaç → Task 7-8 (yeni sayfa)
- §2 Yaklaşım Özeti → Task 1-9 (yeni sayfa, bileşenler), Task 12 (flat mod kaldır)
- §3 URL ve Yönlendirme Akışı → Task 8 (URL parse + replaceState), Task 11 (homepage), Task 13 (top-ranking sekme + kart başlığı)
- §4 Sayfa Düzeni → Task 5 (Hero), Task 8 (assembly)
- §5 Ürün Kartı Tasarımı → Task 4 (Grid + renderRankedCategoryCard)
- §6 Sayfalama Bileşeni → Task 3 (Pagination)
- §7 State Yönetimi → Task 8 (Alpine data)
- §8 Bileşen Dosya Planı → Task 3-9 (yeni), Task 11-14 (düzenleme)
- §9 Veri Modeli → Task 1 (tipler), Task 8 (mapping)
- §10 Edge Case'ler → Task 8 (clamp, empty, fail-safe)
- §11 Etki Analizi → Task 12 (flat mod kaldırma)
- §12 Kapsam Dışı → ✓
- §13 Kabul Kriterleri → Task 10, 15 (manuel doğrulama)

**Placeholder taraması:** "TBD"/"implement later" yok. Tüm kod blokları tam, dosya yolları kesin, komutlar hazır.

**Tip tutarlılığı:** `RankedProduct.rank: number` (Task 1) — tüm sonraki kullanımlar (Task 4 `rankBadgeClass(rank)`, Task 8 `rank: 0` initial) bununla uyumlu. `renderRankedCategoryCard(product, rank)` imzası Task 4 ve Task 8'de aynı. `searchListings` parametre adları (`category`, `sort_by`, `page`, `page_size`) Task 8'de mevcut servis API'siyle birebir.

**Toplam task:** 16. Her biri 2-15 dakika; toplam ~3 saat çalışma.

---

## Execution Handoff

Plan tamamlandı ve kaydedildi: `docs/superpowers/plans/2026-05-06-top-ranking-category-page.md`. İki yürütme seçeneği:

**1. Subagent-Driven (önerilen)** — Her task için ayrı subagent dispatch ederim, aralarda kısa review, hızlı iterasyon.

**2. Inline Execution** — Bu oturumda doğrudan task task ilerleriz, checkpoint'lerde durup birlikte gözden geçiririz.

Hangisini tercih edersiniz?
