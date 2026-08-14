import Alpine from "alpinejs";

import { t } from "../i18n";

/**
 * S4 teslim onayı — kod girişi ve gönderim.
 *
 * Kod SUNUCUYA gönderiliyor, istemcide doğrulanmıyor: doğrulama istemcide
 * yapılsaydı kodun kendisi yanıtta bulunmak zorunda kalırdı ve tek
 * kullanımlık olmaktan çıkardı.
 *
 * Backend ucu Faz F'te gelecek; şimdilik `onConfirm` dışarıdan enjekte
 * ediliyor (Storybook'ta sahte, sayfada gerçek çağrı).
 */
interface DeliveryConfirmState {
  shipment: string;
  requiresCode: boolean;
  code: string;
  error: string;
  submitting: boolean;
  confirm(): Promise<void>;
}

Alpine.data(
  "deliveryConfirm",
  (options: { shipment: string; requiresCode: boolean }) =>
    ({
      shipment: options.shipment,
      requiresCode: options.requiresCode,
      code: "",
      error: "",
      submitting: false,

      async confirm(this: DeliveryConfirmState) {
        if (this.submitting) return;
        if (this.requiresCode && this.code.trim().length < 4) {
          this.error = t("shipment.confirm.codeTooShort");
          return;
        }

        this.submitting = true;
        this.error = "";
        try {
          // Faz F: tradehub_core.api.v1.shipment.confirm_delivery
          const confirmFn = (window as unknown as Record<string, unknown>)
            .__thConfirmDelivery as
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
          this.error = (e as Error)?.message || t("shipment.confirm.failed");
        } finally {
          this.submitting = false;
        }
      },
    }) as DeliveryConfirmState
);
