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

  it("`/en` dil öneki ARTIK SOYULMAZ — şema söküldü (2026-09-21)", () => {
    // 2026-09-21'e kadar burada soyma vardı ve `/en/urun/x` → `/urun/:slug`
    // beklenirdi. Şema söküldü: `/en/...` adresleri nginx'te 301 ile önekiz
    // karşılığına dönüyor, yani bu fonksiyona hiç ulaşmıyorlar. Soyma kodu
    // dursaydı, gerçekten `/en...` diye başlayan bir pretty rota eklendiği
    // gün RUM onu yanlış kovaya yazardı.
    expect(sablon("/en/urun/bonny-kap")).toBe("other");
    expect(sablon("/en")).toBe("other");
    // Bu zaten hep `other`dı — soyma kaldırıldığında da değişmedi.
    expect(sablon("/envanter")).toBe("other");
  });

  it("bozuk/boş girdi fırlatmadan `other`a düşer", () => {
    expect(routeTemplate(normalizePhysicalPath(""))).toBe("other");
    expect(sablon("/dashboard")).toBe("other");
  });
});
