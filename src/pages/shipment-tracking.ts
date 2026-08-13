/**
 * Sevkiyat takibi sayfası — alıcı.
 *
 * Dört ekranı bir arada taşıyor çünkü alıcı için hepsi tek soru: **"kargom
 * nerede ve ne yapmam gerekiyor?"** Ayrı sayfalara bölmek, alıcıyı takip →
 * randevu → onay arasında gezdirmek olurdu.
 *
 *   S5 · Takip çizelgesi   — her zaman
 *   S4 · Teslim onayı      — teslim edilmemişse
 *   S10 · Teslim özeti     — teslim edilmişse
 *
 * VERİ DURUMU (ölçüldü): sevkiyat detayı GERÇEK uçtan geliyor. Olay geçmişi
 * (`Shipment Event`) ayrı DocType ve listeleyen uç yok; teslim kanıtı için
 * DocType bile yok. `?mock=1` ile bu ikisi örnek veriyle çiziliyor
 * (bkz. `services/logisticsMock.ts`).
 */
import "../style.css";
import "../alpine/sidebar";
// Randevu formu (S3) örnek veri modunda çiziliyor — Alpine kaydı gerekli.
import "../alpine/logisticsBuyer";
import { startAlpine } from "../alpine";
import { DeliveryConfirm } from "../components/logistics/DeliveryConfirm";
import { DeliverySummary } from "../components/logistics/DeliverySummary";
import { NotWiredNotice } from "../components/logistics/NotWiredNotice";
import { PickupAppointment } from "../components/logistics/PickupAppointment";
import { ShipmentGroupList } from "../components/logistics/ShipmentGroupList";
import { TrackingTimeline } from "../components/logistics/TrackingTimeline";
import { t } from "../i18n";
import {
  isMockMode,
  mockBannerHtml,
  mockProofOfDelivery,
  mockShipmentDetail,
  mockShipmentList,
  mockTrackingEvents,
} from "../services/logisticsMock";
import { getShipment, type ShipmentDetail } from "../services/shipmentService";
import { requireAuth } from "../utils/auth-guard";
import { escapeHtml } from "../utils/sanitize";

import { mountDashboardShell, shellCard } from "./dashboardShell";

await requireAuth();

const mock = isMockMode();
const shipmentName = new URLSearchParams(window.location.search).get("name") ?? "";

const root = mountDashboardShell({
  breadcrumb: [
    { label: t("header.myAccount"), href: "/pages/dashboard/buyer-dashboard.html" },
    { label: t("dashboard.myOrders"), href: "/pages/dashboard/orders.html" },
    { label: t("shipment.page.tracking") },
  ],
  contentId: "shipment-tracking-root",
  initialContent: shellCard(
    `<p class="text-sm text-gray-500">${escapeHtml(t("shipment.page.loading"))}</p>`
  ),
});

const DELIVERED = "Delivered";

function render(shipment: ShipmentDetail): void {
  const isDelivered = shipment.status === DELIVERED;
  const blocks: string[] = [];

  if (mock) blocks.push(mockBannerHtml());

  /**
   * ── S1 · Siparişin sevkiyatları ── (yalnız örnek veri modunda)
   *
   * Bu ekranın asıl yeri sipariş DETAY sayfası — ama öyle bir sayfa henüz
   * yok (`pages/order/` altında yalnız checkout ve ödeme sonucu var).
   * Sipariş detayı açılınca buradan oraya taşınacak; şimdilik alıcının
   * "siparişimin ne kadarı yolda" sorusunu sorduğu tek yer burası.
   */
  if (mock) {
    blocks.push(
      shellCard(
        ShipmentGroupList({
          orderName: mockShipmentDetail().order,
          shipments: mockShipmentList(),
        })
      )
    );
  }

  // ── S5 · Takip çizelgesi ──
  blocks.push(
    shellCard(
      mock
        ? TrackingTimeline({
            shipmentName: shipment.name,
            trackingNumber: shipment.tracking_number,
            carrier: shipment.carrier,
            events: mockTrackingEvents(),
          })
        : `
          <h2 class="mb-3 text-base font-semibold text-gray-900">
            ${escapeHtml(t("shipment.page.trackingTitle"))}
          </h2>
          ${NotWiredNotice({
            title: t("shipment.page.timelineNotWired"),
            endpoint: "api.v1.logistics.list_shipment_events",
          })}`
    )
  );

  // ── S10 · teslim özeti  /  S4 · teslim onayı ──
  if (isDelivered) {
    blocks.push(
      shellCard(
        DeliverySummary({
          shipmentName: shipment.name,
          status: shipment.status,
          carrier: shipment.carrier,
          // Kanıt yalnız mock modda; gerçekte Proof of Delivery DocType'ı yok.
          pod: mock ? mockProofOfDelivery() : null,
          returnWindowOpen: mock,
        })
      )
    );
  } else {
    blocks.push(
      shellCard(
        DeliveryConfirm({
          shipmentName: shipment.name,
          status: shipment.status,
          deliveryCodeStatus: mock ? "pending" : "not_required",
        })
      )
    );

    /**
     * ── S3 · Randevu talebi ── (yalnız örnek veri modunda)
     *
     * Gerçekte yalnız teslim alma / satıcı teslimatı kanallarında
     * gösterilmeli — ama `channel` alanı `Shipment` şemasında YOK, yani
     * hangi sevkiyatta gösterileceği bugün belirlenemiyor. Alan eklenince
     * koşula bağlanacak.
     *
     * `today` sabit veriliyor: bileşen `new Date()` çağırmıyor ki inceleme
     * her gün aynı ekranı göstersin.
     */
    if (mock) {
      blocks.push(
        shellCard(
          PickupAppointment({
            shipmentName: shipment.name,
            appointmentAt: "2026-08-14 10:30:00",
            appointmentWindow: "09:00 – 12:00",
            pickupLocation: "İkitelli OSB, Bağcılar Cad. No:12 — Depo girişi",
            slots: [
              { value: "09-12", label: "09:00 – 12:00", available: true },
              { value: "12-15", label: "12:00 – 15:00", available: false },
              { value: "15-18", label: "15:00 – 18:00", available: true },
            ],
            today: "2026-08-13",
          })
        )
      );
    }
  }

  root.innerHTML = blocks.join("");
  startAlpine();
}

function renderError(message: string): void {
  root.innerHTML = shellCard(`
    <p class="text-sm font-medium text-red-700">${escapeHtml(message)}</p>
    <a href="/pages/dashboard/orders.html" class="th-btn-outline th-no-press th-btn-sm mt-3 inline-flex">
      ${escapeHtml(t("shipment.page.backToOrders"))}
    </a>
  `);
}

if (mock && !shipmentName) {
  // Mock modda sevkiyat adı şart değil — örnek kayıt zaten var.
  render(mockShipmentDetail() as unknown as ShipmentDetail);
} else if (!shipmentName) {
  renderError(t("shipment.page.missingName"));
} else {
  try {
    render(await getShipment(shipmentName));
  } catch (e) {
    // Mock modda gerçek uç hata verirse örnek kayda düş — inceleme durmasın.
    if (mock) render(mockShipmentDetail() as unknown as ShipmentDetail);
    else renderError((e as Error)?.message || t("shipment.page.loadFailed"));
  }
}
