/**
 * Storefront Notification Poller
 * Görünür UI yok — arka planda 30sn'de bir backend'i kontrol eder,
 * yeni bildirim varsa queueToast() ile gösterir ve okundu işaretler.
 */
import Alpine from 'alpinejs';
import { queueToast } from '../utils/toast';
import type { ToastType } from '../utils/toast';
import { isLoggedIn, waitForAuth } from '../utils/auth';

/** Bildirim türüne göre toast mapping */
const TYPE_MAP: Record<string, { type: ToastType; prefix: string }> = {
  order:   { type: 'success', prefix: 'Sipariş' },
  rfq:     { type: 'info',    prefix: 'Teklif' },
  listing: { type: 'info',    prefix: 'Ürün' },
  stock:   { type: 'warning', prefix: 'Stok' },
  review:  { type: 'info',    prefix: 'Değerlendirme' },
  dispute: { type: 'error',   prefix: 'Uyarı' },
  system:  { type: 'info',    prefix: 'Sistem' },
  promo:   { type: 'success', prefix: 'Kampanya' },
};

const POLL_INTERVAL = 30_000; // 30 saniye

const MAX_CONSECUTIVE_ERRORS = 5;

Alpine.data('notificationPoller', () => ({
  lastCheck: null as string | null,
  intervalId: null as ReturnType<typeof setInterval> | null,
  errorCount: 0,

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
  },

  async poll() {
    // Ardışık hata limiti aşıldıysa polling'i durdur
    if (this.errorCount >= MAX_CONSECUTIVE_ERRORS) {
      console.warn('[NotificationPoller] Too many errors, stopping polling');
      if (this.intervalId) clearInterval(this.intervalId);
      return;
    }

    try {
      // İlk poll'da birikmiş okunmamışları yakalamak için limit yüksek
      const isFirstPoll = !this.lastCheck;
      const params = new URLSearchParams({
        limit: isFirstPoll ? '20' : '5',
        mark_as_read: '1',
      });
      if (this.lastCheck) params.set('since', this.lastCheck);

      const res = await fetch(
        `/api/method/tradehub_core.api.notification.get_new_notifications?${params}`,
        { credentials: 'include' },
      );

      if (!res.ok) {
        this.errorCount++;
        console.warn(`[NotificationPoller] HTTP ${res.status} (${this.errorCount}/${MAX_CONSECUTIVE_ERRORS})`);
        return;
      }

      // Başarılı istek — hata sayacını sıfırla
      this.errorCount = 0;

      const json = await res.json();
      const { data, server_time } = json.message ?? {};

      if (data && data.length > 0) {
        [...data].reverse().forEach((notif: any) => {
          const mapping = TYPE_MAP[notif.type] || TYPE_MAP.system;
          queueToast({
            message: notif.title || notif.message,
            type: mapping.type,
            duration: 5000,
            link: notif.action_url
              ? { text: 'Görüntüle', href: notif.action_url }
              : undefined,
          });
        });
      }

      if (server_time) this.lastCheck = server_time;
    } catch (err) {
      this.errorCount++;
      console.warn(`[NotificationPoller] Error (${this.errorCount}/${MAX_CONSECUTIVE_ERRORS}):`, err);
    }
  },
}));
