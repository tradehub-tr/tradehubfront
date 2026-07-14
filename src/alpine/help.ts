import Alpine from "alpinejs";
import {
  MultiFileDropzoneController,
  type DropzoneConfig,
  type DropzoneTexts,
} from "../lib/upload-ui";
import { t } from "../i18n";

import { fetchCsrfToken } from "../utils/api";
import { showToast } from "../utils/toast";
import {
  createTicket,
  listMyTickets,
  listMyOrdersForTicket,
  fetchTicketStatusCounts,
  getTicket,
  getTicketCommunications,
  replyTicket,
  updateTicketStatus,
  listTicketAttachments,
  type TicketSummary,
  type TicketDetail,
  type OrderForTicket,
  type StatusCounts,
  type TicketAttachment,
} from "../services/supportService";

const TICKET_DROPZONE_CONFIG: DropzoneConfig = {
  maxFiles: 5,
  maxFileSizeBytes: 10 * 1024 * 1024,
  allowedExtensions: [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
  ],
  allowedFormatsDisplay: "JPG, PNG, GIF, WEBP, PDF, DOC, XLS",
};

function ticketDropzoneTexts(): DropzoneTexts {
  return {
    title: t("helpCenter.fileUploadText") || "Dosyaları buraya sürükle",
    or: t("rfq.dropzoneOr") || "veya",
    pickBtn: t("rfq.dropzonePickBtn") || "Bilgisayardan Seç",
    dragRelease: t("rfq.dropzoneDragRelease") || "Bırakın",
  };
}
import { createLead } from "../services/leadService";
import { getLucideIcon } from "../components/icons/lucideIcons";

// Yardım merkezi / SSS kategori id → lucide ikon adı eşlemesi.
// helpCenter (kategori grid), faqPage (sidebar+chip+kart) ve faqDetail (breadcrumb ikon
// kutusu) burayı paylaşır — tek yerde tut.
const FAQ_CATEGORY_ICON_NAMES: Record<string, string> = {
  all: "layout-grid",
  intro: "info",
  account: "user",
  sourcing: "search",
  negotiation: "message-circle",
  "place-order": "shopping-cart",
  payment: "credit-card",
  tax: "receipt",
  shipping: "truck",
  receipt: "package-check",
  inspection: "shield-check",
  "after-sales": "rotate-ccw",
  feedback: "star",
  security: "shield",
  others: "help-circle",
  promotions: "tag",
  guaranteed: "badge-check",
  "app-settings": "settings",
  localization: "languages",
};

function getFaqCategoryIcon(id: string, className = "w-4 h-4"): string {
  return getLucideIcon(FAQ_CATEGORY_ICON_NAMES[id] || "help-circle", className);
}

// Yardım merkezi arama indeksi içindeki tek bir FAQ kaydı
interface SearchIndexEntry {
  text: string;
  cat: string;
  sub: string;
  answer: string;
  qIndex: number;
}

// FAQ kategori kartı (helpCenter ve faqPage modüllerinde paylaşılıyor)
interface FaqCategoryCard {
  id: string;
  label: string;
  subs: { key: string; label: string; highlight?: boolean }[];
}

// Sidebar kategori listesi item'ı
interface FaqCategoryItem {
  id: string;
  label: string;
}

// Ticket form kategorisi (kategori + alt-kategori listesi)
interface TicketFormCategory {
  id: string;
  label: string;
  subs: string[];
}

// Ticket listesi UI satırı (backend TicketSummary'den türetiliyor)
interface TicketRow {
  id: string;
  status: "open" | "pending" | "closed";
  priority: string;
  createdDate: string;
  subject: string;
  category: string;
  lastReplyLabel: string;
}

// HD Ticket status → UI tab mapping
// Backend: Open, Replied, Resolved, Closed
// UI tabs: all, open (Open), pending (Replied), closed (Resolved+Closed)
function statusToTab(s: string): "open" | "pending" | "closed" {
  if (s === "Open") return "open";
  if (s === "Replied") return "pending";
  return "closed";
}

