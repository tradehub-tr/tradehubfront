/**
 * Sipariş listesindeki "Teslim al" düğmesinin ÇIKMA KURALI.
 *
 * Bu testin koruduğu iddia: **düğme yalnız gerçekten teslim alınabilecek bir
 * sevkiyat varken çizilir.** Koşulsuz bir düğme, tıklayan alıcıyı hiçbir şey
 * bulunmayan bir ekrana götürürdü (`GOREV-TAMAMLAMA-SOZLESMESI` §2 — ölü buton).
 *
 * Alan adları uydurma değil; `07-FE-VERI-SOZLESMESI.md` §1.1'den ve
 * `logistics/constants.py`'deki enum'lardan alındı.
 */
import { describe, expect, it } from "vitest";

import { esle, type KanalliSevkiyat } from "../pickupEntry";

const HAZIR: KanalliSevkiyat = {
  name: "SHP-2026-00035",
  order: "ORD-2026-00840",
  status: "Ready for Pickup",
  shipment_type: "Buyer Pickup",
};

describe("teslim alma girişi — eşleme kuralı", () => {
  it("alıcı teslim alma sevkiyatı eşlenir", () => {
    expect(esle([HAZIR])).toEqual({ "ORD-2026-00840": "SHP-2026-00035" });
  });

  it("satıcı teslimatı da eşlenir — aynı ekran, aynı akış", () => {
    expect(esle([{ ...HAZIR, shipment_type: "Seller Delivery" }])).toEqual({
      "ORD-2026-00840": "SHP-2026-00035",
    });
  });

  it("kargo sevkiyatı eşlenmez — teslim alınacak bir şey yok", () => {
    expect(esle([{ ...HAZIR, shipment_type: "Standard" }])).toEqual({});
  });

  it("ambar aktarması eşlenmez — alıcının işi değil", () => {
    expect(esle([{ ...HAZIR, shipment_type: "Warehouse Transfer" }])).toEqual({});
  });

  it("henüz hazır olmayan sevkiyat eşlenmez", () => {
    expect(esle([{ ...HAZIR, status: "Pending" }])).toEqual({});
  });

  it("teslim alınmış sevkiyat eşlenmez — düğme iş bittikten sonra kalmaz", () => {
    expect(esle([{ ...HAZIR, status: "Picked Up" }])).toEqual({});
  });

  it("sevkiyat adı yoksa eşlenmez — ?name= parametresi üretilemez", () => {
    expect(esle([{ ...HAZIR, name: undefined }])).toEqual({});
  });

  it("sipariş bağı yoksa eşlenmez — hangi karta konacağı bilinemez", () => {
    expect(esle([{ ...HAZIR, order: undefined }])).toEqual({});
  });

  it("bölünmüş sevkiyatta ilki alınır — kartta tek düğme var", () => {
    const ikinci = { ...HAZIR, name: "SHP-2026-00036" };
    expect(esle([HAZIR, ikinci])).toEqual({ "ORD-2026-00840": "SHP-2026-00035" });
  });

  it("farklı siparişler ayrı ayrı eşlenir", () => {
    const digeri = { ...HAZIR, name: "SHP-2026-00099", order: "ORD-2026-00999" };
    expect(esle([HAZIR, digeri])).toEqual({
      "ORD-2026-00840": "SHP-2026-00035",
      "ORD-2026-00999": "SHP-2026-00099",
    });
  });

  it("boş liste boş harita üretir — düğme hiç çizilmez", () => {
    expect(esle([])).toEqual({});
  });
});
