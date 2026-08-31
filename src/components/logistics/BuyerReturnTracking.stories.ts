/**
 * S12-alıcı · İade takibi — 15-FE'de sıfırdan yazıldı.
 *
 * Story'ler kaydın YAŞAM DÖNGÜSÜNÜ gösteriyor. Kırma turunda ölçüldü
 * (31 Ağu): altı sözleşme durumundan üçü (`approved`, `in_transit`,
 * `rejected`) hiçbir mock'ta veri olarak üretilmiyordu ve zaman çizgisinin
 * o dalları bir kez bile çizilmemişti. Bir dal görülmediyse test edilmemiş
 * sayılır; burada hepsi tek sayfada duruyor.
 */
import type { Meta, StoryObj } from "@storybook/html";

import { BuyerReturnTracking, type BuyerReturnTrackingProps } from "./BuyerReturnTracking";

/** Etiket `data:` URI — `/files/...` yolu 404 döner (FE-MOCK-DISIPLINI §2.3). */
const ETIKET =
  "data:image/svg+xml;base64," +
  btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60">' +
      '<rect width="120" height="60" fill="#fff" stroke="#d1d5db"/>' +
      '<text x="60" y="34" text-anchor="middle" font-size="11" font-family="monospace">İADE ETİKETİ</text></svg>'
  );

const TEMEL: BuyerReturnTrackingProps = {
  name: "RET-2026-00007",
  order: "ORD-2026-00871",
  shipment: "SHP-2026-00041",
  status: "requested",
  reason: "damaged",
  requested_at: "2026-08-09 10:00:00",
  items: [
    { item_name: "Pamuklu Kumaş Topu 40m", requested_qty: 6, uom: "Top" },
    { item_name: "Polyester Astar 50m", requested_qty: 3, uom: "Top" },
  ],
};

/** Depo kontrolü bitmiş kalemler — yalnız `inspecting`/`closed`'da gösteriliyor. */
const KONTROL_EDILMIS = [
  {
    item_name: "Pamuklu Kumaş Topu 40m",
    requested_qty: 6,
    received_qty: 6,
    accepted_qty: 4,
    uom: "Top",
  },
  {
    item_name: "Polyester Astar 50m",
    requested_qty: 3,
    received_qty: 2,
    accepted_qty: 0,
    uom: "Top",
  },
];

const KARAR = {
  decided_at: "2026-08-09 15:20:00",
  decision_note: "Hasar fotoğrafları incelendi, iade onaylandı.",
};

const meta: Meta = {
  title: "Lojistik/S12 İade Takibi (alıcı)",
  parameters: {
    docs: {
      description: {
        component:
          "Alıcının kendi iade talebini izlediği ekran. Satıcı kuyruğundan farkı: " +
          "karar düğmesi yok, bekleme süresi yok, başkasının kaydı yok.",
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const KararBekliyor: Story = {
  name: "1 · Karar bekliyor",
  render: () => BuyerReturnTracking(TEMEL),
};

export const Onaylandi: Story = {
  name: "2 · Satıcı onayladı",
  render: () =>
    BuyerReturnTracking({ ...TEMEL, ...KARAR, status: "approved", return_label_url: ETIKET }),
};

export const Reddedildi: Story = {
  name: "3 · Satıcı reddetti — çizgi erken bitiyor",
  render: () =>
    BuyerReturnTracking({
      ...TEMEL,
      status: "rejected",
      decided_at: KARAR.decided_at,
      decision_note: "Ürün kullanılmış olarak geri gönderilmiş; iade kabul edilmedi.",
      // Kontrol verisi DOLU gelse bile ekran göstermemeli — kırma turu bulgusu.
      items: KONTROL_EDILMIS,
    }),
};

export const KargoYolda: Story = {
  name: "4 · İade kargosu yolda",
  render: () =>
    BuyerReturnTracking({
      ...TEMEL,
      ...KARAR,
      status: "in_transit",
      return_shipment: "SHP-2026-00044",
      return_label_url: ETIKET,
      items: KONTROL_EDILMIS,
    }),
};

export const KontrolEdiliyor: Story = {
  name: "5 · Depoda kontrol ediliyor",
  render: () =>
    BuyerReturnTracking({
      ...TEMEL,
      ...KARAR,
      status: "inspecting",
      return_shipment: "SHP-2026-00044",
      return_label_url: ETIKET,
      refund_amount: 2480,
      items: KONTROL_EDILMIS,
    }),
};

export const Kapandi: Story = {
  name: "6 · Kapandı ve para iadesi yapıldı",
  render: () =>
    BuyerReturnTracking({
      ...TEMEL,
      ...KARAR,
      status: "closed",
      is_closed: 1,
      return_shipment: "SHP-2026-00044",
      return_label_url: ETIKET,
      refund_amount: 2480,
      refund_triggered_at: "2026-08-14 09:05:00",
      closed_at: "2026-08-14 09:05:00",
      items: KONTROL_EDILMIS,
    }),
};

export const KalemsizKayit: Story = {
  name: "7 · Kalem kırılımı yok",
  render: () => BuyerReturnTracking({ ...TEMEL, items: [] }),
};
