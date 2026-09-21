/**
 * Facet yenilemesi boş kategori listesi döndürdüğünde (sonuç yok) ağaçtaki
 * sayımlar ELLENMEZ; dolu liste geldiğinde sayımlar güncellenir.
 * Gerekçe: ilk yüklemede fallback ağacı basıldıktan hemen sonra motorun
 * bayraksız yenilemesi gelir; o yenileme ağacı (0)'a çekmemeli.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../i18n", () => ({
  // `numberLocale` i18n'den `getCurrentLang` okuyor; kısmi mock onu da
  // vermeli, yoksa biçimlendirme çağrısı "export tanımlı değil" ile patlar.
  t: (k: string) => k,
  getCurrentLang: () => "tr",
}));
vi.mock("./initPriceSlider", () => ({ updatePriceFacet: () => {}, initPriceSliders: () => {} }));

import { updateFacetCounts } from "./FilterSidebar";
import { renderCategoryTree } from "./renderCategoryTree";
import { buildCategoryFacetTree } from "./buildCategoryFacetTree";
import type { FilterFacets } from "../../services/listingService";

const EV = { id: "EV", name: "Ev & Bahçe", slug: "ev" };
const facets = (categories: FilterFacets["categories"]): FilterFacets => ({
  countries: [],
  categories,
  managementCertifications: [],
  productCertifications: [],
  brands: [],
  attributes: [],
  verifiedSupplierCount: 0,
  priceRange: { min: 0, max: 0, buckets: [] },
});

describe("updateFacetCounts — kategori sayımları", () => {
  beforeEach(() => {
    document.body.innerHTML = `<div data-filter-dynamic="categories">${renderCategoryTree(
      buildCategoryFacetTree(
        [
          { ...EV, count: 0, path: [] },
          { id: "MUTFAK", name: "Mutfak", slug: "mutfak", count: 7, path: [EV] },
        ],
        undefined
      )
    )}</div>`;
  });

  it("boş kategori listesi gelirse mevcut sayımları korur", () => {
    updateFacetCounts(facets([]));
    expect(document.querySelector("[data-cat-count='MUTFAK']")?.textContent).toBe("(7)");
    expect(document.querySelector("[data-cat-count='EV']")?.textContent).toBe("(7)");
  });

  it("dolu kategori listesi gelirse sayımları günceller", () => {
    updateFacetCounts(
      facets([{ id: "MUTFAK", name: "Mutfak", slug: "mutfak", count: 3, path: [EV] }])
    );
    expect(document.querySelector("[data-cat-count='MUTFAK']")?.textContent).toBe("(3)");
    expect(document.querySelector("[data-cat-count='EV']")?.textContent).toBe("(3)");
  });
});
