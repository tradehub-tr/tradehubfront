import Alpine from "alpinejs";
import { t } from "../i18n";
import {
  filterAndSortReviews,
  renderReviewCard,
  bindHelpfulButtons,
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
} from "../components/product/ProductImageGallery";
import { toVideoEmbedHtml } from "../components/product/ProductVideoSection";

function renderInlineVideo(url: string): string {
  return `
    <div class="relative w-full h-full bg-black flex items-center justify-center" data-gallery-main-media="true">
      <div class="relative w-full h-full" style="max-height: 100%">
        ${toVideoEmbedHtml(url)}
      </div>
    </div>
  `;
}
import { getListingDetail } from "../services/listingService";
import type { ProductDetail } from "../types/product";

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
  packaging: "",
  rating: 0,
  reviewCount: 0,
  orderCount: "0",
  reviews: [],
  baseCurrency: "USD",
  supplier: {
    id: "",
    name: "",
    verified: false,
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
    return product;
  } catch (err) {
    console.warn("Failed to load product from API, using mock data:", err);
    return currentProduct;
  }
}

Alpine.data("loginModal", () => ({
  open: false,
  email: "",
  password: "",
  showPassword: false,
  loading: false,
  errorMsg: "",

  show() {
    this.open = true;
    this.errorMsg = "";
    document.body.style.overflow = "hidden";
  },

  close() {
    this.open = false;
    this.errorMsg = "";
    // Only restore body scroll if no other modal is open underneath
    // ReviewsModal now uses Alpine x-data with :data-open="open" instead of rv-modal-hidden class
    const reviewsModal = document.getElementById("rv-reviews-modal");
    const reviewsOpen = reviewsModal?.dataset.open === "true";
    if (!reviewsOpen) {
      document.body.style.overflow = "";
    }
  },

  async submit() {
    if (this.loading) return;
    this.errorMsg = "";
    const email = (this.email || "").trim();
    const password = this.password || "";
    if (!email || !password) {
      this.errorMsg = t("auth.login.invalidCredentials");
      return;
    }
    this.loading = true;
    try {
      const { login, invalidateAuthCache, waitForAuth } = await import("../utils/auth");
      await login(email, password);
      invalidateAuthCache();
      await waitForAuth();
      window.dispatchEvent(new CustomEvent("login-success"));
      this.email = "";
      this.password = "";
      this.close();
    } catch (err) {
      if (err instanceof Error && err.message === "2FA_REQUIRED") {
        this.errorMsg = t("auth.login.2faRequired");
      } else if (err instanceof Error && err.message === "ACCOUNT_DISABLED") {
        this.errorMsg = t("auth.login.accountDisabled");
      } else {
        this.errorMsg = t("auth.login.invalidCredentials");
      }
    } finally {
      this.loading = false;
    }
  },
}));

