/**
 * Bildirim tercihleri — saf mantığın kuralları.
 *
 * Bu dosyanın koruduğu iddialar (tasarım: `desing/bildirim-sablonlari-2026-10-02`):
 *   · kanal durumu → kontrol türü eşlemesi sözleşmeyle birebir
 *   · toplu aç/kapat ZORUNLU ve KAPALI kanallara dokunmaz
 *   · sessiz saat: süre, gece yarısı geçişi, boş ve eşit saat hatası
 *   · kayıt durum makinesi: kayıt sürerken düzenleme/vazgeçme yok sayılır
 *   · sunucuya yalnız seçmeli kanalların değeri gider
 *   · ticari izin: switch sunucunun `granted` kararını gösterir; verilmiş izin her zaman
 *     geri çekilebilir; sağlayıcı yoksa "aktarılıyor" diye yoklanmaz, "yeniden dene" sunulmaz
 *   · özet önizlemesi taslaktaki sıklığa göre `digest.daily/weekly`'den gelir
 *   · 422 `field_errors` alan anahtarına (yoksa üst anahtara) bağlanır
 *   · push sağlayıcısı yoksa cihaz izni ne olursa olsun "hazır" denmez
 */
import { describe, expect, it } from "vitest";

import type {
  NotifConsent,
  NotifConsentEntry,
  NotifEvent,
  NotifPreferences,
} from "../../types/notificationPreferences";
import {
  notifApplyBulk,
  notifBuildSavePayload,
  notifBulkAction,
  notifCategoryChannels,
  notifCategoryCount,
  notifConsentGranted,
  notifConsentLocked,
  notifConsentNeedsPoll,
  notifConsentSyncIssue,
  notifControlKind,
  notifDiffCount,
  notifDigestPreview,
  notifDraftFrom,
  notifFieldError,
  notifGroupByCategory,
  notifIsOn,
  notifNextSaveState,
  notifPushView,
  notifQuietInfo,
  notifResolvePushState,
  notifSummaryStats,
} from "../notificationPrefsLogic";

function olay(p: Partial<NotifEvent> & Pick<NotifEvent, "key">): NotifEvent {
  return {
    name: p.key,
    category: "orders",
    mandatory: false,
    delivery: "ozetlenebilir",
    channels: { inapp: "zorunlu", email: "secmeli", push: "secmeli", sms: "kapali" },
    user: { email: true, push: true },
    ...p,
  };
}

const ODEME = olay({
  key: "payment.failed",
  category: "billing",
  delivery: "aninda",
  channels: { inapp: "zorunlu", email: "zorunlu", push: "secmeli", sms: "zorunlu" },
  user: { push: true },
});
const ONAY = olay({ key: "order.confirmed" });
const KARGO = olay({ key: "order.shipped", user: { email: false, push: true } });
const IPTAL = olay({ key: "order.cancelled", delivery: "aninda" });
const OTP = olay({
  key: "identity.otp",
  category: "account",
  mandatory: true,
  delivery: "aninda",
  channels: { inapp: "kapali", email: "zorunlu", push: "kapali", sms: "zorunlu" },
  user: {},
});

function tercihler(events: NotifEvent[]): NotifPreferences {
  const izin: NotifConsentEntry = {
    state: "yok",
    granted: false,
    target: null,
    target_verified: false,
    updated_at: null,
    source: null,
    sync_available: false,
    error_code: null,
  };
  return {
    role: "buyer",
    roles: ["buyer"],
    events,
    frequency: "daily",
    quiet: { enabled: true, start: "22:00", end: "08:00", timezone: "Europe/Istanbul" },
    digest: { next_at: null, daily: null, weekly: null, digestible_count: 0, instant_count: 0 },
    push_device: { state: "hazir", provider_available: true },
    consent: { email: izin, sms: izin },
    consent_history: [],
    revision: 7,
  };
}

