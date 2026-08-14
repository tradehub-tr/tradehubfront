/**
 * **S12 · İade yanıtı + takip** (TUR-116) — satıcı tarafı.
 *
 * admin panelindeki iade kuyruğundan (I1) farkı: satıcı **yalnız kendi**
 * taleplerini görüyor (tenant izolasyonu backend'de) ve **kapanış yetkisi
 * yok** — para iadesi/escrow tetikleme platform kararı.
 *
 * Karar bekleyen talepler önce, bekleme süresiyle: iade yanıtındaki gecikme
 * doğrudan müşteri şikâyetine dönüşüyor.
 */
import { t } from "../../i18n";
import { escapeHtml } from "../../utils/sanitize";

import { emptyState, formatDateTime, money, returnStatusBadge } from "./presentation";

interface ReturnRow {
  name: string;
  order: string;
  shipment?: string | null;
  status: string;
  reason: string;
  requested_at: string;
  decided_at?: string | null;
  is_closed?: number | null;
  refund_amount?: number | null;
}

export interface SellerReturnQueueProps {
  rows: ReturnRow[];
  /** "Şu an" — bekleme süresi için; bileşen kendi hesaplamıyor (test edilebilirlik). */
  now?: string;
}

/** Bu süreyi aşan karar bekleyişi operasyonda gecikme sayılıyor. */
const DECISION_WARN_HOURS = 48;

function waitingHours(requestedAt: string, now: string): number | null {
  if (!now) return null;
  const start = new Date(String(requestedAt).replace(" ", "T"));
  const end = new Date(String(now).replace(" ", "T"));
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return (end.getTime() - start.getTime()) / 3_600_000;
}

export function SellerReturnQueue(props: SellerReturnQueueProps): string {
  const { rows, now = "" } = props;

  if (!rows.length) {
    return emptyState(t("shipment.sellerReturn.empty"), t("shipment.sellerReturn.emptyHint"));
  }

  // Karar bekleyenler önce, sonra en eski talep önce.
  const ordered = [...rows].sort((a, b) => {
    const decided = Number(Boolean(a.decided_at)) - Number(Boolean(b.decided_at));
    if (decided !== 0) return decided;
    return String(a.requested_at).localeCompare(String(b.requested_at));
  });

  const cards = ordered
    .map((row) => {
      const hours = waitingHours(row.requested_at, now);
      const overdue = hours !== null && hours >= DECISION_WARN_HOURS && !row.decided_at;
      return `
        <li class="rounded-md border p-4 ${
          row.is_closed
            ? "border-gray-200 opacity-70"
            : !row.decided_at
              ? "border-amber-300"
              : "border-gray-200"
        }">
          <div class="flex flex-wrap items-center gap-2">
            <code class="font-mono text-sm font-medium text-gray-800">${escapeHtml(row.name)}</code>
            ${returnStatusBadge(row.status)}
            <span class="text-xs text-gray-500">
              ${escapeHtml(t(`shipment.returnReason.${row.reason}`, { defaultValue: row.reason }))}
            </span>
            ${
              row.is_closed
                ? `<span class="rounded bg-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                     ${escapeHtml(t("shipment.sellerReturn.closed"))}
                   </span>`
                : ""
            }
            <span class="ms-auto text-xs ${overdue ? "font-medium text-amber-700" : "text-gray-500"}">
              ${
                row.decided_at
                  ? escapeHtml(t("shipment.sellerReturn.decidedAt", { at: formatDateTime(row.decided_at) }))
                  : hours === null
                    ? escapeHtml(t("shipment.sellerReturn.awaiting"))
                    : escapeHtml(
                        hours < 24
                          ? t("shipment.sellerReturn.hours", { count: Math.round(hours) })
                          : t("shipment.sellerReturn.days", { count: Math.floor(hours / 24) })
                      )
              }
            </span>
          </div>

          <div class="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            <span>${escapeHtml(row.order)}</span>
            ${row.shipment ? `<span class="font-mono">${escapeHtml(row.shipment)}</span>` : ""}
            <span>${formatDateTime(row.requested_at)}</span>
            ${
              row.refund_amount != null
                ? `<span>${escapeHtml(t("shipment.sellerReturn.refund"))}: ${money(row.refund_amount)}</span>`
                : ""
            }
          </div>

          ${
            !row.decided_at
              ? `<div class="mt-3">
                   <a href="/pages/seller/return-decision.html?name=${encodeURIComponent(row.name)}"
                      class="th-btn-outline th-no-press th-btn-sm">
                     ${escapeHtml(t("shipment.sellerReturn.decide"))}
                   </a>
                 </div>`
              : ""
          }
        </li>`;
    })
    .join("");

  return `
    <section class="space-y-4">
      <header>
        <h2 class="text-base font-semibold text-gray-900">${escapeHtml(t("shipment.sellerReturn.title"))}</h2>
        <p class="mt-0.5 text-sm text-gray-600">${escapeHtml(t("shipment.sellerReturn.subtitle"))}</p>
      </header>
      <ul class="space-y-2">${cards}</ul>
      <!-- Kapanış (para iadesi tetikleme) satıcıda YOK — platform kararı. -->
      <p class="text-xs text-gray-500">${escapeHtml(t("shipment.sellerReturn.closureNote"))}</p>
    </section>`;
}
