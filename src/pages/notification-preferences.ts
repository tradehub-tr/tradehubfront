/**
 * Bildirim merkezi + tercihleri (S6, S7) — alıcı.
 *
 * VERİ DURUMU: ikisinin de ucu yok. Dahası S6'nın **sözleşme varlığı** da
 * yok — "gönderilmiş bildirim kaydı" diye bir DocType bulunmuyor.
 *
 * `?mock=1` ile ikisi de örnek veriyle çiziliyor. Tercih anahtarları mock
 * modda GERÇEKTEN kaydetmiyor; zaten `notificationPreferences` Alpine
 * bileşeni uç yokken "bağlı değil" hatası veriyor — sessizce başarılı
 * göstermiyor.
 */
// T-123: RUM montajı — MPA ortak boot (çift başlatmaya karşı korumalı).
import "../lib/rum/boot";
import "../style.css";
import "../alpine/sidebar";
import { startAlpine } from "../alpine";
import {
  NotificationCenter,
  NotificationPreferences,
} from "../components/logistics/NotificationCenter";
import { NotWiredNotice } from "../components/logistics/NotWiredNotice";
import { t } from "../i18n";
import {
  isMockMode,
  mockBannerHtml,
  mockNotificationFeed,
  mockNotificationPreferences,
} from "../services/logisticsMock";
import { requireAuth } from "../utils/auth-guard";
import { escapeHtml } from "../utils/sanitize";

import { mountDashboardShell, shellCard } from "./dashboardShell";

await requireAuth();

const mock = isMockMode();

const root = mountDashboardShell({
  breadcrumb: [
    { label: t("header.myAccount"), href: "/pages/dashboard/buyer-dashboard.html" },
    { label: t("shipment.notifyPref.title") },
  ],
  contentId: "notification-preferences-root",
});

root.innerHTML = [
  mock ? mockBannerHtml() : "",
  shellCard(
    mock
      ? NotificationCenter({ rows: mockNotificationFeed() })
      : `<h1 class="mb-3 text-base font-semibold text-gray-900">
           ${escapeHtml(t("shipment.notify.title"))}
         </h1>
         ${NotWiredNotice({
           title: t("shipment.page.notifyFeedNotWired"),
           endpoint: "(sözleşmede karşılığı yok — gönderilmiş bildirim DocType'ı gerekiyor)",
         })}`
  ),
  shellCard(
    mock
      ? NotificationPreferences({ rows: mockNotificationPreferences() })
      : `<h2 class="mb-3 text-base font-semibold text-gray-900">
           ${escapeHtml(t("shipment.notifyPref.title"))}
         </h2>
         ${NotWiredNotice({
           title: t("shipment.page.notifyPrefNotWired"),
           endpoint: "api.v1.logistics.list_notification_preferences",
         })}`
  ),
].join("");

startAlpine();
