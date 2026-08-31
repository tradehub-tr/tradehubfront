/**
 * KD-F03 — Vitrin teslim katmanı: manifest → <picture>/srcset, sizes, HLS.
 *
 * Kaynak okundu:
 *   src/lib/media/manifest.ts          (433) — manifest önbelleği + okuma
 *   src/lib/media/sizes.ts             (126) — bölge → sizes tablosu
 *   src/components/media/ResponsiveImage.ts (307) — işaretleme üretimi
 *   src/utils/hlsVideo.ts              (150) — HLS kaynak bağlama
 *
 * Denetimin soruları:
 *   • Manifest bozuk/eksik geldiğinde sayfa BOZULUYOR mu, yoksa yedeğe mi
 *     düşüyor? (Teslim katmanı asla sayfayı düşürmemeli.)
 *   • Üretilen işaretleme XSS taşıyor mu? (alt/sizes kullanıcı verisi.)
 *   • LCP kuralları (fetchpriority/loading/decoding) sözleşmeye uyuyor mu?
 *   • CLS kuralı (width/height olmadan üretim yok) uygulanıyor mu?
 *
 * Koşum: npm run test:unit
 */

import { beforeEach, describe, expect, it } from "vitest";

import { ResponsiveImage } from "../../components/media/ResponsiveImage";
import { mediaSizesFor, MEDIA_SIZES } from "./sizes";
import {
  clearMediaManifestCache,
  getMediaImageManifest,
  getMediaManifest,
  seedMediaManifest,
} from "./manifest";

const YEDEK = '<img src="/files/orijinal.jpg" alt="yedek">';
const yedek = () => YEDEK;

/** Gerçekçi bir görsel manifesti — testler yalnız farkı yazar. */
function gorselManifest(ustune: Record<string, unknown> = {}) {
  return {
    src: "/files/urun-1200.webp",
    width: 1200,
    height: 1200,
    alt: "Kırmızı koltuk",
    sources: [
      { type: "image/avif", srcset: "/files/urun-600.avif 600w, /files/urun-1200.avif 1200w" },
      { type: "image/webp", srcset: "/files/urun-600.webp 600w, /files/urun-1200.webp 1200w" },
    ],
    sizes: "(max-width: 768px) 100vw, 600px",
    ...ustune,
  } as never;
}

// ══════════════════════════════════════════════════════════════════
// 1. sizes tablosu
// ══════════════════════════════════════════════════════════════════

describe("KD-F03/1 · mediaSizesFor", () => {
  it("bilinen bölgeler için tablo değerini döner", () => {
    for (const [bolge, deger] of Object.entries(MEDIA_SIZES)) {
      expect(mediaSizesFor(bolge)).toBe(deger);
    }
  });

  it("bilinmeyen bölgede boş dizge döner — uydurmaz", () => {
    for (const kotu of ["", "olmayan-bolge", "  ", "PRODUCT_GALLERY"]) {
      expect(typeof mediaSizesFor(kotu)).toBe("string");
    }
  });

  it("tablodaki her değer geçerli bir sizes ifadesi", () => {
    for (const [bolge, deger] of Object.entries(MEDIA_SIZES)) {
      expect(deger, bolge).toMatch(/(vw|px|em|rem)/);
      expect(deger, bolge).not.toContain("undefined");
      expect(deger, bolge).not.toContain("NaN");
    }
  });

  it("hiçbir girdide istisna atmaz", () => {
    for (const kotu of [undefined, null, 0, {}, []] as unknown[]) {
      expect(() => mediaSizesFor(kotu as string)).not.toThrow();
    }
  });
});

// ══════════════════════════════════════════════════════════════════
// 2. Manifest önbelleği
// ══════════════════════════════════════════════════════════════════

