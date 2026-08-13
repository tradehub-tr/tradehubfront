/**
 * **S10 · Teslim özeti + kanıt** (TUR-115).
 *
 * Alıcının teslimattan sonra gördüğü sayfa. admin panelindeki POD
 * ekranından farkı: burada **veri minimizasyonu daha katı**.
 *
 *   * Konum KAYNAĞI gösterilmiyor (`carrier_api` / `manual` / `device_gps`).
 *     Operasyon için ihtilafta belirleyici; alıcı için iç işleyiş.
 *   * `received_by` gösteriliyor — alıcının kendi teslimatı, kimin aldığını
 *     bilmeye hakkı var (apartman görevlisi, komşu vb.).
 *   * İmza ve fotoğraf gösteriliyor ama **kendi teslimatı** olduğu için;
 *     panelde bu ayrı bir yetkiye bağlıydı.
 */
import { t } from "../../i18n";
import { escapeHtml } from "../../utils/sanitize";

import { emptyState, formatDateTime, statusBadge } from "./presentation";

interface ProofOfDelivery {
  delivered_at?: string | null;
  received_by?: string | null;
  delivery_code_used?: number | null;
  signature_url?: string | null;
  photo_url?: string | null;
  document_url?: string | null;
}

export interface DeliverySummaryProps {
  shipmentName: string;
  status: string;
  carrier?: string | null;
  pod: ProofOfDelivery | null;
  /** İade penceresi kapanmadıysa iade bağlantısı gösterilir (TUR-116). */
  returnWindowOpen?: boolean;
}

function mediaTile(label: string, url: string | null | undefined, isImage: boolean): string {
  if (!url) {
    return `
      <figure class="rounded-md border border-gray-200 p-2">
        <figcaption class="mb-1 text-xs text-gray-500">${escapeHtml(label)}</figcaption>
        <p class="flex h-28 items-center justify-center text-xs text-gray-400">
          ${escapeHtml(t("shipment.summary.notProvided"))}
        </p>
      </figure>`;
  }
  return `
    <figure class="rounded-md border border-gray-200 p-2">
      <figcaption class="mb-1 text-xs text-gray-500">${escapeHtml(label)}</figcaption>
      <a href="${escapeHtml(url)}" target="_blank" rel="noopener" class="block">
        ${
          isImage
            ? `<img src="${escapeHtml(url)}" alt="${escapeHtml(label)}" loading="lazy"
                    class="h-28 w-full rounded object-contain"
                    onerror="this.replaceWith(Object.assign(document.createElement('p'),{className:'flex h-28 items-center justify-center text-xs text-gray-400',textContent:'${escapeHtml(
                      t("shipment.summary.mediaUnavailable")
                    )}'}))" />`
            : `<span class="flex h-28 items-center justify-center rounded bg-gray-50 text-xs text-gray-600">
                 ${escapeHtml(t("shipment.summary.openDocument"))}
               </span>`
        }
      </a>
    </figure>`;
}

export function DeliverySummary(props: DeliverySummaryProps): string {
  const { shipmentName, status, carrier, pod, returnWindowOpen = false } = props;

  if (!pod) {
    return emptyState(t("shipment.summary.empty"), t("shipment.summary.emptyHint"));
  }

  return `
    <section class="space-y-4">
      <header class="rounded-md border border-emerald-200 bg-emerald-50 p-4">
        <div class="flex flex-wrap items-center gap-2">
          ${statusBadge(status)}
          <span class="text-sm text-emerald-900">${formatDateTime(pod.delivered_at)}</span>
        </div>
        <p class="mt-1 text-xs text-emerald-800">
          <code class="font-mono">${escapeHtml(shipmentName)}</code>
          ${carrier ? ` · ${escapeHtml(carrier)}` : ""}
        </p>
      </header>

      <dl class="grid gap-3 text-sm sm:grid-cols-2">
        <div class="rounded-md border border-gray-200 p-3">
          <dt class="text-xs text-gray-500">${escapeHtml(t("shipment.summary.receivedBy"))}</dt>
          <dd class="mt-0.5 font-medium text-gray-800">${escapeHtml(pod.received_by ?? "—")}</dd>
        </div>
        <div class="rounded-md border border-gray-200 p-3">
          <dt class="text-xs text-gray-500">${escapeHtml(t("shipment.summary.codeUsed"))}</dt>
          <dd class="mt-0.5">
            ${
              pod.delivery_code_used
                ? statusBadge("verified", "success", t("shipment.summary.codeVerified"))
                : statusBadge("not_required", "neutral", t("shipment.summary.codeNotUsed"))
            }
          </dd>
        </div>
      </dl>

      <section>
        <h3 class="mb-2 text-sm font-semibold text-gray-800">
          ${escapeHtml(t("shipment.summary.proof"))}
        </h3>
        <div class="grid gap-3 sm:grid-cols-3">
          ${mediaTile(t("shipment.summary.signature"), pod.signature_url, true)}
          ${mediaTile(t("shipment.summary.photo"), pod.photo_url, true)}
          ${mediaTile(t("shipment.summary.document"), pod.document_url, false)}
        </div>
      </section>

      ${
        returnWindowOpen
          ? `<div class="rounded-md border border-gray-200 p-4">
               <p class="text-sm text-gray-700">${escapeHtml(t("shipment.summary.returnHint"))}</p>
               <a href="/pages/dashboard/return-request.html?shipment=${encodeURIComponent(
                 shipmentName
               )}" class="th-btn-outline th-no-press th-btn-sm mt-2 inline-flex">
                 ${escapeHtml(t("shipment.summary.startReturn"))}
               </a>
             </div>`
          : ""
      }
    </section>`;
}
