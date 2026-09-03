/**
 * İade talebi (S11) — alıcı.
 *
 * 15-FE'de üç şey değişti:
 *   1. **Uygunluk sunucudan** — pencere açık mı, hangi kalem ne kadar iade
 *      edilebilir, hangi nedenler geçerli: hepsi `get_return_eligibility`
 *      yanıtından (sözleşme §2.1). Eskiden `windowOpen: true` SABİT yazılıydı
 *      ve kapalı pencere hâli gerçek sayfada hiç görünmüyordu.
 *   2. **Nedenler i18n'den** — uç `label_key` döndürüyor (karar K-2), etiket
 *      dört dilde burada çözülüyor. Eskiden mock sabit Türkçe etiket
 *      üretiyordu ve Rusça arayüzde nedenler Türkçe çıkıyordu.
 *   3. **Miktar gönderime bağlı** — bkz. `ReturnRequest.ts` ve
 *      `alpine/logisticsBuyer.ts`.
 *
 * Gerçek modda uç henüz yok: `NotWiredError` yakalanıp "bağlı değil" kutusu
 * çiziliyor. Doldurulup gönderilemeyecek bir form göstermek, alıcıyı boşa
 * emek harcatıp hata ekranına düşürmek olurdu.
 */
// T-123: RUM montajı — MPA ortak boot (çift başlatmaya karşı korumalı).
import "../lib/rum/boot";
import "../style.css";
import "../alpine/sidebar";
import "../alpine/logisticsBuyer";
import { startAlpine } from "../alpine";
import { NotWiredNotice } from "../components/logistics/NotWiredNotice";
import { statusBadge } from "../components/logistics/presentation";
import { ReturnRequest } from "../components/logistics/ReturnRequest";
import { t } from "../i18n";
import { isMockMode, mockBannerHtml } from "../services/logisticsMock";
import {
  getReturnEligibility,
  installReturnMock,
  returnMockBarHtml,
  type UygunlukYaniti,
} from "../services/logisticsReturnMock";
import { getShipment } from "../services/shipmentService";
import { requireAuth } from "../utils/auth-guard";
import { escapeHtml } from "../utils/sanitize";

import { mountDashboardShell, shellCard } from "./dashboardShell";

await requireAuth();

const mock = isMockMode();
const shipmentName = new URLSearchParams(window.location.search).get("shipment") ?? "";

// Köprü sayfa çizilmeden ÖNCE kuruluyor: form `window.__thCreateReturn`
// arıyor ve o bulunamazsa gönder düğmesi sessizce hiçbir şey yapmıyordu.
installReturnMock();

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

/** Uç `label_key` döndürüyor; etiket dört dilde burada çözülüyor (K-2). */
function nedenler(uygunluk: UygunlukYaniti) {
  return uygunluk.reasons.map((r) => ({
    value: r.value,
    label: t(r.label_key, { defaultValue: r.value }),
  }));
}

function render(
  name: string,
  status: string,
  carrier: string | null | undefined,
  uygunluk: UygunlukYaniti
): void {
  const body = ReturnRequest({
    shipmentName: name,
    items: uygunluk.returnable_items.map((row) => ({
      item: row.item,
      item_name: row.item_name,
      delivered_qty: row.delivered_qty,
      already_returned_qty: row.already_returned_qty,
      uom: row.uom,
    })),
    reasons: nedenler(uygunluk),
    windowOpen: uygunluk.window_open === 1,
    windowDays: uygunluk.window_days,
  });

  root.innerHTML = [
    mock ? mockBannerHtml() : "",
    mock ? returnMockBarHtml() : "",
    shellCard(`${header(name, status, carrier)}<div class="mt-4">${body}</div>`),
  ].join("");
  startAlpine();
}

function hata(mesaj: string): void {
  root.innerHTML = shellCard(
    `<p class="text-sm font-medium text-red-700">${escapeHtml(mesaj)}</p>`
  );
}

if (!shipmentName) {
  hata(t("shipment.page.missingShipment"));
} else {
  try {
    // İki istek PARALEL: sevkiyat başlığı ile uygunluk birbirini beklemiyor.
    const [sevkiyat, uygunluk] = await Promise.all([
      getShipment(shipmentName).catch(() => null),
      getReturnEligibility(shipmentName),
    ]);
    render(
      sevkiyat?.name ?? shipmentName,
      sevkiyat?.status ?? "Delivered",
      sevkiyat?.carrier,
      uygunluk
    );
  } catch (e) {
    // Uç yoksa "bağlı değil" kutusu; gerçek bir hata varsa mesajı.
    const notWired = (e as { name?: string })?.name === "NotWiredError";
    if (notWired) {
      root.innerHTML = shellCard(
        NotWiredNotice({
          title: t("shipment.page.returnFormNotWired"),
          endpoint: "api.v1.returns.get_return_eligibility",
        })
      );
    } else {
      hata((e as Error)?.message || t("shipment.page.loadFailed"));
    }
  }
}
