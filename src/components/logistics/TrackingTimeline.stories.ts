/**
 * S5 · Takip zaman çizelgesi.
 *
 * Fixture'daki olaylar `carrier_status_code`, `carrier_status_text`,
 * `source` ve `dedupe_key` de taşıyor. Story'ler bunları BİLEREK geçiriyor
 * ki ekranın onları süzdüğü görülebilsin — sözleşme fazlasını verdiğinde
 * alıcıya sızmadığı burada kanıtlanıyor.
 */
import { shipmentDetail, trackingEvents } from "./fixtures";
import { TrackingTimeline } from "./TrackingTimeline";

export default {
  title: "Lojistik/Alıcı/S5 · Takip çizelgesi",
  id: "logistics-s5-tracking-timeline",
  tags: ["autodocs"],
};

const base = {
  shipmentName: shipmentDetail.name,
  trackingNumber: shipmentDetail.tracking_number,
  carrier: shipmentDetail.carrier,
};

export const Varsayilan = {
  name: "Yolda (en yeni üstte)",
  render: () => TrackingTimeline({ ...base, events: trackingEvents }),
};

export const EskidenYeniye = {
  name: "Eskiden yeniye sıralı",
  render: () => TrackingTimeline({ ...base, events: trackingEvents, newestFirst: false }),
};

/** İstisna kodlu olay ayrı kutuda — alıcı gecikmenin sebebini görmeli. */
export const IstisnaliOlay = {
  name: "İstisna kodlu olay",
  render: () =>
    TrackingTimeline({
      ...base,
      events: [
        ...trackingEvents,
        {
          event_time: "2026-08-12 16:40:00",
          status: "In Transit",
          location: "Ankara Aktarma",
          description: "Teslimat denemesi başarısız",
          exception_code: "ADDRESS_NOT_FOUND",
        },
      ],
    }),
};

/** Bilinmeyen istisna kodu → genel metne düşüyor, ham kod gösterilmiyor. */
export const BilinmeyenIstisna = {
  name: "Bilinmeyen istisna kodu",
  render: () =>
    TrackingTimeline({
      ...base,
      events: [
        {
          ...trackingEvents[0],
          exception_code: "CARRIER_INTERNAL_9971",
        },
      ],
    }),
};

export const TeslimEdildi = {
  name: "Teslim edildi (yeşil başlık)",
  render: () =>
    TrackingTimeline({
      ...base,
      events: [
        ...trackingEvents,
        {
          event_time: "2026-08-13 14:32:00",
          status: "Delivered",
          location: "Yenimahalle",
          description: "Alıcıya teslim edildi",
        },
      ],
    }),
};

export const TekOlay = {
  name: "Tek olay",
  render: () => TrackingTimeline({ ...base, events: [trackingEvents[0]] }),
};

export const Bos = {
  name: "Henüz olay yok",
  render: () => TrackingTimeline({ ...base, events: [] }),
};
