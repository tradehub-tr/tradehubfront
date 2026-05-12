/**
 * Listing Service — connects frontend to Frappe TradeHub backend API
 * Maps Frappe API responses to frontend TypeScript interfaces.
 */

import { api } from "../utils/api";
import {
  convertPrice,
  formatPrice,
  formatPriceRange,
  getSelectedCurrencyInfo,
} from "./currencyService";
import type {
  ProductDetail,
  ProductImage,
  PriceTier,
  ProductVariant,
  ProductSpec,
  ShippingInfo,
  SupplierInfo,
  CustomizationOption,
} from "../types/product";
import type { ProductListingCard, SearchHeaderInfo } from "../types/productListing";

// Frappe API response wrapper
interface FrappeResponse<T> {
  message: {
    data: T;
    total?: number;
    page?: number;
    page_size?: number;
    total_pages?: number;
    has_next?: boolean;
    has_prev?: boolean;
  };
}

// ── Search Params ──

export interface ListingSearchParams {
  query?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  min_order?: number;
  supplier?: string;
  sort_by?: string;
  sort_order?: string;
  page?: number;
  page_size?: number;
  is_featured?: boolean;
  is_best_seller?: boolean;
  is_new_arrival?: boolean;
  is_deal?: boolean;
  free_shipping?: boolean;
  verified_supplier?: boolean;
  min_rating?: number;
  country?: string;
  paid_samples?: boolean;
  certifications?: string;
  mgmt_certifications?: string;
  product_certifications?: string;
  /** Comma-separated brand codes, e.g. "NIKE,ADIDAS" */
  brands?: string;
  /** Compact attribute filter: "CODE:VAL1,VAL2|CODE2:VAL". e.g. "RENK:RED,BLUE|BEDEN:M" */
  attrs?: string;
}

export interface ListingSearchResult {
  products: ProductListingCard[];
  searchHeader: SearchHeaderInfo;
  hasNext: boolean;
  hasPrev: boolean;
}

// ── API Endpoints ──

/**
 * Search/filter listings for the product listing page
 */
export async function searchListings(params: ListingSearchParams): Promise<ListingSearchResult> {
  const queryParams = new URLSearchParams();

  if (params.query) queryParams.set("query", params.query);
  if (params.category) queryParams.set("category", params.category);
  if (params.min_price !== undefined) queryParams.set("min_price", String(params.min_price));
  if (params.max_price !== undefined) queryParams.set("max_price", String(params.max_price));
  if (params.min_order !== undefined) queryParams.set("min_order", String(params.min_order));
  if (params.supplier) queryParams.set("supplier", params.supplier);
  if (params.sort_by) queryParams.set("sort_by", params.sort_by);
  if (params.sort_order) queryParams.set("sort_order", params.sort_order);
  if (params.page) queryParams.set("page", String(params.page));
  if (params.page_size) queryParams.set("page_size", String(params.page_size));
  if (params.is_featured) queryParams.set("is_featured", "1");
  if (params.is_best_seller) queryParams.set("is_best_seller", "1");
  if (params.is_new_arrival) queryParams.set("is_new_arrival", "1");
  if (params.is_deal) queryParams.set("is_deal", "1");
  if (params.free_shipping) queryParams.set("free_shipping", "1");
  if (params.verified_supplier) queryParams.set("verified_supplier", "1");
  if (params.min_rating !== undefined) queryParams.set("min_rating", String(params.min_rating));
  if (params.country) queryParams.set("country", params.country);
  if (params.paid_samples) queryParams.set("paid_samples", "1");
  if (params.certifications) queryParams.set("certifications", params.certifications);
  if (params.mgmt_certifications)
    queryParams.set("mgmt_certifications", params.mgmt_certifications);
  if (params.product_certifications)
    queryParams.set("product_certifications", params.product_certifications);
  if (params.brands) queryParams.set("brands", params.brands);
  if (params.attrs) queryParams.set("attrs", params.attrs);

  const qs = queryParams.toString();
  const url = `/method/tradehub_core.api.listing.get_listings${qs ? "?" + qs : ""}`;
  const response = await api<FrappeResponse<Record<string, unknown>[]>>(url);
  const msg = response.message;

  const products = (msg.data || []).map(mapListingCard);

  const searchHeader: SearchHeaderInfo = {
    keyword: params.query || "",
    totalProducts: msg.total || 0,
    currentPage: msg.page || 1,
    totalPages: msg.total_pages || 1,
    freeShippingAvailable: products.some((p) => p.promo?.toLowerCase().includes("shipping")),
    sortOptions: [
      { id: "relevance", label: "En İyi Eşleşme", value: "relevance" },
      { id: "newest", label: "En Yeniler", value: "newest" },
      { id: "orders", label: "Siparişler", value: "orders" },
      { id: "rating", label: "Değerlendirme", value: "rating" },
      { id: "price_asc", label: "Fiyat (Düşük → Yüksek)", value: "price_asc" },
      { id: "price_desc", label: "Fiyat (Yüksek → Düşük)", value: "price_desc" },
    ],
    selectedSort: params.sort_by || "relevance",
  };

  return {
    products,
    searchHeader,
    hasNext: msg.has_next || false,
    hasPrev: msg.has_prev || false,
  };
}

/**
 * Get listing detail for the product detail page
 */
export async function getListingDetail(listingId: string): Promise<ProductDetail> {
  const response = await api<FrappeResponse<Record<string, unknown>>>(
    `/method/tradehub_core.api.listing.get_listing_detail?listing_id=${encodeURIComponent(listingId)}`
  );
  return mapListingDetail(response.message.data);
}

