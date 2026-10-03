/**
 * Bildirim tercihleri — saf mantık (DOM, ağ ve çeviri YOK).
 *
 * Ekranın kararları burada: hangi kanal hangi kontrolle çizilir, toplu aç/kapat
 * neye dokunur, sessiz saat geçerli mi, kayıt çubuğu hangi durumda. Alpine modülü
 * (`alpine/settingsNotifications.ts`) yalnız bunları çağırır; böylece her kural
 * tarayıcı açmadan sınanır (`__tests__/notificationPrefsLogic.test.ts`).
 */
import type {
  NotifChannelState,
  NotifConsent,
  NotifConsentEntry,
  NotifDigest,
  NotifDraft,
  NotifEvent,
  NotifFrequency,
  NotifPreferences,
  NotifPushDevice,
  NotifPushDeviceState,
  NotifSavePayload,
  NotifSaveState,
  NotifUserChannel,
} from "../types/notificationPreferences";

export const NOTIF_USER_CHANNELS: readonly NotifUserChannel[] = ["email", "push", "sms"];

/** Kanal durumu → çizilecek kontrol. */
export type NotifControlKind = "switch" | "locked" | "none";

export function notifControlKind(state: NotifChannelState | undefined): NotifControlKind {
  if (state === "secmeli") return "switch";
  if (state === "zorunlu") return "locked";
  return "none";
}

/** Olay bu kanaldan gönderiliyor mu (zorunlu ya da seçmeli). */
export function notifSends(ev: NotifEvent, ch: NotifUserChannel): boolean {
  return notifControlKind(ev.channels[ch]) !== "none";
}

/** Kanal şu an fiilen açık mı: zorunlu her zaman açık, seçmeli taslağa bakar. */
export function notifIsOn(ev: NotifEvent, ch: NotifUserChannel, draft: NotifDraft): boolean {
  const kind = notifControlKind(ev.channels[ch]);
  if (kind === "locked") return true;
  if (kind === "switch") return draft.events[ev.key]?.[ch] === true;
  return false;
}

/** Sunucu yanıtından taslak: yalnız `secmeli` kanallar taslağa girer. */
export function notifDraftFrom(prefs: NotifPreferences): NotifDraft {
  const events: NotifDraft["events"] = {};
  for (const ev of prefs.events) {
    const choice: NotifDraft["events"][string] = {};
    for (const ch of NOTIF_USER_CHANNELS) {
      if (ev.channels[ch] === "secmeli") choice[ch] = ev.user?.[ch] === true;
    }
    events[ev.key] = choice;
  }
  return {
    events,
    frequency: prefs.frequency,
    quietEnabled: prefs.quiet.enabled,
    quietStart: prefs.quiet.start,
    quietEnd: prefs.quiet.end,
  };
}

export function notifCloneDraft(draft: NotifDraft): NotifDraft {
  const events: NotifDraft["events"] = {};
  for (const [key, choice] of Object.entries(draft.events)) events[key] = { ...choice };
  return { ...draft, events };
}

export interface NotifCategoryGroup {
  id: string;
  events: NotifEvent[];
}

/** Zorunlu olmayan olayları kategoriye göre gruplar; sıra sunucunun gönderdiği sıradır. */
export function notifGroupByCategory(events: NotifEvent[]): NotifCategoryGroup[] {
  const groups: NotifCategoryGroup[] = [];
  for (const ev of events) {
    if (ev.mandatory) continue;
    let group = groups.find((g) => g.id === ev.category);
    if (!group) {
      group = { id: ev.category, events: [] };
      groups.push(group);
    }
    group.events.push(ev);
  }
  return groups;
}

/** Kategori sütunları: e-posta ve push her zaman; SMS yalnız SMS gönderen olay varsa. */
export function notifCategoryChannels(events: NotifEvent[]): NotifUserChannel[] {
  return NOTIF_USER_CHANNELS.filter(
    (ch) => ch !== "sms" || events.some((ev) => notifSends(ev, ch))
  );
}

