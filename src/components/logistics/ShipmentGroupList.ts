/**
 * **S1 · Çoklu sevkiyat gösterimi** (TUR-106).
 *
 * Bir sipariş birden fazla sevkiyata bölündüğünde alıcı ve satıcı bunu
 * görmeli. Asıl soru "kaç paket geldi" değil, **"siparişimin ne kadarı
 * yolda, ne kadarı hâlâ bekliyor"**.
 *
 * Bu yüzden kalem bazlı ilerleme çubuğu var: sevkiyat kartlarını saymak
 * o soruyu cevaplamıyor.
 *
 * Alıcı ve satıcı AYNI bileşeni kullanıyor; fark `canManage` — satıcı
 * sevkiyat detayına gidebiliyor, alıcı yalnız takip edebiliyor.
 */
import { t } from "../../i18n";
import { escapeHtml } from "../../utils/sanitize";

import { emptyState, formatDateTime, statusBadge } from "./presentation";

interface ShipmentItemRow {
  item: string;
  item_name: string;
  ordered_qty: number;
  shipped_qty: number;
  remaining_qty?: number;
  uom?: string;
}

interface ShipmentRow {
  name: string;
  status: string;
  carrier?: string | null;
  tracking_number?: string | null;
  package_count?: number | null;
  ship_date?: string | null;
  estimated_delivery?: string | null;
  items?: ShipmentItemRow[];
}

export interface ShipmentGroupProps {
  orderName: string;
  shipments: ShipmentRow[];
  /** Satıcı görünümünde sevkiyat yönetim bağlantıları açılır. */
  canManage?: boolean;
}

/** Sipariş kalemlerini sevkiyatlar üzerinden toplar. */
function summarizeItems(shipments: ShipmentRow[]) {
  const acc = new Map<string, { name: string; ordered: number; shipped: number; uom: string }>();
  for (const shipment of shipments) {
    for (const row of shipment.items ?? []) {
      const existing = acc.get(row.item) ?? {
        name: row.item_name,
        ordered: Number(row.ordered_qty) || 0,
        shipped: 0,
        uom: row.uom ?? "",
      };
      existing.shipped += Number(row.shipped_qty) || 0;
      acc.set(row.item, existing);
    }
  }
  return [...acc.values()];
}

export function ShipmentGroupList(props: ShipmentGroupProps): string {
  const { orderName, shipments, canManage = false } = props;

  if (!shipments.length) {
    return emptyState(t("shipment.group.empty"), t("shipment.group.emptyHint"));
  }

  const summary = summarizeItems(shipments);
  const fullyShipped = summary.every((line) => line.shipped >= line.ordered);

  const itemRows = summary
    .map((line) => {
      const percent = line.ordered ? Math.min(100, (line.shipped / line.ordered) * 100) : 0;
      const remaining = Math.max(0, line.ordered - line.shipped);
      return `
        <li class="py-2">
          <div class="flex items-baseline justify-between gap-2 text-sm">
            <span class="font-medium text-gray-800">${escapeHtml(line.name)}</span>
            <span class="tabular-nums text-xs text-gray-500">
              ${line.shipped} / ${line.ordered} ${escapeHtml(line.uom)}
            </span>
          </div>
          <div class="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div class="h-full rounded-full bg-indigo-500" style="width:${percent}%"></div>
          </div>
          ${
            remaining > 0
              ? `<p class="mt-1 text-xs text-amber-700">${escapeHtml(
                  t("shipment.group.remaining", { count: remaining, uom: line.uom })
                )}</p>`
              : ""
          }
        </li>`;
    })
    .join("");

  const cards = shipments
    .map(
      (shipment, index) => `
      <article class="rounded-md border border-gray-200 p-4">
        <div class="flex flex-wrap items-center gap-2">
          <span class="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
            ${escapeHtml(t("shipment.group.parcelOf", { index: index + 1, total: shipments.length }))}
          </span>
          ${statusBadge(shipment.status)}
          <code class="font-mono text-xs text-gray-500">${escapeHtml(shipment.name)}</code>
        </div>

        <dl class="mt-3 grid gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
          <div>
            <dt class="text-gray-500">${escapeHtml(t("shipment.group.carrier"))}</dt>
            <dd class="text-gray-800">${escapeHtml(shipment.carrier ?? t("shipment.group.noCarrier"))}</dd>
          </div>
          <div>
            <dt class="text-gray-500">${escapeHtml(t("shipment.group.tracking"))}</dt>
            <dd class="font-mono text-gray-800">${escapeHtml(
              shipment.tracking_number ?? t("shipment.group.noTracking")
            )}</dd>
          </div>
          <div>
            <dt class="text-gray-500">${escapeHtml(t("shipment.group.eta"))}</dt>
            <dd class="text-gray-800">${formatDateTime(shipment.estimated_delivery, false)}</dd>
          </div>
        </dl>

        <div class="mt-3 flex flex-wrap gap-2">
          <a href="/pages/dashboard/shipment-tracking.html?name=${encodeURIComponent(shipment.name)}"
             class="th-btn-outline th-no-press th-btn-sm">
            ${escapeHtml(t("shipment.group.track"))}
          </a>
          ${
            canManage
              ? `<a href="/pages/seller/shipment.html?name=${encodeURIComponent(shipment.name)}"
                    class="th-btn-outline th-no-press th-btn-sm">
                   ${escapeHtml(t("shipment.group.manage"))}
                 </a>`
              : ""
          }
        </div>
      </article>`
    )
    .join("");

  return `
    <section class="space-y-4">
      <header>
        <h2 class="text-base font-semibold text-gray-900">
          ${escapeHtml(t("shipment.group.title", { order: orderName }))}
        </h2>
        <p class="mt-0.5 text-sm text-gray-600">
          ${escapeHtml(t("shipment.group.subtitle", { count: shipments.length }))}
        </p>
      </header>

      <!-- Kalem ilerlemesi kartlardan ÖNCE: "siparişimin ne kadarı yolda"
           sorusu, "kaç parça var" sorusundan önce geliyor. -->
      <div class="rounded-md border border-gray-200 p-4">
        <h3 class="mb-2 text-sm font-semibold text-gray-800">
          ${escapeHtml(t("shipment.group.itemProgress"))}
        </h3>
        <ul class="divide-y divide-gray-100">${itemRows}</ul>
        ${
          fullyShipped
            ? `<p class="mt-3 rounded bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                 ${escapeHtml(t("shipment.group.allShipped"))}
               </p>`
            : ""
        }
      </div>

      <div class="grid gap-3 sm:grid-cols-2">${cards}</div>
    </section>`;
}
