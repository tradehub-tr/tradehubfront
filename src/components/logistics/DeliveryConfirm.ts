/**
 * **S4 · Teslim onayı + teslim kodu** (TUR-108).
 *
 * Alıcı teslim alırken tek kullanımlık kodu kuryeye okutuyor.
 *
 * KODUN DEĞERİ SUNUCUDAN GELMİYOR — bu ekran kodu GÖSTERMİYOR, alıcının
 * girmesini istiyor. Sözleşme yalnız `delivery_code_status` döndürüyor
 * (`not_required | pending | verified | failed`). Kodu yanıtta taşımak onu
 * tek kullanımlık olmaktan çıkarırdı: tarayıcı geçmişinde, ara sunucu
 * loglarında ve ekran görüntüsünde dolaşırdı.
 *
 * Ödeme kapısı da burada: `payment_required_before_delivery` açıkken ödeme
 * tamamlanmadan onay formu HİÇ render edilmiyor. Uyarı gösterip yine de
 * tıklanabilir bırakmak, günün sonunda tıklanır.
 */
import { t } from "../../i18n";
import { escapeHtml } from "../../utils/sanitize";

import { formatDateTime, statusBadge } from "./presentation";

export interface DeliveryConfirmProps {
  shipmentName: string;
  status: string;
  deliveryCodeStatus: "not_required" | "pending" | "verified" | "failed";
  deliveryCodeAttempts?: number;
  paymentRequired?: boolean;
  paymentStatus?: "unpaid" | "paid" | "waived";
  appointmentAt?: string | null;
  pickupLocation?: string | null;
}

/** Kalan deneme hakkı — üst sınır sözleşmedeki `max_delivery_attempts`. */
const MAX_ATTEMPTS = 3;

