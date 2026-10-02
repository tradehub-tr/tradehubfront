/**
 * Ana sayfa / Size Özel / Top Deals kartları da manifest ister (2026-09-30):
 * `initProductSliders` → `hydrateListingCardMedia`. `sizes` en yakın
 * `[data-media-sizes]` kapsayıcısından, yoksa ürün ızgarası bölgesinden gelir.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearMediaManifestCache, seedMediaManifest } from "../../lib/media/manifest";
import { mediaSizesFor } from "../../lib/media/sizes";
import { hydrateListingCardMedia } from "./ListingCard";

vi.mock("../../i18n", () => ({ t: (k: string) => k }));

function tohumla(ilan: string, url: string) {
  seedMediaManifest(ilan, {
    listing: ilan,
    slot: "product.image",
    enabled: true,
    fallback: "",
    suppressed: 0,
    images: [
      {
        file_url: url,
        alt_text: "",
        primary: true,
        asset: "MA",
        manifest: {
          slot_key: "product.image",
          src: "/files/media/a/v/w384-384.webp",
          sizes: "",
          alt: "",
          loading: "lazy",
          decoding: "async",
          fetchpriority: "",
          width: 1200,
          height: 1200,
          aspect_ratio: 1,
          sources: [
            {
              type: "image/webp",
              srcset:
                "/files/media/a/v/w192-192.webp 192w, /files/media/a/v/w384-384.webp 384w, /files/x.webp 1200w",
              sizes: "",
            },
          ],
        },
      },
    ],
  });
}

const kart = (ilan: string, url: string) =>
  `<div class="product-slider" data-slider-id="${ilan}"><img src="${url}" class="w-full h-full" loading="lazy"></div>`;

describe("hydrateListingCardMedia", () => {
  beforeEach(() => {
    clearMediaManifestCache();
    tohumla("LST-A", "/files/a.webp");
    tohumla("LST-B", "/files/b.webp");
    document.body.innerHTML = `
      <div id="ana" data-media-sizes="(min-width: 1024px) 200px, 50vw">${kart("LST-A", "/files/a.webp")}</div>
      <div id="duz">${kart("LST-B", "/files/b.webp")}</div>`;
  });

  it("kapsayıcının ham sizes'ını, yoksa ızgara bölgesini kullanır", async () => {
    await hydrateListingCardMedia();
    const a = document.querySelector<HTMLImageElement>("#ana img")!;
    const b = document.querySelector<HTMLImageElement>("#duz img")!;
    expect(a.getAttribute("srcset")).toContain("192w");
    expect(a.getAttribute("sizes")).toBe("(min-width: 1024px) 200px, 50vw");
    expect(b.getAttribute("sizes")).toBe(mediaSizesFor("listing/card_grid"));
  });
});
