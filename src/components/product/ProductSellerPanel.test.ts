import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductDetail } from "../../types/product";

const { getCurrentProduct } = vi.hoisted(() => ({ getCurrentProduct: vi.fn() }));
vi.mock("../../alpine/product", () => ({ getCurrentProduct }));

import { ProductSellerPanel } from "./ProductSellerPanel";

function makeProduct(overrides: Record<string, unknown> = {}): ProductDetail {
  // `supplier` merges deep (defaults + per-test override fields); every other
  // top-level field overrides shallowly. `supplier` must be pulled out of
  // `overrides` BEFORE the outer spread — otherwise `...rest` below would
  // replace the whole merged supplier object with just the override fields.
  const { supplier: supplierOverrides, ...rest } = overrides;
  return {
    id: "LST-1",
    title: "Test Ürün",
    images: [{ id: "1", src: "https://example.com/a.jpg", alt: "a" }],
    priceTiers: [{ minQty: 1, maxQty: null, price: 10, currency: "USD" }],
    moq: 1,
    unit: "adet",
    supplier: {
      id: "SEL-1",
      name: "Test Tedarikçi",
      verified: true,
      country: "Turkey",
      yearsInBusiness: 8,
      responseTime: "≤3sa",
      responseRate: "98%",
      onTimeDelivery: "100%",
      mainProducts: [],
      employees: "",
      annualRevenue: "",
      certifications: [],
      ...(supplierOverrides as object),
    },
    ...rest,
  } as unknown as ProductDetail;
}

describe("ProductSellerPanel", () => {
  beforeEach(() => vi.clearAllMocks());

  it("'Mağazayı Ziyaret Et' mağazanın dükkan sayfasına (/magaza/<kod>/dukkan) gider", () => {
    getCurrentProduct.mockReturnValue(makeProduct({ supplier: { id: "SEL-00026" } }));
    const doc = new DOMParser().parseFromString(ProductSellerPanel(), "text/html");
    const visit = [...doc.querySelectorAll("a")].find((a) =>
      a.textContent?.includes("Mağazayı Ziyaret Et")
    );
    expect(visit?.getAttribute("href")).toBe("/magaza/SEL-00026/dukkan");
  });

  it("satıcı logosu varsa baş harf yerine logoyu basar", () => {
    getCurrentProduct.mockReturnValue(
      makeProduct({ supplier: { logo: "/files/asel-logo.png", name: "Asel Elektrik" } })
    );
    const doc = new DOMParser().parseFromString(ProductSellerPanel(), "text/html");
    const img = doc.querySelector<HTMLImageElement>("[data-seller-logo] img");
    expect(img?.getAttribute("src")).toBe("/files/asel-logo.png");
    expect(img?.getAttribute("alt")).toBe("Asel Elektrik");
    expect(doc.querySelector("[data-seller-initial]")).toBeNull();
  });

  it("satıcı logosu yoksa baş harf avatarına düşer", () => {
    getCurrentProduct.mockReturnValue(makeProduct({ supplier: { logo: undefined } }));
    const doc = new DOMParser().parseFromString(ProductSellerPanel(), "text/html");
    expect(doc.querySelector("[data-seller-initial]")?.textContent?.trim()).toBe("T");
    expect(doc.querySelector("[data-seller-logo]")).toBeNull();
  });

  it("satıcı adını mağaza linkiyle basar", () => {
    getCurrentProduct.mockReturnValue(makeProduct());
    const html = ProductSellerPanel();
    expect(html).toContain("Test Tedarikçi");
    expect(html).toContain("SEL-1");
  });

  it("veri olmayan metrik hücresini hiç basmaz", () => {
    getCurrentProduct.mockReturnValue(
      makeProduct({ supplier: { rating: undefined, reorderRate: null, onTimeDelivery: "" } })
    );
    const html = ProductSellerPanel();
    const doc = new DOMParser().parseFromString(html, "text/html");
    const cells = doc.querySelectorAll("[data-seller-metric]");
    // rating, reorderRate, onTimeDelivery yok → yalnız responseTime kalır
    expect(cells.length).toBe(1);
    expect(cells[0].getAttribute("data-seller-metric")).toBe("responseTime");
    expect(html).not.toContain("—");
  });

  it("tüm metrikler varken dört hücre basar", () => {
    getCurrentProduct.mockReturnValue(
      makeProduct({ supplier: { rating: 4.9, reviewCount: 365, reorderRate: 17 } })
    );
    const doc = new DOMParser().parseFromString(ProductSellerPanel(), "text/html");
    expect(doc.querySelectorAll("[data-seller-metric]").length).toBe(4);
    expect(doc.body.textContent).toContain("4.9");
    expect(doc.body.textContent).toContain("365");
    expect(doc.body.textContent).toContain("17%");
  });

  it("ana pazarları virgülle listeler, yoksa satırı basmaz", () => {
    getCurrentProduct.mockReturnValue(
      makeProduct({ supplier: { mainMarkets: ["Türkiye", "Almanya"] } })
    );
    expect(ProductSellerPanel()).toContain("Türkiye, Almanya");

    getCurrentProduct.mockReturnValue(makeProduct({ supplier: { mainMarkets: [] } }));
    const doc = new DOMParser().parseFromString(ProductSellerPanel(), "text/html");
    expect(doc.querySelector("[data-seller-markets]")).toBeNull();
  });

  it("satıcı adını XSS'e karşı escape eder", () => {
    getCurrentProduct.mockReturnValue(
      makeProduct({ supplier: { name: '<img src=x onerror="alert(1)">' } })
    );
    const html = ProductSellerPanel();
    // escapeHtml() neutralises the payload structurally (< > " ' & → entities)
    // without stripping the literal word "onerror=" from the text — same
    // convention as SellerTrustCard. Assert it renders as inert escaped text,
    // not as a live <img onerror=...> element.
    expect(html).not.toContain('<img src=x onerror="alert(1)">');
    expect(html).toContain("&lt;img");
    expect(html).toContain("onerror=&quot;alert(1)&quot;");
  });
});
