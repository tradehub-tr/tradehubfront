/**
 * W7 — ProductVideoSection: HLS dalı + poster sözleşmesi.
 *
 *   ÖLÇÜLDÜ  — üretilen HTML: m3u8 için `data-hls-src` (düz `src` DEĞİL),
 *              mp4 için değişmeyen progresif dal, poster özniteliğinin
 *              bağlanması/sanitize edilmesi, varyant swap'ında kapağın
 *              listing videosuna sadık kalması.
 *   ÖLÇÜLMEDİ — gerçek oynatma (canlı tarayıcı ister).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const currentProduct = vi.hoisted(() => ({
  value: {} as Record<string, unknown>,
}));

// Alpine + i18n zincirini gerçek modülleriyle yüklemek teste Alpine.start
// bagajı getirir; burada yalnız HTML üretimi ölçülüyor.
vi.mock("../../alpine/product", () => ({
  getCurrentProduct: () => currentProduct.value,
}));
vi.mock("../../i18n", () => ({ t: (key: string) => key }));

import {
  bindVideoPreview,
  ProductVideoSection,
  setProductVideo,
  toVideoEmbedHtml,
} from "./ProductVideoSection";

describe("toVideoEmbedHtml — HLS dalı", () => {
  it("m3u8 için düz src BASMAZ, data-hls-src ile işaretler", () => {
    // VACUITY hedefi: HLS dalı silinip m3u8 mp4 gibi ele alınırsa bu test kırmızı.
    const html = toVideoEmbedHtml("/files/v.m3u8");
    expect(html).toContain('data-hls-src="/files/v.m3u8"');
    expect(html).not.toMatch(/\ssrc="/);
    expect(html).toContain("playsinline");
    expect(html).toContain("controls");
  });

  it("autoplay istenirse HLS videosu da muted+autoplay alır", () => {
    const html = toVideoEmbedHtml("/files/v.m3u8", true);
    expect(html).toContain(" autoplay muted");
  });

  it("mp4 dalı değişmedi — düz src, progresif", () => {
    const html = toVideoEmbedHtml("/files/v.mp4");
    expect(html).toContain('src="/files/v.mp4"');
    expect(html).not.toContain("data-hls-src");
  });

  it("poster verilirse <video> dallarında basılır, embed'lerde basılmaz", () => {
    expect(toVideoEmbedHtml("/files/v.mp4", false, "/files/kapak.webp")).toContain(
      'poster="/files/kapak.webp"'
    );
    expect(toVideoEmbedHtml("/files/v.m3u8", false, "/files/kapak.webp")).toContain(
      'poster="/files/kapak.webp"'
    );
    expect(
      toVideoEmbedHtml("https://www.youtube.com/watch?v=abcdefghijk", false, "/files/kapak.webp")
    ).not.toContain("poster=");
  });

  it("güvensiz poster URL'i özniteliği tamamen düşürür", () => {
    // Kasıtlı XSS girdisi: sanitizeUrl fallback "" → öznitelik hiç basılmamalı.
    const html = toVideoEmbedHtml("/files/v.mp4", false, "javascript" + ":alert(1)");
    expect(html).not.toContain("poster=");
  });
});

describe("ProductVideoSection — poster bağlama", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("listing videosuna elle yüklü kapak bağlanır ve swap için saklanır", () => {
    currentProduct.value = {
      videoUrl: "/files/tanitim.mp4",
      videoPoster: "/files/tanitim-kapak.webp",
    };
    const html = ProductVideoSection();
    expect(html).toContain('poster="/files/tanitim-kapak.webp"');
    expect(html).toContain('data-listing-poster="/files/tanitim-kapak.webp"');
  });

  it("kapak verisi yoksa poster özniteliği hiç basılmaz", () => {
    currentProduct.value = { videoUrl: "/files/tanitim.mp4" };
    // ` poster="` — <video>'daki öznitelik; `data-listing-poster` boş da olsa durur.
    expect(ProductVideoSection()).not.toMatch(/ poster="/);
  });

  it("varyant videosunda listing kapağı KULLANILMAZ; listing'e dönünce geri gelir", () => {
    currentProduct.value = {
      videoUrl: "/files/tanitim.mp4",
      videoPoster: "/files/tanitim-kapak.webp",
    };
    document.body.innerHTML = ProductVideoSection();

    setProductVideo("/files/varyant.mp4");
    const section = document.getElementById("product-video-section")!;
    expect(section.innerHTML).toContain('src="/files/varyant.mp4"');
    expect(section.innerHTML).not.toContain("poster=");

    setProductVideo("");
    expect(section.innerHTML).toContain('src="/files/tanitim.mp4"');
    expect(section.innerHTML).toContain('poster="/files/tanitim-kapak.webp"');
  });

  it("HLS listing videosu swap sonrası data-hls-src ile işaretli kalır", () => {
    currentProduct.value = { videoUrl: "/files/tanitim.m3u8" };
    document.body.innerHTML = ProductVideoSection();

    setProductVideo("/files/varyant.mp4");
    setProductVideo("");
    const section = document.getElementById("product-video-section")!;
    expect(section.innerHTML).toContain('data-hls-src="/files/tanitim.m3u8"');
    expect(section.innerHTML).not.toMatch(/\ssrc="\/files\/tanitim\.m3u8"/);
  });
});

describe("önizleme kademesi — overlay basımı (poster→önizleme→tam video)", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("previewSrc + doğrudan <video> → sessiz/döngülü klip preload=none ile basılır", () => {
    currentProduct.value = {
      videoUrl: "/files/tanitim.mp4",
      videoPreviewSrc: "/files/onizleme.mp4",
    };
    const html = ProductVideoSection();
    expect(html).toContain("data-listing-preview-clip");
    expect(html).toContain('src="/files/onizleme.mp4"');
    expect(html).toContain("muted");
    expect(html).toContain('preload="none"');
    // reduced-motion CSS güvencesi + dekoratif işaretler.
    expect(html).toContain("motion-reduce:hidden");
    expect(html).toContain('aria-hidden="true"');
    // Klip taşıyıcısı hâlâ data-listing-preview'da (swap için).
    expect(html).toContain('data-listing-preview="/files/onizleme.mp4"');
  });

  it("previewSrc yoksa overlay HİÇ basılmaz — bugünkü poster→tam video davranışı", () => {
    currentProduct.value = { videoUrl: "/files/tanitim.mp4" };
    expect(ProductVideoSection()).not.toContain("data-listing-preview-clip");
  });

  it("ana video YouTube iframe iken önizleme overlay basılmaz", () => {
    currentProduct.value = {
      videoUrl: "https://www.youtube.com/watch?v=abcdefghijk",
      videoPreviewSrc: "/files/onizleme.mp4",
    };
    expect(ProductVideoSection()).not.toContain("data-listing-preview-clip");
  });

  it("güvensiz previewSrc overlay'i tamamen düşürür (XSS)", () => {
    currentProduct.value = {
      videoUrl: "/files/tanitim.mp4",
      videoPreviewSrc: "javascript" + ":alert(1)",
    };
    expect(ProductVideoSection()).not.toContain("data-listing-preview-clip");
  });

  it("varyant swap önizlemeyi düşürür; listing'e dönünce geri gelir", () => {
    currentProduct.value = {
      videoUrl: "/files/tanitim.mp4",
      videoPreviewSrc: "/files/onizleme.mp4",
    };
    document.body.innerHTML = ProductVideoSection();
    setProductVideo("/files/varyant.mp4");
    const section = document.getElementById("product-video-section")!;
    expect(section.innerHTML).not.toContain("data-listing-preview-clip");
    setProductVideo("");
    expect(section.innerHTML).toContain("data-listing-preview-clip");
  });
});

describe("önizleme kademesi — bindVideoPreview davranışı", () => {
  let playSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    document.body.innerHTML = "";
    playSpy = vi.fn(() => Promise.resolve());
    // jsdom HTMLMediaElement.play/pause uygulanmamış — sözleşmeyi mock'la.
    (HTMLMediaElement.prototype as unknown as { play: unknown }).play = playSpy;
    (HTMLMediaElement.prototype as unknown as { pause: unknown }).pause = vi.fn();
  });
  afterEach(() => vi.unstubAllGlobals());

  function kur(): { frame: HTMLElement; clip: HTMLVideoElement } {
    currentProduct.value = {
      videoUrl: "/files/tanitim.mp4",
      videoPreviewSrc: "/files/onizleme.mp4",
    };
    document.body.innerHTML = ProductVideoSection();
    bindVideoPreview(document.getElementById("product-video-section"));
    const frame = document.querySelector<HTMLElement>("[data-video-frame]")!;
    const clip = frame.querySelector<HTMLVideoElement>("[data-listing-preview-clip]")!;
    return { frame, clip };
  }

  it("hover (pointerenter) klibi oynatır + görünür kılar; pointerleave durdurur", () => {
    const { frame, clip } = kur();
    frame.dispatchEvent(new Event("pointerenter"));
    expect(playSpy).toHaveBeenCalled();
    expect(clip.classList.contains("opacity-100")).toBe(true);
    frame.dispatchEvent(new Event("pointerleave"));
    expect(clip.classList.contains("opacity-0")).toBe(true);
  });

  it("klavye odağı (focusin) da önizler — erişilebilirlik", () => {
    const { frame } = kur();
    frame.dispatchEvent(new Event("focusin"));
    expect(playSpy).toHaveBeenCalled();
  });

  it("prefers-reduced-motion: reduce → hiç oynatmaz (poster sabit kalır)", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: true }))
    );
    const { frame } = kur();
    frame.dispatchEvent(new Event("pointerenter"));
    expect(playSpy).not.toHaveBeenCalled();
  });

  it("ana video oynayınca önizleme klibi kalıcı sökülür (iki video çakışmaz)", () => {
    const { frame } = kur();
    const main = frame.querySelector<HTMLVideoElement>("video:not([data-listing-preview-clip])")!;
    main.dispatchEvent(new Event("play"));
    expect(frame.querySelector("[data-listing-preview-clip]")).toBeNull();
    // Sökülme sonrası hover artık oynatmaz.
    frame.dispatchEvent(new Event("pointerenter"));
    expect(playSpy).not.toHaveBeenCalled();
  });

  it("VACUITY: bindVideoPreview çağrılmazsa hover oynatmaz", () => {
    currentProduct.value = {
      videoUrl: "/files/tanitim.mp4",
      videoPreviewSrc: "/files/onizleme.mp4",
    };
    document.body.innerHTML = ProductVideoSection();
    const frame = document.querySelector<HTMLElement>("[data-video-frame]")!;
    frame.dispatchEvent(new Event("pointerenter"));
    expect(playSpy).not.toHaveBeenCalled();
  });
});
