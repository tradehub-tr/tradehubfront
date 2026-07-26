import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "src/pages/seller-shop.ts"), "utf8");

describe("seller-shop route view mounting", () => {
  it("does not keep every route view mounted behind x-show", () => {
    expect(source).toContain('<template x-if="activePage === \'home\'">');
    expect(source).toContain('<template x-if="activePage === \'products\'">');
    expect(source).toContain('<template x-if="activePage === \'profile\'">');
    expect(source).toContain('<template x-if="activePage === \'contacts\'">');
    expect(source).not.toContain('<div x-show="activePage === \'home\'"');
    expect(source).not.toContain('<div x-show="activePage === \'products\'"');
    expect(source).not.toContain('<div x-show="activePage === \'profile\'"');
    expect(source).not.toContain('<div x-show="activePage === \'contacts\'"');
  });

  it("delegates product filtering, sorting and pagination to the seller API", () => {
    const storeSource = readFileSync(resolve(process.cwd(), "src/alpine/sellerShop.ts"), "utf8");

    expect(storeSource).toContain("async function fetchSellerProducts");
    expect(storeSource).not.toContain("fetchAllSellerProducts");
    expect(storeSource).toContain('query.set("category_type", options.categoryType || "seller")');
    expect(storeSource).toContain("await this.loadProducts()");
    expect(storeSource).toContain("get visiblePages(): number[]");
  });
});
