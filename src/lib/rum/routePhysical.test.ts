/**
 * T-123 — fiziksel yol normalizasyonu testleri.
 *
 * Ölçülen olgu (2026-08-20): iç bağlantıların bir kısmı pretty URL
 * (`/urunler`), bir kısmı fiziksel dosya (`/pages/products.html?cat=x`)
 * kullanıyor. Normalizasyon olmadan fiziksel yolların TAMAMI `other`
 * kovasına düşer ve sayfa-tipi kırılımı oluşmazdı. Bu test, fiziksel
 * yolların `routeTemplate()` sonrası beyaz listedeki şablona indiğini
 * sabitler.
 */
import { describe, expect, it } from "vitest";
import { normalizePhysicalPath } from "./routePhysical.js";
import { routeTemplate } from "./context.js";

const sablon = (p: string) => routeTemplate(normalizePhysicalPath(p));

describe("normalizePhysicalPath — fiziksel dosya yolları", () => {
  it.each([
    ["/index.html", "/"],
    ["/pages/products.html", "/urunler"],
    ["/pages/cart.html", "/sepet"],
    ["/pages/product-detail.html", "/urun/:slug"],
    ["/pages/categories.html", "/kategori/:slug"],
    ["/pages/brand.html", "/marka/:slug"],
    ["/pages/seller/seller-storefront.html", "/magaza/:code"],
  ])("%s → %s", (fiziksel, beklenen) => {
    expect(sablon(fiziksel)).toBe(beklenen);
  });

  it("beyaz liste dışı fiziksel sayfa `other` kalır (sunucu sözleşmesi)", () => {
    expect(sablon("/pages/manufacturers.html")).toBe("other");
    expect(sablon("/pages/dashboard/orders.html")).toBe("other");
  });
});

describe("normalizePhysicalPath — pretty URL geçirgenliği", () => {
  it("pretty yollar olduğu gibi şablona iner", () => {
    expect(sablon("/urunler")).toBe("/urunler");
    expect(sablon("/urun/bonny-kap")).toBe("/urun/:slug");
    expect(sablon("/sepet")).toBe("/sepet");
    expect(sablon("/")).toBe("/");
  });

  it("`/en` dil öneki soyulur (Faz 7 path prefix)", () => {
    expect(sablon("/en/urun/bonny-kap")).toBe("/urun/:slug");
    expect(sablon("/en/urunler")).toBe("/urunler");
    expect(sablon("/en")).toBe("/");
    // /en ile BAŞLAYAN ama dil öneki olmayan yol soyulmaz
    expect(sablon("/envanter")).toBe("other");
  });

  it("bozuk/boş girdi fırlatmadan `other`a düşer", () => {
    expect(routeTemplate(normalizePhysicalPath(""))).toBe("other");
    expect(sablon("/dashboard")).toBe("other");
  });
});
