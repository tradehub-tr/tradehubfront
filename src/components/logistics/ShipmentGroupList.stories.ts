/**
 * S1 · Çoklu sevkiyat gösterimi.
 *
 * Story'ler "kaç kart çiziliyor"u değil, ekranın cevapladığı soruyu
 * doğruluyor: **siparişimin ne kadarı yolda?** Bu yüzden kısmi sevk,
 * tam sevk ve tek sevkiyat ayrı ayrı var — ilerleme çubuğu üçünde de
 * farklı görünmeli.
 */
import { shipmentDetail, shipmentItems } from "./fixtures";
import { ShipmentGroupList } from "./ShipmentGroupList";

export default {
  title: "Lojistik/Alıcı ve Satıcı/S1 · Çoklu sevkiyat",
  id: "logistics-s1-shipment-group",
  tags: ["autodocs"],
};

/** Sipariş iki sevkiyata bölündü; kalemlerin bir kısmı hâlâ bekliyor. */
const partial = [
  {
    name: shipmentDetail.name,
    status: shipmentDetail.status,
    carrier: shipmentDetail.carrier,
    tracking_number: shipmentDetail.tracking_number,
    package_count: shipmentDetail.package_count,
    ship_date: shipmentDetail.ship_date,
    estimated_delivery: shipmentDetail.estimated_delivery,
    items: shipmentItems,
  },
  {
    name: "SHP-2026-00043",
    status: "Pending",
    carrier: null,
    tracking_number: null,
    package_count: 1,
    ship_date: null,
    estimated_delivery: "2026-08-16",
    // Kalan miktarların bir kısmı ikinci sevkiyata alındı.
    items: shipmentItems.map((row) => ({
      ...row,
      shipped_qty: Math.min(row.remaining_qty, 4),
      remaining_qty: Math.max(0, row.remaining_qty - 4),
    })),
  },
];

export const KismiSevk = {
  name: "Kısmi sevk (2 parça, kalan var)",
  render: () => ShipmentGroupList({ orderName: shipmentDetail.order, shipments: partial }),
};

export const TamamiSevkEdildi = {
  name: "Tamamı sevk edildi",
  render: () =>
    ShipmentGroupList({
      orderName: shipmentDetail.order,
      shipments: [
        {
          ...partial[0],
          status: "Delivered",
          items: shipmentItems.map((row) => ({
            ...row,
            shipped_qty: row.ordered_qty,
            remaining_qty: 0,
          })),
        },
      ],
    }),
};

export const TekSevkiyat = {
  name: "Tek sevkiyat",
  render: () =>
    ShipmentGroupList({ orderName: shipmentDetail.order, shipments: [partial[0]] }),
};

/** Satıcı görünümü — tek fark yönetim bağlantısı. */
export const SaticiGorunumu = {
  name: "Satıcı görünümü (yönetim bağlantılı)",
  render: () =>
    ShipmentGroupList({
      orderName: shipmentDetail.order,
      shipments: partial,
      canManage: true,
    }),
};

export const Bos = {
  name: "Sevkiyat yok",
  render: () => ShipmentGroupList({ orderName: "ORD-2026-00900", shipments: [] }),
};
