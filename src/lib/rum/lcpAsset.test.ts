import { describe, expect, it } from "vitest";

import { parseProfile } from "./lcpAsset.js";

describe("LCP görsel profili", () => {
  it("kanonik türev URL'sinden genişlik profilini çıkarır", () => {
    expect(
      parseProfile(
        "/files/media/ASSET/0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef/w768-768.webp"
      )
    ).toBe("w768");
  });

  it("doğrudan Frappe kaynak görselini original olarak etiketler", () => {
    expect(parseProfile("https://shop.example/files/urun-kapak.jpg?v=1")).toBe("original");
  });

  it("kökeni kanıtlanamayan eski shard türevini original saymaz", () => {
    expect(parseProfile(`/files/ab/${"1".repeat(32)}.webp`)).toBe("unknown");
  });
});
