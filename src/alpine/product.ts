import Alpine from "alpinejs";
import { t } from "../i18n";
import {
  filterAndSortReviews,
  renderReviewCard,
  bindHelpfulButtons,
  displayRating,
  emptyListHtml,
  SORT_LABELS,
} from "../components/product/ProductReviews";
import type { ReviewFilterState, SortMode } from "../components/product/ProductReviews";
import {
  renderGalleryMedia,
  defaultVisual,
  ZOOM_SCALE,
  THUMB_SIZE,
  THUMB_GAP,
  LIGHTBOX_THUMB_SIZE,
  LIGHTBOX_THUMB_GAP,
  THUMB_CLASS,
  THUMB_VIDEO_CLASS,
  LIGHTBOX_THUMB_CLASS,
  LIGHTBOX_THUMB_VIDEO_CLASS,
} from "../components/product/ProductImageGallery";
import { toVideoEmbedHtml } from "../components/product/ProductVideoSection";

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function renderInlineVideo(url: string, poster = ""): string {
  return `
    <div class="relative w-full h-full bg-black flex items-center justify-center" data-gallery-main-media="true">
      <div class="relative w-full h-full" style="max-height: 100%">
        ${toVideoEmbedHtml(url, true, poster)}
      </div>
    </div>
  `;
}
import { getListingDetail, getProductReviews } from "../services/listingService";
import type { ProductDetail, ProductImage, ProductReview } from "../types/product";

// Empty default product — no mock data
const emptyProduct: ProductDetail = {
  id: "",
  title: "",
  category: [],
  images: [],
  priceTiers: [],
  moq: 0,
  unit: "",
  leadTime: "",
  shipping: [],
  variants: [],
  specs: [],
  packagingSpecs: [],
  description: "",
  rating: 0,
  reviewCount: 0,
  orderCount: "0",
  reviews: [],
  baseCurrency: "USD",
  sellerKybVerified: false,
  supplier: {
    id: "",
    name: "",
    verified: false,
    country: "",
    yearsInBusiness: 0,
    responseTime: "",
    responseRate: "",
    onTimeDelivery: "",
    mainProducts: [],
    employees: "",
    annualRevenue: "",
    certifications: [],
  },
  faq: [],
  leadTimeRanges: [],
  customizationOptions: [],
  reviewCategoryRatings: [],
  storeReviewCount: 0,
  reviewMentionTags: [],
};

let currentProduct: ProductDetail = emptyProduct;

// Export for other modules
export function getCurrentProduct(): ProductDetail {
  return currentProduct;
}

// Load product from API and update state
export async function loadProduct(listingId: string): Promise<ProductDetail> {
  try {
    const product = await getListingDetail(listingId);
    currentProduct = product;
    // Dispatch event for components that need to re-render
    document.dispatchEvent(new CustomEvent("product-loaded", { detail: product }));
    // Yorumları arka planda yükle — slug değil Frappe name (product.id) gönder
    void loadProductReviews(product.id);
    window.dispatchEvent(new CustomEvent("product-loaded", { detail: product }));
    return product;
  } catch (err) {
    console.warn("Failed to load product from API, using mock data:", err);
    return currentProduct;
  }
}

/**
 * Storefront backend'inden yorumları çek ve mevcut product state'ini güncelle.
 * `product-reviews-loaded` event'i yayar.
 */
export async function loadProductReviews(listingId: string): Promise<void> {
  try {
    const data = await getProductReviews(listingId, { pageSize: 50 });
    currentProduct.reviews = data.reviews;
    // Yorum sayısı: backend summary'i sadece Approved sayar — bunu olduğu
    // gibi kullan (pending dahil edilmez).
    currentProduct.reviewCount = data.summary.review_count;
    // Ortalama puan: backend `rating` field'ı Int olduğu için 3.5 → 4'e
    // yuvarlanarak kaydedilir, gerçek değer kaybolur. Frontend'de Approved
    // yorumların aspect ortalamasından (varsa) gerçek puanı yeniden
    // hesaplıyoruz — böylece 3 + 4 + 3 + 4 = 14/4 = 3.5 olduğu gibi yansır.
    const approvedReviews = data.reviews.filter((r) => r.status === "Approved");
    const ratings = approvedReviews.map((r) => displayRating(r)).filter((v) => v > 0);
    const computedAvg = ratings.length ? ratings.reduce((s, v) => s + v, 0) / ratings.length : 0;
    currentProduct.rating =
      computedAvg || data.summary.weighted_rating || data.summary.average_rating || 0;
    currentProduct.storeReviewCount = data.total;
    document.dispatchEvent(
      new CustomEvent("product-reviews-loaded", {
        detail: { reviews: data.reviews, summary: data.summary, total: data.total },
      })
    );
  } catch (err) {
    console.warn("Yorumlar yüklenemedi:", err);
  }
}