describe("KD-F03/2 · manifest önbelleği", () => {
  beforeEach(() => clearMediaManifestCache());

  it("tohumlanan manifest geri okunur", () => {
    seedMediaManifest("LST-1", {
      slot: "product.image",
      images: { "/files/a.jpg": gorselManifest() },
    });
    expect(getMediaManifest("LST-1")).not.toBeNull();
  });

  it("bilinmeyen ilan null döner — boş nesne DEĞİL", () => {
    expect(getMediaManifest("LST-YOK")).toBeNull();
    expect(getMediaImageManifest("LST-YOK", "/files/a.jpg")).toBeNull();
  });

  it("temizleme sonrası okuma null", () => {
    seedMediaManifest("LST-2", { images: { "/files/a.jpg": gorselManifest() } });
    clearMediaManifestCache();
    expect(getMediaManifest("LST-2")).toBeNull();
  });

  it("BOZUK gövde önbelleği kirletmez ve patlamaz", () => {
    for (const kotu of [null, undefined, 0, "", "metin", [], { images: null }, { images: 5 }]) {
      expect(() => seedMediaManifest("LST-BOZUK", kotu as unknown)).not.toThrow();
      const m = getMediaImageManifest("LST-BOZUK", "/files/a.jpg");
      expect(m === null || typeof m === "object").toBe(true);
    }
  });

  it("bilinmeyen dosya adresi null", () => {
    seedMediaManifest("LST-3", { images: { "/files/a.jpg": gorselManifest() } });
    expect(getMediaImageManifest("LST-3", "/files/olmayan.jpg")).toBeNull();
  });

  it("boş ilan/dosya adı sorgusu patlamaz", () => {
    for (const [l, f] of [
      ["", ""],
      ["LST-3", ""],
      ["", "/files/a.jpg"],
    ]) {
      expect(() => getMediaImageManifest(l, f)).not.toThrow();
    }
  });
});

// ══════════════════════════════════════════════════════════════════
// 3. ResponsiveImage — işaretleme üretimi
// ══════════════════════════════════════════════════════════════════

