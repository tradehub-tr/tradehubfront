/**
 * W7 — hlsVideo köprüsünün sözleşmesi.
 *
 *   ÖLÇÜLDÜ  — URL sınıflandırması, kaynak-bağlama KARARI (yerli / hls.js /
 *              progresif), yükleyici gelmediğinde düşüş, yarış iptali,
 *              hydrate işaretleme ve hls.js'in YALNIZ dinamik import ile
 *              anıldığı (kaynak okuma).
 *   ÖLÇÜLMEDİ — gerçek hls.js'in MSE üzerinde oynatması (happy-dom'da MSE
 *              yok; canlı tarayıcı ister).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  attachVideoSource,
  canPlayNativeHls,
  detachHlsEngine,
  hydrateHlsVideos,
  isHlsUrl,
} from "./hlsVideo";
import type { HlsLoader } from "./hlsVideo";

function makeVideo(native = false): HTMLVideoElement {
  const video = document.createElement("video");
  Object.defineProperty(video, "canPlayType", {
    value: (type: string) =>
      native && type === "application/vnd.apple.mpegurl" ? "maybe" : "",
  });
  return video;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- sahte Hls motoru: gerçek tip MSE ister */
function makeFakeHls() {
  const calls: Array<[string, unknown?]> = [];
  class FakeHls {
    static Events = { ERROR: "hlsError" } as any;
    static ErrorTypes = { MEDIA_ERROR: "mediaError", NETWORK_ERROR: "networkError" } as any;
    static isSupported() {
      return true;
    }
    static last: any;
    handlers: Record<string, (e: string, d: unknown) => void> = {};
    constructor() {
      FakeHls.last = this;
    }
    on(evt: string, cb: (e: string, d: unknown) => void) {
      this.handlers[evt] = cb;
    }
    emit(data: unknown) {
      this.handlers["hlsError"]?.("hlsError", data);
    }
    loadSource(url: string) {
      calls.push(["loadSource", url]);
    }
    attachMedia(el: unknown) {
      calls.push(["attachMedia", el]);
    }
    recoverMediaError() {
      calls.push(["recoverMediaError"]);
    }
    destroy() {
      calls.push(["destroy"]);
    }
  }
  const loader: HlsLoader = async () => FakeHls as any;
  return { FakeHls, calls, loader };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

describe("isHlsUrl", () => {
  it("m3u8'i sorgu/parça payıyla birlikte tanır", () => {
    expect(isHlsUrl("/files/v.m3u8")).toBe(true);
    expect(isHlsUrl("/files/v.M3U8")).toBe(true);
    expect(isHlsUrl("/files/v.m3u8?token=1")).toBe(true);
    expect(isHlsUrl("/files/v.m3u8#t=1")).toBe(true);
  });

  it("progresif dosyaları HLS saymaz", () => {
    expect(isHlsUrl("/files/v.mp4")).toBe(false);
    expect(isHlsUrl("/files/vm3u8.mp4")).toBe(false);
    expect(isHlsUrl("")).toBe(false);
  });
});

describe("attachVideoSource — karar", () => {
  it("HLS olmayan URL düz src olur, motor yükleyici HİÇ çağrılmaz", async () => {
    const video = makeVideo();
    const loader = vi.fn();
    await attachVideoSource(video, "/files/v.mp4", loader as unknown as HlsLoader);
    expect(video.getAttribute("src")).toBe("/files/v.mp4");
    expect(loader).not.toHaveBeenCalled();
  });

  it("yerli HLS çözen tarayıcıda m3u8 de düz src olur — hls.js indirilmez", async () => {
    const video = makeVideo(true);
    const loader = vi.fn();
    await attachVideoSource(video, "/files/v.m3u8", loader as unknown as HlsLoader);
    expect(video.getAttribute("src")).toBe("/files/v.m3u8");
    expect(loader).not.toHaveBeenCalled();
    expect(canPlayNativeHls(video)).toBe(true);
  });

  it("yerli destek yoksa motor yüklenir ve manifest videoya bağlanır", async () => {
    // VACUITY hedefi: karar "her zaman düz src"ye bozulursa bu test kırmızı.
    const video = makeVideo(false);
    const { calls, loader } = makeFakeHls();
    await attachVideoSource(video, "/files/v.m3u8", loader);
    expect(video.getAttribute("src")).toBeNull();
    expect(calls).toEqual([
      ["loadSource", "/files/v.m3u8"],
      ["attachMedia", video],
    ]);
  });

  it("motor gelmezse (MSE yok) URL yine src'ye yazılır — hata yolu tarayıcının", async () => {
    const video = makeVideo(false);
    await attachVideoSource(video, "/files/v.m3u8", async () => null);
    expect(video.getAttribute("src")).toBe("/files/v.m3u8");
  });

  it("boş URL kaynağı temizler", async () => {
    const video = makeVideo();
    video.src = "/files/eski.mp4";
    await attachVideoSource(video, "", vi.fn() as unknown as HlsLoader);
    expect(video.getAttribute("src")).toBeNull();
  });

  it("import beklerken yeni kaynak gelirse eski bağlanma sessizce atılır", async () => {
    const video = makeVideo(false);
    const { FakeHls, calls } = makeFakeHls();
    let release!: () => void;
    const slow: HlsLoader = () =>
      new Promise((resolve) => {
        release = () => resolve(FakeHls as unknown as Awaited<ReturnType<HlsLoader>>);
      });
    const first = attachVideoSource(video, "/files/eski.m3u8", slow);
    await attachVideoSource(video, "/files/yeni.mp4", vi.fn() as unknown as HlsLoader);
    release();
    await first;
    // Eski m3u8 hiç bağlanmadı; yeni progresif kaynak duruyor.
    expect(calls).toEqual([]);
    expect(video.getAttribute("src")).toBe("/files/yeni.mp4");
  });

  it("ölümcül medya hatasında BİR kez toparlanır, diğer ölümcüllerde motor kapanır", async () => {
    const video = makeVideo(false);
    const { FakeHls, calls, loader } = makeFakeHls();
    await attachVideoSource(video, "/files/v.m3u8", loader);

    FakeHls.last.emit({ fatal: false, type: "networkError" });
    expect(calls.filter(([n]) => n === "destroy")).toHaveLength(0);

    FakeHls.last.emit({ fatal: true, type: "mediaError" });
    expect(calls.filter(([n]) => n === "recoverMediaError")).toHaveLength(1);

    FakeHls.last.emit({ fatal: true, type: "mediaError" });
    expect(calls.filter(([n]) => n === "destroy")).toHaveLength(1);
  });

  it("detachHlsEngine motoru söker", async () => {
    const video = makeVideo(false);
    const { calls, loader } = makeFakeHls();
    await attachVideoSource(video, "/files/v.m3u8", loader);
    detachHlsEngine(video);
    expect(calls.filter(([n]) => n === "destroy")).toHaveLength(1);
  });
});

describe("hydrateHlsVideos", () => {
  it("data-hls-src taşıyan videoları bir kez bağlar", async () => {
    const root = document.createElement("div");
    root.innerHTML = `
      <video data-hls-src="/files/a.m3u8"></video>
      <video src="/files/b.mp4"></video>
    `;
    const { calls, loader } = makeFakeHls();
    const target = root.querySelector<HTMLVideoElement>("video[data-hls-src]")!;
    Object.defineProperty(target, "canPlayType", { value: () => "" });

    hydrateHlsVideos(root, loader);
    await Promise.resolve();
    await Promise.resolve();

    expect(target.dataset.hlsBound).toBe("1");
    expect(calls.filter(([n]) => n === "loadSource")).toHaveLength(1);

    // İkinci hydrate aynı videoyu YENİDEN bağlamaz.
    hydrateHlsVideos(root, loader);
    await Promise.resolve();
    expect(calls.filter(([n]) => n === "loadSource")).toHaveLength(1);
  });
});

describe("paket sözleşmesi", () => {
  it("hls.js YALNIZ dinamik import ile anılır — statik import yasak", () => {
    // happy-dom'da import.meta.url file: şeması taşımıyor — cwd proje kökü.
    const source = readFileSync(resolve(process.cwd(), "src/utils/hlsVideo.ts"), "utf8");
    expect(source).toMatch(/import\("hls\.js"\)/);
    // Tip importu serbest (derlemede silinir) — DEĞER importu yakalanmalı.
    expect(source).not.toMatch(/^import\s+(?!type\b)[^"']*from\s+["']hls\.js["']/m);
    expect(source).toMatch(/import type .* from "hls\.js"/);
  });
});
