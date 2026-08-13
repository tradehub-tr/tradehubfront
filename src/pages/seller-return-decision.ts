/**
 * İade kararı (S12) — satıcı.
 *
 * VERİ DURUMU: `Return Request` DocType'ı yok, karar ucu da yok. Kuyruk
 * sahte taleplerle çizilirse satıcı gerçek bir talebi kaçırdığını sanmaz —
 * tersine, olmayan talepleri yanıtlamaya çalışır. Bu yüzden sebep gösteriliyor.
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
    { label: t("shipment.page.sellerPanel"), href: "/pages/seller/dashboard.html" },
    { label: t("shipment.sellerReturn.title") },
  ],
  contentId: "seller-return-decision-root",
});

root.innerHTML = shellCard(`
  <h1 class="mb-3 text-base font-semibold text-gray-900">
    ${escapeHtml(t("shipment.sellerReturn.title"))}
  </h1>
  ${NotWiredNotice({
    title: t("shipment.page.returnQueueNotWired"),
    endpoint: "api.v1.logistics.list_return_requests",
  })}
`);

startAlpine();
