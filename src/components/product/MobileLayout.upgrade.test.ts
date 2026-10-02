/**
 * Mobil galeri manifestle yükseltilir (2026-09-30): slayt `sizes="100vw"`,
 * karo `sizes="49px"` — ham master (1000–2000 px) artık indirilmez.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearMediaManifestCache, seedMediaManifest } from "../../lib/media/manifest";
import { upgradeMobileGalleryMedia } from "./MobileLayout";

vi.mock("../../alpine/product", () => ({ getCurrentProduct: () => ({ id: "LST-0001" }) }));
vi.mock("../../i18n", () => ({ t: (anahtar: string) => anahtar }));

const SRCSET =
  "/files/media/a/v/w192-192.webp 192w, /files/media/a/v/w384-384.webp 384w, " +
  "/files/media/a/v/w768-768.webp 768w, /files/media/a/v/w1280-1280.webp 1280w, /files/urun.webp 1800w";

function tohumla() {
  seedMediaManifest("LST-0001", {
    listing: "LST-0001",
    slot: "product.image",
    enabled: true,
    fallback: "/files/media/a/v/w768-768.webp",
    suppressed: 0,
    images: [
      {
        file_url: "/files/urun.webp",
        alt_text: "Ürün",
        primary: true,
        asset: "MA-1",
        manifest: {
          slot_key: "product.image",
          src: "/files/media/a/v/w768-768.webp",
          sizes: "",
          alt: "Ürün",
          loading: "lazy",
          decoding: "async",
          fetchpriority: "",
          width: 1800,
          height: 1800,
          aspect_ratio: 1,
          sources: [{ type: "image/webp", srcset: SRCSET, sizes: "" }],
        },
      },
    ],
  });
}

describe("upgradeMobileGalleryMedia", () => {
  beforeEach(() => {
    clearMediaManifestCache();
    document.body.innerHTML = `
      <div id="pdm-gallery-track"><img class="w-full h-full object-contain select-none" src="/files/urun.webp" alt="Ürün" width="800" height="800" loading="eager" draggable="false"></div>
      <div id="pdm-thumb-strip"><img class="w-full h-full object-cover" src="/files/urun.webp" alt="Ürün" width="80" height="80" loading="lazy"></div>`;
  });

  it("manifest yokken dokunmaz", () => {
    expect(upgradeMobileGalleryMedia()).toBe(0);
    expect(document.querySelector("#pdm-gallery-track img")!.hasAttribute("srcset")).toBe(false);
  });

  it("slaytı 100vw, karoyu 49px sizes ile srcset'e çevirir; ikinci çağrı no-op", () => {
    tohumla();
    expect(upgradeMobileGalleryMedia()).toBe(2);
    const slayt = document.querySelector<HTMLImageElement>("#pdm-gallery-track img")!;
    const karo = document.querySelector<HTMLImageElement>("#pdm-thumb-strip img")!;
    expect(slayt.getAttribute("sizes")).toBe("100vw");
    expect(karo.getAttribute("sizes")).toBe("49px");
    expect(slayt.getAttribute("srcset")).toContain("1800w");
    expect(karo.getAttribute("srcset")).toContain("w192-192.webp 192w");
    expect(upgradeMobileGalleryMedia()).toBe(0);
  });
});
