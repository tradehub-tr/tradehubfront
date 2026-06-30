import { describe, it, expect } from "vitest";
import { queryKeys, policies } from "./keys";

describe("queryKeys", () => {
  it("categories key embeds the version", () => {
    expect(queryKeys.categories("7694-x-0")).toEqual(["categories", "7694-x-0"]);
  });

  it("categoryVersion key is stable", () => {
    expect(queryKeys.categoryVersion()).toEqual(["category-version"]);
  });

  it("listings key includes normalized params", () => {
    const a = queryKeys.listings({ category: "shoes", page: 1 });
    const b = queryKeys.listings({ page: 1, category: "shoes" });
    expect(a).toEqual(b); // anahtar sırası farkı aynı key üretmeli
  });

  it("currency key is stable", () => {
    expect(queryKeys.currencyRates()).toEqual(["currency", "rates"]);
  });
});

describe("policies", () => {
  it("categories has long staleTime", () => {
    expect(policies.categories.staleTime).toBeGreaterThanOrEqual(60 * 60 * 1000);
  });
  it("listings has short staleTime", () => {
    expect(policies.listings.staleTime).toBeLessThanOrEqual(5 * 60 * 1000);
  });
  it("categoryVersion has short staleTime for prompt busting", () => {
    expect(policies.categoryVersion.staleTime).toBeGreaterThanOrEqual(60 * 1000);
    expect(policies.categoryVersion.staleTime).toBeLessThan(60 * 60 * 1000);
  });
});
