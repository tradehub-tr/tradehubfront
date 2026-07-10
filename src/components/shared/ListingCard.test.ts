// src/components/shared/ListingCard.test.ts
import { describe, expect, it } from "vitest";
import { renderListingCard } from "./ListingCard";
import type { ProductListingCard } from "../../types/productListing";

/** Tüm zengin alanları dolu kart — indirim verisi VAR ama varsayılanda gösterilmemeli. */
export const fullCard: ProductListingCard = {
  id: "LST-0001",
  name: "Gucci Bloom Eau de — Toptan Kozmetik Ürünleri, Premium Formül, Dermatolojik Test Edilmiş",
  href: "/pages/product-detail.html?id=LST-0001",
  price: "₺115,38-128,95",
  moq: "5 adet",
  stats: "",
  imageKind: "accessory",
  images: ["accessory", "electronics"],
  imageSrc: "https://example.com/img.jpg",
  promo: "Toptan özel fiyat",
  supplierYears: 25,
  supplierCountry: "TR",
  rating: 4.2,
  reviewCount: 76,
  originalPrice: "₺207,48",
  discount: "%20 indirim",
  discountPercentage: 20,
  supplierName: "EgeBeauty",
  supplierSlug: "SEL-00020",
  sellingPoint: "5 günde sevkiyat",
  brandName: "EgeBeauty",
  brandSlug: "egebeauty",
  sellerKybVerified: true,
};

export const minimalCard: ProductListingCard = {
  id: "LST-0002",
  name: "Rice — Toptan Gıda Tedariki",
  href: "/pages/product-detail.html?id=LST-0002",
  price: "₺188,33-210,48",
  moq: "10 adet",
  stats: "",
  imageKind: "packaging",
};

describe("renderListingCard karakterizasyon (taşıma güvenlik ağı)", () => {
  it("tam veri kartı — mevcut çıktı", () => {
    expect(renderListingCard(fullCard)).toMatchSnapshot();
  });

  it("minimal kart", () => {
    expect(renderListingCard(minimalCard)).toMatchSnapshot();
  });

  it("stok yok (OOS)", () => {
    expect(renderListingCard({ ...fullCard, outOfStock: true })).toMatchSnapshot();
  });

  it("KYB engelli satıcı", () => {
    expect(renderListingCard({ ...fullCard, sellerKybVerified: false })).toMatchSnapshot();
  });

  it("chat tetikleyicileri satıcı kimliğini taşır — yoksa popup ilk konuşmaya düşer", () => {
    const html = renderListingCard(fullCard);
    // 3 buton varyantı: normal, dense (mobil list), grid (mobil 2'li)
    expect(html.match(/data-seller-id="SEL-00020"/g)).toHaveLength(3);
  });

  it("indirim verisi varsayılanda GÖSTERİLMEZ", () => {
    const html = renderListingCard(fullCard);
    expect(html).not.toContain("line-through");
    expect(html).not.toContain("₺207,48");
  });
});

describe("renderListingCard showDiscount opsiyonu", () => {
  it("rozet + üstü çizili eski fiyat gösterir", () => {
    const html = renderListingCard(fullCard, { showDiscount: true });
    expect(html).toContain(">%20<");
    expect(html).toContain("line-through");
    expect(html).toContain("₺207,48");
  });

  it("OOS önceliği: stok yokken indirim rozeti basılmaz", () => {
    const html = renderListingCard({ ...fullCard, outOfStock: true }, { showDiscount: true });
    expect(html).not.toContain(">%20<");
  });

  it("KYB önceliği: KYB engelliyken indirim gösterilmez", () => {
    const html = renderListingCard(
      { ...fullCard, sellerKybVerified: false },
      { showDiscount: true }
    );
    expect(html).not.toContain(">%20<");
    expect(html).not.toContain("line-through");
  });

  it("indirim verisi yoksa rozet basılmaz", () => {
    const html = renderListingCard(minimalCard, { showDiscount: true });
    expect(html).not.toContain("line-through");
  });

  it("discountPercentage yoksa discount string'inden parse eder", () => {
    const card = { ...fullCard, discountPercentage: undefined };
    expect(renderListingCard(card, { showDiscount: true })).toContain(">%20<");
  });
});
