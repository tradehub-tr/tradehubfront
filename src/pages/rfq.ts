/**
 * RFQ (Request for Quote) Page — Entry Point
 * Renders all 5 sections: Hero, Form, Selected Products, Custom Products, Testimonials.
 */

import '../style.css'
import { t } from '../i18n'
import { initFlowbite } from 'flowbite'
import Swiper from 'swiper'
import { Autoplay, Pagination, EffectFade } from 'swiper/modules'
import 'swiper/swiper-bundle.css'
import { startAlpine } from '../alpine'
import { applySwiperDir } from '../utils/direction'

// Assets
import rfqVideoUrl from '../assets/images/rfqvidehero.mp4'

// Header & Footer components
import { TopBar, SubHeader, initStickyHeaderSearch, MegaMenu, initMegaMenu } from '../components/header'
import { mountChatPopup, initChatTriggers } from '../components/chat-popup'
import { initLanguageSelector } from '../components/header/TopBar'
import { FooterLinks } from '../components/footer'

// Floating components
import { BottomNav, initBottomNav } from '../components/floating'

// Shared components
import { Breadcrumb } from '../components/shared/Breadcrumb'

// Utilities
import { initAnimatedPlaceholder } from '../utils/animatedPlaceholder'

// API services
import { searchListings } from '../services/listingService'
import { initCurrency } from '../services/currencyService'

// Mock data (testimonials only)
import { getTestimonials } from '../data/rfq-mock-data'
const testimonials = getTestimonials();

// Types
import type { ProductListingCard } from '../types/productListing'
import { FILE_UPLOAD_CONFIG } from '../types/rfq'
import { renderDropzone, bindDropzone } from '../components/rfq/dropzone'
import { renderFileGrid, simulateStagingProgress } from '../components/rfq/file-list'
import type { FileProgress } from '../components/rfq/uploader'
import { requireAuth } from '../utils/auth-guard'
import { escapeHtml, sanitizeUrl } from '../utils/sanitize'

await requireAuth();

// --- Helper: Product Card HTML ---
function renderProductCard(product: ProductListingCard): string {
  return `
    <div class="rfq-search-card group overflow-hidden transition-shadow duration-200 hover:shadow-lg" data-product-id="${escapeHtml(product.id)}">
      <div class="aspect-square overflow-hidden bg-surface-raised">
        <img
          src="${escapeHtml(product.imageSrc ? sanitizeUrl(product.imageSrc, '') : '')}"
          alt="${escapeHtml(product.name)}"
          loading="lazy"
          class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          onerror="this.parentElement.classList.add('flex','items-center','justify-center','text-text-tertiary');this.style.display='none';"
        />
      </div>
      <div class="p-3 sm:p-4">
        <h3 class="my-1 mb-3 line-clamp-2 text-sm text-text-heading">${escapeHtml(product.name)}</h3>
        <a href="${escapeHtml(`/pages/dashboard/rfq-form.html?productId=${encodeURIComponent(product.id)}&productName=${encodeURIComponent(product.name)}`)}" class="inline-block text-sm text-text-heading underline transition-colors duration-200 hover:text-primary-600">${t('rfq.getQuote')}</a>
      </div>
    </div>
  `;
}

// --- Helper: Skeleton Card HTML ---
function renderSkeletonCard(): string {
  return `
    <div class="overflow-hidden rounded-lg border border-border-default bg-white">
      <div class="aspect-square animate-pulse bg-gray-200"></div>
      <div class="p-3 sm:p-4 space-y-2">
        <div class="h-4 w-3/4 animate-pulse rounded bg-gray-200"></div>
        <div class="h-4 w-1/2 animate-pulse rounded bg-gray-200"></div>
        <div class="h-3 w-1/3 animate-pulse rounded bg-gray-200 mt-2"></div>
      </div>
    </div>
  `;
}