Alpine.data("helpCenter", () => ({
  searchQuery: "",
  searchActive: false,
  searchResults: [] as SearchIndexEntry[],

  get popularSearches() {
    return [
      t("helpCenter.search1"),
      t("helpCenter.search2"),
      t("helpCenter.search3"),
      t("helpCenter.search4"),
    ];
  },

  get tabs() {
    return [
      {
        id: "account",
        faqCat: "account",
        label: t("helpCenter.tabAccount"),
        icon: getFaqCategoryIcon("account", "w-[18px] h-[18px]"),
      },
      {
        id: "sourcing",
        faqCat: "sourcing",
        label: t("helpCenter.tabSourcing"),
        icon: getFaqCategoryIcon("sourcing", "w-[18px] h-[18px]"),
      },
      {
        id: "negotiation",
        faqCat: "negotiation",
        label: t("helpCenter.tabNegotiation"),
        icon: getFaqCategoryIcon("negotiation", "w-[18px] h-[18px]"),
      },
      {
        id: "payment",
        faqCat: "payment",
        label: t("helpCenter.tabPayment"),
        icon: getFaqCategoryIcon("payment", "w-[18px] h-[18px]"),
      },
      {
        id: "after-sales",
        faqCat: "after-sales",
        label: t("helpCenter.tabAfterSales"),
        icon: getFaqCategoryIcon("after-sales", "w-[18px] h-[18px]"),
      },
      {
        id: "self-service",
        faqCat: "others",
        label: t("helpCenter.tabSelfService"),
        icon: getFaqCategoryIcon("others", "w-[18px] h-[18px]"),
      },
    ];
  },

  // Yardım Merkezi "Popüler sorular" kartı — sabit 8 kayıt (4 kategori x 2 soru).
  get popularQuestions(): { text: string; cat: string; sub: string }[] {
    return [
      { text: t("helpCenter.q_account_1"), cat: "account", sub: "accountLogin" },
      { text: t("helpCenter.q_account_2"), cat: "account", sub: "accountRegister" },
      { text: t("helpCenter.q_sourcing_1"), cat: "sourcing", sub: "sourcingSearch" },
      { text: t("helpCenter.q_sourcing_2"), cat: "sourcing", sub: "sourcingSearch" },
      { text: t("helpCenter.q_negotiation_1"), cat: "negotiation", sub: "negotiationRfq" },
      { text: t("helpCenter.q_negotiation_2"), cat: "negotiation", sub: "negotiationOtherIssues" },
      { text: t("helpCenter.q_payment_1"), cat: "payment", sub: "paymentTypes" },
      { text: t("helpCenter.q_payment_2"), cat: "payment", sub: "paymentOrderPayment" },
    ];
  },

  // Sub-key → category-id map for routing search results to faq-detail.html
  // Mirrors the categorySubsMap on faqDetail() (kept in sync manually).
  _subToCat: {
    introDesc: "intro",
    introMembership: "intro",
    accountSettings: "account",
    accountCancelReactivate: "account",
    accountLogin: "account",
    accountRegister: "account",
    accountBecomeSeller: "account",
    sourcingSearch: "sourcing",
    sourcingSupplierEval: "sourcing",
    sourcingTradeInfo: "sourcing",
    sourcingRecommender: "sourcing",
    sourcingAiApp: "sourcing",
    sourcingSourcing: "sourcing",
    negotiationRfq: "negotiation",
    negotiationMessages: "negotiation",
    negotiationOtherIssues: "negotiation",
    placeOrderTradeAssurance: "place-order",
    placeOrderPlace: "place-order",
    placeOrderConfirm: "place-order",
    placeOrderManage: "place-order",
    paymentOrderPayment: "payment",
    paymentReceipt: "payment",
    paymentFinancial: "payment",
    paymentPayment: "payment",
    paymentTypes: "payment",
    taxSubmitInfo: "tax",
    taxTypes: "tax",
    taxInvoice: "tax",
    taxVerifyInfo: "tax",
    taxOrderManage: "tax",
    taxRefund: "tax",
    shippingShipping: "shipping",
    shippingLogistics: "shipping",
    shippingMaersk: "shipping",
    shippingImportFees: "shipping",
    receiptDelivery: "receipt",
    receiptCompletion: "receipt",
    inspectionServices: "inspection",
    inspectionMonitoring: "inspection",
    afterSalesDispute: "after-sales",
    afterSalesReturn: "after-sales",
    afterSalesDisputeProcess: "after-sales",
    afterSalesGoodsIssue: "after-sales",
    afterSalesDisputeRules: "after-sales",
    afterSalesRefund: "after-sales",
    feedbackManagement: "feedback",
    feedbackRules: "feedback",
    securityFraud: "security",
    securityIpr: "security",
    othersCustomerService: "others",
    othersUnclearConcern: "others",
    othersOfflineService: "others",
    promotionsShoppingGuide: "promotions",
    promotionsScenario: "promotions",
    promotionsSuper: "promotions",
    promotionsPayment: "promotions",
    promotionsOtherIssues: "promotions",
    guaranteedShipping: "guaranteed",
    guaranteedAfterSales: "guaranteed",
    guaranteedPreSales: "guaranteed",
    guaranteedPlaceOrder: "guaranteed",
    guaranteedOverseasWarehouse: "guaranteed",
    appSettingsLabel: "app-settings",
    localizationSettings: "localization",
  } as Record<string, string>,

  // Build a flat searchable index of every FAQ Q&A across the whole help system.
  // Each entry: { text (q), cat, sub, answer, qIndex }
  _searchIndex: null as SearchIndexEntry[] | null,
  _buildSearchIndex(): SearchIndexEntry[] {
    const index: SearchIndexEntry[] = [];
    for (const sub of Object.keys(this._subToCat)) {
      const cat = this._subToCat[sub];
      const items = t(`faqDetail.${sub}_items`, { returnObjects: true }) as unknown;
      if (Array.isArray(items)) {
        items.forEach((item: unknown, qIndex: number) => {
          // i18n returnObjects sonucu unknown — q ve a alanlarını type guard ile doğrula
          if (
            item &&
            typeof item === "object" &&
            "q" in item &&
            typeof (item as { q: unknown }).q === "string"
          ) {
            const it = item as { q: string; a?: unknown };
            index.push({
              text: it.q,
              cat,
              sub,
              answer: typeof it.a === "string" ? it.a : "",
              qIndex,
            });
          }
        });
      }
    }
    return index;
  },

  doSearch() {
    const q = this.searchQuery.trim().toLocaleLowerCase("tr");
    if (!q) return;
    this.searchActive = true;

    // Turkish-aware: lower + tokenize
    const tokens = q.split(/\s+/).filter((w: string) => w.length >= 2);

    // Lazy build of full FAQ search index
    if (!this._searchIndex) this._searchIndex = this._buildSearchIndex();

    // Strip basic html tags from answers for matching
    const stripHtml = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

    const scored = this._searchIndex
      .map((item: SearchIndexEntry) => {
        const qText = item.text.toLocaleLowerCase("tr");
        const aText = stripHtml(item.answer || "").toLocaleLowerCase("tr");

        // Exact phrase: question >> answer
        let score = 0;
        if (qText.includes(q)) score += 1000;
        else if (aText.includes(q)) score += 200;

        // Per-token matches
        for (const token of tokens) {
          if (qText.includes(token)) score += 30;
          else if (token.length >= 4) {
            const prefix = token.slice(0, Math.max(4, token.length - 2));
            if (qText.includes(prefix)) score += 15;
          }
          if (aText.includes(token)) score += 5;
        }
        return { item, score };
      })
      .filter((r: { item: SearchIndexEntry; score: number }) => r.score > 0)
      .sort(
        (
          a: { item: SearchIndexEntry; score: number },
          b: { item: SearchIndexEntry; score: number }
        ) => b.score - a.score
      )
      .slice(0, 30)
      .map((r: { item: SearchIndexEntry; score: number }) => r.item);

    this.searchResults = scored;
  },

  clearSearch() {
    this.searchQuery = "";
    this.searchActive = false;
    this.searchResults = [];
  },
}));

