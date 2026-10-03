/**
 * Bildirim tercihleri servisi — gerçek uç sözleşmesi ve hata ayrımı.
 *
 * Koruduğu iddialar:
 *   · her çağrı `tradehub_core.api.v1.notification_preferences.*` ucuna GİDER (örnek veri dalı yok)
 *   · GET uçları GET, yazmalar POST + CSRF başlığıyla
 *   · 409 / 422 / 503 mesaj metniyle değil, HTTP durum kodu + `error_code` ile ayrılır;
 *     409'da `theirs`, 422'de `field_errors` hata nesnesine taşınır
 *   · beklenmeyen hata (500) olduğu gibi `ApiHttpError` olarak kalır
 *
 * Gövdeler 2026-10-03'te yerel backend'den (istoc.localhost) ölçülen yanıtlarla aynı biçimde.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiHttpError } from "../../utils/api";
import {
  NotifConflictError,
  NotifProviderUnavailableError,
  NotifValidationError,
  getNotifConsentStatus,
  getNotifPreferences,
  retryNotifConsentSync,
  saveNotifPreferences,
  setNotifCommercialConsent,
} from "../notificationPreferencesService";

const MODUL = "/api/method/tradehub_core.api.v1.notification_preferences";

function yanit(status: number, govde: unknown): Response {
  const raw = JSON.stringify(govde);
  return {
    ok: status < 400,
    status,
    headers: new Headers(),
    json: async () => govde,
    text: async () => raw,
  } as unknown as Response;
}

let fetchMock: ReturnType<typeof vi.fn>;

/** İlk çağrı CSRF (get_session_user), sonrakiler sıradaki yanıtlar. */
function sunucu(...yanitlar: Response[]): void {
  fetchMock = vi.fn(async (url: string) => {
    if (url.includes("auth.get_session_user")) {
      return yanit(200, { message: { csrf_token: "tok-1", logged_in: true } });
    }
    const r = yanitlar.shift();
    if (!r) throw new Error(`beklenmeyen istek: ${url}`);
    return r;
  });
  vi.stubGlobal("fetch", fetchMock);
}

function istekler(): { url: string; init: RequestInit }[] {
  return fetchMock.mock.calls
    .map(([url, init]) => ({ url: String(url), init: (init ?? {}) as RequestInit }))
    .filter((c) => !c.url.includes("auth.get_session_user"));
}

const PREFS = {
  role: "seller",
  roles: ["buyer", "seller"],
  events: [],
  frequency: "daily",
  quiet: { enabled: true, start: "22:00", end: "08:00", timezone: "Europe/Istanbul" },
  digest: {
    next_at: "2026-01-04T08:00:00+03:00",
    daily: "2026-01-04T08:00:00+03:00",
    weekly: "2026-01-05T08:00:00+03:00",
    digestible_count: 5,
    instant_count: 14,
  },
  push_device: { state: "cihaz-yok", device_label: null, provider_available: false },
  consent: {
    email: {
      state: "yok",
      granted: false,
      target: "bi•••@example.test",
      target_verified: false,
      updated_at: null,
      source: null,
      sync_available: false,
      error_code: null,
    },
    sms: {
      state: "hedef-eksik",
      granted: false,
      target: null,
      target_verified: false,
      updated_at: null,
      source: null,
      sync_available: false,
      error_code: null,
    },
  },
  consent_history: [],
  revision: 3,
};

const KAYIT = {
  events: { "order.shipped": { email: false } },
  frequency: "daily" as const,
  quiet: { enabled: true, start: "22:00", end: "08:00", timezone: "Europe/Istanbul" },
  revision: 3,
};

beforeEach(() => {
  vi.unstubAllGlobals();
});
afterEach(() => vi.unstubAllGlobals());