export function notifCategoryCount(
  events: NotifEvent[],
  ch: NotifUserChannel,
  draft: NotifDraft
): { on: number; total: number } {
  return {
    on: events.filter((ev) => notifIsOn(ev, ch, draft)).length,
    total: events.filter((ev) => notifSends(ev, ch)).length,
  };
}

/**
 * Toplu düğmenin yapacağı iş. En az iki seçmeli kanal yoksa düğme yoktur (`null`).
 * Biri bile açıksa "kapat", hepsi kapalıysa "aç".
 */
export function notifBulkAction(
  events: NotifEvent[],
  ch: NotifUserChannel,
  draft: NotifDraft
): "on" | "off" | null {
  const optional = events.filter((ev) => ev.channels[ch] === "secmeli");
  if (optional.length < 2) return null;
  return optional.some((ev) => notifIsOn(ev, ch, draft)) ? "off" : "on";
}

/** Toplu aç/kapat: YALNIZ seçmeli kanallara dokunur; zorunlu ve kapalı olanlar değişmez. */
export function notifApplyBulk(
  draft: NotifDraft,
  events: NotifEvent[],
  ch: NotifUserChannel,
  on: boolean
): NotifDraft {
  const next = notifCloneDraft(draft);
  for (const ev of events) {
    if (ev.channels[ch] !== "secmeli") continue;
    next.events[ev.key] = { ...next.events[ev.key], [ch]: on };
  }
  return next;
}

export interface NotifSummaryStats {
  /** E-postası açık olay (zorunlu kanal dahil, zorunlu OLAYLAR hariç). */
  emailOn: number;
  pushOn: number;
  /** Açık SEÇMELİ e-posta sayısı; 0 ise sıklık alanı devre dışı kalır. */
  optionalEmailOn: number;
  /** Özete girebilen açık seçmeli e-posta. */
  digestible: number;
  /** E-postası açık olup her zaman anında giden olay. */
  urgent: number;
}

export function notifSummaryStats(events: NotifEvent[], draft: NotifDraft): NotifSummaryStats {
  const rows = events.filter((ev) => !ev.mandatory);
  const optionalOn = rows.filter(
    (ev) => ev.channels.email === "secmeli" && notifIsOn(ev, "email", draft)
  );
  return {
    emailOn: rows.filter((ev) => notifIsOn(ev, "email", draft)).length,
    pushOn: rows.filter((ev) => notifIsOn(ev, "push", draft)).length,
    optionalEmailOn: optionalOn.length,
    digestible: optionalOn.filter((ev) => ev.delivery === "ozetlenebilir").length,
    urgent: rows.filter((ev) => notifIsOn(ev, "email", draft) && ev.delivery === "aninda").length,
  };
}

export type NotifQuietError = "empty" | "equal";

export interface NotifQuietInfo {
  startError: NotifQuietError | null;
  endError: NotifQuietError | null;
  /** Sessiz sürenin dakikası; kapalı ya da hatalıysa `null`. */
  minutes: number | null;
  /** Bitiş ertesi güne taşıyor mu. */
  overnight: boolean;
}

const SAAT = /^([01]\d|2[0-3]):([0-5]\d)$/;