Alpine.data("faqPage", () => ({
  searchQuery: "",
  activeCategory: "all",

  get categories() {
    return [
      { id: "all", label: t("faq.allCategories") },
      { id: "intro", label: t("faq.intro") },
      { id: "account", label: t("faq.account") },
      { id: "sourcing", label: t("faq.sourcing") },
      { id: "negotiation", label: t("faq.negotiation") },
      { id: "place-order", label: t("faq.placeOrder") },
      { id: "payment", label: t("faq.payment") },
      { id: "tax", label: t("faq.tax") },
      { id: "shipping", label: t("faq.shipping") },
      { id: "receipt", label: t("faq.receipt") },
      { id: "inspection", label: t("faq.inspection") },
      { id: "after-sales", label: t("faq.afterSales") },
      { id: "feedback", label: t("faq.feedback") },
      { id: "security", label: t("faq.security") },
      { id: "others", label: t("faq.others") },
      { id: "promotions", label: t("faq.promotions") },
      { id: "guaranteed", label: t("faq.guaranteed") },
      { id: "app-settings", label: t("faq.appSettings") },
      { id: "localization", label: t("faq.localization") },
    ];
  },

  get allCategoryCards() {
    return [
      {
        id: "intro",
        label: t("faq.intro"),
        subs: [
          { key: "introDesc", label: t("faq.introDesc") },
          { key: "introMembership", label: t("faq.introMembership"), highlight: true },
        ],
      },
      {
        id: "account",
        label: t("faq.account"),
        subs: [
          { key: "accountSettings", label: t("faq.accountSettings") },
          { key: "accountCancelReactivate", label: t("faq.accountCancelReactivate") },
          { key: "accountLogin", label: t("faq.accountLogin"), highlight: true },
          { key: "accountRegister", label: t("faq.accountRegister") },
          { key: "accountBecomeSeller", label: t("faq.accountBecomeSeller") },
        ],
      },
      {
        id: "sourcing",
        label: t("faq.sourcing"),
        subs: [
          { key: "sourcingSearch", label: t("faq.sourcingSearch") },
          { key: "sourcingSupplierEval", label: t("faq.sourcingSupplierEval") },
          { key: "sourcingTradeInfo", label: t("faq.sourcingTradeInfo"), highlight: true },
          { key: "sourcingRecommender", label: t("faq.sourcingRecommender"), highlight: true },
          { key: "sourcingAiApp", label: t("faq.sourcingAiApp") },
          { key: "sourcingSourcing", label: t("faq.sourcingSourcing") },
        ],
      },
      {
        id: "negotiation",
        label: t("faq.negotiation"),
        subs: [
          { key: "negotiationRfq", label: t("faq.negotiationRfq") },
          { key: "negotiationMessages", label: t("faq.negotiationMessages") },
          {
            key: "negotiationOtherIssues",
            label: t("faq.negotiationOtherIssues"),
            highlight: true,
          },
        ],
      },
      {
        id: "place-order",
        label: t("faq.placeOrder"),
        subs: [
          { key: "placeOrderTradeAssurance", label: t("faq.placeOrderTradeAssurance") },
          { key: "placeOrderPlace", label: t("faq.placeOrderPlace") },
          { key: "placeOrderConfirm", label: t("faq.placeOrderConfirm") },
          { key: "placeOrderManage", label: t("faq.placeOrderManage") },
        ],
      },
      {
        id: "payment",
        label: t("faq.payment"),
        subs: [
          { key: "paymentOrderPayment", label: t("faq.paymentOrderPayment"), highlight: true },
          { key: "paymentReceipt", label: t("faq.paymentReceipt") },
          { key: "paymentFinancial", label: t("faq.paymentFinancial") },
          { key: "paymentPayment", label: t("faq.paymentPayment") },
          { key: "paymentTypes", label: t("faq.paymentTypes") },
        ],
      },
      {
        id: "tax",
        label: t("faq.tax"),
        subs: [
          { key: "taxSubmitInfo", label: t("faq.taxSubmitInfo") },
          { key: "taxTypes", label: t("faq.taxTypes") },
          { key: "taxInvoice", label: t("faq.taxInvoice") },
          { key: "taxVerifyInfo", label: t("faq.taxVerifyInfo") },
          { key: "taxOrderManage", label: t("faq.taxOrderManage") },
          { key: "taxRefund", label: t("faq.taxRefund"), highlight: true },
        ],
      },
      {
        id: "shipping",
        label: t("faq.shipping"),
        subs: [
          { key: "shippingShipping", label: t("faq.shippingShipping") },
          { key: "shippingLogistics", label: t("faq.shippingLogistics"), highlight: true },
          { key: "shippingMaersk", label: t("faq.shippingMaersk") },
          { key: "shippingImportFees", label: t("faq.shippingImportFees") },
        ],
      },
      {
        id: "receipt",
        label: t("faq.receipt"),
        subs: [
          { key: "receiptDelivery", label: t("faq.receiptDelivery") },
          { key: "receiptCompletion", label: t("faq.receiptCompletion") },
        ],
      },
      {
        id: "inspection",
        label: t("faq.inspection"),
        subs: [
          { key: "inspectionServices", label: t("faq.inspectionServices"), highlight: true },
          { key: "inspectionMonitoring", label: t("faq.inspectionMonitoring") },
        ],
      },
      {
        id: "after-sales",
        label: t("faq.afterSales"),
        subs: [
          { key: "afterSalesDispute", label: t("faq.afterSalesDispute") },
          { key: "afterSalesReturn", label: t("faq.afterSalesReturn"), highlight: true },
          { key: "afterSalesDisputeProcess", label: t("faq.afterSalesDisputeProcess") },
          { key: "afterSalesGoodsIssue", label: t("faq.afterSalesGoodsIssue") },
          { key: "afterSalesDisputeRules", label: t("faq.afterSalesDisputeRules") },
          { key: "afterSalesRefund", label: t("faq.afterSalesRefund") },
        ],
      },
      {
        id: "feedback",
        label: t("faq.feedback"),
        subs: [
          { key: "feedbackManagement", label: t("faq.feedbackManagement"), highlight: true },
          { key: "feedbackRules", label: t("faq.feedbackRules") },
        ],
      },
      {
        id: "security",
        label: t("faq.security"),
        subs: [
          { key: "securityFraud", label: t("faq.securityFraud") },
          { key: "securityIpr", label: t("faq.securityIpr") },
        ],
      },
      {
        id: "others",
        label: t("faq.others"),
        subs: [
          { key: "othersCustomerService", label: t("faq.othersCustomerService") },
          { key: "othersUnclearConcern", label: t("faq.othersUnclearConcern") },
          { key: "othersOfflineService", label: t("faq.othersOfflineService") },
        ],
      },
      {
        id: "promotions",
        label: t("faq.promotions"),
        subs: [
          { key: "promotionsShoppingGuide", label: t("faq.promotionsShoppingGuide") },
          { key: "promotionsScenario", label: t("faq.promotionsScenario"), highlight: true },
          { key: "promotionsSuper", label: t("faq.promotionsSuper"), highlight: true },
          { key: "promotionsPayment", label: t("faq.promotionsPayment") },
          { key: "promotionsOtherIssues", label: t("faq.promotionsOtherIssues") },
        ],
      },
      {
        id: "guaranteed",
        label: t("faq.guaranteed"),
        subs: [
          { key: "guaranteedShipping", label: t("faq.guaranteedShipping"), highlight: true },
          { key: "guaranteedAfterSales", label: t("faq.guaranteedAfterSales") },
          { key: "guaranteedPreSales", label: t("faq.guaranteedPreSales"), highlight: true },
          { key: "guaranteedPlaceOrder", label: t("faq.guaranteedPlaceOrder") },
          { key: "guaranteedOverseasWarehouse", label: t("faq.guaranteedOverseasWarehouse") },
        ],
      },
      {
        id: "app-settings",
        label: t("faq.appSettings"),
        subs: [{ key: "appSettingsLabel", label: t("faq.appSettingsLabel") }],
      },
      {
        id: "localization",
        label: t("faq.localization"),
        subs: [
          { key: "localizationSettings", label: t("faq.localizationSettings"), highlight: true },
        ],
      },
    ];
  },

  get activeCategoryLabel(): string {
    const cat = (this.categories as FaqCategoryItem[]).find(
      (c: FaqCategoryItem) => c.id === this.activeCategory
    );
    return cat ? cat.label : t("faq.allCategories");
  },

  catIcon(id: string, className = "w-4 h-4"): string {
    return getFaqCategoryIcon(id, className);
  },

  // Sidebar (lg:+) ve mobil yatay chip şeridi ortak veri kaynağı — ikon + alt-konu sayısı.
  get sidebarCategories(): { id: string; label: string; icon: string; count: number }[] {
    const cards = this.allCategoryCards as FaqCategoryCard[];
    const totalSubs = cards.reduce((sum: number, c: FaqCategoryCard) => sum + c.subs.length, 0);
    return [
      {
        id: "all",
        label: t("faq.allCategories"),
        icon: this.catIcon("all", "w-[15px] h-[15px]"),
        count: totalSubs,
      },
      ...cards.map((c: FaqCategoryCard) => ({
        id: c.id,
        label: c.label,
        icon: this.catIcon(c.id, "w-[15px] h-[15px]"),
        count: c.subs.length,
      })),
    ];
  },

  get visibleCategories(): FaqCategoryCard[] {
    const q = this.searchQuery.trim().toLowerCase();
    let cards = this.allCategoryCards as FaqCategoryCard[];

    // Filter by sidebar selection
    if (this.activeCategory !== "all") {
      cards = cards.filter((c: FaqCategoryCard) => c.id === this.activeCategory);
    }

    // Filter by search query
    if (q) {
      cards = cards.filter(
        (c: FaqCategoryCard) =>
          c.label.toLowerCase().includes(q) ||
          c.subs.some((s: { key: string; label: string }) => s.label.toLowerCase().includes(q))
      );
    }

    return cards;
  },

  init() {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("cat");
    if (cat && this.categories.some((c: FaqCategoryItem) => c.id === cat)) {
      this.activeCategory = cat;
    }
  },

  selectCategory(id: string) {
    this.activeCategory = id;
    this.searchQuery = "";
  },

  doSearch() {
    if (this.searchQuery.trim()) {
      this.activeCategory = "all";
    }
  },

  escapeHtml(s: string): string {
    return s.replace(/[&<>"']/g, (ch) => {
      const map: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return map[ch] as string;
    });
  },

  escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  },

  highlight(text: string): string {
    const q = this.searchQuery.trim();
    const escaped = this.escapeHtml(text);
    if (!q) return escaped;
    const re = new RegExp(`(${this.escapeRegex(q)})`, "gi");
    return escaped.replace(
      re,
      '<mark class="bg-[var(--color-primary-100,#ffefb3)] text-[var(--color-primary-700,#a87c00)] rounded-sm px-0.5">$1</mark>'
    );
  },

  clearSearch() {
    this.searchQuery = "";
    const root = this.$root as HTMLElement | undefined;
    const input = root?.querySelector<HTMLInputElement>("#faq-search-input");
    input?.focus();
  },

  get matchedSubCount(): number {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return 0;
    return (this.visibleCategories as FaqCategoryCard[]).reduce(
      (sum: number, c: FaqCategoryCard) => {
        return (
          sum +
          c.subs.filter((s: { key: string; label: string }) => s.label.toLowerCase().includes(q))
            .length
        );
      },
      0
    );
  },

  get resultsLabel(): string {
    return t("helpCenter.faqResultsFound", {
      cats: (this.visibleCategories as FaqCategoryCard[]).length,
      subs: this.matchedSubCount,
    });
  },
}));

