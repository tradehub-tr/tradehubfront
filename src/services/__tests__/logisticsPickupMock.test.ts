/**
 * Teslim alma mock'unun İŞ AKIŞI.
 *
 * Bu testin koruduğu iddia: **backend hiç yazılmamışken bile alıcı bir işi
 * baştan sona bitirebiliyor** (`FE-MOCK-DISIPLINI.md` §1). Ekranın açılması
 * yetmez; randevu alınmalı, kod doğrulanmalı, yanlış denemeler sayılmalı,
 * süre dolmalı ve yapılan iş sayfa yenilenince durmalı.
 *
 * 07-FE analizindeki kabul senaryolarının (A3…A17) birim karşılığı burada;
 * tarayıcı karşılığı `tests/e2e/storefront-teslim-alma.spec.ts`.
 */
import { beforeEach, describe, expect, it } from "vitest";

import {
  ORNEK_KOD,
  confirmDelivery,
  listAppointmentSlots,
  readState,
  requestAppointment,
  resendDeliveryCode,
  resetPickupMock,
} from "../logisticsPickupMock";

/** Hafta içi bir gün — hafta sonu kapasitesi dar, testler ona takılmasın. */
const YARIN_ICI = "2026-09-02"; // Çarşamba
const SEVKIYAT = "SHP-2026-00035";

/** Senaryo anahtarını URL'e koyar; mock durumu ondan kuruluyor. */
function senaryoyaGec(senaryo: string | null): void {
  // Göreli yol: happy-dom belgesi `http://localhost:3000`'da açılıyor,
  // mutlak URL farklı origin sayılıp `SecurityError` veriyor.
  window.history.replaceState({}, "", senaryo ? `/?senaryo=${senaryo}` : "/");
  resetPickupMock();
}

beforeEach(() => {
  senaryoyaGec(null);
  localStorage.clear();
  resetPickupMock();
});

describe("başlangıç durumu", () => {
  it("teslim alınmayı bekleyen, randevusuz bir sevkiyat", () => {
    const s = readState();
    expect(s.shipment_type).toBe("Buyer Pickup");
    expect(s.status).toBe("Ready for Pickup");
    expect(s.appointment_at).toBeNull();
    expect(s.delivery_code_status).toBe("pending");
    expect(s.delivery_code_attempts).toBe(0);
  });
});

describe("A3 · randevu talebi", () => {
  it("geçerli bir slot randevuyu kaydeder", async () => {
    await requestAppointment({ shipment: SEVKIYAT, date: YARIN_ICI, slot: "09-12" });
    const s = readState();
    expect(s.appointment_at).toBe(`${YARIN_ICI} 09:00:00`);
    expect(s.appointment_window).toBe("09:00-12:00");
  });

  it("A5 · ikinci talep randevuyu DEĞİŞTİRİR, ikinci kayıt açmaz", async () => {
    await requestAppointment({ shipment: SEVKIYAT, date: YARIN_ICI, slot: "09-12" });
    await requestAppointment({ shipment: SEVKIYAT, date: YARIN_ICI, slot: "15-18" });
    expect(readState().appointment_window).toBe("15:00-18:00");
  });

  it("A7 · geçmiş tarih reddedilir", async () => {
    await expect(
      requestAppointment({ shipment: SEVKIYAT, date: "2020-01-01", slot: "09-12" })
    ).rejects.toThrow();
  });

  it("dolu slot reddedilir", async () => {
    senaryoyaGec("slot-dolu");
    await expect(
      requestAppointment({ shipment: SEVKIYAT, date: YARIN_ICI, slot: "09-12" })
    ).rejects.toThrow();
  });

  it("A6 · slot-dolu senaryosunda hiçbir aralık açık değil", () => {
    senaryoyaGec("slot-dolu");
    expect(listAppointmentSlots(YARIN_ICI).every((s) => !s.available)).toBe(true);
  });
});

