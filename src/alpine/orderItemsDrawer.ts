import Alpine from "alpinejs";
import type { Order, OrderProduct } from "../types/order";

type SortMode = "added" | "price_asc" | "price_desc" | "qty";

function parsePrice(v: string | number): number {
  const num = parseFloat(String(v).replace(/,/g, ""));
  return isNaN(num) ? 0 : num;
}

Alpine.data("orderItemsDrawer", () => ({
  open: false,
  currentOrder: null as Order | null,
  search: "",
  sort: "added" as SortMode,
  _escHandler: null as ((e: KeyboardEvent) => void) | null,
  _orderOpenHandler: null as ((e: Event) => void) | null,

  init() {
    this._escHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && this.open) this.close();
    };
    window.addEventListener("keydown", this._escHandler);

    // Other Alpine scopes open this drawer via:
    //   $dispatch('open-order-items', order)  or
    //   window.dispatchEvent(new CustomEvent("open-order-items", { detail: order }))
    this._orderOpenHandler = (e: Event) => {
      this.openFor((e as CustomEvent<Order>).detail);
    };
    window.addEventListener("open-order-items", this._orderOpenHandler);
  },

  destroy() {
    if (this._escHandler) {
      window.removeEventListener("keydown", this._escHandler);
    }
    if (this._orderOpenHandler) {
      window.removeEventListener("open-order-items", this._orderOpenHandler);
    }
    if (this.open) {
      document.body.style.overflow = "";
    }
  },

  openFor(order: Order) {
    this.currentOrder = order;
    this.search = "";
    this.sort = "added";
    this.open = true;
    document.body.style.overflow = "hidden";
  },

  close() {
    this.open = false;
    document.body.style.overflow = "";
  },

  get filteredItems(): OrderProduct[] {
    if (!this.currentOrder) return [];
    const q = this.search.trim().toLowerCase();
    let items = [...this.currentOrder.products];
    if (q) {
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.variation && p.variation.toLowerCase().includes(q))
      );
    }
    switch (this.sort) {
      case "price_asc":
        items.sort((a, b) => parsePrice(a.unitPrice) - parsePrice(b.unitPrice));
        break;
      case "price_desc":
        items.sort((a, b) => parsePrice(b.unitPrice) - parsePrice(a.unitPrice));
        break;
      case "qty":
        items.sort((a, b) => b.quantity - a.quantity);
        break;
      default:
        // "added" → preserve original order
        break;
    }
    return items;
  },

  get totals() {
    if (!this.currentOrder) return { count: 0, lines: 0, vat: 0, grand: 0 };
    const lines = this.currentOrder.products.length;
    const count = this.currentOrder.products.reduce(
      (s, p) => s + (p.quantity || 0),
      0
    );
    const grand = parsePrice(this.currentOrder.total);
    // TR VAT 20% — backend doesn't expose VAT as a separate field
    const vat = grand - grand / 1.2;
    return { count, lines, vat, grand };
  },

  lineSubtotal(product: OrderProduct): string {
    const sub = parsePrice(product.unitPrice) * product.quantity;
    return sub.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },

  formattedGrandTotal(): string {
    if (!this.currentOrder) return "";
    const num = parsePrice(this.currentOrder.total);
    return num.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },

  canPay(): boolean {
    if (!this.currentOrder) return false;
    return this.currentOrder.status === "Waiting for payment";
  },
}));