// ─── FAQ Detail Page ──────────────────────────────────────────────────
Alpine.data("faqDetail", () => ({
  catParam: "",
  subParam: "",
  openItem: null as number | null,
  helpful: "" as "" | "yes" | "no",

  // Map category IDs to their subcategory keys
  categorySubsMap: {
    intro: ["introDesc", "introMembership"],
    account: [
      "accountSettings",
      "accountCancelReactivate",
      "accountLogin",
      "accountRegister",
      "accountBecomeSeller",
    ],
    sourcing: [
      "sourcingSearch",
      "sourcingSupplierEval",
      "sourcingTradeInfo",
      "sourcingRecommender",
      "sourcingAiApp",
      "sourcingSourcing",
    ],
    negotiation: ["negotiationRfq", "negotiationMessages", "negotiationOtherIssues"],
    "place-order": [
      "placeOrderTradeAssurance",
      "placeOrderPlace",
      "placeOrderConfirm",
      "placeOrderManage",
    ],
    payment: [
      "paymentOrderPayment",
      "paymentReceipt",
      "paymentFinancial",
      "paymentPayment",
      "paymentTypes",
    ],
    tax: [
      "taxSubmitInfo",
      "taxTypes",
      "taxInvoice",
      "taxVerifyInfo",
      "taxOrderManage",
      "taxRefund",
    ],
    shipping: ["shippingShipping", "shippingLogistics", "shippingMaersk", "shippingImportFees"],
    receipt: ["receiptDelivery", "receiptCompletion"],
    inspection: ["inspectionServices", "inspectionMonitoring"],
    "after-sales": [
      "afterSalesDispute",
      "afterSalesReturn",
      "afterSalesDisputeProcess",
      "afterSalesGoodsIssue",
      "afterSalesDisputeRules",
      "afterSalesRefund",
    ],
    feedback: ["feedbackManagement", "feedbackRules"],
    security: ["securityFraud", "securityIpr"],
    others: ["othersCustomerService", "othersUnclearConcern", "othersOfflineService"],
    promotions: [
      "promotionsShoppingGuide",
      "promotionsScenario",
      "promotionsSuper",
      "promotionsPayment",
      "promotionsOtherIssues",
    ],
    guaranteed: [
      "guaranteedShipping",
      "guaranteedAfterSales",
      "guaranteedPreSales",
      "guaranteedPlaceOrder",
      "guaranteedOverseasWarehouse",
    ],
    "app-settings": ["appSettingsLabel"],
    localization: ["localizationSettings"],
  } as Record<string, string[]>,

  // Category label map
  categoryLabelMap: {
    intro: "faq.intro",
    account: "faq.account",
    sourcing: "faq.sourcing",
    negotiation: "faq.negotiation",
    "place-order": "faq.placeOrder",
    payment: "faq.payment",
    tax: "faq.tax",
    shipping: "faq.shipping",
    receipt: "faq.receipt",
    inspection: "faq.inspection",
    "after-sales": "faq.afterSales",
    feedback: "faq.feedback",
    security: "faq.security",
    others: "faq.others",
    promotions: "faq.promotions",
    guaranteed: "faq.guaranteed",
    "app-settings": "faq.appSettings",
    localization: "faq.localization",
  } as Record<string, string>,

  init() {
    const params = new URLSearchParams(window.location.search);
    this.catParam = params.get("cat") || "";
    this.subParam = params.get("sub") || "";
  },

  get categoryLabel(): string {
    const key = this.categoryLabelMap[this.catParam];
    return key ? t(key) : "";
  },

  catIcon(id: string, className = "w-5 h-5"): string {
    return getFaqCategoryIcon(id, className);
  },

  get subTitle(): string {
    return t(`faqDetail.${this.subParam}_title`) || t(`faq.${this.subParam}`) || "";
  },

  get subDescription(): string {
    return t(`faqDetail.${this.subParam}_desc`) || "";
  },

  get faqItems(): { q: string; a: string }[] {
    // i18n returnObjects unknown döner — Array.isArray ile filtrele
    const items = t(`faqDetail.${this.subParam}_items`, { returnObjects: true }) as unknown;
    if (Array.isArray(items)) return items as { q: string; a: string }[];
    return [];
  },

  get siblings(): { key: string; label: string }[] {
    const subs = this.categorySubsMap[this.catParam] || [];
    return subs.map((key: string) => ({
      key,
      label: t(`faq.${key}`) || key,
    }));
  },

  get relatedTopics(): { key: string; cat: string; label: string }[] {
    const topics: { key: string; cat: string; label: string }[] = [];
    const allCats = Object.keys(this.categorySubsMap);
    // Find 2-3 related subcategories from neighboring categories
    const catIdx = allCats.indexOf(this.catParam);
    const neighborCats = [
      allCats[(catIdx + 1) % allCats.length],
      allCats[(catIdx + 2) % allCats.length],
    ];
    for (const nc of neighborCats) {
      const subs = this.categorySubsMap[nc] || [];
      if (subs.length > 0) {
        topics.push({
          key: subs[0],
          cat: nc,
          label: t(`faq.${subs[0]}`) || subs[0],
        });
      }
    }
    return topics;
  },

  toggleItem(idx: number) {
    this.openItem = this.openItem === idx ? null : idx;
  },
}));

