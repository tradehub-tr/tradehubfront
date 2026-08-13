/**
 * **S11 · İade talebi** (TUR-116) — alıcı tarafı.
 *
 * İade penceresi kapalıysa form HİÇ render edilmiyor. Uyarı gösterip
 * gönderilebilir bırakmak, backend'in reddedeceği bir talep üretir ve
 * alıcı sebebini anlamaz.
 *
 * Kalem bazlı: alıcı siparişin tamamını değil, bozuk olanı iade ediyor.
 * Miktar teslim alınandan fazla olamaz.
 */
import { t } from "../../i18n";
import { escapeHtml } from "../../utils/sanitize";

interface ReturnableItem {
  item: string;
  item_name: string;
  delivered_qty: number;
  already_returned_qty?: number;
  uom?: string;
}

export interface ReturnRequestProps {
  shipmentName: string;
  items: ReturnableItem[];
  reasons: { value: string; label: string }[];
  /** Kapalıysa form yok — teslimden bu yana geçen gün > return_window_days. */
  windowOpen: boolean;
  windowDays?: number;
}

export function ReturnRequest(props: ReturnRequestProps): string {
  const { shipmentName, items, reasons, windowOpen, windowDays = 14 } = props;

  if (!windowOpen) {
    return `
      <section class="space-y-3">
        <h2 class="text-base font-semibold text-gray-900">${escapeHtml(t("shipment.return.title"))}</h2>
        <div class="rounded-md border border-gray-300 bg-gray-50 p-4">
          <p class="text-sm text-gray-700">${escapeHtml(t("shipment.return.windowClosed", { days: windowDays }))}</p>
          <p class="mt-1 text-xs text-gray-500">${escapeHtml(t("shipment.return.windowClosedHint"))}</p>
        </div>
      </section>`;
  }

  const returnable = items.filter(
    (i) => i.delivered_qty - (i.already_returned_qty ?? 0) > 0
  );

  if (!returnable.length) {
    return `
      <section class="space-y-3">
        <h2 class="text-base font-semibold text-gray-900">${escapeHtml(t("shipment.return.title"))}</h2>
        <div class="rounded-md border border-gray-300 bg-gray-50 p-4">
          <p class="text-sm text-gray-700">${escapeHtml(t("shipment.return.allReturned"))}</p>
        </div>
      </section>`;
  }

  const itemRows = returnable
    .map((row) => {
      const max = row.delivered_qty - (row.already_returned_qty ?? 0);
      return `
        <li class="flex flex-wrap items-center gap-3 py-2">
          <label class="flex flex-1 items-center gap-2">
            <input type="checkbox" x-model="selected" value="${escapeHtml(row.item)}" />
            <span class="text-sm text-gray-800">${escapeHtml(row.item_name)}</span>
          </label>
          <div class="flex items-center gap-2">
            <input type="number" min="1" max="${max}" value="${max}"
                   class="w-20 rounded-md border border-gray-300 px-2 py-1 text-right text-sm tabular-nums"
                   @input="clampQty($event, ${max})" />
            <span class="text-xs text-gray-500">/ ${max} ${escapeHtml(row.uom ?? "")}</span>
          </div>
        </li>`;
    })
    .join("");

  const reasonOptions = reasons
    .map((r) => `<option value="${escapeHtml(r.value)}">${escapeHtml(r.label)}</option>`)
    .join("");

  return `
    <form class="space-y-5" x-data="returnRequest({ shipment: '${escapeHtml(shipmentName)}' })"
          @submit.prevent="submit()">
      <header>
        <h2 class="text-base font-semibold text-gray-900">${escapeHtml(t("shipment.return.title"))}</h2>
        <p class="mt-0.5 text-sm text-gray-600">${escapeHtml(t("shipment.return.subtitle"))}</p>
      </header>

      <section class="rounded-md border border-gray-200 p-4">
        <h3 class="mb-2 text-sm font-semibold text-gray-800">${escapeHtml(t("shipment.return.items"))}</h3>
        <ul class="divide-y divide-gray-100">${itemRows}</ul>
        <p class="mt-2 text-xs text-red-600" x-show="!selected.length" x-cloak>
          ${escapeHtml(t("shipment.return.noItemSelected"))}
        </p>
      </section>

      <label class="block">
        <span class="mb-1 block text-sm font-medium text-gray-800">${escapeHtml(t("shipment.return.reason"))} *</span>
        <select class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" x-model="reason">
          ${reasonOptions}
        </select>
      </label>

      <label class="block">
        <span class="mb-1 block text-sm font-medium text-gray-800">
          ${escapeHtml(t("shipment.return.note"))} *
        </span>
        <textarea rows="3" x-model="note"
                  class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="${escapeHtml(t("shipment.return.notePlaceholder"))}"></textarea>
        <!-- Açıklama zorunlu: satıcı kararını buna göre veriyor, boş bir
             talep karşı tarafta "neden?" sorusuna dönüşüyor. -->
        <span class="mt-1 block text-xs text-gray-500">
          ${escapeHtml(t("shipment.return.noteHint", { min: 10 }))}
        </span>
      </label>

      <div class="flex items-center gap-3">
        <button type="submit" class="th-btn" :disabled="submitting || !canSubmit">
          <span x-text="submitting ? '${escapeHtml(t("shipment.return.submitting"))}' : '${escapeHtml(t("shipment.return.submit"))}'"></span>
        </button>
        <p class="text-xs text-red-600" x-show="error" x-text="error" x-cloak></p>
      </div>
    </form>`;
}
