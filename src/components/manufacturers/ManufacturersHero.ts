import { t } from '../../i18n';
import { getBrowsingHistory } from '../../services/browsingHistoryService';


export function ManufacturersHero(): string {
  return `
    <!-- Main Grid: 4 columns (Sidebar) + (Samples/LIVE) + (Top Ranking) + (Profile Box) -->
    <div class="hidden xl:flex flex-row h-[400px] gap-4 mb-4">

      <!-- Column 1: Source by category (Sidebar) -->
      ${renderSourceByCategory()}

      <!-- Column 2: Get samples & Factory LIVE Q&A -->
      ${renderMiddleColumn()}

      <!-- Column 3: Top-ranking manufacturers -->
      ${renderTopRankingColumn()}

      <!-- Column 4: Profile / Guest Panel -->
      ${renderProfileColumn()}

    </div>
  `;
}

const ALL_CATEGORIES_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`;



function renderSourceByCategory(): string {
  return `
    <!-- Sidebar wrapper: position:relative so flyout can be absolutely positioned to the right -->
    <div class="relative flex-1" data-category-sidebar
      x-data="{
        cats: [],
        activeCat: null,
        _hideTimer: null,
        async init() {
          try {
            const url = (window.API_BASE || '/api') + '/method/tradehub_core.api.category.get_mega_menu';
            const res = await fetch(url, { credentials: 'include' }).then(r => r.json());
            const data = res.message || [];
            this.cats = data.map(c => ({
              ...c,
              iconSvg: window.__getCatIcon ? window.__getCatIcon(c.icon_class || '', c.name) : ''
            }));
          } catch(e) { console.error('Category sidebar fetch failed', e); }
        },
        showFlyout(id) { clearTimeout(this._hideTimer); this.activeCat = id; },
        hideFlyout() { this._hideTimer = setTimeout(() => { this.activeCat = null; }, 150); },
        keepFlyout() { clearTimeout(this._hideTimer); }
      }"
    >
      <div class="p-4 flex flex-col h-full" style="background-color: var(--mfr-sidebar-bg, #ffffff); border-radius: var(--mfr-hero-card-radius, 6px); box-shadow: var(--mfr-hero-card-shadow, 0 0 12px rgba(0,0,0,0.05))">
        <h3 class="text-lg font-bold mb-3" style="color: var(--mfr-sidebar-heading-color, #111827)">
          ${t('mfr.sourceByCategory')}
        </h3>

        <ul class="flex-1 flex flex-col overflow-hidden">

          <!-- Dynamic categories from API -->
          <template x-for="cat in cats" :key="cat.id">
            <li :data-category-id="cat.id"
                @mouseenter="showFlyout(cat.id)"
                @mouseleave="hideFlyout()"
            >
              <a
                :href="'/pages/products.html?cat=' + cat.slug"
                class="flex items-center justify-between py-0 px-4 h-10 mb-1 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
              >
                <div class="flex items-center gap-3 min-w-0 flex-1">
                  <span
                    class="w-5 h-5 flex-shrink-0 flex items-center justify-center transition-colors duration-150"
                    style="color: var(--mfr-sidebar-icon-color, #6b7280)"
                    x-html="cat.iconSvg"
                  ></span>
                  <span class="text-sm font-medium truncate" style="color: var(--mfr-sidebar-text-color, #374151)" x-text="cat.name"></span>
                </div>
                <svg class="w-4 h-4 flex-shrink-0 ml-2" style="color: var(--mfr-sidebar-chevron-color, #d1d5db)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </a>

              <!-- Flyout panel -->
              <div
                x-show="activeCat === cat.id"
                x-cloak
                @mouseenter="keepFlyout()"
                @mouseleave="hideFlyout()"
                class="absolute left-full top-0 z-50 w-[calc(200%+3rem)] h-full overflow-y-auto pt-5 px-5 pb-2.5"
                style="background-color: var(--mfr-flyout-bg, #f4f4f4); border-radius: var(--mfr-hero-card-radius, 6px); box-shadow: var(--mfr-hero-card-shadow, 0 0 12px rgba(0,0,0,0.05))"
                :aria-label="cat.name"
              >
                <p class="text-sm font-bold mb-3" style="color: var(--mfr-flyout-heading-color, #111827)" x-text="cat.name"></p>
                <div class="grid grid-cols-4 gap-x-4 gap-y-1.5">
                  <template x-for="child in cat.children" :key="child.id">
                    <a
                      :href="'/pages/products.html?cat=' + child.slug"
                      class="text-xs hover:text-primary-600 hover:underline leading-5 transition-colors"
                      style="color: var(--mfr-flyout-link-color, #767676)"
                      x-text="child.name"
                    ></a>
                  </template>
                </div>
              </div>
            </li>
          </template>

          <!-- All categories -- separated by top border -->
          <li class="mt-auto pt-2 border-t border-gray-100 dark:border-gray-700">
            <a
              href="/pages/categories"
              class="flex items-center justify-between py-0 px-4 h-10 mb-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
            >
              <div class="flex items-center gap-3 min-w-0 flex-1">
                <span class="w-5 h-5 flex-shrink-0 flex items-center justify-center" style="color: var(--mfr-sidebar-icon-color, #6b7280)">
                  ${ALL_CATEGORIES_ICON}
                </span>
                <span class="text-sm font-semibold truncate" style="color: var(--mfr-sidebar-heading-color, #111827)">
                  ${t('mfr.allCategories')}
                </span>
              </div>
              <svg class="w-4 h-4 flex-shrink-0 ml-2" style="color: var(--mfr-sidebar-chevron-color, #d1d5db)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </a>
          </li>
        </ul>
      </div>
    </div>
  `;
}

function sampleCard(dataVar: string, label: string): string {
  const SKELETON = `<div class="w-full h-full bg-gray-100 animate-pulse rounded"></div>`;
  return `
    <a :href="${dataVar} ? '/pages/product-detail.html?id=' + ${dataVar}.name : '/pages/products.html'" class="block w-[calc(50%-5.5px)] group">
      <div class="w-full h-[105px] overflow-hidden rounded flex items-center justify-center" style="background-color: var(--mfr-sample-img-bg, #f5f5f5)">
        <template x-if="${dataVar} && ${dataVar}.primary_image">
          <img :src="${dataVar}.primary_image" :alt="${dataVar}.title" class="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300" />
        </template>
        <template x-if="!${dataVar}">${SKELETON}</template>
      </div>
      <p class="w-full h-8 min-h-[32px] mt-1 text-sm leading-4 text-center overflow-hidden text-ellipsis" style="color: var(--mfr-sample-label-color, #666666)">${label}</p>
    </a>`;
}

function renderMiddleColumn(): string {
  return `
    <div class="flex-1 flex flex-col h-[400px]"
      x-data="{
        popular: null, newArrival: null, bestSeller: null, featured: null,
        async init() {
          const base = (window.API_BASE || '/api') + '/method/tradehub_core.api.listing.get_listings';
          const opts = { credentials: 'omit' };
          try {
            const [a, b, c, d] = await Promise.all([
              fetch(base + '?sort_by=view_count&sort_order=desc&page_size=1', opts).then(r => r.json()),
              fetch(base + '?is_new_arrival=true&page_size=1', opts).then(r => r.json()),
              fetch(base + '?is_best_seller=true&page_size=1', opts).then(r => r.json()),
              fetch(base + '?is_featured=true&page_size=1', opts).then(r => r.json()),
            ]);
            const first = (r) => (r.message?.data || [])[0] || null;
            this.popular = first(a);
            this.newArrival = first(b);
            this.bestSeller = first(c);
            this.featured = first(d);
          } catch(e) { console.error('Samples fetch failed', e); }
        }
      }"
    >
      <!-- Card A: Get samples -->
      <div class="h-[192px] mb-4 p-4" style="background-color: var(--mfr-hero-card-bg, #ffffff); border-radius: var(--mfr-hero-card-radius, 6px); box-shadow: var(--mfr-hero-card-shadow, 0 0 12px rgba(0,0,0,0.05))">
        <h3 class="text-lg font-bold leading-6 mb-2.5" style="color: var(--mfr-sample-heading-color, #222222)">${t('mfr.getSamples')}</h3>
        <div class="flex flex-wrap justify-between">
          ${sampleCard('popular', t('mfr.popularProducts'))}
          ${sampleCard('newArrival', t('mfr.newArrivals'))}
        </div>
      </div>

      <!-- Card B: Get samples (2) -->
      <div class="h-[192px] p-4" style="background-color: var(--mfr-hero-card-bg, #ffffff); border-radius: var(--mfr-hero-card-radius, 6px); box-shadow: var(--mfr-hero-card-shadow, 0 0 12px rgba(0,0,0,0.05))">
        <h3 class="text-lg font-bold leading-6 mb-2.5" style="color: var(--mfr-sample-heading-color, #222222)">${t('mfr.getSamples')}</h3>
        <div class="flex flex-wrap justify-between">
          ${sampleCard('bestSeller', t('mfr.bestSellers'))}
          ${sampleCard('featured', t('mfr.campaigns'))}
        </div>
      </div>
    </div>
  `;
}

function renderTopRankingColumn(): string {
  return `
    <div class="top-ranking flex-1 h-[400px] p-4" style="background-color: var(--mfr-hero-card-bg, #ffffff); border-radius: var(--mfr-hero-card-radius, 6px); box-shadow: var(--mfr-hero-card-shadow, 0 0 12px rgba(0,0,0,0.05))"
      x-data="{
        sellers: [],
        async init() {
          const api = (window.API_BASE || '/api') + '/method/tradehub_core.api.seller.get_sellers?page_size=4';
          try {
            const res = await fetch(api, { credentials: 'omit' }).then(r => r.json());
            this.sellers = res.message?.sellers || [];
          } catch(e) { console.error('Sellers fetch failed', e); }
        }
      }"
    >
      <h3 class="text-lg font-bold leading-6 mb-4" style="color: var(--mfr-ranking-heading-color, #222222)">${t('mfr.topRankedMfrs')}</h3>
      <div class="products flex flex-wrap justify-between">
        <!-- Loading skeleton -->
        <template x-if="sellers.length === 0">
          <div class="w-full grid grid-cols-2 gap-3">
            <template x-for="i in 4" :key="i"><div class="h-[140px] bg-gray-100 animate-pulse rounded"></div></template>
          </div>
        </template>

        <!-- Seller cards -->
        <template x-for="(seller, idx) in sellers.slice(0, 4)" :key="seller.seller_code">
          <a :href="'/pages/seller/seller-storefront.html?seller=' + seller.seller_code"
             class="block w-[calc(50%-5.5px)] h-[156px] mb-4 group">
            <div class="w-full h-[116px] rounded overflow-hidden flex items-center justify-center bg-gray-50">
              <template x-if="seller.logo">
                <img :src="seller.logo" :alt="seller.seller_name" class="max-w-full max-h-full w-[116px] h-[116px] object-contain group-hover:scale-105 transition-transform duration-300" />
              </template>
              <template x-if="!seller.logo && seller.product_images && seller.product_images.length > 0">
                <img :src="seller.product_images[0]" :alt="seller.seller_name" class="max-w-full max-h-full w-[116px] h-[116px] object-cover group-hover:scale-105 transition-transform duration-300" />
              </template>
              <template x-if="!seller.logo && (!seller.product_images || seller.product_images.length === 0)">
                <svg class="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
              </template>
            </div>
            <p class="w-full h-8 min-h-[32px] mt-1 text-sm leading-4 text-center overflow-hidden text-ellipsis" style="color: var(--mfr-ranking-label-color, #666666)" x-text="seller.seller_name"></p>
          </a>
        </template>
      </div>
    </div>
  `;
}

function renderProfileColumn(): string {
  const history = getBrowsingHistory();
  const thumbs = history.slice(0, 4);

  const historyHtml = thumbs.length > 0
    ? thumbs.map(h => `
        <a href="${h.href}" class="aspect-square rounded-md overflow-hidden group" title="${h.title || ''}">
          <img src="${h.image}" alt="${h.title || ''}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300">
        </a>`).join('')
    : `<p class="text-xs text-gray-400 col-span-4">${t('mfr.noHistory')}</p>`;

  return `
    <div class="flex-1 h-[400px] overflow-hidden flex flex-col" style="border-radius: var(--mfr-hero-card-radius, 6px)">

      <!-- Top card: user-info (Alpine — async session check) -->
      <div class="h-[268px] mb-4 py-3 px-4 flex flex-col" style="background-color: var(--mfr-hero-card-bg, #ffffff); border-radius: var(--mfr-hero-card-radius, 6px); box-shadow: var(--mfr-hero-card-shadow, 0 0 12px rgba(0,0,0,0.05))"
        x-data="{
          loggedIn: false,
          userName: 'Guest',
          async init() {
            const api = (window.API_BASE || '/api') + '/method/tradehub_core.api.v1.auth.get_session_user';
            try {
              const res = await fetch(api, { credentials: 'include' }).then(r => r.json());
              if (res.message?.logged_in && res.message.user) {
                this.loggedIn = true;
                this.userName = res.message.user.full_name || res.message.user.email;
              }
            } catch(e) {}
          }
        }"
      >
        <!-- Avatar row -->
        <div class="flex items-center h-[42px] mb-3">
          <div class="w-10 h-10 rounded-full border mr-3 flex items-center justify-center text-gray-400 flex-shrink-0" style="background-color: var(--mfr-profile-avatar-bg, #dddddd); border-color: var(--mfr-profile-avatar-bg, #dddddd)">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path></svg>
          </div>
          <div>
            <template x-if="loggedIn">
              <div>
                <span class="text-xs" style="color: var(--mfr-profile-text-color, #222222)">${t('mfr.welcome')}</span>
                <p class="text-base font-bold leading-6" style="color: var(--mfr-profile-text-color, #222222)" x-text="userName"></p>
              </div>
            </template>
            <template x-if="!loggedIn">
              <div>
                <span class="text-xs" style="color: var(--mfr-profile-text-color, #222222)">${t('mfr.welcome')}</span>
                <p class="text-base font-bold leading-6" style="color: var(--mfr-profile-text-color, #222222)">Guest</p>
              </div>
            </template>
          </div>
        </div>

        <!-- Logged-in: favorites stats -->
        <template x-if="loggedIn">
          <div class="flex items-center justify-center rounded-md p-3 mt-4 mb-4 bg-gray-50 border border-transparent">
            <div class="flex-1 text-center border-r border-gray-200">
              <div class="flex items-center justify-center gap-1.5">
                <span class="text-xl font-bold">0</span>
                <span class="text-xs text-left leading-tight text-gray-600">Favorite<br/>products</span>
              </div>
            </div>
            <div class="flex-1 text-center">
              <div class="flex items-center justify-center gap-1.5 ml-2">
                <span class="text-xl font-bold">0</span>
                <span class="text-xs text-left leading-tight text-gray-600">Favorite<br/>suppliers</span>
              </div>
            </div>
          </div>
        </template>

        <!-- Logged-out: sign in / register buttons -->
        <template x-if="!loggedIn">
          <div class="flex justify-between mt-6 mb-4">
            <a href="/pages/auth/login.html" class="w-[calc(50%-4px)] flex items-center justify-center rounded-full h-10 text-xs font-bold transition-colors" style="background-color: var(--mfr-profile-btn-bg, #cc9900); color: var(--mfr-profile-btn-text, #ffffff)">${t('auth.login.submit')}</a>
            <a href="/pages/auth/register.html" class="w-[calc(50%-4px)] flex items-center justify-center rounded-full h-10 text-xs font-bold transition-colors" style="background-color: var(--mfr-profile-btn-bg, #cc9900); color: var(--mfr-profile-btn-text, #ffffff)">${t('auth.register.freeSignUp')}</a>
          </div>
        </template>

        <!-- Browsing history from localStorage -->
        <div class="mt-auto">
          <p class="block text-base font-bold mb-2 leading-6" style="color: var(--mfr-profile-text-color, #222222)">${t('mfr.yourSearchHistory')}</p>
          <div class="grid grid-cols-4 gap-2">${historyHtml}</div>
        </div>
      </div>

      <!-- Bottom card: RFQ -->
      <div class="flex-1 py-3 px-4 flex flex-col items-center justify-center text-center" style="background-color: var(--mfr-hero-card-bg, #ffffff); border-radius: var(--mfr-hero-card-radius, 6px); box-shadow: var(--mfr-hero-card-shadow, 0 0 12px rgba(0,0,0,0.05))">
        <p class="text-xs font-semibold mb-4" style="color: var(--mfr-profile-rfq-text, #222222)">${t('mfr.oneRequestMultipleQuotes')}</p>
        <a href="/pages/dashboard/rfq.html" class="hover-expand-center w-full h-10 flex items-center justify-center border rounded-full text-xs font-bold transition-colors" style="background-color: var(--mfr-hero-card-bg, #ffffff); border-color: var(--mfr-profile-rfq-border, #222222); color: var(--mfr-profile-rfq-text, #222222)">
          ${t('mfr.rfqTitle')}
        </a>
      </div>

    </div>
  `;
}

export function initCategoryFlyout(): void {
  const sidebar = document.querySelector<HTMLElement>('[data-category-sidebar]');
  if (!sidebar) return;

  const categoryItems = Array.from(
    sidebar.querySelectorAll<HTMLElement>('[data-category-id]')
  );
  const flyoutPanels = Array.from(
    sidebar.querySelectorAll<HTMLElement>('[data-flyout-id]')
  );

  let hideTimeout: ReturnType<typeof setTimeout> | null = null;
  let activeFlyoutId: string | null = null;

  // -- helpers --

  const ACTIVE_FLYOUT = ['opacity-100', 'pointer-events-auto', 'translate-x-0'];
  const INACTIVE_FLYOUT = ['opacity-0', 'pointer-events-none', 'translate-x-2'];
  const ACTIVE_LI = ['bg-gray-50', 'dark:bg-gray-700/50'];

  function clearHideTimeout(): void {
    if (hideTimeout !== null) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
  }

  function deactivateAll(): void {
    flyoutPanels.forEach(panel => {
      panel.classList.remove(...ACTIVE_FLYOUT);
      panel.classList.add(...INACTIVE_FLYOUT);
    });
    categoryItems.forEach(li => li.classList.remove(...ACTIVE_LI));
    activeFlyoutId = null;
  }

  function activateFlyout(categoryId: string): void {
    flyoutPanels.forEach(panel => {
      if (panel.dataset.flyoutId === categoryId) {
        panel.classList.remove(...INACTIVE_FLYOUT);
        panel.classList.add(...ACTIVE_FLYOUT);
      } else {
        panel.classList.remove(...ACTIVE_FLYOUT);
        panel.classList.add(...INACTIVE_FLYOUT);
      }
    });
    categoryItems.forEach(li => {
      if (li.dataset.categoryId === categoryId) {
        li.classList.add(...ACTIVE_LI);
      } else {
        li.classList.remove(...ACTIVE_LI);
      }
    });
    activeFlyoutId = categoryId;
  }

  function scheduleHide(): void {
    hideTimeout = setTimeout(() => {
      deactivateAll();
    }, 150);
  }

  // -- category items: event delegation on sidebar --

  sidebar.addEventListener('mouseenter', (e: MouseEvent) => {
    const li = (e.target as HTMLElement).closest<HTMLElement>('[data-category-id]');
    if (!li) return;

    clearHideTimeout();
    const categoryId = li.dataset.categoryId ?? '';

    const hasFlyout = flyoutPanels.some(p => p.dataset.flyoutId === categoryId);
    if (hasFlyout && categoryId !== activeFlyoutId) {
      activateFlyout(categoryId);
    }
  }, true);

  // -- sidebar container: schedule hide when mouse fully leaves --

  sidebar.addEventListener('mouseleave', () => {
    scheduleHide();
  });

  // -- flyout panels: cancel hide while hovering, reschedule on leave --

  flyoutPanels.forEach(panel => {
    panel.addEventListener('mouseenter', () => {
      clearHideTimeout();
    });
    panel.addEventListener('mouseleave', () => {
      hideTimeout = setTimeout(() => {
        deactivateAll();
      }, 100);
    });
  });

  // -- "All categories" click --

  const allCategoriesLink = sidebar.querySelector<HTMLAnchorElement>('[data-all-categories]');
  allCategoriesLink?.addEventListener('click', (e: MouseEvent) => {
    e.preventDefault();
    window.location.href = '/categories';
  });
}
