/**
 * **S5 · Takip zaman çizelgesi** (TUR-112).
 *
 * Alıcının gördüğü sürüm — admin panelindeki `EventTimeline`'dan iki farkı
 * var, ikisi de bilinçli:
 *
 *   1. **Ham taşıyıcı kodu GÖSTERİLMİYOR.** Operasyon eşlemeyi denetlemek
 *      için `carrier_status_code`'u görmeli; alıcı için "160" bir anlam
 *      taşımıyor, yalnız gürültü.
 *   2. **Olay kaynağı (manuel/api/webhook) GÖSTERİLMİYOR.** İç işleyiş.
 *      Alıcı "kargo şubeye ulaştı"yı okur, bunu kimin bildirdiğini değil.
 *
 * Gösterilen: durum, zaman, konum, açıklama. Sözleşme daha fazlasını
 * döndürse de burada süzülüyor.
 */
import { t } from "../../i18n";
import { escapeHtml } from "../../utils/sanitize";

import { emptyState, formatDateTime, statusBadge, TERMINAL_STATUSES } from "./presentation";

interface TrackingEvent {
  event_time: string;
  status: string;
  location?: string | null;
  description?: string | null;
  exception_code?: string | null;
}

export interface TrackingTimelineProps {
  shipmentName: string;
  trackingNumber?: string | null;
  carrier?: string | null;
  events: TrackingEvent[];
  /** En yeni olay üstte mi? Alıcı genelde son durumu arıyor. */
  newestFirst?: boolean;
}

export function TrackingTimeline(props: TrackingTimelineProps): string {
  const { shipmentName, trackingNumber, carrier, events, newestFirst = true } = props;

  if (!events.length) {
    return emptyState(t("shipment.tracking.empty"), t("shipment.tracking.emptyHint"));
  }

  const ordered = [...events].sort((a, b) =>
    String(a.event_time).localeCompare(String(b.event_time))
  );
  if (newestFirst) ordered.reverse();

  const latest = newestFirst ? ordered[0] : ordered[ordered.length - 1];
  const isDone = TERMINAL_STATUSES.includes(latest.status);

  const rows = ordered
    .map((event, index) => {
      const isLatest = index === 0 && newestFirst;
      return `
        <li class="flex gap-3">
          <div class="flex flex-col items-center">
            <span class="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
              isLatest ? "bg-indigo-500 ring-4 ring-indigo-100" : "bg-gray-300"
            }"></span>
            ${index < ordered.length - 1 ? '<span class="w-px grow bg-gray-200"></span>' : ""}
          </div>
          <div class="min-w-0 grow pb-5">
            <div class="flex flex-wrap items-center gap-2">
              ${statusBadge(event.status)}
              <span class="text-xs text-gray-500">${formatDateTime(event.event_time)}</span>
            </div>
            ${
              event.description
                ? `<p class="mt-1 text-sm text-gray-700">${escapeHtml(event.description)}</p>`
                : ""
            }
            ${
              event.location
                ? `<p class="mt-0.5 text-xs text-gray-500">${escapeHtml(event.location)}</p>`
                : ""
            }
            ${
              event.exception_code
                ? `<p class="mt-1 rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">
                     ${escapeHtml(t(`shipment.exception.${event.exception_code}`, {
                       defaultValue: t("shipment.tracking.exceptionGeneric"),
                     }))}
                   </p>`
                : ""
            }
          </div>
        </li>`;
    })
    .join("");

  return `
    <section class="space-y-4">
      <!-- Özet başlık: alıcı sayfayı açar açmaz "nerede" sorusunun cevabını
           görmeli, çizelgeyi okumadan. -->
      <header class="rounded-md border p-4 ${
        isDone ? "border-emerald-200 bg-emerald-50" : "border-gray-200"
      }">
        <div class="flex flex-wrap items-center gap-2">
          ${statusBadge(latest.status)}
          <span class="text-sm text-gray-700">${formatDateTime(latest.event_time)}</span>
        </div>
        <p class="mt-2 text-xs text-gray-600">
          <code class="font-mono">${escapeHtml(shipmentName)}</code>
          ${carrier ? ` · ${escapeHtml(carrier)}` : ""}
          ${
            trackingNumber
              ? ` · <span class="font-mono">${escapeHtml(trackingNumber)}</span>`
              : ""
          }
        </p>
      </header>

      <ol>${rows}</ol>
    </section>`;
}