describe("A4 · kalıcılık", () => {
  it("randevu diske yazılır — sayfa yenilenince durur", async () => {
    await requestAppointment({ shipment: SEVKIYAT, date: YARIN_ICI, slot: "09-12" });
    const kayit = JSON.parse(localStorage.getItem("istoc_pickup_mock") ?? "{}");
    expect(kayit.appointment_window).toBe("09:00-12:00");
  });

  it("A17 · sıfırlama temiz başlangıca döndürür", async () => {
    await requestAppointment({ shipment: SEVKIYAT, date: YARIN_ICI, slot: "09-12" });
    resetPickupMock();
    expect(readState().appointment_at).toBeNull();
  });
});

describe("A8-A10 · teslim kodu", () => {
  it("A8 · doğru kod teslimi tamamlar ve DURUMU ilerletir", async () => {
    await confirmDelivery({ shipment: SEVKIYAT, code: ORNEK_KOD });
    const s = readState();
    expect(s.delivery_code_status).toBe("verified");
    expect(s.status).toBe("Picked Up");
  });

  it("A9 · yanlış kod deneme sayacını artırır, teslimi tamamlamaz", async () => {
    await expect(confirmDelivery({ shipment: SEVKIYAT, code: "0000" })).rejects.toThrow();
    const s = readState();
    expect(s.delivery_code_attempts).toBe(1);
    expect(s.delivery_code_status).toBe("failed");
    expect(s.status).toBe("Ready for Pickup");
  });

  it("A10 · hak bitince kilitlenir — doğru kod bile geçmez", async () => {
    senaryoyaGec("kilitli");
    await expect(confirmDelivery({ shipment: SEVKIYAT, code: ORNEK_KOD })).rejects.toThrow();
    expect(readState().delivery_code_status).toBe("failed");
  });

  it("A13 · kod istemeyen sevkiyat tek çağrıda tamamlanır", async () => {
    senaryoyaGec("kodsuz");
    await confirmDelivery({ shipment: SEVKIYAT, code: "" });
    expect(readState().delivery_code_status).toBe("verified");
  });
});

describe("A11 · kod süresi", () => {
  it("süresi dolmuş kod DELIVERY_CODE_EXPIRED verir", async () => {
    senaryoyaGec("sure-doldu");
    await expect(confirmDelivery({ shipment: SEVKIYAT, code: ORNEK_KOD })).rejects.toMatchObject({
      name: "DELIVERY_CODE_EXPIRED",
    });
  });

  it("süre dolumu deneme hakkını YAKMAZ — alıcının hatası değil", async () => {
    senaryoyaGec("sure-doldu");
    await expect(confirmDelivery({ shipment: SEVKIYAT, code: "0000" })).rejects.toThrow();
    expect(readState().delivery_code_attempts).toBe(0);
  });

  it("yeni kod süreyi uzatır ve girişi tekrar açar", async () => {
    senaryoyaGec("sure-doldu");
    await resendDeliveryCode();
    const s = readState();
    expect(s.delivery_code_status).toBe("pending");
    expect(new Date(s.delivery_code_expires_at!.replace(" ", "T")).getTime()).toBeGreaterThan(
      Date.now()
    );
  });

  it("yeni kod deneme sayacını SIFIRLAMAZ — kod tahmini yine sınırlı", async () => {
    await expect(confirmDelivery({ shipment: SEVKIYAT, code: "0000" })).rejects.toThrow();
    await resendDeliveryCode();
    expect(readState().delivery_code_attempts).toBe(1);
  });
});

describe("A12 · ödeme kapısı", () => {
  it("ödeme tamamlanmadan teslim alınamaz — doğru kodla bile", async () => {
    senaryoyaGec("odeme-bekliyor");
    await expect(confirmDelivery({ shipment: SEVKIYAT, code: ORNEK_KOD })).rejects.toThrow();
    expect(readState().delivery_code_status).not.toBe("verified");
  });
});

describe("A15 · kanal koşulu", () => {
  it("kargo senaryosunda sevkiyat tipi teslim alma dışında kalır", () => {
    senaryoyaGec("kargo");
    expect(readState().shipment_type).toBe("Standard");
  });
});
