/**
 * Satıcı sevkiyat mock'unun İŞ AKIŞI.
 *
 * Korunan iddia: **satıcı, backend yazılmamışken bile sevkiyat oluşturup
 * koli girebiliyor ve yaptığı iş sayfa yenilenince duruyor.**
 *
 * Bu ekran hiçbir FE görevinin kapsamında değil (`KALAN-ISLER.md` →
 * "Sahipsiz"); testler o yüzden ayrıca değerli — ekranın ne yaptığını
 * kimsenin hatırlamasına gerek kalmıyor.
 */
import { beforeEach, describe, expect, it } from "vitest";

import {
  createShipment,
  kanallar,
  paketTipleri,
  paketler,
  readState,
  resetSellerMock,
  savePackage,
  tasiyicilar,
} from "../logisticsSellerMock";

function senaryoyaGec(senaryo: string | null): void {
  window.history.replaceState({}, "", senaryo ? `/?senaryo=${senaryo}` : "/");
  resetSellerMock();
}

beforeEach(() => {
  senaryoyaGec(null);
  localStorage.clear();
  resetSellerMock();
});

describe("seçim listeleri katalogdan gelir", () => {
  it("kanallar fixture'dan okunur", () => {
    const k = kanallar();
    expect(k.length).toBeGreaterThanOrEqual(4);
    expect(k.map((x) => x.value)).toContain("BUYER_PICKUP");
    // Etiket sözleşmedeki `channel_name` alanından — ekrana gömülü değil.
    expect(k.find((x) => x.value === "CARGO")?.label).toBeTruthy();
  });

  it("taşıyıcılar fixture'dan okunur", () => {
    const t = tasiyicilar();
    expect(t.length).toBeGreaterThanOrEqual(3);
    expect(t.map((x) => x.value)).toContain("YK");
  });

  it("paket tipleri fixture'dan okunur", () => {
    expect(paketTipleri().map((x) => x.value)).toContain("BOX");
  });

  it("hiçbir liste boş dönmez — boş liste seçim yapılamaz bir form demek", () => {
    for (const liste of [kanallar(), tasiyicilar(), paketTipleri()]) {
      expect(liste.length).toBeGreaterThan(0);
    }
  });
});

describe("S2 · sevkiyat oluşturma", () => {
  it("sevkiyat oluşturur ve ad döndürür", async () => {
    const { name } = await createShipment({ channel: "CARGO", carrier: "YK", items: ["I1"] });
    expect(name).toMatch(/^SHP-\d{4}-\d+$/);
    expect(readState().sevkiyatlar[0].name).toBe(name);
  });

  it("kalıcı — sayfa yenilenince duruyor", async () => {
    await createShipment({ channel: "CARGO", carrier: "YK", items: ["I1"] });
    const kayit = JSON.parse(localStorage.getItem("istoc_seller_shipment_mock") ?? "{}");
    expect(kayit.sevkiyatlar).toHaveLength(1);
  });

  it("ürün seçilmeden sevkiyat oluşmaz", async () => {
    await expect(createShipment({ channel: "CARGO", carrier: "YK", items: [] })).rejects.toThrow();
  });

  it("ikinci sevkiyat farklı ad alır — kısmi gönderi mümkün", async () => {
    const a = await createShipment({ channel: "CARGO", carrier: "YK", items: ["I1"] });
    const b = await createShipment({ channel: "CARGO", carrier: "YK", items: ["I2"] });
    expect(a.name).not.toBe(b.name);
    expect(readState().sevkiyatlar).toHaveLength(2);
  });

  it("hata senaryosu tetiklenebilir", async () => {
    senaryoyaGec("hata");
    await expect(
      createShipment({ channel: "CARGO", carrier: "YK", items: ["I1"] })
    ).rejects.toThrow();
  });
});

describe("S8 · koli girişi", () => {
  it("koli eklenir ve sevkiyata bağlanır", async () => {
    const { name } = await createShipment({ channel: "CARGO", carrier: "YK", items: ["I1"] });
    await savePackage({ shipment: name, weight_kg: 2, length_cm: 10, width_cm: 10, height_cm: 10 });
    const koliler = paketler(name);
    expect(koliler).toHaveLength(1);
    expect(koliler[0].package_code).toContain(name);
  });

  it("ikinci koli sıra numarasını artırır", async () => {
    const { name } = await createShipment({ channel: "CARGO", carrier: "YK", items: ["I1"] });
    await savePackage({ shipment: name, weight_kg: 1 });
    await savePackage({ shipment: name, weight_kg: 2 });
    expect(paketler(name).map((k) => k.sequence_label)).toEqual(["1", "2"]);
  });

  it("koliler sevkiyata GÖRE ayrılır — başka sevkiyatınki karışmaz", async () => {
    const a = await createShipment({ channel: "CARGO", carrier: "YK", items: ["I1"] });
    const b = await createShipment({ channel: "CARGO", carrier: "YK", items: ["I2"] });
    await savePackage({ shipment: a.name, weight_kg: 1 });
    expect(paketler(a.name)).toHaveLength(1);
    expect(paketler(b.name)).toHaveLength(0);
  });

  it("sıfırlama temiz başlangıca döndürür", async () => {
    const { name } = await createShipment({ channel: "CARGO", carrier: "YK", items: ["I1"] });
    await savePackage({ shipment: name, weight_kg: 1 });
    resetSellerMock();
    expect(readState().sevkiyatlar).toHaveLength(0);
    expect(paketler(name)).toHaveLength(0);
  });
});