// ───────────────────────────────────────────────────────────────────────────
// Faz 6 — Storefront Review API (backend tradehub_core.api.storefront_api)
// Mock data yerine gerçek review verisi çekme.
// ───────────────────────────────────────────────────────────────────────────
interface BackendStorefrontReview {
  name: string | number;
  reviewer_display_name?: string;
  rating: number;
  title?: string | null;
  body?: string;
  status?: string;
  is_own_pending?: boolean;
  is_mine?: boolean;
  can_edit?: boolean;
  is_verified_purchase?: number | boolean;
  is_kyb_verified?: number | boolean;
  published_at?: string | null;
  submitted_at?: string | null;
  edited?: boolean;
  helpful_count?: number;
  not_helpful_count?: number;
  video_url?: string | null;
  images?: Array<{ image: string; caption?: string }>;
  aspects?: {
    product_quality?: number | null;
    service?: number | null;
    shipping?: number | null;
    spec_match?: number | null;
    documentation?: number | null;
  };
  reply?: { body: string; at?: string; within_hours?: number } | null;
  reviewer?: { tier?: string; score?: number };
}

interface BackendStorefrontPage {
  summary: {
    average_rating: number;
    weighted_rating?: number;
    review_count: number;
    rating_distribution?: Record<string, number>;
    verified_purchase_count?: number;
    kyb_verified_count?: number;
    aspect_averages?: Record<string, number>;
    trust_signals?: {
      verified_purchase_pct?: number;
      kyb_verified_pct?: number;
      trusted_reviewer_pct?: number;
      avg_review_age_days?: number;
    };
  };
  reviews: BackendStorefrontReview[];
  total: number;
  page: number;
  page_size: number;
  qa_total: number;
}

function backendReviewToProductReview(
  r: BackendStorefrontReview
): import("../types/product").ProductReview {
  const tags: string[] = [];
  // Tier'i tags'tan kaldırdık — artık özel bir rozet (reviewerTier) ile
  // renderReviewCard'da dedicated UI veriyoruz.
  return {
    id: String(r.name),
    author: r.reviewer_display_name || "Anonim",
    country: "TR",
    rating: Number(r.rating || 0),
    date: (r.published_at || r.submitted_at || "").slice(0, 10),
    comment: r.body || r.title || "",
    images: Array.isArray(r.images) ? r.images.map((x) => x.image) : [],
    helpful: Number(r.helpful_count || 0),
    tags,
    verified: Boolean(r.is_verified_purchase),
    supplierReply: r.reply?.body || undefined,
    isOwnPending: Boolean(r.is_own_pending),
    isMine: Boolean(r.is_mine),
    canEdit: Boolean(r.can_edit),
    status: r.status,
    reviewerTier: r.reviewer?.tier && r.reviewer.tier !== "Newcomer"
      ? r.reviewer.tier
      : undefined,
  };
}

/**
 * Faz 6 — Storefront için bir ürünün tüm review verisini çek.
 * Mevcut ProductReview[] formatına adapt ederek döner.
 */
export async function getProductReviews(
  listingId: string,
  opts: {
    page?: number;
    pageSize?: number;
    sortBy?: "recent" | "high" | "low" | "helpful";
    onlyVerified?: boolean;
  } = {}
): Promise<{
  reviews: import("../types/product").ProductReview[];
  summary: BackendStorefrontPage["summary"];
  total: number;
  qaTotal: number;
}> {
  const params = new URLSearchParams({
    listing: listingId,
    page: String(opts.page ?? 1),
    page_size: String(opts.pageSize ?? 20),
    sort_by: opts.sortBy ?? "recent",
    only_verified: opts.onlyVerified ? "1" : "0",
  });
  // NOT: FrappeResponse<T> internal list-endpoint formatına göre `{ data, total }`
  // sarmalar. Storefront API direkt obje döner; bu yüzden raw `{ message: T }`
  // tipini elle veriyoruz.
  const response = await api<{ message: BackendStorefrontPage }>(
    `/method/tradehub_core.api.storefront_api.get_storefront_review_page?${params.toString()}`
  );
  const data = response.message;
  return {
    reviews: (data.reviews || []).map(backendReviewToProductReview),
    summary: data.summary,
    total: data.total || 0,
    qaTotal: data.qa_total || 0,
  };
}

/**
 * Faz 6 — Listing-bazlı yorum yapma uygunluğu.
 * Returns: can_review, order_items[], reason, user_logged_in
 */
export interface ReviewEligibility {
  can_review: boolean;
  order_items: Array<{
    name: string;
    order: string;
    order_date: string | null;
    quantity: number;
  }>;
  already_reviewed_count: number;
  reason: string | null;
  user_logged_in: boolean;
}

export async function getReviewEligibility(
  listingId: string
): Promise<ReviewEligibility> {
  const params = new URLSearchParams({ listing: listingId });
  const response = await callMethodGet<ReviewEligibility>(
    "tradehub_core.api.storefront_api.get_review_eligibility",
    params
  );
  return response;
}

/**
 * Submit a new product review.
 */
export interface SubmitReviewPayload {
  order_item: string;
  rating: number;
  body: string;
  title?: string;
  images?: Array<{ image: string; caption?: string }>;
  video_url?: string;
  aspects?: {
    product_quality?: number;
    service?: number;
    shipping?: number;
    spec_match?: number;
    documentation?: number;
  };
}

export async function submitReview(
  payload: SubmitReviewPayload
): Promise<{ success: boolean; name: string; status: string }> {
  return callMethodPost(
    "tradehub_core.api.storefront_api.submit_review",
    payload as unknown as Record<string, unknown>
  );
}

/**
 * Kullanıcı kendi yorumunu 24 saat içinde düzenler (max 1 kez).
 */
export async function updateOwnReview(payload: {
  name: string;
  rating?: number;
  title?: string;
  body?: string;
}): Promise<{ success: boolean; edit_count: number; status: string }> {
  return callMethodPost(
    "tradehub_core.api.storefront_api.update_review",
    payload as unknown as Record<string, unknown>
  );
}

/**
 * Helpful / not helpful oy.
 */
export async function voteReviewHelpful(
  reviewName: string,
  vote: "helpful" | "not_helpful"
): Promise<{ success: boolean; helpful_count: number; not_helpful_count: number }> {
  return callMethodPost(
    "tradehub_core.api.storefront_api.vote_helpful",
    { review: reviewName, vote }
  );
}

/**
 * Q&A soru veya cevabına faydalı oy.
 */
export async function voteQAHelpful(
  targetType: "question" | "answer",
  targetId: string | number
): Promise<{ success: boolean; changed: boolean }> {
  return callMethodPost(
    "tradehub_core.api.storefront_api.vote_qa_helpful",
    { target_type: targetType, target_id: String(targetId) }
  );
}

