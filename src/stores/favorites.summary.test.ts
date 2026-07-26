import { describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    },
  });
});

vi.mock("../utils/api", () => ({ callMethod: vi.fn() }));
vi.mock("../utils/auth", () => ({ isLoggedIn: () => false, waitForAuth: () => Promise.resolve(null) }));

import { normalizeFavoritesRemoteState } from "./favorites";

describe("favorites listing_summary contract", () => {
  it("keeps every favorite item in backend order and preserves explicit inaccessible null summaries", () => {
    const state = normalizeFavoritesRemoteState({
      lists: [],
      items: [{ id: "LIVE" }, { id: "INACCESSIBLE" }, { id: "LIVE-2" }],
      listing_summary: {
        LIVE: {
          category: "Ofis",
          supplier: { name: "Tedarikçi", verified: true, country: "Turkey" },
          stock_qty: 4,
          in_stock: true,
          current_price: 85,
          currency: "TRY",
        },
        INACCESSIBLE: null,
        "LIVE-2": {
          category: "Mobilya",
          supplier: { name: "Diğer", verified: false, country: "Germany" },
          stock_qty: 0,
          in_stock: false,
          current_price: 12,
          currency: "USD",
        },
      },
    });

    expect(state?.items.map((item) => item.id)).toEqual(["LIVE", "INACCESSIBLE", "LIVE-2"]);
    expect(state?.listingSummary?.INACCESSIBLE).toBeNull();
    expect(state?.listingSummary?.LIVE?.current_price).toBe(85);
  });

  it("accepts an old response with no summary map without requiring detail requests", () => {
    const state = normalizeFavoritesRemoteState({ lists: [], items: [{ id: "SNAPSHOT" }] });

    expect(state?.items).toEqual([{ id: "SNAPSHOT" }]);
    expect(state?.listingSummary).toBeUndefined();
  });
});
