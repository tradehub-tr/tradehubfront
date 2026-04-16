import Alpine from "alpinejs";
import { t } from "../i18n";
import { getBaseUrl } from "../components/auth/AuthLayout";
import {
  createTicket,
  listMyTickets,
  listMyOrdersForTicket,
  fetchTicketStatusCounts,
  getTicket,
  getTicketCommunications,
  replyTicket,
  updateTicketStatus,
  type TicketSummary,
  type TicketDetail,
  type OrderForTicket,
  type StatusCounts,
} from "../services/supportService";
import { createLead } from "../services/leadService";

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
  searchResults: [] as string[],
  activeTab: "account",

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
        icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/></svg>`,
        questions: [
          { text: t("helpCenter.q_account_1"), cat: "account", sub: "accountLogin" },
          { text: t("helpCenter.q_account_2"), cat: "account", sub: "accountRegister" },
          { text: t("helpCenter.q_account_3"), cat: "account", sub: "accountRegister" },
          { text: t("helpCenter.q_account_4"), cat: "account", sub: "accountLogin" },
          { text: t("helpCenter.q_account_5"), cat: "account", sub: "accountCancelReactivate" },
          { text: t("helpCenter.q_account_6"), cat: "others", sub: "othersCustomerService" },
          { text: t("helpCenter.q_account_7"), cat: "account", sub: "accountSettings" },
          { text: t("helpCenter.q_account_8"), cat: "account", sub: "accountLogin" },
          { text: t("helpCenter.q_account_9"), cat: "account", sub: "accountCancelReactivate" },
        ],
      },
      {
        id: "sourcing",
        faqCat: "sourcing",
        label: t("helpCenter.tabSourcing"),
        icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-4.35-4.35m1.6-5.15a6.75 6.75 0 1 1-13.5 0 6.75 6.75 0 0 1 13.5 0Z"/></svg>`,
        questions: [
          { text: t("helpCenter.q_sourcing_1"), cat: "sourcing", sub: "sourcingSearch" },
          { text: t("helpCenter.q_sourcing_2"), cat: "sourcing", sub: "sourcingSearch" },
          { text: t("helpCenter.q_sourcing_3"), cat: "sourcing", sub: "sourcingSearch" },
          { text: t("helpCenter.q_sourcing_4"), cat: "sourcing", sub: "sourcingTradeInfo" },
          { text: t("helpCenter.q_sourcing_5"), cat: "sourcing", sub: "sourcingSupplierEval" },
          { text: t("helpCenter.q_sourcing_6"), cat: "sourcing", sub: "sourcingSourcing" },
          { text: t("helpCenter.q_sourcing_7"), cat: "sourcing", sub: "sourcingSourcing" },
          { text: t("helpCenter.q_sourcing_8"), cat: "sourcing", sub: "sourcingSourcing" },
          { text: t("helpCenter.q_sourcing_9"), cat: "sourcing", sub: "sourcingSupplierEval" },
        ],
      },
      {
        id: "negotiation",
        faqCat: "negotiation",
        label: t("helpCenter.tabNegotiation"),
        icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"/></svg>`,
        questions: [
          { text: t("helpCenter.q_negotiation_1"), cat: "negotiation", sub: "negotiationRfq" },
          {
            text: t("helpCenter.q_negotiation_2"),
            cat: "negotiation",
            sub: "negotiationOtherIssues",
          },
          { text: t("helpCenter.q_negotiation_3"), cat: "negotiation", sub: "negotiationMessages" },
          { text: t("helpCenter.q_negotiation_4"), cat: "negotiation", sub: "negotiationRfq" },
          { text: t("helpCenter.q_negotiation_5"), cat: "negotiation", sub: "negotiationRfq" },
          { text: t("helpCenter.q_negotiation_6"), cat: "negotiation", sub: "negotiationMessages" },
        ],
      },
      {
        id: "payment",
        faqCat: "payment",
        label: t("helpCenter.tabPayment"),
        icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"/></svg>`,
        questions: [
          { text: t("helpCenter.q_payment_1"), cat: "payment", sub: "paymentTypes" },
          { text: t("helpCenter.q_payment_2"), cat: "payment", sub: "paymentOrderPayment" },
          { text: t("helpCenter.q_payment_3"), cat: "payment", sub: "paymentReceipt" },
          { text: t("helpCenter.q_payment_4"), cat: "payment", sub: "paymentOrderPayment" },
          { text: t("helpCenter.q_payment_5"), cat: "payment", sub: "paymentFinancial" },
          { text: t("helpCenter.q_payment_6"), cat: "payment", sub: "paymentPayment" },
          { text: t("helpCenter.q_payment_7"), cat: "payment", sub: "paymentFinancial" },
          { text: t("helpCenter.q_payment_8"), cat: "payment", sub: "paymentPayment" },
          { text: t("helpCenter.q_payment_9"), cat: "payment", sub: "paymentOrderPayment" },
        ],
      },
      {
        id: "after-sales",
        faqCat: "after-sales",
        label: t("helpCenter.tabAfterSales"),
        icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"/></svg>`,
        questions: [
          { text: t("helpCenter.q_aftersales_1"), cat: "after-sales", sub: "afterSalesGoodsIssue" },
          { text: t("helpCenter.q_aftersales_2"), cat: "after-sales", sub: "afterSalesReturn" },
          { text: t("helpCenter.q_aftersales_3"), cat: "after-sales", sub: "afterSalesDispute" },
          { text: t("helpCenter.q_aftersales_4"), cat: "after-sales", sub: "afterSalesReturn" },
          {
            text: t("helpCenter.q_aftersales_5"),
            cat: "after-sales",
            sub: "afterSalesDisputeProcess",
          },
          {
            text: t("helpCenter.q_aftersales_6"),
            cat: "after-sales",
            sub: "afterSalesDisputeRules",
          },
        ],
      },
      {
        id: "self-service",
        faqCat: "others",
        label: t("helpCenter.tabSelfService"),
        icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z"/></svg>`,
        questions: [
          { text: t("helpCenter.q_selfservice_1"), cat: "others", sub: "othersCustomerService" },
          { text: t("helpCenter.q_selfservice_2"), cat: "others", sub: "othersCustomerService" },
          { text: t("helpCenter.q_selfservice_3"), cat: "app-settings", sub: "appSettingsLabel" },
          { text: t("helpCenter.q_selfservice_4"), cat: "app-settings", sub: "appSettingsLabel" },
          { text: t("helpCenter.q_selfservice_5"), cat: "others", sub: "othersCustomerService" },
          { text: t("helpCenter.q_selfservice_6"), cat: "others", sub: "othersCustomerService" },
        ],
      },
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
  _searchIndex: null as any[] | null,
  _buildSearchIndex() {
    const index: any[] = [];
    for (const sub of Object.keys(this._subToCat)) {
      const cat = this._subToCat[sub];
      const items = t(`faqDetail.${sub}_items` as any, { returnObjects: true });
      if (Array.isArray(items)) {
        items.forEach((item: any, qIndex: number) => {
          if (item && typeof item.q === "string") {
            index.push({
              text: item.q,
              cat,
              sub,
              answer: typeof item.a === "string" ? item.a : "",
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
      .map((item: any) => {
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
      .filter((r: any) => r.score > 0)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 30)
      .map((r: any) => r.item);

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
    const cat = (this.categories as any[]).find((c: any) => c.id === this.activeCategory);
    return cat ? cat.label : t("faq.allCategories");
  },

  get visibleCategories(): any[] {
    const q = this.searchQuery.trim().toLowerCase();
    let cards = this.allCategoryCards as any[];

    // Filter by sidebar selection
    if (this.activeCategory !== "all") {
      cards = cards.filter((c: any) => c.id === this.activeCategory);
    }

    // Filter by search query
    if (q) {
      cards = cards.filter(
        (c: any) =>
          c.label.toLowerCase().includes(q) ||
          c.subs.some((s: any) => s.label.toLowerCase().includes(q))
      );
    }

    return cards;
  },

  init() {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("cat");
    if (cat && this.categories.some((c: any) => c.id === cat)) {
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

  get subTitle(): string {
    return t(`faqDetail.${this.subParam}_title` as any) || t(`faq.${this.subParam}` as any) || "";
  },

  get subDescription(): string {
    return t(`faqDetail.${this.subParam}_desc` as any) || "";
  },

  get faqItems(): { q: string; a: string }[] {
    const items = t(`faqDetail.${this.subParam}_items` as any, { returnObjects: true });
    if (Array.isArray(items)) return items;
    return [];
  },

  get siblings(): { key: string; label: string }[] {
    const subs = this.categorySubsMap[this.catParam] || [];
    return subs.map((key: string) => ({
      key,
      label: t(`faq.${key}` as any) || key,
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
          label: t(`faq.${subs[0]}` as any) || subs[0],
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
    } catch (e: any) {
      this.errors.submit = e?.message || t("contactForm.submitError");
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
  files: [] as { name: string; size: number }[],
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
    const cat = this.categories.find((c: any) => c.id === this.category);
    return cat ? cat.subs : [];
  },

  get charCount(): number {
    return this.description.length;
  },

  addFiles(fileList: FileList) {
    const maxFiles = 5;
    const maxSize = 10 * 1024 * 1024;
    for (let i = 0; i < fileList.length && this.files.length < maxFiles; i++) {
      const f = fileList[i];
      if (f.size <= maxSize) {
        this.files.push({ name: f.name, size: f.size });
      }
    }
  },

  removeFile(index: number) {
    this.files.splice(index, 1);
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
      const subjectLabel = this.categories.find((c: any) => c.id === this.category)?.label || "";
      const compositeSubject = subjectLabel
        ? `[${subjectLabel}] ${this.subject.trim()}`
        : this.subject.trim();

      let description = this.description.trim();
      if (this.subCategory) description = `Alt kategori: ${this.subCategory}\n\n${description}`;
      if (this.orderRef) description = `${description}\n\nSipariş referansı: ${this.orderRef}`;

      // ticket_type backend'te Link(HD Ticket Type) — biz form kategorilerini
      // subject ve description icine yazdigimiz icin alani bos birakiyoruz.
      await createTicket({
        subject: compositeSubject,
        description,
        priority: "Medium",
        order_ref: this.orderRef.trim() || undefined,
      });
      this.submitted = true;
      setTimeout(() => {
        window.location.href = `${getBaseUrl()}pages/help/help-tickets.html`;
      }, 1500);
    } catch (e: any) {
      // Login gerekli ise auth sayfasina redirect
      if (e?.message === "Unauthorized") return;
      this.errors.submit = e?.message || t("helpCenter.ticketSubmitError");
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
const STATUS_LABELS: Record<string, string> = {
  Open: "Açık",
  Replied: "Yanıtlandı",
  Resolved: "Çözüldü",
  Closed: "Kapalı",
};
const PRIORITY_LABELS: Record<string, string> = {
  Low: "Düşük",
  Medium: "Orta",
  High: "Yüksek",
  Urgent: "Acil",
};

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
  tickets: [] as any[],
  total: 0,
  statusCounts: { all: 0, Open: 0, Replied: 0, Resolved: 0, Closed: 0 } as StatusCounts,

  async init() {
    await Promise.all([this.reload(), this.loadCounts()]);
  },

  async loadCounts() {
    try {
      this.statusCounts = await fetchTicketStatusCounts();
    } catch {
      // sessizce yok say — count yoksa 0 gosterilir
    }
  },

  get filteredTickets(): any[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.tickets;
    return this.tickets.filter(
      (t: any) =>
        String(t.id).toLowerCase().includes(q) || (t.subject || "").toLowerCase().includes(q)
    );
  },

  get paginatedTickets(): any[] {
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
    this.activeTab = tab as any;
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
    const m: Record<string, string> = {
      open: STATUS_LABELS.Open,
      pending: STATUS_LABELS.Replied,
      closed: STATUS_LABELS.Resolved,
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
    return PRIORITY_LABELS[p] || p || "";
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
        subject: it.subject || "(konusuz)",
        category: it.ticket_type || "-",
        lastReplyLabel: formatTicketDate(it.modified),
      }));
      this.total = res.total;
      // Sayilari her listede tazele
      this.loadCounts();
    } catch (e: any) {
      if (e?.message !== "Unauthorized") {
        this.errorMsg = e?.message || "Talepler yüklenemedi";
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
      this.errorMsg = "Talep ID verilmedi (?id=...).";
      return;
    }
    await this.loadAll();
  },

  async loadAll() {
    this.loading = true;
    this.errorMsg = "";
    try {
      const [tk, comms] = await Promise.all([
        getTicket(this.ticketId),
        getTicketCommunications(this.ticketId),
      ]);
      this.ticket = tk;
      this.messages = comms.map((c) => ({
        id: c.name,
        sender: c.sent_or_received === "Sent" ? "support" : "user",
        from: c.sender_full_name || c.sender || "",
        text: (c.content || "").replace(/<[^>]+>/g, "").trim(),
        date: c.communication_date ? _fmtDT(c.communication_date) : "",
      }));
    } catch (e: any) {
      if (e?.message !== "Unauthorized") {
        this.errorMsg = e?.message || "Talep yüklenemedi";
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
    } catch (e: any) {
      this.sendError = e?.message || "Yanıt gönderilemedi";
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
    } catch (e: any) {
      this.sendError = e?.message || "Talep kapatılamadı";
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
    return STATUS_LABELS[s] || s || "-";
  },
  statusCls(s: string): string {
    return _statusDirectCls(s);
  },
  statusDotCls(s: string): string {
    return _statusDotDirectCls(s);
  },
  priorityLabel(p: string): string {
    return PRIORITY_LABELS[p] || p || "";
  },
  priorityChipCls(p: string): string {
    return _priorityChipDirectCls(p);
  },
}));