/**
 * Bir yorumu şikayet et.
 */
export async function reportReviewAbuse(
  reviewName: string,
  reason: string,
  note?: string
): Promise<{ success: boolean }> {
  return callMethodPost(
    "tradehub_core.api.storefront_api.report_abuse",
    { review: reviewName, reason, note: note || "" }
  );
}

/**
 * Q&A — soru sor.
 */
export async function submitProductQuestion(
  listingId: string,
  question: string
): Promise<{ success: boolean; name: string }> {
  return callMethodPost(
    "tradehub_core.api.storefront_api.submit_question",
    { listing: listingId, question }
  );
}

/**
 * Q&A — listele.
 */
export interface ProductQuestion {
  name: string;
  asker_display_name: string;
  is_kyb_verified: number | boolean;
  question: string;
  answer_count: number;
  helpful_count: number;
  submitted_at: string;
  status: string;
  /** Login user'ın kendi Pending sorusu — sadece sahibine görünür */
  is_own_pending?: boolean;
  answers: Array<{
    name: string;
    responder_type: string;
    is_seller_answer: boolean;
    helpful_count: number;
    submitted_at: string;
    answer: string;
  }>;
}

export async function getProductQA(
  listingId: string,
  page = 1
): Promise<{ questions: ProductQuestion[]; total: number }> {
  const params = new URLSearchParams({
    listing: listingId,
    page: String(page),
  });
  return callMethodGet(
    "tradehub_core.api.storefront_api.get_qa_page",
    params
  );
}

/**
 * Frappe standart upload_file endpoint'ine bir dosya yükler.
 * /api/method/upload_file (POST, multipart)
 */
