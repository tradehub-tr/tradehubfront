/**
 * Section Registry — Maps section types to their renderer components
 * Used by seller-shop page to dynamically render storefront sections
 */
export interface SectionConfig {
  type: string;
  order: number;
  enabled: boolean;
  settings?: Record<string, any>;
}

export interface LayoutConfig {
  sections: SectionConfig[];
  theme?: Record<string, any>;
}

type SectionRenderer = (settings: Record<string, any>) => string;

// ─── Hero Banner helpers ─────────────────────────────────────────────────────
interface HeroSlide {
  id?: string;
  image?: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  textPosition?: 'left' | 'center' | 'right';
  textColor?: 'white' | 'dark';
}

function escapeHtml(s: any): string {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(s: any): string {
  return escapeHtml(s);
}

function renderSlideOverlay(slide: HeroSlide): string {
  const hasContent = slide.title || slide.subtitle || slide.ctaText;
  if (!hasContent) return '';
  const justifyMap: Record<string, string> = { left: 'justify-start text-left', center: 'justify-center text-center', right: 'justify-end text-right' };
  const justify = justifyMap[slide.textPosition || 'left'] || justifyMap.left;
  const isWhite = (slide.textColor || 'white') === 'white';
  const textColor = isWhite ? 'text-white' : 'text-gray-900';
  const titleShadow = isWhite ? 'drop-shadow-lg' : '';
  const overlayBg = isWhite ? 'bg-gradient-to-r from-black/40 via-black/20 to-transparent' : 'bg-gradient-to-r from-white/40 via-white/20 to-transparent';
  return `
    <div class="absolute inset-0 flex items-center ${justify} ${overlayBg}">
      <div class="max-w-[1200px] mx-auto px-6 md:px-12 w-full ${textColor}">
        <div class="max-w-[600px] inline-block">
          ${slide.title ? `<h2 class="text-2xl md:text-4xl lg:text-5xl font-bold mb-2 ${titleShadow}">${escapeHtml(slide.title)}</h2>` : ''}
          ${slide.subtitle ? `<p class="text-sm md:text-lg lg:text-xl mb-4 ${titleShadow}">${escapeHtml(slide.subtitle)}</p>` : ''}
          ${slide.ctaText ? `<a href="${escapeAttr(slide.ctaLink || '#')}" class="inline-block px-5 md:px-7 py-2 md:py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-md transition-colors text-sm md:text-base">${escapeHtml(slide.ctaText)}</a>` : ''}
        </div>
      </div>
    </div>
  `;
}

function resolveImageUrl(url: string | undefined): string {
  if (!url) return '';
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:')) return url;
  // Relative path (/files/...) → Frappe backend base URL ekle
  const base = (import.meta as any).env?.VITE_API_BASE || '';
  // url zaten "/" ile basliyorsa iki kez / olmasin
  if (base && url.startsWith('/')) return base.replace(/\/$/, '') + url;
  return url;
}

function renderSlideImage(slide: HeroSlide, isStatic: boolean): string {
  const heightCls = 'w-full h-[180px] sm:h-[220px] md:h-[320px] lg:h-[400px] object-cover';
  const fallback = `this.style.display='none'; this.parentElement.style.background='linear-gradient(135deg, #1f1f1f, #cc9900)'; this.parentElement.style.minHeight='300px';`;
  const wrapper = isStatic ? 'block relative' : 'block relative w-full h-full';
  // CTA varsa link sarmalayalim, ama overlay icindeki CTA da link; cakismayi onlemek icin sadece overlay yoksa whole image link
  const hasOverlay = !!(slide.title || slide.subtitle || slide.ctaText);
  const link = !hasOverlay && slide.ctaLink ? slide.ctaLink : '';
  const resolvedSrc = resolveImageUrl(slide.image);
  const innerImg = `<img src="${escapeAttr(resolvedSrc)}" alt="${escapeAttr(slide.title || 'Banner')}" class="${heightCls}" onerror="${fallback}" />${renderSlideOverlay(slide)}`;
  return link
    ? `<a href="${escapeAttr(link)}" class="${wrapper}">${innerImg}</a>`
    : `<div class="${wrapper}">${innerImg}</div>`;
}

function renderHeroBanner(settings: Record<string, any>): string {
  const mode = (settings?.mode === 'static') ? 'static' : 'slider';
  const autoplay = settings?.autoplay !== false;
  const delay = Number(settings?.delay) || 5000;
  const bgColor = settings?.bgColor || '';
  const bgStyle = bgColor ? `style="background-color: ${escapeAttr(bgColor)};"` : '';

  // DEBUG: settings'in tam halini logla
  console.log('[Hero Banner RENDER]', {
    mode,
    autoplay,
    delay,
    slidesInSettings: settings?.slides,
    slidesType: typeof settings?.slides,
    slidesIsArray: Array.isArray(settings?.slides),
    slidesLength: Array.isArray(settings?.slides) ? settings.slides.length : 'N/A',
    fullSettings: settings,
  });

  const rawSlides: HeroSlide[] = Array.isArray(settings?.slides) && settings.slides.length > 0
    ? settings.slides
    : [
        { id: 'placeholder-1', image: 'https://picsum.photos/seed/hero1/1200/400', title: '', subtitle: '', ctaText: '', ctaLink: '' },
        { id: 'placeholder-2', image: 'https://picsum.photos/seed/hero2/1200/400', title: '', subtitle: '', ctaText: '', ctaLink: '' },
        { id: 'placeholder-3', image: 'https://picsum.photos/seed/hero3/1200/400', title: '', subtitle: '', ctaText: '', ctaLink: '' },
      ];

  console.log('[Hero Banner RENDER] rawSlides:', rawSlides.map((s, i) => ({
    index: i,
    hasImage: !!s?.image,
    image: s?.image,
    title: s?.title,
  })));

  // STATIC: ilk slayt, swiper yok
  if (mode === 'static') {
    const first = rawSlides[0];
    return `
      <section class="storefront-section" data-section="hero_banner" data-hero-mode="static">
        <div class="store-hero" ${bgStyle}>
          <div class="store-hero__static relative w-full overflow-hidden">
            ${renderSlideImage(first, true)}
          </div>
        </div>
      </section>
    `;
  }

  // SLIDER: Swiper kullan — sadece gercek gorseli olan slaytlari al
  const validSlides = rawSlides.filter((s) => s && s.image);
  const slidesToRender = validSlides.length > 0 ? validSlides : rawSlides;
  const slidesHtml = slidesToRender.map((slide) => `
    <div class="swiper-slide relative">
      ${renderSlideImage(slide, false)}
    </div>
  `).join('');

  // Coklu slayt varsa navigation oklari goster (swiper container ICINDE)
  const showNav = slidesToRender.length > 1;
  const navHtml = showNav ? `
    <button type="button" class="store-hero__prev absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-colors backdrop-blur-sm cursor-pointer" aria-label="Onceki">
      <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
    </button>
    <button type="button" class="store-hero__next absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-colors backdrop-blur-sm cursor-pointer" aria-label="Sonraki">
      <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
    </button>
  ` : '';

  // Eger kullanici slider sectiyse ama 0-1 valid slayt varsa konsola uyari (debug)
  if (typeof console !== 'undefined' && validSlides.length < 2) {
    console.info(`[Hero Banner] Slider modu aktif ama gecerli slayt sayisi: ${validSlides.length} (toplam: ${rawSlides.length}). Slider gecisi icin en az 2 gorselli slayt gerekir.`);
  }

  return `
    <section class="storefront-section" data-section="hero_banner" data-hero-mode="slider"
             data-hero-autoplay="${autoplay ? '1' : '0'}" data-hero-delay="${delay}"
             data-hero-slides="${slidesToRender.length}">
      <div class="store-hero" ${bgStyle}>
        <div class="store-hero__swiper swiper w-full relative overflow-hidden" style="min-height: 180px;">
          <div class="swiper-wrapper">
            ${slidesHtml}
          </div>
          ${navHtml}
          <div class="store-hero__pagination swiper-pagination absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10"></div>
        </div>
      </div>
    </section>
  `;
}

/**
 * Registry of available section types → renderer functions.
 * Each renderer receives the section's settings object and returns HTML string.
 */
const SECTION_RENDERERS: Record<string, SectionRenderer> = {
  hero_banner: (settings) => renderHeroBanner(settings),

  category_grid: (_settings) => {
    // CategoryGrid reads data from Alpine x-data context
    return `
      <section class="storefront-section" data-section="category_grid">
        <div class="max-w-[1200px] mx-auto px-4 lg:px-8 py-6">
          <template x-if="categories && categories.length > 0">
            <div>
              <h3 class="text-[18px] font-bold text-gray-900 mb-4 uppercase" x-text="sectionTitle('category_grid')"></h3>
              <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <template x-for="cat in categories" :key="cat.name">
                  <a :href="'#category-' + cat.name"
                     @click.prevent="filterByCategory(cat.name)"
                     class="relative rounded-md overflow-hidden bg-gray-100 aspect-[4/3] group">
                    <img x-show="cat.image" :src="cat.image" :alt="cat.category_name || cat.name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                      <span class="text-white text-[13px] font-bold" x-text="cat.category_name || cat.name"></span>
                    </div>
                  </a>
                </template>
              </div>
            </div>
          </template>
        </div>
      </section>
    `;
  },

  hot_products: (_settings) => {
    return `
      <section class="storefront-section" data-section="hot_products">
        <div class="max-w-[1200px] mx-auto px-4 lg:px-8 py-6">
          <template x-if="products && products.length > 0">
            <div>
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-[18px] font-bold text-gray-900 uppercase" x-text="sectionTitle('hot_products')"></h3>
                <div class="flex items-center gap-2">
                  <button @click="$refs.hotScroll.scrollBy({left: -280, behavior: 'smooth'})" class="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                    <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                  </button>
                  <button @click="$refs.hotScroll.scrollBy({left: 280, behavior: 'smooth'})" class="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                    <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                  </button>
                </div>
              </div>
              <!-- Scroll container -->
              <div x-ref="hotScroll" class="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory" style="scroll-behavior: smooth; -webkit-overflow-scrolling: touch;">
                <template x-for="p in products" :key="p.name">
                  <div class="shrink-0 snap-start" style="width: calc((100% - 36px) / 5); min-width: 160px; max-width: 220px;">
                    <a :href="'/pages/product-detail.html?id=' + encodeURIComponent(p.name)" class="block no-underline group">
                      <div class="relative rounded-md overflow-hidden border border-gray-200 bg-white aspect-square mb-2">
                        <img x-show="p.image || p.primary_image" :src="p.image || p.primary_image" :alt="p.product_name || p.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                      </div>
                      <div class="text-[13px] text-gray-700 line-clamp-2 leading-snug mb-1" x-text="p.product_name || p.title"></div>
                      <div class="text-[14px] font-bold text-gray-900" x-text="formatPrice(p)"></div>
                      <div class="text-[12px] text-gray-500" x-show="p.moq" x-text="'Min. ' + p.moq + ' ' + (p.moq_unit || 'Adet')"></div>
                    </a>
                  </div>
                </template>
              </div>
            </div>
          </template>
        </div>
      </section>
    `;
  },

  category_listing: (settings) => {
    const showSort = settings.showSort !== false;
    const viewModes = settings.viewModes || ['grid', 'list'];
    return `
      <section class="storefront-section" data-section="category_listing" id="shop-products">
        <div class="max-w-[1200px] mx-auto px-4 lg:px-8 py-6">
          <div class="flex gap-6">

            <!-- ══ SOL SIDEBAR: Kategoriler ══ -->
            <div class="hidden lg:block w-[220px] shrink-0">
              <!-- En Iyi Secimler -->
              <a href="#" @click.prevent="filterByCategory('')"
                 class="flex items-center gap-3 px-4 py-3 mb-4 rounded-md transition-colors"
                 :class="!activeCategory ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                 :style="!activeCategory ? 'background-color: var(--store-nav-bg)' : ''"
                 >
                <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/></svg>
                <span class="text-[14px] font-semibold">En Iyi Secimler</span>
              </a>

              <!-- Urun Kategorileri -->
              <div class="border-t border-gray-200 pt-4">
                <h4 class="text-[14px] font-bold text-gray-900 mb-3 px-1">Urun Kategorileri</h4>
                <div class="space-y-0.5">
                  <template x-for="cat in categories" :key="cat.name">
                    <a href="#" @click.prevent="filterByCategory(cat.name)"
                       class="flex items-center justify-between px-3 py-2 rounded-md text-[13px] transition-colors"
                       :class="activeCategory === cat.name ? 'font-semibold text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
                       :style="activeCategory === cat.name ? 'background-color: var(--store-nav-bg)' : ''"
                       >
                      <span x-text="cat.category_name || cat.name"></span>
                      <svg class="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                    </a>
                  </template>
                </div>
              </div>
            </div>

            <!-- ══ SAG: Urun Listesi ══ -->
            <div class="flex-1 min-w-0">
              <template x-if="products && products.length > 0">
                <div>
                  <!-- Baslik -->
                  <h3 class="text-[20px] font-bold text-gray-900 mb-4" x-text="activeCategoryName || 'Tum urunler'"></h3>

                  <!-- Toolbar: sort + view toggle -->
                  <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div class="flex items-center gap-2">
                      ${showSort ? `
                      <div class="relative" x-data="{ sortOpen: false }">
                        <button @click="sortOpen = !sortOpen" class="th-btn-outline flex items-center gap-1.5 text-[13px] px-4 py-1.5">
                          <span x-text="sortBy === 'default' ? 'Yeni' : sortBy === 'price_asc' ? 'Fiyat: Dusuk' : sortBy === 'price_desc' ? 'Fiyat: Yuksek' : sortBy === 'best_selling' ? 'Cok Satan' : 'En Yeni'">Yeni</span>
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                        </button>
                        <div x-show="sortOpen" @click.away="sortOpen = false" x-transition
                             class="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg min-w-[160px] py-1 z-20">
                          <button @click="sortBy = 'default'; sortProducts(); sortOpen = false" class="block w-full text-left px-4 py-2 text-[13px] hover:bg-gray-50" :class="sortBy === 'default' ? 'text-blue-600 font-medium' : 'text-gray-600'">Yeni</button>
                          <button @click="sortBy = 'best_selling'; sortProducts(); sortOpen = false" class="block w-full text-left px-4 py-2 text-[13px] hover:bg-gray-50" :class="sortBy === 'best_selling' ? 'text-blue-600 font-medium' : 'text-gray-600'">Cok Satan</button>
                          <button @click="sortBy = 'price_asc'; sortProducts(); sortOpen = false" class="block w-full text-left px-4 py-2 text-[13px] hover:bg-gray-50" :class="sortBy === 'price_asc' ? 'text-blue-600 font-medium' : 'text-gray-600'">Fiyat: Dusukten Yuksege</button>
                          <button @click="sortBy = 'price_desc'; sortProducts(); sortOpen = false" class="block w-full text-left px-4 py-2 text-[13px] hover:bg-gray-50" :class="sortBy === 'price_desc' ? 'text-blue-600 font-medium' : 'text-gray-600'">Fiyat: Yuksekten Dusuge</button>
                        </div>
                      </div>` : ''}
                    </div>
                    ${viewModes.length > 1 ? `
                    <div class="flex items-center gap-1">
                      <button @click="viewMode = 'list'" class="p-1.5 rounded" :class="viewMode === 'list' ? 'text-gray-800' : 'text-gray-400 hover:text-gray-600'">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/></svg>
                      </button>
                      <button @click="viewMode = 'grid'" class="p-1.5 rounded" :class="viewMode === 'grid' ? 'text-gray-800' : 'text-gray-400 hover:text-gray-600'">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 16 16"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>
                      </button>
                    </div>` : ''}
                  </div>

                  <!-- Grid View -->
                  <div x-show="viewMode === 'grid'" class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                    <template x-for="p in filteredProducts" :key="p.name">
                      <div class="bg-white rounded-md border border-gray-200 overflow-hidden group hover:shadow-md transition-shadow flex flex-col h-full">
                        <a :href="'/pages/product-detail.html?id=' + encodeURIComponent(p.name)" class="block no-underline flex-1">
                          <div class="aspect-square overflow-hidden bg-gray-50">
                            <img x-show="p.image || p.primary_image" :src="p.image || p.primary_image" :alt="p.product_name || p.title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                          </div>
                          <div class="p-3">
                            <div class="text-[13px] text-gray-700 line-clamp-2 leading-snug mb-2 min-h-[36px]" x-text="p.product_name || p.title"></div>
                            <div class="text-[15px] font-bold text-gray-900 mb-1" x-text="formatPrice(p)"></div>
                            <div class="text-[12px] text-gray-500" x-show="p.moq" x-text="'Min. Siparis: ' + p.moq + ' ' + (p.moq_unit || 'Adet')"></div>
                            <!-- sold_count > 0 ise "X satildi", yoksa "Y goruntuleme" — her zaman alt satir (backend'den view_count gelecek) -->
                            <div class="text-[11px] text-gray-400" x-show="p.sold_count" x-text="p.sold_count + ' satildi'"></div>
                            <div class="text-[11px] text-gray-400" x-show="!p.sold_count" x-text="(p.view_count || 0) + ' goruntuleme'"></div>
                          </div>
                        </a>
                        <div class="px-3 pb-3 mt-auto">
                          <button class="w-full border border-gray-200 text-[12px] font-medium text-gray-600 rounded-md py-1.5 hover:border-gray-400 hover:bg-gray-50 transition-colors">
                            Hemen sohbet et
                          </button>
                        </div>
                      </div>
                    </template>
                  </div>

                  <!-- List View -->
                  <div x-show="viewMode === 'list'" class="flex flex-col gap-3">
                    <template x-for="p in filteredProducts" :key="p.name">
                      <div class="flex items-center gap-4 p-4 border border-gray-200 rounded-md bg-white hover:shadow-sm transition-shadow">
                        <a :href="'/pages/product-detail.html?id=' + encodeURIComponent(p.name)" class="w-[120px] h-[120px] rounded-md overflow-hidden shrink-0 bg-gray-50">
                          <img x-show="p.image || p.primary_image" :src="p.image || p.primary_image" :alt="p.product_name || p.title" class="w-full h-full object-cover" loading="lazy" />
                        </a>
                        <div class="flex-1 min-w-0">
                          <a :href="'/pages/product-detail.html?id=' + encodeURIComponent(p.name)" class="text-[14px] text-gray-800 font-medium line-clamp-2 mb-2 hover:text-blue-600 no-underline" x-text="p.product_name || p.title"></a>
                          <div class="text-[16px] font-bold text-gray-900 mb-1" x-text="formatPrice(p)"></div>
                          <div class="text-[12px] text-gray-500" x-show="p.moq" x-text="'Min. Siparis: ' + p.moq + ' ' + (p.moq_unit || 'Adet')"></div>
                          <div class="text-[11px] text-gray-400" x-show="p.sold_count" x-text="p.sold_count + ' satildi'"></div>
                          <div class="text-[11px] text-gray-400 mb-2" x-show="!p.sold_count" x-text="(p.view_count || 0) + ' goruntuleme'"></div>
                          <button class="border border-gray-200 text-[12px] font-medium text-gray-600 rounded-md px-4 py-1.5 hover:border-gray-400 hover:bg-gray-50 transition-colors">
                            Hemen sohbet et
                          </button>
                        </div>
                      </div>
                    </template>
                  </div>
                </div>
              </template>

              <!-- Bos durum -->
              <div x-show="filteredProducts.length === 0 && !loading" class="text-center py-12">
                <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                <p class="text-[14px] text-gray-500">Bu kategoride urun bulunamadi.</p>
                <button @click="filterByCategory('')" class="mt-2 text-[13px] text-blue-600 hover:underline">Tum urunleri goster</button>
              </div>
            </div>

          </div>
        </div>
      </section>
    `;
  },

  company_info: (_settings) => {
    return `
      <section class="storefront-section" data-section="company_info">
        <div class="max-w-[1200px] mx-auto px-4 lg:px-8 py-6">
          <div class="bg-white rounded-md border border-gray-200 p-6">
            <h3 class="text-[18px] font-bold text-gray-900 mb-4" x-text="sectionTitle('company_info')"></h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-[14px]">
              <div class="flex justify-between py-2 border-b border-gray-50">
                <span class="text-gray-500">Is Tipi</span>
                <span class="text-gray-900 font-medium" x-text="seller?.business_type || '\u2014'"></span>
              </div>
              <div class="flex justify-between py-2 border-b border-gray-50">
                <span class="text-gray-500">Calisan Sayisi</span>
                <span class="text-gray-900 font-medium" x-text="seller?.staff_count || '\u2014'"></span>
              </div>
              <div class="flex justify-between py-2 border-b border-gray-50">
                <span class="text-gray-500">Yillik Gelir</span>
                <span class="text-gray-900 font-medium" x-text="seller?.annual_revenue || '\u2014'"></span>
              </div>
              <div class="flex justify-between py-2 border-b border-gray-50">
                <span class="text-gray-500">Ana Pazarlar</span>
                <span class="text-gray-900 font-medium" x-text="seller?.main_markets || '\u2014'"></span>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  },

  certificates: (_settings) => {
    return `
      <section class="storefront-section" data-section="certificates">
        <div class="max-w-[1200px] mx-auto px-4 lg:px-8 py-6">
          <h3 class="text-[18px] font-bold text-gray-900 mb-4" x-text="sectionTitle('certificates')"></h3>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <template x-for="cert in (seller?.certification_list || [])" :key="cert">
              <div class="bg-white border border-gray-200 rounded-md p-4 flex flex-col items-center text-center">
                <div class="w-full aspect-[3/4] bg-gray-50 rounded flex items-center justify-center mb-3">
                  <svg class="w-12 h-12 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                </div>
                <span class="text-[13px] font-bold text-gray-900" x-text="cert"></span>
              </div>
            </template>
          </div>
        </div>
      </section>
    `;
  },

  why_choose_us: (_settings) => {
    return `
      <section class="storefront-section" data-section="why_choose_us">
        <div class="max-w-[1200px] mx-auto px-4 lg:px-8 py-6">
          <h3 class="text-[18px] font-bold text-gray-900 mb-4" x-text="sectionTitle('why_choose_us')"></h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <template x-for="(adv, idx) in (seller?.advantages || [])" :key="idx">
              <div class="bg-white border border-gray-200 rounded-md p-5">
                <div class="w-10 h-10 bg-blue-50 rounded-md flex items-center justify-center mb-3">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                </div>
                <h4 class="text-[14px] font-bold text-gray-900 mb-1" x-text="adv.title"></h4>
                <p class="text-[13px] text-gray-500" x-text="adv.description"></p>
              </div>
            </template>
          </div>
        </div>
      </section>
    `;
  },

  gallery: (_settings) => {
    return `
      <section class="storefront-section" data-section="gallery">
        <div class="max-w-[1200px] mx-auto px-4 lg:px-8 py-6">
          <h3 class="text-[18px] font-bold text-gray-900 mb-4" x-text="sectionTitle('gallery')"></h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <template x-for="(photo, idx) in (seller?.gallery_images || [])" :key="idx">
              <div class="aspect-square rounded-md overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity">
                <img :src="photo.image || photo" :alt="photo.caption || 'Galeri'" class="w-full h-full object-cover" loading="lazy" />
              </div>
            </template>
          </div>
        </div>
      </section>
    `;
  },

  company_introduction: (_settings) => {
    return `
      <section class="storefront-section" data-section="company_introduction">
        <div class="max-w-[1200px] mx-auto px-4 lg:px-8 py-6">
          <div class="bg-white rounded-md border border-gray-200 p-6">
            <h3 class="text-[18px] font-bold text-gray-900 mb-4" x-text="sectionTitle('company_introduction')"></h3>
            <div class="text-[14px] text-gray-600 leading-relaxed" x-html="seller?.description || seller?.short_description || ''"></div>
          </div>
        </div>
      </section>
    `;
  },

  contact_form: (_settings) => {
    return `
      <section class="storefront-section" data-section="contact_form" id="shop-contact">
        <div class="max-w-[1200px] mx-auto px-4 lg:px-8 py-8">
          <div class="flex flex-col lg:flex-row gap-6">

            <!-- SOL: Iletisim Bilgileri -->
            <div class="flex-1 bg-white rounded-md border border-gray-200 p-6 lg:p-8">
              <h3 class="text-[20px] font-bold text-gray-900 mb-6">Iletisim Bilgileri</h3>

              <!-- Kisi Bilgisi -->
              <div class="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                <div class="w-[56px] h-[56px] rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                  <img x-show="seller?.logo" :src="seller?.logo" class="w-full h-full object-contain p-1" />
                  <svg x-show="!seller?.logo" class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0"/></svg>
                </div>
                <div>
                  <p class="text-[16px] font-bold text-gray-900" x-text="seller?.contact_person || seller?.seller_name || ''"></p>
                  <p class="text-[13px] text-gray-500" x-text="seller?.contact_title || 'Yetkili'"></p>
                </div>
              </div>

              <!-- Iletisim Detaylari Grid -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <!-- Telefon -->
                <div class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-gray-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/></svg>
                  <div>
                    <p class="text-[12px] text-gray-400 mb-0.5">Telefon:</p>
                    <a x-show="seller?.address?.phone || seller?.phone"
                       :href="'tel:' + (seller?.address?.phone || seller?.phone)"
                       class="text-[14px] text-blue-600 hover:underline"
                       x-text="((seller?.address?.phone_prefix || '') + ' ' + (seller?.address?.phone || seller?.phone || '')).trim()"></a>
                    <span x-show="!(seller?.address?.phone || seller?.phone)" class="text-[13px] text-gray-500">-</span>
                  </div>
                </div>

                <!-- E-posta -->
                <div class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-gray-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>
                  <div>
                    <p class="text-[12px] text-gray-400 mb-0.5">E-posta:</p>
                    <a x-show="seller?.email" :href="'mailto:' + seller?.email" class="text-[14px] text-blue-600 hover:underline break-all" x-text="seller?.email"></a>
                    <span x-show="!seller?.email" class="text-[13px] text-gray-500">-</span>
                  </div>
                </div>

                <!-- Website -->
                <div class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-gray-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"/></svg>
                  <div>
                    <p class="text-[12px] text-gray-400 mb-0.5">Sirket internet sitesi:</p>
                    <a x-show="seller?.website" :href="seller?.website" target="_blank" class="text-[14px] text-blue-600 hover:underline" x-text="seller?.website"></a>
                    <span x-show="!seller?.website" class="text-[13px] text-gray-500">-</span>
                  </div>
                </div>

                <!-- Firma -->
                <div class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-gray-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/></svg>
                  <div>
                    <p class="text-[12px] text-gray-400 mb-0.5">Firma:</p>
                    <p class="text-[14px] text-gray-800" x-text="seller?.address?.company || seller?.company_name || seller?.seller_name || '-'"></p>
                  </div>
                </div>
              </div>

              <!-- Adres -->
              <div x-show="seller?.address" class="mt-6 pt-6 border-t border-gray-100">
                <div class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-gray-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>
                  <div class="flex-1">
                    <p class="text-[12px] text-gray-400 mb-1">Adres:</p>
                    <p class="text-[14px] text-gray-800 leading-relaxed">
                      <span x-text="seller?.address?.street || ''"></span><template x-if="seller?.address?.apartment"><span>, <span x-text="seller.address.apartment"></span></span></template>
                    </p>
                    <p class="text-[13px] text-gray-600 mt-1">
                      <template x-if="seller?.address?.city"><span><span x-text="seller.address.city"></span> / </span></template>
                      <span x-text="seller?.address?.state || ''"></span>
                      <template x-if="seller?.address?.postal_code"><span> · <span x-text="seller.address.postal_code"></span></span></template>
                      <template x-if="seller?.address?.country"><span> · <span x-text="seller.address.country"></span></span></template>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- SAG: Tedarikçiye Ulasin Sidebar -->
            <div class="w-full lg:w-[280px] shrink-0">
              <div class="bg-white rounded-md border border-gray-200 p-5 sticky top-[54px]">
                <h4 class="text-[16px] font-bold text-gray-900 mb-4">Tedarikçiye Ulasin</h4>

                <!-- Sirket Mini Karti -->
                <div class="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
                  <div class="w-10 h-10 rounded-md border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                    <img x-show="seller?.logo" :src="seller?.logo" class="w-full h-full object-contain p-0.5" />
                  </div>
                  <p class="text-[13px] font-medium text-gray-800 line-clamp-2" x-text="seller?.seller_name || ''"></p>
                </div>

                <!-- CTA Butonlari -->
                <div class="space-y-2.5">
                  <button
                    class="w-full bg-(--btn-bg) hover:bg-(--btn-hover-bg) text-white text-[13px] font-semibold rounded-[var(--radius-button)] py-2.5 transition-colors"
                    @click="showInquiryModal = true">
                    Simdi iletisime gecin
                  </button>
                  <button
                    class="th-btn-outline w-full text-[13px] font-medium py-2.5"
                    @click="showInquiryModal = true">
                    Sorgu gonder
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    `;
  },
};

/**
 * Renders all enabled sections from a layout config, in order.
 * Applies per-section background color from settings.
 */
export function renderDynamicSections(layout: LayoutConfig): string {
  if (!layout?.sections?.length) return '';

  return layout.sections
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order)
    .map((section) => {
      const renderer = SECTION_RENDERERS[section.type];
      if (!renderer) return '';

      const bgStyle = section.settings?.bgColor
        ? `background-color: ${section.settings.bgColor}`
        : '';

      return `<div class="storefront-dynamic-section" data-section-type="${section.type}" style="${bgStyle}">${renderer(section.settings || {})}</div>`;
    })
    .join('');
}

/** Direct access to individual section renderers for page-based views */
export const SECTION_RENDERERS_REF = SECTION_RENDERERS;

/** List of all available section types with metadata for the admin editor */
export const SECTION_TYPES = [
  { type: 'hero_banner', label: 'Hero Banner', icon: 'fas fa-images' },
  { type: 'category_grid', label: 'Kategori Grid', icon: 'fas fa-th-large' },
  { type: 'hot_products', label: 'Populer Urunler', icon: 'fas fa-fire' },
  { type: 'category_listing', label: 'Urun Listeleme', icon: 'fas fa-list' },
  { type: 'company_info', label: 'Sirket Bilgisi', icon: 'fas fa-building' },
  { type: 'certificates', label: 'Sertifikalar', icon: 'fas fa-certificate' },
  { type: 'why_choose_us', label: 'Neden Biz', icon: 'fas fa-star' },
  { type: 'gallery', label: 'Galeri', icon: 'fas fa-photo-video' },
  { type: 'company_introduction', label: 'Sirket Tanitimi', icon: 'fas fa-info-circle' },
  { type: 'contact_form', label: 'Iletisim Formu', icon: 'fas fa-envelope' },
];
