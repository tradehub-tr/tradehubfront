import { describe, expect, it } from "vitest";

import {
  STORE_IMAGE_SIZES,
  coverBandSizes,
  storeImageFocal,
  storeImgAttrs,
  storeImgPosition,
  storeImgSrc,
  storeImgSrcset,
  toStoreImageMedia,
} from "./storeImage";

const LOGO = {
  src: "/files/media/a/v/w256-256.webp",
  srcset:
    "/files/media/a/v/w64-64.webp 64w, /files/media/a/v/w128-128.webp 128w, /files/media/a/v/w256-256.webp 256w",
  width: 256,
  height: 256,
};

describe("toStoreImageMedia", () => {
  it("geçerli gövdeyi kabul eder", () => {
    expect(toStoreImageMedia(LOGO)).toEqual(LOGO);
  });

  it("srcset ya da src yoksa null (ham adrese düşülür)", () => {
    expect(toStoreImageMedia(null)).toBeNull();
    expect(toStoreImageMedia({ src: "/x.webp", srcset: "" })).toBeNull();
    expect(toStoreImageMedia({ srcset: "/x.webp 64w" })).toBeNull();
    expect(toStoreImageMedia("nope")).toBeNull();
  });
});

describe("storeImgAttrs", () => {
  it("türev varsa srcset + yerleşime göre sizes + WebP src basar", () => {
    const attrs = storeImgAttrs(LOGO, "/files/0a/logo.png", "productSellerPanelLogo");
    expect(attrs).toContain('srcset="/files/media/a/v/w64-64.webp 64w');
    expect(attrs).toContain(`sizes="${STORE_IMAGE_SIZES.productSellerPanelLogo}"`);
    expect(attrs).toContain('src="/files/media/a/v/w256-256.webp"');
    expect(attrs).not.toContain("logo.png");
    // srcset/sizes src'den önce yazılır — kaynak seçimi tek geçişte.
    expect(attrs.indexOf("srcset=")).toBeLessThan(attrs.indexOf(" src="));
  });

  it("türev yoksa yalnız ham adres (bugünkü davranış)", () => {
    expect(storeImgAttrs(null, "/files/0a/logo.png", "productSupplierLogo")).toBe(
      ' src="/files/0a/logo.png"'
    );
  });

  it("serbest sizes verilebilir", () => {
    expect(storeImgAttrs(LOGO, "", { sizes: "12px" })).toContain('sizes="12px"');
  });

  it("zararlı adresler temizlenir", () => {
    const kotu = {
      ...LOGO,
      src: "javascript:alert(1)",
      srcset: "javascript:alert(1) 64w, /ok.webp 128w",
    };
    const attrs = storeImgAttrs(kotu, "", "favoritesLogo");
    expect(attrs).not.toContain("javascript:");
    expect(attrs).toContain("/ok.webp 128w");
  });

  it("öznitelik kaçışı yapılır", () => {
    const attrs = storeImgAttrs(null, '/files/a"b.png', "favoritesLogo");
    expect(attrs).not.toContain('a"b');
  });
});

describe("storeImgSrcset / storeImgSrc", () => {
  it("türev yoksa srcset null, src ham adres", () => {
    expect(storeImgSrcset(undefined)).toBeNull();
    expect(storeImgSrc(undefined, "/files/x.png")).toBe("/files/x.png");
  });

  it("türev varsa WebP", () => {
    expect(storeImgSrcset(LOGO)).toContain("128w");
    expect(storeImgSrc(LOGO, "/files/x.png")).toBe(LOGO.src);
  });
});

describe("coverBandSizes", () => {
  it("oran bilinmiyorsa 100vw", () => {
    expect(coverBandSizes(null)).toBe("100vw");
  });

  it("dar ekranda yükseklik × oran 100vw'yi aşabilir", () => {
    const s = coverBandSizes({ src: "/a.webp", srcset: "/a.webp 1920w", width: 1920, height: 720 });
    // 180 px bant × 2,667 = 480 CSS px
    expect(s).toContain("max(100vw, 480px)");
    expect(s).toContain("(min-width: 768px) max(100vw, 1067px)");
  });
});

