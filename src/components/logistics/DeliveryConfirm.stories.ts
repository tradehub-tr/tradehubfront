/**
 * S4 · Teslim onayı + teslim kodu.
 *
 * Bu ekranın story'leri güvenlik davranışını GÖRÜNÜR kılıyor:
 *
 *   * Hiçbir story'de teslim kodunun DEĞERİ yok — sözleşme de döndürmüyor,
 *     yalnız `delivery_code_status`.
 *   * `OdemeBekliyor`'da onay formu HİÇ render edilmiyor; devre dışı buton
 *     bile yok. Devre dışı buton günün sonunda etkinleştiriliyor.
 */
import { DeliveryConfirm } from "./DeliveryConfirm";

export default {
  title: "Lojistik/Alıcı/S4 · Teslim onayı",
  id: "logistics-s4-delivery-confirm",
  tags: ["autodocs"],
};

const base = {
  shipmentName: "SHP-2026-00042",
  status: "Out for Delivery",
  appointmentAt: "2026-08-13 11:00:00",
  pickupLocation: "Ostim Sanayi Sitesi 100. Sokak No:4",
} as const;

export const KodGirisi = {
  name: "Kod bekleniyor",
  render: () => DeliveryConfirm({ ...base, deliveryCodeStatus: "pending" }),
};

export const KodHatali = {
  name: "Kod hatalı (deneme hakkı kaldı)",
  render: () =>
    DeliveryConfirm({ ...base, deliveryCodeStatus: "failed", deliveryCodeAttempts: 2 }),
};

/** Deneme hakkı bittiğinde giriş alanı kalkıyor — süresiz deneme yok. */
export const KodKilitlendi = {
  name: "Deneme hakkı bitti",
  render: () =>
    DeliveryConfirm({ ...base, deliveryCodeStatus: "failed", deliveryCodeAttempts: 3 }),
};

export const KodGerekmiyor = {
  name: "Kod gerekmiyor (tek tuş onay)",
  render: () => DeliveryConfirm({ ...base, deliveryCodeStatus: "not_required" }),
};

/** Ödeme kapısı: form yok, ödeme sayfasına yönlendirme var. */
export const OdemeBekliyor = {
  name: "Ödeme tamamlanmadı (form kapalı)",
  render: () =>
    DeliveryConfirm({
      ...base,
      deliveryCodeStatus: "pending",
      paymentRequired: true,
      paymentStatus: "unpaid",
    }),
};

/** Ödeme muaf edilmişse kapı açılıyor — `waived` da geçerli durum. */
export const OdemeMuaf = {
  name: "Ödeme muaf (kapı açık)",
  render: () =>
    DeliveryConfirm({
      ...base,
      deliveryCodeStatus: "pending",
      paymentRequired: true,
      paymentStatus: "waived",
    }),
};

export const TeslimEdilmis = {
  name: "Zaten teslim edildi",
  render: () =>
    DeliveryConfirm({ ...base, status: "Delivered", deliveryCodeStatus: "verified" }),
};
