/**
 * Bildirim tercihleri (Ayarlar > Bildirimler) — API sözleşmesi tipleri.
 *
 * Kaynak: `desing/bildirim-sablonlari-2026-10-02/BACKEND-API.openapi.json` ›
 * `notification_preferences` uçları (Preferences, Consent, ConsentHistoryRow,
 * PushDevice, Digest, Error şemaları). Alan adları İngilizce snake_case, DURUM
 * DEĞERLERİ tasarım sözleşmesindeki Türkçe sözlükle birebir (`zorunlu`, `secmeli`, …).
 * Sözleşme değişirse önce OpenAPI değişir, sonra bu dosya.
 */

/** Kanal. `inapp` kullanıcı tarafından kapatılamaz; ekranda sütunu yoktur. */
export type NotifChannel = "inapp" | "email" | "push" | "sms";
/** Kullanıcının açıp kapatabildiği kanallar. */
export type NotifUserChannel = "email" | "push" | "sms";
/** Kanal durumu (olay × kanal). */
export type NotifChannelState = "zorunlu" | "secmeli" | "kapali";
/** Gönderim: acil olay özet seçilse bile anında gider. */
export type NotifDelivery = "aninda" | "ozetlenebilir";
export type NotifFrequency = "instant" | "daily" | "weekly";
/** Ticari ileti izni (İYS) durumu. */
export type NotifConsentState =
  | "onayli"
  | "bekliyor"
  | "basarisiz"
  | "geri-cekildi"
  | "yok"
  | "hedef-eksik"
  | "hedef-dogrulanmadi";
export type NotifPushDeviceState = "hazir" | "izin-yok" | "engelli" | "cihaz-yok";
/** Kayıt çubuğu durumu. */
export type NotifSaveState = "temiz" | "degisti" | "kaydediliyor" | "basarisiz";
export type NotifRole = "buyer" | "seller";
export type NotifConsentChannel = "email" | "sms";
/** İzin geçmişi satırının İYS aktarım durumu. */
export type NotifConsentSyncState = "islendi" | "bekliyor" | "basarisiz";
/** İzin kararının geldiği yer. */
export type NotifConsentSource =
  | "registration"
  | "settings"
  | "banner"
  | "modal"
  | "admin_override";

/** Kullanıcının seçmeli kanallardaki seçimi. Zorunlu/kapalı kanal burada yer almaz. */
export type NotifUserChoice = Partial<Record<NotifUserChannel, boolean>>;

export interface NotifEvent {
  key: string;
  name: string;
  category: string;
  /** `true`: hiçbir kanalı seçmeli değil; "Zorunlu bildirimler" özetinde görünür. */
  mandatory: boolean;
  why?: string | null;
  delivery: NotifDelivery;
  channels: Record<NotifChannel, NotifChannelState>;
  user: NotifUserChoice;
}

export interface NotifQuietHours {
  enabled: boolean;
  /** "HH:MM" */
  start: string;
  end: string;
  timezone: string;
}

export interface NotifDigest {
  /** ISO tarih-saat; özet yoksa `null`. KAYITLI sıklığa göredir. */
  next_at: string | null;
  /** Günlük özet seçilirse sıradaki gönderim (kaydetmeden önceki önizleme için). */
  daily: string | null;
  /** Haftalık özet seçilirse sıradaki gönderim. */
  weekly: string | null;
  digestible_count: number;
  instant_count: number;
}

export interface NotifPushDevice {
  state: NotifPushDeviceState;
  device_label?: string | null;
  /** Sunucuda push gönderim sağlayıcısı kurulu mu. `false` ise hiçbir cihaza push gitmez. */
  provider_available: boolean;
}

export interface NotifConsentEntry {
  state: NotifConsentState;
  /** Kullanıcının son KARARI (izin verdi mi). `state` aktarım sonucunu da anlatır, bu yalnız seçimi. */
  granted: boolean;
  /** Maskelenmiş e-posta/telefon; kayıtlı hedef yoksa `null`. */
  target: string | null;
  target_verified: boolean;
  updated_at: string | null;
  source: NotifConsentSource | null;
  /** İYS aktarımı bu kurulumda yapılabiliyor mu. `false` ise "yeniden dene" anlamsızdır. */
  sync_available: boolean;
  /** Son aktarımın hata kodu (ör. `PROVIDER_UNAVAILABLE`); yoksa `null`. */
  error_code?: string | null;
}

export type NotifConsent = Record<NotifConsentChannel, NotifConsentEntry>;

export interface NotifConsentHistoryRow {
  at: string;
  channel: NotifConsentChannel;
  action: "grant" | "revoke";
  source: NotifConsentSource;
  sync_state: NotifConsentSyncState;
}

/** `get_preferences` ve `save_preferences` yanıtı. */
export interface NotifPreferences {
  /** Geriye uyum için tek rol. Filtrelemede `roles` kullanılır. */
  role: NotifRole;
  /** Alıcı + satıcı birleşimi (çift rollü hesapta ikisi de). */
  roles: NotifRole[];
  events: NotifEvent[];
  frequency: NotifFrequency;
  quiet: NotifQuietHours;
  digest: NotifDigest;
  push_device: NotifPushDevice;
  consent: NotifConsent;
  consent_history: NotifConsentHistoryRow[];
  revision: number;
}

/** `save_preferences` girdisi. */
export interface NotifSavePayload {
  events: Record<string, NotifUserChoice>;
  frequency: NotifFrequency;
  quiet: NotifQuietHours;
  revision: number;
}

/** `get_consent_status` ve `set_commercial_consent` yanıtı. */
export interface NotifConsentResult {
  consent: NotifConsent;
  consent_history: NotifConsentHistoryRow[];
}

/** `retry_consent_sync` yanıtı. */
export interface NotifConsentRetryResult {
  consent: NotifConsent;
}

/** Şablon/doğrulama sorunu (422 `blocking` / `warnings` satırı). */
export interface NotifIssue {
  kind: string;
  channel?: string;
  lang?: string;
  field?: string;
  variable?: string;
  message: string;
}

/**
 * Hata gövdesi (`message` içinde). 409'da `revision` + `theirs`, 422'de
 * `field_errors` (`"quiet.end": "…"` gibi nokta yollu anahtarlar), 503'te yalnız kod.
 */
export interface NotifErrorBody {
  error_code: string;
  message?: string;
  revision?: number;
  theirs?: NotifPreferences | null;
  saved_by?: string | null;
  saved_at?: string | null;
  field_errors?: Record<string, string>;
  blocking?: NotifIssue[];
  warnings?: NotifIssue[];
}

/** Ekrandaki kaydedilmemiş taslak — yalnız kullanıcının değiştirebildiği alanlar. */
export interface NotifDraft {
  events: Record<string, NotifUserChoice>;
  frequency: NotifFrequency;
  quietEnabled: boolean;
  quietStart: string;
  quietEnd: string;
}
