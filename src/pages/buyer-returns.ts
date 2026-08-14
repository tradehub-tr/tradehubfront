/**
 * İade taleplerim — alıcı.
 *
 * DOSYA ADI `buyer-returns`, `returns` DEĞİL: `src/pages/returns.ts` zaten
 * **İade Politikası** hukuki sayfasına ait (`pages/legal/returns.html`).
 *
 * VERİ DURUMU: `Return Request` DocType'ı **hiç yok** (ölçüldü). `?mock=1`
 * ile üretilmiş örnek taleplerle S12 kuyruk bileşeni çiziliyor — alıcı
 * görünümünde karar butonu olmadan.
 */
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
    { label: t("header.myAccount"), href: "/pages/dashboard/buyer-dashboard.html" },
    { label: t("shipment.page.returns") },
  ],
  contentId: "buyer-returns-root",
});

const body = mock
  // `now` sabit veriliyor: bekleme süresi rozetinin her gün değişmemesi için.
  ? SellerReturnQueue({ rows: mockReturnList(), now: "2026-08-13 12:00:00" })
  : NotWiredNotice({
      title: t("shipment.page.returnsNotWired"),
      endpoint: "api.v1.logistics.list_return_requests",
    });

root.innerHTML = [
  mock ? mockBannerHtml() : "",
  shellCard(`
    <h1 class="mb-3 text-base font-semibold text-gray-900">
      ${escapeHtml(t("shipment.page.returns"))}
    </h1>
    ${body}
  `),
].join("");

startAlpine();
