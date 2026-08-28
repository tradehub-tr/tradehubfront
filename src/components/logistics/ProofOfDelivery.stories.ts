/**
 * S10 · Teslim kanıtı — alıcı görünümü.
 *
 * Dört story dört ayrı ANLAM taşıyor; ikisi kolayca birbirine karıştırılır:
 * "kanıt yok" bir eksik veridir (uç `null` döner), "medya yetkisi yok" ise
 * bir yetki durumudur (alanlar yanıttan çıkarılır). Ayrı ekranlar olmasının
 * sebebi bu.
 */
import { POD_ORNEK_ALANLAR } from "../../services/podMediaSeed";

import { podRow } from "./fixtures";
import { ProofOfDelivery } from "./ProofOfDelivery";

/**
 * Story ile mock AYNI kaydı kullanıyor.
 *
 * İkisi ayrı tanımlandığında sapmıştı: sayfada medya ve unvan düzeltilmişken
 * Storybook'ta üç kusur duruyordu (28 Ağu görsel denetimi). Tek kaynak
 * `services/podMediaSeed.ts` → `POD_ORNEK_ALANLAR`.
 */
const tamKayit = { ...podRow, ...POD_ORNEK_ALANLAR };

export default {
  title: "Lojistik/Alıcı/S10 · Teslim kanıtı",
  id: "logistics-s10-proof-of-delivery",
  tags: ["autodocs"],
};

export const KanitVar = {
  name: "S10-1 · Kanıt var",
  render: () => ProofOfDelivery({ pod: tamKayit }),
};

/** Uç `404` değil `null` döner — bu bir hata DEĞİL, eksik veri. */
export const KanitYok = {
  name: "S10-2 · Kanıt yok",
  render: () => ProofOfDelivery({ pod: null }),
};

/**
 * Medya alanları yanıttan **çıkarılmış** (null atanmamış). Ekran kırık görsel
 * çizmiyor, o alanları hiç göstermiyor ve nedenini tek cümleyle söylüyor.
 */
export const MedyaYetkisiYok = {
  name: "S10-3 · Medya yetkisi yok",
  render: () => {
    const { signature_url: _s, photo_url: _p, document_url: _d, ...medyasiz } = tamKayit;
    return ProofOfDelivery({ pod: medyasiz });
  },
};

/** Eksiklik uyarısı kartın EN ÜSTÜNDE — alıcının ilk göreceği bilgi. */
export const EksikTeslim = {
  name: "S10-4 · Eksik teslim",
  render: () =>
    ProofOfDelivery({
      pod: {
        ...tamKayit,
        delivered_package_count: 6,
        has_discrepancy: 1,
        exception_code: "DAMAGED",
        discrepancy_note: "İki koli ıslanmış, şubede tutuldu.",
      },
    }),
};
