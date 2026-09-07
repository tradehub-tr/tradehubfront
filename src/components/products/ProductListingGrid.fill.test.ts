/**
 * Az sonuç dolgusu: backend `fill_from` verdiğinde ızgara o indekse
 * "Bu ürünler de ilginizi çekebilir" başlığı koyar; asıl sonuç 0 ise büyük
 * boş-sonuç bloğu yerine kompakt uyarı + başlık basılır.
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("../../i18n", () => ({ t: (k: string) => k }));

import { ProductListingGrid } from "./ProductListingGrid";
import type { ProductListingCard } from "../../types/productListing";

const kart = (id: string): ProductListingCard => ({
  id,
  name: `Ürün ${id}`,
  href: `/urun/${id}`,
  price: "₺100",
  moq: "5 adet",
  stats: "",
  imageKind: "accessory",
});

function parse(html: string): HTMLElement {
  const el = document.createElement("div");
  el.innerHTML = html;
  return el.querySelector<HTMLElement>(".product-grid")!;
}

describe("ProductListingGrid — az sonuç dolgusu", () => {
  it("fillFrom verilmezse başlık basmaz", () => {
    const grid = parse(ProductListingGrid([kart("A"), kart("B")]));
    expect(grid.querySelector("[data-fill-heading]")).toBeNull();
    expect(grid.querySelectorAll("[role=listitem]").length).toBe(2);
  });

  it("fillFrom indeksine tam-genişlik başlık ekler; kartlar sırasını korur", () => {
    const grid = parse(ProductListingGrid([kart("A"), kart("B"), kart("C")], 1));
    const children = [...grid.children];
    expect(children[0].getAttribute("role")).toBe("listitem");
    expect(children[1].hasAttribute("data-fill-heading")).toBe(true);
    expect(children[1].className).toContain("col-span-full");
    expect(children[1].textContent).toContain("products.fillHeading");
    expect(children[2].getAttribute("role")).toBe("listitem");
    expect(children[3].getAttribute("role")).toBe("listitem");
    expect(grid.querySelectorAll("[role=listitem]").length).toBe(3);
  });

  it("fillFrom 0 ise kompakt 'sonuç yok' uyarısı + temizle düğmesi + başlık basar, büyük boş bloğu basmaz", () => {
    const grid = parse(ProductListingGrid([kart("A"), kart("B")], 0));
    const notice = grid.querySelector("[data-fill-empty]");
    expect(notice).not.toBeNull();
    expect(notice?.textContent).toContain("products.noResults");
    expect(notice?.querySelector("[data-filter-action='clear-all']")).not.toBeNull();
    expect(grid.querySelector("[data-fill-heading]")).not.toBeNull();
    expect(grid.querySelector("h3")).toBeNull();
    expect(grid.querySelectorAll("[role=listitem]").length).toBe(2);
  });

  it("ürün hiç yoksa (dolgu da boş) mevcut büyük boş-sonuç bloğu kalır", () => {
    const grid = parse(ProductListingGrid([], 0));
    expect(grid.querySelector("h3")?.textContent).toContain("products.noResults");
    expect(grid.querySelector("[data-fill-heading]")).toBeNull();
  });
});
