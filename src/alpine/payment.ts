import Alpine from "alpinejs";
import {
  fetchRecentPayments,
  fetchRecentRefunds,
  fetchAllTransactions,
  exportTransactions,
} from "../components/payment/state/PaymentStore";

Alpine.data("interactiveCard", () => ({
  cardNumber: "",
  firstName: "",
  lastName: "",
  month: "",
  year: "",
  cvv: "",
  focusField: "" as string,
  isFlipped: false,

  get brand(): string {
    const num = this.cardNumber.replace(/\s/g, "");
    if (!num) return "";
    if (/^4/.test(num)) return "VISA";
    if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num)) return "MC";
    if (/^3[47]/.test(num)) return "AMEX";
    if (/^6(?:011|5)/.test(num)) return "DISCOVER";
    if (/^35/.test(num)) return "JCB";
    if (/^9792/.test(num)) return "TROY";
    return "";
  },

  get cardName(): string {
    return `${this.firstName} ${this.lastName}`.trim().toUpperCase();
  },

  get displayNumber(): string {
    const raw = this.cardNumber.replace(/\s/g, "");
    if (!raw) return "#### #### #### ####";
    // Format with spaces first, then mask middle digits (index 5-14 like reference)
    const padded = raw.padEnd(this.brand === "AMEX" ? 15 : 16, "#");
    const formatted =
      this.brand === "AMEX"
        ? padded.replace(/(.{4})(.{6})(.{5})/, "$1 $2 $3")
        : padded.replace(/(.{4})(.{4})(.{4})(.{4})/, "$1 $2 $3 $4");
    // Mask characters at positions 5-14 (spaces excluded from masking)
    const chars = formatted.split("");
    for (let i = 0; i < chars.length; i++) {
      if (i > 4 && i < 14 && chars[i] !== " " && chars[i] !== "#") {
        chars[i] = "*";
      }
    }
    return chars.join("");
  },

  get displayExpiry(): string {
    const m = this.month || "AA";
    const y = this.year ? this.year.toString().slice(-2) : "YY";
    return `${m}/${y}`;
  },

  formatCardNumber() {
    let v = this.cardNumber.replace(/\D/g, "");
    const maxLen = this.brand === "AMEX" ? 15 : 16;
    v = v.substring(0, maxLen);
    this.cardNumber = v.match(/.{1,4}/g)?.join(" ") || "";
    // Sync to DOM for vanilla JS save handler
    const el = document.getElementById("pay-card-num") as HTMLInputElement;
    if (el) el.value = this.cardNumber;
  },
}));

Alpine.data("paymentManagement", () => ({
  payments: [] as any[],
  refunds: [] as any[],
  loading: true,
  activeTab: "payments" as "payments" | "refunds",

  async init() {
    try {
      const [payRes, refRes] = await Promise.all([
        fetchRecentPayments(1, 10),
        fetchRecentRefunds(1, 10),
      ]);
      this.payments = payRes.payments || [];
      this.refunds = refRes.refunds || [];
    } catch (e) {
      console.error("Payment management load error:", e);
    } finally {
      this.loading = false;
    }
  },

  formatDate(dateStr: string) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  },

  formatAmount(amount: number, currency: string) {
    return `${currency || "TRY"} ${(amount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  },
}));

Alpine.data("transactionList", () => ({
  transactions: [] as any[],
  loading: true,
  activeTab: "payment" as "payment" | "refund",
  activeStatus: "all" as string,
  filters: {
    dateFrom: "",
    dateTo: "",
    amount: "",
    currency: "",
  },
  pagination: { page: 1, pageSize: 20, total: 0 },

  async init() {
    await this.loadTransactions();
  },

  async loadTransactions() {
    this.loading = true;
    try {
      const params: Record<string, any> = {
        transaction_type: this.activeTab,
        page: this.pagination.page,
        page_size: this.pagination.pageSize,
      };
      if (this.activeStatus !== "all") params.status = this.activeStatus;
      if (this.filters.dateFrom) params.date_from = this.filters.dateFrom;
      if (this.filters.dateTo) params.date_to = this.filters.dateTo;
      if (this.filters.amount) params.amount_min = this.filters.amount;
      if (this.filters.currency) params.currency = this.filters.currency;

      const res = await fetchAllTransactions(params);
      this.transactions = res.transactions || [];
      this.pagination.total = res.total || 0;
    } catch (e) {
      console.error("Transaction load error:", e);
    } finally {
      this.loading = false;
    }
  },

  setTab(tab: string) {
    this.activeTab = tab as any;
    this.pagination.page = 1;
    this.loadTransactions();
  },

  setStatus(status: string) {
    this.activeStatus = status;
    this.pagination.page = 1;
    this.loadTransactions();
  },

  clearFilters() {
    this.filters = { dateFrom: "", dateTo: "", amount: "", currency: "" };
    this.activeStatus = "all";
    this.pagination.page = 1;
    this.loadTransactions();
  },

  async exportData() {
    try {
      const params: Record<string, any> = { transaction_type: this.activeTab };
      if (this.activeStatus !== "all") params.status = this.activeStatus;
      if (this.filters.dateFrom) params.date_from = this.filters.dateFrom;
      if (this.filters.dateTo) params.date_to = this.filters.dateTo;
      if (this.filters.currency) params.currency = this.filters.currency;

      const res = await exportTransactions(params);
      if (res.file_url) {
        window.open(res.file_url, "_blank");
      }
    } catch (e) {
      console.error("Export error:", e);
    }
  },

  nextPage() {
    if (this.pagination.page * this.pagination.pageSize < this.pagination.total) {
      this.pagination.page++;
      this.loadTransactions();
    }
  },

  prevPage() {
    if (this.pagination.page > 1) {
      this.pagination.page--;
      this.loadTransactions();
    }
  },

  get totalPages() {
    return Math.ceil(this.pagination.total / this.pagination.pageSize) || 1;
  },

  formatDate(dateStr: string) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  },

  formatAmount(amount: number, currency: string) {
    return `${currency || "TRY"} ${(amount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  },
}));
