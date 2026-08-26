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

import { NotWiredNotice } from "./NotWiredNotice";
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
  /**
   * Randevu ucu bağlı mı (07-BE · `api.v1.pickup.list_appointment_slots`).
   *
   * `false` iken form çizilmiyor. Boş `slots` dizisi ile "hepsi dolu" aynı
   * ekrana düşüyordu: uç yokken alıcı "uygun randevu kalmadı" okuyordu, oysa
   * sistem hiç bakmamıştı. `NotWiredNotice`'in var oluş gerekçesi tam da bu.
   */
  wired?: boolean;
}

export function PickupAppointment(props: PickupAppointmentProps): string {
  const {
    shipmentName,
    appointmentAt,
    appointmentWindow,
    pickupLocation,
    slots,
    today,
    wired = true,
  } = props;

  const slotOptions = [`<option value="">${escapeHtml(t("shipment.appointment.slot"))}…</option>`]
    .concat(
      slots.map(
        (s) =>
          `<option value="${escapeHtml(s.value)}" ${s.available ? "" : "disabled"}>
           ${escapeHtml(s.label)}${s.available ? "" : ` — ${escapeHtml(t("shipment.appointment.full"))}`}
         </option>`
      )
    )
    .join("");

  const hasAll = slots.every((s) => !s.available);

  const baslik = `
      <header>
        <h2 class="text-base font-semibold text-gray-900">${escapeHtml(t("shipment.appointment.title"))}</h2>
        <p class="mt-0.5 text-sm text-gray-600">${escapeHtml(t("shipment.appointment.subtitle"))}</p>
      </header>`;

  // ── Uç yok: form yerine "henüz bağlı değil" ──
  if (!wired) {
    return `
      <section class="space-y-4">
        ${baslik}
        ${
          pickupLocation
            ? `<div class="rounded-md border border-gray-200 p-3">
                 <dt class="text-xs text-gray-500">${escapeHtml(t("shipment.appointment.location"))}</dt>
                 <dd class="mt-0.5 text-sm font-medium text-gray-800">${escapeHtml(pickupLocation)}</dd>
               </div>`
            : ""
        }
        ${NotWiredNotice({
          title: t("shipment.appointment.title"),
          endpoint: "api.v1.pickup.list_appointment_slots",
        })}
      </section>`;
  }

  return `
    <section class="space-y-4" data-testid="appointment-form" x-data="pickupAppointment({ shipment: '${escapeHtml(shipmentName)}', today: '${escapeHtml(today)}' })">
      ${baslik}

      ${
        !appointmentAt && pickupLocation
          ? `<div class="rounded-md border border-gray-200 p-3" data-testid="appointment-location">
               <dt class="text-xs text-gray-500">${escapeHtml(t("shipment.appointment.location"))}</dt>
               <dd class="mt-0.5 text-sm font-medium text-gray-800">${escapeHtml(pickupLocation)}</dd>
             </div>`
          : ""
      }

      ${
        appointmentAt
          ? `<div class="rounded-md border border-sky-200 bg-sky-50 p-4" data-testid="appointment-current">
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
          ? `<div class="rounded-md border border-amber-300 bg-amber-50 p-4" data-testid="appointment-no-slots" role="status">
               <p class="text-sm text-amber-800">${escapeHtml(t("shipment.appointment.noSlots"))}</p>
               <p class="mt-1 text-xs text-amber-700">${escapeHtml(t("shipment.appointment.noSlotsHint"))}</p>
             </div>`
          : `<div class="grid gap-4 sm:grid-cols-2">
               <label class="block">
                 <span class="mb-1 block text-sm font-medium text-gray-800">
                   ${escapeHtml(t("shipment.appointment.date"))} *
                 </span>
                 <input type="date" x-model="date" min="${escapeHtml(today)}" required aria-required="true"
                        data-testid="appointment-date"
                        class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
               </label>
               <label class="block">
                 <span class="mb-1 block text-sm font-medium text-gray-800">
                   ${escapeHtml(t("shipment.appointment.slot"))} *
                 </span>
                 <select x-model="slot" required aria-required="true" data-testid="appointment-slot"
                         class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                   ${slotOptions}
                 </select>
               </label>
             </div>

             <div class="flex items-center gap-3">
               <button type="button" class="th-btn" data-testid="appointment-submit"
                       :disabled="submitting || !canSubmit" @click="submit()">
                 <span x-text="submitting ? '${escapeHtml(t("shipment.appointment.submitting"))}' : '${escapeHtml(
                   appointmentAt
                     ? t("shipment.appointment.change")
                     : t("shipment.appointment.request")
                 )}'"></span>
               </button>
               <p class="text-xs text-red-600" role="alert" x-show="error" x-text="error" x-cloak></p>
             </div>`
      }
    </section>`;
}
