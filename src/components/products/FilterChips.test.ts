/**
 * Aktif filtre etiketleri — tasarım E ("Kompakt nötr + '+N daha'"):
 *  - Etiketler küçük ve nötr; turuncu yalnız "+N daha" etiketinde; sonda "Temizle".
 *  - Masaüstü (≥1024px): ilk 6 etiket görünür, fazlası "+N daha" ile açılır.
 *  - Mobil: etiketler + "+N daha" + "Temizle" en fazla 2 satır; sığmayan etiketler
 *    gizlenir, "+N daha" 2. satırın sonunda durur (ölçümle, layoutChips).
 */
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../i18n", () => ({
  t: (k: string, o?: Record<string, unknown>) => (o?.count !== undefined ? `${k}:${o.count}` : k),
}));
vi.mock("../../utils/currency", () => ({ getCurrencySymbol: () => "₺" }));
// Ülke etiketi: backend "Turkey" → arayüzde "Türkiye" (utils/country.getCountryDisplayName)
vi.mock("../../utils/country", () => ({
  getCountryDisplayName: (c: string) => (c === "Turkey" || c === "TR" ? "Türkiye" : c),
}));

import { renderFilterChips, layoutChips, CHIPS_DESKTOP_LIMIT } from "./FilterChips";
import type { FilterState } from "./filterEngine";

const state = (over: Partial<FilterState> = {}): FilterState => ({
  priceMin: null,
  priceMax: null,
  minOrder: null,
  supplierCountries: [],
  brands: [],
  verifiedSupplier: false,
  mgmtCertifications: [],
  productCertifications: [],
  attributes: {},
  ...over,
});

function mount(html: string): HTMLElement {
  document.body.innerHTML = `<div id="active-filter-chips">${html}</div>`;
  return document.getElementById("active-filter-chips")!;
}
const shown = (c: HTMLElement) =>
  [...c.querySelectorAll<HTMLElement>("[data-chip]")].filter((x) => x.style.display !== "none")
    .length;
const setDesktop = (yes: boolean) => {
  window.matchMedia = ((q: string) => ({ matches: yes && q.includes("1024"), media: q })) as never;
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("renderFilterChips — tasarım E", () => {
  it("hiç filtre yoksa boş döner", () => {
    expect(renderFilterChips(state())).toBe("");
  });

  it("etiketler nötr renkte ve küçük; '+N daha' ve Temizle liste sonunda", () => {
    const c = mount(renderFilterChips(state({ brands: ["A", "B"] })));
    const chip = c.querySelector("[data-chip]");
    expect(chip?.className).toContain("text-[11px]");
    expect(chip?.className).toContain("--color-surface-raised");
    expect(chip?.className).not.toContain("bg-primary-50");
    const list = c.querySelector("[data-chips-list]")!;
    const kids = [...list.children];
    expect(kids[kids.length - 2].hasAttribute("data-chips-toggle")).toBe(true);
    expect(kids[kids.length - 2].className).toContain("bg-primary-50");
    expect(kids[kids.length - 1].getAttribute("data-filter-action")).toBe("clear-all");
    expect(kids[kids.length - 1].textContent).toContain("common.clear");
  });
});

describe("renderFilterChips — ülke etiketi", () => {
  it("backend 'Turkey' değeri etikette 'Türkiye' yazar, değer ham kalır", () => {
    const c = mount(renderFilterChips(state({ supplierCountries: ["Turkey"] })));
    const chip = c.querySelector<HTMLElement>("[data-chip]")!;
    expect(chip.querySelector("span")!.textContent).toBe("Türkiye");
    // Kaldırma düğmesi ham backend değeriyle çalışmaya devam eder
    expect(chip.querySelector("button")!.getAttribute("@click")).toContain(
      "'supplier-country', 'Turkey'"
    );
  });
});

describe("layoutChips", () => {
  it("masaüstünde ilk 6 etiket kalır, '+N daha' gizlenen sayıyı yazar", () => {
    setDesktop(true);
    const c = mount(renderFilterChips(state({ brands: "ABCDEFGHI".split("") })));
    layoutChips(c);
    expect(CHIPS_DESKTOP_LIMIT).toBe(6);
    expect(shown(c)).toBe(6);
    const toggle = c.querySelector<HTMLElement>("[data-chips-toggle]")!;
    expect(toggle.style.display).not.toBe("none");
    expect(toggle.textContent).toContain("products.chipsShowMore:3");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("masaüstünde 6 ve altı etikette '+N daha' görünmez", () => {
    setDesktop(true);
    const c = mount(renderFilterChips(state({ brands: "ABCDEF".split("") })));
    layoutChips(c);
    expect(shown(c)).toBe(6);
    expect(c.querySelector<HTMLElement>("[data-chips-toggle]")!.style.display).toBe("none");
  });

  it("açıkken tüm etiketler görünür ve düğme 'Daha az göster' der", () => {
    setDesktop(true);
    const c = mount(renderFilterChips(state({ brands: "ABCDEFGHI".split("") })));
    c.dataset.chipsExpanded = "1";
    layoutChips(c);
    expect(shown(c)).toBe(9);
    const toggle = c.querySelector<HTMLElement>("[data-chips-toggle]")!;
    expect(toggle.textContent).toContain("products.chipsShowLess");
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
  });

  it("mobilde 2 satıra sığıyorsa (ölçüm tek satır) hiçbir etiket gizlenmez", () => {
    setDesktop(false);
    const c = mount(renderFilterChips(state({ brands: "ABCDEFGHI".split("") })));
    layoutChips(c); // happy-dom: tüm offsetTop 0 → tek satır → sığar
    expect(shown(c)).toBe(9);
    expect(c.querySelector<HTMLElement>("[data-chips-toggle]")!.style.display).toBe("none");
  });

  it("mobilde 3. satıra taşan etiketler gizlenir, '+N daha' 2. satırda kalır", () => {
    setDesktop(false);
    const c = mount(renderFilterChips(state({ brands: "ABCDEFGHI".split("") })));
    const list = c.querySelector<HTMLElement>("[data-chips-list]")!;
    // Satır simülasyonu: o an görünür elemanları sırayla 3'erli satırlara diz.
    const measure = () => {
      const tops = new Map<Element, number>();
      let i = 0;
      for (const el of [...list.children] as HTMLElement[]) {
        if (el.style.display === "none") continue;
        tops.set(el, Math.floor(i / 3) * 30);
        i++;
      }
      return (el: Element) => tops.get(el) ?? 0;
    };
    layoutChips(c, measure);
    // 2 satır × 3 eleman = 6 eleman: 4 etiket + "+5 daha" + Temizle
    expect(shown(c)).toBe(4);
    const toggle = c.querySelector<HTMLElement>("[data-chips-toggle]")!;
    expect(toggle.style.display).not.toBe("none");
    expect(toggle.textContent).toContain("products.chipsShowMore:5");
  });

  it("aynı satırda birkaç px aşağıda duran Temizle bağlantısı ayrı satır sayılmaz", () => {
    setDesktop(false);
    const c = mount(renderFilterChips(state({ brands: "ABCDE".split("") })));
    const list = c.querySelector<HTMLElement>("[data-chips-list]")!;
    // 5 etiket + Temizle tek satırda; Temizle dikey ortalama yüzünden +4px
    const measure = () => (el: Element) => (el.hasAttribute("data-chips-clear") ? 4 : 0);
    layoutChips(c, measure);
    expect(shown(c)).toBe(5);
    expect(c.querySelector<HTMLElement>("[data-chips-toggle]")!.style.display).toBe("none");
    void list;
  });
});
