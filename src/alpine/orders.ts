import Alpine from "alpinejs";
import { t } from "../i18n";
import { callMethod } from "../utils/api";
import { orderStore } from "../components/orders/state/OrderStore";
import { getOrderTabs, getOrderFilters } from "../components/buyer-dashboard/ordersData";

export const ORDER_STATUS_MAP: Record<string, string[]> = {
  all: [],
  unpaid: ["Waiting for payment"],
  confirming: ["Confirming"],
  preparing: ["Confirming"],
  delivering: ["Delivering"],
  "refunds-aftersales": ["Cancelled"],
  "completed-review": ["Completed"],
  completed: ["Completed"],
  cancelled: ["Cancelled"],
  closed: ["Cancelled"],
};

function parsePrice(v: any): number {
  const num = parseFloat(String(v).replace(/,/g, ""));
  return isNaN(num) ? 0 : num;
}

// Order detail panel — closed state shows first N products before CTA
const PRODUCT_PREVIEW_COUNT = 5;

Alpine.data("ordersListComponent", () => ({
  activeTab: "all",
  searchQuery: "",
  dateFilter: "all",
  dateFrom: "",
  dateTo: "",
  dateOpen: false,
  timeOpen: false,
  selectedOrder: null as any,
  copiedNumber: false,
  orders: [] as any[],
  loading: true,
  error: "",

  // Order detail panel — Section 4 (Ürünler) state
  showAllProducts: false,
  productSearch: "",
  productSort: "default" as "default" | "name-asc" | "name-desc" | "price-asc" | "price-desc",

  // Order detail panel — Tab state (Kargo/Ödeme/Tedarikçi)
  activeDetailTab: "shipping" as "shipping" | "payment" | "supplier",

  async init() {
    orderStore.subscribe(() => {
      this.orders = orderStore.getOrders();
      this.loading = orderStore.isLoading();
    });

    // Backend'den siparişleri çek (OrderStore.load() → order.py::get_my_orders)
    await orderStore.load();
    this.orders = orderStore.getOrders();
    this.loading = false;

    // selectedOrder değişince detay panel state'ini sıfırla
    this.$watch("selectedOrder", () => {
      this.showAllProducts = false;
      this.productSearch = "";
      this.productSort = "default";
      this.activeDetailTab = "shipping";
    });

    // URL'de ?order=XXX varsa o siparişi otomatik aç (bildirim tıklama akışı)
    const urlOrder = new URLSearchParams(window.location.search).get("order");
    if (urlOrder) {
      const match = this.orders.find((o: any) => o.orderNumber === urlOrder);
      if (match) this.selectedOrder = match;
    }
  },

  get filteredOrders() {
    return this.orders.filter((o: any) => {
      // Status filter
      const allowedStatuses = ORDER_STATUS_MAP[this.activeTab];
      const matchStatus =
        !allowedStatuses || allowedStatuses.length === 0 || allowedStatuses.includes(o.status);

      // Search filter
      const q = this.searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.seller.toLowerCase().includes(q) ||
        o.products.some((p: any) => p.name.toLowerCase().includes(q));

      // Date filter
      let matchDate = true;
      if (this.dateFilter !== "all" && o.createdAt) {
        const orderTime = o.createdAt;
        const now = Date.now();
        if (this.dateFilter === "7d") {
          matchDate = now - orderTime <= 7 * 24 * 60 * 60 * 1000;
        } else if (this.dateFilter === "30d") {
          matchDate = now - orderTime <= 30 * 24 * 60 * 60 * 1000;
        } else if (this.dateFilter === "90d") {
          matchDate = now - orderTime <= 90 * 24 * 60 * 60 * 1000;
        } else if (this.dateFilter === "custom") {
          if (this.dateFrom) matchDate = orderTime >= new Date(this.dateFrom).getTime();
          if (this.dateTo && matchDate)
            matchDate = orderTime <= new Date(this.dateTo).getTime() + 24 * 60 * 60 * 1000;
        }
      }

      return matchStatus && matchSearch && matchDate;
    });
  },

  get filteredProducts() {
    if (!this.selectedOrder) return [] as any[];
    const products = (this.selectedOrder as any).products as any[];
    const q = this.productSearch.trim().toLowerCase();
    const filtered = q
      ? products.filter((p: any) => String(p.name).toLowerCase().includes(q))
      : products.slice();

    if (this.productSort === "name-asc") {
      filtered.sort((a: any, b: any) => String(a.name).localeCompare(String(b.name), "tr"));
    } else if (this.productSort === "name-desc") {
      filtered.sort((a: any, b: any) => String(b.name).localeCompare(String(a.name), "tr"));
    } else if (this.productSort === "price-asc") {
      filtered.sort((a: any, b: any) => parsePrice(a.totalPrice) - parsePrice(b.totalPrice));
    } else if (this.productSort === "price-desc") {
      filtered.sort((a: any, b: any) => parsePrice(b.totalPrice) - parsePrice(a.totalPrice));
    }
    return filtered;
  },

  get selectedOrderTotal(): string {
    if (!this.selectedOrder) return "";
    const total = (this.selectedOrder as any).products.reduce(
      (s: number, p: any) => s + parsePrice(p.totalPrice),
      0
    );
    return total.toLocaleString("en-US", { minimumFractionDigits: 2 });
  },

  get selectedOrderQty(): number {
    if (!this.selectedOrder) return 0;
    return (this.selectedOrder as any).products.reduce(
      (s: number, p: any) => s + (p.quantity ?? 0),
      0
    );
  },

  get productSortLabel(): string {
    const key =
      "orders.sort" +
      (this.productSort === "name-asc"
        ? "NameAsc"
        : this.productSort === "name-desc"
          ? "NameDesc"
          : this.productSort === "price-asc"
            ? "PriceAsc"
            : this.productSort === "price-desc"
              ? "PriceDesc"
              : "Default");
    return t(key);
  },

  get productPreviewCount(): number {
    return PRODUCT_PREVIEW_COUNT;
  },

  tabCount(tabId: string) {
    const allowedStatuses = ORDER_STATUS_MAP[tabId];
    if (!allowedStatuses || allowedStatuses.length === 0) return this.orders.length;
    return this.orders.filter((o: any) => allowedStatuses.includes(o.status)).length;
  },

  viewDetail(order: any) {
    this.selectedOrder = order;
    window.scrollTo({ top: 0 });
  },

  backToList() {
    this.selectedOrder = null;
    this.copiedNumber = false;
  },

  get dateFilterLabel() {
    if (this.dateFilter === "custom") return t("orders.customDate");
    if (this.dateFilter === "7d") return t("orders.last7Days");
    if (this.dateFilter === "30d") return t("orders.last30Days");
    if (this.dateFilter === "90d") return t("orders.last90Days");
    return t("orders.orderDate");
  },

  get timeRangeLabel(): string {
    const fmt = (iso: string) => {
      if (!iso) return "";
      const [y, m, d] = iso.split("-");
      return `${d}.${m}.${y}`;
    };
    const from = fmt(this.dateFrom);
    const to = fmt(this.dateTo);
    if (from && to) return `${from} - ${to}`;
    if (from) return `${from} →`;
    if (to) return `← ${to}`;
    return t("orders.selectDateRange");
  },

  setDateFilter(val: string) {
    this.dateFilter = val;
    if (val !== "custom") {
      this.dateFrom = "";
      this.dateTo = "";
    }
  },

  clearTimeRange() {
    this.dateFrom = "";
    this.dateTo = "";
    this.dateFilter = "all";
    this.timeOpen = false;
  },

  applyTimeRange() {
    if (this.dateFrom || this.dateTo) {
      this.dateFilter = "custom";
      this.timeOpen = false;
    }
  },

  copyOrderNumber() {
    if (!this.selectedOrder) return;
    navigator.clipboard.writeText((this.selectedOrder as any).orderNumber);
    this.copiedNumber = true;
    setTimeout(() => {
      this.copiedNumber = false;
    }, 2000);
  },

  // Modal states
  showOperationHistory: false,
  showPaymentHistory: false,
  showTrackPackage: false,
  showModifyShipping: false,
  showAddServices: false,
  showCancelOrder: false,
  showRefundModal: false,
  showContract: false,
  paymentHistoryTab: "records",
  cancelReason: "",
  cancellingOrder: null as any,

  // Kargo hizmet türü — dinamik
  shippingMethods: [] as {
    id: string;
    method: string;
    estimatedDays: string;
    baseCost: number;
    currency: string;
  }[],
  shippingMethodsLoading: false,
  selectedShippingMethod: "",

  // Refund form
  refundForm: { reason: "", amount: "" },
  submittingRefund: false,
  refundSuccess: false,
  refundError: "",
  refundBlocked: false,

  // Payment history data (API-driven)
  paymentRecords: [] as any[],
  refundRecords: [] as any[],
  wireRecords: [] as any[],
  paymentLoading: false,

  openModal(name: string) {
    (this as any)[name] = true;
    document.body.style.overflow = "hidden";

    // Ödeme geçmişi modal'ı açılırken API'den veri çek
    if (name === "showPaymentHistory" && this.selectedOrder) {
      this.fetchPaymentRecords((this.selectedOrder as any).orderNumber);
    }

    // Kargo değişiklik modal'ı açılırken kargo hizmet türlerini backend'den çek
    if (name === "showModifyShipping") {
      this.fetchShippingMethods();
    }
  },

  async fetchShippingMethods() {
    this.shippingMethodsLoading = true;
    this.shippingMethods = [];
    try {
      const result = await callMethod<{
        data: {
          id: string;
          method: string;
          estimatedDays: string;
          baseCost: number;
          currency: string;
        }[];
      }>("tradehub_core.api.listing.get_shipping_methods");
      this.shippingMethods = result?.data ?? [];
      // Mevcut siparişin kargo yöntemini seç, yoksa ilki
      const currentMethod = (this.selectedOrder as any)?.shipping?.method ?? "";
      const match = this.shippingMethods.find(
        (m) => m.method === currentMethod || m.id === currentMethod
      );
      this.selectedShippingMethod = match ? match.id : (this.shippingMethods[0]?.id ?? "");
    } catch (err) {
      console.warn("[Orders] Kargo yöntemleri alınamadı:", err);
    } finally {
      this.shippingMethodsLoading = false;
    }
  },

  async fetchPaymentRecords(orderNumber: string) {
    this.paymentLoading = true;
    this.paymentRecords = [];
    this.refundRecords = [];
    this.wireRecords = [];

    try {
      const result = await callMethod<{
        success: boolean;
        payments: any[];
        refunds: any[];
        wire_transfers: any[];
      }>("tradehub_core.api.order.get_payment_records", { order_number: orderNumber });

      if (result?.success) {
        this.paymentRecords = result.payments || [];
        this.refundRecords = result.refunds || [];
        this.wireRecords = result.wire_transfers || [];
      }
    } catch (err) {
      console.warn("[Orders] Payment records fetch failed:", err);
    } finally {
      this.paymentLoading = false;
    }
  },

  closeModal(name: string) {
    (this as any)[name] = false;
    document.body.style.overflow = "";
  },

  async confirmCancelOrder() {
    const order = (this.cancellingOrder || this.selectedOrder) as any;
    if (!order || !this.cancelReason) return;

    await orderStore.cancelOrder(order.orderNumber, this.cancelReason);

    this.cancelReason = "";
    this.cancellingOrder = null;
    this.closeModal("showCancelOrder");
    if (this.selectedOrder && (this.selectedOrder as any).orderNumber === order.orderNumber) {
      this.selectedOrder = null;
    }
  },

  getStepIndex(order: any) {
    if (!order) return -1;
    if (order.status === "Cancelled") return -2;
    // Receipt yüklendi ama satıcı henüz onaylamadı → Ödeme adımı aktif (index 1)
    if (order.status === "Waiting for payment") return order.receiptUrl ? 1 : 0;
    // Satıcı onayladı → Hazırlanıyor/Kargo adımı aktif (index 2)
    if (order.status === "Confirming") return 2;
    if (order.status === "Delivering") return 3;
    if (order.status === "Completed") return 4;
    return 0;
  },

  getStatusLabel(order: any): string {
    if (!order) return "";
    // İade durumu ana statüden önce gelir
    if (order.refundStatus === "Pending") return "İade İnceleniyor";
    if (order.refundStatus === "Approved") return "İade Onaylandı";
    if (order.refundStatus === "Rejected") return "İade Reddedildi";
    // Normal akış
    if (order.status === "Waiting for payment") {
      return order.receiptUrl ? "Ödeme Onaylanıyor" : "Ödeme Bekleniyor";
    }
    const labels: Record<string, string> = {
      Confirming: "Hazırlanıyor",
      Delivering: "Kargoda",
      Completed: "Tamamlandı",
      Cancelled: "İptal Edildi",
    };
    return labels[order.status] || order.status || "Bilinmeyen Durum";
  },

  getStatusDescription(order: any): string {
    if (!order) return "";
    // İade durumu açıklamaları
    if (order.refundStatus === "Pending") {
      return "İade talebiniz satıcı tarafından inceleniyor. En kısa sürede geri dönüş yapılacaktır.";
    }
    if (order.refundStatus === "Approved") {
      const amt = order.refundAmount
        ? `${order.currency} ${Number(order.refundAmount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} tutarındaki`
        : "";
      return `${amt} iade talebiniz onaylandı. Ödeme bilgilerinizi kontrol edin.`;
    }
    if (order.refundStatus === "Rejected") {
      return "Satıcı iade talebinizi reddetti. Detaylar için satıcıyla iletişime geçin.";
    }
    // Normal akış açıklamaları
    if (order.status === "Waiting for payment") {
      return order.receiptUrl
        ? "Havale dekontu inceleniyor. Satıcı ödemenizi onayladıktan sonra sipariş hazırlanmaya başlayacak."
        : "Ödemenizi tamamlamak için havale makbuzunu gönderin.";
    }
    return order.statusDescription || "";
  },

  getStatusColor(order: any): string {
    if (!order) return "text-gray-500";
    // İade renkleri
    if (order.refundStatus === "Pending") return "text-orange-600";
    if (order.refundStatus === "Approved") return "text-purple-600";
    if (order.refundStatus === "Rejected") return "text-red-600";
    // Normal akış
    if (order.status === "Waiting for payment") {
      return order.receiptUrl ? "text-blue-600" : "text-amber-600";
    }
    return order.statusColor || "text-gray-500";
  },

  hasActiveRefund(order: any): boolean {
    return order && ["Pending", "Approved", "Rejected"].includes(order.refundStatus);
  },

  // İade adım barı index'i: 0=talep edildi, 1=inceleniyor, 2=sonuçlandı
  getRefundStepIndex(order: any): number {
    if (!order) return 0;
    if (order.refundStatus === "Pending") return 1;
    if (order.refundStatus === "Approved" || order.refundStatus === "Rejected") return 2;
    return 0;
  },

  getRefundStepColor(order: any): string {
    if (order?.refundStatus === "Rejected") return "bg-red-500";
    if (order?.refundStatus === "Approved") return "bg-emerald-500";
    return "bg-orange-500";
  },

  isCancelled(order: any) {
    return order?.status === "Cancelled";
  },

  isActionable(order: any) {
    return order && order.status !== "Cancelled" && order.status !== "Completed";
  },

  canPay(order: any) {
    return order && order.status === "Waiting for payment" && !order.receiptUrl;
  },

  hasReceipt(order: any) {
    return order && !!order.receiptUrl;
  },

  openRemittanceModal(
    orderNumber: string,
    orderTotal?: number,
    orderCurrency?: string,
    paymentMethod?: string
  ) {
    document.dispatchEvent(
      new CustomEvent("remittance:open", {
        detail: { orderNumber, orderTotal, orderCurrency, paymentMethod },
      })
    );
  },

  async downloadInvoice(order: any) {
    if (!order) return;
    try {
      const res = await callMethod<{ html: string; filename: string }>(
        "tradehub_core.api.order.download_invoice",
        { order_number: order.orderNumber }
      );
      if (res?.html) {
        const blob = new Blob([res.html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const w = window.open(url, "_blank");
        if (w) {
          setTimeout(() => URL.revokeObjectURL(url), 10000);
        }
      }
    } catch (err: any) {
      console.warn("[Orders] Invoice download failed:", err);
    }
  },

  openRefundModal(order: any) {
    if (!order) return;
    // Kargoya verilmemiş veya teslim edilmemişse iade yapılamaz
    if (!this.canRefund(order)) {
      this.refundBlocked = true;
      this.refundError =
        "İade talebi yalnızca kargoya verilmiş veya teslim edilmiş siparişler için açılabilir.";
      this.refundSuccess = false;
      this.showRefundModal = true;
      document.body.style.overflow = "hidden";
      return;
    }
    // Bekleyen veya onaylanmış iade varsa yeni talep açılamaz
    if (["Pending", "Approved"].includes(order.refundStatus)) {
      this.refundBlocked = true;
      this.refundError =
        order.refundStatus === "Approved"
          ? "Bu sipariş için iade talebiniz zaten onaylanmıştır."
          : "Bu sipariş için bekleyen bir iade talebiniz zaten bulunmaktadır.";
      this.refundSuccess = false;
      this.showRefundModal = true;
      document.body.style.overflow = "hidden";
      return;
    }
    const grandTotal = order.total || 0;
    this.refundForm = { reason: "", amount: String(grandTotal) };
    this.refundBlocked = false;
    this.refundSuccess = false;
    this.refundError = "";
    this.showRefundModal = true;
    document.body.style.overflow = "hidden";
  },

  async submitRefundRequest() {
    const order = this.selectedOrder as any;
    if (!order || !this.refundForm.reason.trim()) return;
    this.submittingRefund = true;
    this.refundError = "";
    try {
      await callMethod<{ success: boolean }>(
        "tradehub_core.api.order.submit_refund_request",
        {
          order_number: order.orderNumber,
          reason: this.refundForm.reason,
          amount: this.refundForm.amount,
        },
        true
      );
      this.refundSuccess = true;
    } catch (err: any) {
      this.refundError = err?.message || "Bir hata oluştu.";
    } finally {
      this.submittingRefund = false;
    }
  },

  // Kargoya verilmiş veya teslim edilmişse iade edilebilir
  canRefund(order: any): boolean {
    if (!order) return false;
    if (!["Delivering", "Completed"].includes(order.status)) return false;
    // Zaten aktif iade varsa tekrar açılamaz
    if (["Pending", "Approved"].includes(order.refundStatus)) return false;
    return true;
  },

  // Kargoya verilmemiş veya teslim edilmemişse iptal edilebilir
  canCancel(order: any): boolean {
    if (!order) return false;
    if (["Cancelled", "Completed", "Delivering"].includes(order.status)) return false;
    // İade süreci aktifse iptal edilemez
    if (["Pending", "Approved"].includes(order.refundStatus)) return false;
    return true;
  },

  // Sipariş kargoya verilmediyse kargo bilgileri değiştirilebilir
  canModifyShipping(order: any): boolean {
    if (!order) return false;
    if (["Delivering", "Completed", "Cancelled"].includes(order.status)) return false;
    if (["Pending", "Approved"].includes(order.refundStatus)) return false;
    return true;
  },

  totalQty(order: any): number {
    return ((order?.products ?? []) as Array<{ quantity?: number }>)
      .reduce((s, p) => s + (p.quantity ?? 0), 0);
  },
}));

Alpine.data("ordersSection", () => ({
  activeTabId: getOrderTabs()[0].id,
  selectedFilterId: getOrderFilters()[0].id as string | null,
  dropdownOpen: false,
  orders: [] as any[],
  loading: true,

  async init() {
    orderStore.subscribe(() => {
      this.orders = orderStore.getOrders();
      this.loading = orderStore.isLoading();
    });
    await orderStore.load();
    this.orders = orderStore.getOrders();
    this.loading = false;
  },

  get filteredOrders() {
    const tabStatusMap: Record<string, string[]> = {
      delivery: ["Delivering", "Confirming", "Waiting for payment"],
      refunds: ["Cancelled"],
      completed: ["Completed"],
    };
    const allowed = tabStatusMap[this.activeTabId];
    if (!allowed || allowed.length === 0) return this.orders;
    return this.orders.filter((o: any) => allowed.includes(o.status));
  },

  selectTab(tabId: string, hasDropdown: boolean) {
    if (hasDropdown) {
      if (this.activeTabId === tabId) {
        this.dropdownOpen = !this.dropdownOpen;
        return;
      }
      this.activeTabId = tabId;
      this.dropdownOpen = true;
    } else {
      this.activeTabId = tabId;
      this.dropdownOpen = false;
    }
  },

  selectFilter(filterId: string) {
    this.selectedFilterId = filterId;
    this.dropdownOpen = false;
  },
}));

Alpine.data("refundsComponent", () => ({
  refunds: [] as any[],
  loading: true,

  async init() {
    try {
      const res = await callMethod<{ success: boolean; refunds: any[] }>(
        "tradehub_core.api.order.get_my_refunds"
      );
      this.refunds = res?.refunds || [];
    } catch (err) {
      console.warn("[Refunds] fetch failed:", err);
    } finally {
      this.loading = false;
    }
  },

  statusClass(status: string) {
    if (status === "Approved" || status === "Onaylandı")
      return "bg-green-50 text-green-700 border border-green-200";
    if (status === "Rejected" || status === "Reddedildi")
      return "bg-red-50 text-red-700 border border-red-200";
    return "bg-amber-50 text-amber-700 border border-amber-200";
  },
}));
