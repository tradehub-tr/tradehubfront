import Alpine from "alpinejs";
import type { ChatTab, Conversation, Message, PinnedProduct, SubMenuKey } from "../types/chat";
import {
  listConversations,
  getMessages,
  sendTextMessage,
  markConversationRead,
  blockConversation,
  deleteConversation,
  muteConversation,
  pinConversation,
} from "../services/chatService";
import { acquireScrollLock, releaseScrollLock } from "../utils/scrollLock";

interface ChatStore {
  isOpen: boolean;
  isExpanded: boolean;
  activeTab: ChatTab;
  inboxVisible: boolean;
  conversations: Conversation[];
  activeConversationId: string | null;
  activeMessages: Message[];
  pinnedProduct: PinnedProduct | null;
  openSubMenu: SubMenuKey | null;
  draft: string;
  loading: boolean;
  error: string | null;
  sending: boolean;

  readonly totalUnread: number;
  readonly activeConversation: Conversation | null;

  open(opts?: { conversationId?: string; pinnedProduct?: PinnedProduct }): Promise<void>;
  close(): void;
  toggleExpanded(): void;
  toggleInbox(): void;
  setActiveTab(tab: ChatTab): void;
  toggleSubMenu(name: SubMenuKey): void;
  closeSubMenu(): void;
  setActiveConversation(id: string): Promise<void>;
  removePinnedProduct(): void;
  appendDraft(text: string): void;
  setDraft(text: string): void;
  sendMessage(): Promise<void>;
  blockActive(): Promise<void>;
  deleteActive(): Promise<void>;
  muteActive(): Promise<void>;
  pinActive(): Promise<void>;
}

const chatStore: ChatStore = {
  isOpen: false,
  isExpanded: false,
  activeTab: "chat",
  inboxVisible: true,
  conversations: [],
  activeConversationId: null,
  activeMessages: [],
  pinnedProduct: null,
  openSubMenu: null,
  draft: "",
  loading: false,
  error: null,
  sending: false,

  get totalUnread() {
    return this.conversations.reduce((sum, c) => sum + (c.unread || 0), 0);
  },

  get activeConversation() {
    if (!this.activeConversationId) return null;
    return this.conversations.find((c) => c.id === this.activeConversationId) ?? null;
  },

  async open(opts) {
    this.isOpen = true;
    this.pinnedProduct = opts?.pinnedProduct ?? null;
    this.error = null;
    acquireScrollLock();

    if (this.conversations.length === 0) {
      this.loading = true;
      try {
        this.conversations = await listConversations();
      } catch (err) {
        this.error = err instanceof Error ? err.message : "Konuşmalar yüklenemedi";
      } finally {
        this.loading = false;
      }
    }

    const targetId = opts?.conversationId ?? this.conversations[0]?.id ?? null;
    if (targetId) {
      await this.setActiveConversation(targetId);
    }
  },

  close() {
    this.isOpen = false;
    this.isExpanded = false;
    this.openSubMenu = null;
    releaseScrollLock();
  },

  toggleExpanded() {
    this.isExpanded = !this.isExpanded;
  },

  toggleInbox() {
    this.inboxVisible = !this.inboxVisible;
  },

  setActiveTab(tab) {
    this.activeTab = tab;
  },

  toggleSubMenu(name) {
    this.openSubMenu = this.openSubMenu === name ? null : name;
  },

  closeSubMenu() {
    this.openSubMenu = null;
  },

  async setActiveConversation(id) {
    this.activeConversationId = id;
    this.activeTab = "chat";
    this.error = null;
    try {
      this.activeMessages = await getMessages(id);
      await markConversationRead(id);
      const conv = this.conversations.find((c) => c.id === id);
      if (conv) conv.unread = 0;
    } catch (err) {
      this.error = err instanceof Error ? err.message : "Mesajlar yüklenemedi";
    }
  },

  removePinnedProduct() {
    this.pinnedProduct = null;
  },

  appendDraft(text) {
    this.draft = this.draft + text;
  },

  setDraft(text) {
    this.draft = text;
  },

  async sendMessage() {
    if (this.sending) return;
    const text = this.draft.trim();
    if (!text || !this.activeConversationId) return;
    const pp = this.pinnedProduct ?? undefined;
    this.sending = true;
    this.error = null;
    try {
      const msg = await sendTextMessage(this.activeConversationId, text, pp);
      this.activeMessages = [...this.activeMessages, msg];
      this.draft = "";
    } catch (err) {
      this.error = err instanceof Error ? err.message : "Mesaj gönderilemedi";
    } finally {
      this.sending = false;
    }
  },

  async blockActive() {
    if (!this.activeConversationId) return;
    await blockConversation(this.activeConversationId);
    this.closeSubMenu();
  },

  async deleteActive() {
    if (!this.activeConversationId) return;
    const id = this.activeConversationId;
    await deleteConversation(id);
    this.conversations = this.conversations.filter((c) => c.id !== id);
    this.activeConversationId = null;
    this.activeMessages = [];
    this.closeSubMenu();
  },

  async muteActive() {
    if (!this.activeConversationId) return;
    const conv = this.conversations.find((c) => c.id === this.activeConversationId);
    if (!conv) return;
    conv.muted = !conv.muted;
    await muteConversation(conv.id, !!conv.muted);
    this.closeSubMenu();
  },

  async pinActive() {
    if (!this.activeConversationId) return;
    const conv = this.conversations.find((c) => c.id === this.activeConversationId);
    if (!conv) return;
    conv.pinned = !conv.pinned;
    await pinConversation(conv.id, !!conv.pinned);
    this.closeSubMenu();
  },
};

Alpine.store("chatPopup", chatStore);

// Alpine.data wrapper — root popup component; binds global handlers
Alpine.data("chatPopupRoot", () => ({
  _onOpen: null as ((ev: Event) => void) | null,
  _onKey: null as ((ev: KeyboardEvent) => void) | null,

  init() {
    const root = this.$root as HTMLElement;
    const store = Alpine.store("chatPopup") as ChatStore;

    this._onOpen = (ev: Event) => {
      const detail = (ev as CustomEvent).detail ?? {};
      void store.open(detail);
    };
    this._onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape" && store.isOpen) store.close();
    };

    window.addEventListener("chat-popup:open", this._onOpen);
    document.addEventListener("keydown", this._onKey);

    root.addEventListener("click", (ev) => {
      const target = ev.target as HTMLElement;
      if (target.closest("[data-submenu-trigger]") || target.closest("[data-submenu-panel]")) {
        return;
      }
      if (store.openSubMenu) store.closeSubMenu();
    });
  },

  destroy() {
    if (this._onOpen) window.removeEventListener("chat-popup:open", this._onOpen);
    if (this._onKey) document.removeEventListener("keydown", this._onKey);
  },
}));
