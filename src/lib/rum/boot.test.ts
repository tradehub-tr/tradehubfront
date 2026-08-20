/**
 * T-123 — `boot.ts` çift-başlatma koruması testleri.
 *
 * Koruma iki katmanlı: `startRum` modül-tekil idempotent (index.js) +
 * `globalThis.__tradehubRumBooted` bayrağı (boot.ts, chunk kopyalarına
 * karşı). Burada boot katmanı test edilir; `startRum` mock'lanır ki test
 * gerçek toplayıcı/`web-vitals` yüklemesin.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const startRumMock = vi.fn(() => ({
  stop: () => Promise.resolve("empty"),
  flush: () => Promise.resolve("empty"),
  isSampled: () => false,
}));

vi.mock("./index.js", () => ({ startRum: startRumMock }));

const BAYRAK = "__tradehubRumBooted";

type RumGlobal = typeof globalThis & { [BAYRAK]?: boolean };

function bayragiSil(): void {
  delete (globalThis as RumGlobal)[BAYRAK];
}

beforeEach(() => {
  bayragiSil();
  startRumMock.mockClear();
  vi.resetModules(); // her test taze modül örneği alsın
});

afterEach(() => {
  bayragiSil();
});

describe("bootRum çift-başlatma koruması", () => {
  it("modül import edilince toplayıcıyı %10 örneklemle bir kez başlatır", async () => {
    await import("./boot.js");
    expect(startRumMock).toHaveBeenCalledTimes(1);
    expect(startRumMock).toHaveBeenCalledWith({ sampleRate: 0.1 });
    expect((globalThis as RumGlobal)[BAYRAK]).toBe(true);
  });

  it("ikinci bootRum çağrısı hiçbir şey başlatmaz ve null döner", async () => {
    const { bootRum } = await import("./boot.js");
    // import zaten 1 kez başlattı
    expect(startRumMock).toHaveBeenCalledTimes(1);
    expect(bootRum()).toBeNull();
    expect(bootRum()).toBeNull();
    expect(startRumMock).toHaveBeenCalledTimes(1);
  });

  it("modül iki ayrı örnek olarak yüklense de (chunk kopyası) tek kayıt olur", async () => {
    await import("./boot.js");
    vi.resetModules(); // aynı sayfada ikinci chunk'taki kopyayı taklit et
    await import("./boot.js");
    expect(startRumMock).toHaveBeenCalledTimes(1);
  });

  it("bayrak yoksa bootRum tutamacı döndürür ve bayrağı diker", async () => {
    const { bootRum } = await import("./boot.js");
    bayragiSil();
    startRumMock.mockClear();
    const tutamac = bootRum();
    expect(tutamac).not.toBeNull();
    expect(startRumMock).toHaveBeenCalledTimes(1);
    expect((globalThis as RumGlobal)[BAYRAK]).toBe(true);
  });
});
