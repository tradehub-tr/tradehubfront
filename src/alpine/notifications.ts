/**
 * Storefront Notification Poller
 * Görünür UI yok — arka planda 30sn'de bir backend'i kontrol eder,
 * yeni bildirim varsa queueToast() ile gösterir.
 *
 * - İlk poll'da toast atılmaz (sadece server_time alınır), sonraki polling'lerde
 *   gerçekten YENİ gelen bildirimler için toast (#1 fix — sayfa her açılışında
 *   birikmiş bildirimlerin toast spam'i engellenir).
 * - Backend `since + is_read=0` filtre kombinasyonu: drawer'dan okunmuş
 *   bildirim tekrar toast'a düşmez (#2 fix — ilgili backend tarafı).
 * - Ardışık hata sonrası exponential backoff + recovery: kalıcı stop yerine
 *   5 dk sonra yeniden denenir (#3 fix).
 * - `action_url` whitelist: yalnız relative `/...` veya `https://` izin verilir
 *   (#5 fix — phishing/javascript: koruması).
 */
import Alpine from "alpinejs";
import { queueToast } from "../utils/toast";
import type { ToastType } from "../utils/toast";
import { isLoggedIn, waitForAuth } from "../utils/auth";

/** Bildirim türüne göre toast mapping */
const TYPE_MAP: Record<string, { type: ToastType; prefix: string }> = {
  order: { type: "success", prefix: "Sipariş" },
  rfq: { type: "info", prefix: "Teklif" },
  listing: { type: "info", prefix: "Ürün" },
  stock: { type: "warning", prefix: "Stok" },
  review: { type: "info", prefix: "Değerlendirme" },
  dispute: { type: "warning", prefix: "Destek" },
  system: { type: "info", prefix: "Sistem" },
  promo: { type: "success", prefix: "Kampanya" },
};

const POLL_INTERVAL = 30_000; // 30 saniye
const MAX_CONSECUTIVE_ERRORS = 5;
const RECOVERY_BACKOFF_MS = 5 * 60_000; // 5 dk sonra error sayacı sifirlanir

/**
 * Action URL guvenli mi? Yalnız relative ("/...") ya da "https://" izinli.
 * "javascript:", "data:", "http:" (insecure) reddedilir — phishing/XSS koruma.
 */
function isSafeActionUrl(url: string | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  // Relative path
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return true;
  // Mutlak HTTPS
  if (trimmed.startsWith("https://")) {
    try {
      const u = new URL(trimmed);
      // protocol: javascript:, vbscript:, data: ... reject
      return u.protocol === "https:";
    } catch {
      return false;
    }
  }
  return false;
}

Alpine.data("notificationPoller", () => ({
  lastCheck: null as string | null,
  intervalId: null as ReturnType<typeof setInterval> | null,
  recoveryTimerId: null as ReturnType<typeof setTimeout> | null,
  errorCount: 0,
  /** İlk poll tamamlandı mı (toast atma onayı) */
  primed: false,

  async init() {
    await waitForAuth();
    if (!isLoggedIn()) return;

    this.poll();
    this.intervalId = setInterval(() => {
      if (!document.hidden) this.poll();
    }, POLL_INTERVAL);
  },

  destroy() {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.recoveryTimerId) clearTimeout(this.recoveryTimerId);
  },

  /** Hata sayacı limit aşınca interval durdur, 5 dk sonra otomatik aç (#3) */
  _scheduleRecovery() {
    if (this.recoveryTimerId) return;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.warn(
      `[NotificationPoller] ${MAX_CONSECUTIVE_ERRORS} ardışık hata — ${RECOVERY_BACKOFF_MS / 60000}dk sonra yeniden denenecek`
    );
    this.recoveryTimerId = setTimeout(() => {
      this.recoveryTimerId = null;
      this.errorCount = 0;
      // Yeniden interval başlat (init mantığı)
      this.poll();
      this.intervalId = setInterval(() => {
        if (!document.hidden) this.poll();
      }, POLL_INTERVAL);
    }, RECOVERY_BACKOFF_MS);
  },

  async poll() {
    if (this.errorCount >= MAX_CONSECUTIVE_ERRORS) {
      this._scheduleRecovery();
      return;
    }

    try {
      const params = new URLSearchParams({ limit: "5" });
      if (this.lastCheck) params.set("since", this.lastCheck);

      const res = await fetch(
        `/api/method/tradehub_core.api.notification.get_new_notifications?${params}`,
        { credentials: "include" }
      );

      if (!res.ok) {
        this.errorCount++;
        console.warn(
          `[NotificationPoller] HTTP ${res.status} (${this.errorCount}/${MAX_CONSECUTIVE_ERRORS})`
        );
        if (this.errorCount >= MAX_CONSECUTIVE_ERRORS) this._scheduleRecovery();
        return;
      }

      this.errorCount = 0;

      const json = await res.json();
      const { data, server_time } = json.message ?? {};

      // İlk poll: yalnız server_time'i kaydet, toast ATMA — sayfa açılışında
      // birikmiş bildirimlerin spam'ini engelle (#1).
      if (!this.primed) {
        this.primed = true;
        if (server_time) this.lastCheck = server_time;
        return;
      }

      if (data && data.length > 0) {
        [...data].reverse().forEach((notif: any) => {
          const mapping = TYPE_MAP[notif.type] || TYPE_MAP.system;
          // action_url guvenli ise link goster; degilse sadece toast
          const safeUrl = isSafeActionUrl(notif.action_url) ? notif.action_url : undefined;
          queueToast({
            message: notif.title || notif.message,
            type: mapping.type,
            duration: 5000,
            link: safeUrl ? { text: "Görüntüle", href: safeUrl } : undefined,
          });
        });
      }

      if (server_time) this.lastCheck = server_time;
    } catch (err) {
      this.errorCount++;
      console.warn(
        `[NotificationPoller] Error (${this.errorCount}/${MAX_CONSECUTIVE_ERRORS}):`,
        err
      );
      if (this.errorCount >= MAX_CONSECUTIVE_ERRORS) this._scheduleRecovery();
    }
  },
}));
