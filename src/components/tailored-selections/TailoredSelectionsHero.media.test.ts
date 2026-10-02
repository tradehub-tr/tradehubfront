/**
 * Size Özel sahnesi + kanal şeridi manifestten türev seçer (2026-09-30 görsel
 * denetimi): ölçümde 28px şerit karolarına ve 232px sahneye ham master
 * (≤2000 px, görsel başına 5–257 KB) iniyordu.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearMediaManifestCache, seedMediaManifest } from "../../lib/media/manifest";
import {
  TailoredSelectionsHero,
  TS_CHANNEL_IMG_SIZES,
  TS_STAGE_IMG_SIZES,
  renderTailoredHero,
} from "./TailoredSelectionsHero";
import type { TailoredCategory } from "../../types/tailoredSelections";

vi.mock("../../i18n", () => ({ t: (anahtar: string) => anahtar }));

const SRCSET =
  "/files/media/a/v/w192-192.webp 192w, /files/media/a/v/w384-384.webp 384w, " +
  "/files/media/a/v/w1280-1280.webp 1280w, /files/kova-1a2b3c4d.webp 1800w";

function tohumla(): void {
  seedMediaManifest("LST-9", {
    listing: "LST-9",
    slot: "product.image",
    enabled: true,
    fallback: "/files/media/a/v/w384-384.webp",
    suppressed: 0,
    images: [
      {
        file_url: "/files/kova-1a2b3c4d.webp",
        alt_text: "",
        primary: true,
        asset: "MA-1",
        manifest: {
          slot_key: "product.image",
          src: "/files/media/a/v/w384-384.webp",
          sizes: "",
          alt: "",
          loading: "lazy",
          decoding: "async",
          fetchpriority: "",
          width: 1800,
          height: 1800,
          aspect_ratio: 1,
          sources: [{ type: "image/webp", srcset: SRCSET, sizes: "" }],
        },
      },
    ],
  });
}

const KATEGORI: TailoredCategory = {
  id: "cat-1",
  slug: "temizlik",
  title: "Temizlik",
  description: "",
  imageSrc: "/files/kova-1a2b3c4d.webp",
  listingId: "LST-9",
};

describe("TailoredSelectionsHero — görsel teslimi", () => {
  beforeEach(() => {
    clearMediaManifestCache();
    document.body.innerHTML = TailoredSelectionsHero();
  });

  it("manifest varsa sahne eager + 232px sizes, şerit tembel + 28px sizes; master src'de değil", () => {
    tohumla();
    renderTailoredHero([KATEGORI]);
    const sahne = document.querySelector<HTMLImageElement>("#ts-hero-stage img")!;
    expect(sahne.getAttribute("srcset")).toContain("w192-192.webp 192w");
    expect(sahne.getAttribute("sizes")).toBe(TS_STAGE_IMG_SIZES);
    expect(sahne.hasAttribute("loading")).toBe(false);
    expect(sahne.getAttribute("src")).toBe("/files/media/a/v/w1280-1280.webp");
    const karo = document.querySelector<HTMLImageElement>("#ts-hero-strip img")!;
    expect(karo.getAttribute("sizes")).toBe(TS_CHANNEL_IMG_SIZES);
    expect(karo.getAttribute("loading")).toBe("lazy");
  });

  it("manifest soğukken yükseltme işaretli ham <img> basar", () => {
    renderTailoredHero([KATEGORI]);
    const karo = document.querySelector<HTMLImageElement>("#ts-hero-strip img")!;
    expect(karo.getAttribute("src")).toBe(KATEGORI.imageSrc);
    expect(karo.getAttribute("data-product-image-listing")).toBe("LST-9");
    expect(karo.getAttribute("data-product-image-sizes")).toBe(TS_CHANNEL_IMG_SIZES);
  });

  it("ilan kimliği yoksa eski düz <img> (sahne eager, şerit lazy)", () => {
    renderTailoredHero([{ ...KATEGORI, listingId: undefined }]);
    expect(document.querySelector("#ts-hero-stage img")!.getAttribute("loading")).toBe("eager");
    expect(document.querySelector("#ts-hero-strip img")!.getAttribute("loading")).toBe("lazy");
    expect(document.querySelector("#ts-hero-strip img")!.hasAttribute("srcset")).toBe(false);
  });
});