describe("odak noktası (2026-10-01)", () => {
  const WITH_FOCAL = { ...LOGO, focal: { x: 0.78, y: 0.45 } };
  const FOCAL_ONLY = { src: "/files/c2/a.webp", srcset: "", width: 0, height: 0, focal: { x: 0.78, y: 0.45 } };

  it("storeImageFocal doğrular, kelepçeler, yoksa null", () => {
    expect(storeImageFocal(WITH_FOCAL)).toEqual({ x: 0.78, y: 0.45 });
    expect(storeImageFocal({ focal: { x: 2, y: -1 } })).toEqual({ x: 1, y: 0 });
    expect(storeImageFocal({ focal: { x: "a", y: 0.5 } })).toBeNull();
    expect(storeImageFocal(LOGO)).toBeNull();
    expect(storeImageFocal(null)).toBeNull();
  });

  it("null / boş dize odak üretmez ('0% 0%' değil)", () => {
    expect(storeImageFocal({ focal: { x: null, y: null } })).toBeNull();
    expect(storeImageFocal({ focal: { x: "", y: " " } })).toBeNull();
    expect(storeImageFocal({ focal: { x: 0.5 } })).toBeNull();
    expect(storeImgPosition({ focal: { x: null, y: null } })).toBeNull();
    expect(storeImgAttrs({ ...LOGO, focal: { x: "", y: "" } }, "/x.png", "galleryMain")).not.toContain("style=");
  });

  it("toStoreImageMedia yalnız odak gövdesinde odağı korur, srcset'siz", () => {
    expect(toStoreImageMedia(FOCAL_ONLY)).toEqual({
      src: "/files/c2/a.webp", srcset: "", width: 0, height: 0, focal: { x: 0.78, y: 0.45 },
    });
    expect(storeImgSrcset(FOCAL_ONLY)).toBeNull();
    expect(storeImgSrc(FOCAL_ONLY, "/raw.png")).toBe("/files/c2/a.webp");
    expect(toStoreImageMedia({ src: "/x.webp", srcset: "" })).toBeNull();
  });

  it("storeImgPosition kayan nokta artığı bırakmaz", () => {
    expect(storeImgPosition(WITH_FOCAL)).toBe("78% 45%");
    expect(storeImgPosition({ focal: { x: 0.123, y: 1 } })).toBe("12.3% 100%");
    expect(storeImgPosition(LOGO)).toBeNull();
  });

  it("türevli gövdede srcset + object-position", () => {
    const html = storeImgAttrs(WITH_FOCAL, "/files/raw.png", "galleryMain");
    expect(html).toContain('srcset="');
    expect(html).toContain(' style="object-position:78% 45%"');
  });

  it("yalnız odak gövdesi: ham adres + object-position, srcset yok", () => {
    const html = storeImgAttrs(FOCAL_ONLY, "/files/c2/a.webp", "galleryMain");
    expect(html).toContain('src="/files/c2/a.webp"');
    expect(html).toContain(' style="object-position:78% 45%"');
    expect(html).not.toContain("srcset");
  });

  it("odak yoksa style yazılmaz (bugünkü davranış)", () => {
    expect(storeImgAttrs(LOGO, "/x.png", "favoritesLogo")).not.toContain("style=");
    expect(storeImgAttrs(null, "/x.png", "favoritesLogo")).not.toContain("style=");
  });

  it("STORE_IMAGE_SIZES değerleri değişmedi (beşi üretilmiş dosyadan geliyor)", () => {
    expect(STORE_IMAGE_SIZES).toMatchObject({
      galleryMain: "(min-width: 768px) 500px, 100vw",
      galleryThumb: "120px",
      manufacturerGallery: "(min-width: 1024px) 220px, 165px",
      shopHeaderLogoDesktop: "140px",
      shopHeaderLogoMobile: "48px",
      productSellerPanelLogo: "30px",
      brandOwnerLogo: "16px",
    });
  });
});