export function DeliveryConfirm(props: DeliveryConfirmProps): string {
  const {
    shipmentName,
    status,
    deliveryCodeStatus,
    deliveryCodeAttempts = 0,
    paymentRequired = false,
    paymentStatus = "paid",
    appointmentAt,
    pickupLocation,
  } = props;

  const paymentBlocked = paymentRequired && paymentStatus !== "paid" && paymentStatus !== "waived";
  const alreadyDelivered = status === "Delivered" || deliveryCodeStatus === "verified";
  const attemptsLeft = Math.max(0, MAX_ATTEMPTS - deliveryCodeAttempts);
  const lockedOut = deliveryCodeStatus === "failed" && attemptsLeft === 0;

  const header = `
    <header class="flex flex-wrap items-center gap-2">
      <h2 class="text-base font-semibold text-gray-900">${escapeHtml(t("shipment.confirm.title"))}</h2>
      ${statusBadge(status)}
      <code class="ms-auto font-mono text-xs text-gray-500">${escapeHtml(shipmentName)}</code>
    </header>`;

  const context = `
    <dl class="grid gap-3 text-sm sm:grid-cols-2">
      ${
        appointmentAt
          ? `<div class="rounded-md border border-gray-200 p-3">
               <dt class="text-xs text-gray-500">${escapeHtml(t("shipment.confirm.appointment"))}</dt>
               <dd class="mt-0.5 font-medium text-gray-800">${formatDateTime(appointmentAt)}</dd>
             </div>`
          : ""
      }
      ${
        pickupLocation
          ? `<div class="rounded-md border border-gray-200 p-3">
               <dt class="text-xs text-gray-500">${escapeHtml(t("shipment.confirm.location"))}</dt>
               <dd class="mt-0.5 font-medium text-gray-800">${escapeHtml(pickupLocation)}</dd>
             </div>`
          : ""
      }
    </dl>`;

  // ── Teslim edilmiş: form yok, geçmiş var ──
  if (alreadyDelivered) {
    return `
      <section class="space-y-4">
        ${header}
        <div class="rounded-md border border-emerald-200 bg-emerald-50 p-4">
          <p class="text-sm font-medium text-emerald-800">${escapeHtml(t("shipment.confirm.done"))}</p>
          <p class="mt-1 text-xs text-emerald-700">${escapeHtml(t("shipment.confirm.doneHint"))}</p>
        </div>
        ${context}
      </section>`;
  }

  // ── Ödeme kapısı: form HİÇ render edilmiyor ──
  if (paymentBlocked) {
    return `
      <section class="space-y-4">
        ${header}
        <div class="rounded-md border border-red-300 bg-red-50 p-4" role="alert">
          <p class="text-sm font-medium text-red-800">${escapeHtml(t("shipment.confirm.paymentBlocked"))}</p>
          <p class="mt-1 text-xs text-red-700">${escapeHtml(t("shipment.confirm.paymentBlockedHint"))}</p>
          <a href="/pages/dashboard/orders.html" class="th-btn th-btn-sm mt-3 inline-flex">
            ${escapeHtml(t("shipment.confirm.goToPayment"))}
          </a>
        </div>
        ${context}
      </section>`;
  }

  // ── Kod gerekmiyor: tek tuşla onay ──
  if (deliveryCodeStatus === "not_required") {
    return `
      <section class="space-y-4" x-data="deliveryConfirm({ shipment: '${escapeHtml(shipmentName)}', requiresCode: false })">
        ${header}
        ${context}
        <p class="text-sm text-gray-600">${escapeHtml(t("shipment.confirm.noCodeHint"))}</p>
        <button type="button" class="th-btn" :disabled="submitting" @click="confirm()">
          <span x-text="submitting ? '${escapeHtml(t("shipment.confirm.submitting"))}' : '${escapeHtml(t("shipment.confirm.action"))}'"></span>
        </button>
      </section>`;
  }

  // ── Kod girişi ──
  return `
    <section class="space-y-4" x-data="deliveryConfirm({ shipment: '${escapeHtml(shipmentName)}', requiresCode: true })">
      ${header}
      ${context}

      ${
        lockedOut
          ? `<div class="rounded-md border border-red-300 bg-red-50 p-4" role="alert">
               <p class="text-sm font-medium text-red-800">${escapeHtml(t("shipment.confirm.lockedOut"))}</p>
               <p class="mt-1 text-xs text-red-700">${escapeHtml(t("shipment.confirm.lockedOutHint"))}</p>
             </div>`
          : `<div class="rounded-md border border-gray-200 p-4">
               <label class="block">
                 <span class="mb-1 block text-sm font-medium text-gray-800">
                   ${escapeHtml(t("shipment.confirm.codeLabel"))}
                 </span>
                 <!-- inputmode=numeric: mobilde sayısal klavye açılır, kod
                      rakamsal. autocomplete=off — kod tek kullanımlık,
                      tarayıcının kaydetmesi anlamsız ve riskli. -->
                 <input type="text" inputmode="numeric" autocomplete="off" maxlength="6"
                        class="w-40 rounded-md border border-gray-300 px-3 py-2 text-center font-mono text-lg tracking-widest"
                        x-model="code" @input="error = ''" />
               </label>
               <p class="mt-1 text-xs text-gray-500">${escapeHtml(t("shipment.confirm.codeHint"))}</p>
               ${
                 deliveryCodeAttempts > 0
                   ? `<p class="mt-1 text-xs text-amber-700">${escapeHtml(
                       t("shipment.confirm.attemptsLeft", { count: attemptsLeft })
                     )}</p>`
                   : ""
               }
               <p class="mt-1 text-xs text-red-600" x-show="error" x-text="error" x-cloak></p>

               <button type="button" class="th-btn mt-3" :disabled="submitting || code.length < 4"
                       @click="confirm()">
                 <span x-text="submitting ? '${escapeHtml(t("shipment.confirm.submitting"))}' : '${escapeHtml(t("shipment.confirm.action"))}'"></span>
               </button>
             </div>`
      }
    </section>`;
}
