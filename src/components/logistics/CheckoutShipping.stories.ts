/**
 * S13 · Checkout kargo yöntemi seçimi.
 *
 * Fixture `Shipping Method` kayıtlarında `base_cost` var — bu **müşteriye
 * yansıtılan** taban tutar. Taşıyıcıdan alınan fiyat (`carrier_cost`,
 * `price_quote` fixture'ı) storefront'a HİÇ akmıyor; üretici o dosyayı
 * buraya kopyalamıyor. TUR-121'in ayrımı veri katmanında da geçerli.
 */
import { CheckoutShipping } from "./CheckoutShipping";
import { shippingMethods } from "./fixtures";

export default {
  title: "Lojistik/Alıcı/S13 · Checkout kargo",
  id: "logistics-s13-checkout-shipping",
  tags: ["autodocs"],
};

const options = shippingMethods.map((m) => ({
  name: m.name,
  method_name: m.method_name,
  shipping_type: m.shipping_type,
  charge: m.base_cost,
  currency: m.currency,
  min_days: m.min_days,
  max_days: m.max_days,
  available: true,
}));

export const Varsayilan = {
  name: "Yöntem seçimi",
  render: () => CheckoutShipping({ options, selected: options[0]?.name }),
};

/** Sıfır tutar "0,00 ₺" değil "Ücretsiz" — ikisi aynı şey değil algılanıyor. */
export const UcretsizKargo = {
  name: "Ücretsiz kargo seçeneği",
  render: () =>
    CheckoutShipping({
      options: options.map((o, i) => (i === 0 ? { ...o, charge: 0 } : o)),
      selected: options[0]?.name,
    }),
};

/** Eşiğe ne kadar kaldığı gösteriliyor: alıcı sepetini tamamlayabilsin. */
export const UcretsizKargoEsigi = {
  name: "Ücretsiz kargo eşiğine kalan",
  render: () =>
    CheckoutShipping({
      options,
      selected: options[0]?.name,
      freeShippingThreshold: 5000,
      cartTotal: 4120,
    }),
};

/** Eşik aşıldıysa not gösterilmiyor — tamamlanmış bir hedefi hatırlatmak gürültü. */
export const EsikAsildi = {
  name: "Eşik aşıldı (not yok)",
  render: () =>
    CheckoutShipping({
      options,
      selected: options[0]?.name,
      freeShippingThreshold: 5000,
      cartTotal: 6400,
    }),
};

/** Kullanılamayan yöntem sebebiyle birlikte gösteriliyor, gizlenmiyor. */
export const KullanilamazSecenek = {
  name: "Bir yöntem kullanılamıyor",
  render: () =>
    CheckoutShipping({
      options: options.map((o, i) =>
        i === 1
          ? { ...o, available: false, unavailable_reason: "Bu adrese hizmet verilmiyor" }
          : o
      ),
      selected: options[0]?.name,
    }),
};

export const SecenekYok = {
  name: "Hiç yöntem yok",
  render: () => CheckoutShipping({ options: [] }),
};