describe("kanal durumu → kontrol türü", () => {
  it("secmeli → switch, zorunlu → kilitli, kapali → kontrol yok", () => {
    expect(notifControlKind("secmeli")).toBe("switch");
    expect(notifControlKind("zorunlu")).toBe("locked");
    expect(notifControlKind("kapali")).toBe("none");
    expect(notifControlKind(undefined)).toBe("none");
  });

  it("zorunlu kanal taslaktan bağımsız açıktır; kapalı kanal her zaman kapalıdır", () => {
    const taslak = notifDraftFrom(tercihler([ODEME]));
    expect(notifIsOn(ODEME, "email", taslak)).toBe(true);
    expect(notifIsOn(ODEME, "sms", taslak)).toBe(true);
    expect(notifIsOn(ONAY, "sms", taslak)).toBe(false);
  });

  it("taslağa yalnız seçmeli kanallar girer", () => {
    const taslak = notifDraftFrom(tercihler([ODEME, ONAY, OTP]));
    expect(taslak.events["payment.failed"]).toEqual({ push: true });
    expect(taslak.events["order.confirmed"]).toEqual({ email: true, push: true });
    expect(taslak.events["identity.otp"]).toEqual({});
  });
});

describe("kategoriler", () => {
  it("zorunlu olaylar kategori satırı olmaz; sıra korunur", () => {
    const gruplar = notifGroupByCategory([OTP, ONAY, ODEME, KARGO]);
    expect(gruplar.map((g) => g.id)).toEqual(["orders", "billing"]);
    expect(gruplar[0].events.map((e) => e.key)).toEqual(["order.confirmed", "order.shipped"]);
  });

  it("SMS sütunu yalnız SMS gönderen olayı olan kategoride vardır", () => {
    expect(notifCategoryChannels([ONAY, KARGO])).toEqual(["email", "push"]);
    expect(notifCategoryChannels([ODEME])).toEqual(["email", "push", "sms"]);
  });

  it("sayaç zorunlu kanalı açık sayar, kapalı kanalı paydaya katmaz", () => {
    const p = tercihler([ONAY, KARGO, ODEME]);
    const taslak = notifDraftFrom(p);
    expect(notifCategoryCount([ONAY, KARGO], "email", taslak)).toEqual({ on: 1, total: 2 });
    expect(notifCategoryCount([ODEME], "sms", taslak)).toEqual({ on: 1, total: 1 });
    expect(notifCategoryCount([ONAY, KARGO], "sms", taslak)).toEqual({ on: 0, total: 0 });
  });
});

describe("toplu aç/kapat", () => {
  it("iki seçmeli kanaldan azsa düğme yoktur", () => {
    const taslak = notifDraftFrom(tercihler([ODEME]));
    expect(notifBulkAction([ODEME], "push", taslak)).toBeNull();
    expect(notifBulkAction([ODEME], "email", taslak)).toBeNull();
  });

  it("biri açıksa 'kapat', hepsi kapalıysa 'aç' önerir", () => {
    const taslak = notifDraftFrom(tercihler([ONAY, KARGO]));
    expect(notifBulkAction([ONAY, KARGO], "email", taslak)).toBe("off");
    const kapali = notifApplyBulk(taslak, [ONAY, KARGO], "email", false);
    expect(notifBulkAction([ONAY, KARGO], "email", kapali)).toBe("on");
  });

  it("zorunlu ve kapalı kanallara DOKUNMAZ", () => {
    const olaylar = [ONAY, KARGO, ODEME];
    const taslak = notifDraftFrom(tercihler(olaylar));
    const sonra = notifApplyBulk(taslak, olaylar, "email", false);
    expect(sonra.events["order.confirmed"].email).toBe(false);
    expect(sonra.events["order.shipped"].email).toBe(false);
    // Ödeme başarısız: e-posta zorunlu → taslakta alan yok, hâlâ açık.
    expect(sonra.events["payment.failed"]).toEqual({ push: true });
    expect(notifIsOn(ODEME, "email", sonra)).toBe(true);
    // SMS'i kapalı olan olaylara SMS alanı eklenmez.
    const sms = notifApplyBulk(taslak, olaylar, "sms", true);
    expect(sms.events["order.confirmed"]).toEqual({ email: true, push: true });
    expect(sms.events["payment.failed"]).toEqual({ push: true });
  });

  it("verilen taslağı değiştirmez (yeni nesne döner)", () => {
    const taslak = notifDraftFrom(tercihler([ONAY, KARGO]));
    notifApplyBulk(taslak, [ONAY, KARGO], "push", false);
    expect(taslak.events["order.confirmed"].push).toBe(true);
  });
});

