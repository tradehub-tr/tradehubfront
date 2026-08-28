/**
 * Bildirim tercihleri + teslim kanıtı mock'unun İŞ AKIŞI.
 *
 * Bu testin koruduğu iddia: **backend hiç yazılmamışken bile alıcı bildirim
 * tercihini gerçekten değiştirebiliyor** (`FE-MOCK-DISIPLINI.md` §1). Ekranın
 * çizilmesi yetmez — 13 Ağustos'tan 28 Ağustos'a kadar ekran çiziliyordu ve
 * anahtar hiçbir modda kaydetmiyordu.
 *
 * 12-FE analizindeki kabul senaryolarının (K1…K13) birim karşılığı burada;
 * tarayıcı karşılığı `tests/e2e/storefront-bildirim-takip.spec.ts`.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import exceptionCodeJson from "../../mocks/logistics/shipment_exception_code.json";

import {
  getProofOfDelivery,
  listNotificationPreferences,
  listNotifications,
  markNotificationRead,
  readState,
  resetNotificationMock,
  setNotificationPreference,
} from "../logisticsNotificationMock";

const ALICI_SABLONU = "NT-SHIPPED-BUYER-EMAIL";
const SATICI_SABLONU = "NT-DELIVERED-SELLER-EMAIL";
const ZORUNLU_SABLON = "NT-EXCEPTION-OPS-INAPP";
const SEVKIYAT = "SHP-2026-00041";

/** Senaryo anahtarını URL'e koyar; mock durumu ondan kuruluyor. */
function senaryoyaGec(senaryo: string | null): void {
  // Göreli yol: happy-dom belgesi `http://localhost:3000`'da açılıyor,
  // mutlak URL farklı origin sayılıp `SecurityError` veriyor.
  window.history.replaceState({}, "", senaryo ? `/?senaryo=${senaryo}` : "/");
  resetNotificationMock();
}

/**
 * Sayfa yenilenmesini taklit eder.
 *
 * `resetNotificationMock()` BU İŞE YARAMAZ — o "Demo verisini sıfırla"
 * düğmesidir ve `localStorage`'ı da siler, yani kalıcılığı sınamak yerine
 * yok eder. Yenilemenin gerçek karşılığı modül belleğinin sıfırlanıp deponun
 * yerinde kalması: `vi.resetModules()` + yeniden import.
 */
async function sayfayiYenile() {
  vi.resetModules();
  return import("../logisticsNotificationMock");
}

beforeEach(() => {
  senaryoyaGec(null);
  localStorage.clear();
  resetNotificationMock();
});

describe("K3 · rol süzgeci", () => {
  it("alıcıya YALNIZ kendi tercihlerini verir", async () => {
    const satirlar = await listNotificationPreferences();

    expect(satirlar.every((s) => s.recipient_role === "buyer")).toBe(true);
    expect(satirlar.map((s) => s.template)).not.toContain(SATICI_SABLONU);
    expect(satirlar.map((s) => s.template)).not.toContain(ZORUNLU_SABLON);
  });

  it("fixture'da başka rollerin kayıtları GERÇEKTEN var — süzgeç iş yapıyor", () => {
    // Süzgeç kaldırılırsa bu test değil, yukarıdaki kırılır. Bu satır
    // "hiç kayıt yoktu, o yüzden geçti" ihtimalini eler.
    const roller = readState().prefs.map((p) => p.recipient_role);
    expect(new Set(roller)).toEqual(new Set(["buyer", "seller", "operations"]));
    expect(roller.filter((r) => r !== "buyer").length).toBeGreaterThan(0);
  });

  it("başka rolün tercihi doğrudan çağrıyla da değiştirilemez", async () => {
    await expect(
      setNotificationPreference({ template: SATICI_SABLONU, enabled: true })
    ).rejects.toThrow();
  });
});

describe("K1 · tercih değiştirme ve kalıcılık", () => {
  it("kapatılan tercih güncellenmiş satırın TAMAMIYLA döner", async () => {
    const sonuc = await setNotificationPreference({ template: ALICI_SABLONU, enabled: false });

    expect(sonuc.template).toBe(ALICI_SABLONU);
    expect(sonuc.enabled).toBe(0);
    expect(sonuc.event).toBe("shipment_shipped");
    expect(sonuc.channel).toBe("email");
  });

  it("değişiklik sayfa yenilenince DURUYOR", async () => {
    await setNotificationPreference({ template: ALICI_SABLONU, enabled: false });

    const yeni = await sayfayiYenile();
    const satirlar = await yeni.listNotificationPreferences();
    expect(satirlar.find((s) => s.template === ALICI_SABLONU)?.enabled).toBe(0);
  });

  it("aynı değeri yeniden yazmak hata değil (idempotent)", async () => {
    await setNotificationPreference({ template: ALICI_SABLONU, enabled: false });
    const ikinci = await setNotificationPreference({ template: ALICI_SABLONU, enabled: false });
    expect(ikinci.enabled).toBe(0);
  });

  it("bilinmeyen şablon reddedilir", async () => {
    await expect(
      setNotificationPreference({ template: "NT-YOK", enabled: true })
    ).rejects.toThrow();
  });
});

