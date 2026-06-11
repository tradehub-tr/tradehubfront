import { describe, it, expect } from "vitest";
import { idbStorage } from "./idbStorage";

describe("idbStorage AsyncStorage adapter", () => {
  it("round-trips a string value", async () => {
    await idbStorage.setItem("k1", "v1");
    expect(await idbStorage.getItem("k1")).toBe("v1");
  });

  it("returns undefined/null for missing key", async () => {
    const v = await idbStorage.getItem("missing");
    expect(v == null).toBe(true);
  });

  it("removes a value", async () => {
    await idbStorage.setItem("k2", "v2");
    await idbStorage.removeItem("k2");
    expect((await idbStorage.getItem("k2")) == null).toBe(true);
  });

  it("lists entries", async () => {
    await idbStorage.setItem("e1", "x");
    const entries = await idbStorage.entries();
    expect(entries.some(([k]) => k === "e1")).toBe(true);
  });
});
