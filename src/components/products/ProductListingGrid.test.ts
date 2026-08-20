/**
 * Soğuk yüklemede ızgara manifesti tavana kadar BEKLER; tavan aşılırsa ham
 * basar ve manifest gelince yerinde terfi ettirir (W9 — rapor 91 §2.5).
 *
 * Rapor 91'in ağ kanıtı: soğuk yüklemede sayfa 0 türev isteği atıyor, 38 ham
 * görsel / 7,2 MB indiriyordu — manifest isteği atılıyor ama sonucu ilk boyama
 * kullanmıyordu. Bu dosya iki kapanış yolunu da kanıtlar:
 *  (b) manifest tavandan ÖNCE gelirse İLK boyama `<picture>`/srcset üretir;
 *  (a) tavan aşılırsa ham basılır ve manifest gelince terfi çalışır.
 * Bekletme ya da terfi geri alınırsa bu testler kırmızıya döner (vacuity).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MANIFEST_FIRST_PAINT_WAIT_MS, rerenderProductGrid } from "./ProductListingGrid";
import { clearMediaManifestCache } from "../../lib/media/manifest";
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

function manifestGovdesi(): unknown {
  return {
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
  };
}

/** Sayfadaki gibi boş bir ızgara kabı kur. */
function izgarayiKur(): void {
  document.body.innerHTML = `<div class="product-grid" data-list-mode="grid"></div>`;
}

describe("rerenderProductGrid — soğuk yükleme manifest sözleşmesi", () => {
  beforeEach(() => {
    clearMediaManifestCache();
    sessionStorage.clear();
    izgarayiKur();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("(b) manifest tavandan önce gelirse İLK boyama `<picture>` üretir", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => manifestGovdesi(),
      }) as unknown as Response)
    );

    await rerenderProductGrid([KART]);

    // İlk boyama — terfi değil: kart doğrudan `<picture>` ile basılmış olmalı.
    const picture = document.querySelector(".product-grid .product-slider picture");
    expect(picture).not.toBeNull();
    expect(picture?.querySelector('source[type="image/avif"]')).not.toBeNull();
    expect(picture?.querySelector("img")?.getAttribute("srcset")).toContain("w384-384.webp");
  });

  it("(a) tavan aşılırsa ham basar, manifest gelince yerinde terfi eder", async () => {
    vi.useFakeTimers();
    // Manifest yanıtı ancak bizim serbest bırakmamızla çözülür (yavaş uç).
    let yanitiSal: (() => void) | undefined;
    const gecikme = new Promise<void>((resolve) => {
      yanitiSal = resolve;
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        await gecikme;
        return {
          ok: true,
          status: 200,
          json: async () => manifestGovdesi(),
        } as unknown as Response;
      })
    );

    const render = rerenderProductGrid([KART]);
    // Tavana kadar hiçbir şey basılmamış olabilir; tavan dolunca ham basılır.
    await vi.advanceTimersByTimeAsync(MANIFEST_FIRST_PAINT_WAIT_MS + 10);
    await render;

    const hamImg = document.querySelector<HTMLImageElement>(".product-grid .product-slider img");
    expect(hamImg).not.toBeNull();
    expect(document.querySelector(".product-grid picture")).toBeNull();
    expect(hamImg!.getAttribute("src")).toBe("/files/urun.jpg");

    // Manifest sonunda gelir → basılı kart YERİNDE terfi eder.
    yanitiSal!();
    await vi.runAllTimersAsync();

    const picture = document.querySelector(".product-grid .product-slider picture");
    expect(picture).not.toBeNull();
    expect(picture?.querySelector("img")?.getAttribute("srcset")).toContain("w384-384.webp");
  });

  it("sıcak önbellekte beklemez: ikinci render tek istekle anında `<picture>` basar", async () => {
    const sahte = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => manifestGovdesi(),
    }) as unknown as Response);
    vi.stubGlobal("fetch", sahte);

    await rerenderProductGrid([KART]);
    expect(sahte).toHaveBeenCalledTimes(1);

    // İkinci render (filtre değişimi) — önbellek sıcak, yeni istek YOK.
    await rerenderProductGrid([KART]);
    expect(sahte).toHaveBeenCalledTimes(1);
    expect(document.querySelector(".product-grid .product-slider picture")).not.toBeNull();
  });

  it("bekleme sırasında yeni render başlarsa bayat set basılmaz", async () => {
    vi.useFakeTimers();
    let yanitiSal: (() => void) | undefined;
    const gecikme = new Promise<void>((resolve) => {
      yanitiSal = resolve;
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        await gecikme;
        return {
          ok: true,
          status: 200,
          json: async () => manifestGovdesi(),
        } as unknown as Response;
      })
    );

    const eskiKart: ProductListingCard = { ...KART, id: "LST-9999", name: "Bayat Ürün" };
    const eskiRender = rerenderProductGrid([eskiKart]);
    // Eski render tavanını beklerken kullanıcı filtre değiştirir.
    const yeniRender = rerenderProductGrid([KART]);

    await vi.advanceTimersByTimeAsync(MANIFEST_FIRST_PAINT_WAIT_MS + 10);
    yanitiSal!();
    await vi.runAllTimersAsync();
    await Promise.all([eskiRender, yeniRender]);

    // Izgarada YALNIZ yeni set var; bayat set üstüne yazmadı.
    expect(document.querySelector('[data-slider-id="LST-9999"]')).toBeNull();
    expect(document.querySelector('[data-slider-id="LST-0001"]')).not.toBeNull();
  });

  it("boş ürün listesinde beklemeden 'sonuç yok' basar", async () => {
    const sahte = vi.fn();
    vi.stubGlobal("fetch", sahte);

    await rerenderProductGrid([]);

    expect(document.querySelector(".product-grid")?.innerHTML).not.toBe("");
    expect(sahte).not.toHaveBeenCalled();
  });
});
