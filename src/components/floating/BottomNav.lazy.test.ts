import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../i18n", () => ({ t: (key: string) => key }));
const { subscribeCategories } = vi.hoisted(() => ({ subscribeCategories: vi.fn() }));
vi.mock("../../services/categoryService", () => ({ subscribeCategories }));
vi.mock("../../utils/auth", () => ({ waitForAuth: () => Promise.resolve(null) }));
vi.mock("../../services/currencyService", () => ({
  getSelectedCurrency: () => "TRY",
  getSelectedCurrencyInfo: () => ({ code: "TRY", symbol: "₺" }),
  getSupportedCurrencies: () => [],
  setSelectedCurrency: vi.fn(),
  onCurrencyChange: vi.fn(),
}));

import { BottomNav, initCategoryFullscreen } from "./BottomNav";

afterEach(() => {
  document.body.innerHTML = "";
  document.body.style.overflow = "";
  vi.clearAllMocks();
});

describe("BottomNav lazy overlays", () => {
  it("renders small accessible triggers and empty overlay hosts initially", () => {
    const root = document.createElement("div");
    root.innerHTML = BottomNav();

    const categoryTrigger = root.querySelector("#bottom-nav-categories");
    const accountTrigger = root.querySelector("#bottom-nav-account");
    expect(categoryTrigger?.getAttribute("aria-controls")).toBe("cat-fullscreen-overlay");
    expect(categoryTrigger?.getAttribute("aria-expanded")).toBe("false");
    expect(accountTrigger?.getAttribute("aria-controls")).toBe("account-fullscreen-overlay");
    expect(accountTrigger?.getAttribute("aria-expanded")).toBe("false");
    expect(root.querySelector("#bottom-nav-category-host")?.childElementCount).toBe(0);
    expect(root.querySelector("#bottom-nav-account-host")?.childElementCount).toBe(0);
    expect(root.querySelector("#cat-fullscreen-overlay")).toBeNull();
    expect(root.querySelector("#account-fullscreen-overlay")).toBeNull();
  });

  it("unsubscribes its category renderer and releases its lock when detached", async () => {
    const unsubscribe = vi.fn();
    subscribeCategories.mockImplementation((render) => {
      render([{ id: "office", name: "Ofis", slug: "ofis", children: [] }]);
      return { ready: Promise.resolve(), unsubscribe };
    });
    document.body.innerHTML = BottomNav();
    await initCategoryFullscreen();

    document.getElementById("bottom-nav-categories")?.click();
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.getElementById("cat-fullscreen-overlay")).not.toBeNull();

    document.body.innerHTML = "";
    await Promise.resolve();

    expect(unsubscribe).toHaveBeenCalledOnce();
    expect(document.body.style.overflow).toBe("");
    const tab = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    document.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(false);
  });
});