describe("sonuç özeti", () => {
  it("zorunlu olayları saymaz; özete giren ve acil e-postaları ayırır", () => {
    const olaylar = [OTP, ONAY, KARGO, IPTAL, ODEME];
    const s = notifSummaryStats(olaylar, notifDraftFrom(tercihler(olaylar)));
    expect(s).toEqual({ emailOn: 3, pushOn: 4, optionalEmailOn: 2, digestible: 1, urgent: 2 });
  });

  it("tüm seçmeli e-postalar kapalıyken optionalEmailOn 0 (sıklık devre dışı)", () => {
    const olaylar = [ONAY, KARGO, IPTAL, ODEME];
    const taslak = notifApplyBulk(notifDraftFrom(tercihler(olaylar)), olaylar, "email", false);
    const s = notifSummaryStats(olaylar, taslak);
    expect(s.optionalEmailOn).toBe(0);
    expect(s.urgent).toBe(1); // zorunlu e-postası olan ödeme olayı yine anında
  });
});

describe("sessiz saatler", () => {
  it("gece yarısını geçen aralık: 22:00–08:00 = 10 saat, ertesi güne geçer", () => {
    expect(notifQuietInfo(true, "22:00", "08:00")).toEqual({
      startError: null,
      endError: null,
      minutes: 600,
      overnight: true,
    });
  });

  it("aynı gün içinde: 13:15–14:00 = 45 dakika", () => {
    const q = notifQuietInfo(true, "13:15", "14:00");
    expect(q.minutes).toBe(45);
    expect(q.overnight).toBe(false);
  });

  it("boş saat alan hatasıdır", () => {
    expect(notifQuietInfo(true, "", "08:00").startError).toBe("empty");
    expect(notifQuietInfo(true, "22:00", "").endError).toBe("empty");
    expect(notifQuietInfo(true, "", "").minutes).toBeNull();
  });

  it("başlangıç = bitiş geçersizdir ('tüm gün sessiz' değildir)", () => {
    const q = notifQuietInfo(true, "09:00", "09:00");
    expect(q.endError).toBe("equal");
    expect(q.minutes).toBeNull();
  });

  it("kapalıyken hata üretmez", () => {
    expect(notifQuietInfo(false, "", "")).toEqual({
      startError: null,
      endError: null,
      minutes: null,
      overnight: false,
    });
  });
});

describe("değişiklik sayısı", () => {
  it("her alan ve her olay × kanal ayrı sayılır", () => {
    const kayitli = notifDraftFrom(tercihler([ONAY, KARGO]));
    expect(notifDiffCount(kayitli, kayitli)).toBe(0);
    const taslak = notifApplyBulk(kayitli, [ONAY, KARGO], "push", false);
    taslak.frequency = "weekly";
    taslak.quietEnd = "07:00";
    expect(notifDiffCount(taslak, kayitli)).toBe(4);
  });
});

