import { describe, expect, it } from "vitest";

import { NON_ORIGINAL_RENDITION, parseProfile } from "./lcpAsset.js";

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

// T-5 (2026-09-28, seo-gorsel-adresi) — okunur SEO adresi
// (/files/<slug>-<8..32 hex>[__<türev>].<uzantı>) da NON_ORIGINAL_RENDITION
// tarafından tanınmalı; eski hash'siz düz dosya adı (`/files/0585.jpg`) YANLIŞ
// POZİTİF vermemeli.
describe("NON_ORIGINAL_RENDITION deseni", () => {
  it("eski shard türevini eşleştirir", () => {
    expect(NON_ORIGINAL_RENDITION.test(`/files/ab/${"1".repeat(32)}.webp`)).toBe(true);
  });

  it("okunur SEO adresini (türevsiz) eşleştirir", () => {
    expect(NON_ORIGINAL_RENDITION.test("/files/kadin-canta-a1b2c3d4.jpg")).toBe(true);
  });

  it("okunur SEO adresini (__türev'li) eşleştirir", () => {
    expect(NON_ORIGINAL_RENDITION.test("/files/kadin-canta-a1b2c3d4__thumb.webp")).toBe(true);
  });

  it("hash taşımayan düz dosya adını eşleştirmez", () => {
    expect(NON_ORIGINAL_RENDITION.test("/files/0585.jpg")).toBe(false);
  });
});
