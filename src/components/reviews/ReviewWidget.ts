/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Alpine.js modül tipleri tam değil; runtime davranış doğrulanmış
/**
 * Faz 5 — Mobile-first Review Widget (Alpine.js component)
 *
 * Tek bir self-contained component: summary + reviews list + Q&A + form.
 * `<div x-data="rv5Widget('LST-00002')" x-init="init()">` ile mount edilir.
 *
 * CSS: src/styles/reviews-v5.css
 * API: src/api/reviewsApi.ts
 *
 * NOT: ts-nocheck Alpine.js `this` binding'i runtime'da çözüldüğü için.
 * Mevcut tradehubfront pattern'iyle uyumlu.
 */

import { reviewsApi } from "../../api/reviewsApi";
import type { QAItem, ReviewItem, ReviewSummary, StorefrontPage } from "../../api/reviewsApi";

const FILLED_STAR = "★";
const EMPTY_STAR = "☆";

function stars(n: number, max = 5): string {
  const rounded = Math.round(Math.max(0, Math.min(max, n)));
  return FILLED_STAR.repeat(rounded) + EMPTY_STAR.repeat(max - rounded);
}

function initials(name: string): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
}

function tierClass(tier: string): string {
  return "rv5-tier-" + tier.replace(/\s+/g, "-");
}

function formatDate(s?: string): string {
  if (!s) return "";
  try {
    return new Date(s).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return s;
  }
}

export interface WidgetState {
  listing: string;
  loading: boolean;
  error: string;
  summary: ReviewSummary | null;
  reviews: ReviewItem[];
  qa: QAItem[];
  total: number;
  page: number;
  pageSize: number;
  sortBy: "recent" | "high" | "low" | "helpful";
  onlyVerified: boolean;
  qaTotal: number;
  // UI state
  showSheet: boolean;
  showQaSheet: boolean;
  formRating: number;
  formTitle: string;
  formBody: string;
  formOrderItem: string;
  submitting: boolean;
  translatedReviews: Record<string, { title?: string; body: string; translator: string }>;
}

/**
 * Alpine.data() factory.
 *
 * Usage:
 *   import { rv5WidgetFactory } from "./components/reviews/ReviewWidget";
 *   Alpine.data("rv5Widget", rv5WidgetFactory);
 *
 *   <div x-data="rv5Widget('LST-00002')" x-init="init()"> ... </div>
 */