export async function uploadReviewImage(
  file: File
): Promise<{ file_url: string; name: string }> {
  const { fetchCsrfToken } = await import("../utils/api");
  const csrf = (await fetchCsrfToken()) ?? "None";
  const form = new FormData();
  form.append("file", file);
  form.append("is_private", "0");
  form.append("folder", "Home/Attachments");
  const base = (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env
    ?.VITE_API_URL || "/api";
  const res = await fetch(`${base}/method/upload_file`, {
    method: "POST",
    credentials: "include",
    headers: { "X-Frappe-CSRF-Token": csrf },
    body: form,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Dosya yüklenemedi: ${txt || res.statusText}`);
  }
  const data = (await res.json()) as {
    message: { file_url: string; name: string };
  };
  return data.message;
}

// Internal GET/POST helpers using fetch directly with credentials + CSRF
async function callMethodGet<T>(
  method: string,
  params: URLSearchParams
): Promise<T> {
  const base = (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env
    ?.VITE_API_URL || "/api";
  const res = await fetch(`${base}/method/${method}?${params.toString()}`, {
    credentials: "include",
    headers: { "X-Requested-With": "XMLHttpRequest" },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(extractError(txt) || `HTTP ${res.status}`);
  }
  const data = (await res.json()) as { message: T };
  return data.message;
}

async function callMethodPost<T>(
  method: string,
  params: Record<string, unknown>
): Promise<T> {
  const { fetchCsrfToken } = await import("../utils/api");
  const csrf = (await fetchCsrfToken()) ?? "None";
  const base = (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env
    ?.VITE_API_URL || "/api";
  const form = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v == null) continue;
    form.set(k, typeof v === "object" ? JSON.stringify(v) : String(v));
  }
  const res = await fetch(`${base}/method/${method}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Frappe-CSRF-Token": csrf,
      "X-Requested-With": "XMLHttpRequest",
    },
    body: form.toString(),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(extractError(txt) || `HTTP ${res.status}`);
  }
  const data = (await res.json()) as { message: T };
  return data.message;
}

function extractError(raw: string): string {
  try {
    const body = JSON.parse(raw);
    if (body._server_messages) {
      const msgs = JSON.parse(body._server_messages);
      const first = typeof msgs[0] === "string" ? JSON.parse(msgs[0]) : msgs[0];
      if (first?.message) return first.message;
    }
    if (body.message) return String(body.message);
    if (body.exc) {
      // Frappe exception traceback; extract last line
      const lines = String(body.exc).trim().split("\n").filter(Boolean);
      return lines[lines.length - 1] || "Sunucu hatası";
    }
  } catch {
    /* not JSON */
  }
  return "";
}

/**
 * Get related listings for a product
 */
export async function getRelatedListings(
  listingId: string,
  limit = 8
): Promise<ProductListingCard[]> {
  const response = await api<FrappeResponse<Record<string, unknown>[]>>(
    `/method/tradehub_core.api.listing.get_related_listings?listing_id=${encodeURIComponent(listingId)}&limit=${limit}`
  );
  return (response.message.data || []).map(mapListingCard);
}

// ── Related Products Grouped (Benzer/İkame/Tamamlayıcı/Aksesuar) ──

export type RelatedRelationType = "similar" | "substitute" | "complementary" | "accessory";

export interface RelatedListingsGrouped {
  similar: ProductListingCard[];
  substitute: ProductListingCard[];
  complementary: ProductListingCard[];
  accessory: ProductListingCard[];
}

/**
 * Fetch grouped related listings for the 4-tab Related Products section.
 *
 * Hits the real backend endpoint. If the endpoint is unreachable (offline
 * dev, backend restarting), falls back to dummy data so the storefront
 * keeps rendering — this is also what makes the `?demo_related=…` URL
 * override useful for frontend-only sanity checks.
 */
export async function getRelatedListingsGrouped(
  listingId: string
): Promise<RelatedListingsGrouped> {
  const urlOverride =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("demo_related")
      : null;
  if (urlOverride) {
    // Explicit dev override always wins so screenshots/sanity checks stay
    // reproducible even when backend has different data.
    return getDummyRelatedGrouped(listingId);
  }

  try {
    const response = await api<FrappeResponse<RelatedListingsGrouped>>(
      `/method/tradehub_core.api.listing.get_related_listings_grouped?listing_id=${encodeURIComponent(listingId)}`
    );
    const data = response.message?.data;
    if (data && typeof data === "object") {
      return {
        similar: Array.isArray(data.similar) ? data.similar.map(mapListingCard) : [],
        substitute: Array.isArray(data.substitute) ? data.substitute.map(mapListingCard) : [],
        complementary: Array.isArray(data.complementary)
          ? data.complementary.map(mapListingCard)
          : [],
        accessory: Array.isArray(data.accessory) ? data.accessory.map(mapListingCard) : [],
      };
    }
    return { similar: [], substitute: [], complementary: [], accessory: [] };
  } catch (err) {
    console.warn("[RelatedProducts] API unreachable, falling back to empty groups:", err);
    return { similar: [], substitute: [], complementary: [], accessory: [] };
  }
}

function getDummyRelatedGrouped(_listingId: string): RelatedListingsGrouped {
  // URL-level scenario override (debugging aid, not used by real users)
  const scenario =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("demo_related") || "all"
      : "all";

  const all = buildDummyAllFilled();
  if (scenario === "none") {
    return { similar: [], substitute: [], complementary: [], accessory: [] };
  }
  if (scenario === "one") {
    return { similar: [], substitute: [], complementary: all.complementary, accessory: [] };
  }
  if (scenario === "partial") {
    return { similar: [], substitute: all.substitute, complementary: [], accessory: all.accessory };
  }
  return all;
}

function dummyCard(
  id: string,
  name: string,
  price: string,
  originalPrice: string | undefined,
  discount: string | undefined,
  moq: string,
  sold: string,
  years: number,
  country: string,
  imageKind: string
): ProductListingCard {
  return {
    id,
    name,
    href: `/pages/product-detail.html?id=${id}`,
    price,
    originalPrice,
    discount,
    moq,
    stats: sold,
    imageKind: imageKind as ProductListingCard["imageKind"],
    supplierYears: years,
    supplierCountry: country,
    verified: true,
  };
}

function buildDummyAllFilled(): RelatedListingsGrouped {
  return {
    similar: [
      dummyCard(
        "LST-R-S01",
        "Kırmızı Erkek Kazak - XL",
        "₺750,00",
        "₺890,00",
        "15%",
        "50 adet",
        "120+ satıldı",
        3,
        "TR",
        "clothing"
      ),
      dummyCard(
        "LST-R-S02",
        "Triko Kazak Pamuk Karışımı",
        "₺820,00",
        undefined,
        undefined,
        "30 adet",
        "80+ satıldı",
        5,
        "TR",
        "clothing"
      ),
      dummyCard(
        "LST-R-S03",
        "Lacivert V Yaka Kazak",
        "₺690,00",
        "₺770,00",
        "10%",
        "20 adet",
        "200+ satıldı",
        2,
        "TR",
        "clothing"
      ),
      dummyCard(
        "LST-R-S04",
        "Yarım Balıkçı Örme Kazak",
        "₺880,00",
        undefined,
        undefined,
        "25 adet",
        "45+ satıldı",
        7,
        "IT",
        "clothing"
      ),
      dummyCard(
        "LST-R-S05",
        "Oversize Boğazlı Kazak",
        "₺920,00",
        "₺1.150,00",
        "20%",
        "15 adet",
        "60+ satıldı",
        1,
        "TR",
        "clothing"
      ),
      dummyCard(
        "LST-R-S06",
        "Hardal Sarısı Kalın Triko",
        "₺780,00",
        undefined,
        undefined,
        "40 adet",
        "35+ satıldı",
        4,
        "TR",
        "clothing"
      ),
      dummyCard(
        "LST-R-S07",
        "Fitilli İnce Yün Kazak",
        "₺710,00",
        "₺770,00",
        "8%",
        "30 adet",
        "90+ satıldı",
        6,
        "TR",
        "clothing"
      ),
      dummyCard(
        "LST-R-S08",
        "Çizgili Bisiklet Yaka Kazak",
        "₺640,00",
        undefined,
        undefined,
        "50 adet",
        "110+ satıldı",
        2,
        "CN",
        "clothing"
      ),
    ],
    substitute: [
      dummyCard(
        "LST-R-U01",
        "Polar Erkek Sweatshirt",
        "₺550,00",
        "₺625,00",
        "12%",
        "40 adet",
        "300+ satıldı",
        6,
        "TR",
        "clothing"
      ),
      dummyCard(
        "LST-R-U02",
        "İnce Hırka - Yün Karışımı",
        "₺720,00",
        undefined,
        undefined,
        "20 adet",
        "50+ satıldı",
        3,
        "TR",
        "clothing"
      ),
      dummyCard(
        "LST-R-U03",
        "Sweat Kapüşonlu Üst",
        "₺480,00",
        "₺585,00",
        "18%",
        "60 adet",
        "500+ satıldı",
        8,
        "TR",
        "clothing"
      ),
      dummyCard(
        "LST-R-U04",
        "Kalın Pamuklu Tişört",
        "₺380,00",
        undefined,
        undefined,
        "100 adet",
        "1K+ satıldı",
        4,
        "CN",
        "clothing"
      ),
    ],
    complementary: [
      dummyCard(
        "LST-R-C01",
        "Kot Pantolon Slim Fit",
        "₺920,00",
        undefined,
        undefined,
        "30 adet",
        "150+ satıldı",
        5,
        "TR",
        "clothing"
      ),
      dummyCard(
        "LST-R-C02",
        "Kargo Pantolon Haki",
        "₺870,00",
        "₺970,00",
        "10%",
        "25 adet",
        "75+ satıldı",
        4,
        "TR",
        "clothing"
      ),
      dummyCard(
        "LST-R-C03",
        "Örgü Atkı Seti",
        "₺210,00",
        undefined,
        undefined,
        "50 adet",
        "220+ satıldı",
        2,
        "TR",
        "accessory"
      ),
      dummyCard(
        "LST-R-C04",
        "Klasik Yün Bere",
        "₺150,00",
        "₺158,00",
        "5%",
        "60 adet",
        "300+ satıldı",
        6,
        "TR",
        "accessory"
      ),
      dummyCard(
        "LST-R-C05",
        "Deri Kemer - Kahverengi",
        "₺320,00",
        undefined,
        undefined,
        "40 adet",
        "90+ satıldı",
        3,
        "IT",
        "accessory"
      ),
    ],
    accessory: [
      dummyCard(
        "LST-R-A01",
        "Sökülebilir Yaka Süsü",
        "₺80,00",
        undefined,
        undefined,
        "100 adet",
        "40+ satıldı",
        1,
        "TR",
        "accessory"
      ),
      dummyCard(
        "LST-R-A02",
        "Kazak Bakım Seti - Tüy Alıcı + Sprey",
        "₺120,00",
        undefined,
        undefined,
        "80 adet",
        "60+ satıldı",
        2,
        "TR",
        "packaging"
      ),
      dummyCard(
        "LST-R-A03",
        "Düğme Değişim Kiti",
        "₺45,00",
        "₺48,00",
        "7%",
        "200 adet",
        "25+ satıldı",
        1,
        "TR",
        "tools"
      ),
    ],
  };
}

/**
 * Get featured listings for homepage
 */
export async function getFeaturedListings(limit = 10): Promise<ProductListingCard[]> {
  const response = await api<FrappeResponse<Record<string, unknown>[]>>(
    `/method/tradehub_core.api.listing.get_featured_listings?limit=${limit}`
  );
  return (response.message.data || []).map(mapListingCard);
}

// ── Top Deals (deals grouped by category) ──

/** Top Deals: a category preview group returned by get_top_deals_grouped */
export interface TopDealsCategoryGroup {
  id: string;
  name: string;
  slug: string;
  products: ProductListingCard[];
  totalInCategory: number;
}

export interface TopDealsGroupedResult {
  groups: TopDealsCategoryGroup[];
  page: number;
  pageSize: number;
  totalCategories: number;
  hasNext: boolean;
}

/**
 * Get a paginated list of category groups with their top deal previews.
 * Drives the "Tümü" tab of the Top Deals page (Alibaba-style category cards).
 */
export async function getTopDealsGrouped(
  page = 1,
  pageSize = 8,
  productsPerCategory = 6
): Promise<TopDealsGroupedResult> {
  const qs = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
    products_per_category: String(productsPerCategory),
  }).toString();
  const response = await api<
    FrappeResponse<
      Array<{
        id: string;
        name: string;
        slug: string;
        products: Record<string, unknown>[];
        total_in_category: number;
      }>
    >
  >(`/method/tradehub_core.api.listing.get_top_deals_grouped?${qs}`);
  const msg = response.message;
  const groups: TopDealsCategoryGroup[] = (msg.data || []).map((g) => ({
    id: g.id,
    name: g.name,
    slug: g.slug,
    products: (g.products || []).map(mapListingCard),
    totalInCategory: g.total_in_category || 0,
  }));
  return {
    groups,
    page: msg.page || 1,
    pageSize: msg.page_size || pageSize,
    totalCategories: (msg as any).total_categories || 0,
    hasNext: msg.has_next || false,
  };
}