function dakika(saat: string): number | null {
  const m = SAAT.exec(saat);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/**
 * Sessiz saat denetimi. Kapalıyken hata üretmez (alanlar zaten devre dışı).
 * Başlangıç = bitiş GEÇERSİZDİR; "tüm gün sessiz" anlamına gelmez (tasarım varsayımı T11).
 */
export function notifQuietInfo(enabled: boolean, start: string, end: string): NotifQuietInfo {
  const info: NotifQuietInfo = {
    startError: null,
    endError: null,
    minutes: null,
    overnight: false,
  };
  if (!enabled) return info;
  const s = dakika(start);
  const e = dakika(end);
  if (s === null) info.startError = "empty";
  if (e === null) info.endError = "empty";
  if (s === null || e === null) return info;
  if (s === e) {
    info.endError = "equal";
    return info;
  }
  let fark = e - s;
  if (fark < 0) {
    fark += 1440;
    info.overnight = true;
  }
  info.minutes = fark;
  return info;
}

export function notifQuietValid(draft: NotifDraft): boolean {
  const q = notifQuietInfo(draft.quietEnabled, draft.quietStart, draft.quietEnd);
  return !q.startError && !q.endError;
}

/** Kaydedilmemiş değişiklik sayısı: her alan ve her olay × kanal ayrı sayılır. */
export function notifDiffCount(draft: NotifDraft, saved: NotifDraft): number {
  let n = 0;
  if (draft.frequency !== saved.frequency) n++;
  if (draft.quietEnabled !== saved.quietEnabled) n++;
  if (draft.quietStart !== saved.quietStart) n++;
  if (draft.quietEnd !== saved.quietEnd) n++;
  for (const [key, choice] of Object.entries(draft.events)) {
    for (const ch of NOTIF_USER_CHANNELS) {
      if (choice[ch] !== undefined && choice[ch] !== saved.events[key]?.[ch]) n++;
    }
  }
  return n;
}

export type NotifSaveEvent =
  | { type: "edit"; dirty: number }
  | { type: "save-start" }
  | { type: "save-ok" }
  | { type: "save-fail" }
  | { type: "discard" };

/**
 * Kayıt durum makinesi.
 *
 *   temiz ──edit(n>0)──▶ degisti ──save-start──▶ kaydediliyor ──save-ok──▶ temiz
 *                           ▲                         │
 *                           └────── (edit) ───── basarisiz ◀──save-fail──┘
 *
 * Kurallar: kayıt sürerken düzenleme ve vazgeçme YOK SAYILIR ("geri alındı +
 * kaydedildi" çifti oluşmaz); başarısız kayıttan sonra düzenleme hata bandını
 * silmez, yalnız tüm değişiklikler geri alınırsa temize döner.
 */
export function notifNextSaveState(current: NotifSaveState, event: NotifSaveEvent): NotifSaveState {
  switch (event.type) {
    case "edit":
      if (current === "kaydediliyor") return current;
      if (event.dirty === 0) return "temiz";
      return current === "basarisiz" ? "basarisiz" : "degisti";
    case "save-start":
      return current === "degisti" || current === "basarisiz" ? "kaydediliyor" : current;
    case "save-ok":
      return current === "kaydediliyor" ? "temiz" : current;
    case "save-fail":
      return current === "kaydediliyor" ? "basarisiz" : current;
    case "discard":
      return current === "kaydediliyor" ? current : "temiz";
  }
}

/** `save_preferences` gövdesi: yalnız seçmeli kanalların değeri gider. */
export function notifBuildSavePayload(
  draft: NotifDraft,
  prefs: Pick<NotifPreferences, "events" | "quiet" | "revision">
): NotifSavePayload {
  const events: NotifSavePayload["events"] = {};
  for (const ev of prefs.events) {
    const choice: NotifSavePayload["events"][string] = {};
    for (const ch of NOTIF_USER_CHANNELS) {
      if (ev.channels[ch] === "secmeli") choice[ch] = draft.events[ev.key]?.[ch] === true;
    }
    if (Object.keys(choice).length) events[ev.key] = choice;
  }
  return {
    events,
    frequency: draft.frequency,
    quiet: {
      enabled: draft.quietEnabled,
      start: draft.quietStart,
      end: draft.quietEnd,
      timezone: prefs.quiet.timezone,
    },
    revision: prefs.revision,
  };
}

/**
 * İzin switch'i kilitli mi. Aktarım sonucu beklenirken her yön kilitlidir; hedef
 * eksik/doğrulanmamışken yalnız İZİN VERMEK engellenir — verilmiş izin her zaman
 * geri çekilebilir (geri çekme hiçbir koşula bağlanmaz).
 */
export function notifConsentLocked(entry: Pick<NotifConsentEntry, "state" | "granted">): boolean {
  if (entry.state === "bekliyor") return true;
  if (entry.state === "hedef-eksik" || entry.state === "hedef-dogrulanmadi") return !entry.granted;
  return false;
}

/**
 * İzin switch'inin konumu: kullanıcının son KARARI. Sunucu bunu `granted` ile
 * ayrıca verir; `state` (`bekliyor`, `basarisiz`) İYS aktarımını anlatır, seçimi değil.
 */
export function notifConsentGranted(entry: Pick<NotifConsentEntry, "granted">): boolean {
  return entry.granted === true;
}

/**
 * İYS aktarımında sorun var mı ve kullanıcı bir şey yapabilir mi:
 *   · `unavailable` — aktarım bu kurulumda hiç yapılamıyor (`sync_available: false`);
 *     "yeniden dene" sunulmaz, "aktarılıyor" diye beklenmez.
 *   · `failed` — aktarım denendi, olmadı; yeniden denenebilir.
 *   · `null` — sorun yok (ya da aktarılacak bir karar yok).
 */
export function notifConsentSyncIssue(
  entry: Pick<NotifConsentEntry, "state" | "sync_available" | "error_code">
): "unavailable" | "failed" | null {
  if (entry.state !== "basarisiz" && !entry.error_code) return null;
  return entry.sync_available ? "failed" : "unavailable";
}

/**
 * Aktarım sonucu yoklanmalı mı: yalnız gerçekten `bekliyor` olan ve aktarımı
 * yapılabilen kanal için. Sağlayıcı yoksa sonuç hiç gelmeyeceğinden yoklanmaz.
 */
export function notifConsentNeedsPoll(consent: NotifConsent | null | undefined): boolean {
  if (!consent) return false;
  return (["email", "sms"] as const).some(
    (ch) => consent[ch].state === "bekliyor" && consent[ch].sync_available
  );
}

/**
 * Sıradaki özetin zamanı, TASLAKTAKİ sıklığa göre. `next_at` yalnız kayıtlı sıklık
 * içindir; sunucu her iki özet türü için de zamanı (`daily`, `weekly`) ayrıca verir,
 * böylece kullanıcı kaydetmeden önce seçtiği sıklığın sonucunu görür.
 */
export function notifDigestPreview(
  digest: Pick<NotifDigest, "daily" | "weekly"> | null | undefined,
  frequency: NotifFrequency
): string | null {
  if (!digest || frequency === "instant") return null;
  return (frequency === "daily" ? digest.daily : digest.weekly) ?? null;
}

/**
 * 422 `field_errors` içinden bir alanın hatası. Tam anahtar (`quiet.end`) yoksa
 * üst anahtar (`quiet`) aranır; böylece sunucunun genel "geçersiz sessiz saat"
 * hatası da ilgili alanın altında görünür.
 */
export function notifFieldError(
  fieldErrors: Record<string, string> | null | undefined,
  field: string
): string {
  if (!fieldErrors) return "";
  if (fieldErrors[field]) return fieldErrors[field];
  const parent = field.includes(".") ? field.slice(0, field.lastIndexOf(".")) : "";
  return parent && fieldErrors[parent] ? fieldErrors[parent] : "";
}

/**
 * Bu cihazın push durumu. Tarayıcı/uygulama kesin bir şey söylüyorsa (izin verildi,
 * istenmedi, engellendi) o geçerlidir; cihaz push'u hiç desteklemiyorsa (`null`)
 * sunucunun hesap düzeyindeki bilgisi kullanılır.
 */
export function notifResolvePushState(
  server: NotifPushDeviceState,
  local: NotifPushDeviceState | null
): NotifPushDeviceState {
  return local ?? server;
}

/** Ekranda gösterilen push durumu: cihaz durumu + sunucuda sağlayıcı yokluğu. */
export type NotifPushView = NotifPushDeviceState | "saglayici-yok";

/**
 * Sunucuda push sağlayıcısı yoksa (`provider_available: false`) cihaz izni ne olursa
 * olsun hiçbir push gitmez; ekran "açık/hazır" demez, `saglayici-yok` gösterir.
 */
export function notifPushView(
  device: Pick<NotifPushDevice, "state" | "provider_available"> | null | undefined,
  local: NotifPushDeviceState | null
): NotifPushView {
  if (!device) return local ?? "cihaz-yok";
  if (!device.provider_available) return "saglayici-yok";
  return notifResolvePushState(device.state, local);
}
