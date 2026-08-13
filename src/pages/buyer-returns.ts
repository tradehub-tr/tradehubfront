/**
 * İade taleplerim — alıcı.
 *
 * DOSYA ADI `buyer-returns`, `returns` DEĞİL: `src/pages/returns.ts` zaten
 * **İade Politikası** hukuki sayfasına ait (`pages/legal/returns.html`).
 * `src/pages/` düz bir ad alanı — aynı adı kullanmak o sayfayı siler.
 *
 * VERİ DURUMU: `Return Request` DocType'ı **hiç yok** (ölçüldü). Ekran hazır
 * ama bakacağı kayıt tipi tanımlı değil. Bu yüzden boş liste değil, sebep
 * gösteriliyor — boş liste alıcıya "iade talebim yok" dedirtirdi.
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
    { label: t("shipment.page.returns") },
  ],
  contentId: "buyer-returns-root",
});

root.innerHTML = shellCard(`
  <h1 class="mb-3 text-base font-semibold text-gray-900">
    ${escapeHtml(t("shipment.page.returns"))}
  </h1>
  ${NotWiredNotice({
    title: t("shipment.page.returnsNotWired"),
    endpoint: "api.v1.logistics.list_return_requests",
  })}
`);

startAlpine();