// ── Top Ranking (best-sellers grouped by category) ──

/** Top Ranking: a category card returned by get_top_ranking_categories */
export interface TopRankingCategory {
  id: string;
  name: string;
  slug: string;
  image: string;
  icon: string;
  totalOrders: number;
  totalListings: number;
}

/**
 * Get the top N best-selling categories for the homepage "En Çok Satanlar"
 * section (6 cards by default).
 */
export async function getTopRankingCategories(
  limit = 6,
  sort: "hot-selling" | "most-popular" | "best-reviewed" = "hot-selling"
): Promise<TopRankingCategory[]> {
  const qs = new URLSearchParams({ limit: String(limit), sort }).toString();
  const response = await api<FrappeResponse<TopRankingCategory[]>>(
    `/method/tradehub_core.api.listing.get_top_ranking_categories?${qs}`
  );
  return response.message.data || [];
}

/** Top Ranking: a category group returned by get_top_ranking_grouped */
export interface TopRankingGroup {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  products: ProductListingCard[];
}

export interface TopRankingGroupedResult {
  groups: TopRankingGroup[];
  page: number;
  pageSize: number;
  totalCategories: number;
  hasNext: boolean;
}

/**
 * Get a paginated list of category groups with their top best-seller previews.
 * Drives the Top Ranking page (Alibaba-style category cards with #1/#2/#3 ranks).
 */
export async function getTopRankingGrouped(
  page = 1,
  pageSize = 12,
  productsPerCategory = 3,
  category?: string,
  sort: "hot-selling" | "most-popular" | "best-reviewed" = "hot-selling"
): Promise<TopRankingGroupedResult> {
  const qs = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
    products_per_category: String(productsPerCategory),
    sort,
  });
  if (category && category !== "all") qs.set("category", category);
  const response = await api<
    FrappeResponse<
      Array<{
        id: string;
        name: string;
        slug: string;
        categoryId: string;
        products: Record<string, unknown>[];
      }>
    >
  >(`/method/tradehub_core.api.listing.get_top_ranking_grouped?${qs.toString()}`);
  const msg = response.message;
  const groups: TopRankingGroup[] = (msg.data || []).map((g) => ({
    id: g.id,
    name: g.name,
    slug: g.slug,
    categoryId: g.categoryId || g.id,
    products: (g.products || []).map(mapListingCard),
  }));
  return {
    groups,
    page: msg.page || 1,
    pageSize: msg.page_size || pageSize,
    totalCategories: (msg as any).total_categories || 0,
    hasNext: msg.has_next || false,
  };
}

/**
 * Get categories for filter sidebar
 */
export async function getCategories(parent?: string) {
  const params = parent ? `?parent=${encodeURIComponent(parent)}` : "";
  const response = await api<FrappeResponse<Record<string, unknown>[]>>(
    `/method/tradehub_core.api.listing.get_categories${params}`
  );
  return response.message.data || [];
}

/** Facet counts for sidebar filters */
export interface BrandFacet {
  code: string;
  value: string;
  label: string;
  slug?: string;
  logo?: string;
  count: number;
}

