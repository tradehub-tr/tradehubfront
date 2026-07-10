import { beforeEach, describe, expect, it, vi } from "vitest";
import Alpine from "alpinejs";
import { getMessages, startOrGetThread } from "../services/chatService";

vi.mock("../services/chatService", () => ({
  listConversations: vi.fn(async () => [
    { id: "c1", sellerId: "S1", name: "Ali Giyim", unread: 0 },
    { id: "c2", sellerId: "S2", name: "Marmara Elektronik", unread: 0 },
  ]),
  getMessages: vi.fn(async () => []),
  sendTextMessage: vi.fn(),
  sendAttachment: vi.fn(),
  markConversationRead: vi.fn(async () => undefined),
  blockConversation: vi.fn(),
  deleteConversation: vi.fn(),
  muteConversation: vi.fn(),
  pinConversation: vi.fn(),
  startOrGetThread: vi.fn(async () => ({ id: "c1", sellerId: "S1", name: "Ali Giyim", unread: 0 })),
  startVideoCall: vi.fn(),
  pinnedFromProductRef: vi.fn((ref: { id?: string; label: string }) => ({
    id: ref.id ?? "",
    title: ref.label,
    price: "",
    minOrder: "1",
    thumbnail: "",
  })),
}));

vi.mock("../services/reservationService", () => ({
  canChat: vi.fn(async () => ({ allowed: true })),
}));

vi.mock("../utils/scrollLock", () => ({
  acquireScrollLock: vi.fn(),
  releaseScrollLock: vi.fn(),
}));

vi.mock("../i18n", () => ({ t: (k: string) => k }));

import "./chatPopup";

const pinned = {
  id: "P1",
  title: "Corset Leather With Skirt",
  price: "₺332,19-371,27",
  minOrder: "10",
  thumbnail: "",
};

interface StoreLike {
  pinnedProduct: typeof pinned | null;
  _pinnedByConv: Record<string, typeof pinned | null>;
  activeConversationId: string | null;
  conversations: unknown[];
  error: string | null;
  open(opts?: { sellerId?: string; pinnedProduct?: typeof pinned }): Promise<void>;
  setActiveConversation(id: string): Promise<void>;
  removePinnedProduct(): void;
  close(): void;
}

function getStore(): StoreLike {
  return Alpine.store("chatPopup") as unknown as StoreLike;
}

describe("chatPopup store — pinnedProduct konuşma bağlamı", () => {
  beforeEach(() => {
    const store = getStore();
    store.close();
    store.pinnedProduct = null;
    store._pinnedByConv = {};
    store.activeConversationId = null;
    store.conversations = [];
  });

  it("trigger'dan gelen ürün, açılan konuşmada görünür", async () => {
    const store = getStore();
    await store.open({ sellerId: "S1", pinnedProduct: pinned });
    expect(store.activeConversationId).toBe("c1");
    expect(store.pinnedProduct).toEqual(pinned);
  });

  it("başka konuşmaya geçince o konuşmanın pin'i sızmaz", async () => {
    const store = getStore();
    await store.open({ sellerId: "S1", pinnedProduct: pinned });
    await store.setActiveConversation("c2");
    expect(store.pinnedProduct).toBeNull();
  });

  it("geçiş yapıp geri dönünce konuşmanın kendi pin'i geri gelir", async () => {
    const store = getStore();
    await store.open({ sellerId: "S1", pinnedProduct: pinned });
    await store.setActiveConversation("c2");
    await store.setActiveConversation("c1");
    expect(store.pinnedProduct).toEqual(pinned);
  });

  it("X ile kapatılan pin geri dönüşte geri gelmez", async () => {
    const store = getStore();
    await store.open({ sellerId: "S1", pinnedProduct: pinned });
    store.removePinnedProduct();
    await store.setActiveConversation("c2");
    await store.setActiveConversation("c1");
    expect(store.pinnedProduct).toBeNull();
  });

  it("pin verilip satıcı çözülemezse İLK konuşmaya düşmez", async () => {
    const store = getStore();
    await store.open({ pinnedProduct: pinned });
    expect(store.activeConversationId).toBeNull();
    expect(store.pinnedProduct).toBeNull();
  });

  it("sellerId'li açılışta thread çözümü hata verirse İLK konuşmaya düşmez", async () => {
    const store = getStore();
    vi.mocked(startOrGetThread).mockRejectedValueOnce(new Error("Satıcı bulunamadı"));
    await store.open({ sellerId: "SEL-YOK" });
    expect(store.activeConversationId).toBeNull();
    expect(store.error).toBeTruthy();
  });

  it("oturum haritasında kayıt yoksa pin geçmişteki son ürünlü mesajdan kurulur", async () => {
    const store = getStore();
    vi.mocked(getMessages).mockResolvedValueOnce([
      {
        id: "m1",
        conversationId: "c2",
        direction: "me",
        body: { type: "text", text: "Merhaba" },
        time: "14:00",
        read: true,
        productRef: { id: "LST-9", url: "/pages/product-detail.html?id=LST-9", label: "Kışlık Bere" },
      },
    ]);
    await store.setActiveConversation("c2");
    expect(store.pinnedProduct?.title).toBe("Kışlık Bere");
    expect(store._pinnedByConv["c2"]).not.toBeUndefined();
  });
});
