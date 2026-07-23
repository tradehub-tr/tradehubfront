/**
 * Categories Page — Entry Point
 * Assembles header, Amazon-style category grid, and footer.
 */

import '../style.css'
import { initFlowbite } from 'flowbite'
import { t } from '../i18n'

// Header components
import { TopBar, SubHeader, initStickyHeaderSearch, MegaMenu, initMegaMenu, initHeaderCart } from '../components/header'
import { mountChatPopup, initChatTriggers } from '../components/chat-popup'
import { initLanguageSelector } from '../components/header/TopBar'

// Footer components
import { FooterLinks } from '../components/footer'

// Floating components
import { FloatingPanel } from '../components/floating'

// Alpine.js
import { startAlpine } from '../alpine'

// Shared components
import { Breadcrumb } from '../components/shared/Breadcrumb'

// Categories components
import { renderCategoryPage, CategoryQuickNav, initCategoryQuickNav } from '../components/categories'

// Category data (type only — no longer used for rendering)
import type { CategorySection } from '../data/categories'

// Utilities
import { initAnimatedPlaceholder } from '../utils/animatedPlaceholder'

// Category service (cached via queryFetch + IndexedDB)
import { loadCategories, getCategoryPageSeo, type ApiCategory } from '../services/categoryService'

// SEO: backend'in (panelden yönetilen) seo payload'ını DOM head'ine uygula
import { applyServerSeo } from '../seo/setPageMeta'

function mapApiToSections(cats: ApiCategory[]): CategorySection[] {
  return cats.map(cat => ({
    title: cat.name,
    slug: cat.slug,
    categories: cat.children.map(ch => ({
      id: ch.id,
      name: ch.name,
      href: `/pages/products.html?cat=${ch.slug}`,
      image: ch.image || '',
      subcategories: [],
    })),
  }));
}

const appEl = document.querySelector<HTMLDivElement>('#app')!;
appEl.innerHTML = `
  <!-- Sticky Header -->
  <div id="sticky-header" class="sticky top-0 z-(--z-header) border-b border-gray-200 bg-white">
    ${TopBar()}
    ${SubHeader()}
  </div>

  ${MegaMenu()}

  <!-- Main Content -->
  <main>
    <section class="py-4 lg:py-8" style="background: var(--products-bg, #f9fafb);">
      <div class="container-boxed">
        ${Breadcrumb([{ label: t('drawer.categories') }])}

        <!-- Page Header -->
        <div class="mb-4">
          <h1 class="text-lg sm:text-2xl font-bold text-gray-900" data-i18n="categoryPage.heading">${t('categoryPage.heading')}</h1>
          <p class="text-xs sm:text-sm text-gray-500 mt-1" data-i18n="drawer.browseCategories">${t('drawer.browseCategories')}</p>
        </div>

        <!-- Main layout: Filter Sidebar + Category Grid -->
        <div class="flex flex-col lg:flex-row gap-4 lg:gap-6">
          <!-- Filter Sidebar (hidden on mobile) -->
          <div id="cat-sidebar-container" class="hidden lg:block">
            <div class="w-56 shrink-0"><div class="sticky top-24"><div class="bg-white rounded-lg border border-gray-200 p-4 h-40 flex items-center justify-center text-gray-400 text-sm animate-pulse">${t('categoryPage.loading')}</div></div></div>
          </div>

          <!-- Category Grid -->
          <div id="cat-grid-container" class="flex-1 min-w-0">
            <div class="py-16 text-center text-gray-400 animate-pulse">${t('categoryPage.loadingCategories')}</div>
          </div>
        </div>
      </div>
    </section>
  </main>

  <!-- Footer -->
  <footer>
    ${FooterLinks()}
  </footer>

  <!-- Floating Panel -->
  ${FloatingPanel()}
`;

// Initialize custom component behaviors
initMegaMenu();
initFlowbite();
mountChatPopup();
initChatTriggers();
startAlpine();
initStickyHeaderSearch();
initHeaderCart();
initLanguageSelector();
initAnimatedPlaceholder('#topbar-compact-search-input');
initCategoryQuickNav();

/**
 * Scroll to the section matching a slug (from ?cat= or #cat=<slug>).
 * Called after sections are rendered so data-slug attributes are present.
 */
function scrollToSlugSection(slug: string): void {
  if (!slug) return;
  const target = document.querySelector<HTMLElement>(
    `#cat-grid-container section[data-slug="${CSS.escape(slug)}"]`
  );
  if (!target) return;
  // Defer to next frame so layout/fonts settle before measuring offsets.
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  requestAnimationFrame(() => {
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  });
}

// Render categories using the shared cached service (queryFetch + IndexedDB)
function renderCategoriesError(): void {
  const gridEl = document.getElementById('cat-grid-container');
  if (gridEl) gridEl.innerHTML = `<div class="py-16 text-center text-red-400">${t('categoryPage.loadError')}</div>`;
}

loadCategories()
  .then((apiCats) => {
    // categoryService.loadCategories() hata durumunda reject ETMEZ, boş dizi döndürür
    // (no-throw kontratı header MegaMenu vb. tüketicilerce bekleniyor). Bu yüzden boş
    // sonucu burada "yüklenemedi" olarak ele alıyoruz — yoksa sessizce boş grid çıkardı.
    if (apiCats.length === 0) {
      renderCategoriesError();
      return;
    }

    const sections = mapApiToSections(apiCats);

    // Panelden girilen SEO meta'ları (BE-LD ile API'ye eklenecek `seo` alanı)
    // varsa uygula — canonical/OG/robots dahil (product-detail.ts:221 deseni).
    applyServerSeo(getCategoryPageSeo() ?? undefined);

    const sidebarEl = document.getElementById('cat-sidebar-container');
    const gridEl = document.getElementById('cat-grid-container');
    if (sidebarEl) sidebarEl.innerHTML = CategoryQuickNav(sections);
    if (gridEl) gridEl.innerHTML = renderCategoryPage(sections);

    initCategoryQuickNav();

    // Deep-link: /pages/categories.html?cat=<slug> → scroll to that section
    const slug = new URLSearchParams(window.location.search).get('cat');
    if (slug) scrollToSlugSection(slug);
  })
  .catch(renderCategoriesError);
