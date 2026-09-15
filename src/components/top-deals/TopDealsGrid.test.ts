import { describe, expect, it, vi } from "vitest";

vi.mock("../../i18n", () => ({ t: (k: string) => k }));

import { TopDealsGrid } from "./TopDealsGrid";

/** MOGEM-638 §2.3: top-deals CLS 0,649 — iskelet `<template x-if>` içindeydi,
 *  Alpine açılana kadar hiç çizilmiyor, footer ızgaranın yerine boyanıyordu. */
describe("TopDealsGrid iskeleti", () => {
  it("iskelet statik `x-show` ile gelir, `<template x-if>` içinde değil", () => {
    const html = TopDealsGrid(24);
    expect(html).toMatch(/<div x-show="loading" class="grid/);
    expect(html).not.toMatch(/<template x-if="loading">/);
  });

  it("iskelet kart sayısı sayfa boyutuna eşit (satır sayısı gerçek ızgarayla aynı)", () => {
    const say = (html: string) => (html.match(/animate-pulse rounded-md border/g) || []).length;
    expect(say(TopDealsGrid(24))).toBe(24);
    expect(say(TopDealsGrid(10))).toBe(10);
    expect(say(TopDealsGrid())).toBe(10);
  });

  it('gerçek ızgara hâlâ `x-if="!loading"` içinde (yüklenmeden çizilmez)', () => {
    expect(TopDealsGrid(24)).toMatch(/<template x-if="!loading">/);
  });
});