// ─── Contact Page ──────────────────────────────────────────────────────
Alpine.data("contactPage", () => ({
  name: "",
  email: "",
  subject: "",
  message: "",
  attachment: null as File | null,
  formSubmitting: false,
  formSubmitted: false,
  errors: {} as Record<string, string>,

  get subjectOptions() {
    return [
      t("contactForm.subjectOrder"),
      t("contactForm.subjectPayment"),
      t("contactForm.subjectShipping"),
      t("contactForm.subjectAccount"),
      t("contactForm.subjectProductQuality"),
      t("contactForm.subjectOther"),
    ];
  },

  validateForm(): boolean {
    this.errors = {};
    if (!this.name.trim()) this.errors.name = t("contactForm.nameRequired");
    if (!this.email.trim()) this.errors.email = t("contactForm.emailRequired");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email))
      this.errors.email = t("contactForm.emailInvalid");
    if (!this.subject) this.errors.subject = t("contactForm.subjectRequired");
    if (!this.message.trim()) this.errors.message = t("contactForm.messageRequired");
    return Object.keys(this.errors).length === 0;
  },

  async submitForm() {
    if (!this.validateForm()) return;
    this.formSubmitting = true;
    this.errors = {};
    try {
      const [first_name, ...rest] = this.name.trim().split(/\s+/);
      await createLead({
        email: this.email.trim(),
        first_name: first_name || this.name.trim(),
        last_name: rest.join(" "),
        message: `Konu: ${this.subject}\n\n${this.message}`,
        source: "Website Contact Form",
      });
      this.formSubmitted = true;
    } catch (e: unknown) {
      this.errors.submit = e instanceof Error ? e.message : t("contactForm.submitError");
    } finally {
      this.formSubmitting = false;
    }
  },

  resetForm() {
    this.name = "";
    this.email = "";
    this.subject = "";
    this.message = "";
    this.attachment = null;
    this.formSubmitted = false;
    this.errors = {};
  },
}));

