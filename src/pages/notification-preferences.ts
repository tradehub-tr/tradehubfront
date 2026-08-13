/**
 * Bildirim merkezi + tercihleri (S6, S7) — alıcı.
 *
 * VERİ DURUMU: ikisinin de ucu yok. Dahası S6'nın **sözleşme varlığı** da
 * yok — `Notification Template` ve `Notification Preference` tanım tarafı,
 * "gönderilmiş bildirim kaydı" diye bir DocType bulunmuyor.
 *
 * Tercih anahtarlarını sahte veriyle çizmek, kullanıcının kapattığı bir
 * bildirimin kapandığını sanmasına yol açardı — bu ekranda en kötü hata bu.
 */
import "../style.css";
import "../alpine/sidebar";
import { startAlpine } from "../alpine";
import { NotWiredNotice } from "../components/logistics/NotWiredNotice";
import { t } from "../i18n";
import { requireAuth } from "../utils/auth-guard";
import { escapeHtml } from "../utils/sanitize";

import { mountDashboardShell, shellCard } from "./dashboardShell";

await requireAuth();

const root = mountDashboardShell({
  breadcrumb: [
    { label: t("header.myAccount"), href: "/pages/dashboard/buyer-dashboard.html" },
    { label: t("shipment.notifyPref.title") },
  ],
  contentId: "notification-preferences-root",
});

root.innerHTML = [
  shellCard(`
    <h1 class="mb-3 text-base font-semibold text-gray-900">
      ${escapeHtml(t("shipment.notify.title"))}
    </h1>
    ${NotWiredNotice({
      title: t("shipment.page.notifyFeedNotWired"),
      endpoint: "(sözleşmede karşılığı yok — gönderilmiş bildirim DocType'ı gerekiyor)",
    })}
  `),
  shellCard(`
    <h2 class="mb-3 text-base font-semibold text-gray-900">
      ${escapeHtml(t("shipment.notifyPref.title"))}
    </h2>
    ${NotWiredNotice({
      title: t("shipment.page.notifyPrefNotWired"),
      endpoint: "api.v1.logistics.list_notification_preferences",
    })}
  `),
].join("");

startAlpine();