describe("kayıt durum makinesi", () => {
  it("temiz → degisti → kaydediliyor → temiz", () => {
    let d = notifNextSaveState("temiz", { type: "edit", dirty: 2 });
    expect(d).toBe("degisti");
    d = notifNextSaveState(d, { type: "save-start" });
    expect(d).toBe("kaydediliyor");
    expect(notifNextSaveState(d, { type: "save-ok" })).toBe("temiz");
  });

  it("hata → basarisiz; düzenleme hata bandını silmez; yeniden dene kayda döner", () => {
    const d = notifNextSaveState("kaydediliyor", { type: "save-fail" });
    expect(d).toBe("basarisiz");
    expect(notifNextSaveState(d, { type: "edit", dirty: 3 })).toBe("basarisiz");
    expect(notifNextSaveState(d, { type: "save-start" })).toBe("kaydediliyor");
  });

  it("tüm değişiklikler geri alınırsa (0) temize döner", () => {
    expect(notifNextSaveState("degisti", { type: "edit", dirty: 0 })).toBe("temiz");
    expect(notifNextSaveState("basarisiz", { type: "edit", dirty: 0 })).toBe("temiz");
  });

  it("kayıt sürerken düzenleme ve vazgeçme yok sayılır", () => {
    expect(notifNextSaveState("kaydediliyor", { type: "edit", dirty: 5 })).toBe("kaydediliyor");
    expect(notifNextSaveState("kaydediliyor", { type: "discard" })).toBe("kaydediliyor");
    expect(notifNextSaveState("degisti", { type: "discard" })).toBe("temiz");
  });

  it("temizken kayıt başlamaz", () => {
    expect(notifNextSaveState("temiz", { type: "save-start" })).toBe("temiz");
  });
});

describe("kayıt gövdesi", () => {
  it("yalnız seçmeli kanallar gider; revision ve saat dilimi taşınır", () => {
    const p = tercihler([OTP, ONAY, ODEME]);
    const taslak = notifDraftFrom(p);
    taslak.events["order.confirmed"].email = false;
    taslak.frequency = "instant";
    expect(notifBuildSavePayload(taslak, p)).toEqual({
      events: {
        "order.confirmed": { email: false, push: true },
        "payment.failed": { push: true },
      },
      frequency: "instant",
      quiet: { enabled: true, start: "22:00", end: "08:00", timezone: "Europe/Istanbul" },
      revision: 7,
    });
  });
});

describe("ticari ileti izni", () => {
  const girdi = (
    state: NotifConsentEntry["state"],
    extra: Partial<NotifConsentEntry> = {}
  ): NotifConsentEntry => ({
    state,
    granted: false,
    target: "bi•••@example.test",
    target_verified: true,
    updated_at: null,
    source: null,
    sync_available: false,
    error_code: null,
    ...extra,
  });

  it("aktarım sonucu beklenirken her yön kilitli; hedef sorunu yalnız İZİN VERMEYİ kilitler", () => {
    expect(notifConsentLocked(girdi("bekliyor", { granted: true }))).toBe(true);
    expect(notifConsentLocked(girdi("hedef-eksik"))).toBe(true);
    expect(notifConsentLocked(girdi("hedef-dogrulanmadi"))).toBe(true);
    // Verilmiş izin, hedef doğrulanmamış olsa da geri çekilebilmeli.
    expect(notifConsentLocked(girdi("hedef-dogrulanmadi", { granted: true }))).toBe(false);
    expect(notifConsentLocked(girdi("onayli", { granted: true }))).toBe(false);
    expect(notifConsentLocked(girdi("basarisiz", { granted: true }))).toBe(false);
    expect(notifConsentLocked(girdi("geri-cekildi"))).toBe(false);
    expect(notifConsentLocked(girdi("yok"))).toBe(false);
  });

  it("switch konumu sunucunun `granted` kararıdır; aktarım durumu konumu değiştirmez", () => {
    expect(notifConsentGranted(girdi("onayli", { granted: true }))).toBe(true);
    expect(notifConsentGranted(girdi("basarisiz", { granted: true }))).toBe(true);
    expect(notifConsentGranted(girdi("bekliyor", { granted: true }))).toBe(true);
    expect(notifConsentGranted(girdi("geri-cekildi"))).toBe(false);
    expect(notifConsentGranted(girdi("yok"))).toBe(false);
  });

  it("sağlayıcı yoksa aktarım sorunu `unavailable` (yeniden dene yok); varsa `failed`", () => {
    const yok = { sync_available: false, error_code: "PROVIDER_UNAVAILABLE" };
    expect(notifConsentSyncIssue(girdi("basarisiz", yok))).toBe("unavailable");
    // Geri çekme yerelde geçerli ama aktarılamadı: bu da dürüstçe gösterilir.
    expect(notifConsentSyncIssue(girdi("geri-cekildi", yok))).toBe("unavailable");
    expect(notifConsentSyncIssue(girdi("basarisiz", { sync_available: true }))).toBe("failed");
    expect(notifConsentSyncIssue(girdi("onayli", { sync_available: true }))).toBeNull();
    expect(notifConsentSyncIssue(girdi("yok"))).toBeNull();
  });

  it("yalnız aktarımı yapılabilen `bekliyor` kanal yoklanır", () => {
    const izin = (e: NotifConsentEntry, s: NotifConsentEntry): NotifConsent => ({
      email: e,
      sms: s,
    });
    expect(
      notifConsentNeedsPoll(izin(girdi("bekliyor", { sync_available: true }), girdi("yok")))
    ).toBe(true);
    expect(notifConsentNeedsPoll(izin(girdi("bekliyor"), girdi("yok")))).toBe(false);
    expect(notifConsentNeedsPoll(izin(girdi("basarisiz"), girdi("geri-cekildi")))).toBe(false);
    expect(notifConsentNeedsPoll(null)).toBe(false);
  });
});

