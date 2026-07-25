import { describe, expect, it, vi } from "vitest";

vi.mock("../../stores/sellerFavorites", () => ({
  getFavoriteSellers: () => [],
  isSellerFavorited: () => false,
}));
vi.mock("../favorites/SellerFavoritesDropdown", () => ({
  openSellerFavoritesDropdown: vi.fn(),
}));

const { ManufacturerList } = await import("./ManufacturerList");

describe("ManufacturerList", () => {
  it("uses one responsive seller-card tree instead of parallel desktop and mobile cards", () => {
    const html = ManufacturerList();

    expect(html.match(/data-manufacturer-card/g)).toHaveLength(1);
    expect(html).not.toContain("MASAÜSTÜ KARTI");
    expect(html).not.toContain("MOBİL KARTI");
  });

  it("keeps seller and product links plus accessible favourite controls in the shared card", () => {
    const html = ManufacturerList();

    expect(html).toContain(":href=\"'/magaza/' + seller.seller_code\"");
    expect(html).toContain(":href=\"'/urun/' + encodeURIComponent(p.slug || p.name)\"");
    expect(html).toContain("data-seller-favorite-btn");
    expect(html).toContain(":aria-pressed=\"isFav(seller.seller_code)\"");
  });

  it("defers non-critical seller media and reserves image dimensions", () => {
    const html = ManufacturerList();

    expect(html).toContain(":src=\"seller.logo\"");
    expect(html).toContain(":src=\"p.image\"");
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('decoding="async"');
    expect(html).toContain('width="200" height="200"');
    expect(html).toContain('x-if="isLargeLayout && seller.gallery_images');
  });
});