// Faz 6 — Yeni storefront review modallarını kaydet (write review, abuse, Q&A)
import { registerWriteReviewModal } from "../components/product/WriteReviewModal";
import { registerEditReviewModal } from "../components/product/EditReviewModal";
import { registerReportAbuseModal } from "../components/product/ReportAbuseModal";
import { registerQAModal } from "../components/product/QAModal";
import { registerProductQA } from "../components/product/ProductQA";
registerWriteReviewModal();
registerEditReviewModal();
registerReportAbuseModal();
registerQAModal();
registerProductQA();

// loginModal → src/alpine/loginModal.ts'e taşındı (B-2: çapraz + self-contained).
// orderProtectionModal → src/alpine/orderProtectionModal.ts'e taşındı (yalnız checkout).

// Modalda kaydırdıkça yüklenen sayfa boyu — referans davranış: liste tek
// seferde değil, scroll dibe yaklaştıkça parça parça basılır (DOM sınırı).
const MODAL_PAGE_SIZE = 10;

Alpine.data("reviewsModal", () => ({
  open: false,
  /** Hangi sekmeden açıldı — başlığı ve kartlardaki ürün barını belirler. */
  mode: "store" as "product" | "store",
  filterType: "all" as "all" | "photo",
  ratingFilter: "all" as "all" | number,
  mentionFilter: null as string | null,
  sortBy: "relevant" as SortMode,
  ratingOpen: false,
  sortOpen: false,
  visibleCount: MODAL_PAGE_SIZE,
  titleText: "",
  /** refilter() ile tazelenen filtrelenmiş liste — scroll handler hesap yapmaz. */
  filtered: [] as ProductReview[],

  show(mode?: string) {
    this.mode = mode === "product" ? "product" : "store";
    // Başlık her açılışta güncel sayıyla kurulur. getCurrentProduct() Alpine
    // reaktifi DEĞİL — x-text'i method'a bağlamak, mode değişmeden yeniden
    // açılışta bayat sayı gösteriyordu; reaktif state'e yazmak bunu çözer.
    const p = getCurrentProduct();
    this.titleText =
      this.mode === "product"
        ? t("product.productReviewsTab", { count: String(p.reviewCount) })
        : t("product.storeReviewsTab", { count: String(p.storeReviewCount) });
    this.open = true;
    document.body.style.overflow = "hidden";
    // Sayfa ilk render'ında liste boş datayla basılmıştı — açılışta canlı
    // veriyle (ve mode'a uygun kartla) yeniden kur.
    this.refilter();
  },

  close() {
    this.open = false;
    document.body.style.overflow = "";
  },

  ratingLabel(): string {
    return this.ratingFilter === "all"
      ? t("product.ratingLabel")
      : `${this.ratingFilter} ${t("product.starSuffix")}`;
  },

  sortLabel(): string {
    return SORT_LABELS[this.sortBy as SortMode];
  },

  setFilter(type: "all" | "photo") {
    this.filterType = type;
    this.refilter();
  },

  setRating(rating: string) {
    // Referans davranış: seçili yıldıza tekrar tıklamak filtreyi kaldırır.
    const next = rating === "all" ? "all" : parseInt(rating, 10);
    this.ratingFilter = this.ratingFilter === next ? "all" : next;
    this.ratingOpen = false;
    this.refilter();
  },

  setSort(sort: string) {
    if (sort in SORT_LABELS) {
      this.sortBy = sort as SortMode;
    }
    this.sortOpen = false;
    this.refilter();
  },

  toggleMention(label: string) {
    if (this.mentionFilter === label) {
      this.mentionFilter = null;
    } else {
      this.mentionFilter = label;
    }
    this.refilter();
  },

  /** Filtre girdileri değişince listeyi bir kez hesapla, sayfalamayı sıfırla. */
  refilter() {
    const state: ReviewFilterState = {
      filterType: this.filterType as "all" | "photo",
      ratingFilter: this.ratingFilter as "all" | number,
      mentionFilter: this.mentionFilter as string | null,
      sortBy: this.sortBy as SortMode,
    };
    this.filtered = filterAndSortReviews(state);
    this.visibleCount = MODAL_PAGE_SIZE;
    this.renderReviews();
  },

  /** Modal gövdesi dibe yaklaşınca bir sayfa daha bas (kaydırdıkça yükleme). */
  onBodyScroll(event: Event) {
    const el = event.target as HTMLElement;
    if (el.scrollTop + el.clientHeight < el.scrollHeight - 300) return;
    if (this.visibleCount >= this.filtered.length) return;
    this.visibleCount += MODAL_PAGE_SIZE;
    this.renderReviews();
  },

  renderReviews() {
    const container = (this.$refs as Record<string, HTMLElement>).reviewsList;
    if (!container) return;

    const filtered = this.filtered;

    if (filtered.length === 0) {
      container.innerHTML = emptyListHtml(t("reviews.noReviews"));
    } else {
      container.innerHTML = filtered
        .slice(0, this.visibleCount)
        .map((r: Parameters<typeof renderReviewCard>[0]) =>
          renderReviewCard(r, this.mode === "store")
        )
        .join("");
    }
    bindHelpfulButtons(container);
  },

  init() {
    // Bind helpful buttons on the initially-rendered review cards
    const container = (this.$refs as Record<string, HTMLElement>).reviewsList;
    if (container) {
      bindHelpfulButtons(container);
    }
  },
}));