// ─── Ticket Form (multi-step) ─────────────────────────────────────────
Alpine.data("ticketForm", () => ({
  currentStep: 1,
  category: "",
  subCategory: "",
  subject: "",
  description: "",
  orderRef: "",
  // Dropzone controller — files & progress yönetimi tradehub-upload-ui'da
  dropzoneController: null as MultiFileDropzoneController | null,
  errors: {} as Record<string, string>,
  submitted: false,
  orders: [] as OrderForTicket[],
  loadingOrders: true,

  async init() {
    try {
      this.orders = await listMyOrdersForTicket();
    } finally {
      this.loadingOrders = false;
    }

    // Dropzone container'larını DOM'a yerleştir + controller mount.
    const wrap = document.getElementById("ticket-dropzone-wrap");
    if (wrap) {
      wrap.innerHTML = MultiFileDropzoneController.renderDropzoneHtml({
        dropzoneId: "ticket-dropzone",
        fileInputId: "ticket-file-input",
        config: TICKET_DROPZONE_CONFIG,
        texts: ticketDropzoneTexts(),
      });
    }
    this.dropzoneController = new MultiFileDropzoneController({
      dropzoneId: "ticket-dropzone",
      fileInputId: "ticket-file-input",
      fileListId: "ticket-file-list",
      lightboxScope: "ticket-file",
      scopePrefix: "ticket",
      config: TICKET_DROPZONE_CONFIG,
      texts: ticketDropzoneTexts(),
      onValidationError: (kind, file) => {
        if (kind === "unsupported" && file)
          showToast({ message: `${t("helpUi.fileUnsupported")} ${file.name}`, type: "error" });
        else if (kind === "tooLarge" && file)
          showToast({ message: `${t("helpUi.fileTooLarge")} ${file.name}`, type: "error" });
        else if (kind === "duplicate" && file)
          showToast({ message: `${t("helpUi.fileDuplicate")} ${file.name}`, type: "warning" });
        else if (kind === "maxFiles")
          showToast({ message: t("helpUi.fileMaxFiles"), type: "warning" });
      },
    });
    this.dropzoneController.mount();
  },

  get files(): File[] {
    return this.dropzoneController?.files ?? [];
  },

  get categories() {
    return [
      {
        id: "siparis",
        label: t("ticketForm.catOrder"),
        subs: t("ticketForm.catOrderSubs", { returnObjects: true }) as unknown as string[],
      },
      {
        id: "odeme",
        label: t("ticketForm.catPayment"),
        subs: t("ticketForm.catPaymentSubs", { returnObjects: true }) as unknown as string[],
      },
      {
        id: "kargo",
        label: t("ticketForm.catShipping"),
        subs: t("ticketForm.catShippingSubs", { returnObjects: true }) as unknown as string[],
      },
      {
        id: "hesap",
        label: t("ticketForm.catAccount"),
        subs: t("ticketForm.catAccountSubs", { returnObjects: true }) as unknown as string[],
      },
      {
        id: "urun",
        label: t("ticketForm.catProductQuality"),
        subs: t("ticketForm.catProductQualitySubs", { returnObjects: true }) as unknown as string[],
      },
      {
        id: "diger",
        label: t("ticketForm.catOther"),
        subs: t("ticketForm.catOtherSubs", { returnObjects: true }) as unknown as string[],
      },
    ];
  },

  get subCategories(): string[] {
    const cat = this.categories.find((c: TicketFormCategory) => c.id === this.category);
    return cat ? cat.subs : [];
  },

  // Satici team'ine yonlendirilecek kategoriler — sipariş zorunlu.
  _sellerCats: ["siparis", "kargo", "urun"] as string[],

  get requiresOrder(): boolean {
    return this._sellerCats.includes(this.category);
  },

  get routingHint(): string {
    if (!this.category) return "";
    return this.requiresOrder ? t("helpUi.routingHintSeller") : t("helpUi.routingHintPlatform");
  },

  get charCount(): number {
    return this.description.length;
  },

  validateStep(step: number): boolean {
    this.errors = {};
    if (step === 1) {
      if (!this.category) this.errors.category = t("ticketForm.categoryRequired");
      if (!this.subject.trim()) this.errors.subject = t("ticketForm.subjectRequired");
    } else if (step === 2) {
      if (!this.description.trim()) this.errors.description = t("ticketForm.descriptionRequired");
      if (this.description.length < 20)
        this.errors.description = t("ticketForm.descriptionMinLength");
      if (this.requiresOrder && !this.orderRef.trim()) {
        this.errors.orderRef =
          this.orders.length === 0 ? t("helpUi.orderRefNoOrders") : t("helpUi.orderRefRequired");
      }
    }
    return Object.keys(this.errors).length === 0;
  },

  nextStep() {
    if (this.validateStep(this.currentStep)) {
      // 2 adıma dusuruldu: max step = 2
      if (this.currentStep < 2) this.currentStep++;
    }
  },

  prevStep() {
    if (this.currentStep > 1) this.currentStep--;
  },

  async submitTicket() {
    if (!this.validateStep(this.currentStep)) return;
    this.errors = {};
    try {
      const subjectLabel =
        this.categories.find((c: TicketFormCategory) => c.id === this.category)?.label || "";
      const compositeSubject = subjectLabel
        ? `[${subjectLabel}] ${this.subject.trim()}`
        : this.subject.trim();

      let description = this.description.trim();
      if (this.subCategory) description = `Alt kategori: ${this.subCategory}\n\n${description}`;
      // Platform kategorilerinde orderRef gonderilmez (backend yoksayar ama temiz kalsin)
      const effectiveOrderRef = this.requiresOrder ? this.orderRef.trim() : "";
      if (effectiveOrderRef)
        description = `${description}\n\nSipariş referansı: ${effectiveOrderRef}`;

      // ticket_type backend'te Link(HD Ticket Type) — biz form kategorilerini
      // subject ve description icine yazdigimiz icin alani bos birakiyoruz.
      const created = await createTicket({
        subject: compositeSubject,
        description,
        priority: "Medium",
        order_ref: effectiveOrderRef || undefined,
        category: this.category || undefined,
      });

      // Dosyalari ayrica upload et — ticket olusturulduktan sonra.
      // tradehub-upload-ui paralel concurrency=2 + per-file/total progress + hybrid simulated.
      // Hata olsa bile ticket kaybolmaz; kullaniciya uyari gosteriyoruz.
      if (created?.name && this.dropzoneController && this.dropzoneController.files.length > 0) {
        const csrf = (await fetchCsrfToken()) ?? "None";
        const baseUrl = (window as unknown as { API_BASE?: string }).API_BASE || "/api";
        const result = await this.dropzoneController.upload({
          endpoint: `${baseUrl}/method/tradehub_core.api.public.upload_ticket_attachment`,
          formDataFields: { ticket: created.name },
          headers: { "X-Frappe-CSRF-Token": csrf },
          concurrency: 2,
        });
        if (result.failed.length > 0) {
          const failedNames = result.failed.map((f) => f.file.name).join(", ");
          this.errors.submit = `${t("helpUi.ticketCreatedFilesFailed")} ${failedNames}`;
        }
      }

      this.submitted = true;
      setTimeout(() => {
        window.location.href = "/destek/taleplerim";
      }, 1500);
    } catch (e: unknown) {
      // Login gerekli ise auth sayfasina redirect
      const msg = e instanceof Error ? e.message : "";
      if (msg === "Unauthorized") return;
      this.errors.submit = msg || t("helpCenter.ticketSubmitError");
    }
  },
}));

