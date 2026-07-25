import { describe, expect, it, vi } from "vitest";

const { callMethod } = vi.hoisted(() => ({ callMethod: vi.fn() }));

vi.mock("../utils/api", () => ({ callMethod }));
vi.mock("../lib/query", () => ({
  queryFetch: (_key: readonly string[], fetcher: () => Promise<unknown>) => fetcher(),
  queryKeys: {
    categoryVersion: () => ["category-version"],
    categories: (version: string) => ["categories", version],
  },
  policies: { categoryVersion: {}, categories: {} },
}));

import * as categoryService from "./categoryService";
import { onCategoriesLoaded } from "./categoryService";

describe("onCategoriesLoaded", () => {
  it("returns a completion promise after the initial consumer callback renders", async () => {
    callMethod.mockImplementation((method: string) => {
      if (method.endsWith("get_category_version")) return Promise.resolve("v1");
      return Promise.resolve([
        { id: "office", name: "Ofis", slug: "ofis", children: [] },
      ]);
    });
    const rendered = vi.fn();

    const completion = onCategoriesLoaded(rendered);

    expect(completion).toBeInstanceOf(Promise);
    await completion;
    expect(rendered).toHaveBeenCalledWith([
      expect.objectContaining({ id: "office", slug: "ofis" }),
    ]);
  });

  it("stops notifying an unsubscribed persistent category consumer", async () => {
    const subscribeCategories = (
      categoryService as typeof categoryService & {
        subscribeCategories?: (fn: (categories: unknown[]) => void) => {
          ready: Promise<void>;
          unsubscribe(): void;
        };
      }
    ).subscribeCategories;
    expect(subscribeCategories).toBeTypeOf("function");

    const render = vi.fn();
    const subscription = subscribeCategories!(render);
    await subscription.ready;
    expect(render).toHaveBeenCalledTimes(1);

    subscription.unsubscribe();
    window.dispatchEvent(new Event("languageChanged"));
    for (let i = 0; i < 8; i += 1) await Promise.resolve();

    expect(render).toHaveBeenCalledTimes(1);
  });
});
