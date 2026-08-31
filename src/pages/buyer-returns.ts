/**
 * İade taleplerim — alıcı (S12-alıcı).
 *
 * DOSYA ADI `buyer-returns`, `returns` DEĞİL: `src/pages/returns.ts` zaten
 * **İade Politikası** hukuki sayfasına ait (`pages/legal/returns.html`).
 *
 * 15-FE'de iki şey değişti:
 *   1. **Kendi bileşeni** — eskiden SATICI bileşeni (`SellerReturnQueue`)
 *      çiziliyordu: alıcı satıcı başlığını, "Karara bağla" düğmelerini ve
 *      başka alıcıların kayıtlarını görüyordu (analiz §3.3).
 *   2. **`?name=` okunuyor** — talep gönderildikten sonra buraya
 *      yönlendiriliyordu ama sayfa parametreyi hiç okumuyordu; alıcı az önce
 *      açtığı talebi listede arıyordu (analiz §3.10).
 */
// T-123: RUM montajı — MPA ortak boot (çift başlatmaya karşı korumalı).
import "../lib/rum/boot";
import "../style.css";
import "../alpine/sidebar";
import { startAlpine } from "../alpine";
import {
  BuyerReturnList,
  BuyerReturnTracking,
  type BuyerReturnTrackingProps,
} from "../components/logistics/BuyerReturnTracking";
import { NotWiredNotice } from "../components/logistics/NotWiredNotice";
import { t } from "../i18n";
import { isMockMode, mockBannerHtml } from "../services/logisticsMock";
import {
  getReturnRequest,
  installReturnMock,
  listReturnRequests,
  returnMockBarHtml,
} from "../services/logisticsReturnMock";
import { requireAuth } from "../utils/auth-guard";
import { escapeHtml } from "../utils/sanitize";

import { mountDashboardShell, shellCard } from "./dashboardShell";

await requireAuth();

const mock = isMockMode();
const istenen = new URLSearchParams(window.location.search).get("name") ?? "";

installReturnMock();

const root = mountDashboardShell({
  breadcrumb: [
    { label: t("header.myAccount"), href: "/pages/dashboard/buyer-dashboard.html" },
    ...(istenen
      ? [
          { label: t("shipment.page.returns"), href: "/pages/dashboard/returns.html" },
          { label: istenen },
        ]
      : [{ label: t("shipment.page.returns") }]),
  ],
  contentId: "buyer-returns-root",
  initialContent: shellCard(
    `<p class="text-sm text-gray-500">${escapeHtml(t("shipment.page.loading"))}</p>`
  ),
});

function ciz(baslik: string, govde: string): void {
  root.innerHTML = [
    mock ? mockBannerHtml() : "",
    mock ? returnMockBarHtml() : "",
    shellCard(`
      <h1 class="mb-3 text-base font-semibold text-gray-900">${escapeHtml(baslik)}</h1>
      ${govde}
    `),
  ].join("");
  startAlpine();
}

try {
  if (istenen) {
    // Tek talep — zaman çizgisi, etiket, kalem kırılımı ve tutar.
    const kayit = (await getReturnRequest(istenen)) as unknown as BuyerReturnTrackingProps;
    ciz(t("shipment.returnTrack.title"), BuyerReturnTracking(kayit));
  } else {
    const liste = (await listReturnRequests()) as unknown as BuyerReturnTrackingProps[];
    ciz(t("shipment.page.returns"), BuyerReturnList(liste));
  }
} catch (e) {
  const notWired = (e as { name?: string })?.name === "NotWiredError";
  root.innerHTML = shellCard(
    notWired
      ? NotWiredNotice({
          title: t("shipment.page.returnsNotWired"),
          endpoint: "api.v1.returns.list_return_requests",
        })
      : `<p class="text-sm font-medium text-red-700">${escapeHtml(
          (e as Error)?.message || t("shipment.page.loadFailed")
        )}</p>`
  );
  startAlpine();
}
