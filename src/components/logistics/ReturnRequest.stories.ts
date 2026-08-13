/**
 * S11 · İade talebi (alıcı).
 *
 * `PencereKapali` story'si davranışın kendisi: pencere kapalıyken form HİÇ
 * render edilmiyor. Gönderilebilir bırakılsaydı backend reddederdi ve alıcı
 * sebebini anlamazdı.
 *
 * `KismenIadeEdilmis`: daha önce iade edilen miktar düşülüyor, alıcı aynı
 * ürünü iki kez iade edemiyor.
 */
import { returnReasonOptions, shipmentItems } from "./fixtures";
import { ReturnRequest } from "./ReturnRequest";

export default {
  title: "Lojistik/Alıcı/S11 · İade talebi",
  id: "logistics-s11-return-request",
  tags: ["autodocs"],
};

const items = shipmentItems.map((row) => ({
  item: row.item,
  item_name: row.item_name,
  delivered_qty: row.shipped_qty,
  already_returned_qty: row.returned_qty,
  uom: row.uom,
}));

export const Varsayilan = {
  name: "İade edilebilir kalemler",
  render: () =>
    ReturnRequest({
      shipmentName: "SHP-2026-00041",
      items,
      reasons: returnReasonOptions,
      windowOpen: true,
    }),
};

export const KismenIadeEdilmis = {
  name: "Bir kısmı zaten iade edilmiş",
  render: () =>
    ReturnRequest({
      shipmentName: "SHP-2026-00041",
      items: items.map((row, i) =>
        i === 0 ? { ...row, already_returned_qty: row.delivered_qty - 2 } : row
      ),
      reasons: returnReasonOptions,
      windowOpen: true,
    }),
};

/** Hepsi iade edilmişse form yok — sıfır miktarlı talep üretilemez. */
export const HepsiIadeEdilmis = {
  name: "İade edilecek kalem kalmadı",
  render: () =>
    ReturnRequest({
      shipmentName: "SHP-2026-00041",
      items: items.map((row) => ({ ...row, already_returned_qty: row.delivered_qty })),
      reasons: returnReasonOptions,
      windowOpen: true,
    }),
};

export const PencereKapali = {
  name: "İade penceresi kapandı (form yok)",
  render: () =>
    ReturnRequest({
      shipmentName: "SHP-2026-00041",
      items,
      reasons: returnReasonOptions,
      windowOpen: false,
      windowDays: 14,
    }),
};
