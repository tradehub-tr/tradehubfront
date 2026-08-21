import { describe, expect, it } from "vitest";
import type { CartDrawerItemModel } from "./SharedCartDrawer";
import { getPreviewEntries } from "./previewEntries";

function makeItem(overrides: Partial<CartDrawerItemModel>): CartDrawerItemModel {
  return {
    id: "p1",
    title: "Test Ürün",
    supplierName: "Satıcı",
    unit: "adet",
    moq: 1,
    imageKind: "jewelry",
    priceTiers: [],
    colors: [],
    sizeGroups: [],
    shippingOptions: [],
    ...overrides,
  };
}

describe("getPreviewEntries", () => {
  it("null item için boş liste döner", () => {
    expect(getPreviewEntries(null)).toEqual([]);
  });

  it("renk varyantları varsa onları döndürür (isColor: true)", () => {
    const item = makeItem({
      colors: [
        { id: "c1", label: "Asorti", colorHex: "#00b3b3", imageKind: "jewelry", imageUrl: "https://x/1.jpg" },
        { id: "c2", label: "Kırmızı", colorHex: "#cc0000", imageKind: "jewelry" },
      ],
      galleryImages: ["https://x/g1.jpg"],
    });
    const entries = getPreviewEntries(item);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual({ imageUrl: "https://x/1.jpg", colorHex: "#00b3b3", label: "Asorti", isColor: true });
    expect(entries[1]).toEqual({ imageUrl: undefined, colorHex: "#cc0000", label: "Kırmızı", isColor: true });
  });

  it("renk yoksa galeri görsellerine düşer (isColor: false)", () => {
    const item = makeItem({ galleryImages: ["https://x/g1.jpg", "https://x/g2.jpg"] });
    const entries = getPreviewEntries(item);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual({ imageUrl: "https://x/g1.jpg", isColor: false });
  });

  it("boş/eksik galeri girişlerini eler", () => {
    const item = makeItem({ galleryImages: ["", "https://x/g2.jpg"] });
    expect(getPreviewEntries(item)).toEqual([{ imageUrl: "https://x/g2.jpg", isColor: false }]);
  });

  it("renk de galeri de yoksa boş liste döner", () => {
    expect(getPreviewEntries(makeItem({}))).toEqual([]);
  });
});
