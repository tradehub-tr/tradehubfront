/**
 * Seller dashboard "Mesajlarım" sayfası (storefront içinde /pages/dashboard/messages.html).
 *
 * Aynı `chatService` ile chat-popup'ı paylaşıyoruz; rol bazlı routing'i backend
 * (tradehub_core.api.chat) yapıyor. Bu sayede chat-popup buyer akışıyla, bu
 * sayfa seller akışıyla aynı endpoint'leri kullanır, backend Frappe session
 * user'a göre `_is_seller` → portal/inbox ayrımı yapar.
 *
 * Real-time: TeamsLike WebSocket sunmadığı için polling — aktif konuşma 3sn,
 * inbox 10sn.
 */

import Alpine from "alpinejs";
import { t } from "../i18n";
import { callMethod } from "../utils/api";

const ACTIVE_POLL_MS = 3_000;
const INBOX_POLL_MS = 10_000;

interface UiMessage {
	id: string;
	sender: string;
	text: string;
	/** URL'leri <a> tag'lerine dönüştürülmüş (XSS-safe escape + linkify) HTML. */
	textHtml: string;
	time: string;
	isMe: boolean;
	videoCallUrl?: string;
}

const VIDEO_CALL_MARKER = "🎥";
const URL_REGEX_G = /(https?:\/\/[^\s]+)/g;

