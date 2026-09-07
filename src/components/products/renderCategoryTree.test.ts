import { describe, it, expect, vi } from "vitest";

vi.mock("../../i18n", () => ({ t: (k: string) => k }));
import { renderCategoryTree } from "./renderCategoryTree";
import type { CategoryTreeNode } from "./buildCategoryFacetTree";

const leaf = (over: Partial<CategoryTreeNode>): CategoryTreeNode => ({
  id: "L",
  name: "Leaf",
  slug: "leaf",
  count: 1,
  depth: 1,
  open: false,
  selected: false,
  children: [],
  ...over,
});

describe("renderCategoryTree", () => {
  it("renders a link to the category listing with its count for every node", () => {
    const html = renderCategoryTree([
      leaf({ id: "A", name: "Saklama", slug: "saklama", count: 271, depth: 0 }),
    ]);
    const root = document.createElement("div");
    root.innerHTML = html;
    const link = root.querySelector<HTMLAnchorElement>(
      "a[href='/pages/products.html?cat=saklama']"
    );
    expect(link).not.toBeNull();
    expect(link?.textContent).toContain("Saklama");
    expect(root.querySelector("[data-cat-count='A']")?.textContent).toBe("(271)");
  });

  it("underlines the name on hover and exposes the full name as a tooltip", () => {
    const html = renderCategoryTree([
      leaf({ id: "T", name: "Yazıcı Şeritleri", slug: "yazici-seritleri", depth: 1 }),
    ]);
    const root = document.createElement("div");
    root.innerHTML = html;
    const link = root.querySelector<HTMLAnchorElement>("a");
    expect(link?.getAttribute("title")).toBe("Yazıcı Şeritleri");
    // Renk inline style ile değil sınıfla verilir; aksi halde hover rengi inline style'a yenilir.
    expect(link?.getAttribute("style") ?? "").not.toMatch(/(^|;)\s*color\s*:/);
    expect(link?.className).toContain("hover:text-primary-600");
    // Yalnız ad altı çizilir, sayı değil.
    const nameSpan = link?.querySelector("span:first-child");
    expect(nameSpan?.className).toContain("group-hover:underline");
    expect(link?.className).not.toContain("hover:underline");
  });

  it("renders a toggle button only for nodes with children and reflects open state", () => {
    const html = renderCategoryTree([
      leaf({
        id: "P",
        name: "Parent",
        slug: "parent",
        depth: 0,
        open: true,
        children: [leaf({ id: "C", name: "Child", slug: "child", depth: 1 })],
      }),
      leaf({ id: "S", name: "Solo", slug: "solo", depth: 0 }),
    ]);
    const root = document.createElement("div");
    root.innerHTML = html;
    const toggles = root.querySelectorAll("button[data-cat-toggle]");
    expect(toggles.length).toBe(1);
    const group = root.querySelector<HTMLElement>("[data-cat-node='P']");
    expect(group?.getAttribute("x-data")).toBe("{ open: true }");
    expect(root.querySelector("[data-cat-node='S'] [x-data]")).toBeNull();
    expect(root.querySelector("[data-cat-node='P'] [data-cat-node='C']")).not.toBeNull();
  });

  it("renders only top-level categories bold; deeper nodes stay regular even with children", () => {
    const html = renderCategoryTree([
      leaf({
        id: "R",
        name: "Ev & Bahçe",
        slug: "ev-bahce",
        depth: 0,
        children: [
          leaf({
            id: "M",
            name: "Mutfak",
            slug: "mutfak",
            depth: 1,
            children: [leaf({ id: "S", name: "Saklama", slug: "saklama", depth: 2 })],
          }),
        ],
      }),
      leaf({ id: "L", name: "Otomotiv", slug: "otomotiv", depth: 0 }),
    ]);
    const root = document.createElement("div");
    root.innerHTML = html;
    const cls = (id: string) =>
      root.querySelector(`[data-cat-node='${id}'] > div > a`)?.className ?? "";
    expect(cls("R")).toContain("font-semibold");
    expect(cls("L")).toContain("font-semibold");
    expect(cls("M")).not.toContain("font-semibold");
    expect(cls("S")).not.toContain("font-semibold");
  });

  it("marks the selected node with aria-current and indents by depth", () => {
    const html = renderCategoryTree([
      leaf({ id: "X", name: "Yazıcı", slug: "yazici", depth: 2, selected: true }),
    ]);
    const root = document.createElement("div");
    root.innerHTML = html;
    const link = root.querySelector<HTMLAnchorElement>("a[aria-current='page']");
    expect(link?.textContent).toContain("Yazıcı");
    expect(link?.className).toContain("font-semibold");
    expect(root.querySelector<HTMLElement>("[data-cat-node='X']")?.getAttribute("data-depth")).toBe(
      "2"
    );
  });

  it("escapes category names", () => {
    const html = renderCategoryTree([leaf({ id: "E", name: "<img src=x>", slug: "e", depth: 0 })]);
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });
});
