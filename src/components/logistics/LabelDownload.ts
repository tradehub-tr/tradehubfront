/**
 * **S9 · Etiket indirme** (TUR-114).
 *
 * Satıcı kolilerinin kargo etiketlerini indiriyor.
 *
 * admin panelindeki toplu yazdırma ekranından (G2) farkı: satıcı **yeniden
 * basım geçmişini görmüyor**. O bilgi operasyon içindir (aynı etiketin iki
 * kez basılması şubede çift kayıt riski); satıcıya göstermek yalnız kafa
 * karıştırır. Ama etiketi olmayan koli AÇIKÇA işaretleniyor — çünkü o
 * koliyi kargoya veremez.
 */
import { t } from "../../i18n";
import { escapeHtml } from "../../utils/sanitize";

import { emptyState, formatDateTime } from "./presentation";

interface LabelPackage {
  package_code: string;
  sequence_label?: string;
  label_url?: string | null;
  barcode_url?: string | null;
  label_printed_at?: string | null;
}

export interface LabelDownloadProps {
  shipmentName: string;
  packages: LabelPackage[];
}

export function LabelDownload(props: LabelDownloadProps): string {
  const { shipmentName, packages } = props;

  if (!packages.length) {
    return emptyState(t("shipment.label.empty"), t("shipment.label.emptyHint"));
  }

  const missing = packages.filter((p) => !p.label_url);

  const cards = packages
    .map(
      (pkg) => `
      <li class="rounded-md border p-3 ${pkg.label_url ? "border-gray-200" : "border-amber-300 bg-amber-50"}">
        <div class="flex flex-wrap items-center gap-2">
          <span class="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
            ${escapeHtml(pkg.sequence_label ?? "—")}
          </span>
          <code class="font-mono text-xs text-gray-500">${escapeHtml(pkg.package_code)}</code>
        </div>

        <div class="mt-2 flex h-20 items-center justify-center rounded bg-gray-50">
          ${
            pkg.barcode_url
              ? `<img src="${escapeHtml(pkg.barcode_url)}" alt="${escapeHtml(
                  t("shipment.label.barcodeAlt", { code: pkg.package_code })
                )}" class="max-h-16 max-w-full object-contain"
                   onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'text-xs text-gray-400',textContent:'${escapeHtml(
                     t("shipment.label.barcodeUnavailable")
                   )}'}))" />`
              : `<span class="text-xs text-gray-400">${escapeHtml(t("shipment.label.noBarcode"))}</span>`
          }
        </div>

        ${
          pkg.label_printed_at
            ? `<p class="mt-2 text-xs text-gray-500">${escapeHtml(
                t("shipment.label.printedAt")
              )}: ${formatDateTime(pkg.label_printed_at)}</p>`
            : `<p class="mt-2 text-xs text-amber-700">${escapeHtml(t("shipment.label.notReady"))}</p>`
        }

        ${
          pkg.label_url
            ? `<a href="${escapeHtml(pkg.label_url)}" target="_blank" rel="noopener" download
                  class="th-btn-outline th-no-press th-btn-sm mt-2 inline-flex">
                 ${escapeHtml(t("shipment.label.download"))}
               </a>`
            : ""
        }
      </li>`
    )
    .join("");

  return `
    <section class="space-y-4">
      <header>
        <h2 class="text-base font-semibold text-gray-900">${escapeHtml(t("shipment.label.title"))}</h2>
        <p class="mt-0.5 text-sm text-gray-600">
          ${escapeHtml(t("shipment.label.subtitle", { shipment: shipmentName }))}
        </p>
      </header>

      ${
        missing.length
          ? `<div class="rounded-md border border-amber-300 bg-amber-50 p-3" role="alert">
               <p class="text-sm text-amber-800">
                 ${escapeHtml(t("shipment.label.missingWarning", { count: missing.length }))}
               </p>
             </div>`
          : ""
      }

      <ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">${cards}</ul>
    </section>`;
}
