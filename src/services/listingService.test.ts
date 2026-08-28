/**
 * Task 8 (2026-08-26 medya-video-seo) — `mapListingDetail` galeri görsel
 * eşlemesi artık `imageMeta` üzerinden video posteri/altyazısı/süresini de
 * taşıyor (Task 6 Listing API alanları: `poster`, `durationSec`,
 * `captionsUrl`). Amaç: vitrindeki `<video>` slaytı poster + `<track
 * kind="captions">` basabilsin.
 */
import { describe, expect, it } from "vitest";
import { mapListingDetail } from "./listingService";

describe("mapListingDetail — video görsel künyesi (Task 8)", () => {
  it("galeri slaytına imageMeta'dan poster/süre/altyazı taşınır", () => {
    const detail = mapListingDetail({
      title: "X",
      images: ["/files/v.webm"],
      imageMeta: [{ alt: "video", poster: "/files/p.jpg", durationSec: 30, captionsUrl: "/files/c.vtt" }],
    });

    expect(detail.images[0].poster).toBe("/files/p.jpg");
    expect(detail.images[0].captionsUrl).toBe("/files/c.vtt");
    expect(detail.images[0].durationSec).toBe(30);
  });

  it("imageMeta boş/eksikse video görsele poster/altyazı BASILMAZ (yanlış değer eksikten kötü)", () => {
    const detail = mapListingDetail({
      title: "X",
      images: ["/files/v.webm"],
      imageMeta: [{ alt: "video" }],
    });

    expect(detail.images[0].poster).toBeUndefined();
    expect(detail.images[0].captionsUrl).toBeUndefined();
    expect(detail.images[0].durationSec).toBeUndefined();
  });

  it("promo video slaytı (video-main) captionsUrl'u raw.videoCaptionsUrl'dan alır", () => {
    const detail = mapListingDetail({
      title: "X",
      images: [],
      videoUrl: "/files/promo.mp4",
      videoPoster: "/files/promo-poster.jpg",
      videoCaptionsUrl: "/files/promo.vtt",
    });

    const promo = detail.images.find((img) => img.id === "video-main");
    expect(promo?.poster).toBe("/files/promo-poster.jpg");
    expect(promo?.captionsUrl).toBe("/files/promo.vtt");
  });

  it("promo video slaytı için boş/whitespace captionsUrl basılmaz", () => {
    const detail = mapListingDetail({
      title: "X",
      images: [],
      videoUrl: "/files/promo.mp4",
      videoCaptionsUrl: "   ",
    });

    const promo = detail.images.find((img) => img.id === "video-main");
    expect(promo?.captionsUrl).toBeUndefined();
  });
});

describe("mapListingDetail — videoWatchUrl eşlemesi (Task 4, medya-watch-page)", () => {
  it("raw.videoWatchUrl doluysa detail.videoWatchUrl'a taşınır", () => {
    const detail = mapListingDetail({
      title: "X",
      images: [],
      videoUrl: "/files/promo.mp4",
      videoWatchUrl: "/medya/v/yeni-urun-tanitimi",
    });

    expect(detail.videoWatchUrl).toBe("/medya/v/yeni-urun-tanitimi");
  });

  it("raw.videoWatchUrl yoksa/boşsa detail.videoWatchUrl undefined kalır (yanlış link basmaktansa hiç basmamak)", () => {
    const detail = mapListingDetail({
      title: "X",
      images: [],
      videoUrl: "/files/promo.mp4",
    });
    expect(detail.videoWatchUrl).toBeUndefined();

    const detailBos = mapListingDetail({
      title: "X",
      images: [],
      videoUrl: "/files/promo.mp4",
      videoWatchUrl: "   ",
    });
    expect(detailBos.videoWatchUrl).toBeUndefined();
  });
});

describe("mapListingDetail — documents eşlemesi (Task 5, dosya-yöneticisi-seo)", () => {
  it("raw.documents doluysa url/title/docType/language/sizeBytes birebir taşınır", () => {
    const detail = mapListingDetail({
      title: "X",
      images: [],
      documents: [
        { url: "/files/katalog.pdf", title: "Ürün Kataloğu", docType: "Katalog", language: "tr", sizeBytes: 204800 },
      ],
    });

    expect(detail.documents).toEqual([
      { url: "/files/katalog.pdf", title: "Ürün Kataloğu", docType: "Katalog", language: "tr", sizeBytes: 204800 },
    ]);
  });

  it("raw.documents yoksa/dizi değilse detail.documents boş dizi kalır (anahtar hiç basılmıyor)", () => {
    const detail = mapListingDetail({ title: "X", images: [] });
    expect(detail.documents).toEqual([]);

    const detailYanlisTip = mapListingDetail({ title: "X", images: [], documents: "not-an-array" });
    expect(detailYanlisTip.documents).toEqual([]);
  });

  it("url'siz/boş-url'li satır elenir, diğer alanlar eksikse boş dizgeye düşer", () => {
    const detail = mapListingDetail({
      title: "X",
      images: [],
      documents: [{ title: "Adressiz belge" }, { url: "  " }, { url: "/files/gecerli.docx" }],
    });

    expect(detail.documents).toEqual([
      { url: "/files/gecerli.docx", title: "", docType: "", language: "", sizeBytes: 0 },
    ]);
  });
});