Alpine.data("reviewsModal", () => ({
  open: false,
  filterType: "all" as "all" | "photo",
  ratingFilter: "all" as "all" | number,
  mentionFilter: null as string | null,
  sortBy: "relevant" as SortMode,
  ratingOpen: false,
  sortOpen: false,

  show() {
    this.open = true;
    document.body.style.overflow = "hidden";
  },

  close() {
    this.open = false;
    document.body.style.overflow = "";
  },

  ratingLabel(): string {
    return this.ratingFilter === "all"
      ? t("reviews.rating")
      : t("reviews.stars", { count: this.ratingFilter });
  },

  sortLabel(): string {
    return SORT_LABELS[this.sortBy as SortMode];
  },

  setFilter(type: "all" | "photo") {
    this.filterType = type;
    this.renderReviews();
  },

  setRating(rating: string) {
    this.ratingFilter = rating === "all" ? "all" : parseInt(rating, 10);
    this.ratingOpen = false;
    this.renderReviews();
  },

  setSort(sort: string) {
    if (sort in SORT_LABELS) {
      this.sortBy = sort as SortMode;
    }
    this.sortOpen = false;
    this.renderReviews();
  },

  toggleMention(label: string) {
    if (this.mentionFilter === label) {
      this.mentionFilter = null;
    } else {
      this.mentionFilter = label;
    }
    this.renderReviews();
  },

  renderReviews() {
    const container = (this.$refs as Record<string, HTMLElement>).reviewsList;
    if (!container) return;

    const state: ReviewFilterState = {
      filterType: this.filterType as "all" | "photo",
      ratingFilter: this.ratingFilter as "all" | number,
      mentionFilter: this.mentionFilter as string | null,
      sortBy: this.sortBy as SortMode,
    };

    const filtered = filterAndSortReviews(state);

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px 0; color: var(--pd-rating-text-color, #6b7280); font-size: 14px;">
          ${t("reviews.noReviews")}
        </div>
      `;
    } else {
      container.innerHTML = filtered
        .map((r: Parameters<typeof renderReviewCard>[0]) => renderReviewCard(r, true))
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

Alpine.data("orderProtectionModal", () => ({
  open: false,
  triggerEl: null as HTMLElement | null,

  show() {
    // Save the element that triggered the modal for focus restoration
    this.triggerEl = document.activeElement as HTMLElement | null;
    this.open = true;
    document.body.style.overflow = "hidden";
    // Auto-focus close button after Alpine renders the modal
    setTimeout(() => {
      const closeBtn = (this.$refs as Record<string, HTMLElement>).closeBtn;
      closeBtn?.focus();
    }, 50);
  },

  close() {
    this.open = false;
    document.body.style.overflow = "";
    // Restore focus to the element that opened the modal
    this.triggerEl?.focus();
    this.triggerEl = null;
  },

  trapFocus(e: KeyboardEvent) {
    if (e.key !== "Tab") return;
    const el = this.$el as HTMLElement;
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  },
}));

Alpine.data("imageGallery", () => ({
  currentIndex: 0,
  lightboxIndex: 0,
  isLightboxOpen: false,
  isZooming: false,
  supportsHoverZoom: false,
  imageCount: currentProduct.images.length,
  totalSlides: currentProduct.images.length + 1,
  attrsIndex: currentProduct.images.length,

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
  },

  swapGalleryImages(imageUrls: string[], videoUrl?: string) {
    // Auto-detect video files by extension so uploaded .mp4/etc render as video.
    const isVideoFile = (url: string) => {
      if (!url) return false;
      if (/youtube\.com|youtu\.be|vimeo\.com/i.test(url)) return true;
      return /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(url);
    };

    // Mutate currentProduct.images so downstream reads see new values.
    const newImages: any[] = imageUrls.map((src, i) => ({
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
    currentProduct.images.push(...(newImages as any));

    const totalCount = newImages.length;
    this.imageCount = totalCount;
    this.totalSlides = totalCount + 1;
    this.attrsIndex = totalCount;

    // Re-render thumbnail strips + main image
    const thumbList = (this.$refs as Record<string, HTMLElement>).thumbList;
    if (thumbList) {
      thumbList
        .querySelectorAll<HTMLElement>(".gallery-thumb:not(.gallery-thumb-attrs)")
        .forEach((el) => el.remove());
      const attrThumb = thumbList.querySelector(".gallery-thumb-attrs");
      newImages.forEach((img, i) => {
        const thumb = document.createElement("div");
        thumb.className =
          "gallery-thumb" +
          (img.isVideo ? " gallery-thumb-video relative" : "") +
          (i === 0 ? " active" : "");
        thumb.setAttribute("data-index", String(i));
        if (img.isVideo) {
          thumb.innerHTML = `
            <div class="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
              <svg width="22" height="22" fill="#fff" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
            <span class="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[9px] font-bold px-1 rounded">VIDEO</span>
          `;
        } else {
          thumb.innerHTML = `<img src="${img.src}" alt="${img.alt}" class="gallery-media-asset gallery-media-asset--thumb" loading="lazy" />`;
        }
        thumb.addEventListener("click", () => this.goToSlide(i));
        thumb.addEventListener("mouseenter", () => this.goToSlide(i));
        if (attrThumb) thumbList.insertBefore(thumb, attrThumb);
        else thumbList.appendChild(thumb);
      });
    }

    // Lightbox thumbs (include video)
    const lbThumbList = (this.$refs as Record<string, HTMLElement>).lightboxThumbList;
    if (lbThumbList) {
      lbThumbList.innerHTML = newImages
        .map((img, i) => {
          if (img.isVideo) {
            return `
            <button type="button" class="gallery-lightbox-thumb relative ${i === 0 ? "active" : ""}" data-index="${i}">
              <div class="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                <svg width="22" height="22" fill="#fff" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </div>
              <span class="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[9px] font-bold px-1 rounded">VIDEO</span>
            </button>
          `;
          }
          return `
          <button type="button" class="gallery-lightbox-thumb ${i === 0 ? "active" : ""}" data-index="${i}">
            <img src="${img.src}" alt="${img.alt}" class="gallery-media-asset gallery-media-asset--thumb" loading="lazy" />
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
        mainImage.innerHTML = renderInlineVideo(first.src);
      } else {
        mainImage.innerHTML = `<img src="${first.src}" alt="Variant" data-gallery-main-media="true" class="gallery-media-asset gallery-media-asset--large" />`;
      }
      this.resetZoom();
    }
  },

  restoreOriginalImages() {
    const originals = (window as any).__originalListingImages;
    if (!originals || originals.length === 0) return;
    const urls = originals.map((img: any) => img.src).filter(Boolean);
    if (urls.length === 0) return;
    // Restore without adding variant video — use listing's own video if present
    const listingVideo = originals.find((img: any) => img.isVideo);
    this.swapGalleryImages(
      urls.filter((u: string) => !originals.find((im: any) => im.src === u && im.isVideo)),
      listingVideo?.src || undefined
    );
  },

  isVideoSlide(): boolean {
    const img = currentProduct.images[this.currentIndex];
    return !!(img && (img as any).isVideo);
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

    if (thumbTop < listTop) {
      thumbList.scrollTo({ top: thumbTop, behavior: "smooth" });
    } else if (thumbTop + thumbHeight > listTop + listHeight) {
      thumbList.scrollTo({ top: thumbTop + thumbHeight - listHeight, behavior: "smooth" });
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

    const isAttrs = index === this.attrsIndex;

    // Toggle attributes card visibility (ProductAttributes renders its own HTML with id)
    const attrCard = document.getElementById("pd-attributes-card");
    attrCard?.classList.toggle("hidden", !isAttrs);

    // Update main image content when showing a photo/video slide
    if (!isAttrs) {
      const mainImage = (this.$refs as Record<string, HTMLElement>).mainImage;
      if (mainImage) {
        const image = currentProduct.images[index];
        if (image && (image as any).isVideo) {
          mainImage.innerHTML = renderInlineVideo(image.src);
          this.resetZoom();
        } else {
          mainImage.innerHTML = renderGalleryMedia(
            image?.src,
            image?.alt ?? `Product view ${index + 1}`,
            defaultVisual,
            "large"
          );
          this.resetZoom();
        }
      }
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
    activeThumb?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  },

  setLightboxSlide(index: number) {
    if (this.imageCount === 0) return;

    if (index < 0) index = this.imageCount - 1;
    if (index >= this.imageCount) index = 0;
    this.lightboxIndex = index;

    const lightboxImage = (this.$refs as Record<string, HTMLElement>).lightboxImage;
    if (lightboxImage) {
      const image = currentProduct.images[index];
      if (image && (image as any).isVideo) {
        lightboxImage.innerHTML = renderInlineVideo(image.src);
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
    thumbList.scrollBy({ top: direction * scrollAmount, behavior: "smooth" });
  },

  scrollLightboxThumbs(direction: number) {
    const lightboxThumbList = (this.$refs as Record<string, HTMLElement>).lightboxThumbList;
    if (!lightboxThumbList) return;
    const scrollAmount = LIGHTBOX_THUMB_SIZE + LIGHTBOX_THUMB_GAP;
    lightboxThumbList.scrollBy({ top: direction * scrollAmount, behavior: "smooth" });
  },
}));
