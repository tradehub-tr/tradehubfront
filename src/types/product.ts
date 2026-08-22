/**
 * Product Detail Page — TypeScript Interfaces
 * Types for product detail, supplier, reviews, and related data.
 */

import type { ServerSeoPayload } from "../seo/setPageMeta";

export interface ProductImage {
  id: string;
  src: string;
  alt: string;
  isVideo?: boolean;
  /** Video slaytları için kapak (API `videoPoster` — manifest posteri). */
  poster?: string;
  /** Gerçek intrinsic ölçüler (API `imageMeta`). Sabit 800×800 basmak
   *  tarayıcıya yanlış yer ayırttırıyordu — sayfa yüklenirken zıplıyordu
   *  (CLS). 0 ise nitelik BASILMAZ: yanlış ölçü, eksik ölçüden kötüdür. */
  width?: number;
  height?: number;
  /** Yükleme ipuçları (API `imageMeta`). İlk görsel LCP adayı: eager + high;
   *  gerisi lazy. Hepsine `high` vermek hiçbirine vermemekle aynı kapıya
   *  çıkar. */
  loading?: "eager" | "lazy";
  decoding?: "async" | "sync" | "auto";
  fetchpriority?: "high" | "low" | "auto" | "";
  /** Sayfada görünen kısa açıklama (`<figcaption>`). */
  caption?: string;
}

export interface PriceTier {
  minQty: number;
  maxQty: number | null;
  price: number;
  basePrice?: number;
  /** Pre-campaign price; only set when a discount is active. */
  originalPrice?: number;
  currency: string;
}

export interface SkuMatrixEntry {
  axis1: string;
  axis2: string;
  stock: number;
  price: number;
  available: boolean;
  sku: string;
  variantId: string;
  extraAxes?: Record<string, string>;
}

export interface ProductVariant {
  type: "color" | "size" | "material";
  /** Source axis name — used for skuMatrix/cart matching (never translated). */
  label: string;
  /** Translated axis name for DISPLAY only (falls back to label when absent). */
  displayLabel?: string;
  options: VariantOption[];
  skuMatrix?: SkuMatrixEntry[];
}

export interface VariantOption {
  id: string;
  /** Source value — used for matching/cart (never translated). */
  label: string;
  /** Translated value for DISPLAY only (falls back to label when absent). */
  displayLabel?: string;
  value: string;
  thumbnail?: string;
  available: boolean;
  price?: number;
  rawPrice?: number;
  priceAddon?: number;
  basePriceAddon?: number;
  /** Full image list for gallery swap when this variant is selected. */
  images?: string[];
  /** Optional promo video for this specific variant. */
  videoUrl?: string;
  /** Composed title to display (e.g. "Siyah Polo Yaka T-shirt"). */
  title?: string;
  /** SKU for cart / reporting. */
  sku?: string;
  /** True if this variant is the default (pre-selected on page load). */
  isDefault?: boolean;
}

export interface ProductSpec {
  key: string;
  value: string;
}

export interface ProductSpecGroup {
  code: string;
  label: string;
  items: { label: string; value: string }[];
}

export interface BrandInfo {
  code: string;
  name: string;
  slug: string;
  logo?: string;
  isApproved?: boolean;
}

export interface ProductReview {
  id: string;
  author: string;
  country: string;
  rating: number;
  date: string;
  comment: string;
  images?: string[];
  helpful: number;
  tags?: string[];
  verified?: boolean;
  repeatBuyer?: boolean;
  supplierReply?: string;
  countryName?: string;
  productTitle?: string;
  productPrice?: string;
  productImage?: string;
  /** Status="Pending" + kullanıcının kendi yorumu — sadece sahibine görünür */
  isOwnPending?: boolean;
  /** Reviewer reputation tier — Newcomer dışında ("Verified", "Trusted", "Top") */
  reviewerTier?: string;
  /** Bu yorum login user'a ait mi? (privacy: backend sadece sahibine bilgi verir) */
  isMine?: boolean;
  /** 24 saat + max 1 düzenleme penceresi içinde mi? (canEdit) */
  canEdit?: boolean;
  /** Yorum hangi statuste — login user kendi pending'ini görür */
  status?: string;
  /** Boyut bazlı puanlar (1-5). Yorum kartındaki yıldız partial-fill için
   *  bunlardan hesaplanan ortalama kullanılır (backend rating Int olduğu için). */
  aspects?: {
    product_quality?: number | null;
    service?: number | null;
    shipping?: number | null;
    spec_match?: number | null;
    documentation?: number | null;
  } | null;
}

export interface ReviewCategoryRating {
  label: string;
  score: number;
}

export interface ReviewMentionTag {
  label: string;
  count: number;
}