export function rv5WidgetFactory(listing: string): WidgetState & Record<string, unknown> {
  return {
    listing,
    loading: false,
    error: "",
    summary: null,
    reviews: [],
    qa: [],
    total: 0,
    page: 1,
    pageSize: 10,
    sortBy: "recent",
    onlyVerified: false,
    qaTotal: 0,
    showSheet: false,
    showQaSheet: false,
    formRating: 5,
    formTitle: "",
    formBody: "",
    formOrderItem: "",
    submitting: false,
    translatedReviews: {},

    // Helpers exposed to template
    stars,
    initials,
    tierClass,
    formatDate,

    async init() {
      await this.loadPage();
    },

    async loadPage() {
      this.loading = true;
      this.error = "";
      try {
        const p = (await reviewsApi.getPage(this.listing, {
          page: this.page,
          pageSize: this.pageSize,
          sortBy: this.sortBy,
          onlyVerified: this.onlyVerified,
        })) as StorefrontPage;
        this.summary = p.summary;
        this.reviews = p.reviews;
        this.total = p.total;
        this.qaTotal = p.qa_total;
      } catch (e) {
        this.error = (e as Error).message || "Yorumlar yüklenemedi";
      } finally {
        this.loading = false;
      }
    },

    async loadQA() {
      try {
        const r = (await reviewsApi.getQA(this.listing)) as {
          questions: QAItem[];
          total: number;
        };
        this.qa = r.questions;
      } catch (e) {
        this.error = (e as Error).message;
      }
    },

    setSort(s: "recent" | "high" | "low" | "helpful") {
      this.sortBy = s;
      this.page = 1;
      void this.loadPage();
    },

    toggleVerified() {
      this.onlyVerified = !this.onlyVerified;
      this.page = 1;
      void this.loadPage();
    },

    nextPage() {
      if (this.page * this.pageSize < this.total) {
        this.page += 1;
        void this.loadPage();
      }
    },

    prevPage() {
      if (this.page > 1) {
        this.page -= 1;
        void this.loadPage();
      }
    },

    async voteHelpful(reviewName: string, vote: "helpful" | "not_helpful") {
      try {
        await reviewsApi.voteHelpful(reviewName, vote);
        const r = this.reviews.find((x) => x.name === reviewName);
        if (r) {
          if (vote === "helpful") r.helpful_count += 1;
          else r.not_helpful_count += 1;
        }
      } catch (e) {
        this.error = (e as Error).message;
      }
    },

    async translate(reviewName: string, targetLang = "tr") {
      try {
        const r = (await reviewsApi.translateReview(reviewName, targetLang)) as {
          translated_title?: string;
          translated_body: string;
          translator: string;
        };
        this.translatedReviews[reviewName] = {
          title: r.translated_title,
          body: r.translated_body,
          translator: r.translator,
        };
      } catch (e) {
        this.error = (e as Error).message;
      }
    },

    openSheet(orderItem = "") {
      this.formOrderItem = orderItem;
      this.formRating = 5;
      this.formTitle = "";
      this.formBody = "";
      this.showSheet = true;
    },

    closeSheet() {
      this.showSheet = false;
    },

    openQaSheet() {
      this.showQaSheet = true;
      if (!this.qa.length) void this.loadQA();
    },

    closeQaSheet() {
      this.showQaSheet = false;
    },

    async submitForm() {
      if (!this.formOrderItem) {
        this.error = "Sipariş kalemi seçilmedi";
        return;
      }
      if (this.formBody.trim().length < 10) {
        this.error = "Yorum en az 10 karakter olmalı";
        return;
      }
      this.submitting = true;
      this.error = "";
      try {
        await reviewsApi.submitReview({
          order_item: this.formOrderItem,
          rating: this.formRating,
          title: this.formTitle || undefined,
          body: this.formBody,
        });
        this.closeSheet();
        await this.loadPage();
      } catch (e) {
        this.error = (e as Error).message;
      } finally {
        this.submitting = false;
      }
    },
  } as unknown as WidgetState & Record<string, unknown>;
}

/**
 * HTML template — render edilen widget'in inner HTML'i.
 *
 * Bu fonksiyon string döndürür; sayfaya `innerHTML` ile veya
 * Alpine'in `x-html` ile inject edilebilir.
 *
 * Gerçek pages/product-detail.html'e şu şekilde eklenir:
 *
 *   <link rel="stylesheet" href="/src/styles/reviews-v5.css">
 *   <div id="reviews-mount"></div>
 *   <script type="module">
 *     import Alpine from 'alpinejs';
 *     import { rv5WidgetFactory, renderWidget } from "/src/components/reviews/ReviewWidget";
 *     Alpine.data('rv5Widget', rv5WidgetFactory);
 *     document.getElementById('reviews-mount').innerHTML = renderWidget('LST-00002');
 *     Alpine.start();
 *   </script>
 */
