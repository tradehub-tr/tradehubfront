import { afterEach, describe, expect, it, vi } from "vitest";

const { getListingDetail } = vi.hoisted(() => ({ getListingDetail: vi.fn() }));
const items = [
  { id: "ONE", image: "", title: "Bir", priceRange: "", minOrder: "", listIds: ["default"], addedAt: 3 },
  { id: "MISSING", image: "", title: "Eski snapshot", priceRange: "", minOrder: "", listIds: ["default"], addedAt: 2 },
  { id: "TWO", image: "", title: "İki", priceRange: "", minOrder: "", listIds: ["default"], addedAt: 1 },
];

vi.mock("../../i18n", () => ({ t: (key: string) => key }));
vi.mock("../../services/currencyService", () => ({
  getSelectedCurrency: () => "TRY",
  convertPrice: (value: number) => value,
  formatCurrency: (value: number, currency: string) => `${currency} ${value}`,
}));
vi.mock("../../utils/currency", () => ({ localizePriceString: (value: string) => value }));
vi.mock("../../utils/toast", () => ({ showToast: vi.fn() }));
vi.mock("../../services/browsingHistoryService", () => ({ getBrowsingHistory: () => [] }));
vi.mock("../../services/listingService", () => ({ getListingDetail }));
vi.mock("../../utils/listingUrl", () => ({ getListingUrl: ({ id }: { id: string }) => `/urun/${id}` }));
vi.mock("../../utils/sellerUrl", () => ({ getSellerUrl: () => "#" }));
vi.mock("../../utils/sanitize", () => ({ escapeHtml: (value: string) => value, sanitizeUrl: (value: string) => value }));
vi.mock("../../stores/sellerFavorites", () => ({
  getFavoriteSellers: () => [], removeSellerFromAll: vi.fn(), pruneSellerListId: vi.fn(),
}));
vi.mock("../../stores/favorites", () => ({
  getLists: () => [], getItems: () => items, getItemsByList: () => items,
  getListItemCount: () => items.length, getTotalCount: () => items.length,
  createList: vi.fn(), deleteList: vi.fn(), removeFromFavorites: vi.fn(),
  getListingSummary: (id: string) => id === "MISSING" ? null : {
    category: "Ofis", supplier: { name: "Satıcı", verified: true, country: "Turkey" },
    stock_qty: 2, in_stock: true, current_price: 10, currency: "TRY",
  },
}));

import { FavoritesLayout, initFavoritesLayout } from "./FavoritesLayout";

afterEach(() => { document.body.innerHTML = ""; vi.clearAllMocks(); });

describe("FavoritesLayout batch summaries", () => {
  it("renders N favorites and a null summary snapshot without product-detail calls", () => {
    document.body.innerHTML = FavoritesLayout();
    initFavoritesLayout();

    expect(document.querySelectorAll("[data-fav-item-id]")).toHaveLength(3);
    expect(document.body.textContent).toContain("Eski snapshot");
    expect(getListingDetail).not.toHaveBeenCalled();
  });
});
