/**
 * **S8 · Satıcı paketleme girişi** (TUR-114, TUR-120).
 *
 * Satıcı kolileri burada tanımlıyor. admin panelindeki paketleme çalışma
 * alanından (G1) farkı: satıcı **kendi sevkiyatını** paketliyor, palet
 * planlaması yok (o depo işi).
 *
 * Desi hesabı ARAYÜZDE gösteriliyor ama HESAPLANMIYOR — formül backend'de
 * (`services/desi.py`, bölen `Logistics Settings.default_desi_divisor`).
 * İstemcide hesaplamak, ayar değiştiğinde iki yerin sürüklenmesi demek.
 */
import { t } from "../../i18n";
import { escapeHtml } from "../../utils/sanitize";

interface PackageRow {
  package_code?: string;
  sequence_label?: string;
  package_type?: string | null;
  length_cm?: number | null;
  width_cm?: number | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  desi?: number | null;
}

export interface SellerPackingProps {
  shipmentName: string;
  packages: PackageRow[];
  packageTypes: { value: string; label: string }[];
  /** Sevkiyat terminal durumdaysa paketleme kilitli. */
  locked?: boolean;
}

export function SellerPacking(props: SellerPackingProps): string {
  const { shipmentName, packages, packageTypes, locked = false } = props;

  const typeOptions = packageTypes
    .map((p) => `<option value="${escapeHtml(p.value)}">${escapeHtml(p.label)}</option>`)
    .join("");

  const rows = packages
    .map(
      (pkg, index) => `
      <li class="rounded-md border border-gray-200 p-3">
        <div class="flex flex-wrap items-center gap-2">
          <span class="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
            ${escapeHtml(pkg.sequence_label ?? `${index + 1}/${packages.length}`)}
          </span>
          ${
            pkg.package_code
              ? `<code class="font-mono text-xs text-gray-500">${escapeHtml(pkg.package_code)}</code>`
              : ""
          }
          <span class="ms-auto text-xs tabular-nums text-gray-600">
            ${pkg.weight_kg ?? "—"} kg
            ${
              pkg.desi != null
                ? ` · ${escapeHtml(t("shipment.packing.desi"))} ${pkg.desi}`
                : ""
            }
          </span>
        </div>
        <p class="mt-1 text-xs text-gray-500">
          ${pkg.length_cm ?? "—"} × ${pkg.width_cm ?? "—"} × ${pkg.height_cm ?? "—"} cm
          ${pkg.package_type ? ` · ${escapeHtml(pkg.package_type)}` : ""}
        </p>
        ${
          pkg.desi != null && pkg.weight_kg != null && pkg.desi > pkg.weight_kg
            ? `<p class="mt-1 rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">
                 ${escapeHtml(t("shipment.packing.desiExceeds"))}
               </p>`
            : ""
        }
      </li>`
    )
    .join("");

  if (locked) {
    return `
      <section class="space-y-4">
        <h2 class="text-base font-semibold text-gray-900">${escapeHtml(t("shipment.packing.title"))}</h2>
        <div class="rounded-md border border-gray-300 bg-gray-50 p-4">
          <p class="text-sm text-gray-700">${escapeHtml(t("shipment.packing.locked"))}</p>
        </div>
        ${packages.length ? `<ul class="space-y-2">${rows}</ul>` : ""}
      </section>`;
  }

  return `
    <section class="space-y-4" x-data="sellerPacking({ shipment: '${escapeHtml(shipmentName)}' })">
      <header>
        <h2 class="text-base font-semibold text-gray-900">${escapeHtml(t("shipment.packing.title"))}</h2>
        <p class="mt-0.5 text-sm text-gray-600">${escapeHtml(t("shipment.packing.subtitle"))}</p>
      </header>

      ${
        packages.length
          ? `<ul class="space-y-2">${rows}</ul>`
          : `<div class="rounded-md border border-dashed border-gray-300 py-8 text-center">
               <p class="text-sm text-gray-600">${escapeHtml(t("shipment.packing.empty"))}</p>
             </div>`
      }

      <!-- Yeni koli formu: desi alanı YOK, backend hesaplıyor -->
      <div class="rounded-md border border-gray-200 p-4">
        <h3 class="mb-3 text-sm font-semibold text-gray-800">${escapeHtml(t("shipment.packing.addTitle"))}</h3>
        <div class="grid gap-3 sm:grid-cols-4">
          <label class="block sm:col-span-2">
            <span class="mb-1 block text-xs text-gray-500">${escapeHtml(t("shipment.packing.type"))}</span>
            <select class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" x-model="draft.package_type">
              ${typeOptions}
            </select>
          </label>
          <label class="block">
            <span class="mb-1 block text-xs text-gray-500">${escapeHtml(t("shipment.packing.weight"))}</span>
            <input type="number" min="0" step="0.1" x-model.number="draft.weight_kg"
                   class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </label>
          <div></div>
          <label class="block">
            <span class="mb-1 block text-xs text-gray-500">${escapeHtml(t("shipment.packing.length"))}</span>
            <input type="number" min="0" x-model.number="draft.length_cm"
                   class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </label>
          <label class="block">
            <span class="mb-1 block text-xs text-gray-500">${escapeHtml(t("shipment.packing.width"))}</span>
            <input type="number" min="0" x-model.number="draft.width_cm"
                   class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </label>
          <label class="block">
            <span class="mb-1 block text-xs text-gray-500">${escapeHtml(t("shipment.packing.height"))}</span>
            <input type="number" min="0" x-model.number="draft.height_cm"
                   class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </label>
          <div class="flex items-end">
            <button type="button" class="th-btn-outline th-no-press w-full" @click="addPackage()"
                    :disabled="!isValid">
              ${escapeHtml(t("shipment.packing.add"))}
            </button>
          </div>
        </div>
        <p class="mt-2 text-xs text-gray-500">${escapeHtml(t("shipment.packing.desiHint"))}</p>
        <p class="mt-1 text-xs text-red-600" x-show="error" x-text="error" x-cloak></p>
      </div>
    </section>`;
}
