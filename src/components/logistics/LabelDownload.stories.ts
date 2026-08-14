/**
 * S9 · Etiket indirme.
 *
 * `EtiketEksik` en önemli story: etiketi olmayan koli kargoya verilemez.
 * Kart ayrı renkte ve üstte toplu uyarı var — satıcı üç kolinin ikisini
 * indirip gitmesin.
 *
 * Barkod görselleri fixture'da `/files/...` yolunda; Storybook'ta o dosyalar
 * sunulmuyor, bu yüzden `onerror` yedeği devreye giriyor. Kırık resim
 * ikonu ile "barkod hazır değil" farkı böyle korunuyor.
 */
import { LabelDownload } from "./LabelDownload";
import { shipmentDetail, shipmentPackages } from "./fixtures";

export default {
  title: "Lojistik/Satıcı/S9 · Etiket indirme",
  id: "logistics-s9-label-download",
  tags: ["autodocs"],
};

export const HepsiHazir = {
  name: "Tüm etiketler hazır",
  render: () =>
    LabelDownload({ shipmentName: shipmentDetail.name, packages: shipmentPackages }),
};

export const EtiketEksik = {
  name: "Bir kolinin etiketi yok (uyarı)",
  render: () =>
    LabelDownload({
      shipmentName: shipmentDetail.name,
      packages: shipmentPackages.map((pkg, i) =>
        i === 1 ? { ...pkg, label_url: null, label_printed_at: null } : pkg
      ),
    }),
};

export const HicEtiketYok = {
  name: "Hiç etiket üretilmemiş",
  render: () =>
    LabelDownload({
      shipmentName: shipmentDetail.name,
      packages: shipmentPackages.map((pkg) => ({
        ...pkg,
        label_url: null,
        barcode_url: null,
        label_printed_at: null,
      })),
    }),
};

export const KoliYok = {
  name: "Koli tanımlanmamış",
  render: () => LabelDownload({ shipmentName: shipmentDetail.name, packages: [] }),
};
