/**
 * InquiriesLayout Component
 * iSTOC-style "My Inquiries" + "My RFQs" dashboard.
 * Two tabs — data fetched from real API.
 */

import { t } from "../../i18n";
import {
  getCsrfToken,
  checkEmailNotVerifiedResponse,
  isEmailNotVerifiedError,
} from "../../utils/api";
import { showToast } from "../../utils/toast";
import {
  type RfqAttachment,
  fetchRfqAttachments,
  renderAttachmentModal,
  renderAttachmentsCompact,
  setupAttachmentInteractions,
} from "../rfq/attachments";
import { initCurrency, getExchangeRate } from "../../services/currencyService";

// ── Types (matching API response) ────────────────────────────────────────────

interface Inquiry {
  name: string;
  message: string;
  status: string;
  seller: string;
  sender_name: string;
  sender_email: string;
  creation: string;
  seller_name: string;
  seller_company: string;
}

interface RFQItem {
  name: string;
  product_name: string;
  status: string;
  quantity: number;
  unit: string;
  quote_count: number;
  attachment_count: number;
  creation: string;
  modified: string;
  quotation_from: string;
  quote_summary: Record<string, number>;
}

interface SellerRFQItem {
  name: string;
  product_name: string;
  description: string;
  status: string;
  quantity: number;
  unit: string;
  category: string;
  quote_count: number;
  buyer: string;
  buyer_name: string;
  creation: string;
  my_quote: string;
}

