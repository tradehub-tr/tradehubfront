/**
 * OrderStore — API-only Sipariş State Store
 * Tüm sipariş verisi backend'den (Buyer Order DocType) gelir.
 * localStorage kullanılmaz — eski mock veri sayfa yüklenirken temizlenir.
 */

import type { Order, OrderStatus, OrderStatusColor } from "../../../types/order";
import { callMethod } from "../../../utils/api";

// Eski mock verinin tüm kalıntılarını temizle
localStorage.removeItem("tradehub_orders");
localStorage.removeItem("tradehub_orders_seeded");
localStorage.removeItem("tradehub_orders_api_migrated");

interface ApiOrderItem {
  product_name: string;
  variation: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  image: string;
}

interface ApiOrder {
  name: string;
  order_number: string;
  order_date: string;
  seller_name: string;
  status: string;
  status_color: string;
  status_description: string;
  grand_total: number;
  currency: string;
  payment_method: string;
  payment_status: string;
  shipping_status: string;
  subtotal: number;
  shipping_fee: number;
  supplier_name: string;
  supplier_code: string;
  supplier_contact: string;
  supplier_phone: string;
  supplier_email: string;
  shipping_address: string;
  ship_from: string;
  shipping_method: string;
  incoterms: string;
  cancel_reason: string;
  remittance_amount: number;
  receipt_url: string;
  refund_status: string;
  refund_reason: string;
  refund_amount: number;
  refund_requested_at: string;
  tracking_number: string;
  carrier: string;
  items: ApiOrderItem[];
}

function apiOrderToOrder(apiOrder: ApiOrder): Order {
  const dateStr = apiOrder.order_date
    ? new Date(apiOrder.order_date).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }) + ", PST"
    : "";

  return {
    id: apiOrder.name,
    orderNumber: apiOrder.order_number,
    orderDate: dateStr,
    total: String(apiOrder.grand_total || 0),
    currency: apiOrder.currency || "USD",
    seller: apiOrder.seller_name || "",
    status: (apiOrder.status || "Waiting for payment") as OrderStatus,
    statusColor: (apiOrder.status_color || "text-amber-600") as OrderStatusColor,
    statusDescription: apiOrder.status_description || "",
    products: (apiOrder.items || []).map((item) => ({
      name: item.product_name,
      variation: item.variation || "",
      unitPrice: String(item.unit_price || 0),
      quantity: item.quantity || 1,
      totalPrice: String(item.total_price || 0),
      image: item.image || "",
    })),
    shipping: {
      trackingStatus: apiOrder.shipping_status || "Pending",
      address: apiOrder.shipping_address || "",
      shipFrom: apiOrder.ship_from || "",
      method: apiOrder.shipping_method || "Standard",
      incoterms: apiOrder.incoterms || "DAP",
      trackingNumber: apiOrder.tracking_number || "",
      carrier: apiOrder.carrier || "",
    },
    payment: {
      status: apiOrder.payment_status || "Unpaid",
      hasRecord: apiOrder.payment_status === "Paid" || apiOrder.payment_status === "Refunded",
      subtotal: String(apiOrder.subtotal || 0),
      shippingFee: String(apiOrder.shipping_fee || 0),
      grandTotal: String(apiOrder.grand_total || 0),
    },
    supplier: {
      name: apiOrder.supplier_name || apiOrder.seller_name || "",
      code: apiOrder.supplier_code || "",
      contact: apiOrder.supplier_contact || "Sales Team",
      phone: apiOrder.supplier_phone || "",
      email: apiOrder.supplier_email || "",
    },
    paymentMethod: apiOrder.payment_method || "",
    createdAt: apiOrder.order_date ? new Date(apiOrder.order_date).getTime() : Date.now(),
    remittanceAmount: apiOrder.remittance_amount || 0,
    receiptUrl: apiOrder.receipt_url || "",
    refundStatus: apiOrder.refund_status || "",
    refundReason: apiOrder.refund_reason || "",
    refundAmount: apiOrder.refund_amount || 0,
  };
}

export class OrderStore {
  private orders: Order[] = [];
  private listeners = new Set<() => void>();
  private loading = false;
  private loaded = false;
  private total = 0;
  private page = 1;
  private pageSize = 24;
  private statusCounts: Record<string, number> = {};
  private cache = new Map<string, { orders: Order[]; total: number; statusCounts: Record<string, number> }>();
  private requestId = 0;
  private error = "";

