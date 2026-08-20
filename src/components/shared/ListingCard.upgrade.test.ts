/**
 * Geç gelen manifest basılı KART görsellerini yerinde terfi ettirir (W9).
 *
 * Izgara soğuk yüklemede manifesti kısa bir tavan kadar bekliyor
 * (`ProductListingGrid.rerenderProductGrid`); tavan aşılırsa kartlar ham
 * `<img>` ile basılıyor ve manifest gelince `upgradeListingCardMedia`
 * çağrılıyor. Bu dosya o çağrının BİR İŞE YARADIĞINI ve CLS sözleşmesini
 * (terfi boyut değiştirmez) kanıtlar — `ProductImageGallery.upgrade.test.ts`
 * (F-2) deseninin kart karşılığı.
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

/** Kartı ızgaradaki gibi bir sarmalayıcıya bas. */
function kartiBas(): void {
  document.body.innerHTML = `<div class="product-grid">${renderListingCard(KART)}</div>`;
}

describe("upgradeListingCardMedia — geç gelen manifest kartlara uygulanır", () => {
  beforeEach(() => {
    clearMediaManifestCache();
    sessionStorage.clear();
    document.body.innerHTML = "";
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("soğuk basımdan sonra manifest gelince `<picture>`e terfi ettirir", async () => {
    kartiBas();
    expect(document.querySelector("picture")).toBeNull();
    const hamImg = document.querySelector<HTMLImageElement>(".product-slider img");
    expect(hamImg).not.toBeNull();
    const hamClass = hamImg!.getAttribute("class");

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => manifestYaniti())
    );
    await primeMediaManifests(["LST-0001"]);

    expect(upgradeListingCardMedia()).toBe(1);
    const picture = document.querySelector(".product-slider picture");
    expect(picture).not.toBeNull();
    expect(picture?.querySelector('source[type="image/avif"]')).not.toBeNull();
    const img = picture?.querySelector("img");
    expect(img?.getAttribute("srcset")).toContain("w384-384.webp");

    // ── CLS sözleşmesi: terfi boyut DEĞİŞTİRMEZ ──
    // Kutu sınıfları (w-full h-full object-*) ham `<img>`den aynen taşınır;
    // içsel ölçü yazılıdır (oran rezervasyonu hiç kaybolmaz).
    expect(img?.getAttribute("class")).toBe(hamClass);
    expect(hamClass).toContain("w-full h-full");
    expect(Number(img?.getAttribute("width"))).toBeGreaterThan(0);
    expect(Number(img?.getAttribute("height"))).toBeGreaterThan(0);
  });

  it("yükleme semantiğini korur: eager ilk slayt terfi sonrası da lazy OLMAZ", async () => {
    kartiBas();
    // Bugünkü ilk slayt `loading` özniteliği TAŞIMAZ (eager).
    expect(
      document.querySelector<HTMLImageElement>(".product-slider img")?.hasAttribute("loading")
    ).toBe(false);

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => manifestYaniti())
    );
    await primeMediaManifests(["LST-0001"]);
    upgradeListingCardMedia();

    const img = document.querySelector<HTMLImageElement>(".product-slider picture img");
    expect(img).not.toBeNull();
    // Terfi eager'ı lazy'ye çevirseydi LCP adayı geç indirilirdi.
    expect(img!.getAttribute("loading")).toBeNull();
    // Kart LCP işaretlemez: `fetchpriority="high"` de yazılmamalı.
    expect(img!.getAttribute("fetchpriority")).toBeNull();
  });

  it("ikinci çağrı hiçbir şeyi yeniden yazmaz (tekrara dayanıklı)", async () => {
    kartiBas();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => manifestYaniti())
    );
    await primeMediaManifests(["LST-0001"]);

    expect(upgradeListingCardMedia()).toBe(1);
    expect(upgradeListingCardMedia()).toBe(0);
  });

  it("manifest yokken DOM'a dokunmaz (yedek yol bozulmaz)", () => {
    kartiBas();
    const once = document.body.innerHTML;

    expect(upgradeListingCardMedia()).toBe(0);
    expect(document.body.innerHTML).toBe(once);
  });
});
