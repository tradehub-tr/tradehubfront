/**
 * LCP adayı işareti — `priorityImage` sözleşmesi (W9, rapor 91 §2.5 kapanışı).
 *
 * `rerenderProductGrid` ızgaranın İLK kartına `priorityImage: true` verir;
 * o kartın ilk görseli `fetchpriority="high"` + eager (`loading` özniteliği
 * hiç yazılmaz) basılmalı — manifest yolunda da ham yedek yolunda da. Diğer
 * kartlar ve 2.+ slaytlar İŞARETSİZ kalmalı: 20 karta birden `high` vermek
 * önceliği anlamsızlaştırır (`LcpPreload.MAX_LCP_PRELOADS` gerekçesi).
 *
 * Ayrıca varsayılan (işaretsiz) çıktının BUGÜNKÜ işaretlemeyle birebir aynı
 * kaldığı kanıtlanır — `ListingCard.test.ts` anlık görüntüleri bu dosyadan
 * bağımsız olarak da bunu korur.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderListingCard, upgradeListingCardMedia } from "./ListingCard";
import { clearMediaManifestCache, primeMediaManifests } from "../../lib/media/manifest";
import type { ProductListingCard } from "../../types/productListing";

const KART: ProductListingCard = {
  id: "LST-0001",
  name: "Test Ürün",
  href: "/pages/product-detail.html?id=LST-0001",
  price: "₺100",
  moq: "5 adet",
  stats: "",
  imageKind: "accessory",
  imageSrc: "/files/urun.jpg",
};

const MANIFEST = {
  slot_key: "product.image",
  src: "/files/media/abc/w768-768.webp",
  sizes: "25vw",
  alt: "Test Ürün",
  loading: "lazy",
  decoding: "async",
  fetchpriority: "",
  width: 1200,
  height: 1200,
  aspect_ratio: 1,
  sources: [
    { type: "image/avif", srcset: "/files/media/abc/w384-384.avif 384w", sizes: "" },
    { type: "image/webp", srcset: "/files/media/abc/w384-384.webp 384w", sizes: "" },
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
                alt_text: "Test Ürün",
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

/** İşaretlemeyi etkisiz (inert) ayrıştır — `<template>` içi görsel İNDİRİLMEZ. */
function ayristir(html: string): DocumentFragment {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  return tpl.content;
}

describe("renderListingCard — priorityImage (LCP adayı) sözleşmesi", () => {
  beforeEach(() => {
    clearMediaManifestCache();
    sessionStorage.clear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("varsayılan kart HİÇBİR yolda fetchpriority taşımaz (bugünkü işaretleme)", () => {
    const dom = ayristir(renderListingCard(KART));
    const img = dom.querySelector<HTMLImageElement>(".product-slider img");
    expect(img).not.toBeNull();
    expect(img!.getAttribute("fetchpriority")).toBeNull();
    // İlk slayt bugün de eager: `loading` özniteliği yok.
    expect(img!.hasAttribute("loading")).toBe(false);
  });

  it("ham yedek yolunda (önbellek soğuk) ilk görsel fetchpriority=high + eager basılır", () => {
    const dom = ayristir(renderListingCard(KART, { priorityImage: true }));
    const img = dom.querySelector<HTMLImageElement>(".product-slider img");
    expect(img).not.toBeNull();
    expect(img!.getAttribute("fetchpriority")).toBe("high");
    // Eager: `loading` özniteliği HİÇ yazılmaz (açık `eager` yazmak bazı
    // tarayıcılarda lazy sezgiselini uyandırır — ResponsiveImage gerekçesi).
    expect(img!.hasAttribute("loading")).toBe(false);
    // Ham yol: manifest yok → `<picture>` da yok.
    expect(dom.querySelector("picture")).toBeNull();
  });

  it("manifest yolunda (önbellek sıcak) `<picture>` içindeki img fetchpriority=high taşır", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => manifestYaniti())
    );
    await primeMediaManifests(["LST-0001"]);

    const dom = ayristir(renderListingCard(KART, { priorityImage: true }));
    const img = dom.querySelector<HTMLImageElement>(".product-slider picture img");
    expect(img).not.toBeNull();
    expect(img!.getAttribute("fetchpriority")).toBe("high");
    expect(img!.hasAttribute("loading")).toBe(false);
    // Öncelikli görsel senkron çözülür (ResponsiveImage priority sözleşmesi).
    expect(img!.getAttribute("decoding")).toBe("sync");
  });

  it("lazy ile birlikte verilirse lazy KAZANIR — fold altı kart LCP adayı olamaz", () => {
    const dom = ayristir(renderListingCard(KART, { priorityImage: true, lazy: true }));
    const img = dom.querySelector<HTMLImageElement>(".product-slider img");
    expect(img).not.toBeNull();
    expect(img!.getAttribute("fetchpriority")).toBeNull();
    expect(img!.getAttribute("loading")).toBe("lazy");
  });

  it("2.+ slaytlar işaret ALMAZ: template içindeki görseller lazy ve önceliksiz", () => {
    const cokGorselli: ProductListingCard = {
      ...KART,
      // Tip `ProductImageKind[]` dese de API bu alanda URL döndürüyor ve
      // `renderImageSlider.isImageSource` yalnız URL'leri medya sayıyor —
      // kartın gerçek çalışma-zamanı girdisi bu (ListingCard.ts'teki gerekçe).
      images: ["/files/urun-2.jpg", "/files/urun-3.jpg"] as unknown as ProductListingCard["images"],
    };
    const dom = ayristir(renderListingCard(cokGorselli, { priorityImage: true }));
    const sablon = dom.querySelector<HTMLTemplateElement>("template[data-slider-secondary]");
    expect(sablon).not.toBeNull();
    const ikincilImgler = Array.from(sablon!.content.querySelectorAll("img"));
    expect(ikincilImgler.length).toBe(2);
    for (const img of ikincilImgler) {
      expect(img.getAttribute("fetchpriority")).toBeNull();
      expect(img.getAttribute("loading")).toBe("lazy");
    }
  });

  it("yerinde terfi LCP işaretini DÜŞÜRMEZ: ham fetchpriority=high, terfi sonrası da high", async () => {
    // Soğuk basım: ilk kart LCP adayı olarak ham basıldı (tavan aşımı yolu).
    document.body.innerHTML = `<div class="product-grid">${renderListingCard(KART, {
      priorityImage: true,
    })}</div>`;
    const ham = document.querySelector<HTMLImageElement>(".product-slider img");
    expect(ham!.getAttribute("fetchpriority")).toBe("high");

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => manifestYaniti())
    );
    await primeMediaManifests(["LST-0001"]);
    expect(upgradeListingCardMedia()).toBe(1);

    const img = document.querySelector<HTMLImageElement>(".product-slider picture img");
    expect(img).not.toBeNull();
    // İşaret terfide korunur; düşseydi öncelik sinyali yarı yolda kaybolurdu.
    expect(img!.getAttribute("fetchpriority")).toBe("high");
    expect(img!.hasAttribute("loading")).toBe(false);
  });
});
