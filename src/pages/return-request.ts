/**
 * İade talebi (S11) — alıcı.
 *
 * Sevkiyat GERÇEK uçtan geliyor. Talebin kendisi kaydedilemiyor:
 * `Return Request` DocType'ı yok.
 *
 * Gerçek modda form ÇİZİLMİYOR — doldurulup gönderilemeyecek bir form
 * göstermek, alıcıyı boşa emek harcatıp hata ekranına düşürmek olurdu.
 * `?mock=1` modunda form örnek kalemlerle çiziliyor; gönderim denemesi
 * Alpine tarafında "bağlı değil" hatası veriyor, sessizce başarılı olmuyor.
 */
import "../style.css";
import "../alpine/sidebar";
import "../alpine/logisticsBuyer";
import { startAlpine } from "../alpine";
import { NotWiredNotice } from "../components/logistics/NotWiredNotice";
import { statusBadge } from "../components/logistics/presentation";
import { ReturnRequest } from "../components/logistics/ReturnRequest";
import { t } from "../i18n";
import {
  isMockMode,
  mockBannerHtml,
  mockReturnReasons,
  mockShipmentDetail,
  mockShipmentItems,
} from "../services/logisticsMock";
import { getShipment } from "../services/shipmentService";
import { requireAuth } from "../utils/auth-guard";
import { escapeHtml } from "../utils/sanitize";

import { mountDashboardShell, shellCard } from "./dashboardShell";

await requireAuth();

const mock = isMockMode();
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

function header(name: string, status: string, carrier?: string | null): string {
  return `
    <div class="flex flex-wrap items-center gap-2">
      ${statusBadge(status)}
      <code class="font-mono text-xs text-gray-600">${escapeHtml(name)}</code>
      ${carrier ? `<span class="text-xs text-gray-500">${escapeHtml(carrier)}</span>` : ""}
    </div>`;
}

function render(name: string, status: string, carrier?: string | null): void {
  const body = mock
    ? ReturnRequest({
        shipmentName: name,
        items: mockShipmentItems().map((row) => ({
          item: row.item,
          item_name: row.item_name,
          delivered_qty: row.shipped_qty,
          already_returned_qty: row.returned_qty,
          uom: row.uom,
        })),
        reasons: mockReturnReasons(),
        windowOpen: true,
      })
    : NotWiredNotice({
        title: t("shipment.page.returnFormNotWired"),
        endpoint: "api.v1.logistics.create_return_request",
      });

  root.innerHTML = [
    mock ? mockBannerHtml() : "",
    shellCard(`${header(name, status, carrier)}<div class="mt-4">${body}</div>`),
  ].join("");
  startAlpine();
}

if (mock && !shipmentName) {
  const s = mockShipmentDetail();
  render(s.name, s.status, s.carrier);
} else if (!shipmentName) {
  root.innerHTML = shellCard(
    `<p class="text-sm font-medium text-red-700">${escapeHtml(t("shipment.page.missingShipment"))}</p>`
  );
} else {
  try {
    const s = await getShipment(shipmentName);
    render(s.name, s.status, s.carrier);
  } catch (e) {
    if (mock) {
      const s = mockShipmentDetail();
      render(s.name, s.status, s.carrier);
    } else {
      root.innerHTML = shellCard(
        `<p class="text-sm font-medium text-red-700">${escapeHtml(
          (e as Error)?.message || t("shipment.page.loadFailed")
        )}</p>`
      );
    }
  }
}
