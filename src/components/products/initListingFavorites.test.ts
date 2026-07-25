import { describe, expect, it, vi } from "vitest";

vi.mock("../../stores/favorites", () => ({
  isItemFavorited: (id: string) => id === "inside",
}));
vi.mock("../favorites/FavoritesDropdown", () => ({ openFavoritesDropdown: vi.fn() }));
vi.mock("../../utils/auth", () => ({ isLoggedIn: () => true }));
vi.mock("../product/LoginModal", () => ({ showLoginModal: vi.fn() }));

import { syncListingFavoriteHearts } from "./initListingFavorites";

describe("syncListingFavoriteHearts", () => {
  it("yalnız verilen batch kökündeki kalpleri senkronlar", () => {
    document.body.innerHTML = `
      <section id="batch">
        <button data-fav-btn="inside" class="text-gray-500">
          <svg fill="none" stroke="currentColor"></svg>
        </button>
      </section>
      <button data-fav-btn="outside" class="text-red-500">
        <svg fill="#ef4444" stroke="#ef4444"></svg>
      </button>
    `;

    const batch = document.getElementById("batch")!;
    syncListingFavoriteHearts(batch);

    const inside = batch.querySelector<HTMLButtonElement>("[data-fav-btn]")!;
    const outside = document.querySelector<HTMLButtonElement>('[data-fav-btn="outside"]')!;
    expect(inside.classList.contains("text-red-500")).toBe(true);
    expect(inside.querySelector("svg")?.getAttribute("fill")).toBe("#ef4444");
    expect(outside.classList.contains("text-red-500")).toBe(true);
    expect(outside.querySelector("svg")?.getAttribute("fill")).toBe("#ef4444");
  });
});
