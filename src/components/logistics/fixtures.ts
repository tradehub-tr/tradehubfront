/**
 * Story verisi — TEK kaynak: `src/mocks/logistics/*.json`.
 *
 * Bu dosyalar elle yazılmıyor; `tradehub_core/scripts/gen_logistics_types.py`
 * sözleşmeden üretip buraya kopyalıyor. Story'lerde elle nesne kurmak, ekranın
 * sözleşmeden sapmasını GİZLERDİ — alan adı değişince story yine çalışırdı,
 * uygulama çalışmazdı.
 *
 * Bu yüzden buradaki her şey fixture'dan türetiliyor. Fixture'da karşılığı
 * OLMAYAN veriler (bkz. `notificationFeed`) ayrıca işaretli — onlar sözleşme
 * boşluğu, tasarım tercihi değil.
 */
import packageTypeJson from "../../mocks/logistics/package_type.json";
import notificationLogJson from "../../mocks/logistics/notification_log.json";
import notificationPreferenceJson from "../../mocks/logistics/notification_preference.json";
import podJson from "../../mocks/logistics/proof_of_delivery.json";
import returnRequestJson from "../../mocks/logistics/return_request.json";
import shipmentJson from "../../mocks/logistics/shipment.json";
import shippingChannelJson from "../../mocks/logistics/shipping_channel.json";
import shippingMethodJson from "../../mocks/logistics/shipping_method.json";

/** Tek sevkiyat detayı — kalem, koli, bacak ve olay alt tabloları dahil. */
export const shipmentDetail = shipmentJson.detail.data;

/** Sevkiyat listesi (zarf içinden çıkarılmış satırlar). */
export const shipmentList = shipmentJson.default.data.items;

/** Hata zarfı — ekranların hata yolunu göstermek için. */
export const errorEnvelope = shipmentJson.error.error;

export const trackingEvents = shipmentDetail.events;
export const shipmentPackages = shipmentDetail.packages;
export const shipmentItems = shipmentDetail.items;

export const podRow = podJson.default.data.items[0];
export const returnDetail = returnRequestJson.detail.data;
export const returnList = returnRequestJson.default.data.items;
export const notificationPreferences = notificationPreferenceJson.default.data.items;

/** `<select>` seçenekleri — katalog fixture'larından. */
export const channelOptions = shippingChannelJson.default.data.items.map((row) => ({
  value: row.channel_code,
  label: row.channel_name,
}));

export const packageTypeOptions = packageTypeJson.default.data.items.map((row) => ({
  value: row.package_code,
  label: row.package_name,
}));

export const shippingMethods = shippingMethodJson.default.data.items;

/**
 * Taşıyıcı seçenekleri.
 *
 * Fixture'daki sevkiyatlarda geçen taşıyıcı kodlarından türetiliyor —
 * sözleşmede `Logistics Provider` kaydı var ama storefront'a akmayan
 * alanları da taşıyor; satıcı formu için kod + ad yeterli.
 */
export const carrierOptions = [
  { value: "YK", label: "Yurtiçi Kargo" },
  { value: "AK", label: "Aras Kargo" },
  { value: "MNG", label: "MNG Kargo" },
];

/** İade nedenleri — `Return Request.reason` seçim listesi. */
export const returnReasonOptions = [
  { value: "damaged", label: "Hasarlı ürün" },
  { value: "wrong_item", label: "Yanlış ürün" },
  { value: "missing_parts", label: "Eksik parça" },
  { value: "not_as_described", label: "Açıklamaya uymuyor" },
  { value: "other", label: "Diğer" },
];

/**
 * S6 bildirim akışı — **artık sözleşmeden geliyor.**
 *
 * 28 Ağustos 2026'ya kadar buradaki satırlar ELLE yazılıydı: sözleşmede
 * "kullanıcıya gönderilmiş bildirim kaydı" diye bir varlık yoktu. 12-FE o
 * varlığı (`notification_log`) `contract.py`'ye ekledi ve fixture üreteçten
 * akmaya başladı — yani bu blok artık bir sözleşme boşluğunu değil, gerçek
 * bir varlığı temsil ediyor.
 */
export const notificationFeed = notificationLogJson.default.data.items;
