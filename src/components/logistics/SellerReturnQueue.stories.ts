/**
 * S12 · İade yanıtı + takip (satıcı).
 *
 * `now` dışarıdan veriliyor; bekleme süresi bileşen içinde `Date.now()` ile
 * hesaplansaydı story her gün başka rozet gösterirdi.
 *
 * Sıralama iddiası burada doğrulanıyor: karar bekleyenler önce, sonra en
 * eski talep önce. Gecikmiş talep (48 saatten fazla) kehribar renkte.
 */
import { returnDetail, returnList } from "./fixtures";
import { SellerReturnQueue } from "./SellerReturnQueue";

export default {
  title: "Lojistik/Satıcı/S12 · İade kuyruğu",
  id: "logistics-s12-seller-return-queue",
  tags: ["autodocs"],
};

/** Fixture'daki liste + karar bekleyen iki satır. */
const mixed = [
  {
    name: "RET-2026-00012",
    order: "ORD-2026-00902",
    shipment: "SHP-2026-00048",
    status: "requested",
    reason: "wrong_item",
    requested_at: "2026-08-13 08:30:00",
    decided_at: null,
    is_closed: 0,
    refund_amount: null,
  },
  {
    name: "RET-2026-00009",
    order: "ORD-2026-00884",
    shipment: "SHP-2026-00045",
    status: "requested",
    reason: "damaged",
    requested_at: "2026-08-10 09:00:00",
    decided_at: null,
    is_closed: 0,
    refund_amount: 1250,
  },
  {
    name: returnDetail.name,
    order: returnDetail.order,
    shipment: returnDetail.shipment,
    status: returnDetail.status,
    reason: returnDetail.reason,
    requested_at: returnDetail.requested_at,
    decided_at: returnDetail.decided_at,
    is_closed: returnDetail.is_closed,
    refund_amount: returnDetail.refund_amount,
  },
];

const NOW = "2026-08-13 12:00:00";

export const KarisikKuyruk = {
  name: "Karar bekleyen + karara bağlanmış",
  render: () => SellerReturnQueue({ rows: mixed, now: NOW }),
};

/** 48 saati aşan bekleyiş kehribar; tazesi gri. Sıra da buna göre. */
export const GecikmisKarar = {
  name: "Gecikmiş karar (48 saat+)",
  render: () => SellerReturnQueue({ rows: mixed.slice(0, 2), now: NOW }),
};

export const KapanmisTalep = {
  name: "Kapanmış talep (soluk)",
  render: () =>
    SellerReturnQueue({
      rows: [{ ...mixed[2], is_closed: 1, status: "closed" }],
      now: NOW,
    }),
};

/** Fixture listesi ham hâliyle — üretilen alan adlarının uyumu burada görünür. */
export const FixtureListesi = {
  name: "Fixture listesi",
  render: () => SellerReturnQueue({ rows: returnList, now: NOW }),
};

export const Bos = {
  name: "İade talebi yok",
  render: () => SellerReturnQueue({ rows: [] }),
};
