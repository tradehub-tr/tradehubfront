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

/**
 * BOZUK VERİYE DAYANIKLILIK — 21 Eyl 2026'da eklendi.
 *
 * NEDEN: `path` alanı tip sözleşmesinde zorunlu ama veri AĞDAN geliyor ve tipin
 * çalışma anında güvencesi yok. Eksik `path` gelen TEK bir kategori
 * `f.path.forEach` satırında TypeError atıyordu; istisna çağıranın `.then()`
 * zincirinin içinde olduğu için `.catch()`e düşüyor ve orası TÜM dinamik facet
 * kutularını siliyordu. Sonuç: bir bozuk kategori yüzünden ülke, marka ve
 * sertifika filtreleri de ekrandan kayboluyor, kullanıcı "Sonuç bulunamadı"
 * görüyordu. 13 E2E testi bu tek hatadan düşüyordu.
 *
 * Kural: bozuk kayıt KENDİ satırına hapsedilir, ağacın geri kalanı sağlam kalır.
 */
describe("bozuk facet verisine dayanıklılık", () => {
  const SAGLAM = item(SAKLAMA, 10, [EV, MUTFAK]);

  it("`path` eksikse kategori KÖK düzeyinde görünür, çökmez", () => {
    const bozuk = { id: "X", name: "Yolsuz", slug: "yolsuz", count: 5 } as CategoryFacetItem;
    const agac = buildCategoryFacetTree([bozuk], undefined);
    expect(agac).toHaveLength(1);
    expect(agac[0]).toMatchObject({ id: "X", depth: 0, count: 5 });
  });

  it("bozuk kayıt SAĞLAM kayıtları düşürmez — hata kendi satırına hapsolur", () => {
    const bozuk = { id: "X", name: "Yolsuz", slug: "yolsuz", count: 5 } as CategoryFacetItem;
    const agac = buildCategoryFacetTree([bozuk, SAGLAM], undefined);
    const kokler = agac.map((n) => n.id).sort();
    expect(kokler).toEqual(["EV", "X"]);
    // Sağlam kaydın ata zinciri bozulmamış olmalı
    const ev = agac.find((n) => n.id === "EV");
    expect(ev?.children[0]).toMatchObject({ id: "MUTFAK" });
  });

  it("`path` dizi değilse (null / string / nesne) yine çökmez", () => {
    for (const kotu of [null, undefined, "EV", 42, { id: "EV" }]) {
      const item = { id: "X", name: "N", slug: "s", count: 1, path: kotu } as unknown;
      expect(() => buildCategoryFacetTree([item as CategoryFacetItem], undefined)).not.toThrow();
    }
  });

  it("`path` içindeki bozuk halka atlanır, sağlam atalar korunur", () => {
    const item = {
      id: "KAVANOZ",
      name: "Kavanoz",
      slug: "kavanoz",
      count: 3,
      path: [EV, null, MUTFAK],
    } as unknown as CategoryFacetItem;
    const agac = buildCategoryFacetTree([item], undefined);
    expect(agac[0]).toMatchObject({ id: "EV" });
    expect(agac[0].children[0]).toMatchObject({ id: "MUTFAK" });
  });

  it("id'siz kayıt tamamen atlanır — anahtarsız düğüm ağacı kirletmez", () => {
    const idsiz = { name: "Adsız", slug: "adsiz", count: 9 } as unknown as CategoryFacetItem;
    const agac = buildCategoryFacetTree([idsiz, SAGLAM], undefined);
    expect(agac.map((n) => n.id)).toEqual(["EV"]);
  });

  it("sayım sayı değilse 0 sayılır — NaN ağaca yayılmaz", () => {
    const item = {
      id: "X",
      name: "N",
      slug: "s",
      count: "çok" as unknown as number,
      path: [],
    } as CategoryFacetItem;
    expect(buildCategoryFacetTree([item], undefined)[0].count).toBe(0);
  });

  it("facet listesi null/undefined ise boş ağaç döner", () => {
    expect(buildCategoryFacetTree(null as unknown as CategoryFacetItem[], undefined)).toEqual([]);
    expect(buildCategoryFacetTree(undefined as unknown as CategoryFacetItem[], undefined)).toEqual(
      []
    );
  });
});
