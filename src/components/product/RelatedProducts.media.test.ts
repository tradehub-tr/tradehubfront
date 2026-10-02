/**
 * İlgili Ürünler kaydırıcısı manifestten türev seçer (2026-09-30 görsel
 * denetimi): ölçümde 160–270px'lik karolara ham master (≤2000 px) iniyordu.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearMediaManifestCache, seedMediaManifest } from "../../lib/media/manifest";
import type { ProductListingCard } from "../../types/productListing";

const { related } = vi.hoisted(() => ({ related: vi.fn() }));

vi.mock("swiper", () => ({
  default: class {
    update(): void {}
  },
}));
vi.mock("swiper/modules", () => ({ Navigation: {} }));
vi.mock("swiper/swiper-bundle.css", () => ({}));
vi.mock("../../i18n", () => ({ t: (anahtar: string) => anahtar }));
vi.mock("../../alpine/product", () => ({ getCurrentProduct: () => ({ id: "LST-ANA" }) }));
vi.mock("../../services/listingService", () => ({ getRelatedListingsGrouped: related }));

import { RELATED_CARD_SIZES, RelatedProducts, initRelatedProducts } from "./RelatedProducts";
import { mediaSizesFor } from "../../lib/media/sizes";

function kart(id: string, imageSrc: string): ProductListingCard {
  return {
    id,
    name: `Ürün ${id}`,
    href: `/urun/${id}`,
    price: "₺10",
    moq: "1 adet",
    stats: "",
    imageKind: "accessory",
    imageSrc,
  } as ProductListingCard;
}

function tohumla(): void {
  seedMediaManifest("LST-1", {
    listing: "LST-1",
    slot: "product.image",
    enabled: true,
    fallback: "/files/media/a/v/w384-384.webp",
    suppressed: 0,
    images: [
      {
        file_url: "/files/kova.webp",
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
          sources: [
            {
              type: "image/webp",
              srcset:
                "/files/media/a/v/w192-192.webp 192w, /files/media/a/v/w384-384.webp 384w, /files/kova.webp 1800w",
              sizes: "",
            },
          ],
        },
      },
    ],
  });
}

describe("RelatedProducts — kart görseli", () => {
  beforeEach(() => {
    clearMediaManifestCache();
    sessionStorage.clear();
    document.body.innerHTML = RelatedProducts();
    // Manifest ucu kapalı: soğuk kartlar için ağ turu anında biter.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ message: { enabled: false, manifests: {} } }),
      }))
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("sizes tablodaki related_slider bölgesiyle aynı", () => {
    expect(RELATED_CARD_SIZES).toBe(mediaSizesFor("product_detail/related_slider"));
    expect(RELATED_CARD_SIZES).not.toBe("");
  });

  it("manifestli kart srcset + tembel; manifestsiz kart işaretli ham tembel <img>", async () => {
    tohumla();
    related.mockResolvedValue({
      similar: [kart("LST-1", "/files/kova.webp"), kart("LST-2", "/files/diger.webp")],
      substitute: [],
      complementary: [],
      accessory: [],
    });
    initRelatedProducts();
    await vi.waitFor(() => {
      expect(document.querySelectorAll(".rp-card img").length).toBe(2);
    });
    const [birinci, ikinci] = Array.from(document.querySelectorAll<HTMLImageElement>(".rp-card img"));
    expect(birinci.getAttribute("srcset")).toContain("w192-192.webp 192w");
    expect(birinci.getAttribute("sizes")).toBe(RELATED_CARD_SIZES);
    expect(birinci.getAttribute("loading")).toBe("lazy");
    expect(birinci.getAttribute("src")).not.toBe("/files/kova.webp");
    expect(ikinci.getAttribute("src")).toBe("/files/diger.webp");
    expect(ikinci.getAttribute("loading")).toBe("lazy");
    expect(ikinci.getAttribute("data-product-image-listing")).toBe("LST-2");
  });
});