// ─── Tickets List (HD Ticket, headless API) ───────────────────────────
const UI_TO_BACKEND_STATUS: Record<string, string> = {
  open: "Open",
  pending: "Replied",
  closed: "Closed",
};

function formatTicketDate(s: string): string {
  if (!s) return "";
  try {
    return new Date(s).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return s;
  }
}

// Musteri UI etiketleri
function statusLabels(): Record<string, string> {
  return {
    Open: t("helpUi.statusOpen"),
    Replied: t("helpUi.statusReplied"),
    Resolved: t("helpUi.statusResolved"),
    Closed: t("helpUi.statusClosed"),
  };
}
function priorityLabels(): Record<string, string> {
  return {
    Low: t("helpUi.priorityLow"),
    Medium: t("helpUi.priorityMedium"),
    High: t("helpUi.priorityHigh"),
    Urgent: t("helpUi.priorityUrgent"),
  };
}

function _statusDirectCls(s: string): string {
  const m: Record<string, string> = {
    Open: "bg-blue-50 text-blue-700",
    Replied: "bg-amber-50 text-amber-700",
    Resolved: "bg-emerald-50 text-emerald-700",
    Closed: "bg-gray-100 text-gray-600",
  };
  return m[s] || "bg-gray-100 text-gray-600";
}
function _statusDotDirectCls(s: string): string {
  const m: Record<string, string> = {
    Open: "bg-blue-400",
    Replied: "bg-amber-400",
    Resolved: "bg-emerald-400",
    Closed: "bg-gray-400",
  };
  return m[s] || "bg-gray-300";
}
function _priorityChipDirectCls(p: string): string {
  const m: Record<string, string> = {
    Low: "bg-gray-100 text-gray-500",
    Medium: "bg-blue-50 text-blue-600",
    High: "bg-amber-50 text-amber-700",
    Urgent: "bg-rose-50 text-rose-700",
  };
  return m[p] || "bg-gray-100 text-gray-500";
}
function _fmtDT(s: string): string {
  if (!s) return "";
  try {
    return new Date(s).toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return s;
  }
}
function _initial(s: string): string {
  return s ? String(s).trim().charAt(0).toUpperCase() : "?";
}

