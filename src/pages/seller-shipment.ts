/**
 * Sevkiyat yönetimi (S2, S8, S9) — satıcı.
 *
 * Üçü tek sayfada çünkü satıcı için tek bir akış: sevkiyatı oluştur →
 * kolileri gir → etiketi indir.
 *
 * VERİ DURUMU (ölçüldü):
 *   S2 · `create_shipment` VAR ama yalnız order/items/idempotency_key alıyor;
 *        formun 9 alanı karşılıksız. Gerçek modda form çizilmiyor.
 *   S8 · Koli kaydetme ucu yok. Mevcut koliler detay yanıtından geliyor.
 *   S9 · `Shipment Package` şemasında etiket/barkod alanı yok.
 *
 * `?mock=1` üçünü de örnek veriyle çiziyor.
 */
import "../style.css";
import "../alpine/sidebar";
import "../alpine/logisticsSeller";
import { startAlpine } from "../alpine";
import { LabelDownload } from "../components/logistics/LabelDownload";
import { NotWiredNotice } from "../components/logistics/NotWiredNotice";
import { statusBadge } from "../components/logistics/presentation";
import { SellerPacking } from "../components/logistics/SellerPacking";
import { SellerShipmentForm } from "../components/logistics/SellerShipmentForm";
import { t } from "../i18n";
import {
  isMockMode,
  mockBannerHtml,
  mockPackages,
  mockShipmentDetail,
  mockShipmentItems,
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
    { label: t("shipment.page.sellerPanel"), href: "/pages/seller/dashboard.html" },
    { label: t("shipment.page.sellerShipment") },
  ],
  contentId: "seller-shipment-root",
  initialContent: shellCard(
    `<p class="text-sm text-gray-500">${escapeHtml(t("shipment.page.loading"))}</p>`
  ),
});

const CHANNELS = [
  { value: "CARGO", label: "Kargo" },
  { value: "COURIER", label: "Kurye" },
  { value: "SELLER_VEHICLE", label: "Satıcı aracı" },
  { value: "BUYER_PICKUP", label: "Alıcı teslim alacak" },
];
const CARRIERS = [
  { value: "YK", label: "Yurtiçi Kargo" },
  { value: "AK", label: "Aras Kargo" },
  { value: "MNG", label: "MNG Kargo" },
];
const PACKAGE_TYPES = [
  { value: "BOX", label: "Standart Koli" },
  { value: "LBOX", label: "Büyük Koli" },
  { value: "PLT", label: "Palet" },
];

/** Sevkiyat yokken: oluşturma ekranı (S2). */
function renderCreate(): void {
  root.innerHTML = [
    mock ? mockBannerHtml() : "",
    shellCard(
      mock
        ? SellerShipmentForm({
            orderName: mockShipmentDetail().order,
            remainingItems: mockShipmentItems().map((row) => ({
              item: row.item,
              item_name: row.item_name,
              remaining_qty: row.remaining_qty,
              uom: row.uom,
            })),
            channels: CHANNELS,
            carriers: CARRIERS,
          })
        : `<h1 class="mb-3 text-base font-semibold text-gray-900">
             ${escapeHtml(t("shipment.sellerForm.title"))}
           </h1>
           ${NotWiredNotice({
             title: t("shipment.page.createNotWired"),
             endpoint: "api.v1.shipment.create_shipment (yalnız order/items alıyor)",
           })}`
    ),
  ].join("");
  startAlpine();
}

/** Sevkiyat varken: paketleme (S8) + etiket (S9). */
function renderManage(shipment: ShipmentDetail): void {
  const packages = mock
    ? mockPackages()
    : ((shipment.packages ?? []) as ReturnType<typeof mockPackages>);

  root.innerHTML = [
    mock ? mockBannerHtml() : "",
    shellCard(`
      <div class="flex flex-wrap items-center gap-2">
        ${statusBadge(shipment.status)}
        <code class="font-mono text-xs text-gray-600">${escapeHtml(shipment.name)}</code>
        ${
          shipment.tracking_number
            ? `<span class="font-mono text-xs text-gray-500">${escapeHtml(shipment.tracking_number)}</span>`
            : ""
        }
      </div>
    `),
    shellCard(
      SellerPacking({
        shipmentName: shipment.name,
        packages,
        packageTypes: PACKAGE_TYPES,
        // Kayıt ucu yokken form açık bırakmak yanlış olurdu; mock modda
        // açık, çünkü amaç formu incelemek.
        locked: !mock,
      })
    ),
    shellCard(
      mock
        ? LabelDownload({ shipmentName: shipment.name, packages })
        : `<h2 class="mb-3 text-base font-semibold text-gray-900">
             ${escapeHtml(t("shipment.label.title"))}
           </h2>
           ${NotWiredNotice({
             title: t("shipment.page.labelNotWired"),
             endpoint: "Shipment Package şemasında label_url/barcode_url yok",
           })}`
    ),
  ].join("");
  startAlpine();
}

if (mock && !shipmentName) {
  renderManage(mockShipmentDetail() as unknown as ShipmentDetail);
} else if (!shipmentName) {
  renderCreate();
} else {
  try {
    renderManage(await getShipment(shipmentName));
  } catch (e) {
    if (mock) renderManage(mockShipmentDetail() as unknown as ShipmentDetail);
    else {
      root.innerHTML = shellCard(
        `<p class="text-sm font-medium text-red-700">${escapeHtml(
          (e as Error)?.message || t("shipment.page.loadFailed")
        )}</p>`
      );
    }
  }
}
