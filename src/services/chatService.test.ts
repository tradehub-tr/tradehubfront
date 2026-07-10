import { beforeEach, describe, expect, it, vi } from "vitest";

const callMethod = vi.fn();

vi.mock("../utils/api", () => ({
  callMethod: (...args: unknown[]) => callMethod(...args),
  clearCsrfCache: vi.fn(),
  fetchCsrfToken: vi.fn(async () => "tok"),
}));

vi.mock("../i18n", () => ({ t: (k: string) => k }));

import { getMessages, pinnedFromProductRef, sendTextMessage } from "./chatService";

const pinned = {
  id: "LST-00201",
  title: "Corset Leather With Skirt",
  price: "₺332,19-371,27",
  minOrder: "10",
  thumbnail: "",
};

const MARKER = "[Ürün #LST-00201] Corset Leather With Skirt • ₺332,19-371,27 • Min. Sipariş: 10\n";

describe("chatService — ürün marker'ı", () => {
  beforeEach(() => callMethod.mockReset());

  it("sendTextMessage pinnedProduct'ı content başına marker olarak gömer", async () => {
    callMethod.mockResolvedValue({ message: { id: 1, content: MARKER + "Toplu alım indirimi var mı?" } });
    const msg = await sendTextMessage("7", "Toplu alım indirimi var mı?", pinned);

    const params = callMethod.mock.calls[0][1] as { content: string };
    expect(params.content).toBe(MARKER + "Toplu alım indirimi var mı?");
    expect(msg.body).toEqual({ type: "text", text: "Toplu alım indirimi var mı?" });
    expect(msg.productRef).toEqual({
      id: "LST-00201",
      url: "/pages/product-detail.html?id=LST-00201",
      label: "Corset Leather With Skirt • ₺332,19-371,27 • Min. Sipariş: 10",
    });
  });

  it("getMessages marker'lı geçmiş mesajı chip + temiz metne ayrıştırır", async () => {
    callMethod.mockResolvedValue({
      message: [
        { id: 1, content: MARKER + "Merhaba", message_type: 0, created_at: 1750000000 },
        { id: 2, content: "Düz mesaj", message_type: 1, created_at: 1750000100 },
      ],
    });
    const msgs = await getMessages("7");

    expect(msgs[0].body).toEqual({ type: "text", text: "Merhaba" });
    expect(msgs[0].productRef?.label).toBe(
      "Corset Leather With Skirt • ₺332,19-371,27 • Min. Sipariş: 10"
    );
    expect(msgs[1].productRef).toBeUndefined();
    expect(msgs[1].body).toEqual({ type: "text", text: "Düz mesaj" });
  });

  it("pinnedFromProductRef marker round-trip'te pin barını geri kurar", async () => {
    callMethod.mockResolvedValue({
      message: [{ id: 1, content: MARKER + "Merhaba", message_type: 0, created_at: 1750000000 }],
    });
    const [msg] = await getMessages("7");
    expect(pinnedFromProductRef(msg.productRef!)).toEqual({ ...pinned, thumbnail: "" });
  });

  it("pin'siz gönderimde content değişmez", async () => {
    callMethod.mockResolvedValue({ message: { id: 3, content: "Selam" } });
    const msg = await sendTextMessage("7", "Selam");

    const params = callMethod.mock.calls[0][1] as { content: string };
    expect(params.content).toBe("Selam");
    expect(msg.productRef).toBeUndefined();
  });
});
