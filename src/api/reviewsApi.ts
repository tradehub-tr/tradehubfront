/**
 * Faz 5 — Review API Client (typed wrapper)
 *
 * Mobile-first storefront için Frappe TradeHub backend'ine bağlanır.
 * Tüm endpoint'ler `tradehub_core.api.storefront_api` ve diğer modüllere
 * proxy'lenmiştir. Rate-limited.
 */

const FRAPPE_BASE =
  (import.meta as unknown as { env?: { VITE_FRAPPE_URL?: string } }).env
    ?.VITE_FRAPPE_URL || "http://localhost:8000";

type FrappeResponse<T> = { message: T };

async function call<T>(method: string, params: Record<string, unknown> = {}, opts: {
  method?: "GET" | "POST";
  withCSRF?: boolean;
} = {}): Promise<T> {
  const httpMethod = opts.method ?? "GET";
  const url = new URL(`${FRAPPE_BASE}/api/method/${method}`);
  let body: string | undefined;
  const headers: Record<string, string> = { "X-Requested-With": "XMLHttpRequest" };

  if (httpMethod === "GET") {
    for (const [k, v] of Object.entries(params)) {
      if (v != null) url.searchParams.set(k, String(v));
    }
  } else {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    const form = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v != null) {
        form.set(k, typeof v === "object" ? JSON.stringify(v) : String(v));
      }
    }
    body = form.toString();
    if (opts.withCSRF) {
      const csrf = (window as unknown as { csrf_token?: string }).csrf_token;
      if (csrf) headers["X-Frappe-CSRF-Token"] = csrf;
    }
  }

  const res = await fetch(url.toString(), {
    method: httpMethod,
    credentials: "include",
    headers,
    body,
  });
  if (!res.ok) {
    let errorText = `${res.status} ${res.statusText}`;
    try {
      const j = await res.json();
      errorText = j._error_message || j.exc || errorText;
    } catch {
      /* ignore */
    }
    throw new Error(errorText);
  }
  const data = (await res.json()) as FrappeResponse<T>;
  return data.message;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface ReviewSummary {
  average_rating: number;
  weighted_rating: number;
  review_count: number;
  weighted_review_count: number;
  rating_distribution: Record<"1" | "2" | "3" | "4" | "5", number>;
  verified_purchase_count: number;
  kyb_verified_count: number;
  aspect_averages: Record<string, number>;
  trust_signals: {
    verified_purchase_pct: number;
    kyb_verified_pct: number;
    trusted_reviewer_pct: number;
    avg_review_age_days: number;
  };
}

export interface ReviewItem {
  name: string;
  reviewer_display_name: string;
  rating: number;
  title?: string;
  body: string;
  is_verified_purchase: number;
  is_kyb_verified: number;
  published_at: string;
  submitted_at: string;
  edited: boolean;
  video_url?: string;
  helpful_count: number;
  not_helpful_count: number;
  images: Array<{ image: string; caption?: string }>;
  aspects: {
    product_quality: number | null;
    service: number | null;
    shipping: number | null;
    spec_match: number | null;
    documentation: number | null;
  };
  reply: { body: string; at: string; within_hours: number } | null;
  reviewer: { tier: string; score: number };
}

export interface StorefrontPage {
  summary: ReviewSummary;
  reviews: ReviewItem[];
  total: number;
  page: number;
  page_size: number;
  qa_total: number;
}

export interface QAItem {
  name: string;
  asker_display_name: string;
  is_kyb_verified: number;
  question: string;
  answer_count: number;
  helpful_count: number;
  submitted_at: string;
  status: string;
  answers: Array<{
    name: string;
    responder_type: string;
    is_seller_answer: boolean;
    helpful_count: number;
    submitted_at: string;
    answer: string;
  }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// API surface
// ─────────────────────────────────────────────────────────────────────────────
export const reviewsApi = {
  getPage(listing: string, opts: {
    page?: number;
    pageSize?: number;
    sortBy?: "recent" | "high" | "low" | "helpful";
    onlyVerified?: boolean;
  } = {}): Promise<StorefrontPage> {
    return call<StorefrontPage>("tradehub_core.api.storefront_api.get_storefront_review_page", {
      listing,
      page: opts.page ?? 1,
      page_size: opts.pageSize ?? 10,
      sort_by: opts.sortBy ?? "recent",
      only_verified: opts.onlyVerified ? 1 : 0,
    });
  },

  getQA(listing: string, page = 1): Promise<{ questions: QAItem[]; total: number }> {
    return call("tradehub_core.api.storefront_api.get_qa_page", { listing, page });
  },

  submitReview(payload: {
    order_item: string;
    rating: number;
    body: string;
    title?: string;
    images?: Array<{ image: string; caption?: string }>;
    video_url?: string;
    aspects?: Record<string, number>;
    template_answers?: Record<string, unknown>;
  }) {
    return call(
      "tradehub_core.api.storefront_api.submit_review",
      payload as unknown as Record<string, unknown>,
      { method: "POST", withCSRF: true },
    );
  },

  submitQuestion(listing: string, question: string) {
    return call("tradehub_core.api.storefront_api.submit_question",
      { listing, question }, { method: "POST", withCSRF: true });
  },

  submitAnswer(question: string, answer: string) {
    return call("tradehub_core.api.storefront_api.submit_answer",
      { question, answer }, { method: "POST", withCSRF: true });
  },

  voteHelpful(review: string, vote: "helpful" | "not_helpful") {
    return call("tradehub_core.api.storefront_api.vote_helpful",
      { review, vote }, { method: "POST", withCSRF: true });
  },

  translateReview(review: string, targetLang = "tr") {
    return call("tradehub_core.api.storefront_api.translate_review",
      { review, target_lang: targetLang });
  },

  reportAbuse(review: string, reason: string, note?: string) {
    return call("tradehub_core.api.storefront_api.report_abuse",
      { review, reason, note }, { method: "POST", withCSRF: true });
  },

  getCategoryTemplate(listing: string) {
    return call<{ template: string | null; questions: Array<{
      key: string; label: string; field_type: string; required: boolean;
    }> }>(
      "tradehub_core.api.storefront_api.get_category_template",
      { listing },
    );
  },

  getMyReviews(page = 1) {
    return call("tradehub_core.api.storefront_api.get_my_reviews", { page });
  },
};