describe("özet önizlemesi", () => {
  const digest = {
    daily: "2026-01-04T08:00:00+03:00",
    weekly: "2026-01-05T08:00:00+03:00",
  };

  it("taslaktaki sıklığın zamanı döner; kayıtlı sıklıktan (next_at) bağımsızdır", () => {
    expect(notifDigestPreview(digest, "daily")).toBe(digest.daily);
    expect(notifDigestPreview(digest, "weekly")).toBe(digest.weekly);
    expect(notifDigestPreview(digest, "instant")).toBeNull();
    expect(notifDigestPreview({ daily: null, weekly: null }, "weekly")).toBeNull();
    expect(notifDigestPreview(null, "daily")).toBeNull();
  });
});

describe("sunucu alan hataları (422)", () => {
  it("tam anahtar, yoksa üst anahtar; ilgisiz anahtar boş", () => {
    const fe = { "quiet.end": "Başlangıç ve bitiş aynı olamaz.", frequency: "Geçersiz." };
    expect(notifFieldError(fe, "quiet.end")).toBe("Başlangıç ve bitiş aynı olamaz.");
    expect(notifFieldError(fe, "quiet.start")).toBe("");
    expect(notifFieldError({ quiet: "Geçersiz sessiz saat." }, "quiet.start")).toBe(
      "Geçersiz sessiz saat."
    );
    expect(notifFieldError(fe, "frequency")).toBe("Geçersiz.");
    expect(notifFieldError(null, "quiet.end")).toBe("");
  });
});

describe("push cihaz durumu", () => {
  it("cihaz bir şey söylüyorsa o geçerlidir; söylemiyorsa sunucu durumu", () => {
    expect(notifResolvePushState("cihaz-yok", "hazir")).toBe("hazir");
    expect(notifResolvePushState("hazir", "engelli")).toBe("engelli");
    expect(notifResolvePushState("hazir", "izin-yok")).toBe("izin-yok");
    expect(notifResolvePushState("cihaz-yok", null)).toBe("cihaz-yok");
  });

  it("sağlayıcı yoksa tarayıcı izni verilmiş olsa bile `saglayici-yok`", () => {
    expect(notifPushView({ state: "cihaz-yok", provider_available: false }, "hazir")).toBe(
      "saglayici-yok"
    );
    expect(notifPushView({ state: "cihaz-yok", provider_available: true }, "hazir")).toBe("hazir");
    expect(notifPushView({ state: "cihaz-yok", provider_available: true }, null)).toBe("cihaz-yok");
    expect(notifPushView(null, null)).toBe("cihaz-yok");
  });
});
