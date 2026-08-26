import Alpine from "alpinejs";

import { t } from "../i18n";

/**
 * S4 teslim onayı — kod girişi, süre sayacı ve gönderim.
 *
 * Kod SUNUCUYA gönderiliyor, istemcide doğrulanmıyor: doğrulama istemcide
 * yapılsaydı kodun kendisi yanıtta bulunmak zorunda kalırdı ve tek
 * kullanımlık olmaktan çıkardı.
 *
 * Backend ucu 07-BE'de gelecek; şimdilik `window.__thConfirmDelivery`
 * dışarıdan enjekte ediliyor (Storybook'ta sahte, sayfada
 * `logisticsPickupMock.ts`).
 *
 * ── Süre sayacı KAPI DEĞİL, bilgilendirme (sözleşme §4.2) ──
 * Geri sayım istemci saatiyle hesaplanıyor ve saat kayması olabiliyor. Sayaç
 * sıfırlandığında ekran süre dolumu bloğuna geçiyor ama gönderim yolu
 * kapanmıyor — reddi sunucu veriyor. Ekranı sayaç yüzünden kilitlemek, saati
 * beş dakika ileri olan bir kullanıcıyı hiç denemeden dışarıda bırakırdı.
 */
interface DeliveryConfirmState {
  shipment: string;
  requiresCode: boolean;
  expiresAt: string | null;
  code: string;
  error: string;
  submitting: boolean;
  resending: boolean;
  expired: boolean;
  remaining: string;
  timer: number;
  init(): void;
  destroy(): void;
  tick(): void;
  confirm(): Promise<void>;
  resend(): Promise<void>;
}

/** `YYYY-MM-DD HH:mm:ss` → epoch ms. Safari `-` ayracını sevmiyor, `T` şart. */
function parseContractDate(value: string): number {
  return new Date(value.replace(" ", "T")).getTime();
}

Alpine.data(
  "deliveryConfirm",
  (options: { shipment: string; requiresCode: boolean; expiresAt?: string | null }) =>
    ({
      shipment: options.shipment,
      requiresCode: options.requiresCode,
      expiresAt: options.expiresAt ?? null,
      code: "",
      error: "",
      submitting: false,
      resending: false,
      expired: false,
      remaining: "",
      timer: 0,

      init(this: DeliveryConfirmState) {
        if (!this.expiresAt) return;
        this.tick();
        this.timer = window.setInterval(() => this.tick(), 1000);
      },

      /** Alpine bileşen DOM'dan kalkarken çağırıyor — sayaç arkada kalmasın. */
      destroy(this: DeliveryConfirmState) {
        if (this.timer) window.clearInterval(this.timer);
      },

      tick(this: DeliveryConfirmState) {
        if (!this.expiresAt) return;
        const kalanMs = parseContractDate(this.expiresAt) - Date.now();
        if (kalanMs <= 0) {
          this.expired = true;
          this.remaining = "";
          if (this.timer) window.clearInterval(this.timer);
          return;
        }
        const toplamSn = Math.floor(kalanMs / 1000);
        const dk = String(Math.floor(toplamSn / 60)).padStart(2, "0");
        const sn = String(toplamSn % 60).padStart(2, "0");
        this.remaining = `${dk}:${sn}`;
      },

      async confirm(this: DeliveryConfirmState) {
        if (this.submitting) return;
        if (this.requiresCode && this.code.trim().length < 4) {
          this.error = t("shipment.confirm.codeTooShort");
          return;
        }

        this.submitting = true;
        this.error = "";
        try {
          // 07-BE: tradehub_core.api.v1.pickup.confirm_delivery
          const confirmFn = (window as unknown as Record<string, unknown>).__thConfirmDelivery as
            | ((payload: { shipment: string; code: string }) => Promise<void>)
            | undefined;

          if (!confirmFn) {
            // Uç yokken sessizce "başarılı" demek YANLIŞ olurdu — kullanıcı
            // teslim aldığını sanır, kayıt oluşmaz.
            this.error = t("shipment.confirm.notAvailable");
            return;
          }

          await confirmFn({ shipment: this.shipment, code: this.code.trim() });
          window.location.reload();
        } catch (e) {
          const hata = e as Error;
          // Süresi dolmuş kod "yanlış kod" değil: ekran süre dolumu bloğuna
          // geçiyor, deneme hakkı yanmıyor (sözleşme §2.3).
          if (hata?.name === "DELIVERY_CODE_EXPIRED") {
            this.expired = true;
            this.remaining = "";
            return;
          }
          this.error = hata?.message || t("shipment.confirm.failed");
        } finally {
          this.submitting = false;
        }
      },

      async resend(this: DeliveryConfirmState) {
        if (this.resending) return;
        this.resending = true;
        this.error = "";
        try {
          // 07-BE: tradehub_core.api.v1.pickup.resend_delivery_code
          const resendFn = (window as unknown as Record<string, unknown>).__thResendDeliveryCode as
            | (() => Promise<void>)
            | undefined;

          if (!resendFn) {
            this.error = t("shipment.confirm.notAvailable");
            return;
          }
          await resendFn();
          window.location.reload();
        } catch (e) {
          this.error = (e as Error)?.message || t("shipment.confirm.resendFailed");
        } finally {
          this.resending = false;
        }
      },
    }) as DeliveryConfirmState
);
