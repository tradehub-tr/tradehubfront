/**
 * İade kararı (S12) — satıcı.
 *
 * VERİ DURUMU: `Return Request` DocType'ı yok, karar ucu da yok.
 * `?mock=1` ile kuyruk örnek taleplerle çiziliyor.
 */
// T-123: RUM montajı — MPA ortak boot (çift başlatmaya karşı korumalı).
import "../lib/rum/boot";
import "../style.css";
import "../alpine/sidebar";
import { startAlpine } from "../alpine";
import { NotWiredNotice } from "../components/logistics/NotWiredNotice";
import { SellerReturnQueue } from "../components/logistics/SellerReturnQueue";
import { t } from "../i18n";
import { isMockMode, mockBannerHtml, mockReturnList } from "../services/logisticsMock";
import { requireAuth } from "../utils/auth-guard";
import { escapeHtml } from "../utils/sanitize";

import { mountDashboardShell, shellCard } from "./dashboardShell";

await requireAuth();

const mock = isMockMode();

const root = mountDashboardShell({
  breadcrumb: [
    { label: t("shipment.page.sellerPanel"), href: "/pages/seller/dashboard.html" },
    { label: t("shipment.sellerReturn.title") },
  ],
  contentId: "seller-return-decision-root",
});

root.innerHTML = [
  mock ? mockBannerHtml() : "",
  shellCard(`
    <h1 class="mb-3 text-base font-semibold text-gray-900">
      ${escapeHtml(t("shipment.sellerReturn.title"))}
    </h1>
    ${
      mock
        ? SellerReturnQueue({ rows: mockReturnList(), now: "2026-08-13 12:00:00" })
        : NotWiredNotice({
            title: t("shipment.page.returnQueueNotWired"),
            endpoint: "api.v1.logistics.list_return_requests",
          })
    }
  `),
].join("");

startAlpine();