export function renderWidget(listing: string): string {
  return `
<div class="rv5-container" x-data="rv5Widget('${listing}')" x-init="init()">
  <template x-if="loading"><div class="rv5-loading">Yükleniyor…</div></template>
  <template x-if="error"><div class="rv5-empty" x-text="error"></div></template>

  <template x-if="!loading && summary">
    <div>
      <!-- Summary Card -->
      <div class="rv5-summary">
        <div class="rv5-summary-head">
          <div class="rv5-summary-rating" x-text="summary.weighted_rating?.toFixed(1) || '0.0'"></div>
          <div class="rv5-summary-meta">
            <div class="rv5-stars" x-text="stars(summary.weighted_rating)"></div>
            <div class="rv5-summary-count">
              <span x-text="summary.review_count"></span> yorum
            </div>
          </div>
        </div>

        <!-- Distribution -->
        <div class="rv5-dist">
          <template x-for="i in [5,4,3,2,1]" :key="i">
            <div class="rv5-dist-row">
              <span class="rv5-dist-label" x-text="i + '★'"></span>
              <div class="rv5-dist-bar">
                <div class="rv5-dist-fill"
                  :style="\`width: \${summary.review_count ? (summary.rating_distribution[String(i)] / summary.review_count * 100) : 0}%\`"></div>
              </div>
              <span class="rv5-dist-count" x-text="summary.rating_distribution[String(i)] || 0"></span>
            </div>
          </template>
        </div>

        <!-- Trust Signals -->
        <div class="rv5-trust">
          <span class="rv5-trust-badge" x-show="summary.trust_signals.verified_purchase_pct > 0">
            🛡 <span x-text="Math.round(summary.trust_signals.verified_purchase_pct) + '% doğrulanmış'"></span>
          </span>
          <span class="rv5-trust-badge" x-show="summary.trust_signals.kyb_verified_pct > 0">
            ✓ <span x-text="Math.round(summary.trust_signals.kyb_verified_pct) + '% KYB'"></span>
          </span>
          <span class="rv5-trust-badge" x-show="summary.trust_signals.trusted_reviewer_pct > 0">
            👑 <span x-text="Math.round(summary.trust_signals.trusted_reviewer_pct) + '% Trusted'"></span>
          </span>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="rv5-toolbar" role="toolbar">
        <button class="rv5-chip" :class="sortBy==='recent' && 'is-active'" @click="setSort('recent')">Yeni</button>
        <button class="rv5-chip" :class="sortBy==='helpful' && 'is-active'" @click="setSort('helpful')">Faydalı</button>
        <button class="rv5-chip" :class="sortBy==='high' && 'is-active'" @click="setSort('high')">En Yüksek</button>
        <button class="rv5-chip" :class="sortBy==='low' && 'is-active'" @click="setSort('low')">En Düşük</button>
        <button class="rv5-chip" :class="onlyVerified && 'is-active'" @click="toggleVerified()">Doğrulanmış</button>
      </div>

      <!-- Review List -->
      <template x-if="!reviews.length">
        <div class="rv5-empty">Henüz yorum yok.</div>
      </template>
      <template x-for="r in reviews" :key="r.name">
        <article class="rv5-card">
          <div class="rv5-card-head">
            <div class="rv5-reviewer">
              <div class="rv5-avatar" x-text="initials(r.reviewer_display_name)"></div>
              <div class="rv5-reviewer-info">
                <span class="rv5-reviewer-name" x-text="r.reviewer_display_name"></span>
                <span class="rv5-reviewer-tier" :class="tierClass(r.reviewer.tier)"
                  x-text="r.reviewer.tier + ' • ' + formatDate(r.published_at)"></span>
              </div>
            </div>
            <span class="rv5-stars" x-text="stars(r.rating)"></span>
          </div>

          <template x-if="r.title">
            <h4 class="rv5-title" x-text="r.title"></h4>
          </template>
          <p class="rv5-body" x-text="(translatedReviews[r.name] && translatedReviews[r.name].body) || r.body"></p>

          <!-- Images -->
          <template x-if="r.images && r.images.length">
            <div class="rv5-images">
              <template x-for="img in r.images" :key="img.image">
                <div class="rv5-image" :style="\`background-image: url(\${img.image})\`"></div>
              </template>
            </div>
          </template>

          <!-- Aspects -->
          <template x-if="r.aspects.product_quality || r.aspects.service || r.aspects.shipping">
            <div class="rv5-aspects">
              <template x-if="r.aspects.product_quality">
                <div class="rv5-aspect"><span class="rv5-aspect-label">Kalite</span><span class="rv5-aspect-stars" x-text="stars(r.aspects.product_quality)"></span></div>
              </template>
              <template x-if="r.aspects.service">
                <div class="rv5-aspect"><span class="rv5-aspect-label">Hizmet</span><span class="rv5-aspect-stars" x-text="stars(r.aspects.service)"></span></div>
              </template>
              <template x-if="r.aspects.shipping">
                <div class="rv5-aspect"><span class="rv5-aspect-label">Kargo</span><span class="rv5-aspect-stars" x-text="stars(r.aspects.shipping)"></span></div>
              </template>
              <template x-if="r.aspects.spec_match">
                <div class="rv5-aspect"><span class="rv5-aspect-label">Spec Uyum</span><span class="rv5-aspect-stars" x-text="stars(r.aspects.spec_match)"></span></div>
              </template>
              <template x-if="r.aspects.documentation">
                <div class="rv5-aspect"><span class="rv5-aspect-label">Belge</span><span class="rv5-aspect-stars" x-text="stars(r.aspects.documentation)"></span></div>
              </template>
            </div>
          </template>

          <!-- Reply -->
          <template x-if="r.reply">
            <div class="rv5-reply">
              <div class="rv5-reply-head">
                <span>💬 Satıcı yanıtı</span>
                <span class="rv5-reply-sla" x-text="(r.reply.within_hours||0).toFixed(1) + ' saat'"></span>
              </div>
              <div x-text="r.reply.body"></div>
            </div>
          </template>

          <!-- Actions -->
          <div class="rv5-actions">
            <button class="rv5-action" @click="voteHelpful(r.name, 'helpful')">
              👍 <span x-text="r.helpful_count"></span>
            </button>
            <button class="rv5-action" @click="voteHelpful(r.name, 'not_helpful')">
              👎 <span x-text="r.not_helpful_count"></span>
            </button>
            <button class="rv5-action" @click="translate(r.name)">🌐 Çevir</button>
            <template x-if="r.is_verified_purchase">
              <span class="rv5-trust-badge">🛡 Doğrulanmış</span>
            </template>
            <template x-if="r.is_kyb_verified">
              <span class="rv5-trust-badge">✓ KYB</span>
            </template>
          </div>
        </article>
      </template>

      <!-- Pagination -->
      <div class="rv5-pagination">
        <button class="rv5-pagination-btn" :disabled="page<=1" @click="prevPage()">← Önceki</button>
        <span style="align-self:center;font-size:0.875rem;color:#6b7280">
          <span x-text="page"></span> / <span x-text="Math.ceil(total/pageSize) || 1"></span>
        </span>
        <button class="rv5-pagination-btn" :disabled="page*pageSize>=total" @click="nextPage()">Sonraki →</button>
      </div>

      <!-- Q&A Section -->
      <div class="rv5-qa">
        <h3 class="rv5-qa-title">
          Soru-Cevap (<span x-text="qaTotal"></span>)
          <button class="rv5-chip" style="margin-left:0.5rem" @click="openQaSheet()">Tümünü Gör</button>
        </h3>
      </div>

      <!-- FAB: yorum yaz -->
      <button class="rv5-fab" @click="openSheet()" aria-label="Yorum yaz">✏️</button>

      <!-- Bottom Sheet: Form -->
      <template x-if="showSheet">
        <div class="rv5-sheet-backdrop" @click.self="closeSheet()">
          <div class="rv5-sheet">
            <div class="rv5-sheet-handle"></div>
            <h3 class="rv5-sheet-title">Yorum yaz</h3>
            <div class="rv5-form-field">
              <label class="rv5-form-label">Sipariş Kalemi ID</label>
              <input class="rv5-form-input" x-model="formOrderItem" placeholder="ör. 29">
            </div>
            <div class="rv5-form-field">
              <label class="rv5-form-label">Puan</label>
              <div class="rv5-form-rating">
                <template x-for="i in [1,2,3,4,5]" :key="i">
                  <span class="rv5-form-rating-star" :class="formRating>=i && 'is-filled'" @click="formRating=i">★</span>
                </template>
              </div>
            </div>
            <div class="rv5-form-field">
              <label class="rv5-form-label">Başlık (opsiyonel)</label>
              <input class="rv5-form-input" x-model="formTitle" maxlength="140">
            </div>
            <div class="rv5-form-field">
              <label class="rv5-form-label">Yorum (min 10 karakter)</label>
              <textarea class="rv5-form-textarea" x-model="formBody"></textarea>
            </div>
            <button class="rv5-form-submit" :disabled="submitting || formBody.length<10" @click="submitForm()">
              <span x-text="submitting ? 'Gönderiliyor…' : 'Gönder'"></span>
            </button>
          </div>
        </div>
      </template>

      <!-- Bottom Sheet: Q&A -->
      <template x-if="showQaSheet">
        <div class="rv5-sheet-backdrop" @click.self="closeQaSheet()">
          <div class="rv5-sheet">
            <div class="rv5-sheet-handle"></div>
            <h3 class="rv5-sheet-title">Soru-Cevap</h3>
            <template x-if="!qa.length">
              <div class="rv5-empty">Henüz soru yok.</div>
            </template>
            <template x-for="q in qa" :key="q.name">
              <div class="rv5-qa-item">
                <div class="rv5-qa-question" x-text="q.question"></div>
                <template x-for="a in q.answers" :key="a.name">
                  <div class="rv5-qa-answer" :class="a.is_seller_answer && 'is-seller'" x-text="a.answer"></div>
                </template>
              </div>
            </template>
          </div>
        </div>
      </template>
    </div>
  </template>
</div>
`.trim();
}