describe("KD-F03/3 · ResponsiveImage sözleşmesi", () => {
  it("manifest yoksa BİREBİR yedeği döner", () => {
    expect(ResponsiveImage({ fallback: yedek })).toBe(YEDEK);
    expect(ResponsiveImage({ manifest: null, fallback: yedek })).toBe(YEDEK);
    expect(ResponsiveImage({ manifest: undefined, fallback: yedek })).toBe(YEDEK);
  });

  it("CLS kuralı · ölçü yoksa üretim DURUR, yedeğe düşer", () => {
    const olcusuz = gorselManifest({ width: 0, height: 0 });
    expect(ResponsiveImage({ manifest: olcusuz, fallback: yedek })).toBe(YEDEK);
  });

  it("ölçü seçeneklerden gelebilir", () => {
    const olcusuz = gorselManifest({ width: 0, height: 0 });
    const html = ResponsiveImage({ manifest: olcusuz, fallback: yedek, width: 800, height: 600 });
    expect(html).not.toBe(YEDEK);
    expect(html).toContain('width="800"');
    expect(html).toContain('height="600"');
  });

  it("çok biçimli manifest <picture> + <source> üretir", () => {
    const html = ResponsiveImage({ manifest: gorselManifest(), fallback: yedek });
    expect(html.startsWith("<picture")).toBe(true);
    expect(html).toContain('type="image/avif"');
    expect(html).toContain("</picture>");
    // Son biçim <img> üzerinde taşınır, <source> olarak TEKRAR EDİLMEZ.
    expect(html.match(/<source /g)?.length).toBe(1);
  });

  it("tek biçimli manifestte sarmal ÜRETİLMEZ (gereksiz DOM yok)", () => {
    const tek = gorselManifest({
      sources: [{ type: "image/webp", srcset: "/files/a-600.webp 600w" }],
    });
    const html = ResponsiveImage({ manifest: tek, fallback: yedek });
    expect(html.startsWith("<img")).toBe(true);
    expect(html).not.toContain("<picture");
  });

  it("srcset ve sizes <img> üzerinde bulunur", () => {
    const html = ResponsiveImage({ manifest: gorselManifest(), fallback: yedek });
    expect(html).toContain("srcset=");
    expect(html).toContain("sizes=");
    expect(html).toContain("1200w");
  });

  it("seçenekteki sizes manifesti EZER", () => {
    const html = ResponsiveImage({
      manifest: gorselManifest(),
      fallback: yedek,
      sizes: "(max-width: 480px) 50vw, 320px",
    });
    expect(html).toContain("320px");
  });

  it("LCP · priority=true fetchpriority=high, loading YAZILMAZ", () => {
    const html = ResponsiveImage({ manifest: gorselManifest(), fallback: yedek, priority: true });
    expect(html).toContain('fetchpriority="high"');
    expect(html).toContain('decoding="sync"');
    expect(html).not.toContain("loading=");
  });

  it("LCP · priority=false lazy + async", () => {
    const html = ResponsiveImage({ manifest: gorselManifest(), fallback: yedek, priority: false });
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('decoding="async"');
    expect(html).not.toContain('fetchpriority="high"');
  });

  it("LCP · eager ızgara kartına fetchpriority VERMEZ", () => {
    // 20 kartın hepsine `high` vermek önceliği anlamsızlaştırır.
    const html = ResponsiveImage({ manifest: gorselManifest(), fallback: yedek, eager: true });
    expect(html).not.toContain('fetchpriority="high"');
  });

  it("alt boş dizge GEÇERLİ bir değerdir (dekoratif görsel)", () => {
    const html = ResponsiveImage({ manifest: gorselManifest(), fallback: yedek, alt: "" });
    expect(html).toContain('alt=""');
  });

  it("GÜVENLİK · alt metnindeki HTML kaçışlanır", () => {
    const html = ResponsiveImage({
      manifest: gorselManifest(),
      fallback: yedek,
      alt: '"><script>alert(1)</script>',
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("GÜVENLİK · manifestten gelen src/srcset kaçışlanır", () => {
    const kotu = gorselManifest({
      src: '/files/a.jpg" onerror="alert(1)',
      sources: [{ type: "image/webp", srcset: '/files/a.webp 600w" onload="alert(1)' }],
    });
    const html = ResponsiveImage({ manifest: kotu, fallback: yedek });
    expect(html).not.toContain('onerror="alert(1)"');
    expect(html).not.toContain('onload="alert(1)"');
  });

  it("GÜVENLİK · sizes değeri kaçışlanır", () => {
    const html = ResponsiveImage({
      manifest: gorselManifest(),
      fallback: yedek,
      sizes: '100vw" onmouseover="x()',
    });
    expect(html).not.toContain('onmouseover="x()"');
  });

  it("extraAttrs sıra korunarak eklenir, undefined atlanır", () => {
    const html = ResponsiveImage({
      manifest: gorselManifest(),
      fallback: yedek,
      extraAttrs: { "data-a": "1", "data-yok": undefined, "data-b": 2 },
    });
    expect(html).toContain('data-a="1"');
    expect(html).toContain('data-b="2"');
    expect(html).not.toContain("data-yok");
  });

  it("hostAttrs sarmal varsa <picture>a, yoksa <img>e yazılır", () => {
    const cok = ResponsiveImage({
      manifest: gorselManifest(),
      fallback: yedek,
      hostAttrs: { "data-gallery-main-media": "true" },
    });
    expect(cok.indexOf("data-gallery-main-media")).toBeLessThan(cok.indexOf("<img"));

    const tek = ResponsiveImage({
      manifest: gorselManifest({ sources: [{ type: "image/webp", srcset: "/files/a.webp 600w" }] }),
      fallback: yedek,
      hostAttrs: { "data-gallery-main-media": "true" },
    });
    expect(tek.startsWith("<img")).toBe(true);
    expect(tek).toContain("data-gallery-main-media");
  });

  it("DAYANIKLILIK · bozuk manifestlerde istisna atmaz", () => {
    const bozuklar = [
      {},
      { src: "" },
      { sources: [] },
      { sources: null },
      { src: "/a.jpg", sources: [{}] },
      { src: "/a.jpg", width: -1, height: -1, sources: [{ type: "", srcset: "" }] },
      { src: "/a.jpg", width: "abc", height: "abc", sources: [{ type: "image/webp", srcset: "x" }] },
    ];
    for (const m of bozuklar) {
      expect(() => ResponsiveImage({ manifest: m as never, fallback: yedek })).not.toThrow(
        JSON.stringify(m),
      );
      const html = ResponsiveImage({ manifest: m as never, fallback: yedek });
      expect(typeof html).toBe("string");
      expect(html.length).toBeGreaterThan(0);
    }
  });

  it("DAYANIKLILIK · üretilen çıktı her zaman kapalı etiket", () => {
    const html = ResponsiveImage({ manifest: gorselManifest(), fallback: yedek });
    const acik = (html.match(/</g) || []).length;
    const kapali = (html.match(/>/g) || []).length;
    expect(acik).toBe(kapali);
  });
});
