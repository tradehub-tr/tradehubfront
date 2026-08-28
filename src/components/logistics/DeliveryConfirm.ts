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
 *
 * ── 07-FE eklemeleri (2026-08-26) ──
 * · `maxAttempts` artık prop — eskiden dosyada sabit `3` yazıyordu ve yorumu
 *   sözleşmede **olmayan** bir alana atıf yapıyordu (07-FE analizi §3.3).
 * · `expiresAt` ile süre sayacı ve süre dolumu ekranı geldi. Alan sözleşmede
 *   yok (B1 borcu); **gelmezse bu bölümler hiç çizilmez**, ekranın kalanı
 *   aynı çalışır.
 */
import { t } from "../../i18n";
import { escapeHtml } from "../../utils/sanitize";

import { NotWiredNotice } from "./NotWiredNotice";
import { formatDateTime, statusBadge } from "./presentation";

export interface DeliveryConfirmProps {
  shipmentName: string;
  status: string;
  deliveryCodeStatus: "not_required" | "pending" | "verified" | "failed";
  deliveryCodeAttempts?: number;
  /** Sözleşme §1.2 · B2. Gelmezse 3 varsayılır — bugünkü davranış. */
  maxAttempts?: number;
  /** Sözleşme §1.2 · B1. `null` ise süre bölümleri HİÇ çizilmez. */
  expiresAt?: string | null;
  paymentRequired?: boolean;
  paymentStatus?: "unpaid" | "paid" | "waived";
  appointmentAt?: string | null;
  pickupLocation?: string | null;
  /**
   * Teslim onayı ucu bağlı mı (07-BE · `api.v1.pickup.confirm_delivery`).
   *
   * `false` iken form ve düğmeler HİÇ çizilmiyor. Eskiden gerçek modda
   * `delivery_code_status` gelmediği için `"not_required"` varsayılıyor ve
   * "Teslim aldım" düğmesi çiziliyordu; tıklayan alıcı "bu özellik henüz
   * kullanıma açılmadı" cevabı alıyordu — ölü düğme.
   */
  wired?: boolean;
}

/** Alan gelmediğinde varsayılan üst sınır (sözleşme §1.2 · §4.1). */
const VARSAYILAN_MAX_ATTEMPTS = 3;

