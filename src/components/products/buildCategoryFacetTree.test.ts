import { describe, it, expect } from "vitest";
import {
  buildCategoryFacetTree,
  filterCategoryFacets,
  type CategoryFacetItem,
} from "./buildCategoryFacetTree";

const EV = { id: "EV", name: "Ev & Bahçe", slug: "ev-bahce" };
const MUTFAK = { id: "MUTFAK", name: "Mutfak", slug: "mutfak" };
const SAKLAMA = { id: "SAKLAMA", name: "Saklama", slug: "saklama" };
const KAVANOZ = { id: "KAVANOZ", name: "Kavanoz", slug: "kavanoz" };

const item = (
  node: { id: string; name: string; slug: string },
  count: number,
  path: { id: string; name: string; slug: string }[]
): CategoryFacetItem => ({ ...node, count, path });

const mutfakFacets: CategoryFacetItem[] = [
  item(SAKLAMA, 136, [EV, MUTFAK]),
  item(MUTFAK, 41, [EV]),
  item({ id: "BAHARAT", name: "Baharatlık", slug: "baharatlik" }, 10, [
    EV,
    MUTFAK,
    SAKLAMA,
    KAVANOZ,
  ]),
  item({ id: "SERVIS", name: "Servis", slug: "servis" }, 4, [EV, MUTFAK]),
];

describe("buildCategoryFacetTree", () => {
  it("nests nodes along their path and sums counts up to every ancestor", () => {
    const result = buildCategoryFacetTree(mutfakFacets, undefined);

    expect(result.map((n) => [n.id, n.count, n.depth])).toEqual([["EV", 191, 0]]);
    const mutfak = result[0].children;
    expect(mutfak.map((n) => [n.id, n.count, n.depth])).toEqual([["MUTFAK", 191, 1]]);
    const underMutfak = mutfak[0].children;
    expect(underMutfak.map((n) => [n.id, n.count, n.depth])).toEqual([
      ["SAKLAMA", 146, 2],
      ["SERVIS", 4, 2],
    ]);
    const kavanoz = underMutfak[0].children[0];
    expect([kavanoz.id, kavanoz.count, kavanoz.depth]).toEqual(["KAVANOZ", 10, 3]);
    expect(kavanoz.children.map((n) => [n.id, n.count, n.depth])).toEqual([["BAHARAT", 10, 4]]);
  });

  it("does not duplicate a category that appears both as a facet and as an ancestor", () => {
    const result = buildCategoryFacetTree(mutfakFacets, undefined);
    const ids: string[] = [];
    const walk = (nodes: typeof result) =>
      nodes.forEach((n) => {
        ids.push(n.id);
        walk(n.children);
      });
    walk(result);
    expect(ids.filter((id) => id === "MUTFAK")).toHaveLength(1);
  });

  it("orders siblings by count descending, then by name", () => {
    const result = buildCategoryFacetTree(
      [
        item({ id: "B", name: "Beta", slug: "b" }, 2, []),
        item({ id: "C", name: "Alfa", slug: "c" }, 2, []),
        item({ id: "A", name: "Zeta", slug: "a" }, 9, []),
      ],
      undefined
    );
    expect(result.map((n) => n.id)).toEqual(["A", "C", "B"]);
  });

  it("keeps every node closed and unselected when there is no current category", () => {
    const result = buildCategoryFacetTree(mutfakFacets, undefined);
    expect(result[0].open).toBe(false);
    expect(result[0].selected).toBe(false);
    expect(result[0].children[0].open).toBe(false);
  });

  it("opens the ancestor chain and marks the current category by slug", () => {
    const result = buildCategoryFacetTree(mutfakFacets, "mutfak");
    const ev = result[0];
    const mutfak = ev.children[0];
    expect(ev.open).toBe(true);
    expect(ev.selected).toBe(false);
    expect(mutfak.open).toBe(true);
    expect(mutfak.selected).toBe(true);
    expect(mutfak.children[0].open).toBe(false);
    expect(mutfak.children[0].selected).toBe(false);
  });

  it("also resolves the current category by id, including an intermediate path node", () => {
    const result = buildCategoryFacetTree(mutfakFacets, "KAVANOZ");
    const kavanoz = result[0].children[0].children[0].children[0];
    expect(kavanoz.selected).toBe(true);
    expect(kavanoz.open).toBe(true);
    expect(result[0].open).toBe(true);
    expect(result[0].children[0].children[0].open).toBe(true);
  });

  it("returns an empty list for no facets", () => {
    expect(buildCategoryFacetTree([], undefined)).toEqual([]);
  });
});

describe("filterCategoryFacets", () => {
  it("keeps facets whose own name matches, case- and Turkish-insensitive", () => {
    // Saklama'nın kendisi + atası Saklama olan Baharatlık (dal bütün kalır)
    const out = filterCategoryFacets(mutfakFacets, "SAKLAMA");
    expect(out.map((f) => f.id)).toEqual(["SAKLAMA", "BAHARAT"]);
    expect(filterCategoryFacets(mutfakFacets, "baharatlik").map((f) => f.id)).toEqual(["BAHARAT"]);
  });

  it("keeps facets whose ancestor name matches so the whole branch stays visible", () => {
    const out = filterCategoryFacets(mutfakFacets, "kavanoz");
    expect(out.map((f) => f.id)).toEqual(["BAHARAT"]);
    expect(filterCategoryFacets(mutfakFacets, "mutfak").length).toBe(4);
  });

  it("returns every facet for an empty or whitespace term", () => {
    expect(filterCategoryFacets(mutfakFacets, "")).toBe(mutfakFacets);
    expect(filterCategoryFacets(mutfakFacets, "   ")).toBe(mutfakFacets);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterCategoryFacets(mutfakFacets, "zzz")).toEqual([]);
  });
});
