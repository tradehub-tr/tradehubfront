import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Alpine from "alpinejs";

type ChatGate = { allowed: boolean; reason?: string };

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

const { listConversations, canChat, listSellerSlots } = vi.hoisted(() => ({
  listConversations: vi.fn(async () => []),
  canChat: vi.fn(async (): Promise<ChatGate> => ({ allowed: true })),
  listSellerSlots: vi.fn(async () => []),
}));

vi.mock("../../i18n", () => ({ t: (key: string) => key }));
vi.mock("../icons/lucideIcons", () => ({
  getLucideIcon: () => "<svg aria-hidden=\"true\"></svg>",
}));
vi.mock("../../services/chatService", () => ({
  listConversations,
  getMessages: vi.fn(async () => []),
  sendTextMessage: vi.fn(),
  sendAttachment: vi.fn(),
  markConversationRead: vi.fn(async () => undefined),
  blockConversation: vi.fn(),
  deleteConversation: vi.fn(),
  muteConversation: vi.fn(),
  pinConversation: vi.fn(),
  startOrGetThread: vi.fn(),
  startVideoCall: vi.fn(),
  pinnedFromProductRef: vi.fn(),
}));
vi.mock("../../services/reservationService", () => ({
  canChat,
  listSellerSlots,
  reserveSlot: vi.fn(),
  formatSlot: vi.fn(() => ""),
}));
vi.mock("../../utils/scrollLock", () => ({
  acquireScrollLock: vi.fn(),
  releaseScrollLock: vi.fn(),
}));

import { mountChatPopup } from "./mountChatPopup";
import { MessagesLayout } from "../messages/MessagesLayout";
import { initChatTriggers } from "./initChatTriggers";
import "../../alpine/chatPopup";
import "../../alpine/reservationModal";

type ChatStore = {
  isOpen: boolean;
  isExpanded: boolean;
  openSubMenu: string | null;
  conversations: unknown[];
  activeConversationId: string | null;
  activeMessages: unknown[];
  close(): void;
};

function chatStore(): ChatStore {
  return Alpine.store("chatPopup") as unknown as ChatStore;
}

function destroyChatRoot(): void {
  const root = document.querySelector<HTMLElement>('[x-data="chatPopupRoot"]');
  if (!root) return;
  (Alpine as unknown as { destroyTree?: (el: HTMLElement) => void }).destroyTree?.(root);
}

beforeEach(() => {
  listConversations.mockResolvedValue([]);
  canChat.mockResolvedValue({ allowed: true });
  listSellerSlots.mockResolvedValue([]);
  const store = chatStore();
  store.close();
  store.isExpanded = false;
  store.openSubMenu = null;
  store.conversations = [];
  store.activeConversationId = null;
  store.activeMessages = [];
});

afterEach(() => {
  destroyChatRoot();
  document.body.innerHTML = "";
  vi.clearAllMocks();
});