function escapeHtml(s: string): string {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function linkify(text: string): string {
	let last = 0;
	let out = "";
	for (const m of text.matchAll(URL_REGEX_G)) {
		const start = m.index ?? 0;
		out += escapeHtml(text.slice(last, start));
		const url = m[1];
		const safeUrl = escapeHtml(url);
		out +=
			`<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" ` +
			`class="underline text-(--color-cta-primary,#cc9900) hover:opacity-80 break-all">` +
			`${safeUrl}</a>`;
		last = start + url.length;
	}
	out += escapeHtml(text.slice(last));
	return out;
}

function extractVideoCallUrl(text: string): string | undefined {
	if (!text.includes(VIDEO_CALL_MARKER)) return undefined;
	const match = text.match(URL_REGEX_G);
	return match ? match[0] : undefined;
}

interface UiConversation {
	id: string;
	avatar: string;
	name: string;
	company: string;
	preview: string;
	date: string;
	unreadCount: number;
	messages: UiMessage[];
}

interface RawLastMessage {
	content?: string;
	created_at?: string | number;
}

interface RawThread {
	id?: number;
	status?: string;
	contact?: { id?: number; name?: string; email?: string } | null;
	seller?: { user_id?: string; full_name?: string; email?: string } | null;
	last_message?: RawLastMessage | null;
	last_non_activity_message?: RawLastMessage | null;
	unread_count?: number;
}

interface RawChatwootMessage {
	id?: number;
	content?: string | null;
	message_type?: number;
	created_at?: string | number;
}

function avatarFor(name: string): string {
	const seed = (name || "S").trim().charAt(0).toUpperCase();
	return `https://ui-avatars.com/api/?name=${encodeURIComponent(seed)}&size=80&background=cc9900&color=fff&bold=true&format=png`;
}

function todayLabel(): string {
	const d = new Date();
	return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function toDate(value: string | number | undefined): Date | null {
	if (value === undefined || value === null) return null;
	if (typeof value === "number") {
		return new Date(value < 1e12 ? value * 1000 : value);
	}
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? null : d;
}

function toHHMM(d: Date | null): string {
	if (!d) return "";
	return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function toRelativeOrDate(d: Date | null): string {
	if (!d) return todayLabel();
	const diffSec = Math.max(0, (Date.now() - d.getTime()) / 1000);
	if (diffSec < 3600) return `${Math.floor(diffSec / 60)} dk önce`;
	if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} sa önce`;
	return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** Seller perspektifinde: contact (buyer) bilgisini öne çıkar. */
function threadToUi(thread: RawThread): UiConversation {
	const contact = thread.contact || {};
	const last = thread.last_message || thread.last_non_activity_message || null;
	const name = contact.name || contact.email || "Alıcı";
	const company = contact.email && contact.email !== name ? contact.email : "";
	return {
		id: String(thread.id ?? ""),
		avatar: avatarFor(name),
		name,
		company,
		preview: last?.content || "",
		date: toRelativeOrDate(toDate(last?.created_at)),
		unreadCount: typeof thread.unread_count === "number" ? thread.unread_count : 0,
		messages: [],
	};
}

/** Seller perspektifinde mesaj: message_type=1 (outgoing) seller'ın kendisi. */
function messageToUiForSeller(m: RawChatwootMessage): UiMessage {
	const date = toDate(m.created_at);
	const isMe = m.message_type === 1;
	const text = m.content || "";
	return {
		id: String(m.id ?? `m-${Date.now()}`),
		sender: isMe ? "Me" : "",
		text,
		textHtml: linkify(text),
		time: toHHMM(date),
		isMe,
		videoCallUrl: extractVideoCallUrl(text),
	};
}

function extractMessages(raw: unknown): RawChatwootMessage[] {
	if (Array.isArray(raw)) return raw as RawChatwootMessage[];
	if (raw && typeof raw === "object" && Array.isArray((raw as { payload?: unknown }).payload)) {
		return (raw as { payload: RawChatwootMessage[] }).payload;
	}
	return [];
}

function isUserMessage(m: RawChatwootMessage): boolean {
	return m.message_type !== 2 && Boolean(m.content && m.content.trim());
}

/**
 * Mesaj kutusunu en alta kaydır. Alpine $nextTick'in DOM update timing'i
 * tutarsız olduğundan birden fazla deneme yaparız:
 *   - requestAnimationFrame (Alpine render flush sonrası)
 *   - 50ms gecikme (image load gibi geç render'lar)
 *   - 200ms gecikme (büyük listeler için son güvence)
 */
function scrollChatToBottom() {
	const doScroll = () => {
		const el = document.getElementById("msg-chat-body");
		if (!el) return;
		// 1) Direct atama
		el.scrollTop = el.scrollHeight;
		// 2) Son child'ı görünür yap — Alpine template'lerinden sonra gerçek
		//    son mesaj DOM elementi. scrollIntoView CSS smooth-behavior'ı
		//    bypass eder ve focus/blur olaylarına dayanıklıdır.
		const last = el.lastElementChild as HTMLElement | null;
		if (last && typeof last.scrollIntoView === "function") {
			last.scrollIntoView({ block: "end" });
		}
	};
	// Alpine render flush sonrası + image load / late layout için multiple denemeler
	requestAnimationFrame(() => {
		doScroll();
		requestAnimationFrame(doScroll);
	});
	setTimeout(doScroll, 50);
	setTimeout(doScroll, 200);
	setTimeout(doScroll, 500);
}

Alpine.data("messagesComponent", () => ({
	activeCategory: "all",
	searchQuery: "",
	selectedConversation: null as UiConversation | null,
	newMessage: "",
	filterOpen: false,
	filterType: "all",
	feedbackVisible: true,
	loading: false,
	error: null as string | null,
	sending: false,
	startingCall: false,

	conversations: [] as UiConversation[],

	_inboxTimer: null as ReturnType<typeof setInterval> | null,
	_activeTimer: null as ReturnType<typeof setInterval> | null,

	get categories() {
		return [
			{ id: "all", label: t("messages.allMessages"), icon: "chat" },
			{ id: "unread", label: t("messages.unread"), icon: "eye" },
		];
	},

	async _loadConversations() {
		this.loading = true;
		this.error = null;
		try {
			// callMethod() Frappe response'unu zaten `data.message`'a kadar
			// unwrap ediyor — yani döndürdüğü değer direkt thread listesi.
			const threads = await callMethod<RawThread[]>(
				"tradehub_core.api.chat.list_my_threads",
				{ perspective: "seller" }
			);
			const list = Array.isArray(threads) ? threads : [];
			const ui = list.map(threadToUi).filter((c) => c.id);
			// In-place merge: aynı id'li conv'i güncelle, yenileri ekle, kalanı sil.
			// Bu sayede Alpine x-for DOM'u kırmıyor → flicker yok.
			const incomingIds = new Set(ui.map((c) => c.id));
			// 1) Mevcutta olan ama gelmemiş olanları sil
			for (let i = this.conversations.length - 1; i >= 0; i--) {
				if (!incomingIds.has(this.conversations[i].id)) {
					this.conversations.splice(i, 1);
				}
			}
			// 2) Yeni gelenleri ekle veya mevcudu in-place güncelle (messages korunur)
			for (const c of ui) {
				const existing = this.conversations.find((x) => x.id === c.id);
				if (existing) {
					existing.name = c.name;
					existing.company = c.company;
					existing.avatar = c.avatar;
					existing.preview = c.preview;
					existing.date = c.date;
					existing.unreadCount = c.unreadCount;
					// existing.messages YERİNDE BIRAK — _loadActiveMessages günceller
				} else {
					this.conversations.push(c);
				}
			}
		} catch (err) {
			this.error = err instanceof Error ? err.message : "Mesajlar yüklenemedi";
		} finally {
			this.loading = false;
		}
	},

	async _loadActiveMessages() {
		if (!this.selectedConversation) return;
		const id = this.selectedConversation.id;
		try {
			const raw = await callMethod<unknown>(
				"tradehub_core.api.chat.list_messages",
				{ conversation_id: id, perspective: "seller" }
			);
			const arr = extractMessages(raw)
				.filter(isUserMessage)
				.sort((a, b) => {
					const da = toDate(a.created_at)?.getTime() ?? 0;
					const db = toDate(b.created_at)?.getTime() ?? 0;
					return da - db;
				})
				.map(messageToUiForSeller);
			if (!this.selectedConversation || this.selectedConversation.id !== id) return;
			// Optimistic local mesajları (henüz server id'si yok) koru.
			const prevMessages = this.selectedConversation.messages;
			const prevCount = prevMessages.length;
			const incomingIds = new Set(arr.map((m) => m.id));
			const optimistic = prevMessages.filter(
				(m) => m.id.startsWith("m-local") && !incomingIds.has(m.id)
			);
			// Total replacement — Alpine reactive setter %100 yakalar.
			// `:key="msg.id"` sayesinde x-for DOM diff yapar; aynı id'li
			// mesajların DOM'u korunur, sadece yeniler eklenir.
			this.selectedConversation.messages = [...arr, ...optimistic];
			// Yeni mesaj eklendiyse scroll'u dibe at
			if (this.selectedConversation.messages.length > prevCount) {
				scrollChatToBottom();
			}
		} catch (err) {
			this.error = err instanceof Error ? err.message : "Konuşma yüklenemedi";
		}
	},

	init() {
		this._loadConversations();
		this._inboxTimer = setInterval(() => this._loadConversations(), INBOX_POLL_MS);
		this._activeTimer = setInterval(() => {
			if (this.selectedConversation && !this.sending) {
				this._loadActiveMessages();
			}
		}, ACTIVE_POLL_MS);
		window.addEventListener("languageChanged", () => {
			// i18n değişince UI label'ları yenilemek için listeyi yeniden çek
			this._loadConversations();
		});
		window.addEventListener("beforeunload", () => this._destroy());
	},

	_destroy() {
		if (this._inboxTimer) {
			clearInterval(this._inboxTimer);
			this._inboxTimer = null;
		}
		if (this._activeTimer) {
			clearInterval(this._activeTimer);
			this._activeTimer = null;
		}
	},

	getUnreadTotal(): number {
		return this.conversations.reduce((sum, c) => sum + c.unreadCount, 0);
	},

	getFilteredConversations(): UiConversation[] {
		let list = [...this.conversations];
		if (this.activeCategory === "unread") {
			list = list.filter((c) => c.unreadCount > 0);
		}
		if (this.filterType === "unread") {
			list = list.filter((c) => c.unreadCount > 0);
		} else if (this.filterType === "read") {
			list = list.filter((c) => c.unreadCount === 0);
		}
		if (this.searchQuery.trim()) {
			const q = this.searchQuery.toLowerCase();
			list = list.filter(
				(c) =>
					c.name.toLowerCase().includes(q) ||
					c.company.toLowerCase().includes(q) ||
					c.preview.toLowerCase().includes(q)
			);
		}
		return list;
	},

	setCategory(id: string) {
		this.activeCategory = id;
		this.filterType = "all";
		this.filterOpen = false;
	},

	async selectConversation(conv: UiConversation) {
		this.selectedConversation = conv;
		const found = this.conversations.find((c) => c.id === conv.id);
		if (found) found.unreadCount = 0;
		await this._loadActiveMessages();
		scrollChatToBottom();
	},

	backToList() {
		this.selectedConversation = null;
		this.newMessage = "";
	},

	async sendMessage() {
		if (!this.newMessage.trim() || !this.selectedConversation || this.sending) return;
		const text = this.newMessage.trim();
		this.sending = true;
		try {
			const sent = await callMethod<RawChatwootMessage>(
				"tradehub_core.api.chat.send_message",
				{ conversation_id: this.selectedConversation.id, content: text, perspective: "seller" },
				true
			);
			const finalText = sent.content || text;
			const uiMsg: UiMessage = {
				id: String(sent.id ?? `m-${Date.now()}`),
				sender: "Me",
				text: finalText,
				textHtml: linkify(finalText),
				time: toHHMM(toDate(sent.created_at)) || toHHMM(new Date()),
				isMe: true,
				videoCallUrl: extractVideoCallUrl(finalText),
			};
			this.selectedConversation.messages = [
				...this.selectedConversation.messages,
				uiMsg,
			];
			const found = this.conversations.find(
				(c) => c.id === this.selectedConversation!.id
			);
			if (found) found.preview = text;
			this.newMessage = "";
			scrollChatToBottom();
		} catch (err) {
			this.error = err instanceof Error ? err.message : "Mesaj gönderilemedi";
		} finally {
			this.sending = false;
		}
	},

	toggleFilter() {
		this.filterOpen = !this.filterOpen;
	},

	setFilter(type: string) {
		this.filterType = type;
		this.filterOpen = false;
	},

	dismissFeedback() {
		this.feedbackVisible = false;
	},

	async startVideoCall() {
		if (!this.selectedConversation || this.startingCall) return;
		this.startingCall = true;
		try {
			const result = await callMethod<{ join_url?: string; meeting_id?: string }>(
				"tradehub_core.api.chat.start_video_call",
				{ conversation_id: this.selectedConversation.id },
				true
			);
			const url = result?.join_url;
			if (url) {
				// Polling 3sn içinde davet mesajını listede de gösterecek.
				window.open(url, "_blank", "noopener,noreferrer");
			} else {
				this.error = "Görüşme URL'i alınamadı";
			}
		} catch (err) {
			this.error = err instanceof Error ? err.message : "Görüntülü görüşme başlatılamadı";
		} finally {
			this.startingCall = false;
		}
	},
}));
