/**
 * Global window augmentations.
 *
 * Storefront, Alpine modülleri ve helper'lar window üzerinde birkaç
 * property tutuyor. Bu dosya bunları tip-güvenli erişilebilir hale getirir.
 */
import type Alpine from "alpinejs";

declare global {
  interface Window {
    /** API base URL — `src/utils/api.ts` set ediyor, Alpine modülleri okur */
    API_BASE: string;

    /** Alpine global — `src/alpine/index.ts` set ediyor */
    Alpine: typeof Alpine;

    /** GTM dataLayer — `trackingManager.ts` push'lar yapıyor */
    dataLayer: Record<string, unknown>[];

    /** Manufacturer sayfası kategori ikonu helper'ı (manufacturers.ts) */
    __getCatIcon?: (iconClass: string, name: string) => string;

    /** Manufacturer sayfası son kategori slug'ları (manufacturers.ts) */
    __getRecentCategorySlugs?: () => string[];

    /** Merkezi kategori yükleyici köprüsü — Alpine inline init() için (manufacturers.ts) */
    __loadCategories?: () => Promise<
      import("../services/categoryService").ApiCategory[]
    >;

    /** Manufacturer filter sidebar init flag */
    __mfrFiltersInited?: boolean;

    /** Satıcı doğrulama rozeti i18n helper'ları — initVerificationHelpers() kurar */
    __verifiedByText?: (name: string) => string;
    __downloadReportText?: string;

    /** Favori satıcı listesi — ManufacturerList Alpine inline x-data helper'ları */
    __getSellerFavs?: () => string[];
    __isSellerFav?: (code: string) => boolean;
    __openSellerFavMenu?: (anchor: HTMLElement, seller: SellerCardSummary) => void;

    /** Ürün detay sayfası — variant değişiminden önceki orijinal listing görselleri */
    __originalListingImages?: import("./product").ProductImage[];
  }

  /**
   * Manufacturer/seller card'ından favori dropdown'una geçirilen özet veri.
   * Hem API response (snake_case) hem lokal favorite shape'i destekler.
   */
  interface SellerCardSummary {
    seller_code?: string;
    code?: string;
    seller_name?: string;
    name?: string;
    city?: string;
    country?: string;
    logo?: string;
    cover?: string;
    cover_image?: string;
    banner_image?: string;
    rating?: number;
    review_count?: number;
  }
}

export {};