describe("K2 · zorunlu bildirim kapatılamaz", () => {
  it("zorunlu şablonda kayıt reddedilir", async () => {
    senaryoyaGec("hepsi-zorunlu");
    await expect(
      setNotificationPreference({ template: ALICI_SABLONU, enabled: false })
    ).rejects.toThrow();
  });

  it("reddedilen kayıt durumu DEĞİŞTİRMEZ", async () => {
    senaryoyaGec("hepsi-zorunlu");
    const once = (await listNotificationPreferences()).find((s) => s.template === ALICI_SABLONU);

    await expect(
      setNotificationPreference({ template: ALICI_SABLONU, enabled: false })
    ).rejects.toThrow();

    const sonra = (await listNotificationPreferences()).find((s) => s.template === ALICI_SABLONU);
    expect(sonra?.enabled).toBe(once?.enabled);
  });
});

describe("K4 · kayıt hatası senaryosu", () => {
  it("kayıt reddedilir ve eski değer korunur", async () => {
    senaryoyaGec("kayit-hatasi");
    const once = (await listNotificationPreferences()).find((s) => s.template === ALICI_SABLONU);

    await expect(
      setNotificationPreference({ template: ALICI_SABLONU, enabled: false })
    ).rejects.toThrow();

    const sonra = (await listNotificationPreferences()).find((s) => s.template === ALICI_SABLONU);
    expect(sonra?.enabled).toBe(once?.enabled);
  });
});

describe("K5 · boş ve yetkisiz durumlar", () => {
  it("boş senaryosunda liste boş döner — hata DEĞİL", async () => {
    senaryoyaGec("bos");
    await expect(listNotificationPreferences()).resolves.toEqual([]);
  });

  it("yetkisiz senaryosunda liste reddedilir", async () => {
    senaryoyaGec("yetkisiz");
    await expect(listNotificationPreferences()).rejects.toThrow();
  });
});

describe("K12 · bildirim akışı", () => {
  it("yalnız gönderilmiş ve alıcıya ait kayıtlar döner", async () => {
    const kayitlar = await listNotifications();

    expect(kayitlar.length).toBeGreaterThan(0);
    expect(kayitlar.every((n) => n.status === "sent")).toBe(true);
    expect(kayitlar.every((n) => n.recipient_role === "buyer")).toBe(true);
  });

  it("en yeni bildirim başta", async () => {
    const kayitlar = await listNotifications();
    const tarihler = kayitlar.map((n) => n.sent_at);
    expect([...tarihler].sort().reverse()).toEqual(tarihler);
  });

  it("her kayıt sevkiyatına bağlanabiliyor", async () => {
    const kayitlar = await listNotifications();
    expect(kayitlar.every((n) => typeof n.shipment === "string" && n.shipment.length > 0)).toBe(
      true
    );
  });

  it("okundu işareti kalıcı ve idempotent", async () => {
    const [ilk] = await listNotifications();
    expect(ilk.read_at).toBeNull();

    const okundu = await markNotificationRead(ilk.name);
    expect(okundu.read_at).not.toBeNull();

    // İkinci çağrı damgayı EZMEZ.
    const ikinci = await markNotificationRead(ilk.name);
    expect(ikinci.read_at).toBe(okundu.read_at);

    const yeni = await sayfayiYenile();
    const yenidenOkunan = (await yeni.listNotifications()).find((n) => n.name === ilk.name);
    expect(yenidenOkunan?.read_at).toBe(okundu.read_at);
  });
});

describe("K8-K11 · teslim kanıtı", () => {
  it("kanıt taşıyıcı bilgisini içerir, iç damgaları içermez (K-E)", async () => {
    const pod = await getProofOfDelivery(SEVKIYAT);

    expect(pod?.received_by).toBeTruthy();
    expect(pod?.waybill_number).toBe("MNG-2210554");
    expect(pod?.delivery_point).toBe("MNG-35004");
    // `source` ve `recorded_by` sözleşmede var ama ekrana GİRMİYOR — mock da
    // üretmiyor ki ekran yanlışlıkla basmasın.
    expect(pod).not.toHaveProperty("source");
    expect(pod).not.toHaveProperty("recorded_by");
  });

  it("K9 · kanıt yoksa null döner, hata FIRLATMAZ", async () => {
    senaryoyaGec("pod-yok");
    await expect(getProofOfDelivery(SEVKIYAT)).resolves.toBeNull();
  });

  it("K10 · medya yetkisi yoksa URL alanları yanıttan ÇIKARILIR", async () => {
    senaryoyaGec("pod-medyasiz");
    const pod = await getProofOfDelivery(SEVKIYAT);

    // `null` değil, alanın kendisi yok: `null` "kanıt yok" ile "görme yetkin
    // yok"u aynı ekrana düşürürdü (sözleşme §6.3).
    expect(pod).not.toBeNull();
    expect(pod).not.toHaveProperty("signature_url");
    expect(pod).not.toHaveProperty("photo_url");
    expect(pod).not.toHaveProperty("document_url");
    // Geri kalan bilgi duruyor.
    expect(pod?.received_by).toBeTruthy();
  });

  it("K11 · eksik teslimde gerekçe ve sayı geliyor", async () => {
    senaryoyaGec("pod-eksik");
    const pod = await getProofOfDelivery(SEVKIYAT);

    expect(pod?.has_discrepancy).toBe(1);
    expect(pod?.exception_code).toBeTruthy();
    expect(pod?.discrepancy_note).toBeTruthy();
    expect(pod!.delivered_package_count).toBeLessThan(pod!.total_package_count);
  });
});

