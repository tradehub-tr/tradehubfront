/**
 * S8 · Satıcı paketleme girişi.
 *
 * `DesiAsimi` story'si ekonomik uyarıyı gösteriyor: hacimsel ağırlık fiili
 * ağırlığı geçtiğinde satıcı desi üzerinden ücretlendirilir. Uyarı olmasa
 * satıcı faturayı görene kadar bunu fark etmez.
 *
 * Yeni koli formunda desi alanı YOK — hesap backend'de.
 */
import { packageTypeOptions, shipmentDetail, shipmentPackages } from "./fixtures";
import { SellerPacking } from "./SellerPacking";

export default {
  title: "Lojistik/Satıcı/S8 · Paketleme",
  id: "logistics-s8-seller-packing",
  tags: ["autodocs"],
};

export const Koliler = {
  name: "Tanımlı koliler",
  render: () =>
    SellerPacking({
      shipmentName: shipmentDetail.name,
      packages: shipmentPackages,
      packageTypes: packageTypeOptions,
    }),
};

/** Fixture'da desi < ağırlık; uyarıyı görmek için tek koli çarpıtılıyor. */
export const DesiAsimi = {
  name: "Desi ağırlığı aşıyor (uyarı)",
  render: () =>
    SellerPacking({
      shipmentName: shipmentDetail.name,
      packages: shipmentPackages.map((pkg, i) =>
        i === 0 ? { ...pkg, weight_kg: 4, desi: 32 } : pkg
      ),
      packageTypes: packageTypeOptions,
    }),
};

/** Ölçüsü girilmemiş koli — eksik alanlar "—" ile görünür kalıyor. */
export const EksikOlcu = {
  name: "Ölçüsü girilmemiş koli",
  render: () =>
    SellerPacking({
      shipmentName: shipmentDetail.name,
      packages: [
        {
          package_code: "PKG-42-004",
          sequence_label: "4/4",
          package_type: null,
          length_cm: null,
          width_cm: null,
          height_cm: null,
          weight_kg: null,
          desi: null,
        },
      ],
      packageTypes: packageTypeOptions,
    }),
};

export const Bos = {
  name: "Henüz koli yok",
  render: () =>
    SellerPacking({
      shipmentName: shipmentDetail.name,
      packages: [],
      packageTypes: packageTypeOptions,
    }),
};

/** Terminal durumda paketleme kilitli — form yok, yalnız kayıt görünüyor. */
export const Kilitli = {
  name: "Kilitli (terminal durum)",
  render: () =>
    SellerPacking({
      shipmentName: shipmentDetail.name,
      packages: shipmentPackages,
      packageTypes: packageTypeOptions,
      locked: true,
    }),
};