export interface AttributeFacetOption {
  value: string;
  label: string;
  color?: string;
  count: number;
}

export interface AttributeFacet {
  code: string;
  label: string;
  options: AttributeFacetOption[];
}

export interface FilterFacets {
  countries: { value: string; label: string; code?: string; count: number }[];
  categories: { id: string; name: string; slug: string; count: number }[];
  managementCertifications: { label: string; value: string; count: number }[];
  productCertifications: { label: string; value: string; count: number }[];
  brands: BrandFacet[];
  attributes: AttributeFacet[];
}

/**
 * Get filter facets (country + category counts) for sidebar
 */
export async function getFilterFacets(query?: string, category?: string): Promise<FilterFacets> {
  const params = new URLSearchParams();
  if (query) params.set("query", query);
  if (category) params.set("category", category);
  const qs = params.toString();
  const response = await api<{ message: { data: FilterFacets } }>(
    `/method/tradehub_core.api.listing.get_filter_facets${qs ? "?" + qs : ""}`
  );
  return (
    response.message.data || {
      countries: [],
      categories: [],
      managementCertifications: [],
      productCertifications: [],
      brands: [],
      attributes: [],
    }
  );
}

/**
 * Get shipping methods for a listing
 */
export async function getShippingMethods(listingId?: string) {
  const params = listingId ? `?listing_id=${encodeURIComponent(listingId)}` : "";
  const response = await api<FrappeResponse<Record<string, unknown>[]>>(
    `/method/tradehub_core.api.listing.get_shipping_methods${params}`
  );
  return response.message.data || [];
}

/** Search suggestion item from API */
export interface SearchSuggestion {
  text: string;
  type: "product" | "category";
}

export interface SearchSuggestionsResult {
  suggestions: SearchSuggestion[];
  chips: SearchSuggestion[];
}

/**
 * Get search suggestions for the search dropdown (trending products + popular categories)
 */
export async function getSearchSuggestions(): Promise<SearchSuggestionsResult> {
  try {
    const response = await api<
      FrappeResponse<{ suggestions: SearchSuggestion[]; chips: SearchSuggestion[] }>
    >("/method/tradehub_core.api.listing.get_search_suggestions");
    return response.message.data as unknown as SearchSuggestionsResult;
  } catch {
    return { suggestions: [], chips: [] };
  }
}

// ── Price Range Helper ──

function derivePriceRange(
  raw: any,
  priceTiers: PriceTier[],
  variants: ProductVariant[],
  baseCur: string
): { priceMin?: number; priceMax?: number } {
  // 1. Collect all variant option prices
  const variantPrices: number[] = [];
  for (const v of variants) {
    for (const o of v.options) {
      if (o.price && o.price > 0) variantPrices.push(o.price);
    }
  }

  // 2. If variants have prices, use min/max from those
  if (variantPrices.length >= 2) {
    return { priceMin: Math.min(...variantPrices), priceMax: Math.max(...variantPrices) };
  }

  // 3. If price tiers exist, use min/max from tier prices
  if (priceTiers.length >= 2) {
    const tierPrices = priceTiers.map((t) => t.price);
    return { priceMin: Math.min(...tierPrices), priceMax: Math.max(...tierPrices) };
  }

  // 4. Fallback: single selling price
  if (raw.sellingPrice) {
    const sp = convertPrice(raw.sellingPrice, baseCur);
    return { priceMin: sp, priceMax: sp };
  }

  return {};
}

// ── Mappers: Frappe response → Frontend TypeScript interfaces ──

/* eslint-disable @typescript-eslint/no-explicit-any */

function mapListingCard(raw: any): ProductListingCard {
  // Currency conversion for price display
  const baseCurrency = raw.baseCurrency || "USD";

  // Parse min/max prices from pricing tiers or selling price
  let priceDisplay = raw.price || "";
  let originalPriceDisplay = raw.originalPrice || undefined;

  if (raw.minPrice !== undefined && raw.maxPrice !== undefined) {
    priceDisplay = formatPriceRange(raw.minPrice, raw.maxPrice, baseCurrency);
  } else if (raw.sellingPrice) {
    priceDisplay = formatPrice(raw.sellingPrice, baseCurrency);
  } else if (typeof raw.price === "string" && raw.price.startsWith("$")) {
    // Parse "$1.80-2.50" format and convert
    const match = raw.price.match(/\$?([\d.]+)(?:-([\d.]+))?/);
    if (match) {
      const min = parseFloat(match[1]);
      const max = match[2] ? parseFloat(match[2]) : min;
      priceDisplay = formatPriceRange(min, max, baseCurrency);
      if (raw.originalPrice) {
        const origMatch = raw.originalPrice.match(/\$?([\d.]+)/);
        if (origMatch) {
          originalPriceDisplay = formatPrice(parseFloat(origMatch[1]), baseCurrency);
        }
      }
    }
  }

  // Strikethrough source = the seller's day-to-day selling price BEFORE the
  // campaign discount was applied. Backend exposes it as raw.originalSellingPrice
  // (numeric) only when a campaign is active (dp > 0); otherwise it's null.
  // We re-format it through the currency-aware path so the strikethrough
  // renders in the same locale (e.g. ₺900,00 in TR) as the deal price.
  if (typeof raw.originalSellingPrice === "number" && raw.originalSellingPrice > 0) {
    originalPriceDisplay = formatPrice(raw.originalSellingPrice, baseCurrency);
  } else {
    originalPriceDisplay = undefined;
  }

  return {
    id: raw.id || "",
    name: raw.name || "",
    href: raw.href || `/pages/product-detail.html?id=${raw.id}`,
    price: priceDisplay,
    moq: raw.moq || "1 adet",
    stats: "",
    imageKind: "jewelry",
    imageSrc: raw.imageSrc || undefined,
    images: raw.images || undefined,
    promo: raw.promo || raw.sellingPoint || undefined,
    verified: raw.verified,
    supplierYears: raw.supplierYears,
    supplierCountry: raw.supplierCountry,
    rating: raw.rating,
    reviewCount: raw.reviewCount,
    originalPrice: originalPriceDisplay,
    discount: raw.discount || undefined,
    supplierName: raw.supplierName || undefined,
    sellingPoint: raw.sellingPoint || undefined,
    category: raw.categoryName || raw.category || undefined,
    discountPercentage:
      typeof raw.discountPercentage === "number"
        ? raw.discountPercentage
        : raw.discountPercentage
          ? Number(raw.discountPercentage)
          : undefined,
    brand: raw.brand || undefined,
    brandName: raw.brandName || undefined,
    brandSlug: raw.brandSlug || undefined,
    brandLogo: raw.brandLogo || undefined,
    outOfStock: !!raw.outOfStock,
    status: raw.status || undefined,
  };
}

