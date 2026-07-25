import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductListingCard } from "../../types/productListing";

const {
  searchListings,
  initCurrency,
  syncListingFavoriteHearts,
  initListingFavoriteTriggers,
  applyListingSocialProof,
} = vi.hoisted(() => ({
  searchListings: vi.fn(),
  initCurrency: vi.fn(),
  syncListingFavoriteHearts: vi.fn(),
  initListingFavoriteTriggers: vi.fn(),
  applyListingSocialProof: vi.fn(),
}));

vi.mock("../../services/listingService", () => ({ searchListings }));
vi.mock("../../services/currencyService", () => ({
  initCurrency,
  getSelectedCurrency: () => "TRY",
  getSupportedCurrencies: () => [{ code: "TRY", symbol: "₺" }],
  setSelectedCurrency: vi.fn(),
}));
vi.mock("../products/initListingFavorites", () => ({
  syncListingFavoriteHearts,
  initListingFavoriteTriggers,
}));
vi.mock("../products/initListingSocialProof", () => ({ applyListingSocialProof }));

import { initProductGrid, ProductGrid } from "./ProductGrid";

const cardFixture: ProductListingCard = {
  id: "LST-HOME",
  name: "Ana sayfa ürünü",
  href: "/urun/ana-sayfa-urunu",
  price: "₺115,38",
  moq: "5 adet",
  stats: "",
  imageKind: "accessory",
  imageSrc: "https://example.com/home.jpg",
  brandName: "EgeBeauty",
  sellerKybVerified: true,
};

describe("ProductGrid progressive ana sayfa kartları", () => {
  beforeEach(() => {
    document.body.innerHTML = ProductGrid();
    vi.clearAllMocks();
    initCurrency.mockResolvedValue(undefined);
  });

  it("ilk 8 kartı eager üretir ve kalanları görünürlük eşiğinde tek batch olarak açar", async () => {
    const products = Array.from({ length: 14 }, (_, index) => ({
      ...cardFixture,
      id: `LST-HOME-${index + 1}`,
      name: `Ana sayfa ürünü ${index + 1}`,
      imageSrc: `https://example.com/home-${index + 1}.jpg`,
    }));
    searchListings.mockResolvedValue({ products });

    let progressiveCallback: IntersectionObserverCallback | undefined;
    const observed: Element[] = [];
    class FakeIntersectionObserver {
      constructor(callback: IntersectionObserverCallback) {
        progressiveCallback = callback;
      }
      observe(target: Element) {
        observed.push(target);
      }
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
      root = null;
      rootMargin = "0px";
      thresholds = [0];
    }
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);

    await initProductGrid();

    const grid = document.getElementById("home-product-grid")!;
    expect(grid.querySelectorAll("[data-home-card]")).toHaveLength(8);
    expect(grid.querySelectorAll("[data-home-card-placeholder]")).toHaveLength(6);
    expect(grid.className).not.toContain("min-h-[2240px]");
    expect(syncListingFavoriteHearts).toHaveBeenCalledTimes(1);
    expect(applyListingSocialProof).toHaveBeenCalledWith(products.slice(0, 8), {
      root: grid,
      createMissingSlots: true,
    });

    const trigger = observed.find((node) =>
      node.hasAttribute("data-home-card-placeholder")
    );
    expect(trigger).toBeDefined();
    progressiveCallback?.(
      [{ isIntersecting: true, target: trigger } as IntersectionObserverEntry],
      {} as IntersectionObserver
    );
    await Promise.resolve();

    expect(grid.querySelectorAll("[data-home-card]")).toHaveLength(14);
    expect(grid.querySelector("[data-home-card-placeholder]")).toBeNull();
    expect(syncListingFavoriteHearts).toHaveBeenCalledTimes(2);
    expect(applyListingSocialProof).toHaveBeenLastCalledWith(products.slice(8), {
      root: grid,
      createMissingSlots: true,
    });
  });

  it.each([1, 8])("%i ürün yüklendiğinde yalnız yükleme iskeleti yüksekliğini bırakır", async (count) => {
    const products = Array.from({ length: count }, (_, index) => ({
      ...cardFixture,
      id: `LST-HOME-${index + 1}`,
    }));
    searchListings.mockResolvedValue({ products });

    await initProductGrid();

    const grid = document.getElementById("home-product-grid")!;
    expect(grid.querySelectorAll("[data-home-card]")).toHaveLength(count);
    expect(grid.querySelector("[data-home-section-skeleton]")).toBeNull();
    expect(grid.className).not.toMatch(/min-h-\[/);
  });

  it("boş yanıt verildiğinde sabit skeleton yüksekliğini bırakır", async () => {
    searchListings.mockResolvedValue({ products: [] });

    await initProductGrid();

    const grid = document.getElementById("home-product-grid")!;
    expect(document.getElementById("product-grid-empty")?.style.display).toBe("");
    expect(grid.querySelector("[data-home-section-skeleton]")).toBeNull();
    expect(grid.className).not.toMatch(/min-h-\[/);
  });

  it("API hata verdiğinde sabit skeleton yüksekliğini bırakır", async () => {
    searchListings.mockRejectedValue(new Error("network unavailable"));

    await initProductGrid();

    const grid = document.getElementById("home-product-grid")!;
    expect(document.getElementById("product-grid-empty")?.style.display).toBe("");
    expect(grid.querySelector("[data-home-section-skeleton]")).toBeNull();
    expect(grid.className).not.toMatch(/min-h-\[/);
  });
});