const appEl = document.querySelector<HTMLDivElement>('#app')!;
appEl.classList.add('relative');
appEl.innerHTML = `
  <!-- Sticky Header (global) -->
  <div id="sticky-header" class="sticky top-0 z-(--z-header) border-b border-gray-200 bg-white">
    ${TopBar()}
    ${SubHeader()}
  </div>

  <!-- Mega Menu -->
  ${MegaMenu()}

  <!-- Main Content -->
  <main class="bg-(--color-surface-muted)">
    <div class="container-boxed pt-2 sm:pt-3">
      ${Breadcrumb([{ label: t('rfq.requestQuote') }])}
    </div>

    <!-- Section 1: Hero Banner -->
    <section id="rfq-hero" class="relative min-h-[240px] overflow-hidden bg-[linear-gradient(90deg,#231d68_0%,#262772_70%,#242570_71%,#24256b_100%)] sm:min-h-[320px] lg:min-h-[360px]" aria-label="${t('rfq.heroAriaLabel')}">
      <div class="pointer-events-none absolute inset-y-0 start-0 hidden w-[42%] bg-[linear-gradient(180deg,rgba(34,37,132,0.85)_0%,rgba(34,37,132,0)_100%)] xl:block"></div>

      <!-- Video Background -->
      <video src="${rfqVideoUrl}" autoplay loop muted playsinline class="pointer-events-none absolute end-0 top-1/2 z-0 hidden h-full w-full max-w-[664px] -translate-y-1/2 object-cover xl:block [object-position:center] [-webkit-mask-image:linear-gradient(to_right,transparent,black_15%)] [mask-image:linear-gradient(to_right,transparent,black_15%)]"></video>

      <div class="container-boxed relative z-10 flex min-h-[240px] items-center pt-8 pb-14 sm:min-h-[320px] sm:pt-10 sm:pb-16 lg:min-h-[360px] lg:py-12">
        <div class="w-full max-w-2xl text-center xl:text-start">
            <span class="inline-block rounded-full bg-primary-500 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">RFQ</span>
            <h1 class="mt-3 mb-2 text-2xl leading-tight font-bold text-white sm:mt-4 sm:text-4xl" data-i18n="rfq.createRfqTitle">
              ${t('rfq.createRfqTitle')}
            </h1>
            <p class="mx-auto max-w-xl text-sm text-white/85 sm:text-base xl:mx-0" data-i18n="rfq.createRfqDesc">
              ${t('rfq.createRfqDesc')}
            </p>
            <div class="mt-5 flex items-center justify-center xl:justify-start">
              <a href="#" class="inline-flex items-center gap-2 rounded-full border-2 border-white/60 px-5 py-2 text-sm font-medium text-white transition-[color,background-color,border-color] duration-200 hover:border-white hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#262772] sm:px-6 sm:py-2.5 sm:text-base">
                <span data-i18n="rfq.howItWorks">${t('rfq.howItWorks')}</span>
              </a>
            </div>
          </div>
      </div>
    </section>

    <!-- Section 2: RFQ Form Card (overlapping hero) -->
    <section id="rfq-form" class="relative z-20 mt-3 md:-mt-10" aria-label="${t('rfq.formAriaLabel')}">
      <div class="container-boxed">
        <div class="mx-auto w-full max-w-[1200px] rounded-md border border-border-default bg-white p-4 shadow-md sm:p-6 lg:p-7">
          <h2 class="mb-4 text-lg font-bold text-text-heading sm:mb-5 sm:text-xl" data-i18n="rfq.writeDetails">${t('rfq.writeDetails')}</h2>
          <form id="rfq-form-element" class="w-full" novalidate>
            <!-- Dropzone — file upload area -->
            <div>
              ${renderDropzone({ id: 'rfq-upload-area', inputId: 'rfq-file-input' })}
              <div id="rfq-file-list" class="mt-3 space-y-2"></div>
            </div>

            <!-- Message / details textarea — visually distinct from the dropzone -->
            <div class="mt-5">
              <label for="rfq-details" class="block text-sm font-semibold text-gray-800 mb-2">
                ${t('rfq.messageLabel')}
              </label>
              <textarea
                id="rfq-details"
                rows="4"
                class="w-full min-h-[110px] resize-none rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-colors"
                placeholder="${t('rfq.textareaPlaceholder')}"
              ></textarea>
            </div>
              
            <!-- Action Bar -->
            <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex flex-wrap items-center gap-3">
                <!-- Flowbite Tooltip -->
                <div id="upload-tooltip" role="tooltip" class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-xs opacity-0 tooltip dark:bg-gray-700">
                  ${t('rfq.maxFilesTooltip', { max: FILE_UPLOAD_CONFIG.maxFiles, formats: FILE_UPLOAD_CONFIG.allowedFormatsDisplay })}
                  <div class="tooltip-arrow" data-popper-arrow></div>
                </div>

              </div>

              <a href="/pages/dashboard/rfq-form.html" id="rfq-write-details-btn" class="th-btn w-full text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 sm:min-w-[260px] sm:w-auto">
                <span data-i18n="rfq.writeRfqDetails">${t('rfq.writeRfqDetails')}</span>
              </a>
            </div>
          </form>
        </div>
      </div>
    </section>

    <!-- Section 3: Selected Products -->
    <section id="rfq-selected-products" class="bg-(--color-surface-muted) py-8 sm:py-10 lg:py-12" aria-label="${t('rfq.selectedProducts')}">
      <div class="container-boxed">
        <h2 class="mb-4 text-lg font-bold text-text-heading sm:mb-6 sm:text-xl" data-i18n="rfq.selectedProducts">${t('rfq.selectedProducts')}</h2>
        <div id="selected-products-grid" class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5 xl:grid-cols-6">
          ${Array(6).fill(renderSkeletonCard()).join('')}
        </div>
      </div>
    </section>

    <!-- Section 4: Custom Products -->
    <section id="rfq-custom-products" class="bg-(--color-surface) py-8 sm:py-10 lg:py-12" aria-label="${t('rfq.customProducts')}">
      <div class="container-boxed">
        <h2 class="mb-4 text-lg font-bold text-text-heading sm:mb-6 sm:text-xl" data-i18n="rfq.customProducts">${t('rfq.customProducts')}</h2>
        <div id="custom-products-grid" class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5 xl:grid-cols-6">
          ${Array(12).fill(renderSkeletonCard()).join('')}
        </div>
      </div>
    </section>

    <!-- Section 5: Testimonials -->
    <section id="rfq-testimonials" class="bg-gradient-to-br from-[#1f1f1f] to-[#0a0a0a] py-10 sm:py-16 [&_.swiper-pagination-bullet]:!bg-white/40 [&_.swiper-pagination-bullet]:!opacity-100 [&_.swiper-pagination-bullet-active]:!bg-primary-500" aria-label="${t('rfq.customerTestimonials')}">
      <div class="container-boxed mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 class="mb-6 text-lg font-bold text-white sm:mb-8 sm:text-xl">${t('rfq.customerTestimonials')}</h2>
        <div class="swiper">
          <div class="swiper-wrapper">
            ${testimonials.map(item => `
              <div class="swiper-slide" data-testimonial-id="${item.id}">
                <blockquote class="text-center text-base leading-relaxed text-white italic sm:text-xl">
                  "${item.quote}"
                </blockquote>
                <div class="flex flex-col items-center mt-6">
                  <div class="h-16 w-16 overflow-hidden rounded-full border-[3px] border-white/30">
                    <img
                      src="${item.avatar || ''}"
                      alt="${item.name}"
                      loading="lazy"
                      class="h-full w-full object-cover"
                      onerror="this.style.display='none';"
                    />
                  </div>
                  <p class="font-bold text-white">${item.name}</p>
                  <p class="text-white/60 text-sm">${item.title}, ${item.company}</p>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="swiper-pagination mt-6"></div>
        </div>
      </div>
    </section>
  </main>

  <!-- Footer Section -->
  <footer class="pb-14 xl:pb-0">
    ${FooterLinks()}
  </footer>

  <!-- Bottom Navigation (mobile/tablet) -->
  ${BottomNav()}
