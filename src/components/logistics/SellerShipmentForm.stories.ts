/**
 * S2 · Satıcı sevkiyat oluşturma.
 *
 * Kritik story `KendiAraciyla`: kanal `SELLER_VEHICLE` seçilince taşıyıcı
 * ve takip alanları HİÇ görünmemeli, yerine plaka/sürücü gelmeli. Bu bir
 * görsel tercih değil — satıcının kendi kamyonuna takip numarası sormak
 * doldurulamayan bir zorunlu alan üretir.
 */
import { carrierOptions, channelOptions, shipmentDetail, shipmentItems } from "./fixtures";
import { SellerShipmentForm } from "./SellerShipmentForm";

export default {
  title: "Lojistik/Satıcı/S2 · Sevkiyat oluşturma",
  id: "logistics-s2-seller-shipment-form",
  tags: ["autodocs"],
};

const remainingItems = shipmentItems.map((row) => ({
  item: row.item,
  item_name: row.item_name,
  remaining_qty: row.remaining_qty,
  uom: row.uom,
}));

export const KargoKanali = {
  name: "Kargo kanalı (taşıyıcı alanları açık)",
  render: () =>
    SellerShipmentForm({
      orderName: shipmentDetail.order,
      remainingItems,
      channels: channelOptions,
      carriers: carrierOptions,
    }),
};

/**
 * Kanal `initialChannel` ile geliyor.
 *
 * İlk yazışta seçenek listesini yeniden sıralayıp "x-model ilk option'ı alır"
 * varsaydım — YANLIŞ. Alpine tarafında `channel` sabit `"CARGO"` idi, sıra
 * değiştirmek hiçbir şeyi değiştirmiyordu. Bu story onu yakaladı; açılış
 * kanalı artık şablondan geçiyor.
 */
export const KendiAraciyla = {
  name: "Satıcı kendi aracıyla (plaka/sürücü)",
  render: () =>
    SellerShipmentForm({
      orderName: shipmentDetail.order,
      remainingItems,
      channels: channelOptions,
      carriers: carrierOptions,
      initialChannel: "SELLER_VEHICLE",
    }),
};

export const AliciTeslimAlacak = {
  name: "Alıcı teslim alacak (taşıyıcı yok)",
  render: () =>
    SellerShipmentForm({
      orderName: shipmentDetail.order,
      remainingItems,
      channels: channelOptions,
      carriers: carrierOptions,
      initialChannel: "BUYER_PICKUP",
    }),
};

export const TekKalem = {
  name: "Tek kalem kaldı",
  render: () =>
    SellerShipmentForm({
      orderName: shipmentDetail.order,
      remainingItems: remainingItems.slice(0, 1),
      channels: channelOptions,
      carriers: carrierOptions,
    }),
};

/** Kalan kalem yoksa form açılmıyor — boş form gönderilemez. */
export const HepsiSevkEdildi = {
  name: "Kalan kalem yok (form kapalı)",
  render: () =>
    SellerShipmentForm({
      orderName: shipmentDetail.order,
      remainingItems: [],
      channels: channelOptions,
      carriers: carrierOptions,
    }),
};