// NOT: "+N" taşma karosu ve ilk-4 sınırı 2026-07-28'de kaldırıldı. Artık tüm
// karolar şeritte duruyor; şerit ana görselin yüksekliğini aşmıyor (flex-1 +
// overflow-y-auto) ve fazlası kaydırma oklarıyla geziliyor — referans düzendeki
// davranışın aynısı.

Alpine.data("imageGallery", () => ({
  currentIndex: 0,
  lightboxIndex: 0,
  isLightboxOpen: false,
  isZooming: false,
  supportsHoverZoom: false,
  imageCount: currentProduct.images.length,
  // "Özellikler" slaydı kaldırıldığından (2026-07-28) slayt sayısı = görsel sayısı;
  // eskiden sona eklenen +1 o sekmeye aitti.
  totalSlides: currentProduct.images.length,

  init() {
    this.supportsHoverZoom = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    // Listen for mobile swipe navigation custom event
    document.addEventListener("gallery-go-to", ((e: CustomEvent) => {
      this.goToSlide(e.detail.index);
    }) as EventListener);

    // Listen for variant change — swap gallery images entirely
    document.addEventListener("product-variant-change", ((e: CustomEvent) => {
      const images = e.detail?.images as string[] | undefined;
      const videoUrl = e.detail?.videoUrl as string | undefined;
      const isDefault = e.detail?.isDefault as boolean | undefined;

      if (Array.isArray(images) && images.length > 0) {
        // Variant has its own images — swap to them
        this.swapGalleryImages(images, videoUrl);
      } else if (isDefault) {
        // Default variant without own images — restore listing's original images
        this.restoreOriginalImages();
      } else {
        // Non-default variant without images — restore originals (better than showing nothing)
        this.restoreOriginalImages();
      }
    }) as EventListener);

    // $refs.thumbList init anında henüz dolmamış olabilir — $nextTick ile tüm
    // alt ağaç hazır olunca kaydırma oklarının durumunu hesapla.
    this.$nextTick(() => this.updateThumbScrollButtons());
  },

  swapGalleryImages(imageUrls: string[], videoUrl?: string) {
    // Auto-detect video files by extension so uploaded .mp4/etc render as video.
    const isVideoFile = (url: string) => {
      if (!url) return false;
      if (/youtube\.com|youtu\.be|vimeo\.com/i.test(url)) return true;
      return /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(url);
    };

    // Mutate currentProduct.images so downstream reads see new values.
    const newImages: ProductImage[] = imageUrls.map((src, i) => ({
      id: `variant-img-${i + 1}`,
      src,
      alt: `Variant image ${i + 1}`,
      isVideo: isVideoFile(src),
    }));
    if (videoUrl && !newImages.some((im) => im.src === videoUrl)) {
      newImages.push({
        id: "variant-video",
        src: videoUrl,
        alt: "Variant video",
        isVideo: true,
      });
    }
    currentProduct.images.length = 0;
    currentProduct.images.push(...newImages);

    const totalCount = newImages.length;
    this.imageCount = totalCount;
    this.totalSlides = totalCount;

    // Re-render thumbnail strips + main image
    const thumbList = (this.$refs as Record<string, HTMLElement>).thumbList;
    if (thumbList) {
      thumbList
        .querySelectorAll<HTMLElement>(".gallery-thumb")
        .forEach((el) => el.remove());
      newImages.forEach((img, i) => {
        const thumb = document.createElement("div");
        // Sınıf listesi şablonla TEK KAYNAKTAN gelir; burada elle "gallery-thumb"
        // yazmak karoyu stilsiz bırakıyordu (bkz. ProductImageGallery.ts:THUMB_CLASS).
        thumb.className =
          (img.isVideo ? THUMB_VIDEO_CLASS : THUMB_CLASS) + (i === 0 ? " active" : "");
        thumb.setAttribute("data-index", String(i));
        if (img.isVideo) {
          thumb.innerHTML = `
            <div class="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
              <svg width="22" height="22" fill="#fff" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
            <span class="absolute bottom-0.5 end-0.5 bg-black/80 text-white text-[9px] font-bold px-1 rounded">VIDEO</span>
          `;
        } else {
          // Elle <img> yazma — boyut/oturma sınıfları renderGalleryMedia'da
          // (bkz. ProductImageGallery.ts:renderGalleryMedia yorumu).
          thumb.innerHTML = renderGalleryMedia(img.src, img.alt, defaultVisual, "thumb");
        }
        thumb.addEventListener("click", () => this.goToSlide(i));
        thumb.addEventListener("mouseenter", () => this.goToSlide(i));
        thumbList.appendChild(thumb);
      });
      // Yeni görsel seti — şeridi başa sar ve okların durumunu yeniden hesapla.
      thumbList.scrollTop = 0;
      this.updateThumbScrollButtons();
    }

    // Lightbox thumbs (include video)
    const lbThumbList = (this.$refs as Record<string, HTMLElement>).lightboxThumbList;
    if (lbThumbList) {
      lbThumbList.innerHTML = newImages
        .map((img, i) => {
          if (img.isVideo) {
            return `
            <button type="button" class="${LIGHTBOX_THUMB_VIDEO_CLASS}${i === 0 ? " active" : ""}" data-index="${i}">
              <div class="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                <svg width="22" height="22" fill="#fff" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </div>
              <span class="absolute bottom-0.5 end-0.5 bg-black/80 text-white text-[9px] font-bold px-1 rounded">VIDEO</span>
            </button>
          `;
          }
          return `
          <button type="button" class="${LIGHTBOX_THUMB_CLASS}${i === 0 ? " active" : ""}" data-index="${i}">
            ${renderGalleryMedia(img.src, img.alt, defaultVisual, "thumb")}
          </button>
        `;
        })
        .join("");
      lbThumbList.querySelectorAll<HTMLElement>(".gallery-lightbox-thumb").forEach((el, i) => {
        el.addEventListener("click", () => this.selectLightboxThumb(i));
      });
    }

    // Reset main view to first image/video
    this.currentIndex = 0;
    this.lightboxIndex = 0;
    const mainImage = (this.$refs as Record<string, HTMLElement>).mainImage;
    const first = newImages[0];
    if (mainImage && first) {
      if (first.isVideo) {
        mainImage.innerHTML = renderInlineVideo(first.src, first.poster || "");
      } else {
        mainImage.innerHTML = renderGalleryMedia(
          first.src,
          first.alt || "Ürün varyantı",
          defaultVisual,
          "large"
        );
      }
      this.resetZoom();
    }
  },

  restoreOriginalImages() {
    const originals = window.__originalListingImages;
    if (!originals || originals.length === 0) return;
    const urls = originals.map((img) => img.src).filter(Boolean);
    if (urls.length === 0) return;
    // Restore without adding variant video — use listing's own video if present
    const listingVideo = originals.find((img) => img.isVideo);
    this.swapGalleryImages(
      urls.filter((u) => !originals.find((im) => im.src === u && im.isVideo)),
      listingVideo?.src || undefined
    );
  },

  isVideoSlide(): boolean {
    const img = currentProduct.images[this.currentIndex];
    return !!(img && img.isVideo);
  },

  // currentProduct modül objesi Alpine-reaktif değil; reaktif bir alana dokunmak
  // varyant swap'inde (swapGalleryImages imageCount'u günceller) x-show'un
  // yeniden değerlenmesini sağlar — yoksa sekme videosuz varyantta asılı kalır.
  hasVideoSlide(): boolean {
    void this.imageCount;
    return currentProduct.images.some((img) => img.isVideo);
  },

  videoSlideIndex(): number {
    return currentProduct.images.findIndex((img) => img.isVideo);
  },

  getMainMedia(): HTMLElement | null {
    const mainImage = (this.$refs as Record<string, HTMLElement>).mainImage;
    return mainImage?.querySelector<HTMLElement>('[data-gallery-main-media="true"]') ?? null;
  },

  resetZoom() {
    const media = this.getMainMedia();
    if (!media) return;
    media.style.transformOrigin = "50% 50%";
    media.style.transform = "scale(1)";
    this.isZooming = false;
  },

  handleZoomMove(event: PointerEvent) {
    if (!this.supportsHoverZoom) return;
    if (event.pointerType && event.pointerType !== "mouse") return;
    // Hareket istemeyen kullanıcıda ölçek büyütme atlanır
    if (prefersReducedMotion()) return;

    const mainImage = (this.$refs as Record<string, HTMLElement>).mainImage;
    const media = this.getMainMedia();
    if (!media || !mainImage) return;

    const rect = mainImage.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const clampedX = Math.min(100, Math.max(0, x));
    const clampedY = Math.min(100, Math.max(0, y));

    media.style.transformOrigin = `${clampedX}% ${clampedY}%`;
    media.style.transform = `scale(${ZOOM_SCALE})`;
    this.isZooming = true;
  },

  scrollActiveThumbIntoView(index: number) {
    const thumbList = (this.$refs as Record<string, HTMLElement>).thumbList;
    if (!thumbList) return;
    const activeThumb = thumbList.children[index] as HTMLElement | undefined;
    if (!activeThumb) return;

    const listTop = thumbList.scrollTop;
    const listHeight = thumbList.clientHeight;
    const thumbTop = activeThumb.offsetTop;
    const thumbHeight = activeThumb.offsetHeight;

    const behavior = prefersReducedMotion() ? "auto" : "smooth";
    if (thumbTop < listTop) {
      thumbList.scrollTo({ top: thumbTop, behavior });
    } else if (thumbTop + thumbHeight > listTop + listHeight) {
      thumbList.scrollTo({ top: thumbTop + thumbHeight - listHeight, behavior });
    }
  },

  goToSlide(index: number) {
    if (index < 0) index = this.totalSlides - 1;
    if (index >= this.totalSlides) index = 0;
    this.currentIndex = index;

    // Dispatch event for mobile gallery sync
    document.dispatchEvent(
      new CustomEvent("gallery-slide-change", { detail: { index: this.currentIndex } })
    );

    // Ana görseli güncelle. ("Özellikler" slaydı 2026-07-28'de kaldırıldı —
    // artık her slayt bir görsel ya da video.)
    const mainImage = (this.$refs as Record<string, HTMLElement>).mainImage;
    if (mainImage) {
      const image = currentProduct.images[index];
      if (image && image.isVideo) {
        mainImage.innerHTML = renderInlineVideo(image.src, image.poster || "");
      } else {
        mainImage.innerHTML = renderGalleryMedia(
          image?.src,
          image?.alt ?? `Product view ${index + 1}`,
          defaultVisual,
          "large"
        );
      }
      this.resetZoom();
    }

    // Scroll the active thumbnail into view within the thumb list
    this.scrollActiveThumbIntoView(index);
  },

  syncLightboxThumbInView(index: number) {
    const lightboxThumbList = (this.$refs as Record<string, HTMLElement>).lightboxThumbList;
    if (!lightboxThumbList) return;
    const activeThumb = lightboxThumbList.querySelector<HTMLElement>(
      `.gallery-lightbox-thumb[data-index="${index}"]`
    );
    activeThumb?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  },

  setLightboxSlide(index: number) {
    if (this.imageCount === 0) return;

    if (index < 0) index = this.imageCount - 1;
    if (index >= this.imageCount) index = 0;
    this.lightboxIndex = index;

    const lightboxImage = (this.$refs as Record<string, HTMLElement>).lightboxImage;
    if (lightboxImage) {
      const image = currentProduct.images[index];
      if (image && image.isVideo) {
        lightboxImage.innerHTML = renderInlineVideo(image.src, image.poster || "");
      } else {
        lightboxImage.innerHTML = renderGalleryMedia(
          image?.src,
          image?.alt ?? `Product view ${index + 1}`,
          defaultVisual,
          "large"
        );
      }
    }

    this.syncLightboxThumbInView(index);
  },

  openLightbox(index: number) {
    if (this.imageCount === 0) return;
    this.setLightboxSlide(index);
    this.isLightboxOpen = true;
    document.body.classList.add("gallery-lightbox-open");
  },

  closeLightbox() {
    this.isLightboxOpen = false;
    document.body.classList.remove("gallery-lightbox-open");
  },

  lightboxPrev() {
    this.setLightboxSlide(this.lightboxIndex - 1);
    this.goToSlide(this.lightboxIndex);
  },

  lightboxNext() {
    this.setLightboxSlide(this.lightboxIndex + 1);
    this.goToSlide(this.lightboxIndex);
  },

  selectLightboxThumb(index: number) {
    this.setLightboxSlide(index);
    this.goToSlide(this.lightboxIndex);
  },

  scrollThumbs(direction: number) {
    const thumbList = (this.$refs as Record<string, HTMLElement>).thumbList;
    if (!thumbList) return;
    const scrollAmount = THUMB_SIZE + THUMB_GAP;
    thumbList.scrollBy({
      top: direction * scrollAmount,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
    // Yumuşak kaydırma bitiminde durumu tazele — scroll olayı da tetikler ama
    // hareket yoksa (uçta tıklama) olay gelmez, buton kilitli kalırdı.
    window.setTimeout(() => this.updateThumbScrollButtons(), 350);
  },

  /**
   * Kaydırma oklarını şeridin gerçek taşma durumuna göre aç/kapat.
   * Taşma yoksa ikisi de gizli; uçlardayken ilgili ok gizli (CSS: disabled:opacity-0).
   */
  updateThumbScrollButtons() {
    const thumbList = (this.$refs as Record<string, HTMLElement>).thumbList;
    const strip = document.getElementById("pd-thumb-strip");
    if (!thumbList || !strip) return;

    const overflows = thumbList.scrollHeight - thumbList.clientHeight > 1;
    const atTop = thumbList.scrollTop <= 1;
    const atBottom = thumbList.scrollTop + thumbList.clientHeight >= thumbList.scrollHeight - 1;

    const up = strip.querySelector<HTMLButtonElement>('[data-thumb-scroll="up"]');
    const down = strip.querySelector<HTMLButtonElement>('[data-thumb-scroll="down"]');
    if (up) up.disabled = !overflows || atTop;
    if (down) down.disabled = !overflows || atBottom;
  },

  scrollLightboxThumbs(direction: number) {
    const lightboxThumbList = (this.$refs as Record<string, HTMLElement>).lightboxThumbList;
    if (!lightboxThumbList) return;
    const scrollAmount = LIGHTBOX_THUMB_SIZE + LIGHTBOX_THUMB_GAP;
    lightboxThumbList.scrollBy({
      top: direction * scrollAmount,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  },
}));