`;

// --- Initialize Flowbite & Custom Behaviors ---
initMegaMenu();
initFlowbite();
initStickyHeaderSearch();
initBottomNav();
initLanguageSelector();
initAnimatedPlaceholder('#topbar-compact-search-input');

// Start Alpine.js (must be called AFTER innerHTML is set)
mountChatPopup();
initChatTriggers();
startAlpine();

// --- Initialize Swiper Testimonial Carousel ---
applySwiperDir('#rfq-testimonials .swiper')
new Swiper('#rfq-testimonials .swiper', {
  modules: [Autoplay, Pagination, EffectFade],
  effect: 'fade',
  fadeEffect: { crossFade: true },
  loop: true,
  autoplay: {
    delay: 5000,
    disableOnInteraction: false,
    pauseOnMouseEnter: true,
  },
  pagination: {
    el: '#rfq-testimonials .swiper-pagination',
    clickable: true,
  },
});

// --- Load Products from API ---
initCurrency().then(() => Promise.all([
  searchListings({ is_featured: true, page_size: 6 }),
  searchListings({ page_size: 36 }),
])).then(([featuredResult, customResult]) => {
  const selectedGrid = document.getElementById('selected-products-grid');
  const customGrid = document.getElementById('custom-products-grid');

  if (selectedGrid) {
    selectedGrid.innerHTML = featuredResult.products.length > 0
      ? featuredResult.products.map(p => renderProductCard(p)).join('')
      : `<p class="col-span-full text-sm text-text-tertiary">${t('rfq.noProducts')}</p>`;
  }

  if (customGrid) {
    customGrid.innerHTML = customResult.products.length > 0
      ? customResult.products.map(p => renderProductCard(p)).join('')
      : `<p class="col-span-full text-sm text-text-tertiary">${t('rfq.noProducts')}</p>`;
  }
}).catch(err => {
  console.warn('[RFQ] Failed to load products:', err);
  const selectedGrid = document.getElementById('selected-products-grid');
  const customGrid = document.getElementById('custom-products-grid');
  if (selectedGrid) selectedGrid.innerHTML = '';
  if (customGrid) customGrid.innerHTML = '';
});

// --- File Upload Handling (dropzone-driven) ---
const rfqFileList = document.getElementById('rfq-file-list')!;
const rfqSelectedFiles: File[] = [];
const rfqFileProgress = new Map<File, FileProgress>();

function addFilesRfq(files: File[]) {
  rfqSelectedFiles.push(...files);
  renderRfqFileList();
  files.forEach((f) =>
    simulateStagingProgress(rfqSelectedFiles, f, 'rfq-step1-preview', rfqFileProgress, renderRfqFileList),
  );
}

function renderRfqFileList() {
  renderFileGrid(rfqFileList, {
    files: rfqSelectedFiles,
    progress: rfqFileProgress,
    lightboxScope: 'rfq-step1-preview',
  });
}

bindDropzone(
  { id: 'rfq-upload-area', inputId: 'rfq-file-input' },
  {
    getCurrentFiles: () => rfqSelectedFiles,
    onAdd: addFilesRfq,
  },
);

// --- IndexedDB helpers for transferring files between pages ---
function openFilesDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('rfq_files', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('files');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function storeFilesToDB(files: File[]) {
  if (!files.length) return;
  const db = await openFilesDB();
  const tx = db.transaction('files', 'readwrite');
  const store = tx.objectStore('files');
  store.clear();
  files.forEach((f, i) => store.put(f, i));
  return new Promise<void>((resolve) => { tx.oncomplete = () => { db.close(); resolve(); }; });
}

// --- Form: "RFQ detaylarını yaz" navigates to rfq-form.html ---
const form = document.getElementById('rfq-form-element') as HTMLFormElement;
const textarea = document.getElementById('rfq-details') as HTMLTextAreaElement;
const writeBtn = document.getElementById('rfq-write-details-btn') as HTMLAnchorElement;

async function navigateToForm() {
  const details = textarea?.value.trim() || '';
  // Store files to IndexedDB so rfq-form.html can retrieve them
  await storeFilesToDB(rfqSelectedFiles);
  const params = new URLSearchParams();
  if (details) params.set('details', details);
  if (rfqSelectedFiles.length) params.set('hasFiles', '1');
  window.location.href = `/pages/dashboard/rfq-form.html?${params}`;
}

if (writeBtn) {
  writeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    navigateToForm();
  });
}

form?.addEventListener('submit', (e) => {
  e.preventDefault();
  navigateToForm();
});