export interface SupplierInfo {
  id: string;
  name: string;
  /**
   * KYB Verified rolü temsili. verified === kybVerified — eski is_verified
   * field'ı silindi, tek doğruluk kaynağı User.role.Verified Seller.
   * False olduğunda storefront'ta "Sepete Ekle" disabled + uyarı banner'ı.
   */
  verified: boolean;
  /** @deprecated verified ile aynı, geriye uyumluluk için. */
  kybVerified?: boolean;
  /** Backend'den gelen ülke ismi ("Turkey", "China", vs.) — flag/kod hesabında kullanılır. */
  country?: string;
  /** Mağaza logosu (Admin Seller Profile.logo). */
  logo?: string;
  yearsInBusiness: number;
  responseTime: string;
  responseRate: string;
  onTimeDelivery: string;
  /**
   * @deprecated `mainMarkets`'in yanlış adlandırılmış takma adı — backend
   * `main_markets` içeriğini geriye uyumluluk için bu anahtarla da gönderiyor
   * (ürün listesi DEĞİL). Yeni kod `mainMarkets` okumalı; backend alanı
   * bıraktığında bu alan kaldırılabilir.
   */
  mainProducts: string[];
  employees: string;
  annualRevenue: string;
  certifications: string[];
  /** Mağaza puanı (satıcı profili) — ürün puanından ayrıdır. Faz 2'de dolar. */
  rating?: number;
  /** Mağaza yorum sayısı. Faz 2'de dolar. */
  reviewCount?: number;
  /** Ana pazarlar (Admin Seller Profile.main_markets). Faz 2'de dolar. */
  mainMarkets?: string[];
  /** Tekrar sipariş oranı (%). Veri yetersizse null. Faz 2'de dolar. */
  reorderRate?: number | null;
  /** Saha doğrulama kaynakları — backend get_listing_detail.supplier.verifications */
  verifications?: Array<{
    source_name: string;
    icon?: string;
    description?: string;
    document_url?: string;
  }>;
}

export interface ShippingInfo {
  method: string;
  estimatedDays: string;
  cost: string;
  baseCost?: number;
  baseCurrency?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface LeadTimeRange {
  quantityRange: string;
  days: string;
}

export interface CustomizationOption {
  name: string;
  priceAddon: string;
  minOrder: string;
}

export interface CategoryRank {
  categoryId: string;
  categoryName: string;
  slug: string;
  rank: number;
  total: number;
  /** 0 = en spesifik (yaprak), artan = daha geniş kategori */
  level: number;
}

export interface ProductDetail {
  id: string;
  /** Pretty URL slug (Faz 4 page_resolver için). Boşsa legacy fallback. */
  slug?: string;
  /** Backend SEO payload (admin'in girdiği meta'lar). Faz 4d. */
  seo?: ServerSeoPayload;
  title: string;
  category: string[];
  /**
   * Slug'lı kategori breadcrumb'ı (kök → yaprak). Breadcrumb linkleri
   * /pages/products.html?cat=<slug> üretir; slug boşsa q= aramasına düşülür.
   */
  categoryPath?: Array<{ name: string; slug: string }>;
  productCategoryId?: string;
  /**
   * KYB doğrulanmış satıcı flag'i (üst-seviye, supplier objesinden bağımsız).
   * Backend supplier load başarısız olsa bile bu flag güvenilirdir. False olduğunda
   * storefront uyarı banner'ı + Sepete Ekle disabled gösterilir. Yalnızca para
   * gate'idir; listing'in storefront'ta görünür olması (Active) bağımsız.
   */
  sellerKybVerified?: boolean;
  images: ProductImage[];
  priceTiers: PriceTier[];
  priceMin?: number;
  priceMax?: number;
  moq: number;
  sellInMoqMultiples?: boolean;
  unit: string;
  leadTime: string;
  shipping: ShippingInfo[];
  variants: ProductVariant[];
  specs: ProductSpec[];
  specGroups?: ProductSpecGroup[];
  packagingSpecs: ProductSpec[];
  /**
   * Ürün-seviyesi sertifikalar (Listing Certification). Satıcı-seviyesi
   * supplier.certifications'tan AYRI kavramdır — ikisini birleştirme.
   */
  productCertifications?: Array<{ name: string; description: string }>;
  brandInfo?: BrandInfo | null;
  productTypeName?: string;
  productFamilyName?: string;
  attributeSetName?: string;
  /** Optional listing-level promo video URL (YouTube/Vimeo/MP4/HLS). */
  videoUrl?: string;
  /** Optional poster image for the promo video (manually uploaded today; manifest-derived later). */
  videoPoster?: string;
  /**
   * W8 — medya hattının manifest türev alanları (API `get_listing_detail`).
   * Hepsi opsiyonel: türev yokken/bayrak kapalıyken API null basar ve vitrin
   * ham `videoUrl` davranışında kalır.
   */
  /** HLS master playlist (`…/hls/master.m3u8`) — varsa mp4 yerine tercih edilir. */
  videoHlsSrc?: string;
  /** Optimize progresif mp4 (h264 türevi; passthrough'ta ham dosyanın kendisi). */
  videoSrc?: string;
  /** Sessiz 3-6 sn hareketli önizleme klibi (≤1 MB) — hover/galeri yüzeyleri için. */
  videoPreviewSrc?: string;
  description: string;
  rating: number;
  reviewCount: number;
  orderCount: string;
  categoryRanks?: CategoryRank[];
  reviews: ProductReview[];
  samplePrice?: number;
  baseSamplePrice?: number;
  baseCurrency: string;
  supplier: SupplierInfo;
  faq: FAQItem[];
  leadTimeRanges: LeadTimeRange[];
  customizationOptions: CustomizationOption[];
  reviewCategoryRatings: ReviewCategoryRating[];
  storeReviewCount: number;
  reviewMentionTags: ReviewMentionTag[];
  /** When true, the listing is in "Out of Stock" status — show badge, disable add-to-cart. */
  outOfStock?: boolean;
  /** Raw listing status (e.g. "Active", "Out of Stock"). */
  status?: string;
  /** True when the listing has stock available (false when outOfStock or stock=0). */
  inStock?: boolean;
  /** Listing-level total stock quantity, after status overrides. */
  stockQty?: number;
}
