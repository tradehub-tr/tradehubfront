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
 * S6 bildirim akışı — **sözleşmede karşılığı YOK.**
 *
 * `Notification Template` ve `Notification Preference` DocType'ları var, ama
 * "kullanıcıya gönderilmiş bildirim kaydı" diye bir varlık yok. Yani S6'nın
 * beslendiği uç henüz tanımsız. Buradaki satırlar bu yüzden elle yazıldı ve
 * alan adları `Notification Template.event` ile hizalandı; sözleşmeye varlık
 * eklenince bu blok fixture'a taşınmalı.
 */
export const notificationFeed = [
  {
    name: "NTF-2026-00311",
    event: "shipment_shipped",
    title: "Siparişiniz yola çıktı",
    body: "SHP-2026-00042 numaralı sevkiyat Yurtiçi Kargo'ya teslim edildi.",
    created_at: "2026-08-10 09:10:00",
    read: 0,
    shipment: "SHP-2026-00042",
  },
  {
    name: "NTF-2026-00298",
    event: "shipment_out_for_delivery",
    title: "Kurye dağıtıma çıktı",
    body: "Gönderiniz bugün teslim edilecek.",
    created_at: "2026-08-12 07:40:00",
    read: 0,
    shipment: "SHP-2026-00042",
  },
  {
    name: "NTF-2026-00255",
    event: "shipment_delivered",
    title: "Sevkiyat teslim edildi",
    body: "SHP-2026-00041 teslim alındı. Teslim özetini görüntüleyebilirsiniz.",
    created_at: "2026-08-08 14:35:00",
    read: 1,
    shipment: "SHP-2026-00041",
  },
  {
    name: "NTF-2026-00240",
    event: "return_decided",
    title: "İade talebiniz onaylandı",
    body: "RET-2026-00007 için iade kargosu oluşturuldu.",
    created_at: "2026-08-09 15:22:00",
    read: 1,
    shipment: null,
  },
];
