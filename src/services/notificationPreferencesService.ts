/**
 * Bildirim tercihleri servisi — Ayarlar > Bildirimler ekranının TEK veri kapısı.
 *
 * Sözleşme: `desing/bildirim-sablonlari-2026-10-02/BACKEND-API.openapi.json` ›
 * `tradehub_core.api.v1.notification_preferences.*` (Frappe whitelisted method,
 * gövde `message` içinde). Örnek veri / önizleme dalı YOK: her çağrı gerçek uca gider.
 *
 * Hata ayrımı mesaj metniyle değil, HTTP durum kodu + gövdedeki `error_code` ile yapılır
 * (`ApiHttpError`): 409 REVISION_CONFLICT, 422 VALIDATION_FAILED, 503 PROVIDER_UNAVAILABLE.
 */
import type {
  NotifConsentChannel,
  NotifConsentResult,
  NotifConsentRetryResult,
  NotifErrorBody,
  NotifPreferences,
  NotifSavePayload,
} from "../types/notificationPreferences";
import { ApiHttpError, callMethod } from "../utils/api";

const MODUL = "tradehub_core.api.v1.notification_preferences";

/** 409: tercihler başka bir oturumda değişmiş (`revision` eski). `theirs` sunucudaki güncel hâl. */
export class NotifConflictError extends Error {
  readonly revision: number | null;
  readonly theirs: NotifPreferences | null;

  constructor(body: NotifErrorBody | null) {
    super(body?.message || "revision conflict");
    this.name = "NotifConflictError";
    this.revision = typeof body?.revision === "number" ? body.revision : null;
    this.theirs = body?.theirs ?? null;
  }
}

/** 422: gönderilen alanlar geçersiz. `fieldErrors` anahtarları nokta yollu (`quiet.end`). */
export class NotifValidationError extends Error {
  readonly fieldErrors: Record<string, string>;

  constructor(body: NotifErrorBody | null) {
    super(body?.message || "validation failed");
    this.name = "NotifValidationError";
    this.fieldErrors = { ...(body?.field_errors ?? {}) };
  }
}

/** 503: bu kurulumda ilgili sağlayıcı (İYS, native push) yok. Başarı taklit edilmez. */
export class NotifProviderUnavailableError extends Error {
  constructor(message?: string) {
    super(message || "provider unavailable");
    this.name = "NotifProviderUnavailableError";
  }
}

/** `callMethod` hatasını ekranın ayırt ettiği türlere çevirir; tanımadığını olduğu gibi bırakır. */
export function notifMapError(e: unknown): unknown {
  if (!(e instanceof ApiHttpError)) return e;
  const body = e.body as NotifErrorBody | null;
  if (e.status === 409 || e.errorCode === "REVISION_CONFLICT") return new NotifConflictError(body);
  if (e.status === 422 || e.errorCode === "VALIDATION_FAILED")
    return new NotifValidationError(body);
  if (e.status === 503 || e.errorCode === "PROVIDER_UNAVAILABLE") {
    return new NotifProviderUnavailableError(body?.message);
  }
  return e;
}

async function cagir<T>(ad: string, params: Record<string, unknown>, post: boolean): Promise<T> {
  try {
    return await callMethod<T>(`${MODUL}.${ad}`, params, post);
  } catch (e) {
    throw notifMapError(e);
  }
}

/** Salt okur; kayıt yoksa sunucu varsayılanları `revision: 0` ile döner. */
export function getNotifPreferences(): Promise<NotifPreferences> {
  return cagir<NotifPreferences>("get_preferences", {}, false);
}

export function saveNotifPreferences(payload: NotifSavePayload): Promise<NotifPreferences> {
  return cagir<NotifPreferences>("save_preferences", { ...payload }, true);
}

/** İzin + aktarım durumu. Yoklama BUNU kullanır; kaydedilmemiş tercih taslağına dokunmaz. */
export function getNotifConsentStatus(): Promise<NotifConsentResult> {
  return cagir<NotifConsentResult>("get_consent_status", {}, false);
}

export function setNotifCommercialConsent(
  channel: NotifConsentChannel,
  granted: boolean
): Promise<NotifConsentResult> {
  return cagir<NotifConsentResult>("set_commercial_consent", { channel, granted }, true);
}

export function retryNotifConsentSync(
  channel: NotifConsentChannel
): Promise<NotifConsentRetryResult> {
  return cagir<NotifConsentRetryResult>("retry_consent_sync", { channel }, true);
}
