import { describe, it, expect, vi } from "vitest";
import { queryFetch } from "./queryFetch";

describe("queryFetch", () => {
  it("dedupes concurrent calls with same key into one fetch", async () => {
    const fn = vi.fn().mockResolvedValue({ ok: true });
    const key = ["dedup-test", Math.random()];
    const results = await Promise.all([
      queryFetch(key, fn, { staleTime: 60_000, gcTime: 60_000 }),
      queryFetch(key, fn, { staleTime: 60_000, gcTime: 60_000 }),
      queryFetch(key, fn, { staleTime: 60_000, gcTime: 60_000 }),
    ]);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(results[0]).toEqual({ ok: true });
  });

  it("serves from cache within staleTime (no second fetch)", async () => {
    const fn = vi.fn().mockResolvedValue(42);
    const key = ["cache-test", Math.random()];
    await queryFetch(key, fn, { staleTime: 60_000, gcTime: 60_000 });
    await queryFetch(key, fn, { staleTime: 60_000, gcTime: 60_000 });
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