interface MyQuoteItem {
  name: string;
  rfq: string;
  rfq_product_name: string;
  rfq_quantity: number;
  rfq_unit: string;
  price_per_unit: number;
  total_price: number;
  currency: string;
  lead_time_days: number;
  message: string;
  status: string;
  creation: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function avatarPlaceholder(name: string): string {
  if (!name) return `<div class="w-10 h-10 rounded-full bg-gray-200 shrink-0"></div>`;
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return `<div class="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0">${initials}</div>`;
}

function statusBadge(status: string): string {
  const colors: Record<string, string> = {
    Pending: "bg-yellow-100 text-yellow-800",
    Approved: "bg-green-100 text-green-800",
    Closed: "bg-gray-100 text-gray-600",
    Rejected: "bg-red-100 text-red-700",
    Completed: "bg-blue-100 text-blue-700",
  };
  const labels: Record<string, () => string> = {
    Pending: () => t("inquiries.statusPending"),
    Approved: () => t("inquiries.statusApproved"),
    Closed: () => t("inquiries.statusClosed"),
    Rejected: () => t("inquiries.statusRejected"),
    Completed: () => t("inquiries.statusCompleted"),
  };
  return `<span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-600"}">${(labels[status] || (() => status))()}</span>`;
}

function emptyStateSvg(): string {
  return `<svg width="140" height="120" viewBox="0 0 140 120" fill="none">
    <rect x="20" y="30" width="80" height="60" rx="4" fill="#FFECD2"/>
    <path d="M20 38c0-4.4 3.6-8 8-8h20l8 8h36c4.4 0 8 3.6 8 8v44c0 4.4-3.6 8-8 8H28c-4.4 0-8-3.6-8-8V38z" fill="#FFD8A8" stroke="#F7A84B" stroke-width="1"/>
    <rect x="30" y="50" width="60" height="4" rx="2" fill="#F7A84B" opacity="0.3"/>
    <rect x="30" y="60" width="45" height="4" rx="2" fill="#F7A84B" opacity="0.3"/>
    <rect x="30" y="70" width="50" height="4" rx="2" fill="#F7A84B" opacity="0.3"/>
    <circle cx="110" cy="50" r="8" fill="#FFD8A8"/>
    <rect x="104" y="60" width="12" height="20" rx="4" fill="#F7A84B" opacity="0.6"/>
  </svg>`;
}

function loadingSpinner(): string {
  return `<div class="flex-1 flex items-center justify-center min-h-[400px]"><div class="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>`;
}

// ── Render functions ─────────────────────────────────────────────────────────

function renderInquiryList(inquiries: Inquiry[]): string {
  if (!inquiries.length) {
    return `<div class="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div class="w-[140px] h-[120px]">${emptyStateSvg()}</div>
      <p class="text-sm text-gray-500">${t("inquiries.emptyState")}</p>
    </div>`;
  }
  return `
    <div class="hidden sm:grid grid-cols-[1fr_1fr_auto] items-center px-5 py-2.5 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
      <span>${t("inquiries.inquiry")}</span><span>${t("inquiries.sendTo")}</span><span>${t("inquiries.action")}</span>
    </div>
    ${inquiries
      .map(
        (inq) => `
      <div class="inq-row sm:grid sm:grid-cols-[1fr_1fr_auto] sm:items-center px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-50 hover:bg-gray-50/60 transition-colors cursor-pointer" data-inquiry-id="${inq.name}">
        <div>
          <div class="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
            <span>${new Date(inq.creation).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}</span>
            <span class="text-gray-300 max-sm:hidden">|</span>
            <span>ID: ${inq.name}</span>
          </div>
          <p class="mt-1 text-sm text-gray-700 line-clamp-2">${inq.message}</p>
        </div>
        <div class="flex items-center gap-3 mt-2 sm:mt-0">
          ${avatarPlaceholder(inq.seller_name)}
          <div class="min-w-0">
            <p class="text-sm font-medium text-gray-800 truncate">${inq.seller_name}</p>
            <p class="text-xs text-gray-400 truncate">${inq.seller_company}</p>
          </div>
        </div>
        <button class="inq-detail-btn text-sm text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap mt-2 sm:mt-0" data-inquiry-id="${inq.name}">${t("inquiries.viewDetail")}</button>
      </div>
    `
      )
      .join("")}`;
}

function renderRfqList(rfqs: RFQItem[]): string {
  if (!rfqs.length) {
    return `<div class="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div class="w-[140px] h-[120px]">${emptyStateSvg()}</div>
      <p class="text-sm text-gray-500">${t("inquiries.emptyRfqState")}</p>
    </div>`;
  }
  return `
    <div class="hidden sm:grid grid-cols-[1fr_1fr_auto] items-center px-5 py-2.5 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
      <span>RFQ</span><span>${t("inquiries.quotationFrom")}</span><span>${t("inquiries.status")}</span>
    </div>
    ${rfqs
      .map(
        (rfq) => `
      <div class="rfq-row sm:grid sm:grid-cols-[1fr_1fr_auto] sm:items-center px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-50 hover:bg-gray-50/60 transition-colors cursor-pointer" data-rfq-id="${rfq.name}">
        <div>
          <div class="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
            <span>${new Date(rfq.creation).toLocaleDateString("tr-TR")}</span>
            <span class="text-gray-300">|</span>
            <span>ID: ${rfq.name}</span>
          </div>
          <p class="mt-1 text-sm font-medium text-gray-800">${rfq.product_name}</p>
          <p class="text-xs text-gray-500 flex items-center gap-2">
            <span>${rfq.quantity} ${rfq.unit}</span>
            ${
              rfq.attachment_count > 0
                ? `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[11px] font-semibold" title="${t("rfq.attachmentsTitle")}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3"><path d="m21 12-9.5 9.5a4 4 0 0 1-5.66 0 4 4 0 0 1 0-5.66l9.19-9.19a3 3 0 0 1 4.24 4.24L10.6 19.86a2 2 0 1 1-2.83-2.83l8.49-8.49"/></svg>${rfq.attachment_count}</span>`
                : ""
            }
          </p>
        </div>
        <div class="flex items-center gap-3 mt-2 sm:mt-0">
          ${
            rfq.quote_count > 0
              ? `<span class="text-sm">${(() => {
                  const s = rfq.quote_summary || {};
                  const parts: string[] = [];
                  if (s.Unseen)
                    parts.push(
                      `<span class="text-blue-600 font-semibold">${s.Unseen} ${t("inquiries.quoteNew")}</span>`
                    );
                  if (s.Accepted)
                    parts.push(
                      `<span class="text-green-600">${s.Accepted} ${t("inquiries.quoteAccepted")}</span>`
                    );
                  if (s.Rejected)
                    parts.push(
                      `<span class="text-red-500">${s.Rejected} ${t("inquiries.quoteRejected")}</span>`
                    );
                  if (s.Submitted && !s.Unseen)
                    parts.push(
                      `<span class="text-amber-600">${s.Submitted} ${t("inquiries.quoteSubmitted")}</span>`
                    );
                  return parts.length
                    ? parts.join(", ")
                    : `<strong>${rfq.quote_count}</strong> ${t("inquiries.quotesLabel")}`;
                })()}</span>`
              : '<span class="text-xs text-gray-300">—</span>'
          }
        </div>
        <div class="mt-2 sm:mt-0 flex flex-col items-end gap-1">
          ${statusBadge(rfq.status)}
          ${rfq.quote_count > 0 ? `<a href="/pages/dashboard/rfq-quotes.html?rfq=${rfq.name}" class="inline-flex items-center px-4 py-1.5 rounded-full bg-(--btn-bg,#f5b800) hover:bg-(--btn-hover-bg,#d39c00) active:bg-(--btn-hover-bg,#d39c00) text-(--btn-text,#1a1a1a) text-xs font-semibold border border-(--btn-border-color,#d39c00) shadow-[var(--btn-shadow,0_1px_0_#d39c00,inset_0_1px_0_rgba(255,255,255,0.3))] hover:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2),inset_-1px_-1px_2px_rgba(255,255,255,0.25)] active:shadow-[inset_3px_3px_7px_rgba(0,0,0,0.3),inset_-1px_-1px_2px_rgba(255,255,255,0.18)] active:scale-[0.98] transition-all duration-150">${t("rfq.viewQuotes")}</a>` : ""}
          <button class="rfq-detail-btn text-xs text-blue-600 hover:underline" data-rfq-id="${rfq.name}">${t("rfq.viewThisRfq")}</button>
        </div>
      </div>
    `
      )
      .join("")}`;
}

// ── Seller: RFQ Marketplace list ─────────────────────────────────────────────

function renderSellerRfqList(rfqs: SellerRFQItem[]): string {
  if (!rfqs.length) {
    return `<div class="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div class="w-[140px] h-[120px]">${emptyStateSvg()}</div>
      <p class="text-sm text-gray-500">${t("inquiries.noMatchingRfq")}</p>
    </div>`;
  }
  return `
    <div class="hidden sm:grid grid-cols-[1fr_auto_auto] items-center gap-x-4 px-5 py-2.5 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
      <span>${t("inquiries.rfqDetail")}</span>
      <span class="px-4">${t("inquiries.quotesCount")}</span>
      <span>${t("inquiries.action")}</span>
    </div>
    ${rfqs
      .map(
        (rfq) => `
      <div class="seller-rfq-row sm:grid sm:grid-cols-[1fr_auto_auto] sm:items-center px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-50 hover:bg-gray-50/60 transition-colors cursor-pointer" data-rfq-id="${rfq.name}">
        <div>
          <div class="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
            <span>${new Date(rfq.creation).toLocaleDateString("tr-TR")}</span>
            <span class="text-gray-300">|</span>
            <span>ID: ${rfq.name}</span>
            ${rfq.category ? `<span class="text-gray-300">|</span><span class="text-amber-600">${rfq.category}</span>` : ""}
          </div>
          <p class="mt-1 text-sm font-medium text-gray-800">${rfq.product_name}</p>
          <p class="text-xs text-gray-500">${rfq.quantity} ${rfq.unit}</p>
          <p class="mt-1 text-xs text-gray-400 line-clamp-1">${rfq.description || ""}</p>
        </div>
        <div class="mt-2 sm:mt-0 px-4">
          <span class="text-sm text-gray-500">${rfq.quote_count} ${t("inquiries.quotesLabel")}</span>
        </div>
        <div class="mt-2 sm:mt-0">
          ${
            rfq.my_quote
              ? `<span class="inline-flex items-center px-4 py-1.5 rounded-full bg-gray-200 text-gray-500 text-xs font-semibold cursor-not-allowed">${t("inquiries.quoteSubmitted")}</span>`
              : `<button class="seller-rfq-quote-btn inline-flex items-center px-4 py-1.5 rounded-full bg-(--btn-bg,#f5b800) hover:bg-(--btn-hover-bg,#d39c00) active:bg-(--btn-hover-bg,#d39c00) text-(--btn-text,#1a1a1a) text-xs font-semibold border border-(--btn-border-color,#d39c00) shadow-[var(--btn-shadow,0_1px_0_#d39c00,inset_0_1px_0_rgba(255,255,255,0.3))] hover:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2),inset_-1px_-1px_2px_rgba(255,255,255,0.25)] active:shadow-[inset_3px_3px_7px_rgba(0,0,0,0.3),inset_-1px_-1px_2px_rgba(255,255,255,0.18)] active:scale-[0.98] transition-all duration-150" data-rfq-id="${rfq.name}">${t("inquiries.sendQuote")}</button>`
          }
        </div>
      </div>
    `
      )
      .join("")}`;
}

// ── Seller: My Quotes list ───────────────────────────────────────────────────

function quoteStatusBadge(status: string): string {
  const colors: Record<string, string> = {
    Submitted: "bg-yellow-100 text-yellow-800",
    Accepted: "bg-green-100 text-green-800",
    Rejected: "bg-red-100 text-red-700",
    Withdrawn: "bg-gray-100 text-gray-600",
  };
  const labels: Record<string, string> = {
    Submitted: t("inquiries.quoteSubmitted"),
    Accepted: t("inquiries.quoteAccepted"),
    Rejected: t("inquiries.quoteRejected"),
    Withdrawn: t("inquiries.quoteWithdrawn"),
  };
  return `<span class="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-600"}">${labels[status] || status}</span>`;
}

function renderMyQuotesList(quotes: MyQuoteItem[]): string {
  if (!quotes.length) {
    return `<div class="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div class="w-[140px] h-[120px]">${emptyStateSvg()}</div>
      <p class="text-sm text-gray-500">${t("inquiries.noQuotesSent")}</p>
    </div>`;
  }
  return `
    <div class="hidden sm:grid grid-cols-[1fr_120px_120px] gap-4 items-center px-5 py-2.5 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
      <span>RFQ</span><span class="text-right">${t("inquiries.myOffer")}</span><span class="text-right">${t("inquiries.status")}</span>
    </div>
    ${quotes
      .map(
        (q) => `
      <div class="my-quote-row sm:grid sm:grid-cols-[1fr_120px_120px] gap-4 sm:items-center px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-50 hover:bg-gray-50/60 transition-colors" data-quote-id="${q.name}">
        <div>
          <div class="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
            <span>${new Date(q.creation).toLocaleDateString("tr-TR")}</span>
            <span class="text-gray-300">|</span>
            <span>ID: ${q.rfq}</span>
          </div>
          <p class="mt-1 text-sm font-medium text-gray-800">${q.rfq_product_name}</p>
          <p class="text-xs text-gray-500">${q.rfq_quantity} ${q.rfq_unit}</p>
        </div>
        <div class="mt-2 sm:mt-0 px-4 text-right">
          <p class="text-sm font-semibold text-gray-800">${q.currency} ${q.price_per_unit}</p>
          ${q.lead_time_days ? `<p class="text-xs text-gray-400">${q.lead_time_days} ${t("rfq.days")}</p>` : ""}
        </div>
        <div class="mt-2 sm:mt-0">
          ${quoteStatusBadge(q.status)}
        </div>
      </div>
    `
      )
      .join("")}`;
}

// ── Seller: Quote Submit Modal ───────────────────────────────────────────────

function showQuoteSubmitModal(rfq: SellerRFQItem, onSuccess: () => void): void {
  const modal = document.createElement("div");
  modal.className = "fixed inset-0 z-50 flex items-center justify-center bg-black/40";
  modal.innerHTML = `
    <div class="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
      <h3 class="text-base font-semibold mb-1">${t("inquiries.submitQuoteFor")}</h3>
      <p class="text-sm text-gray-500 mb-4">${rfq.product_name} — ${rfq.quantity} ${rfq.unit}</p>
      ${rfq.description ? `<p class="text-xs text-gray-400 mb-4 line-clamp-3">${rfq.description}</p>` : ""}

      <!-- Attachment grid (filled async after modal mounts) -->
      <div id="quote-attachments-slot" class="mb-4"></div>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">${t("inquiries.selectProduct")}</label>
          <select id="quote-listing" class="th-input th-input-md">
            <option value="">${t("inquiries.noProductSelected")}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">${t("rfq.unitPrice")} *</label>
          <input type="number" id="quote-price-per-unit" min="0" step="0.01" placeholder="0.00" class="th-input th-input-md" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">${t("inquiries.totalPriceLabel")}</label>
          <input type="number" id="quote-total-price" min="0" step="0.01" placeholder="0.00" class="th-input th-input-md" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">${t("inquiries.currencyLabel")}</label>
          <select id="quote-currency" class="th-input th-input-md">
            <option value="TRY">TRY</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
          <p id="quote-rate-hint" class="mt-1 text-[11px] text-gray-500 hidden"></p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">${t("inquiries.deliveryDaysLabel")}</label>
          <input type="number" id="quote-lead-time" min="0" placeholder="0" class="th-input th-input-md" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">${t("rfq.messageLbl")}</label>
          <textarea id="quote-message" rows="3" placeholder="${t("inquiries.quoteMessagePlaceholder")}" class="th-input resize-none"></textarea>
        </div>
      </div>
      <div class="flex gap-2 mt-5 justify-end">
        <button id="quote-submit-btn" class="px-6 py-2 bg-(--btn-bg,#f5b800) hover:bg-(--btn-hover-bg,#d39c00) active:bg-(--btn-hover-bg,#d39c00) text-(--btn-text,#1a1a1a) rounded-full text-sm font-semibold border border-(--btn-border-color,#d39c00) shadow-[var(--btn-shadow,0_1px_0_#d39c00,inset_0_1px_0_rgba(255,255,255,0.3))] hover:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2),inset_-1px_-1px_2px_rgba(255,255,255,0.25)] active:shadow-[inset_3px_3px_7px_rgba(0,0,0,0.3),inset_-1px_-1px_2px_rgba(255,255,255,0.18)] active:scale-[0.98] transition-all duration-150">${t("inquiries.sendQuote")}</button>
        <button id="quote-cancel-btn" class="px-6 py-2 border border-gray-300 rounded-full text-sm hover:bg-gray-50">${t("rfq.cancel")}</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  // Lightbox modal (sibling of quote modal in body — uses scope key for isolation)
  const lightboxHost = document.createElement("div");
  lightboxHost.innerHTML = renderAttachmentModal("seller-quote");
  document.body.appendChild(lightboxHost.firstElementChild!);
  let teardownAttachments: (() => void) | null = null;

  // Async-load RFQ attachments — permission-gated by RFQ.has_permission
  const attachmentsSlot = modal.querySelector<HTMLElement>("#quote-attachments-slot");
  fetchRfqAttachments(rfq.name).then((atts: RfqAttachment[]) => {
    if (!attachmentsSlot || !atts.length) return;
    attachmentsSlot.innerHTML = renderAttachmentsCompact(atts, "seller-quote");
    teardownAttachments = setupAttachmentInteractions(modal, atts, "seller-quote");
  });

  // Load seller's listings into dropdown
  const listingSelect = document.getElementById("quote-listing") as HTMLSelectElement;
  fetch(((window as any).API_BASE || "/api") + "/method/tradehub_core.api.rfq.get_my_listings", {
    credentials: "include",
  })
    .then((r) => r.json())
    .then((d) => {
      const listings = d.message || [];
      listings.forEach((l: any) => {
        const opt = document.createElement("option");
        opt.value = l.name;
        opt.textContent = l.title || l.name;
        listingSelect.appendChild(opt);
      });
    })
    .catch(() => {});

  // Auto-calculate total price from unit price × quantity.
  // Total stays in sync until the user manually edits it (e.g. to add VAT/discount).
  // Clearing the total resets the lock so auto-calc resumes.
  const unitInput = document.getElementById("quote-price-per-unit") as HTMLInputElement;
  const totalInput = document.getElementById("quote-total-price") as HTMLInputElement;
  let totalManuallyEdited = false;
  const recalcTotal = () => {
    if (totalManuallyEdited) return;
    const unit = Number(unitInput.value);
    if (!unit || unit <= 0) {
      totalInput.value = "";
      return;
    }
    totalInput.value = (unit * rfq.quantity).toFixed(2);
  };
  unitInput.addEventListener("input", recalcTotal);
  totalInput.addEventListener("input", () => {
    if (totalInput.value === "" || Number(totalInput.value) === 0) {
      totalManuallyEdited = false;
      recalcTotal();
    } else {
      totalManuallyEdited = true;
    }
  });

  // ── Currency switch → FX conversion (TCMB rates via currencyService) ──
  // Unit + (manuel ise) total yeni para birimine çevrilir. Manuel düzenleme
  // oranı korunur. Kur cache localStorage'da — anında yanıt verir.
  const currencySelect = document.getElementById("quote-currency") as HTMLSelectElement;
  const rateHint = document.getElementById("quote-rate-hint") as HTMLParagraphElement;
  const trRateFmt = new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });

  function updateRateHint() {
    const current = currencySelect.value;
    if (current === "TRY") {
      rateHint.classList.add("hidden");
      rateHint.textContent = "";
      return;
    }
    const rate = getExchangeRate(current, "TRY");
    if (!rate || rate === 1) {
      rateHint.classList.add("hidden");
      return;
    }
    rateHint.textContent = `${t("inquiries.rateLabel")}: 1 ${current} = ${trRateFmt.format(rate)} TRY (TCMB)`;
    rateHint.classList.remove("hidden");
  }

  let prevCurrency = currencySelect.value;

  // Idempotent — sayfa başında init edilmiş olabilir; cache hit'te eş zamanlı yanıt.
  initCurrency()
    .catch(() => {})
    .finally(() => {
      // Refresh prevCurrency in case the user changed it before rates loaded
      prevCurrency = currencySelect.value;
      updateRateHint();
    });

  currencySelect.addEventListener("change", () => {
    const newCurrency = currencySelect.value;
    if (newCurrency === prevCurrency) return;

    const rate = getExchangeRate(prevCurrency, newCurrency);

    // Guard: rate=1 ile farklı para birimi → kur bulunamadı, revert et
    if (rate === 1 && prevCurrency !== newCurrency) {
      showToast({
        message: t("inquiries.rateUnavailable", {
          from: prevCurrency,
          to: newCurrency,
        }),
        type: "warning",
      });
      currencySelect.value = prevCurrency;
      return;
    }

    const oldUnit = Number(unitInput.value);
    if (oldUnit > 0) {
      unitInput.value = (oldUnit * rate).toFixed(2);
    }

    if (totalManuallyEdited) {
      const oldTotal = Number(totalInput.value);
      if (oldTotal > 0) {
        totalInput.value = (oldTotal * rate).toFixed(2);
      }
    } else {
      recalcTotal();
    }

    prevCurrency = newCurrency;
    updateRateHint();
  });

  function cleanupQuoteModal() {
    teardownAttachments?.();
    document.getElementById("rfq-attach-modal-seller-quote")?.remove();
    modal.remove();
  }

  document.getElementById("quote-cancel-btn")?.addEventListener("click", cleanupQuoteModal);
  document.getElementById("quote-submit-btn")?.addEventListener("click", async () => {
    const pricePerUnit = unitInput.value;
    if (!pricePerUnit || Number(pricePerUnit) <= 0) {
      showToast({ message: t("inquiries.priceRequired"), type: "warning" });
      return;
    }
    // Safety net: if total is still empty at submit (e.g. listener failed), derive it.
    let totalPriceValue = Number(totalInput.value);
    if (!totalPriceValue || totalPriceValue <= 0) {
      totalPriceValue = Number(pricePerUnit) * rfq.quantity;
    }
    const submitBtn = document.getElementById("quote-submit-btn") as HTMLButtonElement;
    submitBtn.disabled = true;
    submitBtn.textContent = "...";
    try {
      const res = await fetch(
        ((window as any).API_BASE || "/api") + "/method/tradehub_core.api.rfq.submit_quote",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json", "X-Frappe-CSRF-Token": getCsrfToken() },
          body: JSON.stringify({
            rfq_id: rfq.name,
            price_per_unit: Number(pricePerUnit),
            total_price: totalPriceValue,
            currency: (document.getElementById("quote-currency") as HTMLSelectElement).value,
            lead_time_days:
              Number((document.getElementById("quote-lead-time") as HTMLInputElement).value) || 0,
            message: (document.getElementById("quote-message") as HTMLTextAreaElement).value.trim(),
            listing_id:
              (document.getElementById("quote-listing") as HTMLSelectElement).value || null,
          }),
        }
      );
      await checkEmailNotVerifiedResponse(res);
      if (!res.ok) throw new Error();
      showToast({ message: t("inquiries.quoteSentSuccess"), type: "success" });
      cleanupQuoteModal();
      onSuccess();
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.textContent = t("inquiries.sendQuote");
      if (isEmailNotVerifiedError(err)) return; // toast api.ts'te
      showToast({ message: t("inquiries.quoteSentError"), type: "error" });
    }
  });
}

function renderRfqDetailPanel(rfqData: any): string {
  const rfq = rfqData.rfq;
  const quotes = rfqData.quotes || [];
  return `
    <div class="border-l border-gray-200 bg-white h-full overflow-y-auto">
      <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 class="text-base font-semibold text-gray-800">${t("rfq.rfqDetails")}</h3>
        <button id="rfq-detail-close" class="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="px-5 py-4">
        <h4 class="text-lg font-bold text-gray-800">${rfq.product_name}</h4>
        <p class="text-sm text-gray-500 mt-1">Status: ${rfq.status}</p>
        <!-- Action buttons -->
        <div class="flex gap-2 mt-3">
          <button id="rfq-add-details-btn" class="px-4 py-1.5 text-sm border border-gray-300 rounded-full hover:bg-gray-50 ${rfq.additional_details ? "opacity-50 cursor-not-allowed" : ""}" ${rfq.additional_details ? "disabled" : ""}>${t("rfq.addDetails")}</button>
          <a href="/pages/dashboard/rfq.html" class="px-4 py-1.5 text-sm border border-gray-300 rounded-full hover:bg-gray-50">${t("rfq.postAgain")}</a>
          <button id="rfq-close-btn" class="px-4 py-1.5 text-sm border border-gray-300 rounded-full hover:bg-gray-50 ${rfq.status === "Closed" || rfq.status === "Completed" ? "opacity-50 cursor-not-allowed" : ""}" data-rfq="${rfq.name}" ${rfq.status === "Closed" || rfq.status === "Completed" ? "disabled" : ""}>${t("rfq.closeRfq")}</button>
        </div>
        <!-- Product info -->
        <div class="mt-4 pt-4 border-t border-gray-100">
          <h5 class="text-sm font-semibold text-gray-700 mb-3">${t("rfq.productBasicInfo")}</h5>
          <div class="space-y-2 text-sm">
            <div class="flex"><span class="w-28 text-gray-400">Product Name:</span><span class="font-medium text-gray-800">${rfq.product_name}</span></div>
            ${rfq.category_name ? `<div class="flex"><span class="w-28 text-gray-400">Category:</span><span class="font-medium text-gray-800">${rfq.category_name}</span></div>` : ""}
            <div class="flex"><span class="w-28 text-gray-400">Quantity:</span><span class="font-medium text-gray-800">${rfq.quantity} ${rfq.unit}</span></div>
            ${rfq.additional_details ? `<div class="flex"><span class="w-28 text-gray-400">Details:</span><span class="font-medium text-gray-800">${rfq.additional_details}</span></div>` : ""}
          </div>
          ${rfq.description ? `<details class="mt-2"><summary class="text-sm text-gray-500 cursor-pointer">${t("rfq.showMore")}</summary><p class="mt-2 text-sm text-gray-700">${rfq.description}</p></details>` : ""}
        </div>
        <!-- Quotes -->
        ${
          quotes.length
            ? `
          <div class="mt-4 pt-4 border-t border-gray-100">
            <h5 class="text-sm font-semibold text-gray-700 mb-3">${t("rfq.quotationsFromSupplier")} (${quotes.length})</h5>
            <div class="space-y-4">
              ${quotes
                .map(
                  (q: any) => `
                <div class="border border-gray-100 rounded-lg p-3">
                  <div class="flex items-center gap-2 mb-2">
                    ${avatarPlaceholder(q.seller_name)}
                    <div><p class="text-sm font-medium">${q.seller_name}</p><p class="text-xs text-gray-400">${q.seller_company}</p></div>
                  </div>
                  <p class="text-sm">${q.total_price ? `${q.currency} ${q.total_price}` : "Price on request"} ${q.lead_time_days ? `| ${q.lead_time_days} days` : ""}</p>
                  <div class="flex gap-3 mt-2 text-xs">
                    <a href="/pages/dashboard/rfq-quotes.html?rfq=${rfq.name}" class="text-blue-600 hover:underline">${t("rfq.viewDetail")}</a>
                  </div>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        `
            : ""
        }
      </div>
    </div>`;
}

function renderDetailPanel(inq: Inquiry): string {
  return `
    <div class="border-l border-gray-200 bg-white h-full">
      <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 class="text-base font-semibold text-gray-800">${t("inquiries.inquiryDetails")}</h3>
        <button id="inq-detail-close" class="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="px-5 py-4">
        <div class="flex items-center justify-between mb-5">
          <div class="flex items-center gap-3">
            <span class="text-xs text-gray-400">To:</span>
            ${avatarPlaceholder(inq.seller_name)}
            <div><p class="text-sm font-medium text-gray-800">${inq.seller_name}</p><p class="text-xs text-gray-400">${inq.seller_company}</p></div>
          </div>
          <a href="#" class="inline-flex items-center px-4 py-2 rounded-full bg-(--btn-bg,#f5b800) hover:bg-(--btn-hover-bg,#d39c00) active:bg-(--btn-hover-bg,#d39c00) text-(--btn-text,#1a1a1a) text-sm font-medium border border-(--btn-border-color,#d39c00) shadow-[var(--btn-shadow,0_1px_0_#d39c00,inset_0_1px_0_rgba(255,255,255,0.3))] hover:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2),inset_-1px_-1px_2px_rgba(255,255,255,0.25)] active:shadow-[inset_3px_3px_7px_rgba(0,0,0,0.3),inset_-1px_-1px_2px_rgba(255,255,255,0.18)] active:scale-[0.98] transition-all duration-150">${t("inquiries.contactNow")}</a>
        </div>
        <div class="flex items-center justify-between text-xs text-gray-400 mb-4 pb-4 border-b border-gray-100">
          <span>ID: ${inq.name}</span>
          <span>${new Date(inq.creation).toLocaleString("tr-TR")}</span>
        </div>
        <p class="text-sm text-gray-700 leading-relaxed">${inq.message}</p>
      </div>
    </div>`;
}

// ── Filter Dropdown ──────────────────────────────────────────────────────────

function renderFilterDropdown(type: "inquiry" | "rfq"): string {
  if (type === "inquiry") {
    return `<div class="inq-filter-dropdown hidden absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
      <button class="inq-filter-option w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" data-filter="all">${t("inquiries.allInquiries")}</button>
      <button class="inq-filter-option w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" data-filter="trash">${t("inquiries.trash")}</button>
    </div>`;
  }
  return `<div class="rfq-filter-dropdown hidden absolute top-full right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
    <button class="rfq-status-option w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" data-status="all">${t("inquiries.allStatus")}</button>
    <button class="rfq-status-option w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" data-status="Pending">${t("inquiries.statusPending")}</button>
    <button class="rfq-status-option w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" data-status="Approved">${t("inquiries.statusApproved")}</button>
    <button class="rfq-status-option w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" data-status="Closed">${t("inquiries.statusClosed")}</button>
    <button class="rfq-status-option w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" data-status="Rejected">${t("inquiries.statusRejected")}</button>
    <button class="rfq-status-option w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" data-status="Completed">${t("inquiries.statusCompleted")}</button>
  </div>`;
}

// ── Action Bars ──────────────────────────────────────────────────────────────

function renderInquiryActionBar(): string {
  return `<div class="flex items-center justify-between px-5 max-md:px-3 py-3 border-b border-gray-100 gap-3 flex-wrap" id="inq-action-bar">
    <div class="flex items-center gap-2">
      <button id="inq-delete-btn" class="px-4 py-1.5 text-[13px] text-gray-700 border border-gray-700 rounded bg-transparent hover:bg-gray-50">${t("inquiries.deleteBtn")}</button>
    </div>
    <div class="flex items-center gap-3 flex-wrap">
      <div class="relative">
        <button id="inq-filter-toggle" class="th-btn-outline inline-flex items-center gap-1 px-3.5 py-1.5 text-[13px]">
          <span id="inq-filter-label">${t("inquiries.allInquiries")}</span>
          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
        </button>
        ${renderFilterDropdown("inquiry")}
      </div>
      <div class="inline-flex items-center border border-gray-300 rounded overflow-hidden">
        <input type="text" id="inq-search-input" placeholder="${t("inquiries.searchPlaceholder")}" class="w-40 max-md:w-20 h-8 px-2.5 text-[13px] text-gray-700 border-none outline-none bg-white placeholder:text-gray-400 focus:shadow-[inset_0_0_0_1px_#ca8a04]" />
        <button class="flex items-center justify-center w-8 h-8 border-l border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path stroke-linecap="round" d="m21 21-4.35-4.35"/></svg>
        </button>
      </div>
    </div>
  </div>`;
}

function renderRfqActionBar(): string {
  return `<div class="flex items-center justify-between px-5 max-md:px-3 py-3 border-b border-gray-100 gap-3 flex-wrap" id="rfq-action-bar">
    <a href="/pages/dashboard/rfq.html" class="inline-flex items-center px-5 py-2 rounded-full bg-(--btn-bg,#f5b800) hover:bg-(--btn-hover-bg,#d39c00) active:bg-(--btn-hover-bg,#d39c00) text-(--btn-text,#1a1a1a) text-sm font-semibold border border-(--btn-border-color,#d39c00) shadow-[var(--btn-shadow,0_1px_0_#d39c00,inset_0_1px_0_rgba(255,255,255,0.3))] hover:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2),inset_-1px_-1px_2px_rgba(255,255,255,0.25)] active:shadow-[inset_3px_3px_7px_rgba(0,0,0,0.3),inset_-1px_-1px_2px_rgba(255,255,255,0.18)] active:scale-[0.98] transition-all duration-150">${t("inquiries.postRfq")}</a>
    <div class="flex items-center gap-3 flex-wrap">
      <div class="relative">
        <button id="rfq-filter-toggle" class="inline-flex items-center gap-1 px-3.5 py-1.5 text-[13px] text-gray-800 border border-gray-300 rounded bg-white hover:border-gray-400">
          <span id="rfq-filter-label">${t("inquiries.allStatus")}</span>
          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
        </button>
        ${renderFilterDropdown("rfq")}
      </div>
      <div class="inline-flex items-center border border-gray-300 rounded overflow-hidden">
        <input type="text" id="rfq-search-input" placeholder="${t("inquiries.searchPlaceholder")}" class="w-40 max-md:w-20 h-8 px-2.5 text-[13px] text-gray-700 border-none outline-none bg-white placeholder:text-gray-400 focus:shadow-[inset_0_0_0_1px_#ca8a04]" />
        <button class="flex items-center justify-center w-8 h-8 border-l border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path stroke-linecap="round" d="m21 21-4.35-4.35"/></svg>
        </button>
      </div>
    </div>
  </div>`;
}

function renderSellerRfqActionBar(): string {
  return `<div class="flex items-center justify-between px-5 max-md:px-3 py-3 border-b border-gray-100 gap-3 flex-wrap" id="seller-rfq-action-bar">
    <span class="text-sm text-gray-500">${t("inquiries.rfqMarketDesc")}</span>
    <div class="inline-flex items-center border border-gray-300 rounded overflow-hidden">
      <input type="text" id="seller-rfq-search-input" placeholder="${t("inquiries.searchPlaceholder")}" class="w-40 max-md:w-20 h-8 px-2.5 text-[13px] text-gray-700 border-none outline-none bg-white placeholder:text-gray-400 focus:shadow-[inset_0_0_0_1px_#ca8a04]" />
      <button class="flex items-center justify-center w-8 h-8 border-l border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path stroke-linecap="round" d="m21 21-4.35-4.35"/></svg>
      </button>
    </div>
  </div>`;
}

function renderMyQuotesActionBar(): string {
  return `<div class="flex items-center justify-between px-5 max-md:px-3 py-3 border-b border-gray-100 gap-3 flex-wrap" id="my-quotes-action-bar">
    <span class="text-sm text-gray-500">${t("inquiries.myQuotesDesc")}</span>
  </div>`;
}

// ── Main Layout ──────────────────────────────────────────────────────────────

export function InquiriesLayout(): string {
  return `
    <div class="bg-white rounded-lg min-h-[calc(100vh-80px)] flex flex-col">
      <div class="flex border-b border-gray-200 overflow-x-auto">
        <button class="inq-tabs__tab inq-tabs__tab--active px-6 py-3.5 text-[13px] font-semibold text-gray-800 bg-transparent border-none border-b-2 border-gray-800 cursor-pointer transition-[color,border-color] duration-150 whitespace-nowrap" data-tab="inquiries">${t("inquiries.myInquiries")}</button>
        <button class="inq-tabs__tab px-6 py-3.5 text-[13px] font-normal text-gray-500 bg-transparent border-none border-b-2 border-transparent cursor-pointer transition-[color,border-color] duration-150 whitespace-nowrap hover:text-gray-700" data-tab="rfq">${t("inquiries.rfqRequests")}</button>
        <button class="inq-tabs__tab seller-only-tab hidden px-6 py-3.5 text-[13px] font-normal text-gray-500 bg-transparent border-none border-b-2 border-transparent cursor-pointer transition-[color,border-color] duration-150 whitespace-nowrap hover:text-gray-700" data-tab="seller-rfq">${t("inquiries.rfqMarket")}</button>
        <button class="inq-tabs__tab seller-only-tab hidden px-6 py-3.5 text-[13px] font-normal text-gray-500 bg-transparent border-none border-b-2 border-transparent cursor-pointer transition-[color,border-color] duration-150 whitespace-nowrap hover:text-gray-700" data-tab="my-quotes">${t("inquiries.myQuotes")}</button>
      </div>
      <div id="tab-inquiry-bar">${renderInquiryActionBar()}</div>
      <div id="tab-rfq-bar" class="hidden">${renderRfqActionBar()}</div>
      <div id="tab-seller-rfq-bar" class="hidden">${renderSellerRfqActionBar()}</div>
      <div id="tab-my-quotes-bar" class="hidden">${renderMyQuotesActionBar()}</div>
      <div class="flex flex-1 min-h-[400px]">
        <div class="flex-1 min-w-0" id="inq-list-area">
          <div id="tab-inquiry-content">${loadingSpinner()}</div>
          <div id="tab-rfq-content" class="hidden">${loadingSpinner()}</div>
          <div id="tab-seller-rfq-content" class="hidden">${loadingSpinner()}</div>
          <div id="tab-my-quotes-content" class="hidden">${loadingSpinner()}</div>
        </div>
        <div id="inq-detail-panel" class="hidden w-[380px] max-lg:w-[320px] max-sm:absolute max-sm:right-0 max-sm:top-0 max-sm:h-full max-sm:w-full max-sm:z-50 shrink-0"></div>
      </div>
    </div>`;
}

// ── API fetch helpers ────────────────────────────────────────────────────────

async function fetchInquiries(filterType = "all"): Promise<Inquiry[]> {
  try {
    const res = await fetch(
      `/api/method/tradehub_core.api.rfq.get_my_inquiries?filter_type=${filterType}`,
      { credentials: "include" }
    );
    const d = await res.json();
    return d.message?.data || [];
  } catch {
    return [];
  }
}

async function fetchRfqs(status = "all"): Promise<RFQItem[]> {
  try {
    const params = status && status !== "all" ? `?status=${status}` : "";
    const res = await fetch(`/api/method/tradehub_core.api.rfq.get_my_rfqs${params}`, {
      credentials: "include",
    });
    const d = await res.json();
    return d.message?.data || [];
  } catch {
    return [];
  }
}

async function fetchSellerRfqs(): Promise<SellerRFQItem[]> {
  try {
    const res = await fetch(
      ((window as any).API_BASE || "/api") + "/method/tradehub_core.api.rfq.get_seller_rfqs",
      { credentials: "include" }
    );
    const d = await res.json();
    return d.message?.data || [];
  } catch {
    return [];
  }
}

async function fetchMyQuotes(): Promise<MyQuoteItem[]> {
  try {
    const res = await fetch(
      ((window as any).API_BASE || "/api") + "/method/tradehub_core.api.rfq.get_my_quotes",
      { credentials: "include" }
    );
    const d = await res.json();
    return d.message?.data || [];
  } catch {
    return [];
  }
}

async function checkIsSeller(): Promise<boolean> {
  try {
    const res = await fetch(
      ((window as any).API_BASE || "/api") +
        "/method/tradehub_core.api.rfq.get_seller_rfqs?limit_page_length=1",
      { credentials: "include" }
    );
    // 200 = seller
    // Any error (403, 417, 500) = not a seller or backend error
    return res.ok;
  } catch {
    return false;
  }
}

// ── Init ─────────────────────────────────────────────────────────────────────

export function initInquiriesLayout(): void {
  const inquiryContent = document.getElementById("tab-inquiry-content")!;
  const rfqContent = document.getElementById("tab-rfq-content")!;
  const detailPanel = document.getElementById("inq-detail-panel")!;
  let inquiriesCache: Inquiry[] = [];
  let rfqsCache: RFQItem[] = [];
  let selectedInquiryId: string | null = null;

  // Load data from API
  async function loadInquiries(filterType = "all") {
    inquiryContent.innerHTML = loadingSpinner();
    inquiriesCache = await fetchInquiries(filterType);
    inquiryContent.innerHTML = renderInquiryList(inquiriesCache);
    bindInquiryEvents();
  }

  async function loadRfqs(status = "all") {
    rfqContent.innerHTML = loadingSpinner();
    rfqsCache = await fetchRfqs(status);
    rfqContent.innerHTML = renderRfqList(rfqsCache);
    bindRfqEvents();
  }

  async function openRfqDetailPanel(rfqId: string) {
    if (!rfqId || !detailPanel) return;
    detailPanel.innerHTML = loadingSpinner();
    detailPanel.classList.remove("hidden");
    try {
      const res = await fetch(`/api/method/tradehub_core.api.rfq.get_rfq_detail?rfq_id=${rfqId}`, {
        credentials: "include",
      });
      const d = await res.json();
      detailPanel.innerHTML = renderRfqDetailPanel(d.message);

      // Close panel button
      document
        .getElementById("rfq-detail-close")
        ?.addEventListener("click", () => detailPanel.classList.add("hidden"));

      // Close RFQ button
      const closeBtn = document.getElementById("rfq-close-btn") as HTMLButtonElement | null;
      if (closeBtn && !closeBtn.disabled) {
        closeBtn.addEventListener("click", async () => {
          const id = closeBtn.dataset?.rfq;
          if (!id) return;
          closeBtn.disabled = true;
          closeBtn.textContent = "...";
          try {
            const res = await fetch(
              ((window as any).API_BASE || "/api") + "/method/tradehub_core.api.rfq.close_rfq",
              {
                method: "POST",
                credentials: "include",
                headers: {
                  "Content-Type": "application/json",
                  "X-Frappe-CSRF-Token": getCsrfToken(),
                },
                body: JSON.stringify({ rfq_id: id }),
              }
            );
            await checkEmailNotVerifiedResponse(res);
            if (!res.ok) throw new Error();
            showToast({ message: t("rfq.closeSuccess"), type: "success" });
            loadRfqs();
            // Reload panel to reflect new status
            openRfqDetailPanel(rfqId);
          } catch (err) {
            closeBtn.disabled = false;
            closeBtn.textContent = t("rfq.closeRfq");
            if (isEmailNotVerifiedError(err)) return;
            showToast({ message: t("rfq.closeError"), type: "error" });
          }
        });
      }

      // Add Details modal
      const addDetailsBtn = document.getElementById(
        "rfq-add-details-btn"
      ) as HTMLButtonElement | null;
      if (addDetailsBtn && !addDetailsBtn.disabled) {
        addDetailsBtn.addEventListener("click", () => {
          const modal = document.createElement("div");
          modal.className = "fixed inset-0 z-50 flex items-center justify-center bg-black/40";
          modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
              <h3 class="text-base font-semibold mb-2">${t("rfq.addMoreInfo")}</h3>
              <p class="text-sm text-gray-500 mb-3">${t("rfq.addMoreInfoNotice")}</p>
              <textarea id="rfq-add-details-text" class="th-input resize-none" rows="4" maxlength="100"></textarea>
              <p class="text-xs text-gray-400 text-right mt-1"><span id="rfq-details-count">0</span>/100</p>
              <div class="flex gap-2 mt-4 justify-end">
                <button id="rfq-details-submit" class="px-5 py-2 bg-(--btn-bg,#f5b800) hover:bg-(--btn-hover-bg,#d39c00) active:bg-(--btn-hover-bg,#d39c00) text-(--btn-text,#1a1a1a) rounded-full text-sm font-semibold border border-(--btn-border-color,#d39c00) shadow-[var(--btn-shadow,0_1px_0_#d39c00,inset_0_1px_0_rgba(255,255,255,0.3))] hover:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2),inset_-1px_-1px_2px_rgba(255,255,255,0.25)] active:shadow-[inset_3px_3px_7px_rgba(0,0,0,0.3),inset_-1px_-1px_2px_rgba(255,255,255,0.18)] active:scale-[0.98] transition-all duration-150">${t("rfq.submit")}</button>
                <button id="rfq-details-cancel" class="px-5 py-2 border border-gray-300 rounded-full text-sm hover:bg-gray-50">${t("rfq.cancel")}</button>
              </div>
            </div>`;
          document.body.appendChild(modal);

          const textarea = document.getElementById("rfq-add-details-text") as HTMLTextAreaElement;
          textarea?.addEventListener("input", () => {
            document.getElementById("rfq-details-count")!.textContent = String(
              textarea.value.length
            );
          });
          document
            .getElementById("rfq-details-cancel")
            ?.addEventListener("click", () => modal.remove());
          document.getElementById("rfq-details-submit")?.addEventListener("click", async () => {
            const text = textarea?.value.trim();
            if (!text) return;
            const submitBtn = document.getElementById("rfq-details-submit") as HTMLButtonElement;
            submitBtn.disabled = true;
            submitBtn.textContent = "...";
            try {
              const res = await fetch(
                ((window as any).API_BASE || "/api") +
                  "/method/tradehub_core.api.rfq.add_rfq_details",
                {
                  method: "POST",
                  credentials: "include",
                  headers: {
                    "Content-Type": "application/json",
                    "X-Frappe-CSRF-Token": getCsrfToken(),
                  },
                  body: JSON.stringify({ rfq_id: rfqId, additional_details: text }),
                }
              );
              await checkEmailNotVerifiedResponse(res);
              if (!res.ok) throw new Error();
              showToast({ message: t("rfq.detailsAddedSuccess"), type: "success" });
              modal.remove();
              // Reload panel to reflect disabled button
              openRfqDetailPanel(rfqId);
            } catch (err) {
              submitBtn.disabled = false;
              submitBtn.textContent = t("rfq.submit");
              if (isEmailNotVerifiedError(err)) return;
              showToast({ message: t("rfq.detailsAddedError"), type: "error" });
            }
          });
        });
      }
    } catch {
      detailPanel.innerHTML =
        '<div class="p-5 text-sm text-red-500">Error loading RFQ details</div>';
    }
  }

  function bindRfqEvents() {
    // Row click opens detail panel
    document.querySelectorAll<HTMLDivElement>(".rfq-row").forEach((row) => {
      row.addEventListener("click", (e) => {
        // Don't trigger if clicking on a link or button inside the row
        const target = e.target as HTMLElement;
        if (target.closest("a") || target.closest("button")) return;
        const rfqId = row.dataset.rfqId;
        if (rfqId) {
          document.querySelectorAll(".rfq-row").forEach((r) => r.classList.remove("bg-amber-50"));
          row.classList.add("bg-amber-50");
          openRfqDetailPanel(rfqId);
        }
      });
    });

    // "View this RFQ" button click
    document.querySelectorAll<HTMLButtonElement>(".rfq-detail-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const rfqId = btn.dataset.rfqId;
        if (rfqId) {
          document.querySelectorAll(".rfq-row").forEach((r) => r.classList.remove("bg-amber-50"));
          btn.closest(".rfq-row")?.classList.add("bg-amber-50");
          openRfqDetailPanel(rfqId);
        }
      });
    });
  }

  function bindInquiryEvents() {
    document.querySelectorAll<HTMLButtonElement>(".inq-detail-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.dataset.inquiryId;
        const inq = inquiriesCache.find((i) => i.name === id);
        if (!inq || !detailPanel) return;
        detailPanel.innerHTML = renderDetailPanel(inq);
        detailPanel.classList.remove("hidden");
        document
          .getElementById("inq-detail-close")
          ?.addEventListener("click", () => detailPanel.classList.add("hidden"));
      });
    });
    document.querySelectorAll<HTMLDivElement>(".inq-row").forEach((row) => {
      row.addEventListener("click", () => {
        // Track selected inquiry
        document.querySelectorAll(".inq-row").forEach((r) => r.classList.remove("bg-amber-50"));
        row.classList.add("bg-amber-50");
        selectedInquiryId = row.dataset.inquiryId || null;
        row.querySelector<HTMLButtonElement>(".inq-detail-btn")?.click();
      });
    });
  }

  // Seller tabs
  const sellerRfqContent = document.getElementById("tab-seller-rfq-content")!;
  const myQuotesContent = document.getElementById("tab-my-quotes-content")!;
  let sellerRfqsCache: SellerRFQItem[] = [];
  let myQuotesCache: MyQuoteItem[] = [];

  async function loadSellerRfqs() {
    sellerRfqContent.innerHTML = loadingSpinner();
    sellerRfqsCache = await fetchSellerRfqs();
    sellerRfqContent.innerHTML = renderSellerRfqList(sellerRfqsCache);
    bindSellerRfqEvents();
  }

  async function loadMyQuotes() {
    myQuotesContent.innerHTML = loadingSpinner();
    myQuotesCache = await fetchMyQuotes();
    myQuotesContent.innerHTML = renderMyQuotesList(myQuotesCache);
  }

  function bindSellerRfqEvents() {
    document.querySelectorAll<HTMLButtonElement>(".seller-rfq-quote-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const rfqId = btn.dataset.rfqId;
        const rfq = sellerRfqsCache.find((r) => r.name === rfqId);
        if (rfq)
          showQuoteSubmitModal(rfq, () => {
            loadSellerRfqs();
            loadMyQuotes();
          });
      });
    });
    document.querySelectorAll<HTMLDivElement>(".seller-rfq-row").forEach((row) => {
      row.addEventListener("click", (e) => {
        if (
          (e.target as HTMLElement).closest("button") ||
          (e.target as HTMLElement).closest("span")
        )
          return;
        const rfqId = row.dataset.rfqId;
        const rfq = sellerRfqsCache.find((r) => r.name === rfqId);
        if (rfq && !rfq.my_quote)
          showQuoteSubmitModal(rfq, () => {
            loadSellerRfqs();
            loadMyQuotes();
          });
      });
    });
  }

  // Initial load
  loadInquiries();
  loadRfqs();

  // Check if user has Seller role and show seller tabs
  checkIsSeller().then((isSeller) => {
    if (isSeller) {
      document
        .querySelectorAll(".seller-only-tab")
        .forEach((tab) => tab.classList.remove("hidden"));
      loadSellerRfqs();
      loadMyQuotes();
    }
  });

  // Tab switching
  const allBars = ["tab-inquiry-bar", "tab-rfq-bar", "tab-seller-rfq-bar", "tab-my-quotes-bar"];
  const allContents = [
    "tab-inquiry-content",
    "tab-rfq-content",
    "tab-seller-rfq-content",
    "tab-my-quotes-content",
  ];
  const tabBarMap: Record<string, string> = {
    inquiries: "tab-inquiry-bar",
    rfq: "tab-rfq-bar",
    "seller-rfq": "tab-seller-rfq-bar",
    "my-quotes": "tab-my-quotes-bar",
  };
  const tabContentMap: Record<string, string> = {
    inquiries: "tab-inquiry-content",
    rfq: "tab-rfq-content",
    "seller-rfq": "tab-seller-rfq-content",
    "my-quotes": "tab-my-quotes-content",
  };

  const tabs = document.querySelectorAll<HTMLButtonElement>(".inq-tabs__tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabId = tab.dataset.tab || "";
      tabs.forEach((t) => {
        t.classList.remove(
          "inq-tabs__tab--active",
          "font-semibold",
          "text-gray-800",
          "border-gray-800"
        );
        t.classList.add("font-normal", "text-gray-500", "border-transparent");
      });
      tab.classList.add(
        "inq-tabs__tab--active",
        "font-semibold",
        "text-gray-800",
        "border-gray-800"
      );
      tab.classList.remove("font-normal", "text-gray-500", "border-transparent");
      // Hide all bars and contents
      allBars.forEach((id) => document.getElementById(id)?.classList.add("hidden"));
      allContents.forEach((id) => document.getElementById(id)?.classList.add("hidden"));
      detailPanel?.classList.add("hidden");
      // Show active bar and content
      const barId = tabBarMap[tabId];
      const contentId = tabContentMap[tabId];
      if (barId) document.getElementById(barId)?.classList.remove("hidden");
      if (contentId) document.getElementById(contentId)?.classList.remove("hidden");
    });
  });

  // Filter dropdowns
  setupDropdown(
    "inq-filter-toggle",
    ".inq-filter-dropdown",
    ".inq-filter-option",
    "inq-filter-label",
    (val) => loadInquiries(val)
  );
  setupDropdown(
    "rfq-filter-toggle",
    ".rfq-filter-dropdown",
    ".rfq-status-option",
    "rfq-filter-label",
    (val) => loadRfqs(val)
  );

  // Delete button — trash selected inquiry
  document.getElementById("inq-delete-btn")?.addEventListener("click", async () => {
    if (!selectedInquiryId) {
      showToast({ message: t("inquiries.selectToDelete"), type: "warning" });
      return;
    }
    try {
      const res = await fetch(
        ((window as any).API_BASE || "/api") + "/method/tradehub_core.api.rfq.trash_inquiry",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json", "X-Frappe-CSRF-Token": getCsrfToken() },
          body: JSON.stringify({ inquiry_id: selectedInquiryId }),
        }
      );
      if (!res.ok) throw new Error();
      showToast({ message: t("inquiries.deleteSuccess"), type: "success" });
      selectedInquiryId = null;
      detailPanel.classList.add("hidden");
      loadInquiries();
    } catch {
      showToast({ message: t("inquiries.deleteError"), type: "error" });
    }
  });

  // Search — client-side filter on inquiry list
  const searchInput = document.getElementById("inq-search-input") as HTMLInputElement | null;
  searchInput?.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) {
      inquiryContent.innerHTML = renderInquiryList(inquiriesCache);
      bindInquiryEvents();
      return;
    }
    const filtered = inquiriesCache.filter(
      (inq) =>
        inq.message.toLowerCase().includes(query) ||
        inq.seller_name.toLowerCase().includes(query) ||
        inq.seller_company.toLowerCase().includes(query) ||
        inq.name.toLowerCase().includes(query)
    );
    inquiryContent.innerHTML = renderInquiryList(filtered);
    bindInquiryEvents();
  });

  // Search — client-side filter on RFQ list
  const rfqSearchInput = document.getElementById("rfq-search-input") as HTMLInputElement | null;
  rfqSearchInput?.addEventListener("input", () => {
    const query = rfqSearchInput.value.trim().toLowerCase();
    if (!query) {
      rfqContent.innerHTML = renderRfqList(rfqsCache);
      bindRfqEvents();
      return;
    }
    const filtered = rfqsCache.filter(
      (rfq) =>
        rfq.product_name.toLowerCase().includes(query) ||
        rfq.name.toLowerCase().includes(query) ||
        rfq.status.toLowerCase().includes(query)
    );
    rfqContent.innerHTML = renderRfqList(filtered);
    bindRfqEvents();
  });

  // Search — client-side filter on Seller RFQ marketplace
  const sellerRfqSearchInput = document.getElementById(
    "seller-rfq-search-input"
  ) as HTMLInputElement | null;
  sellerRfqSearchInput?.addEventListener("input", () => {
    const query = sellerRfqSearchInput.value.trim().toLowerCase();
    if (!query) {
      sellerRfqContent.innerHTML = renderSellerRfqList(sellerRfqsCache);
      bindSellerRfqEvents();
      return;
    }
    const filtered = sellerRfqsCache.filter(
      (rfq) =>
        rfq.product_name.toLowerCase().includes(query) ||
        rfq.name.toLowerCase().includes(query) ||
        (rfq.category || "").toLowerCase().includes(query)
    );
    sellerRfqContent.innerHTML = renderSellerRfqList(filtered);
    bindSellerRfqEvents();
  });
}

function setupDropdown(
  toggleId: string,
  dropdownSel: string,
  optionSel: string,
  labelId: string,
  onSelect?: (val: string) => void
): void {
  const toggle = document.getElementById(toggleId);
  const dropdown = document.querySelector<HTMLDivElement>(dropdownSel);
  const label = document.getElementById(labelId);
  if (!toggle || !dropdown) return;
  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("hidden");
  });
  dropdown.querySelectorAll<HTMLButtonElement>(optionSel).forEach((opt) => {
    opt.addEventListener("click", () => {
      if (label) label.textContent = opt.textContent?.trim() || "";
      dropdown.classList.add("hidden");
      const val = opt.dataset.filter || opt.dataset.status || "all";
      onSelect?.(val);
    });
  });
  document.addEventListener("click", () => dropdown.classList.add("hidden"));
}