Alpine.data("ticketsList", () => ({
  activeTab: "all" as "all" | "open" | "pending" | "closed",
  searchQuery: "",
  currentPage: 1,
  pageSize: 10,
  loading: false,
  errorMsg: "",
  tickets: [] as TicketRow[],
  total: 0,
  statusCounts: { all: 0, Open: 0, Replied: 0, Resolved: 0, Closed: 0 } as StatusCounts,

  async init() {
    // URL'den ?tab= varsa onu seçili getir (dashboard kartından gelinen akış)
    const urlTab = new URLSearchParams(window.location.search).get("tab");
    if (urlTab && ["all", "open", "pending", "closed"].includes(urlTab)) {
      this.activeTab = urlTab as "all" | "open" | "pending" | "closed";
    }
    await Promise.all([this.reload(), this.loadCounts()]);
  },

  async loadCounts() {
    try {
      this.statusCounts = await fetchTicketStatusCounts();
    } catch {
      // sessizce yok say — count yoksa 0 gosterilir
    }
  },

  get filteredTickets(): TicketRow[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.tickets;
    return this.tickets.filter(
      (t: TicketRow) =>
        String(t.id).toLowerCase().includes(q) || (t.subject || "").toLowerCase().includes(q)
    );
  },

  get paginatedTickets(): TicketRow[] {
    return this.filteredTickets;
  },

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  },

  tabCount(status: string): number {
    const map: Record<string, keyof StatusCounts> = {
      all: "all",
      open: "Open",
      pending: "Replied",
      closed: "Closed",
    };
    const key = map[status];
    return key ? this.statusCounts[key] || 0 : 0;
  },

  setTab(tab: string) {
    if (this.activeTab === tab) return;
    this.activeTab = tab as "all" | "open" | "pending" | "closed";
    this.currentPage = 1;
    this.reload();
  },

  setPage(page: number) {
    if (this.currentPage === page) return;
    this.currentPage = page;
    this.reload();
  },

  // Frappe status (Open/Replied/Resolved/Closed) → user-facing label
  statusLabel(raw: string): string {
    // raw burada 'open'/'pending'/'closed' (UI tab keyi) olarak gelir
    const labels = statusLabels();
    const m: Record<string, string> = {
      open: labels.Open,
      pending: labels.Replied,
      closed: labels.Resolved,
    };
    return m[raw] || raw;
  },

  statusCls(raw: string): string {
    const m: Record<string, string> = {
      open: "bg-blue-50 text-blue-700",
      pending: "bg-amber-50 text-amber-700",
      closed: "bg-emerald-50 text-emerald-700",
    };
    return m[raw] || "bg-gray-100 text-gray-600";
  },

  statusDotCls(raw: string): string {
    const m: Record<string, string> = {
      open: "bg-blue-400",
      pending: "bg-amber-400",
      closed: "bg-emerald-400",
    };
    return m[raw] || "bg-gray-300";
  },

  priorityLabel(p: string): string {
    return priorityLabels()[p] || p || "";
  },

  priorityChipCls(p: string): string {
    const m: Record<string, string> = {
      Low: "bg-gray-100 text-gray-500",
      Medium: "bg-blue-50 text-blue-600",
      High: "bg-amber-50 text-amber-700",
      Urgent: "bg-rose-50 text-rose-700",
    };
    return m[p] || "bg-gray-100 text-gray-500";
  },

  priorityBarCls(p: string): string {
    const m: Record<string, string> = {
      Low: "bg-gray-200",
      Medium: "bg-blue-300",
      High: "bg-amber-300",
      Urgent: "bg-rose-400",
    };
    return m[p] || "bg-gray-100";
  },

  async reload() {
    this.loading = true;
    this.errorMsg = "";
    try {
      const backendStatus =
        this.activeTab === "all" ? "all" : UI_TO_BACKEND_STATUS[this.activeTab] || "all";
      const res = await listMyTickets({
        status: backendStatus,
        page: this.currentPage,
        pageSize: this.pageSize,
      });
      this.tickets = res.data.map((it: TicketSummary) => ({
        id: it.name,
        status: statusToTab(it.status),
        priority: it.priority || "",
        createdDate: formatTicketDate(it.creation),
        subject: it.subject || t("helpUi.noSubject"),
        category: it.ticket_type || "-",
        lastReplyLabel: formatTicketDate(it.modified),
      }));
      this.total = res.total;
      // Sayilari her listede tazele
      this.loadCounts();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (msg !== "Unauthorized") {
        this.errorMsg = msg || t("helpUi.ticketsLoadError");
      }
    } finally {
      this.loading = false;
    }
  },
}));

// ─── Ticket Detail (tekil talep + yanit yazma) ────────────────────────
Alpine.data("ticketDetail", () => ({
  ticketId: "" as string,
  ticket: null as TicketDetail | null,
  messages: [] as Array<{
    id: string;
    sender: "user" | "support";
    from: string;
    text: string;
    date: string;
  }>,
  attachments: [] as TicketAttachment[],
  loading: true,
  errorMsg: "",
  replyText: "",
  sending: false,
  sendError: "",
  closing: false,

  async init() {
    this.ticketId = new URLSearchParams(window.location.search).get("id") || "";
    if (!this.ticketId) {
      this.loading = false;
      this.errorMsg = t("helpUi.ticketIdMissing");
      return;
    }
    await this.loadAll();
  },

  async loadAll() {
    this.loading = true;
    this.errorMsg = "";
    try {
      const [tk, comms, atts] = await Promise.all([
        getTicket(this.ticketId),
        getTicketCommunications(this.ticketId),
        listTicketAttachments(this.ticketId).catch(() => []),
      ]);
      this.attachments = atts;
      this.ticket = tk;
      this.messages = comms.map((c) => ({
        id: c.name,
        sender: c.sent_or_received === "Sent" ? "support" : "user",
        from: c.sender_full_name || c.sender || "",
        text: (c.content || "").replace(/<[^>]+>/g, "").trim(),
        date: c.communication_date ? _fmtDT(c.communication_date) : "",
      }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (msg !== "Unauthorized") {
        this.errorMsg = msg || t("helpUi.ticketLoadError");
      }
    } finally {
      this.loading = false;
    }
  },

  async sendReply() {
    if (!this.replyText.trim() || !this.ticketId) return;
    this.sending = true;
    this.sendError = "";
    try {
      await replyTicket(this.ticketId, this.replyText.trim());
      this.replyText = "";
      await this.loadAll();
    } catch (e: unknown) {
      this.sendError = e instanceof Error ? e.message : t("helpUi.replySendError");
    } finally {
      this.sending = false;
    }
  },

  async closeTicket() {
    if (!this.ticketId) return;
    this.closing = true;
    try {
      await updateTicketStatus(this.ticketId, "Closed");
      await this.loadAll();
    } catch (e: unknown) {
      this.sendError = e instanceof Error ? e.message : t("helpUi.ticketCloseError");
    } finally {
      this.closing = false;
    }
  },

  initial(s: string): string {
    return _initial(s);
  },
  fmtDT(s: string): string {
    return _fmtDT(s);
  },
  statusLabel(s: string): string {
    return statusLabels()[s] || s || "-";
  },
  statusCls(s: string): string {
    return _statusDirectCls(s);
  },
  statusDotCls(s: string): string {
    return _statusDotDirectCls(s);
  },
  priorityLabel(p: string): string {
    return priorityLabels()[p] || p || "";
  },
  priorityChipCls(p: string): string {
    return _priorityChipDirectCls(p);
  },

  fmtFileSize(bytes: number): string {
    if (!bytes) return "0 KB";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  },

  fileIcon(fileName: string): string {
    const ext = (fileName || "").toLowerCase().split(".").pop() || "";
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "image";
    if (ext === "pdf") return "pdf";
    if (["doc", "docx"].includes(ext)) return "doc";
    if (["xls", "xlsx", "csv"].includes(ext)) return "sheet";
    if (["zip", "rar", "7z"].includes(ext)) return "archive";
    return "file";
  },
}));
