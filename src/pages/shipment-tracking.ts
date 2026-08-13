/**
 * Sevkiyat takibi sayfası — alıcı.
 *
 * Dört ekranı bir arada taşıyor çünkü alıcı için hepsi tek soru: **"kargom
 * nerede ve ne yapmam gerekiyor?"** Ayrı sayfalara bölmek, alıcıyı takip →
 * randevu → onay arasında gezdirmek olurdu.
 *
 *   S5 · Takip çizelgesi   — her zaman
 *   S4 · Teslim onayı      — teslim edilmemişse
 *   S3 · Randevu talebi    — teslim alma / satıcı teslimatı kanallarında
 *   S10 · Teslim özeti     — teslim edilmişse
 *
 * VERİ DURUMU (ölçüldü): sevkiyat detayı GERÇEK uçtan geliyor. Olay geçmişi
 * (`Shipment Event`) ayrı DocType ve listeleyen uç yok — çizelge o yüzden
 * "bağlı değil" diyor. Teslim kanıtı ve randevu da bağlı değil.
 */
import { initFlowbite } from "flowbite";

import "../style.css";
import "../alpine/sidebar";
import { startAlpine } from "../alpine";
import { mountChatPopup, initChatTriggers } from "../components/chat-popup";
import { FloatingPanel, initFloatingPanel, BottomNav, initBottomNav } from "../components/floating";
import { FooterLinks } from "../components/footer";
import { TopBar, initHeaderCart } from "../components/header";
import { initLanguageSelector } from "../components/header/TopBar";
import { DeliveryConfirm } from "../components/logistics/DeliveryConfirm";
import { DeliverySummary } from "../components/logistics/DeliverySummary";
import { NotWiredNotice } from "../components/logistics/NotWiredNotice";
import { renderSidebarColumn, initSidebar } from "../components/sidebar";
import { Breadcrumb } from "../components/shared/Breadcrumb";
import { t } from "../i18n";
import { getShipment, type ShipmentDetail } from "../services/shipmentService";
import { requireAuth } from "../utils/auth-guard";
import { escapeHtml } from "../utils/sanitize";

await requireAuth();

const shipmentName = new URLSearchParams(window.location.search).get("name") ?? "";

const appEl = document.querySelector<HTMLDivElement>("#app")!;
appEl.classList.add("relative");

/** Sayfa kabuğu bir kez çiziliyor; içerik sonradan doluyor. */
appEl.innerHTML = `
  <div id="sticky-header" class="sticky top-0 z-(--z-header) bg-white">
    ${TopBar({ compact: true })}
  </div>

  <div class="bg-[#F5F5F5] min-h-screen">
    <div class="container-boxed flex gap-1 md:gap-[14px]">
      ${renderSidebarColumn()}

      <div class="flex-1 min-w-0">
        <div class="pt-4">
          ${Breadcrumb([
            { label: t("header.myAccount"), href: "/pages/dashboard/buyer-dashboard.html" },
            { label: t("dashboard.myOrders"), href: "/pages/dashboard/orders.html" },
            { label: t("shipment.page.tracking") },
          ])}
        </div>

        <main class="space-y-4 py-4" id="shipment-tracking-root">
          <div class="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-500">
            ${escapeHtml(t("shipment.page.loading"))}
          </div>
        </main>

        <footer>${FooterLinks()}</footer>
      </div>
    </div>
  </div>

  ${FloatingPanel()}
  ${BottomNav()}
`;

initFlowbite();
initHeaderCart();
initFloatingPanel();
initLanguageSelector();
initSidebar();
mountChatPopup();
initChatTriggers();
initBottomNav();

const root = document.querySelector<HTMLElement>("#shipment-tracking-root")!;

/** Terminal durumlar — `constants.py` TERMINAL_STATUSES ile aynı küme. */
const DELIVERED = "Delivered";

function card(inner: string): string {
  return `<section class="rounded-md border border-gray-200 bg-white p-4 sm:p-6">${inner}</section>`;
}

function render(shipment: ShipmentDetail): void {
  const isDelivered = shipment.status === DELIVERED;

  const blocks = [
    // S5 — olay geçmişi ayrı DocType'ta ve uç yok; çizelge yerine sebep.
    card(`
      <h2 class="mb-3 text-base font-semibold text-gray-900">
        ${escapeHtml(t("shipment.page.trackingTitle"))}
      </h2>
      ${NotWiredNotice({
        title: t("shipment.page.timelineNotWired"),
        endpoint: "api.v1.logistics.get_shipment (events)",
      })}
      <!-- Uç geldiğinde burası TrackingTimeline ile değişecek; bileşen hazır
           ve story'lerde doğrulanmış. Şimdiden import etmiyoruz — kullanılmayan
           import ölü koddur. -->
    `),

    isDelivered
      ? // S10 — teslim kanıtı da bağlı değil, ama özet başlığı gerçek veriden.
        card(`
          ${DeliverySummary({
            shipmentName: shipment.name,
            status: shipment.status,
            carrier: shipment.carrier,
            pod: null,
          })}
          <div class="mt-4">
            ${NotWiredNotice({
              title: t("shipment.page.podNotWired"),
              endpoint: "api.v1.logistics.get_proof_of_delivery",
            })}
          </div>
        `)
      : // S4 — teslim onayı. Kod durumu sözleşmede var ama şemada yok, bu
        // yüzden "gerekmiyor" varsayılıyor; ödeme kapısı da kapalı sayılıyor.
        card(
          DeliveryConfirm({
            shipmentName: shipment.name,
            status: shipment.status,
            deliveryCodeStatus: "not_required",
          })
        ),
  ];

  root.innerHTML = blocks.join("");
  startAlpine();
}

function renderError(message: string): void {
  root.innerHTML = card(`
    <p class="text-sm font-medium text-red-700">${escapeHtml(message)}</p>
    <a href="/pages/dashboard/orders.html" class="th-btn-outline th-no-press th-btn-sm mt-3 inline-flex">
      ${escapeHtml(t("shipment.page.backToOrders"))}
    </a>
  `);
}

if (!shipmentName) {
  // Parametresiz açılış — sipariş listesine yönlendirmek yerine sebebi söyle.
  renderError(t("shipment.page.missingName"));
} else {
  try {
    render(await getShipment(shipmentName));
  } catch (e) {
    renderError((e as Error)?.message || t("shipment.page.loadFailed"));
  }
}
