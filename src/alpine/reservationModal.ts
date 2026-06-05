/**
 * ReservationModal — Plus tier seller'larla chat başlatmadan önce slot
 * seçimi modal'ı. chat-popup açılışında `can_chat` `false` dönerse
 * dispatch edilir.
 *
 * Akış:
 * - `window.dispatchEvent(new CustomEvent("reservation-modal:open", {detail: {sellerId, sellerName?}}))`
 * - Modal açılır, slot listesini fetch eder
 * - Kullanıcı slot seçip "Rezerve Et" tıklar → reserveSlot çağrılır
 * - Başarılı → `window.dispatchEvent(new CustomEvent("chat-popup:open", {detail: {sellerId}}))`
 *   (chat-popup gating'i tekrar deneyecek)
 */

import Alpine from "alpinejs";
import { t } from "../i18n";
import {
  listSellerSlots,
  reserveSlot,
  formatSlot,
  type AvailableSlot,
  type Reservation,
} from "../services/reservationService";

interface State {
  isOpen: boolean;
  sellerId: string | null;
  sellerName: string;
  slots: AvailableSlot[];
  loading: boolean;
  selectedSlotId: string | null;
  reserving: boolean;
  error: string | null;
  successReservation: Reservation | null;
  /** Rezerve edilen slot başlamış mı (now>=start_at && now<=end_at) */
  successActive: boolean;

  open(opts: { sellerId: string; sellerName?: string }): Promise<void>;
  close(): void;
  selectSlot(id: string): void;
  confirm(): Promise<void>;
  openChatAfterReserve(): void;
  formatSlot(start: string, end: string): string;
}

function isReservationActive(r: Reservation): boolean {
  try {
    const now = Date.now();
    const start = new Date(String(r.start_at).replace(" ", "T")).getTime();
    const end = new Date(String(r.end_at).replace(" ", "T")).getTime();
    return start <= now && now <= end;
  } catch {
    return false;
  }
}

Alpine.store("reservationModal", {
  isOpen: false,
  sellerId: null,
  sellerName: "",
  slots: [],
  loading: false,
  selectedSlotId: null,
  reserving: false,
  error: null,
  successReservation: null,
  successActive: false,

  async open(opts) {
    this.isOpen = true;
    this.sellerId = opts.sellerId;
    this.sellerName = opts.sellerName || t("commonSvc.seller");
    this.slots = [];
    this.selectedSlotId = null;
    this.error = null;
    this.successReservation = null;
    this.successActive = false;
    this.loading = true;
    try {
      this.slots = await listSellerSlots(opts.sellerId);
    } catch (err) {
      this.error = err instanceof Error ? err.message : t("commonSvc.slotsLoadFailed");
    } finally {
      this.loading = false;
    }
  },

  close() {
    this.isOpen = false;
    this.sellerId = null;
    this.slots = [];
    this.selectedSlotId = null;
    this.error = null;
    this.successReservation = null;
    this.successActive = false;
    this.reserving = false;
  },

  selectSlot(id) {
    this.selectedSlotId = id;
  },

  async confirm() {
    if (!this.selectedSlotId || this.reserving) return;
    this.reserving = true;
    this.error = null;
    try {
      const res = await reserveSlot(this.selectedSlotId);
      this.successReservation = res;
      this.successActive = isReservationActive(res);
    } catch (err) {
      this.error = err instanceof Error ? err.message : t("commonSvc.reservationFailed");
    } finally {
      this.reserving = false;
    }
  },

  /** "Sohbete Başla" tıklanınca — sadece rezervasyon ŞU AN aktifse chat aç,
   *  yoksa modal'ı kapat ve bilgi göster. */
  openChatAfterReserve() {
    if (!this.successReservation) return;
    if (!this.successActive) {
      // Süre gelmedi — modal'ı kapat, kullanıcı zamanı geldiğinde tekrar tıklasın
      this.close();
      return;
    }
    const sellerId = this.sellerId;
    this.close();
    if (sellerId) {
      window.dispatchEvent(new CustomEvent("chat-popup:open", { detail: { sellerId } }));
    }
  },

  formatSlot,
} as State);

// Global event listener — başka kodlardan tetiklenebilir
window.addEventListener("reservation-modal:open", (e: Event) => {
  const detail = (e as CustomEvent).detail || {};
  (Alpine.store("reservationModal") as State).open({
    sellerId: detail.sellerId,
    sellerName: detail.sellerName,
  });
});
