import { afterEach, describe, expect, it, vi } from "vitest";
import Alpine from "alpinejs";
import collapse from "@alpinejs/collapse";

vi.mock("../../i18n", () => ({ t: (key: string) => key }));
vi.mock("../../services/currencyService", () => ({
  formatCurrency: (value: number) => `₺${value}`,
}));
vi.mock("../../utils/currency", () => ({ getCurrencyCode: () => "TRY" }));
vi.mock("../../utils/auth", () => ({ getUser: () => null, isLoggedIn: () => false }));
vi.mock("../../utils/toast", () => ({ showToast: vi.fn() }));

import "../../alpine/checkout";
import { ItemsDeliverySection, type CheckoutDeliveryOrderGroup } from "./ItemsDeliverySection";

Alpine.plugin(collapse);

const orders: CheckoutDeliveryOrderGroup[] = [
  {
    orderId: "ORDER-1",
    orderLabel: "1",
    sellerId: "SELLER-1",
    sellerName: "Birinci Tedarikçi",
    methods: [{ id: "standard", etaLabel: "Standart", shippingFee: 10, isDefault: true }],
    products: [{ id: "P-1", title: "Birinci ürün", moqLabel: "1 adet", image: "/one.jpg", skuLines: [{ id: "SKU-1", image: "/one.jpg", variantText: "Mavi", unitPrice: 20, quantity: 1 }] }],
  },
  {
    orderId: "ORDER-2",
    orderLabel: "2",
    sellerId: "SELLER-2",
    sellerName: "İkinci Tedarikçi",
    methods: [{ id: "express", etaLabel: "Ekspres", shippingFee: 20, isDefault: true }],
    products: [{ id: "P-2", title: "İkinci ürün", moqLabel: "1 adet", image: "/two.jpg", skuLines: [{ id: "SKU-2", image: "/two.jpg", variantText: "Kırmızı", unitPrice: 30, quantity: 1 }] }],
  },
];

afterEach(() => {
  document.body.innerHTML = "";
});

describe("ItemsDeliverySection supplier bodies", () => {
  it("does not mount closed multi-supplier product bodies, and preserves checkout-level state across reopen", async () => {
    document.body.innerHTML = ItemsDeliverySection({ orders });
    const root = document.getElementById("checkout-items") as HTMLElement;

    Alpine.initTree(root);
    await Alpine.nextTick();

    const triggers = Array.from(
      root.querySelectorAll<HTMLButtonElement>("[data-checkout-supplier-trigger]")
    );
    expect(triggers).toHaveLength(2);
    expect(root.querySelectorAll("[data-checkout-supplier-body]")).toHaveLength(0);

    const firstPanelId = triggers[0].getAttribute("aria-controls");
    expect(firstPanelId).toBeTruthy();
    expect(triggers[0].getAttribute("aria-expanded")).toBe("false");
    expect(document.getElementById(firstPanelId!)).toBeNull();

    const checkoutState = (root as HTMLElement & { _x_dataStack: Array<Record<string, unknown>> })
      ._x_dataStack[0];
    checkoutState.selectedMethodByOrderId = { "ORDER-1": "standard" };
    checkoutState.supplierNotesByOrderId = { "ORDER-1": "Kapıya bırakın" };

    triggers[0].click();
    await Alpine.nextTick();
    expect(root.querySelectorAll("[data-checkout-supplier-body]")).toHaveLength(1);
    expect(document.getElementById(firstPanelId!)).not.toBeNull();
    expect(triggers[0].getAttribute("aria-expanded")).toBe("true");

    triggers[0].click();
    await Alpine.nextTick();
    expect(document.getElementById(firstPanelId!)).toBeNull();
    expect(triggers[0].getAttribute("aria-expanded")).toBe("false");

    triggers[0].click();
    await Alpine.nextTick();
    expect(document.getElementById(firstPanelId!)).not.toBeNull();
    expect(checkoutState.selectedMethodByOrderId).toEqual({ "ORDER-1": "standard" });
    expect(checkoutState.supplierNotesByOrderId).toEqual({ "ORDER-1": "Kapıya bırakın" });
  });
});
