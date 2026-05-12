/**
 * Product Detail Page — TypeScript Interfaces
 * Types for product detail, supplier, reviews, and related data.
 */

export interface ProductImage {
  id: string;
  src: string;
  alt: string;
  isVideo?: boolean;
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
  label: string;
  options: VariantOption[];
  skuMatrix?: SkuMatrixEntry[];
}

export interface VariantOption {
  id: string;
  label: string;
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
  yearsInBusiness: number;
  responseTime: string;
  responseRate: string;
  onTimeDelivery: string;
  mainProducts: string[];
  employees: string;
  annualRevenue: string;
  certifications: string[];
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

export interface ProductDetail {
  id: string;
  title: string;
  category: string[];
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
  brandInfo?: BrandInfo | null;
  productTypeName?: string;
  productFamilyName?: string;
  attributeSetName?: string;
  /** Optional listing-level promo video URL (YouTube/Vimeo/MP4). */
  videoUrl?: string;
  description: string;
  packaging: string;
  rating: number;
  reviewCount: number;
  orderCount: string;
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
