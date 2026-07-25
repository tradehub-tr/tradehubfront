// src/components/shared/ListingCard.test.ts
import { describe, expect, it } from "vitest";
import { initProductSliders, renderListingCard } from "./ListingCard";
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

describe("renderListingCard homeCompact modu", () => {
  it("yalnız ana sayfanın kullandığı tek grid varyantını üretir", () => {
    const host = document.createElement("div");
    host.innerHTML = renderListingCard(fullCard, {
      homeCompact: true,
      showDiscount: true,
      containImage: true,
    });

    expect(host.querySelector('[data-card-variant="home-compact"]')).not.toBeNull();
    expect(host.querySelectorAll("[data-fav-btn]")).toHaveLength(1);
    expect(host.querySelector(".fy26-price")?.textContent).toContain("115");
    expect(host.textContent).toContain(fullCard.name);
    expect(host.textContent).toContain("%20");
    expect(host.querySelector("[data-sp-host='LST-0001']")).not.toBeNull();

    expect(host.querySelector("[data-sp-slot]")).toBeNull();
    expect(host.querySelector(".action-area-layout")).toBeNull();
    expect(host.querySelector("[data-add-to-cart]")).toBeNull();
    expect(host.innerHTML).not.toContain("group-data-[list-mode=list]");
  });

  it("ikincil koleksiyon medyasını etkileşim öncesi template içinde tutar", () => {
    const card = {
      ...fullCard,
      images: [
        "https://example.com/img.jpg",
        "https://example.com/img-2.jpg",
        "https://example.com/img-3.jpg",
      ],
    } as unknown as ProductListingCard;
    const host = document.createElement("div");
    host.innerHTML = renderListingCard(card);

    const slider = host.querySelector<HTMLElement>("[data-slider-id='LST-0001']");
    const deferred = host.querySelector<HTMLTemplateElement>(
      "template[data-slider-secondary='LST-0001']"
    );
    expect(slider?.querySelectorAll("img")).toHaveLength(1);
    expect(deferred?.content.querySelectorAll("img")).toHaveLength(2);

    document.body.append(host);
    initProductSliders();
    document.dispatchEvent(
      new CustomEvent("slider-nav", {
        detail: { id: "LST-0001", dir: 1 },
      })
    );

    expect(slider?.querySelectorAll("img")).toHaveLength(3);
    expect(host.querySelector("template[data-slider-secondary]")).toBeNull();
    expect(slider?.style.transform).toBe("translateX(-100%)");
    host.remove();
  });

  it("40 kartlık koleksiyonda pagination kartlarını korur, yalnız 40 birincil medya mount eder", () => {
    const host = document.createElement("div");
    host.innerHTML = Array.from({ length: 40 }, (_, index) => {
      const id = `LST-COLLECTION-${index + 1}`;
      const card = {
        ...minimalCard,
        id,
        imageSrc: `https://example.com/${id}-1.jpg`,
        images: [
          `https://example.com/${id}-1.jpg`,
          `https://example.com/${id}-2.jpg`,
          `https://example.com/${id}-3.jpg`,
        ],
      } as unknown as ProductListingCard;
      return renderListingCard(card);
    }).join("");

    expect(host.querySelectorAll(".fy26-product-card-wrapper")).toHaveLength(40);
    expect(host.querySelectorAll(".product-slider img")).toHaveLength(40);
    const templates = host.querySelectorAll<HTMLTemplateElement>(
      "template[data-slider-secondary]"
    );
    expect(templates).toHaveLength(40);
    expect(
      Array.from(templates).reduce(
        (count, template) => count + template.content.querySelectorAll("img").length,
        0
      )
    ).toBe(80);
  });
});