  async load(query: { status?: string; search?: string; dateFrom?: string; dateTo?: string; page?: number } = {}): Promise<void> {
    await this.fetchFromApi(query);
  }

  async fetchFromApi(query: { status?: string; search?: string; dateFrom?: string; dateTo?: string; page?: number } = {}): Promise<void> {
    const requestId = ++this.requestId;
    const page = Math.max(1, query.page || 1);
    const status = query.status && query.status !== "all" ? query.status : "";
    const search = query.search?.trim() || "";
    const dateFrom = query.dateFrom || "";
    const dateTo = query.dateTo || "";
    const cacheKey = [status, search, dateFrom, dateTo, page].join("|");
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.orders = cached.orders;
      this.total = cached.total;
      this.statusCounts = cached.statusCounts;
      this.page = page;
      this.loaded = true;
      this.error = "";
      this.notify();
      return;
    }
    this.loading = true;
    this.error = "";
    this.notify();

    try {
      const result = await callMethod<{
        success: boolean;
        orders: ApiOrder[];
        total: number;
        status_counts?: Record<string, number>;
      }>("tradehub_core.api.order.get_my_orders", {
        page,
        page_size: this.pageSize,
        ...(status ? { status } : {}),
        ...(search ? { search } : {}),
        ...(dateFrom ? { date_from: dateFrom } : {}),
        ...(dateTo ? { date_to: dateTo } : {}),
      });

      if (requestId !== this.requestId) return;
      if (result?.success && Array.isArray(result.orders)) {
        this.orders = result.orders.map(apiOrderToOrder);
        this.total = Number(result.total || 0);
        this.statusCounts = result.status_counts || {};
        this.page = page;
        this.cache.set(cacheKey, { orders: this.orders, total: this.total, statusCounts: this.statusCounts });
        this.loaded = true;
      }
    } catch (err) {
      if (requestId !== this.requestId) return;
      console.warn("[OrderStore] API fetch failed:", err);
      // API başarısız → boş liste (mock data yok artık)
      this.orders = [];
      this.total = 0;
      this.statusCounts = {};
      this.error = "Siparişler yüklenemedi. Lütfen tekrar deneyin.";
    } finally {
      if (requestId === this.requestId) {
        this.loading = false;
        this.notify();
      }
    }
  }

  getOrders(): Order[] {
    return this.orders;
  }

  getTotal(): number { return this.total; }
  getPage(): number { return this.page; }
  getPageSize(): number { return this.pageSize; }
  getStatusCounts(): Record<string, number> { return this.statusCounts; }
  getError(): string { return this.error; }
  clearCache(): void { this.cache.clear(); }

  getOrderByNumber(orderNumber: string): Order | undefined {
    return this.orders.find((o) => o.orderNumber === orderNumber);
  }

  isLoading(): boolean {
    return this.loading;
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  /** Sipariş iptal — API'ye gönder */
  async cancelOrder(orderNumber: string, reason: string): Promise<boolean> {
    try {
      await callMethod<{ success: boolean }>(
        "tradehub_core.api.order.cancel_order",
        { order_number: orderNumber, reason },
        true
      );
      // Local state'i güncelle
      this.updateOrderStatus(orderNumber, "Cancelled", "text-red-600", "Order cancelled by buyer.");
      return true;
    } catch (err) {
      console.error("[OrderStore] cancel_order failed:", err);
      return false;
    }
  }

  updateOrderStatus(
    orderNumber: string,
    status: OrderStatus,
    statusColor: OrderStatusColor,
    statusDescription: string
  ): void {
    const order = this.getOrderByNumber(orderNumber);
    if (!order) return;
    const previousStatus = order.status;
    order.status = status;
    order.statusColor = statusColor;
    order.statusDescription = statusDescription;
    this.cache.clear();
    if (previousStatus !== status) {
      this.statusCounts[previousStatus] = Math.max(0, (this.statusCounts[previousStatus] || 0) - 1);
      this.statusCounts[status] = (this.statusCounts[status] || 0) + 1;
    }
    this.notify();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

export const orderStore = new OrderStore();