/**
 * Mock'un ürettiği yük SÖZLEŞMEYE uymalı.
 *
 * `FE-MOCK-DISIPLINI` §2: *"Mock sözleşmedeki yükü birebir üretir; uydurulan
 * alan gerçek uca bağlanınca ekranı bozar."* 28 Ağustos denetiminde mock
 * `DAMAGED_PACKAGE` üretiyordu — o kod ne fixture'da ne i18n'de vardı, ekranda
 * ham metin olarak görünüyordu. Hiçbir test yakalamamıştı çünkü hepsi
 * "dolu mu" diye bakıyordu, "geçerli mi" diye değil.
 */
describe("sözleşmeye uygunluk", () => {
  it("üretilen exception_code sözleşmedeki kodlardan biri", async () => {
    senaryoyaGec("pod-eksik");
    const pod = await getProofOfDelivery(SEVKIYAT);

    const gecerliKodlar = exceptionCodeJson.default.data.items.map((i: { name: string }) => i.name);
    expect(gecerliKodlar).toContain(pod!.exception_code);
  });

  it("received_by unvanı İÇİNDE taşımıyor — ayrı alan var", async () => {
    const pod = await getProofOfDelivery(SEVKIYAT);
    // Fixture "Mehmet Yıldız (Depo Sorumlusu)" diyordu ve ekran unvanı ikinci
    // kez basıyordu: "… (Depo Sorumlusu) · Depo sorumlusu".
    expect(pod!.received_by).not.toMatch(/[()]/);
    expect(pod!.received_by_title).toBeTruthy();
  });

  it("tercih satırları sözleşmedeki kanal değerlerini kullanır", async () => {
    const satirlar = await listNotificationPreferences();
    for (const s of satirlar) {
      expect(["email", "in_app", "sms"]).toContain(s.channel);
    }
  });
});

/**
 * 🔴 Mock CANLIYA SIZMAMALI.
 *
 * 28 Ağustos denetiminde bulundu: fonksiyonlar yalnız `MOCK` bayrağına
 * bakıyordu ve o bayrak üretimde de `true`. Yani canlıda bir alıcı, sahte bir
 * teslim kanıtını kendi kanıtı sanacaktı. `logisticsMock.ts` bu iddiayı
 * koruyordu ama bu modül onu hiç sormuyordu.
 */
describe("mock canlıya sızmıyor", () => {
  beforeEach(() => {
    // `?mock=0` örnek veri modunu kapatır (`isMockMode`).
    window.history.replaceState({}, "", "/?mock=0");
    resetNotificationMock();
  });

  it("tercih listesi gerçek uca düşer", async () => {
    await expect(listNotificationPreferences()).rejects.toThrow(/bağlı değil/i);
  });

  it("bildirim akışı gerçek uca düşer", async () => {
    await expect(listNotifications()).rejects.toThrow(/bağlı değil/i);
  });

  it("teslim kanıtı gerçek uca düşer", async () => {
    await expect(getProofOfDelivery(SEVKIYAT)).rejects.toThrow(/bağlı değil/i);
  });

  it("tercih kaydı gerçek uca düşer", async () => {
    await expect(
      setNotificationPreference({ template: ALICI_SABLONU, enabled: false })
    ).rejects.toThrow(/bağlı değil/i);
  });
});

describe("mock disiplini", () => {
  it("senaryo yalnız İLK girişte durumu kurar — sonraki iş korunur", async () => {
    senaryoyaGec("pod-eksik");
    await setNotificationPreference({ template: ALICI_SABLONU, enabled: false });

    // Aynı senaryo anahtarıyla yeniden okunduğunda (sayfa yenilendi) kullanıcı
    // işi durmalı; 07-FE'de bu tuzağa düşülmüştü.
    const yeni = await sayfayiYenile();
    const satirlar = await yeni.listNotificationPreferences();
    expect(satirlar.find((s) => s.template === ALICI_SABLONU)?.enabled).toBe(0);
  });

  it("sıfırlama tohuma döndürür", async () => {
    await setNotificationPreference({ template: ALICI_SABLONU, enabled: false });
    resetNotificationMock();
    localStorage.clear();

    const satirlar = await listNotificationPreferences();
    expect(satirlar.find((s) => s.template === ALICI_SABLONU)?.enabled).toBe(1);
  });
});
