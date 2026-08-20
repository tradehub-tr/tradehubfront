/**
 * T-122 — LCP preload'u.
 *
 *   ÖLÇÜLÜR  — üst sınırın (bir tane) yapısal olduğu; `srcset` varken
 *              `imagesrcset` + `imagesizes` ikilisinin BİREBİR işaretlemeden
 *              geldiği; `<picture>`da yalnız BİRİNCİ `<source>`un ve onun
 *              `type`ının preload'landığı; belirsiz her durumda HİÇ
 *              basılmadığı; ürün galerisinin bunu tek bir çağrıda kullandığı.
 *
 *   ÖLÇÜLMEZ — GERÇEK bir tarayıcıda çift indirme olup olmadığı. happy-dom
 *              ağ isteği atmaz; burada kanıtlanan şey "preload özniteliği
 *              `<img>`inkiyle AYNI dizge" — "Chrome tek istek attı" DEĞİL.
 *              O doğrulama DevTools/Playwright ağ kaydı ister ve bu görevde
 *              YAPILMADI.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  LCP_PRELOAD_MARKER,
  MAX_LCP_PRELOADS,
  extractLcpSourceFromHtml,
  preloadLcpImage,
  preloadLcpImageFromHtml,
  resetLcpPreload,
} from "./LcpPreload";

const SRCSET_AVIF = "/files/a-384.avif 384w, /files/a-768.avif 768w";
const SRCSET_JPEG = "/files/a-384.jpg 384w, /files/a-768.jpg 768w";
const SIZES = "(min-width: 1024px) 502px, 100vw";

function pictureHtml(): string {
  return (
    `<picture class="block w-full h-full">` +
    `<source type="image/avif" srcset="${SRCSET_AVIF}" sizes="${SIZES}">` +
    `<img src="/files/a.jpg" srcset="${SRCSET_JPEG}" sizes="${SIZES}" alt="x" ` +
    `width="800" height="800" decoding="sync" fetchpriority="high">` +
    `</picture>`
  );
}

function baglantilar(): HTMLLinkElement[] {
  return Array.from(document.head.querySelectorAll<HTMLLinkElement>(`link[${LCP_PRELOAD_MARKER}]`));
}

beforeEach(() => {
  document.head.innerHTML = "";
  document.body.innerHTML = "";
});

describe("üst sınır (1. tuzak)", () => {
  it("sınır BİR — sabit yorumla değil kodla tutuluyor", () => {
    expect(MAX_LCP_PRELOADS).toBe(1);
  });

  it("ikinci çağrı hiçbir şey basmaz, false döner", () => {
    expect(preloadLcpImageFromHtml(pictureHtml())).toBe(true);
    expect(preloadLcpImageFromHtml(`<img src="/files/b.jpg">`)).toBe(false);
    expect(preloadLcpImageFromHtml(`<img src="/files/c.jpg">`)).toBe(false);
    expect(baglantilar()).toHaveLength(1);
  });

  it("sayaç DOM'da: modül durumu değil `<head>` belirleyici", () => {
    // Elle basılmış bir işaretçi bağlantı da sınırı doldurur — modül hiç
    // çağrılmamış olsa bile. Modül düzeyi bir bayrak olsaydı bu geçmezdi.
    const link = document.createElement("link");
    link.setAttribute("rel", "preload");
    link.setAttribute(LCP_PRELOAD_MARKER, "");
    document.head.appendChild(link);
    expect(preloadLcpImageFromHtml(pictureHtml())).toBe(false);
    expect(baglantilar()).toHaveLength(1);
  });

  it("resetLcpPreload sınırı serbest bırakır", () => {
    expect(preloadLcpImageFromHtml(pictureHtml())).toBe(true);
    resetLcpPreload();
    expect(baglantilar()).toHaveLength(0);
    expect(preloadLcpImageFromHtml(pictureHtml())).toBe(true);
  });

  it("birden fazla `<img>` taşıyan işaretlemede HİÇBİRİ preload'lanmaz", () => {
    const html = `<div><img src="/files/a.jpg"><img src="/files/b.jpg"></div>`;
    expect(extractLcpSourceFromHtml(html)).toBeNull();
    expect(preloadLcpImageFromHtml(html)).toBe(false);
    expect(baglantilar()).toHaveLength(0);
  });
});

describe("srcset/sizes uyumu (2. tuzak)", () => {
  it("`imagesrcset` ve `imagesizes` işaretlemedeki dizgelerin BİREBİR aynısı", () => {
    const html = pictureHtml();
    expect(preloadLcpImageFromHtml(html)).toBe(true);
    const link = baglantilar()[0];

    // Kaynak doğruluk: değerleri testte yeniden yazmıyoruz, BASILAN
    // işaretlemeden okuyup karşılaştırıyoruz.
    const tpl = document.createElement("template");
    tpl.innerHTML = html;
    const source = tpl.content.querySelector("source")!;

    expect(link.getAttribute("imagesrcset")).toBe(source.getAttribute("srcset"));
    expect(link.getAttribute("imagesizes")).toBe(source.getAttribute("sizes"));
  });

  it("`w` tanımlayıcılı srcset varken `href` YAZILMAZ", () => {
    preloadLcpImageFromHtml(pictureHtml());
    expect(baglantilar()[0].hasAttribute("href")).toBe(false);
  });

  it("`sizes` yoksa `w` srcset'li preload BASILMAZ", () => {
    const html = `<picture><source type="image/avif" srcset="${SRCSET_AVIF}"><img src="/files/a.jpg"></picture>`;
    expect(preloadLcpImageFromHtml(html)).toBe(false);
    expect(baglantilar()).toHaveLength(0);
  });

  it("`x` tanımlayıcılı srcset'te preload BASILMAZ (seçim garanti edilemez)", () => {
    const html = `<img src="/files/a.jpg" srcset="/files/a.jpg 1x, /files/a2.jpg 2x" sizes="${SIZES}">`;
    expect(preloadLcpImageFromHtml(html)).toBe(false);
    expect(baglantilar()).toHaveLength(0);
  });

  it("`<picture>` yokken `<img srcset>` + `sizes` aynen taşınır", () => {
    const html = `<img src="/files/a.jpg" srcset="${SRCSET_JPEG}" sizes="${SIZES}">`;
    expect(preloadLcpImageFromHtml(html)).toBe(true);
    const link = baglantilar()[0];
    expect(link.getAttribute("imagesrcset")).toBe(SRCSET_JPEG);
    expect(link.getAttribute("imagesizes")).toBe(SIZES);
  });

  it("srcset yokken preload adresi `<img src>` ile birebir aynı", () => {
    expect(preloadLcpImageFromHtml(`<img src="/files/tek.jpg" alt="">`)).toBe(true);
    const link = baglantilar()[0];
    expect(link.getAttribute("href")).toBe("/files/tek.jpg");
    expect(link.hasAttribute("imagesrcset")).toBe(false);
  });
});

describe("format uyumu (3. tuzak)", () => {
  it("preload YALNIZ birinci `<source>`u hedefler ve onun `type`ını taşır", () => {
    const html =
      `<picture>` +
      `<source type="image/avif" srcset="${SRCSET_AVIF}" sizes="${SIZES}">` +
      `<source type="image/webp" srcset="/files/a-384.webp 384w" sizes="${SIZES}">` +
      `<img src="/files/a.jpg" srcset="${SRCSET_JPEG}" sizes="${SIZES}">` +
      `</picture>`;
    expect(preloadLcpImageFromHtml(html)).toBe(true);
    // Tek bağlantı: AVIF+WebP için iki preload basmak çift indirme olurdu.
    expect(baglantilar()).toHaveLength(1);
    const link = baglantilar()[0];
    expect(link.getAttribute("type")).toBe("image/avif");
    expect(link.getAttribute("imagesrcset")).toBe(SRCSET_AVIF);
    expect(link.getAttribute("imagesrcset")).not.toContain(".webp");
  });

  it("düz `<img>`de `type` UYDURULMAZ", () => {
    preloadLcpImageFromHtml(`<img src="/files/tek.avif">`);
    expect(baglantilar()[0].hasAttribute("type")).toBe(false);
  });
});

describe("güvenlik ve dayanıklılık", () => {
  it("güvensiz şemalı `src` preload'lanmaz", () => {
    expect(preloadLcpImage({ src: "javascript:alert(1)", srcset: "", sizes: "", type: "" })).toBe(
      false
    );
    expect(baglantilar()).toHaveLength(0);
  });

  it("srcset adaylarından biri güvensizse HİÇBİRİ preload'lanmaz", () => {
    const ok = preloadLcpImage({
      src: "/files/a.jpg",
      srcset: `/files/a-384.jpg 384w, javascript:alert(1) 768w`,
      sizes: SIZES,
      type: "image/jpeg",
    });
    expect(ok).toBe(false);
    expect(baglantilar()).toHaveLength(0);
  });

  it("`<img>` içermeyen işaretleme (yer tutucu) hiçbir şey basmaz", () => {
    expect(preloadLcpImageFromHtml(`<div class="placeholder"><svg></svg></div>`)).toBe(false);
    expect(baglantilar()).toHaveLength(0);
  });

  it("ayrıştırma ETKİSİZ `<template>` ile yapılır — DOM'a `<img>` sızmaz", () => {
    preloadLcpImageFromHtml(pictureHtml());
    expect(document.body.querySelectorAll("img")).toHaveLength(0);
    expect(document.head.querySelectorAll("img")).toHaveLength(0);
  });

  it("bastığı bağlantı `rel=preload as=image fetchpriority=high` taşır", () => {
    preloadLcpImageFromHtml(pictureHtml());
    const link = baglantilar()[0];
    expect(link.getAttribute("rel")).toBe("preload");
    expect(link.getAttribute("as")).toBe("image");
    expect(link.getAttribute("fetchpriority")).toBe("high");
  });
});

describe("ürün galerisi bağlantısı", () => {
  it("yalnız `lcp: true` geçen çağrı preload üretir; karolar üretmez", async () => {
    vi.resetModules();
    const galeri = await import("../product/ProductImageGallery");

    // Karo (thumb) — LCP adayı DEĞİL.
    galeri.renderGalleryMedia("/files/t.jpg", "t", galeri.defaultVisual, "thumb");
    expect(baglantilar()).toHaveLength(0);

    // Lightbox da "large" basar ama `lcp` bayrağı YOK.
    galeri.renderGalleryMedia("/files/lb.jpg", "lb", galeri.defaultVisual, "large");
    expect(baglantilar()).toHaveLength(0);

    // Ana görsel.
    galeri.renderGalleryMedia("/files/main.jpg", "m", galeri.defaultVisual, "large", { lcp: true });
    expect(baglantilar()).toHaveLength(1);
    expect(baglantilar()[0].getAttribute("href")).toBe("/files/main.jpg");
  });

  it("ProductImageGallery() tüm sayfa için TEK bağlantı basar", async () => {
    vi.resetModules();
    const galeri = await import("../product/ProductImageGallery");
    // Şablon ana görseli, lightbox'ı ve tüm karoları basar.
    galeri.ProductImageGallery();
    expect(baglantilar().length).toBeLessThanOrEqual(MAX_LCP_PRELOADS);
  });
});