export function DeliveryConfirm(props: DeliveryConfirmProps): string {
  const {
    shipmentName,
    status,
    deliveryCodeStatus,
    deliveryCodeAttempts = 0,
    maxAttempts = VARSAYILAN_MAX_ATTEMPTS,
    expiresAt = null,
    paymentRequired = false,
    paymentStatus = "paid",
    appointmentAt,
    pickupLocation,
    wired = true,
  } = props;

  const paymentBlocked = paymentRequired && paymentStatus !== "paid" && paymentStatus !== "waived";
  const alreadyDelivered = status === "Delivered" || deliveryCodeStatus === "verified";
  const attemptsLeft = Math.max(0, maxAttempts - deliveryCodeAttempts);
  const lockedOut = attemptsLeft === 0;

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

  // ── Uç yok: form yerine "henüz bağlı değil" ──
  //
  // Teslim edilmiş sevkiyatın özeti uçsuz da doğru (durum sevkiyattan
  // geliyor), o yüzden bu kapı `alreadyDelivered`'dan SONRA.
  if (!wired) {
    return `
      <section class="space-y-4">
        ${header}
        ${context}
        ${NotWiredNotice({
          title: t("shipment.confirm.title"),
          endpoint: "api.v1.pickup.confirm_delivery",
        })}
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
        <button type="button" class="th-btn" :disabled="submitting" @click="confirm()" data-testid="confirm-no-code">
          <span x-text="submitting ? '${escapeHtml(t("shipment.confirm.submitting"))}' : '${escapeHtml(t("shipment.confirm.action"))}'"></span>
        </button>
      </section>`;
  }

  // ── Deneme hakkı bitti: son durak, çıkış yok ──
  //
  // Kilit süre dolumundan ÖNCE geliyor: hakkı bitmiş bir kullanıcıya "yeni kod
  // iste" demek, tıklayınca yine kilide çarpacağı bir yol göstermek olurdu.
  if (lockedOut) {
    return `
      <section class="space-y-4">
        ${header}
        ${context}
        <div class="rounded-md border border-red-300 bg-red-50 p-4" role="alert" data-testid="confirm-locked">
          <p class="text-sm font-medium text-red-800">${escapeHtml(t("shipment.confirm.lockedOut"))}</p>
          <p class="mt-1 text-xs text-red-700">${escapeHtml(t("shipment.confirm.lockedOutHint"))}</p>
        </div>
      </section>`;
  }

  // ── Kod girişi ──
  //
  // Süre dolumu bloğu da DOM'a giriyor ve Alpine ikisi arasında geçiş yapıyor:
  // sayaç sıfırlandığında sayfa yenilenmeden ekran doğru hâle geçsin. Yalnız
  // sunucudan gelen duruma bakılsaydı, kullanıcı süresi dolmuş bir kodu
  // yazmaya devam eder ve ancak gönderdiğinde öğrenirdi.
  //
  // `expiresAt` yoksa (B1 alanı gelmemişse) `hasExpiry: false` — sayaç satırı
  // ve süre dolumu bloğu hiç çizilmez.
  const alpineArgs = `deliveryConfirm({ shipment: '${escapeHtml(shipmentName)}', requiresCode: true, expiresAt: ${
    expiresAt ? `'${escapeHtml(expiresAt)}'` : "null"
  } })`;

  return `
    <section class="space-y-4" x-data="${alpineArgs}">
      ${header}
      ${context}

      ${
        expiresAt
          ? `<div class="rounded-md border border-amber-300 bg-amber-50 p-4" x-show="expired" x-cloak
                  data-testid="confirm-expired" role="status">
               <p class="text-sm font-medium text-amber-900">${escapeHtml(t("shipment.confirm.codeExpired"))}</p>
               <p class="mt-1 text-xs text-amber-800">${escapeHtml(t("shipment.confirm.codeExpiredHint"))}</p>
               <button type="button" class="th-btn th-btn-sm mt-3" :disabled="resending" @click="resend()"
                       data-testid="confirm-resend">
                 <span x-text="resending ? '${escapeHtml(t("shipment.confirm.resending"))}' : '${escapeHtml(t("shipment.confirm.resendCode"))}'"></span>
               </button>
               <p class="mt-1 text-xs text-red-600" role="alert" x-show="error" x-text="error" x-cloak></p>
             </div>`
          : ""
      }

      <div class="rounded-md border border-gray-200 p-4" ${expiresAt ? 'x-show="!expired"' : ""}
           data-testid="confirm-code-form">
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-gray-800">
            ${escapeHtml(t("shipment.confirm.codeLabel"))}
          </span>
          <!-- inputmode=numeric: mobilde sayısal klavye açılır, kod
               rakamsal. autocomplete=off — kod tek kullanımlık,
               tarayıcının kaydetmesi anlamsız ve riskli. -->
          <!-- aria-describedby: ipucu, geri sayım ve kalan hak metinleri
               görsel olarak inputun ALTINDA duruyor; ekran okuyucu onları
               ancak bu bağla duyuruyor. -->
          <input type="text" inputmode="numeric" autocomplete="off" maxlength="6"
                 aria-describedby="teslim-kodu-ipucu"
                 class="w-40 rounded-md border border-gray-300 px-3 py-2 text-center font-mono text-lg tracking-widest"
                 x-model="code" @input="error = ''" data-testid="confirm-code-input" />
        </label>
        <p id="teslim-kodu-ipucu" class="mt-1 text-xs text-gray-500">${escapeHtml(t("shipment.confirm.codeHint"))}</p>
        ${
          expiresAt
            ? `<p class="mt-1 text-xs text-gray-500" x-show="remaining" x-cloak data-testid="confirm-countdown"
                    x-text="'${escapeHtml(t("shipment.confirm.expiresIn", { time: "__T__" }))}'.replace('__T__', remaining)"></p>`
            : ""
        }
        ${
          deliveryCodeAttempts > 0
            ? `<p class="mt-1 text-xs text-amber-700" data-testid="confirm-attempts">${escapeHtml(
                t("shipment.confirm.attemptsLeft", { count: attemptsLeft })
              )}</p>`
            : ""
        }
        <p class="mt-1 text-xs text-red-600" role="alert" x-show="error" x-text="error" x-cloak></p>

        <button type="button" class="th-btn mt-3" :disabled="submitting || code.length < 4"
                @click="confirm()" data-testid="confirm-submit">
          <span x-text="submitting ? '${escapeHtml(t("shipment.confirm.submitting"))}' : '${escapeHtml(t("shipment.confirm.action"))}'"></span>
        </button>
      </div>
    </section>`;
}
