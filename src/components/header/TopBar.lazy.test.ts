import { describe, expect, it, vi } from "vitest";

vi.mock("../../i18n", () => ({
  t: (key: string) => key,
  getCurrentLang: () => "tr",
  updatePageTranslations: vi.fn(),
}));
vi.mock("../../utils/auth", () => ({
  isLoggedIn: () => false,
  getUser: () => null,
  getSessionUser: () => null,
  waitForAuth: () => Promise.resolve(null),
  logout: vi.fn(),
}));
vi.mock("../../services/currencyService", () => ({
  formatCurrency: (value: number) => String(value),
  formatPrice: (value: number) => String(value),
  convertPrice: (value: number) => value,
  getSelectedCurrency: () => "TRY",
  getSupportedCurrencies: () => [],
  onCurrencyChange: vi.fn(),
}));
vi.mock("../../utils/currency", () => ({
  getSelectedCurrency: () => ({ code: "TRY", symbol: "₺" }),
  setSelectedCurrency: vi.fn(),
  getCurrencySymbol: () => "₺",
}));
vi.mock("../cart/state/CartStore", () => ({
  cartStore: {
    subscribe: vi.fn(() => () => {}),
    getSummary: () => ({ itemCount: 0, subtotal: 0, currency: "₺" }),
    getSuppliers: () => [],
    getSupplier: () => undefined,
    getTotalSkuCount: () => 0,
    deleteSku: vi.fn(),
    init: vi.fn(),
    load: vi.fn(),
  },
}));

import { TopBar } from "./TopBar";

describe("TopBar lazy mobile search", () => {
  it("renders a keyboard-operable trigger and no heavy mobile search overlay initially", () => {
    const root = document.createElement("div");
    root.innerHTML = TopBar();

    const trigger = root.querySelector("#mobile-search-trigger");
    expect(trigger?.tagName).toBe("BUTTON");
    expect(trigger?.getAttribute("type")).toBe("button");
    expect(trigger?.getAttribute("aria-controls")).toBe("mobile-search-overlay");
    expect(trigger?.getAttribute("aria-expanded")).toBe("false");
    expect(root.querySelector("#mobile-search-host")?.childElementCount).toBe(0);
    expect(root.querySelector("#mobile-search-overlay")).toBeNull();
    expect(root.querySelector("#mobile-search-results-groups")).toBeNull();
  });

  it("keeps Flowbite popover shells but defers country and locale contents", () => {
    const root = document.createElement("div");
    root.innerHTML = TopBar();

    expect(root.querySelector("#popover-deliver-to")).not.toBeNull();
    expect(root.querySelector("#popover-language-currency")).not.toBeNull();
    expect(
      root.querySelector("[data-lazy-popover-content='country']")?.childElementCount
    ).toBe(0);
    expect(
      root.querySelector("[data-lazy-popover-content='locale']")?.childElementCount
    ).toBe(0);
    expect(root.querySelector("#lang-select")).toBeNull();
    expect(root.querySelector("#currency-select")).toBeNull();
  });
});
