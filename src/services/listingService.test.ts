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