describe("gerçek uç çağrıları", () => {
  it("get_preferences: GET, gövde `message`ten döner", async () => {
    sunucu(yanit(200, { message: PREFS }));
    const p = await getNotifPreferences();
    expect(p.roles).toEqual(["buyer", "seller"]);
    expect(p.digest.weekly).toBe("2026-01-05T08:00:00+03:00");
    const [c] = istekler();
    expect(c.url.startsWith(`${MODUL}.get_preferences`)).toBe(true);
    expect(c.init.method).toBe("GET");
  });

  it("save_preferences: POST + CSRF, gövde olduğu gibi gider", async () => {
    sunucu(yanit(200, { message: { ...PREFS, revision: 4 } }));
    const p = await saveNotifPreferences(KAYIT);
    expect(p.revision).toBe(4);
    const [c] = istekler();
    expect(c.url).toBe(`${MODUL}.save_preferences`);
    expect(c.init.method).toBe("POST");
    expect((c.init.headers as Record<string, string>)["X-Frappe-CSRF-Token"]).toBe("tok-1");
    expect(JSON.parse(String(c.init.body))).toEqual(KAYIT);
  });

  it("izin yoklaması get_consent_status'a gider (tercihleri yeniden okumaz)", async () => {
    sunucu(yanit(200, { message: { consent: PREFS.consent, consent_history: [] } }));
    await getNotifConsentStatus();
    const [c] = istekler();
    expect(c.url.startsWith(`${MODUL}.get_consent_status`)).toBe(true);
    expect(c.url.includes("get_preferences")).toBe(false);
  });

  it("set_commercial_consent: kanal ve karar POST gövdesinde", async () => {
    sunucu(yanit(200, { message: { consent: PREFS.consent, consent_history: [] } }));
    await setNotifCommercialConsent("email", false);
    const [c] = istekler();
    expect(c.url).toBe(`${MODUL}.set_commercial_consent`);
    expect(JSON.parse(String(c.init.body))).toEqual({ channel: "email", granted: false });
  });
});

describe("hata ayrımı: durum kodu + error_code", () => {
  it("409 REVISION_CONFLICT → NotifConflictError, `theirs` ve güncel revision taşınır", async () => {
    sunucu(
      yanit(409, {
        message: {
          error_code: "REVISION_CONFLICT",
          message: "Kayıt başka bir oturumda değişti.",
          revision: 5,
          theirs: { ...PREFS, revision: 5 },
          saved_by: null,
          saved_at: null,
        },
      })
    );
    const err = await saveNotifPreferences(KAYIT).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(NotifConflictError);
    expect((err as NotifConflictError).revision).toBe(5);
    expect((err as NotifConflictError).theirs?.revision).toBe(5);
  });

  it("422 VALIDATION_FAILED → NotifValidationError, field_errors alan anahtarıyla", async () => {
    sunucu(
      yanit(422, {
        message: {
          error_code: "VALIDATION_FAILED",
          message: "Gönderilen bilgiler geçersiz.",
          blocking: [],
          warnings: [],
          field_errors: { "quiet.end": "Başlangıç ve bitiş aynı olamaz." },
        },
      })
    );
    const err = await saveNotifPreferences(KAYIT).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(NotifValidationError);
    expect((err as NotifValidationError).fieldErrors).toEqual({
      "quiet.end": "Başlangıç ve bitiş aynı olamaz.",
    });
  });

  it("mesaj metninde '409' geçmesi çakışma SAYILMAZ (eski regex davranışı kalktı)", async () => {
    sunucu(yanit(500, { message: { error_code: "INTERNAL", message: "kayıt 409 bulunamadı" } }));
    const err = await saveNotifPreferences(KAYIT).catch((e: unknown) => e);
    expect(err).not.toBeInstanceOf(NotifConflictError);
    expect(err).toBeInstanceOf(ApiHttpError);
    expect((err as ApiHttpError).status).toBe(500);
  });

  it("503 PROVIDER_UNAVAILABLE → NotifProviderUnavailableError (İYS yeniden deneme)", async () => {
    sunucu(
      yanit(503, {
        message: {
          error_code: "PROVIDER_UNAVAILABLE",
          message: "Bu kanal için gönderim sağlayıcısı yapılandırılmamış.",
          channel: "iys",
        },
      })
    );
    const err = await retryNotifConsentSync("email").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(NotifProviderUnavailableError);
  });

  it("izin isteğinde 422 (hedef doğrulanmamış) ayrı tür olarak gelir", async () => {
    sunucu(
      yanit(422, {
        message: {
          error_code: "VALIDATION_FAILED",
          message: "Önce iletişim bilgisini doğrulayın.",
          blocking: [],
          warnings: [],
          field_errors: { channel: "İletişim bilgisi doğrulanmamış." },
        },
      })
    );
    const err = await setNotifCommercialConsent("email", true).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(NotifValidationError);
    expect((err as NotifValidationError).fieldErrors.channel).toBeTruthy();
  });
});
