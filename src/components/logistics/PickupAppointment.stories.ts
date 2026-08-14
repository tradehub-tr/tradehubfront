/**
 * S3 · Alıcı randevu talebi.
 *
 * `today` bileşene DIŞARIDAN veriliyor — bileşen `new Date()` çağırsaydı
 * story her gün farklı görünür, görsel gerileme testi imkânsızlaşırdı.
 * Sayfada gerçek tarih geçilir.
 */
import { PickupAppointment } from "./PickupAppointment";

export default {
  title: "Lojistik/Alıcı/S3 · Randevu talebi",
  id: "logistics-s3-pickup-appointment",
  tags: ["autodocs"],
};

const TODAY = "2026-08-13";

const slots = [
  { value: "09-12", label: "09:00 – 12:00", available: true },
  { value: "12-15", label: "12:00 – 15:00", available: false },
  { value: "15-18", label: "15:00 – 18:00", available: true },
];

export const RandevuYok = {
  name: "Randevu yok (ilk talep)",
  render: () =>
    PickupAppointment({
      shipmentName: "SHP-2026-00035",
      slots,
      today: TODAY,
    }),
};

/** Randevu varsa buton "değiştir" diyor — "talep et" yanıltıcı olurdu. */
export const MevcutRandevu = {
  name: "Mevcut randevu (değiştirme)",
  render: () =>
    PickupAppointment({
      shipmentName: "SHP-2026-00035",
      appointmentAt: "2026-08-14 10:30:00",
      appointmentWindow: "09:00 – 12:00",
      pickupLocation: "İkitelli OSB, Bağcılar Cad. No:12 — Depo girişi",
      slots,
      today: TODAY,
    }),
};

/** Hiç uygun aralık yoksa form gösterilmiyor: seçilemeyecek form gürültü. */
export const TumSlotlarDolu = {
  name: "Tüm aralıklar dolu",
  render: () =>
    PickupAppointment({
      shipmentName: "SHP-2026-00035",
      slots: slots.map((s) => ({ ...s, available: false })),
      today: TODAY,
    }),
};

export const TekAralikAcik = {
  name: "Tek aralık açık",
  render: () =>
    PickupAppointment({
      shipmentName: "SHP-2026-00035",
      slots: slots.map((s, i) => ({ ...s, available: i === 0 })),
      today: TODAY,
    }),
};
