/**
 * W10 (rapor 101 §İş1) — `mapListingCard` backend'in `get_listings` yanıtına
 * gömdüğü İLK-kart görsel manifestini önbelleğe TOHUMLAR; böylece kart SENKRON
 * basılırken `getMediaImageManifest` sıcaktır ve LCP adayı ilk boyamada türev
 * (AVIF/WebP) ile çıkar — ayrı `get_manifest_batch` turunu beklemeden.
 */
import { afterEach, describe, expect, it } from "vitest";
import { mapListingCard } from "./listingService";
import { clearMediaManifestCache, getMediaImageManifest } from "../lib/media/manifest";

const MANIFEST = {
  slot_key: "product.image",
  src: "/files/media/x__w768.webp",
  sizes: "100vw",
  alt: "",
  loading: "eager",
  decoding: "sync",
  fetchpriority: "high",
  width: 1200,
  height: 900,
  aspect_ratio: 1.3333,
  sources: [{ type: "image/avif", srcset: "/files/media/x__w768.avif 768w", sizes: "" }],
};

// `_kart_gorsel_manifesti`in döndürdüğü ilan gövdesi (batch endpoint biçimiyle aynı).
const BODY = {
  listing: "LST-1",
  slot: "product.image",
  enabled: true,
  fallback: "/files/media/x__w768.webp",
  suppressed: 0,
  images: [
    { file_url: "/files/urun.jpg", alt_text: "", primary: true, asset: "AS-1", manifest: MANIFEST },
  ],
};

describe("mapListingCard — gömülü manifesti tohumlar (W10)", () => {
  afterEach(() => clearMediaManifestCache());

  it("raw.manifest varsa önbelleğe tohumlar → kart senkron <picture> verisi okuyabilir", () => {
    clearMediaManifestCache();
    const card = mapListingCard({
      id: "LST-1",
      name: "Ürün",
      imageSrc: "/files/urun.jpg",
      manifest: BODY,
    });
    expect(card.id).toBe("LST-1");
    const man = getMediaImageManifest("LST-1", "/files/urun.jpg");
    expect(man).not.toBeNull();
    expect(man?.sources[0].type).toBe("image/avif");
  });

  it("VACUITY: raw.manifest YOKSA tohumlanmaz — kart bugünkü ham <img> yolunda kalır", () => {
    clearMediaManifestCache();
    mapListingCard({ id: "LST-2", name: "Ürün", imageSrc: "/files/urun2.jpg" });
    expect(getMediaImageManifest("LST-2", "/files/urun2.jpg")).toBeNull();
  });
});