function isVideoFileUrl(url: string): boolean {
  if (!url) return false;
  // YouTube/Vimeo URLs are handled separately as embeds; mark them as video too
  if (/youtube\.com|youtu\.be|vimeo\.com/i.test(url)) return true;
  return /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(url);
}

function mapListingDetail(raw: any): ProductDetail {
  // Map images — auto-detect video files by extension so uploaded .mp4/.webm
  // files in the gallery render as video slides, not broken <img> tags.
  const images: ProductImage[] = (raw.images || []).map((src: string, i: number) => ({
    id: `img-${i + 1}`,
    src: src || "",
    alt: `${raw.title || ""} - ${i + 1}`,
    isVideo: isVideoFileUrl(src),
  }));

  // Promo video is appended as a pseudo-image at the end of the gallery so
  // it becomes a regular slide (with a play-icon thumbnail + iframe in main area).
  if (raw.videoUrl) {
    images.push({
      id: "video-main",
      src: raw.videoUrl,
      alt: `${raw.title || ""} - Video`,
      isVideo: true,
    });
  }

  // Map price tiers with currency conversion
  const baseCur = raw.currency || "USD";
  const selectedCur = getSelectedCurrencyInfo();
  const priceTiers: PriceTier[] = (raw.priceTiers || []).map((t: any) => ({
    minQty: t.minQty,
    maxQty: t.maxQty,
    price: convertPrice(t.price, baseCur),
    basePrice: t.price,
    // When a campaign is active, backend sets t.originalPrice to the
    // pre-discount tier price. The detail page renders it as strikethrough.
    originalPrice:
      typeof t.originalPrice === "number" ? convertPrice(t.originalPrice, baseCur) : undefined,
    currency: selectedCur.code,
  }));

  // Map variants
  const variants: ProductVariant[] = (raw.variants || []).map((v: any, vIndex: number) => {
    const nameLower = (v.name || "").toLowerCase();
    let type: "color" | "size" | "material" = "material";
    if (nameLower.includes("renk") || nameLower.includes("color") || nameLower.includes("colour")) {
      type = "color";
    } else if (
      nameLower.includes("beden") ||
      nameLower.includes("boyut") ||
      nameLower.includes("size") ||
      nameLower.includes("uzunlu")
    ) {
      type = "size";
    } else if (v.type === "image" && vIndex === 0) {
      // Only treat as 'color' if it's the first variant group (primary axis)
      // Other image axes (e.g. Material with photos) stay as 'material'
      type = "color";
    }
    return {
      type,
      label: v.name,
      options: (v.options || []).map((o: any, i: number) => ({
        id: o.variantId || `${v.name}-${i}`,
        label: o.label,
        value: o.value,
        thumbnail: o.image || undefined,
        available: o.available !== false,
        rawPrice: o.price || undefined,
        price: o.price ? convertPrice(o.price, baseCur) : undefined,
        priceAddon: o.priceAddon ? convertPrice(o.priceAddon, baseCur) : 0,
        basePriceAddon: o.priceAddon || 0,
        images: Array.isArray(o.images) && o.images.length > 0 ? o.images : undefined,
        videoUrl: o.videoUrl || undefined,
        title: o.title || undefined,
        sku: o.sku || undefined,
        isDefault: !!o.isDefault,
      })),
      skuMatrix: Array.isArray(v.skuMatrix) ? v.skuMatrix : undefined,
    };
  });

  // Map specs
  const specs: ProductSpec[] = (raw.specs || []).map((s: any) => ({
    key: s.label,
    value: s.value,
  }));

  // Map packaging specs
  const packagingSpecs: ProductSpec[] = (raw.packagingSpecs || []).map((s: any) => ({
    key: s.label,
    value: s.value,
  }));

  // Map shipping with currency conversion
  const shipping: ShippingInfo[] = (raw.shipping || []).map((s: any) => ({
    method: s.method,
    estimatedDays: s.estimatedDays || "",
    cost:
      typeof s.cost === "number"
        ? formatPrice(s.cost, s.currency || baseCur)
        : String(s.cost || ""),
    baseCost: typeof s.cost === "number" ? s.cost : 0,
    baseCurrency: s.currency || baseCur,
  }));

  // Map supplier — verified == kybVerified (eski is_verified field'ı silindi)
  const supplierVerified = raw.supplier?.kybVerified ?? raw.supplier?.verified ?? false;
  const supplier: SupplierInfo = raw.supplier
    ? {
        id: raw.supplier.sellerCode || raw.supplier.name || "",
        name: raw.supplier.display_name || raw.supplier.name || "",
        verified: supplierVerified,
        kybVerified: supplierVerified,
        country: raw.supplier.country || "",
        yearsInBusiness: raw.supplier.yearsInBusiness || 0,
        responseTime: raw.supplier.responseTime || "",
        responseRate: raw.supplier.responseRate ? `${raw.supplier.responseRate}%` : "",
        onTimeDelivery: raw.supplier.onTimeDelivery ? `${raw.supplier.onTimeDelivery}%` : "",
        mainProducts: raw.supplier.mainProducts || [],
        employees: raw.supplier.employees || "",
        annualRevenue: raw.supplier.annualRevenue || "",
        certifications: raw.supplier.certifications || [],
      }
    : {
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
      };

  // Map customization options
  const customizationOptions: CustomizationOption[] = (raw.customizationOptions || []).map(
    (o: any) => ({
      name: o.name,
      priceAddon: o.additionalCost ? `+${formatPrice(o.additionalCost, baseCur)}/adet` : "",
      minOrder: o.minQty ? `${o.minQty} adet` : "",
    })
  );

  return {
    id: raw.id,
    title: raw.title || "",
    category: raw.category || [],
    productCategoryId: raw.productCategoryId || "",
    images,
    priceTiers,
    ...derivePriceRange(raw, priceTiers, variants, baseCur),
    moq: raw.moq || 1,
    sellInMoqMultiples: !!raw.sellInMoqMultiples,
    unit: raw.unit || "adet",
    leadTime: raw.leadTime || "",
    shipping,
    variants,
    specs,
    packagingSpecs,
    description: raw.description || "",
    packaging:
      packagingSpecs.length > 0
        ? `<table class="w-full text-sm"><tbody>${packagingSpecs
            .map(
              (s, i) =>
                `<tr style="${i < packagingSpecs.length - 1 ? "border-bottom: 1px solid var(--pd-spec-border, #e5e5e5);" : ""}">
            <td class="py-2.5 font-medium" style="color: var(--pd-spec-key-color, #6b7280); width: 35%; padding-left: 12px;">${s.key}</td>
            <td class="py-2.5 pl-4" style="color: var(--pd-spec-value-color, #111827);">${s.value}</td>
          </tr>`
            )
            .join("")}</tbody></table>`
        : "",
    rating: raw.rating || 0,
    reviewCount: raw.reviewCount || 0,
    orderCount: raw.orderCount ? Number(raw.orderCount).toLocaleString("tr-TR") : "0",
    reviews: [],
    samplePrice: raw.samplePrice ? convertPrice(raw.samplePrice, baseCur) : undefined,
    baseSamplePrice: raw.samplePrice || undefined,
    baseCurrency: baseCur,
    supplier,
    sellerKybVerified: raw.sellerKybVerified ?? supplier.kybVerified ?? false,
    faq: [],
    leadTimeRanges: (raw.leadTimeRanges || []).map((r: any) => ({
      quantityRange: r.quantityRange || "",
      days: r.days || "",
    })),
    customizationOptions,
    reviewCategoryRatings: [],
    storeReviewCount: 0,
    reviewMentionTags: [],
    specGroups: (raw.specGroups || []).map((g: any) => ({
      code: g.code || "",
      label: g.label || "Genel",
      items: (g.items || []).map((it: any) => ({ label: it.label, value: it.value })),
    })),
    brandInfo: raw.brandInfo
      ? {
          code: raw.brandInfo.code || "",
          name: raw.brandInfo.name || "",
          slug: raw.brandInfo.slug || "",
          logo: raw.brandInfo.logo || "",
          isApproved: !!raw.brandInfo.isApproved,
        }
      : null,
    productTypeName: raw.productTypeName || undefined,
    productFamilyName: raw.productFamilyName || undefined,
    attributeSetName: raw.attributeSetName || undefined,
    videoUrl: raw.videoUrl || undefined,
    outOfStock: !!raw.outOfStock,
    status: raw.status || undefined,
    inStock: raw.inStock !== undefined ? !!raw.inStock : undefined,
    stockQty: typeof raw.stockQty === "number" ? raw.stockQty : undefined,
  };
}

// ── Tailored Selections ──────────────────────────────────────────────────────

export interface TailoredGroup {
  slug: string;
  categoryId: string;
  name: string;
  image: string;
  parent: string | null;
  viewsCount: number;
  editorialText: string;
  badge: "personal" | "trend" | "quality" | null;
  products: ProductListingCard[];
}

export interface TailoredSelectionsResult {
  limit: number;
  personalized: boolean;
  isGuest: boolean;
  groups: TailoredGroup[];
  total: number;
}

export interface TailoredGroupDetailResult {
  page: number;
  pageSize: number;
  hasNext: boolean;
  products: ProductListingCard[];
  category: {
    slug: string;
    name: string;
    image: string;
    categoryId: string;
  };
  subCategories: Array<{ slug: string; name: string }>;
}

/**
 * Get the Tailored Selections block (9 personalized group cards) for the
 * landing page. Falls back to global top categories for guests or users
 * below the interaction threshold.
 */
export async function getTailoredSelections(limit = 9): Promise<TailoredSelectionsResult> {
  const qs = new URLSearchParams({ limit: String(limit) });
  const response = await api<{
    message: TailoredSelectionsResult & {
      groups: Array<Omit<TailoredGroup, "products"> & { products: any[] }>;
    };
  }>(`/method/tradehub_core.api.tailored.get_tailored_selections?${qs.toString()}`);
  const msg = response.message;
  return {
    limit: msg.limit,
    personalized: msg.personalized,
    isGuest: msg.isGuest,
    total: msg.total,
    groups: (msg.groups || []).map((g) => ({
      slug: g.slug,
      categoryId: g.categoryId,
      name: g.name,
      image: g.image,
      parent: g.parent,
      viewsCount: (g as any).viewsCount || 0,
      editorialText: (g as any).editorialText || "",
      badge: (g as any).badge || null,
      products: (g.products || []).map(mapListingCard),
    })),
  };
}

/**
 * Get a single Tailored Selections group's full product list (detail page).
 * Supports optional sub-category filtering and pagination.
 */
export async function getTailoredGroupDetail(
  category: string,
  options: { subcategory?: string; page?: number; pageSize?: number } = {}
): Promise<TailoredGroupDetailResult> {
  const { subcategory, page = 1, pageSize = 20 } = options;
  const qs = new URLSearchParams({
    category,
    page: String(page),
    page_size: String(pageSize),
  });
  if (subcategory) qs.set("subcategory", subcategory);
  const response = await api<{ message: TailoredGroupDetailResult & { products: any[] } }>(
    `/method/tradehub_core.api.tailored.get_tailored_group_detail?${qs.toString()}`
  );
  const msg = response.message;
  return {
    page: msg.page,
    pageSize: msg.pageSize || (msg as any).page_size,
    hasNext: msg.hasNext || (msg as any).has_next,
    products: (msg.products || []).map(mapListingCard),
    category: msg.category,
    subCategories: msg.subCategories || (msg as any).sub_categories || [],
  };
}
