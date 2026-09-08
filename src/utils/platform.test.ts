/**
 * isIosApp() — App Store uyum bayrağının sinyal sözleşmesi (FE-1, AC-1).
 *
 * İki sinyal OR'lanır:
 *   1. Capacitor bridge → getPlatform() === "ios"
 *   2. UA işareti "istocApp/ios" (capacitor.config.ts ios.appendUserAgent)
 *
 * QA bulgusu: iOS gating'in birim regresyon bekçisi yoktu — Playwright bu
 * ortamda koşamıyor. Bu dosya UA-override yolunu vitest'te sabitler.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

const bridge = vi.hoisted(() => ({ platform: "web", throws: false }));

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    getPlatform: () => {
      if (bridge.throws) throw new Error("bridge yok");
      return bridge.platform;
    },
  },
}));

import { isIosApp } from "./platform";

const IOS_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) istocApp/ios";
const WEB_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15";

afterEach(() => {
  vi.unstubAllGlobals();
  bridge.platform = "web";
  bridge.throws = false;
});

describe("isIosApp — bridge + UA-override sinyalleri", () => {
  it("web UA + web bridge → false (varsayılan web modu)", () => {
    vi.stubGlobal("navigator", { userAgent: WEB_UA });
    expect(isIosApp()).toBe(false);
  });

  it("UA 'istocApp/ios' işaretli → true (bridge 'web' dese bile)", () => {
    vi.stubGlobal("navigator", { userAgent: IOS_UA });
    expect(isIosApp()).toBe(true);
  });

  it("Capacitor bridge 'ios' → true (UA işareti olmadan)", () => {
    bridge.platform = "ios";
    vi.stubGlobal("navigator", { userAgent: WEB_UA });
    expect(isIosApp()).toBe(true);
  });

  it("bridge çökerse UA fallback'i devreye girer (webview senaryosu)", () => {
    bridge.throws = true;
    vi.stubGlobal("navigator", { userAgent: IOS_UA });
    expect(isIosApp()).toBe(true);
  });

  it("bridge çöker + web UA → false (web satış yüzeyi korunur)", () => {
    bridge.throws = true;
    vi.stubGlobal("navigator", { userAgent: WEB_UA });
    expect(isIosApp()).toBe(false);
  });
});
