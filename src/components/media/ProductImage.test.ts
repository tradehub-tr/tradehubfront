import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearMediaManifestCache, seedMediaManifest } from "../../lib/media/manifest";
import { ProductImage, hydrateProductImages } from "./ProductImage";

const image = {
  slot_key: "product.image",
  src: "/files/photo-768.avif",
  sizes: "100vw",
  alt: "",
  loading: "lazy",
  decoding: "async",
  fetchpriority: "auto",
  width: 768,
  height: 768,
  aspect_ratio: 1,
  sources: [
    {
      type: "image/avif",
      srcset: "/files/photo-96.avif 96w, /files/photo-768.avif 768w",
      sizes: "",
    },
  ],
};
const body = {
  listing: "LST-1",
  enabled: true,
  slot: "product.image",
  fallback: "/files/photo.jpg",
  images: [
    {
      file_url: "/files/photo.jpg",
      primary: true,
      alt_text: "",
      asset: "asset-1",
      manifest: image,
    },
  ],
  suppressed: 0,
};
const options = {
  listing: "LST-1",
  src: "/files/photo.jpg",
  className: "cart-image",
  sizes: "60px",
  width: 60,
  height: 60,
};

beforeEach(() => {
  clearMediaManifestCache();
  document.body.innerHTML = "";
});
afterEach(() => vi.unstubAllGlobals());

describe("cart and checkout AVIF delivery", () => {
  it("uses only AVIF src/srcset with the actual display size", () => {
    seedMediaManifest("LST-1", body);
    document.body.innerHTML = ProductImage(options);
    const img = document.querySelector("img")!;
    expect(img.getAttribute("src")).toBe("/files/photo-768.avif");
    expect(img.srcset).toBe(image.sources[0].srcset);
    expect(img.sizes).toBe("60px");
    expect(document.querySelector("picture")).toBeNull();
  });

  it("upgrades a cold cart without replacing its image node or losing events", async () => {
    document.body.innerHTML = ProductImage(options);
    const img = document.querySelector("img")!;
    const click = vi.fn();
    img.addEventListener("click", click);
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ message: { enabled: true, manifests: { "LST-1": body } } }),
    }));
    vi.stubGlobal("fetch", fetchMock);
    await hydrateProductImages();
    expect(document.querySelector("img")).toBe(img);
    expect(img.srcset).toContain(".avif 96w");
    img.click();
    expect(click).toHaveBeenCalledOnce();
    await hydrateProductImages();
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("keeps the original visible when conversion is still pending", async () => {
    seedMediaManifest("LST-1", { ...body, images: [{ ...body.images[0], manifest: null }] });
    document.body.innerHTML = ProductImage(options);
    await hydrateProductImages();
    expect(document.querySelector("img")!.getAttribute("src")).toBe(options.src);
    expect(document.querySelector("img")!.srcset).toBe("");
  });
});
