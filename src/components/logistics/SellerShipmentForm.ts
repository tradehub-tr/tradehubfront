/**
 * **S2 · Satıcı sevkiyat oluşturma** (TUR-108).
 *
 * admin panelindeki manuel form (C1) ile aynı fikir, ama satıcı için
 * daraltılmış: platform seviyesi alanlar (ödeyen taraf, alış maliyeti,
 * taşıyıcı hesabı) BURADA YOK. Satıcı ne kadar kazanıldığını değil, neyi
 * nasıl gönderdiğini giriyor.
 *
 * Form kanala göre şekil değiştiriyor — satıcı kendi aracıyla teslim
 * edecekse "taşıyıcı seç" sormak yanlış soru.
 */
import { t } from "../../i18n";
import { escapeHtml } from "../../utils/sanitize";

interface OptionRow {
  value: string;
  label: string;
}

export interface SellerShipmentFormProps {
  orderName: string;
  /** Kalan miktarı olan sipariş kalemleri — hepsi sevk edilmişse form açılmaz. */
  remainingItems: { item: string; item_name: string; remaining_qty: number; uom?: string }[];
  channels: OptionRow[];
  carriers: OptionRow[];
  /**
   * Formun açılış kanalı. Sunucu tarafında satıcının varsayılan kanalı
   * biliniyor (`Seller Profile`); ön tanımlı `CARGO` yalnız hiçbir bilgi
   * yokken geçerli. Kanal formun ŞEKLİNİ belirlediği için bunu şablondan
   * geçirmek zorunlu — Alpine tarafında sabitlenirse satıcı her seferinde
   * kanalı elle düzeltir.
   */
  initialChannel?: string;
}

export function SellerShipmentForm(props: SellerShipmentFormProps): string {
  const { orderName, remainingItems, channels, carriers, initialChannel = "CARGO" } = props;

  if (!remainingItems.length) {
    return `
      <div class="rounded-md border border-emerald-200 bg-emerald-50 p-4">
        <p class="text-sm font-medium text-emerald-800">
          ${escapeHtml(t("shipment.sellerForm.allShipped"))}
        </p>
        <p class="mt-1 text-xs text-emerald-700">
          ${escapeHtml(t("shipment.sellerForm.allShippedHint"))}
        </p>
      </div>`;
  }

  const itemRows = remainingItems
    .map(
      (row) => `
      <li class="flex flex-wrap items-center gap-3 py-2">
        <label class="flex flex-1 items-center gap-2">
          <input type="checkbox" checked
                 x-model="selected"
                 value="${escapeHtml(row.item)}" />
          <span class="text-sm text-gray-800">${escapeHtml(row.item_name)}</span>
        </label>
        <div class="flex items-center gap-2">
          <input type="number" min="1" max="${row.remaining_qty}"
                 value="${row.remaining_qty}"
                 class="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm text-right tabular-nums"
                 @input="clampQty($event, ${row.remaining_qty})" />
          <span class="text-xs text-gray-500">/ ${row.remaining_qty} ${escapeHtml(row.uom ?? "")}</span>
        </div>
      </li>`
    )
    .join("");

  const channelOptions = channels
    .map((c) => `<option value="${escapeHtml(c.value)}">${escapeHtml(c.label)}</option>`)
    .join("");
  const carrierOptions = carriers
    .map((c) => `<option value="${escapeHtml(c.value)}">${escapeHtml(c.label)}</option>`)
    .join("");

  return `
    <form class="space-y-5" x-data="sellerShipmentForm({ channel: '${escapeHtml(initialChannel)}' })"
          @submit.prevent="submit()">
      <header>
        <h2 class="text-base font-semibold text-gray-900">
          ${escapeHtml(t("shipment.sellerForm.title"))}
        </h2>
        <p class="mt-0.5 text-sm text-gray-600">
          ${escapeHtml(t("shipment.sellerForm.subtitle", { order: orderName }))}
        </p>
      </header>

      <!-- Kalem seçimi: TUR-106 gereği kısmi sevk mümkün, ama miktar
           kalandan fazla olamaz — input max ile sınırlı, ayrıca clamp var. -->
      <section class="rounded-md border border-gray-200 p-4">
        <h3 class="mb-1 text-sm font-semibold text-gray-800">
          ${escapeHtml(t("shipment.sellerForm.items"))}
        </h3>
        <p class="mb-2 text-xs text-gray-500">${escapeHtml(t("shipment.sellerForm.itemsHint"))}</p>
        <ul class="divide-y divide-gray-100">${itemRows}</ul>
        <p class="mt-2 text-xs text-red-600" x-show="!selected.length" x-cloak>
          ${escapeHtml(t("shipment.sellerForm.noItemSelected"))}
        </p>
      </section>

      <section class="grid gap-4 sm:grid-cols-2">
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-gray-800">
            ${escapeHtml(t("shipment.sellerForm.channel"))} *
          </span>
          <select class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" x-model="channel">
            ${channelOptions}
          </select>
        </label>

        <!-- Kargo dışı kanalda taşıyıcı alanı HİÇ gösterilmiyor -->
        <template x-if="needsCarrier">
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-gray-800">
              ${escapeHtml(t("shipment.sellerForm.carrier"))} *
            </span>
            <select class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" x-model="carrier">
              ${carrierOptions}
            </select>
          </label>
        </template>

        <template x-if="needsCarrier">
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-gray-800">
              ${escapeHtml(t("shipment.sellerForm.tracking"))}
            </span>
            <input type="text" class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                   x-model="tracking" />
          </label>
        </template>

        <template x-if="!needsCarrier">
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-gray-800">
              ${escapeHtml(t("shipment.sellerForm.plate"))}
            </span>
            <input type="text" class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono uppercase"
                   x-model="plate" />
          </label>
        </template>

        <template x-if="!needsCarrier">
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-gray-800">
              ${escapeHtml(t("shipment.sellerForm.driver"))}
            </span>
            <input type="text" class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                   x-model="driver" />
          </label>
        </template>
      </section>

      <div class="flex items-center gap-3">
        <button type="submit" class="th-btn" :disabled="submitting || !selected.length">
          <span x-text="submitting ? '${escapeHtml(t("shipment.sellerForm.submitting"))}' : '${escapeHtml(t("shipment.sellerForm.submit"))}'"></span>
        </button>
        <p class="text-xs text-red-600" x-show="error" x-text="error" x-cloak></p>
      </div>
    </form>`;
}
