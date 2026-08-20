import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Gerçek XHR network isteği happy-dom'da tamamlanmaz — kendi sahte
// XMLHttpRequest'imizle "load" event'ini senkron simüle ediyoruz. Asıl amaç:
// compress:false verildiğinde prepareMedia'nın HİÇ çağrılmadığını ve ağa giden
// FormData'daki dosyanın orijinal (küçültülmemiş) olduğunu doğrulamak — KYC/KYB
// gibi kimlik/evrak yüklemelerinin sıkıştırmadan muaf kalması gerekiyor.
const prepareMediaMock = vi.hoisted(() => vi.fn());
vi.mock("../media/compress", () => ({
  prepareMedia: prepareMediaMock,
}));

import { uploadFiles } from "./uploader";

class FakeXHR {
  status = 200;
  responseText = "{}";
  withCredentials = false;
  sentBody: FormData | null = null;
  private listeners: Record<string, Array<() => void>> = {};
  upload = { addEventListener: (): void => {} };

  open(): void {}
  setRequestHeader(): void {}
  addEventListener(ev: string, cb: () => void): void {
    (this.listeners[ev] ??= []).push(cb);
  }
  send(body: FormData): void {
    this.sentBody = body;
    queueMicrotask(() => this.listeners.load?.forEach((cb) => cb()));
  }
}

describe("uploadFiles — compress opt-out (KYC/KYB kimlik/evrak muafiyeti)", () => {
  const originalXHR = globalThis.XMLHttpRequest;

  beforeEach(() => {
    prepareMediaMock.mockReset();
  });

  afterEach(() => {
    globalThis.XMLHttpRequest = originalXHR;
  });

  it("compress verilmezse (default true) prepareMedia çağrılır", async () => {
    globalThis.XMLHttpRequest = FakeXHR as unknown as typeof XMLHttpRequest;
    prepareMediaMock.mockResolvedValue({
      blob: new Blob(["kucuk"], { type: "image/webp" }),
      name: "foto.webp",
      converted: "webp",
    });
    const file = new File([new Uint8Array(10)], "foto.jpg", { type: "image/jpeg" });

    await uploadFiles({
      files: [file],
      endpoint: "/api/method/upload_file",
      successHoldMs: 0,
    });

    expect(prepareMediaMock).toHaveBeenCalledTimes(1);
  });

  it("[NFR-024] compress:false verilirse prepareMedia hiç çağrılmaz, orijinal dosya ağa gider", async () => {
    const created: FakeXHR[] = [];
    class CapturingXHR extends FakeXHR {
      constructor() {
        super();
        created.push(this);
      }
    }
    globalThis.XMLHttpRequest = CapturingXHR as unknown as typeof XMLHttpRequest;

    const file = new File([new Uint8Array(10)], "kimlik.jpg", { type: "image/jpeg" });

    await uploadFiles({
      files: [file],
      endpoint: "/api/method/upload_file",
      compress: false,
      successHoldMs: 0,
    });

    expect(prepareMediaMock).not.toHaveBeenCalled();
    const sentFile = created[0]?.sentBody?.get("file") as File;
    expect(sentFile).toBeInstanceOf(File);
    expect(sentFile.name).toBe("kimlik.jpg");
    expect(sentFile.size).toBe(file.size);
  });
});
