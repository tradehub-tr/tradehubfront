import { describe, expect, it } from "vitest";
import { ResponsiveImage } from "./ResponsiveImage";
import type { MediaImageManifest } from "../../lib/media/manifest";

/** Bugünkü tek `<img>` işaretlemesi — yedek yolun ölçütü. */
const BUGUNKU_IMG =
  '<img src="/files/urun.jpg" alt="Ürün" class="w-full h-full object-cover" ' +
  'width="400" height="400" decoding="async" />';

const fallback = (): string => BUGUNKU_IMG;

function manifest(over: Partial<MediaImageManifest> = {}): MediaImageManifest {
  return {
    slot_key: "product.image",
    src: "/files/media/abc/urun__w768.webp",
    sizes: "100vw",
    alt: "Ürün",
    loading: "lazy",
    decoding: "async",
    fetchpriority: "",
    width: 1200,
    height: 900,
    aspect_ratio: 1.3333,
    sources: [
      {
        type: "image/avif",
        srcset: "/files/media/abc/urun__w384.avif 384w, /files/media/abc/urun__w768.avif 768w",
        sizes: "",
      },
      {
        type: "image/webp",
        srcset: "/files/media/abc/urun__w384.webp 384w, /files/media/abc/urun__w768.webp 768w",
        sizes: "",
      },
      {
        type: "image/jpeg",
        srcset: "/files/media/abc/urun__w384.jpg 384w, /files/media/abc/urun__w768.jpg 768w",
        sizes: "",
      },
    ],
    ...over,
  };
}

describe("ResponsiveImage — yedek yol (bayrak kapalıyken kırılmazlık garantisi)", () => {
  it("manifest yoksa BİREBİR bugünkü işaretlemeyi döndürür", () => {
    expect(ResponsiveImage({ fallback })).toBe(BUGUNKU_IMG);
    expect(ResponsiveImage({ manifest: null, fallback })).toBe(BUGUNKU_IMG);
    expect(ResponsiveImage({ manifest: undefined, fallback })).toBe(BUGUNKU_IMG);
  });

  it("manifest hiç kaynak taşımıyorsa yedek yola düşer", () => {
    expect(ResponsiveImage({ manifest: manifest({ sources: [] }), fallback })).toBe(BUGUNKU_IMG);
  });

  it("kaynakların `srcset`i boşsa yedek yola düşer", () => {
    const bos = manifest({
      sources: [{ type: "image/webp", srcset: "   ", sizes: "" }],
    });
    expect(ResponsiveImage({ manifest: bos, fallback })).toBe(BUGUNKU_IMG);
  });

  it("[FR-124] içsel ölçü bilinmiyorsa (CLS kuralı) yedek yola düşer", () => {
    const olcusuz = manifest({ width: 0, height: 0 });
    expect(ResponsiveImage({ manifest: olcusuz, fallback })).toBe(BUGUNKU_IMG);
  });

  it("ölçü manifestte yoksa çağıranın yedek ölçüsü kullanılır", () => {
    const olcusuz = manifest({ width: 0, height: 0 });
    const html = ResponsiveImage({ manifest: olcusuz, fallback, width: 400, height: 400 });
    expect(html).toContain('width="400" height="400"');
  });

  it("`src` güvensiz şema taşıyorsa yedek yola düşer", () => {
    const kotu = manifest({ src: "javascript:alert(1)" });
    expect(ResponsiveImage({ manifest: kotu, fallback })).toBe(BUGUNKU_IMG);
  });
});

