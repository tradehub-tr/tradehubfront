/**
 * **S6 · Bildirim merkezi** ve **S7 · Bildirim tercihleri** (TUR-113).
 *
 * İkisi aynı dosyada çünkü aynı veri modelini paylaşıyorlar ve kullanıcı
 * ikisi arasında gidip geliyor.
 *
 * ── 12-FE (2026-08-28) ──
 * · Kanal etiketi `shipment.notifyChannel.*`'tan geliyor. Eskiden
 *   `shipment.channel.*` çağrılıyordu ama o blok SEVKİYAT kanalları için
 *   (`CARGO`, `COURIER`…); `email`/`in_app`/`sms` karşılığı yoktu ve ekranda
 *   çevrilmemiş ham `email` yazıyordu.
 * · Okunmuşluk `read_at`'ten türetiliyor (sözleşme §4.1).
 * · Okunmamış bildirime tıklamak onu okundu işaretliyor (`notificationFeed`).
 *   Köprü tanımlanıp ekranda hiç çağrılmazsa okunmamış rozeti asla sönmez ve
 *   ekran yanlış bilgi verir — 28 Ağustos denetiminde bu ölü köprü bulundu.
 * · Anahtar iyimser güncelleniyor; hata gelirse `toggle` eski değere döndürür
 *   (`alpine/logisticsBuyer.ts`) — sessizce başarılı görünmek, kullanıcının
 *   aldığını sandığı bildirimi almaması demek.
 *
 * S7'nin kritik kuralı: **zorunlu operasyon bildirimleri kapatılamaz.**
 * Anahtar devre dışı ve daima açık; `enabled` değeri gönderilmiyor bile.
 * Bu bir arayüz nezaketi değil, TUR-113 kabul kriteri — backend de aynı
 * kısıtı uygulamalı, yoksa API'ye doğrudan istek atan biri kapatabilir.
 */
import { t } from "../../i18n";
import { escapeHtml } from "../../utils/sanitize";

import { emptyState, formatDateTime } from "./presentation";

interface NotificationRow {
  name: string;
  event: string;
  title: string;
  body?: string | null;
  /** Gönderim zamanı — kuyruğa girme değil (sözleşme §1.2). */
  sent_at: string;
  /**
   * `null` = okunmadı. Ayrı bir `read` bayrağı YOK: iki alan tutmak ikinci
   * bir doğruluk kaynağı olurdu ve "ne zaman okundu" zaten gerekiyor.
   */
  read_at?: string | null;
  shipment?: string | null;
}

interface PreferenceRow {
  template: string;
  event: string;
  channel: string;
  enabled: number | boolean;
  is_mandatory?: number | boolean;
  locked_reason?: string | null;
}

export function NotificationCenter(props: { rows: NotificationRow[] }): string {
  const { rows } = props;

  if (!rows.length) {
    return emptyState(t("shipment.notify.empty"), t("shipment.notify.emptyHint"));
  }

  const items = rows
    .map(
      (row) => `
      <li class="rounded-md border p-3 ${row.read_at ? "border-gray-200 opacity-70" : "border-indigo-200 bg-indigo-50/40"}"
          data-testid="notification-row" data-read="${row.read_at ? "1" : "0"}"
          data-name="${escapeHtml(row.name)}"
          ${row.read_at ? "" : `@click="okundu('${escapeHtml(row.name)}', $el)"`}>
        <div class="flex flex-wrap items-baseline gap-2">
          <span class="text-sm font-medium text-gray-900">${escapeHtml(row.title)}</span>
          <span class="ms-auto text-xs text-gray-500">${formatDateTime(row.sent_at)}</span>
        </div>
        ${row.body ? `<p class="mt-1 text-sm text-gray-700">${escapeHtml(row.body)}</p>` : ""}
        ${
          row.shipment
            ? `<a href="/pages/dashboard/shipment-tracking.html?name=${encodeURIComponent(row.shipment)}"
                  class="mt-2 inline-block font-mono text-xs text-indigo-700 underline-offset-2 hover:underline">
                 ${escapeHtml(row.shipment)}
               </a>`
            : ""
        }
      </li>`
    )
    .join("");

  return `
    <section class="space-y-4" x-data="notificationFeed()">
      <header class="flex flex-wrap items-center gap-3">
        <h2 class="text-base font-semibold text-gray-900">${escapeHtml(t("shipment.notify.title"))}</h2>
        <a href="/pages/dashboard/notification-preferences.html"
           class="th-btn-outline th-no-press th-btn-sm ms-auto">
          ${escapeHtml(t("shipment.notify.preferences"))}
        </a>
      </header>
      <ul class="space-y-2">${items}</ul>
    </section>`;
}

export function NotificationPreferences(props: { rows: PreferenceRow[] }): string {
  const { rows } = props;

  if (!rows.length) {
    return emptyState(t("shipment.notifyPref.empty"));
  }

  const mandatoryCount = rows.filter((r) => r.is_mandatory).length;

  const items = rows
    .map((row) => {
      const locked = Boolean(row.is_mandatory);
      return `
        <li class="flex flex-wrap items-center gap-3 py-3">
          <div class="min-w-0 grow">
            <p class="text-sm font-medium text-gray-800">
              ${escapeHtml(t(`shipment.notifyEvent.${row.event}`, { defaultValue: row.event }))}
            </p>
            <p class="text-xs text-gray-500">
              ${escapeHtml(t(`shipment.notifyChannel.${row.channel}`, { defaultValue: row.channel }))}
            </p>
            ${
              locked
                ? `<p class="mt-0.5 text-xs text-amber-700">
                     ${escapeHtml(row.locked_reason ?? t("shipment.notifyPref.lockedDefault"))}
                   </p>`
                : ""
            }
          </div>
          <span class="text-xs text-gray-500" x-show="saving === '${escapeHtml(row.template)}'" x-cloak>
            ${escapeHtml(t("shipment.notifyPref.saving"))}
          </span>
          <label class="inline-flex items-center">
            <input type="checkbox" class="peer sr-only"
                   data-testid="pref-toggle" data-template="${escapeHtml(row.template)}"
                   ${locked || row.enabled ? "checked" : ""}
                   ${locked ? "disabled" : ""}
                   ${locked ? "" : `:disabled="saving !== ''"`}
                   @change="toggle('${escapeHtml(row.template)}', $event.target.checked, $event.target)" />
            <span class="h-6 w-11 rounded-full bg-gray-300 transition-colors
                         peer-checked:bg-emerald-500 peer-disabled:opacity-50
                         after:absolute after:mt-0.5 after:ms-0.5 after:h-5 after:w-5
                         after:rounded-full after:bg-white after:transition-transform
                         peer-checked:after:translate-x-5 relative"></span>
          </label>
        </li>`;
    })
    .join("");

  return `
    <section class="space-y-4" x-data="notificationPreferences()">
      <header>
        <h2 class="text-base font-semibold text-gray-900">${escapeHtml(t("shipment.notifyPref.title"))}</h2>
        <p class="mt-0.5 text-sm text-gray-600">${escapeHtml(t("shipment.notifyPref.subtitle"))}</p>
      </header>

      ${
        mandatoryCount
          ? `<p class="rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
               ${escapeHtml(t("shipment.notifyPref.mandatoryNote", { count: mandatoryCount }))}
             </p>`
          : ""
      }

      <ul class="divide-y divide-gray-100 rounded-md border border-gray-200 px-3">${items}</ul>
      <p class="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700"
         role="alert" x-show="error" x-text="error" x-cloak></p>
    </section>`;
}
