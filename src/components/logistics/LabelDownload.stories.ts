/**
 * S9 · Etiket indirme.
 *
 * `EtiketEksik` en önemli story: etiketi olmayan koli kargoya verilemez.
 * Kart ayrı renkte ve üstte toplu uyarı var — satıcı üç kolinin ikisini
 * indirip gitmesin.
 *
 * ── Barkod görselleri (28 Ağustos 2026 düzeltmesi) ──
 *
 * Fixture `/files/barkod/*.png` yolları taşıyor ve Storybook'ta o dosyalar
 * sunulmuyor: üç kart da "Barkod yüklenemedi" diyordu. Ekran doğru
 * davranıyordu ama **barkodun tasarımı hiçbir yerde görünmüyordu** — A11'de
 * POD kanıt medyası için ölçülen durumun aynısı.
 *
 * Artık ana story'ler `barkodUrl()` ile gerçek görsel gösteriyor. `onerror`
 * yedeğini göstermek de değerli olduğu için o hâl KALDIRILMADI, kendi
 * story'sine taşındı (`BarkodYuklenemedi`) — iki davranış da görülebiliyor.
 */
import { barkodUrl, etiketUrl } from "../../services/barcodeSeed";

import { LabelDownload } from "./LabelDownload";
import { shipmentDetail, shipmentPackages } from "./fixtures";

/**
 * Fixture kolileri, açılabilir barkod ve etiketle.
 *
 * `label_url: null` olan koli (PKG-42-003) BİLEREK öyle kalıyor — "etiket
 * henüz hazır değil" hâli fixture'ın taşıdığı gerçek bir durum.
 */
const koliler = shipmentPackages.map((pkg) => ({
  ...pkg,
  barcode_url: barkodUrl(pkg.package_code),
  label_url: pkg.label_url ? etiketUrl(pkg.package_code, shipmentDetail.name) : pkg.label_url,
}));

export default {
  title: "Lojistik/Satıcı/S9 · Etiket indirme",
  id: "logistics-s9-label-download",
  tags: ["autodocs"],
};

export const HepsiHazir = {
  name: "Tüm etiketler hazır",
  render: () => LabelDownload({ shipmentName: shipmentDetail.name, packages: koliler }),
};

export const EtiketEksik = {
  name: "Bir kolinin etiketi yok (uyarı)",
  render: () =>
    LabelDownload({
      shipmentName: shipmentDetail.name,
      packages: koliler.map((pkg, i) =>
        i === 1 ? { ...pkg, label_url: null, label_printed_at: null } : pkg
      ),
    }),
};

export const HicEtiketYok = {
  name: "Hiç etiket üretilmemiş",
  render: () =>
    LabelDownload({
      shipmentName: shipmentDetail.name,
      packages: koliler.map((pkg) => ({
        ...pkg,
        label_url: null,
        barcode_url: null,
        label_printed_at: null,
      })),
    }),
};

/**
 * Barkod adresi var ama görsel gelmiyor — `onerror` yedeği devrede.
 *
 * "Barkod yok" (adres hiç yok) ile "barkod yüklenemedi" (adres var, dosya
 * gelmedi) AYRI durumlar; ikisi aynı ekrana düşerse satıcı sorunun kendisinde
 * mi taşıyıcıda mı olduğunu anlayamaz.
 */
export const BarkodYuklenemedi = {
  name: "Barkod adresi var ama yüklenemiyor",
  render: () =>
    LabelDownload({
      shipmentName: shipmentDetail.name,
      packages: koliler.map((pkg) => ({ ...pkg, barcode_url: "/files/barkod/yok.png" })),
    }),
};

export const KoliYok = {
  name: "Koli tanımlanmamış",
  render: () => LabelDownload({ shipmentName: shipmentDetail.name, packages: [] }),
};