describe("ResponsiveImage — `<picture>` üretimi", () => {
  it("[FR-121] çok biçimde sarmal üretir; SON biçim `<img srcset>` üstünde taşınır", () => {
    const html = ResponsiveImage({ manifest: manifest(), fallback, sizes: "70px" });
    expect(html.startsWith("<picture>")).toBe(true);
    expect(html.endsWith("</picture>")).toBe(true);
    // AVIF + WebP `<source>` olur, JPEG `<img>`e iner (3 biçim → 2 source).
    expect(html.match(/<source /g)?.length).toBe(2);
    expect(html).toContain('<source type="image/avif"');
    expect(html).toContain('<source type="image/webp"');
    expect(html).not.toContain('<source type="image/jpeg"');
    expect(html).toContain('srcset="/files/media/abc/urun__w384.jpg 384w');
  });

  it("tek biçimde `<picture>` sarmalı ÜRETMEZ", () => {
    const tek = manifest({ sources: [manifest().sources[1]] });
    const html = ResponsiveImage({ manifest: tek, fallback });
    expect(html).not.toContain("<picture");
    expect(html.startsWith("<img ")).toBe(true);
  });

  it("[FR-124] `width`/`height` HER ZAMAN yazılır", () => {
    const html = ResponsiveImage({ manifest: manifest(), fallback });
    expect(html).toContain('width="1200" height="900"');
  });

  it("[FR-121] bölge `sizes`i manifestin slot `sizes`ini ezer", () => {
    const html = ResponsiveImage({ manifest: manifest(), fallback, sizes: "70px" });
    expect(html).toContain('sizes="70px"');
    expect(html).not.toContain('sizes="100vw"');
  });

  it("öznitelik sırası sabittir (src, srcset, sizes, alt, width, height, ...)", () => {
    const html = ResponsiveImage({ manifest: manifest(), fallback, imgClass: "w-full" });
    const img = html.slice(html.indexOf("<img "));
    const sira = [...img.matchAll(/\s([a-z-]+)="/g)].map((m) => m[1]);
    expect(sira.slice(0, 6)).toEqual(["src", "srcset", "sizes", "alt", "width", "height"]);
  });

  it("`srcset` içindeki güvensiz aday listeden DÜŞER", () => {
    const kotu = manifest({
      sources: [
        {
          type: "image/webp",
          srcset: "javascript:alert(1) 384w, /files/media/abc/urun__w768.webp 768w",
          sizes: "",
        },
        manifest().sources[2],
      ],
    });
    const html = ResponsiveImage({ manifest: kotu, fallback });
    expect(html).not.toContain("javascript:");
    expect(html).toContain("/files/media/abc/urun__w768.webp 768w");
  });
});

describe("ResponsiveImage — yükleme öncelikleri", () => {
  it("priority=true → fetchpriority=high, decoding=sync, `loading` YAZILMAZ", () => {
    const html = ResponsiveImage({ manifest: manifest(), fallback, priority: true });
    expect(html).toContain('fetchpriority="high"');
    expect(html).toContain('decoding="sync"');
    expect(html).not.toContain("loading=");
  });

  it("[NFR-033] priority=false → loading=lazy, decoding=async", () => {
    const html = ResponsiveImage({ manifest: manifest(), fallback, priority: false });
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('decoding="async"');
    expect(html).not.toContain("fetchpriority");
  });

  it("eager=true → `loading` yazılmaz ama `fetchpriority` de VERİLMEZ", () => {
    const html = ResponsiveImage({ manifest: manifest(), fallback, priority: false, eager: true });
    expect(html).not.toContain("loading=");
    expect(html).not.toContain("fetchpriority");
    expect(html).toContain('decoding="async"');
  });

  it("priority verilmezse manifestin `fetchpriority` alanı okunur", () => {
    const lcp = manifest({ fetchpriority: "high", loading: "eager" });
    const html = ResponsiveImage({ manifest: lcp, fallback });
    expect(html).toContain('fetchpriority="high"');
  });
});

describe("ResponsiveImage — hostAttrs en dıştaki elemana gider", () => {
  it("sarmal varken `<picture>`a yazılır, `<img>`e DEĞİL", () => {
    const html = ResponsiveImage({
      manifest: manifest(),
      fallback,
      hostAttrs: { "data-gallery-main-media": "true" },
    });
    expect(html.startsWith('<picture data-gallery-main-media="true">')).toBe(true);
    const img = html.slice(html.indexOf("<img "));
    expect(img).not.toContain("data-gallery-main-media");
  });

  it("sarmal yokken `<img>`e yazılır", () => {
    const tek = manifest({ sources: [manifest().sources[1]] });
    const html = ResponsiveImage({
      manifest: tek,
      fallback,
      hostAttrs: { "data-gallery-main-media": "true" },
    });
    expect(html).not.toContain("<picture");
    expect(html).toContain('data-gallery-main-media="true"');
  });
});
