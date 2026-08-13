/**
 * S6 · Bildirim merkezi ve S7 · Bildirim tercihleri.
 *
 * S7'nin `ZorunluKilitli` story'si kabul kriterinin kendisi: zorunlu
 * operasyon bildirimi kapatılamıyor, anahtar devre dışı ve açık.
 *
 * S6'nın verisi fixture'dan GELMİYOR — sözleşmede "gönderilmiş bildirim
 * kaydı" varlığı yok (`Notification Template` ve `Notification Preference`
 * var, ikisi de tanım tarafı). Ayrıntı `fixtures.ts` → `notificationFeed`.
 */
import { notificationFeed, notificationPreferences } from "./fixtures";
import { NotificationCenter, NotificationPreferences } from "./NotificationCenter";

export default {
  title: "Lojistik/Alıcı/S6-S7 · Bildirimler",
  id: "logistics-s6-s7-notifications",
  tags: ["autodocs"],
};

export const BildirimListesi = {
  name: "S6 · Bildirim merkezi",
  render: () => NotificationCenter({ rows: notificationFeed }),
};

export const HepsiOkundu = {
  name: "S6 · Hepsi okundu",
  render: () => NotificationCenter({ rows: notificationFeed.map((r) => ({ ...r, read: 1 })) }),
};

/** Sevkiyata bağlı olmayan bildirimde takip bağlantısı çıkmıyor. */
export const SevkiyatsizBildirim = {
  name: "S6 · Sevkiyata bağlı olmayan bildirim",
  render: () => NotificationCenter({ rows: notificationFeed.filter((r) => !r.shipment) }),
};

export const BildirimYok = {
  name: "S6 · Bildirim yok",
  render: () => NotificationCenter({ rows: [] }),
};

/**
 * Fixture'daki üç tercihin biri zorunlu (`is_mandatory: 1`,
 * `NT-EXCEPTION-OPS-INAPP`) — anahtarı kilitli ve gerekçesi yazıyor.
 */
export const ZorunluKilitli = {
  name: "S7 · Tercihler (zorunlu kilitli)",
  render: () => NotificationPreferences({ rows: notificationPreferences }),
};

export const HepsiIstegeBagli = {
  name: "S7 · Hepsi isteğe bağlı",
  render: () =>
    NotificationPreferences({
      rows: notificationPreferences.map((r) => ({ ...r, is_mandatory: 0, locked_reason: null })),
    }),
};

export const TercihYok = {
  name: "S7 · Tercih yok",
  render: () => NotificationPreferences({ rows: [] }),
};
