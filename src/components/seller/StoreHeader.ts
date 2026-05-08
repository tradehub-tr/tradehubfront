/**
 * C1: Store Profile Header — iSTOC-style pixel-perfect layout
 * Two sections: Company Header (gray) + Stats & Media Card (white)
 */
import { t } from "../../i18n";

export function StoreHeader(): string {
  /* Reusable SVG: blue filled circle with white checkmark */
  const blueCheck = `<img src="/src/assets/images/verfied.png" alt="✓" class="shrink-0" style="width:13px;height:12px;" />`;

  /* Reusable SVG: info tooltip icon */
  const infoIcon = `
    <svg class="w-3.5 h-3.5 text-gray-400 shrink-0 cursor-help" viewBox="0 0 16 16" fill="currentColor">
      <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1"/>
      <text x="8" y="12" text-anchor="middle" font-size="10" fill="currentColor">i</text>
    </svg>`;

  /* Store icon for "Mağazayı ziyaret et" button */
  const storeIcon = `
    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"/>
    </svg>`;

  return `
    <section id="store-header" class="store-header" aria-label="${t("seller.sf.storeProfileHeader")}">

      <!-- ========== LOADING SKELETON ========== -->
      <div x-show="loading" class="bg-white">
        <div class="max-w-[1200px] mx-auto px-6 lg:px-10 py-6 animate-pulse">
          <div class="flex flex-col gap-4">
            <div class="h-7 bg-gray-200 rounded w-1/3"></div>
            <div class="h-4 bg-gray-200 rounded w-1/2"></div>
            <div class="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
          <div class="mt-8 flex flex-col lg:flex-row gap-8">
            <div class="flex-1 space-y-4">
              <div class="h-16 bg-gray-200 rounded w-1/3"></div>
              <div class="h-4 bg-gray-200 rounded w-full"></div>
              <div class="grid grid-cols-3 gap-4">
                <div class="h-16 bg-gray-200 rounded"></div>
                <div class="h-16 bg-gray-200 rounded"></div>
                <div class="h-16 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div class="lg:w-[500px] h-[300px] bg-gray-200 rounded-lg shrink-0"></div>
          </div>
        </div>
      </div>

      <!-- ========== WHITE CARD on GRAY BG ========== -->
      <div x-show="!loading" class="bg-[#f5f5f5]">
        <div class="max-w-[1200px] mx-auto px-4 lg:px-8 py-6">
          <div class="rounded-md shadow-sm overflow-hidden bg-white bg-[url('/images/verified.jpg')] bg-no-repeat bg-right-top [background-size:400px_100px] sm:[background-size:700px_180px] lg:[background-size:1200px_250px]">

            <!-- SECTION 1: Company Header -->
            <div class="relative px-4 py-6 sm:px-6 md:px-10 md:py-6 md:pb-10">

          <!-- CTA Buttons: absolute top-right on desktop -->
          <div class="hidden lg:flex items-center gap-3 absolute top-6 right-10">
            <a :href="'/pages/seller/seller-shop.html?seller=' + (seller?.seller_code || '')"
               class="inline-flex items-center gap-2 text-[14px] font-normal text-text-heading hover:text-(--btn-bg) transition-colors whitespace-nowrap"
               style="padding: 5px 5px 5px 25px;">
              ${storeIcon}
              ${t("seller.sf.viewStore")}
            </a>
            <button
              class="bg-(--btn-bg) hover:bg-(--btn-hover-bg) text-white text-[14px] font-semibold rounded-[var(--radius-button)] transition-colors whitespace-nowrap"
              style="width: 180px; height: 40px; padding: 0px 12px;"
              @click="setTab('contact')">
              ${t("seller.sf.contactNow")}
            </button>
          </div>

          <!-- Company name -->
          <h1 class="text-[28px] font-bold text-[#222] leading-tight mb-2 pr-0 lg:pr-96"
              x-text="seller?.seller_name || '\u2014'"></h1>

          <!-- Company info row: location · years · employees · main products -->
          <div class="text-[13px] text-[#999] mb-3 flex flex-wrap items-center gap-x-1 leading-5">
            <template x-if="sellerLocation">
              <span>
                <span x-text="sellerLocation"></span>
                <span class="mx-1">&middot;</span>
              </span>
            </template>
            <template x-if="sellerYears">
              <span>
                iSTOC'ta <span x-text="sellerYears"></span>
                <span class="mx-1">&middot;</span>
              </span>
            </template>
            <template x-if="seller?.staff_count">
              <span>
                <span x-text="seller.staff_count"></span> ${t("seller.sf.employees").replace("{{count}} ", "")}
                <span class="mx-1">&middot;</span>
              </span>
            </template>
            <template x-if="seller?.short_description || seller?.main_markets">
              <span>
                <span class="font-semibold text-[#333]">${t("seller.sf.mainProducts")}:</span>
                <span x-text="seller.short_description || seller.main_markets || '\u2014'"></span>
              </span>
            </template>
          </div>

          <!-- Badges row: Verified PRO + Manufacturer type + Best seller -->
          <div class="flex flex-wrap items-center gap-3">
            <!-- Verified badge -->
            <template x-if="seller?.verified">
              <span class="inline-flex items-center gap-1">
                <img src="/src/assets/images/verifiedminilogo.png" alt="Verified" class="h-[14px] w-auto" />
                <template x-if="seller?.verification_type === 'PRO'">
                  <span class="bg-(--btn-bg) text-white text-[10px] font-bold rounded px-1 py-0.5 leading-none">PRO</span>
                </template>
              </span>
            </template>

            <!-- Manufacturer type -->
            <template x-if="seller?.business_type">
              <span class="inline-flex items-center gap-1.5 text-sm text-[#333]">
                <span class="font-medium" x-text="seller.business_type_display || '${t("seller.sf.manufacturer")}'"></span>
                ${infoIcon}
              </span>
            </template>

            <!-- Best seller badge -->
            <template x-if="seller?.best_seller_rank">
              <a href="#" @click.prevent
                 class="inline-flex items-center gap-1 text-sm text-[#222] border-b border-[#222] pb-0.5 hover:text-[#cc9900] hover:border-[#cc9900] transition-colors">
                <span x-text="'#' + seller.best_seller_rank + ' best seller in ' + (seller.best_seller_category || '')"></span>
              </a>
            </template>
          </div>


            </div>

            <!-- Mobile CTA buttons — stacked below header -->
            <div class="flex flex-col lg:hidden gap-2 px-4 py-3 sm:px-6">
              <a :href="'/pages/seller/seller-shop.html?seller=' + (seller?.seller_code || '')"
                 class="w-full inline-flex items-center justify-center gap-1.5 py-2.5 border-(length:--btn-outline-border-width) border-(--btn-outline-border-color) rounded-[var(--radius-button)] bg-(--btn-outline-bg) text-[13px] font-medium text-(--btn-outline-text) hover:bg-(--btn-outline-hover-bg) hover:text-(--btn-outline-hover-text) transition-colors">
                ${storeIcon}
                ${t("seller.sf.viewStore")}
              </a>
              <button
                class="w-full py-2.5 bg-(--btn-bg) hover:bg-(--btn-hover-bg) text-white text-[13px] font-semibold rounded-[var(--radius-button)] transition-colors"
                @click="setTab('contact')">
                ${t("seller.sf.contactNow")}
              </button>
            </div>

            <!-- SECTION 2: Stats + Media Card -->
            <div class="px-4 sm:px-6 lg:px-10 py-6 lg:py-8 lg:pb-10">
              <div class="flex flex-col-reverse lg:flex-row gap-6 lg:gap-8">

            <!-- ─── LEFT SIDE: Stats & Capabilities ─── -->
            <div class="flex-1 min-w-0">

              <!-- Rating row -->
              <div class="flex items-baseline gap-2 pb-6 mb-6 border-b border-gray-100" style="min-height:65px;">
                <span class="text-[36px] sm:text-[48px] font-bold text-[#222] leading-none tracking-tight"
                      x-text="seller?.rating ? seller.rating.toFixed(1) : '\u2014'"></span>
                <span class="text-[16px] sm:text-[20px] text-[#999] font-normal">/5</span>
                <div class="ml-3 flex flex-col">
                  <span class="text-[13px] sm:text-[14px] font-bold text-[#222]">${t("seller.sf.satisfactory")}</span>
                  <template x-if="seller?.review_count">
                    <a href="#reviews"
                       @click.prevent="setTab('reviews')"
                       class="text-[12px] sm:text-[13px] text-[#cc9900] hover:underline leading-snug"
                       x-text="seller.review_count + ' ${t("seller.sf.reviews")}'"></a>
                  </template>
                </div>
              </div>

              <!-- 3-column stats row -->
              <div class="grid grid-cols-3 gap-3 sm:gap-6 mb-6">
                <div class="flex flex-col gap-1.5">
                  <span class="text-[11px] sm:text-[13px] text-[#999] leading-snug">${t("seller.sf.avgResponseTime")}</span>
                  <span class="text-[18px] sm:text-[24px] font-bold text-[#222] leading-none"
                        x-text="seller?.response_time ? ('\u2264' + seller.response_time) : '\u2014'"></span>
                </div>
                <div class="flex flex-col gap-1.5">
                  <span class="text-[11px] sm:text-[13px] text-[#999] leading-snug">${t("seller.sf.onTimeDeliveryRate")}</span>
                  <span class="text-[18px] sm:text-[24px] font-bold text-[#222] leading-none"
                        x-text="seller?.on_time_delivery ? (seller.on_time_delivery + '%') : '\u2014'"></span>
                </div>
                <div class="flex flex-col gap-1.5">
                  <span class="text-[11px] sm:text-[13px] text-[#999] leading-snug"
                        x-text="seller?.total_orders ? (seller.total_orders + ' ${t("seller.sf.orders")}') : '${t("seller.sf.orders")}'"></span>
                  <span class="text-[18px] sm:text-[24px] font-bold text-[#222] leading-none"
                        x-text="seller?.annual_revenue || '\u2014'"></span>
                </div>
              </div>

              <!-- Capabilities — API'den gelen sertifikalar/capabilities -->
              <template x-if="seller?.certifications || seller?.capabilities">
                <div>
                  <div class="border-t border-[#f0f0f0] mb-6"></div>
                  <div class="flex flex-col gap-2.5 mb-4"
                       x-data="{ items: (() => {
                         const raw = seller?.capabilities || seller?.certifications || '';
                         if (Array.isArray(raw)) return raw;
                         return raw.split(',').map((s) => s.trim()).filter(Boolean);
                       })() }">
                    <template x-for="(item, idx) in items.slice(0, 5)" :key="idx">
                      <div class="flex items-center gap-2">
                        ${blueCheck}
                        <span class="text-[13px] font-bold text-[#333]" x-text="item"></span>
                      </div>
                    </template>
                    <template x-if="items.length > 5">
                      <a href="#"
                         class="inline-flex items-center gap-1 text-[13px] text-[#cc9900] hover:underline font-medium mt-1"
                         @click.prevent>
                        <span x-text="'${t("seller.sf.viewAllCapabilities").replace("({{count}})", "")}(' + items.length + ')'"></span>
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                        </svg>
                      </a>
                    </template>
                  </div>
                </div>
              </template>
            </div>

            <!-- ─── VIDEO (mobile: 1st via flex-col-reverse, desktop: right) ─── -->
            <div class="w-full lg:w-[500px] shrink-0"
                 x-data="{
                   activeThumb: 0,
                   playing: false,
                   muted: true,
                   progress: 0,
                   currentTime: '00:00',
                   duration: '00:00',
                   activeItem: 0,
                   /**
                    * thumbs: outer sellerStorefront scope-undaki mediaGroups
                    * computed-una Alpine scope inheritance ile erisir. Outer-da
                    * mediaGroups getter-i seller.media_groups-a bagimli;
                    * boylece backend yanit gelince inner UI otomatik update olur.
                    */
                   get thumbs() { return this.mediaGroups || []; },
                   get currentTab() { return this.thumbs[this.activeThumb] || null; },
                   get current() {
                     if (!this.currentTab) return null;
                     return this.currentTab.items[this.activeItem] || this.currentTab.items[0] || null;
                   },
                   get isVideo() { return !!(this.current && this.current.media_type === 'video'); },
                   formatTime(s) {
                     const m = Math.floor(s / 60);
                     const sec = Math.floor(s % 60);
                     return String(m).padStart(2,'0') + ':' + String(sec).padStart(2,'0');
                   },
                   selectThumb(idx) {
                     this.pauseVideo();
                     this.activeThumb = idx;
                     this.activeItem = 0;
                     this.playing = false;
                     this.progress = 0;
                     this.currentTime = '00:00';
                   },
                   selectItem(idx) {
                     this.pauseVideo();
                     this.activeItem = idx;
                     this.playing = false;
                     this.progress = 0;
                     this.currentTime = '00:00';
                   },
                   pauseVideo() {
                     const v = this.$refs.headerVideo;
                     if (v && !v.paused) { v.pause(); }
                   },
                   togglePlay() {
                     const v = this.$refs.headerVideo;
                     if (!v) return;
                     if (v.paused) { v.play(); this.playing = true; }
                     else { v.pause(); this.playing = false; }
                   },
                   toggleMute() {
                     const v = this.$refs.headerVideo;
                     if (!v) return;
                     v.muted = !v.muted;
                     this.muted = v.muted;
                   },
                   seek(e) {
                     const v = this.$refs.headerVideo;
                     if (!v || !v.duration) return;
                     const rect = e.currentTarget.getBoundingClientRect();
                     v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration;
                   },
                   updateProgress() {
                     const v = this.$refs.headerVideo;
                     if (!v || !v.duration) return;
                     this.progress = (v.currentTime / v.duration) * 100;
                     this.currentTime = this.formatTime(v.currentTime);
                     this.duration = this.formatTime(v.duration);
                   },
                   fullscreen() {
                     const v = this.$refs.headerVideo;
                     if (v?.requestFullscreen) v.requestFullscreen();
                   },
                   canScrollLeft: false,
                   canScrollRight: true,
                   updateScrollArrows() {
                     const el = this.$refs.thumbScroll;
                     if (!el) return;
                     this.canScrollLeft = el.scrollLeft > 5;
                     this.canScrollRight = el.scrollLeft < (el.scrollWidth - el.clientWidth - 5);
                   },
                   scrollLeft() {
                     this.$refs.thumbScroll.scrollBy({left: -150, behavior: 'smooth'});
                     setTimeout(() => this.updateScrollArrows(), 350);
                   },
                   scrollRight() {
                     this.$refs.thumbScroll.scrollBy({left: 150, behavior: 'smooth'});
                     setTimeout(() => this.updateScrollArrows(), 350);
                   },
                 }">

              <!-- ══ MAIN MEDIA AREA ══ -->
              <div class="relative w-full rounded-sm overflow-hidden bg-gray-900 aspect-video">

                <!-- VIDEO -->
                <template x-if="current && isVideo">
                  <video x-ref="headerVideo"
                         :src="current.src"
                         :poster="current.poster || ''"
                         class="w-full h-full object-cover"
                         @timeupdate="updateProgress()"
                         @loadedmetadata="duration = formatTime($refs.headerVideo.duration)"
                         @ended="playing = false"
                         playsinline preload="metadata" muted>
                  </video>
                </template>

                <!-- IMAGE -->
                <template x-if="current && !isVideo">
                  <img :src="current.src" :alt="(currentTab && currentTab.label) || ''" class="w-full h-full object-cover" />
                </template>

                <!-- Center Play Button (video only, when paused) -->
                <template x-if="isVideo && !playing">
                  <button @click="togglePlay()"
                          class="absolute inset-0 flex items-center justify-center z-10">
                    <div class="w-14 h-14 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors">
                      <svg class="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </button>
                </template>

                <!-- "Verified" overlay top-left -->
                <div class="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/40 to-transparent pointer-events-none"></div>
                <span class="absolute top-3 left-4 text-white text-[18px] italic font-light tracking-wide drop-shadow-lg pointer-events-none">
                  ${t("seller.sf.verified")}
                </span>

                <!-- Video Controls Bar (video only) -->
                <template x-if="isVideo">
                  <div class="absolute bottom-0 inset-x-0 px-3 py-2.5 flex items-center gap-2"
                       style="background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 70%, transparent 100%);">
                    <!-- Play/Pause -->
                    <button @click="togglePlay()" class="text-white shrink-0">
                      <svg x-show="!playing" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      <svg x-show="playing" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>
                    </button>
                    <!-- Time -->
                    <span class="text-white text-[11px] font-mono shrink-0" x-text="currentTime"></span>
                    <!-- Progress -->
                    <div class="flex-1 h-[3px] bg-white/30 rounded-full cursor-pointer group relative" @click="seek($event)">
                      <div class="h-full bg-[#ff4500] rounded-full relative" :style="'width:'+progress+'%'">
                        <div class="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                    </div>
                    <!-- Duration -->
                    <span class="text-white text-[11px] font-mono shrink-0" x-text="duration"></span>
                    <!-- Volume -->
                    <button @click="toggleMute()" class="text-white shrink-0">
                      <svg x-show="!muted" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M6 9H4a1 1 0 00-1 1v4a1 1 0 001 1h2l4 4V5L6 9z"/></svg>
                      <svg x-show="muted" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707A1 1 0 0112 5.586v12.828a1 1 0 01-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/></svg>
                    </button>
                    <!-- Fullscreen -->
                    <button @click="fullscreen()" class="text-white shrink-0">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2M16 4h2a2 2 0 012 2v2M16 20h2a2 2 0 002-2v-2"/></svg>
                    </button>
                  </div>
                </template>
              </div>

              <!-- ══ TAB SEGMENT ROW — sadece 2+ kategori varsa ══ -->
              <div x-show="thumbs.length > 1" class="mt-3 flex items-center gap-1.5 flex-wrap">
                <template x-for="(thumb, idx) in thumbs" :key="thumb.id">
                  <button type="button" @click="selectThumb(idx)"
                          class="px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors border"
                          :class="activeThumb === idx
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'">
                    <span x-text="thumb.label"></span>
                    <span x-show="thumb.count > 1"
                          class="ml-1 text-[11px] opacity-70"
                          x-text="'(' + thumb.count + ')'"></span>
                  </button>
                </template>
              </div>

              <!-- ══ ITEM THUMBNAIL GRID — secili tab'da 2+ medya varsa ══ -->
              <div x-show="currentTab && currentTab.items.length > 1"
                   class="mt-3 grid gap-2"
                   :style="'grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));'">
                <template x-for="(item, iIdx) in (currentTab ? currentTab.items : [])" :key="iIdx">
                  <button type="button" @click="selectItem(iIdx)"
                          class="relative aspect-[4/3] rounded-md overflow-hidden bg-gray-100 transition-all border"
                          :class="activeItem === iIdx
                            ? 'border-gray-900 shadow-md'
                            : 'border-transparent opacity-80 hover:opacity-100 hover:border-gray-300'">
                    <!-- IMAGE item -->
                    <template x-if="item.media_type !== 'video'">
                      <img :src="item.src"
                           :alt="item.caption || ''"
                           class="w-full h-full object-cover" />
                    </template>

                    <!-- VIDEO item: poster varsa <img>, yoksa MP4'ten ilk frame'i
                         <video preload="metadata"> ile cek (browser native) -->
                    <template x-if="item.media_type === 'video' && item.poster">
                      <img :src="item.poster"
                           :alt="item.caption || ''"
                           class="w-full h-full object-cover" />
                    </template>
                    <template x-if="item.media_type === 'video' && !item.poster">
                      <video :src="item.src + '#t=0.5'"
                             muted playsinline preload="metadata"
                             class="w-full h-full object-cover pointer-events-none"></video>
                    </template>

                    <!-- video icon overlay -->
                    <template x-if="item.media_type === 'video'">
                      <div class="absolute inset-0 flex items-center justify-center bg-black/25 pointer-events-none">
                        <div class="w-7 h-7 rounded-full bg-black/60 flex items-center justify-center">
                          <svg class="w-3.5 h-3.5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                      </div>
                    </template>
                  </button>
                </template>
              </div>
            </div>

              </div>
            </div>

          </div><!-- /bg-white card -->
        </div>
      </div><!-- /bg-[#f5f5f5] -->

    </section>
  `;
}
