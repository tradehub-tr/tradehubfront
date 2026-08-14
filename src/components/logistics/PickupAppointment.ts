/**
 * **S3 · Alıcı randevu talebi** (TUR-108).
 *
 * Alıcı teslim alma / satıcı teslimatı kanallarında randevu istiyor.
 *
 * Geçmiş tarih seçilemiyor (`min` niteliği + Alpine kontrolü) — tarayıcı
 * `min`'i yalnız takvim arayüzünde uyguluyor, elle yazılan değeri kabul
 * ediyor. Sunucuya geçersiz tarih göndermemek için iki kat kontrol var.
 */
import { t } from "../../i18n";
import { escapeHtml } from "../../utils/sanitize";

import { formatDateTime } from "./presentation";

export interface PickupAppointmentProps {
  shipmentName: string;
  /** Mevcut randevu — varsa değiştirme, yoksa oluşturma akışı. */
  appointmentAt?: string | null;
  appointmentWindow?: string | null;
  pickupLocation?: string | null;
  /** Seçilebilir zaman aralıkları — backend kapasiteye göre veriyor. */
  slots: { value: string; label: string; available: boolean }[];
  /** Bugünün tarihi (YYYY-MM-DD) — `min` için; bileşen `new Date()` çağırmıyor. */
  today: string;
}

export function PickupAppointment(props: PickupAppointmentProps): string {
  const { shipmentName, appointmentAt, appointmentWindow, pickupLocation, slots, today } = props;

  const slotOptions = slots
    .map(
      (s) =>
        `<option value="${escapeHtml(s.value)}" ${s.available ? "" : "disabled"}>
           ${escapeHtml(s.label)}${s.available ? "" : ` — ${escapeHtml(t("shipment.appointment.full"))}`}
         </option>`
    )
    .join("");

  const hasAll = slots.every((s) => !s.available);

  return `
    <section class="space-y-4" x-data="pickupAppointment({ shipment: '${escapeHtml(shipmentName)}', today: '${escapeHtml(today)}' })">
      <header>
        <h2 class="text-base font-semibold text-gray-900">${escapeHtml(t("shipment.appointment.title"))}</h2>
        <p class="mt-0.5 text-sm text-gray-600">${escapeHtml(t("shipment.appointment.subtitle"))}</p>
      </header>

      ${
        appointmentAt
          ? `<div class="rounded-md border border-sky-200 bg-sky-50 p-4">
               <p class="text-sm font-medium text-sky-900">
                 ${escapeHtml(t("shipment.appointment.current"))}: ${formatDateTime(appointmentAt)}
                 ${appointmentWindow ? ` · ${escapeHtml(appointmentWindow)}` : ""}
               </p>
               ${
                 pickupLocation
                   ? `<p class="mt-1 text-xs text-sky-800">${escapeHtml(pickupLocation)}</p>`
                   : ""
               }
             </div>`
          : ""
      }

      ${
        hasAll
          ? `<div class="rounded-md border border-amber-300 bg-amber-50 p-4">
               <p class="text-sm text-amber-800">${escapeHtml(t("shipment.appointment.noSlots"))}</p>
             </div>`
          : `<div class="grid gap-4 sm:grid-cols-2">
               <label class="block">
                 <span class="mb-1 block text-sm font-medium text-gray-800">
                   ${escapeHtml(t("shipment.appointment.date"))} *
                 </span>
                 <input type="date" x-model="date" min="${escapeHtml(today)}"
                        class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
               </label>
               <label class="block">
                 <span class="mb-1 block text-sm font-medium text-gray-800">
                   ${escapeHtml(t("shipment.appointment.slot"))} *
                 </span>
                 <select x-model="slot" class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                   ${slotOptions}
                 </select>
               </label>
             </div>

             <div class="flex items-center gap-3">
               <button type="button" class="th-btn" :disabled="submitting || !canSubmit" @click="submit()">
                 <span x-text="submitting ? '${escapeHtml(t("shipment.appointment.submitting"))}' : '${escapeHtml(
                   appointmentAt
                     ? t("shipment.appointment.change")
                     : t("shipment.appointment.request")
                 )}'"></span>
               </button>
               <p class="text-xs text-red-600" x-show="error" x-text="error" x-cloak></p>
             </div>`
      }
    </section>`;
}
