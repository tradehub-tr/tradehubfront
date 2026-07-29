import { describe, expect, it } from "vitest";
import { mapListingDetail } from "./listingService";

const RAW_BASE = {
  id: "LST-9",
  title: "Map Test",
  images: [],
  priceTiers: [{ minQty: 1, maxQty: null, price: 5 }],
  currency: "USD",
  moq: 1,
  unit: "adet",
};

describe("mapListingDetail — supplier metrikleri", () => {
  it("mağaza puanı, yorum sayısı, ana pazarlar ve tekrar sipariş oranını taşır", () => {
    const p = mapListingDetail({
      ...RAW_BASE,
      supplier: {
        name: "Tedarikçi",
        sellerCode: "SEL-9",
        kybVerified: true,
        rating: 4.9,
        reviewCount: 365,
        mainMarkets: ["Türkiye", "Almanya"],
        reorderRate: 17,
      },
    });
    expect(p.supplier.rating).toBe(4.9);
    expect(p.supplier.reviewCount).toBe(365);
    expect(p.supplier.mainMarkets).toEqual(["Türkiye", "Almanya"]);
    expect(p.supplier.reorderRate).toBe(17);
  });

  it("reorderRate null geldiğinde null kalır (0'a düşmez)", () => {
    const p = mapListingDetail({
      ...RAW_BASE,
      supplier: { name: "T", sellerCode: "SEL-9", reorderRate: null },
    });
    expect(p.supplier.reorderRate).toBeNull();
  });

  it("mainMarkets yoksa mainProducts'a düşer", () => {
    const p = mapListingDetail({
      ...RAW_BASE,
      supplier: { name: "T", sellerCode: "SEL-9", mainProducts: ["Tekstil"] },
    });
    expect(p.supplier.mainMarkets).toEqual(["Tekstil"]);
  });
});
