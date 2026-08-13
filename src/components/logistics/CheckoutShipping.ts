/**
 * **S13 · Checkout ücret/yöntem gösterimi** (TUR-121).
 *
 * Alıcı ödeme adımında kargo yöntemini seçiyor.
 *
 * SADECE MÜŞTERİYE YANSITILAN TUTAR GÖSTERİLİYOR. Platformun taşıyıcıdan
 * aldığı fiyat (`carrier_cost`) buraya HİÇ gelmiyor — storefront mock
 * verisinde bile yok (üretici `price_quote` fixture'ını storefront'a
 * akıtmıyor, `carrier_cost` taşıdığı için). TUR-121'in ayrım kriteri
 * arayüzde de geçerli.
 *
 * Ücretsiz kargo eşiği ayrıca gösteriliyor: alıcı sepetine biraz daha
 * ekleyerek kargodan kurtulabiliyorsa bunu bilmeli.
 */
import { t } from "../../i18n";
import { escapeHtml } from "../../utils/sanitize";

import { money } from "./presentation";

interface ShippingOption {
  name: string;
  method_name: string;
  shipping_type?: string | null;
  /** Müşteriye yansıtılan tutar. Sıfır = ücretsiz kargo. */
  charge: number;
  currency?: string;
  min_days?: number | null;
  max_days?: number | null;
  available?: boolean;
  unavailable_reason?: string | null;
}

export interface CheckoutShippingProps {
  options: ShippingOption[];
  selected?: string | null;
  /** Ücretsiz kargo eşiği ve sepet tutarı — ikisi de varsa fark gösterilir. */
  freeShippingThreshold?: number | null;
  cartTotal?: number | null;
  currency?: string;
}

export function CheckoutShipping(props: CheckoutShippingProps): string {
  const {
    options,
    selected,
    freeShippingThreshold,
    cartTotal,
    currency = "TRY",
  } = props;

  if (!options.length) {
    return `
      <div class="rounded-md border border-amber-300 bg-amber-50 p-4" role="alert">
        <p class="text-sm text-amber-800">${escapeHtml(t("shipment.checkout.noOptions"))}</p>
        <p class="mt-1 text-xs text-amber-700">${escapeHtml(t("shipment.checkout.noOptionsHint"))}</p>
      </div>`;
  }

  const remainingForFree =
    freeShippingThreshold != null && cartTotal != null && cartTotal < freeShippingThreshold
      ? freeShippingThreshold - cartTotal
      : null;

  const rows = options
    .map((opt) => {
      const disabled = opt.available === false;
      const eta =
        opt.min_days != null && opt.max_days != null
          ? t("shipment.checkout.eta", { min: opt.min_days, max: opt.max_days })
          : null;
      return `
        <li>
          <label class="flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors
                        ${disabled ? "cursor-not-allowed border-gray-200 opacity-60" : "border-gray-200 hover:bg-gray-50"}">
            <input type="radio" name="shipping_method" class="mt-1"
                   value="${escapeHtml(opt.name)}"
                   ${selected === opt.name ? "checked" : ""}
                   ${disabled ? "disabled" : ""} />
            <span class="min-w-0 grow">
              <span class="block text-sm font-medium text-gray-900">${escapeHtml(opt.method_name)}</span>
              ${eta ? `<span class="block text-xs text-gray-500">${escapeHtml(eta)}</span>` : ""}
              ${
                disabled && opt.unavailable_reason
                  ? `<span class="mt-0.5 block text-xs text-amber-700">${escapeHtml(opt.unavailable_reason)}</span>`
                  : ""
              }
            </span>
            <span class="shrink-0 text-sm font-semibold tabular-nums
                         ${opt.charge === 0 ? "text-emerald-700" : "text-gray-900"}">
              ${
                opt.charge === 0
                  ? escapeHtml(t("shipment.checkout.free"))
                  : money(opt.charge, opt.currency ?? currency)
              }
            </span>
          </label>
        </li>`;
    })
    .join("");

  return `
    <section class="space-y-3">
      <h3 class="text-sm font-semibold text-gray-900">${escapeHtml(t("shipment.checkout.title"))}</h3>

      ${
        remainingForFree != null
          ? `<p class="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
               ${escapeHtml(
                 t("shipment.checkout.freeShippingHint", {
                   amount: money(remainingForFree, currency),
                 })
               )}
             </p>`
          : ""
      }

      <ul class="space-y-2">${rows}</ul>

      <!-- Vergi/ek ücret notu: gösterilen tutarın neyi kapsadığı belirsiz
           kalırsa ödeme adımında itiraz doğuyor. -->
      <p class="text-xs text-gray-500">${escapeHtml(t("shipment.checkout.taxNote"))}</p>
    </section>`;
}
