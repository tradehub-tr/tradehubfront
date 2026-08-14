/**
 * S10 · Teslim özeti + kanıt.
 *
 * Fixture'daki POD kaydı `location_source` alanını da taşıyor
 * (`carrier_api`). Story onu bilerek geçiriyor: ekranda GÖRÜNMEMESİ
 * gerekiyor — konumun hangi kaynaktan geldiği ihtilafta operasyonun işi,
 * alıcının değil.
 */
import { DeliverySummary } from "./DeliverySummary";
import { podRow, shipmentDetail } from "./fixtures";

export default {
  title: "Lojistik/Alıcı/S10 · Teslim özeti",
  id: "logistics-s10-delivery-summary",
  tags: ["autodocs"],
};

const base = {
  shipmentName: "SHP-2026-00041",
  status: "Delivered",
  carrier: shipmentDetail.carrier,
};

export const TamKanit = {
  name: "İmza + fotoğraf var",
  render: () => DeliverySummary({ ...base, pod: podRow }),
};

/** Kanıt yüklenmemişse kutular "sunulmadı" diyor — boş bırakılmıyor. */
export const KanitYok = {
  name: "Kanıt dosyası yok",
  render: () =>
    DeliverySummary({
      ...base,
      pod: { ...podRow, signature_url: null, photo_url: null, document_url: null },
    }),
};

/** Kod kullanılmadan teslim — rozet farkı görünmeli. */
export const KodsuzTeslim = {
  name: "Teslim kodu kullanılmadı",
  render: () => DeliverySummary({ ...base, pod: { ...podRow, delivery_code_used: 0 } }),
};

export const BelgeliTeslim = {
  name: "Belge ekli (irsaliye)",
  render: () =>
    DeliverySummary({
      ...base,
      pod: { ...podRow, document_url: "/files/pod/irsaliye-41.pdf" },
    }),
};

/** İade penceresi açıkken iade başlatma bağlantısı görünüyor (TUR-116). */
export const IadePenceresiAcik = {
  name: "İade penceresi açık",
  render: () => DeliverySummary({ ...base, pod: podRow, returnWindowOpen: true }),
};

export const PodYok = {
  name: "Teslim kaydı yok",
  render: () => DeliverySummary({ ...base, status: "In Transit", pod: null }),
};