describe("ChatPopup page ownership and lifecycle characterization", () => {
  it("does not mount the global chat tree beside MessagesLayout before an intent", () => {
    document.body.innerHTML = `<main id="messages-page">${MessagesLayout()}</main>`;

    mountChatPopup();

    expect(document.querySelectorAll('[x-data="messagesComponent"]')).toHaveLength(1);
    expect(document.querySelectorAll('[x-data="chatPopupRoot"]')).toHaveLength(0);
    expect(document.querySelector("#messages-page #msg-chat-body")).not.toBeNull();
    expect(document.querySelector("#chat-popup-mount")).toBeNull();
  });

  it("lazily opens from a delegated trigger, focuses the dialog, restores focus on Escape, and reopens one root", async () => {
    document.body.innerHTML = '<button type="button" id="chat-trigger" data-chat-trigger>Chat</button>';
    const trigger = document.querySelector<HTMLButtonElement>("#chat-trigger")!;
    mountChatPopup();
    mountChatPopup();
    initChatTriggers();
    trigger.focus();

    trigger.click();
    await vi.waitFor(() => {
      expect(chatStore().isOpen).toBe(true);
      expect(document.querySelectorAll('[x-data="chatPopupRoot"]')).toHaveLength(1);
    });

    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!;
    expect(chatStore().isOpen).toBe(true);
    expect(dialog.contains(document.activeElement)).toBe(true);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(chatStore().isOpen).toBe(false);
    expect(document.activeElement).toBe(trigger);

    trigger.click();
    await vi.waitFor(() => expect(chatStore().isOpen).toBe(true));
    expect(chatStore().isOpen).toBe(true);
    expect(document.querySelectorAll('[x-data="chatPopupRoot"]')).toHaveLength(1);
    expect(listConversations).toHaveBeenCalledTimes(2);
  });

  it("opens once from a keyboard intent on a non-native trigger", async () => {
    document.body.innerHTML =
      '<div id="chat-trigger" role="button" tabindex="0" data-chat-trigger>Chat</div>';
    const trigger = document.querySelector<HTMLElement>("#chat-trigger")!;
    mountChatPopup();
    initChatTriggers();
    trigger.focus();

    trigger.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));

    await vi.waitFor(() => {
      expect(chatStore().isOpen).toBe(true);
      expect(document.querySelectorAll('[x-data="chatPopupRoot"]')).toHaveLength(1);
    });
    expect(document.querySelector<HTMLElement>('[role="dialog"]')?.contains(document.activeElement)).toBe(
      true
    );
  });

  it.each([
    ["denied", () => canChat.mockResolvedValueOnce({ allowed: false, reason: "blocked" })],
    ["errors", () => canChat.mockRejectedValueOnce(new Error("gate unavailable"))],
  ])("closes the lazy overlay and restores focus when the chat gate %s", async (_name, arrange) => {
    arrange();
    document.body.innerHTML =
      '<button type="button" id="chat-trigger" data-chat-trigger data-seller-id="SELLER-1">Chat</button>';
    const trigger = document.querySelector<HTMLButtonElement>("#chat-trigger")!;
    mountChatPopup();
    initChatTriggers();
    trigger.focus();

    trigger.click();

    await vi.waitFor(() => {
      expect(chatStore().isOpen).toBe(false);
      expect(document.querySelector<HTMLElement>("#chat-popup-mount")?.hidden).toBe(true);
    });
    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe("");
  });

  it("host-owns a reservation-required gate with one modal and no global duplicate", async () => {
    canChat.mockResolvedValueOnce({ allowed: false, reason: "reservation_required" });
    document.body.innerHTML =
      '<button type="button" id="chat-trigger" data-chat-trigger data-seller-id="SELLER-1">Chat</button>';
    const trigger = document.querySelector<HTMLButtonElement>("#chat-trigger")!;
    mountChatPopup();
    initChatTriggers();
    trigger.focus();

    trigger.click();

    await vi.waitFor(() => {
      expect(document.querySelectorAll("[data-reservation-modal]")).toHaveLength(1);
      expect(Alpine.store("reservationModal")).toMatchObject({ isOpen: true, sellerId: "SELLER-1" });
    });
    expect(chatStore().isOpen).toBe(false);
    expect(document.querySelector("#reservation-modal-mount")).toBeNull();
    expect(listSellerSlots).toHaveBeenCalledTimes(1);
    expect(document.querySelector("[data-reservation-modal]")?.contains(document.activeElement)).toBe(
      true
    );
  });

  it("invalidates a pending gate when Escape closes the lazy overlay", async () => {
    const gate = deferred<ChatGate>();
    canChat.mockImplementationOnce(() => gate.promise);
    document.body.innerHTML =
      '<button type="button" id="chat-trigger" data-chat-trigger data-seller-id="SELLER-1">Chat</button>';
    const trigger = document.querySelector<HTMLButtonElement>("#chat-trigger")!;
    mountChatPopup();
    initChatTriggers();
    trigger.focus();

    trigger.click();
    await vi.waitFor(() => expect(document.querySelector("#chat-popup-mount")).not.toBeNull());
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    gate.resolve({ allowed: true });
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(chatStore().isOpen).toBe(false);
    expect(document.querySelector<HTMLElement>("#chat-popup-mount")?.hidden).toBe(true);
    expect(document.body.style.overflow).toBe("");
    expect(document.activeElement).toBe(trigger);
  });

  it("ignores a late blocked gate from intent A after intent B has opened", async () => {
    const gateA = deferred<ChatGate>();
    canChat.mockImplementationOnce(() => gateA.promise);
    document.body.innerHTML = `
      <button type="button" id="chat-a" data-chat-trigger data-seller-id="SELLER-A">A</button>
      <button type="button" id="chat-b" data-chat-trigger>B</button>
    `;
    const triggerA = document.querySelector<HTMLButtonElement>("#chat-a")!;
    const triggerB = document.querySelector<HTMLButtonElement>("#chat-b")!;
    mountChatPopup();
    initChatTriggers();

    triggerA.click();
    await vi.waitFor(() => expect(document.querySelector("#chat-popup-mount")).not.toBeNull());
    triggerB.click();
    await vi.waitFor(() => expect(chatStore().isOpen).toBe(true));

    gateA.resolve({ allowed: false, reason: "blocked" });
    await Promise.resolve();
    await Promise.resolve();

    expect(chatStore().isOpen).toBe(true);
    expect(document.querySelector<HTMLElement>("#chat-popup-mount")?.hidden).toBe(false);
  });
});
