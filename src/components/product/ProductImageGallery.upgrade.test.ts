/**
 * Geç gelen manifest basılmış galeri görsellerini GERÇEKTEN yükseltir (F-2).
 *
 * Ürün detay sayfası manifesti beklemiyor (`pages/product-detail.ts`); manifest
 * çizimden sonra gelirse `upgradeGalleryMedia()` çağrılıyor. Bu dosya o çağrının
 * bir işe yaradığını gösterir — yoksa "beklemiyoruz" düzeltmesi manifesti hiç
 * uygulanmayan ölü bir yola çevirirdi.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultVisual, renderGalleryMedia, upgradeGalleryMedia } from "./ProductImageGallery";
import { clearMediaManifestCache, primeMediaManifests } from "../../lib/media/manifest";

vi.mock("../../alpine/product", () => ({ getCurrentProduct: () => ({ id: "LST-0001" }) }));
vi.mock("../../i18n", () => ({ t: (anahtar: string) => anahtar }));

const MANIFEST = {
  slot_key: "product.image",
  src: "/files/media/abc/urun__w768.webp",
  sizes: "100vw",
  alt: "Ürün",
  loading: "eager",
  decoding: "sync",
  fetchpriority: "high",
  width: 1200,
  height: 900,
  aspect_ratio: 1.3333,
  sources: [
    { type: "image/avif", srcset: "/files/media/abc/urun__w768.avif 768w", sizes: "" },
    { type: "image/webp", srcset: "/files/media/abc/urun__w768.webp 768w", sizes: "" },
  ],
};

function manifestYaniti(): Response {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      message: {
        enabled: true,
        manifests: {
          "LST-0001": {
            listing: "LST-0001",
            slot: "product.image",
            enabled: true,
            fallback: MANIFEST.src,
            images: [
              {
                file_url: "/files/urun.jpg",
                alt_text: "Ürün",
                primary: true,
                asset: "MA-1",
                manifest: MANIFEST,
              },
            ],
          },
        },
      },
    }),
  } as unknown as Response;
}

describe("upgradeGalleryMedia — geç gelen manifest uygulanır", () => {
  beforeEach(() => {
    clearMediaManifestCache();
    sessionStorage.clear();
    document.body.innerHTML = "";
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("soğuk çizimden sonra manifest gelince `<picture>`e yükseltir", async () => {
    // 1) Manifest henüz yokken çizilen bugünkü işaretleme.
    document.body.innerHTML = `<div id="gallery-main-image">${renderGalleryMedia(
      "/files/urun.jpg",
      "Ürün",
      defaultVisual,
      "large"
    )}</div>`;
    expect(document.querySelector("picture")).toBeNull();

    // 2) Manifest sonradan gelir.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => manifestYaniti())
    );
    await primeMediaManifests(["LST-0001"]);

    // 3) Yükseltme.
    expect(upgradeGalleryMedia()).toBe(1);
    const picture = document.querySelector("#gallery-main-image > picture");
    expect(picture).not.toBeNull();
    expect(picture?.querySelector('source[type="image/avif"]')).not.toBeNull();
    // Zoom/lightbox işaretçisi EN DIŞTAKİ elemanda kalmalı (doğrudan çocuk seçici).
    expect(picture?.getAttribute("data-gallery-main-media")).toBe("true");
    const img = picture?.querySelector("img");
    expect(img?.getAttribute("srcset")).toContain("__w768.webp");
    expect(img?.getAttribute("alt")).toBe("Ürün");
    expect(img?.getAttribute("width")).toBe("1200");
    expect(img?.getAttribute("height")).toBe("900");
  });

  it("ikinci çağrı hiçbir şeyi yeniden yazmaz (tekrara dayanıklı)", async () => {
    document.body.innerHTML = `<div id="gallery-main-image">${renderGalleryMedia(
      "/files/urun.jpg",
      "Ürün",
      defaultVisual,
      "large"
    )}</div>`;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => manifestYaniti())
    );
    await primeMediaManifests(["LST-0001"]);

    expect(upgradeGalleryMedia()).toBe(1);
    expect(upgradeGalleryMedia()).toBe(0);
  });

  it("manifest yokken DOM'a dokunmaz (yedek yol bozulmaz)", () => {
    document.body.innerHTML = `<div id="gallery-main-image">${renderGalleryMedia(
      "/files/urun.jpg",
      "Ürün",
      defaultVisual,
      "large"
    )}</div>`;
    const once = document.body.innerHTML;

    expect(upgradeGalleryMedia()).toBe(0);
    expect(document.body.innerHTML).toBe(once);
  });
});
