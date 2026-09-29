/**
 * Backend hatası kullanıcıya METİN olarak ulaşır — "[object Object]" asla.
 *
 * MOGEM-685 bulgu 15 (29 Eyl 2026, gerçek HTTP ile ölçüldü): olmayan bir sevkiyat için
 * `shipment.get_shipment_detail` HTTP 404 + `{"message": {"ok": false, "error": {"code":
 * "NOT_FOUND", "message": "Sevkiyat bulunamadı: X"}}}` döner. `extractFrappeError` `message`
 * alanını düz metin sanıp nesneyi döndürüyordu; sevkiyat takibi ekranında "[object Object]".
 * Aynı zarf tüm v1 lojistik uçlarında var — kusur ortak yardımcıdaydı.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import { callMethod } from "../api";

function yanit(status: number, govde: unknown): Response {
  const raw = JSON.stringify(govde);
  return {
    ok: status < 400,
    status,
    headers: new Headers(),
    json: async () => govde,
    text: async () => raw,
  } as unknown as Response;
}

async function hataMetni(status: number, govde: unknown): Promise<string> {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(yanit(status, govde)));
  try {
    await callMethod("tradehub_core.api.v1.shipment.get_shipment_detail", { name: "X" });
  } catch (e) {
    return (e as Error).message;
  }
  throw new Error("callMethod hata fırlatmadı");
}

describe("callMethod hata metni", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("v1 zarfındaki hata mesajını verir (404 — ölçülen gerçek yanıt)", async () => {
    const metin = await hataMetni(404, {
      message: { ok: false, error: { code: "NOT_FOUND", message: "Sevkiyat bulunamadı: X" } },
    });
    expect(metin).toBe("Sevkiyat bulunamadı: X");
  });

  it("düz metin message yine aynen gelir", async () => {
    expect(await hataMetni(500, { message: "Sunucu hatası" })).toBe("Sunucu hatası");
  });

  it("_server_messages önceliği korunur", async () => {
    const metin = await hataMetni(417, {
      _server_messages: JSON.stringify([JSON.stringify({ message: "Doğrulama hatası" })]),
      message: { ok: false, error: { message: "zarf" } },
    });
    expect(metin).toBe("Doğrulama hatası");
  });

  it("tanınmayan nesnede '[object Object]' değil HTTP kodu döner", async () => {
    const metin = await hataMetni(404, { message: { beklenmedik: true } });
    expect(metin).not.toContain("[object");
    expect(metin).toBe("HTTP 404");
  });
});
