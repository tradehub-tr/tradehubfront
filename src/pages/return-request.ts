/**
 * İade talebi (S11) — alıcı.
 *
 * Sevkiyat GERÇEK uçtan geliyor (`get_shipment_detail`), yani alıcı hangi
 * sevkiyatı iade ettiğini doğru görüyor. Ama talebin kendisi kaydedilemiyor:
 * `Return Request` DocType'ı yok.
 *
 * Bu yüzden form ÇİZİLMİYOR. Doldurulup gönderilemeyecek bir form göstermek,
 * alıcıyı boşa emek harcatıp sonunda hata ekranına düşürmek olurdu — S11'in
 * kendi tasarım kararı da buydu (pencere kapalıyken form hiç render edilmez).
 */
import "../style.css";
import "../alpine/sidebar";
import { startAlpine } from "../alpine";
import { NotWiredNotice } from "../components/logistics/NotWiredNotice";
import { statusBadge } from "../components/logistics/presentation";
import { t } from "../i18n";
import { getShipment } from "../services/shipmentService";
import { requireAuth } from "../utils/auth-guard";
import { escapeHtml } from "../utils/sanitize";

import { mountDashboardShell, shellCard } from "./dashboardShell";

await requireAuth();

const shipmentName = new URLSearchParams(window.location.search).get("shipment") ?? "";

const root = mountDashboardShell({
  breadcrumb: [
    { label: t("header.myAccount"), href: "/pages/dashboard/buyer-dashboard.html" },
    { label: t("shipment.page.returns"), href: "/pages/dashboard/returns.html" },
    { label: t("shipment.return.title") },
  ],
  contentId: "return-request-root",
  initialContent: shellCard(
    `<p class="text-sm text-gray-500">${escapeHtml(t("shipment.page.loading"))}</p>`
  ),
});

/** Hangi sevkiyat için iade açıldığı — yanlış sevkiyatı iade etmek pahalı. */
function shipmentHeader(name: string, status: string, carrier?: string | null): string {
  return `
    <div class="flex flex-wrap items-center gap-2">
      ${statusBadge(status)}
      <code class="font-mono text-xs text-gray-600">${escapeHtml(name)}</code>
      ${carrier ? `<span class="text-xs text-gray-500">${escapeHtml(carrier)}</span>` : ""}
    </div>`;
}

if (!shipmentName) {
  root.innerHTML = shellCard(
    `<p class="text-sm font-medium text-red-700">${escapeHtml(t("shipment.page.missingShipment"))}</p>`
  );
} else {
  try {
    const shipment = await getShipment(shipmentName);
    root.innerHTML = shellCard(`
      <h1 class="mb-3 text-base font-semibold text-gray-900">
        ${escapeHtml(t("shipment.return.title"))}
      </h1>
      ${shipmentHeader(shipment.name, shipment.status, shipment.carrier)}
      <div class="mt-4">
        ${NotWiredNotice({
          title: t("shipment.page.returnFormNotWired"),
          endpoint: "api.v1.logistics.create_return_request",
        })}
      </div>
    `);
  } catch (e) {
    root.innerHTML = shellCard(
      `<p class="text-sm font-medium text-red-700">${escapeHtml(
        (e as Error)?.message || t("shipment.page.loadFailed")
      )}</p>`
    );
  }
}

startAlpine();
