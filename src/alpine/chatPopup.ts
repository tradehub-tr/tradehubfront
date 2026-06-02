import Alpine from "alpinejs";
import type { ChatTab, Conversation, Message, PinnedProduct, SubMenuKey } from "../types/chat";
import {
  listConversations,
  getMessages,
  sendTextMessage,
  sendAttachment,
  markConversationRead,
  blockConversation,
  deleteConversation,
  muteConversation,
  pinConversation,
  startOrGetThread,
  startVideoCall,
} from "../services/chatService";
import { canChat } from "../services/reservationService";
import { acquireScrollLock, releaseScrollLock } from "../utils/scrollLock";

// TeamsLike WebSocket sunmadığı için polling — aktif konuşma 3sn, inbox 10sn
// (messages.ts'deki seller dashboard pattern'i ile aynı).
const ACTIVE_POLL_MS = 3_000;
const INBOX_POLL_MS = 10_000;

// Alpine render flush sonrası + image/late layout için ardışık denemeler.
function scrollChatPopupToBottom() {
  const doScroll = () => {
    const el = document.querySelector<HTMLElement>("[data-chat-popup-msg-scroll]");
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    const last = el.lastElementChild as HTMLElement | null;
    last?.scrollIntoView?.({ block: "end" });
  };
  requestAnimationFrame(() => {
    doScroll();
    requestAnimationFrame(doScroll);
  });
  setTimeout(doScroll, 50);
  setTimeout(doScroll, 200);
}

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
  startingCall: boolean;
  searchOpen: boolean;
  searchQuery: string;

  readonly totalUnread: number;
  readonly activeConversation: Conversation | null;
  readonly filteredConversations: Conversation[];

  open(opts?: {
    conversationId?: string;
    sellerId?: string;
    pinnedProduct?: PinnedProduct;
  }): Promise<void>;
  close(): void;
  toggleExpanded(): void;
  toggleInbox(): void;
  setActiveTab(tab: ChatTab): void;
  toggleSubMenu(name: SubMenuKey): void;
  closeSubMenu(): void;
  toggleSearch(): void;
  setSearchQuery(q: string): void;
  setActiveConversation(id: string): Promise<void>;
  removePinnedProduct(): void;
  appendDraft(text: string): void;
  setDraft(text: string): void;
  sendMessage(): Promise<void>;
  handleFilePicked(file: File | null | undefined): Promise<void>;
  startVideoCall(): Promise<void>;
  blockActive(): Promise<void>;
  deleteActive(): Promise<void>;
  muteActive(): Promise<void>;
  pinActive(): Promise<void>;
  _refreshActiveMessages(): Promise<void>;
  _refreshConversations(): Promise<void>;
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
  startingCall: false,
  searchOpen: false,
  searchQuery: "",

  get totalUnread() {
    return this.conversations.reduce((sum, c) => sum + (c.unread || 0), 0);
  },

  get activeConversation() {
    if (!this.activeConversationId) return null;
    return this.conversations.find((c) => c.id === this.activeConversationId) ?? null;
  },

  get filteredConversations() {
    const q = this.searchQuery.trim().toLocaleLowerCase("tr-TR");
    if (!q) return this.conversations;
    return this.conversations.filter((c) => {
      const haystack = [c.name, c.company, c.lastMessage]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("tr-TR");
      return haystack.includes(q);
    });
  },

  async open(opts) {
    // Buyer "Sohbet Et" akışı — Plus tier seller'larda rezervasyon zorunlu.
    // Önce can_chat ile gating kontrol et; izin yoksa ReservationModal aç ve
    // chat-popup'ı AÇMA. Herhangi bir gating fail'ı durumunda EARLY RETURN —
    // chat-popup gating bypass'lı açılmasın.
    if (opts?.sellerId) {
      try {
        const gate = await canChat(opts.sellerId);
        if (!gate.allowed) {
          if (gate.reason === "reservation_required") {
            window.dispatchEvent(
              new CustomEvent("reservation-modal:open", {
                detail: {
                  sellerId: opts.sellerId,
                  sellerName: this.conversations.find((c) => c.sellerId === opts.sellerId)?.name,
                },
              })
            );
          }
          // Başka reason için sessizce reddet (genelde olmaz)
          return;
        }
      } catch (err) {
        this.error = err instanceof Error ? err.message : "Yetki kontrolü başarısız";
        return; // hata durumunda chat'i açma
      }
    }

    this.isOpen = true;
    this.pinnedProduct = opts?.pinnedProduct ?? null;
    this.error = null;
    acquireScrollLock();

    // Inbox listesi: ilk açılışta veya seller-trigger gelmediğinde yenile
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

    let targetId = opts?.conversationId ?? null;

    // Buyer "Sohbet Et" akışı — sellerId varsa backend her zaman idempotent
    // start_or_get_thread çağrılır. Yoksa yaratılır, varsa mevcut conversation
    // döndürülür. Bu sayede ilk kez konuşulan satıcıda da doğru thread açılır.
    if (!targetId && opts?.sellerId) {
      this.loading = true;
      try {
        const conv = await startOrGetThread(opts.sellerId);
        targetId = conv.id;
        const existing = this.conversations.find((c) => c.id === conv.id);
        if (existing) {
          // Mevcut conv'i güncelle (lastMessage/lastTime taze olabilir)
          Object.assign(existing, conv);
        } else {
          this.conversations = [conv, ...this.conversations];
        }
      } catch (err) {
        this.error = err instanceof Error ? err.message : "Satıcı ile sohbet başlatılamadı";
      } finally {
        this.loading = false;
      }
    }

    if (!targetId) {
      targetId = this.conversations[0]?.id ?? null;
    }

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

  toggleSearch() {
    this.searchOpen = !this.searchOpen;
    if (!this.searchOpen) this.searchQuery = "";
  },

  setSearchQuery(q) {
    this.searchQuery = q;
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
      scrollChatPopupToBottom();
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
      scrollChatPopupToBottom();
    } catch (err) {
      this.error = err instanceof Error ? err.message : "Mesaj gönderilemedi";
    } finally {
      this.sending = false;
    }
  },

  async handleFilePicked(file) {
    if (!file || this.sending || !this.activeConversationId) return;
    // Backend de 10 MB sınırı uyguluyor; UI tarafında erken reddet ki upload başlamasın.
    const MAX_BYTES = 10 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      this.error = `Dosya 10 MB sınırını aşıyor (${Math.round(file.size / 1024)} KB).`;
      return;
    }
    this.sending = true;
    this.error = null;
    try {
      const msg = await sendAttachment(this.activeConversationId, file);
      this.activeMessages = [...this.activeMessages, msg];
      scrollChatPopupToBottom();
    } catch (err) {
      this.error = err instanceof Error ? err.message : "Dosya gönderilemedi";
    } finally {
      this.sending = false;
    }
  },

  async startVideoCall() {
    if (!this.activeConversationId || this.startingCall) return;
    this.startingCall = true;
    this.error = null;
    try {
      const result = await startVideoCall(this.activeConversationId);
      if (result.join_url) {
        // Polling/local-state karışıklığını önlemek için: davet mesajı backend
        // tarafından thread'e eklendi; biz sadece sekmeyi açıyoruz. listConversations
        // bir sonraki tıkta otomatik refresh edilir.
        window.open(result.join_url, "_blank", "noopener,noreferrer");
      } else {
        this.error = "Görüşme URL'i alınamadı";
      }
      this.closeSubMenu();
    } catch (err) {
      this.error = err instanceof Error ? err.message : "Görüntülü görüşme başlatılamadı";
    } finally {
      this.startingCall = false;
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

  async _refreshActiveMessages() {
    // Polling sırasında sending varsa skip — kullanıcının gönderdiği mesaj
    // sırası karışabilir (race).
    if (!this.activeConversationId || this.sending) return;
    const id = this.activeConversationId;
    try {
      const fresh = await getMessages(id);
      // Kullanıcı bu arada başka konuşmaya geçtiyse drop et
      if (this.activeConversationId !== id) return;
      const prevLen = this.activeMessages.length;
      this.activeMessages = fresh;
      if (fresh.length > prevLen) scrollChatPopupToBottom();
    } catch {
      // Polling sessiz olsun — kullanıcıya banner basmıyoruz
    }
  },

  async _refreshConversations() {
    try {
      const fresh = await listConversations();
      // In-place merge — Alpine x-for DOM diff'i flicker yapmasın.
      const incomingIds = new Set(fresh.map((c) => c.id));
      for (let i = this.conversations.length - 1; i >= 0; i--) {
        if (!incomingIds.has(this.conversations[i].id)) {
          this.conversations.splice(i, 1);
        }
      }
      for (const c of fresh) {
        const existing = this.conversations.find((x) => x.id === c.id);
        if (existing) Object.assign(existing, c);
        else this.conversations.push(c);
      }
    } catch {
      // Polling sessiz
    }
  },
};

Alpine.store("chatPopup", chatStore);

// Alpine.data wrapper — root popup component; binds global handlers
Alpine.data("chatPopupRoot", () => ({
  _onOpen: null as ((ev: Event) => void) | null,
  _onKey: null as ((ev: KeyboardEvent) => void) | null,
  _inboxTimer: null as ReturnType<typeof setInterval> | null,
  _activeTimer: null as ReturnType<typeof setInterval> | null,

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

    // Real-time yerine polling: popup açıkken aktif konuşma ve inbox'u tazeler.
    this._inboxTimer = setInterval(() => {
      if (store.isOpen) void store._refreshConversations();
    }, INBOX_POLL_MS);
    this._activeTimer = setInterval(() => {
      if (store.isOpen && store.activeConversationId) {
        void store._refreshActiveMessages();
      }
    }, ACTIVE_POLL_MS);

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
    if (this._inboxTimer) clearInterval(this._inboxTimer);
    if (this._activeTimer) clearInterval(this._activeTimer);
  },
}));
