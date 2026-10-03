/**
 * Ayarlar > Bildirimler — Alpine davranışı (`x-data="settingsNotifications"`).
 *
 * Kararların tamamı `utils/notificationPrefsLogic.ts`'te (saf, sınanmış); bu modül
 * onları ekrana bağlar: yükleme, taslak, kayıt çubuğu, izin çağrıları, çıkış uyarısı.
 * Şablon: `components/settings/SettingsNotifications.ts`.
 *
 * Sayfa-özel modül: yalnız `pages/settings.ts` içe aktarır (vite `manualChunks`'ta
 * paylaşımlı 'alpine' parçasından hariç).
 */
import Alpine from "alpinejs";

import { t } from "../i18n";
import {
  NotifConflictError,
  NotifProviderUnavailableError,
  NotifValidationError,
  getNotifConsentStatus,
  getNotifPreferences,
  retryNotifConsentSync,
  saveNotifPreferences,
  setNotifCommercialConsent,
} from "../services/notificationPreferencesService";
import type {
  NotifConsentChannel,
  NotifConsentResult,
  NotifConsentState,
  NotifDraft,
  NotifPreferences,
  NotifPushDeviceState,
  NotifSaveState,
  NotifUserChannel,
} from "../types/notificationPreferences";
import {
  notifApplyBulk,
  notifBuildSavePayload,
  notifBulkAction,
  notifCategoryChannels,
  notifCategoryCount,
  notifCloneDraft,
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
  notifSends,
  notifSummaryStats,
} from "../utils/notificationPrefsLogic";
import type {
  NotifControlKind,
  NotifPushView,
  NotifSaveEvent,
} from "../utils/notificationPrefsLogic";
import { tarihSaatBicimle } from "../utils/numberLocale";
import { enablePushOnThisDevice, getPushDeviceState } from "../utils/pushNotifications";
import type { PushEnableOutcome } from "../utils/pushNotifications";
import { showToast } from "../utils/toast";

/** Ayarlar sayfasındaki bölüm adresi. Eski `#eposta` buraya yönlenir (SettingsLayout). */
export const NOTIF_SECTION_HASH = "#bildirimler";

/** Bekleyen İYS aktarımını yoklama aralığı ve üst sınırı (yalnız aktarım yapılabiliyorsa). */
const POLL_MS = 3000;
const POLL_MAX = 20;

/** xl+ (bu temada 1024px) ızgara; 768–1023'te kenar menüsüyle sütunlara yer kalmıyor, kart düzeni sürer: olay adı + kanal sütunları. Sınıflar Tailwind taraması için sabit metin. */
const GRID_2 = "xl:grid-cols-[minmax(0,1fr)_148px_148px]";
const GRID_3 = "xl:grid-cols-[minmax(0,1fr)_148px_148px_148px]";

const TARIH: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

const JUMP_IDS = ["np-olaylar", "np-zaman", "np-sessiz", "np-izin"] as const;

interface NotifCellView {
  ch: NotifUserChannel;
  kind: NotifControlKind;
  on: boolean;
  channelLabel: string;
  valueText: string;
  ariaLabel: string;
  /** SMS göndermeyen olayın SMS hücresi: yalnız md+ sütun hizası için çizilir. */
  padOnly: boolean;
}

interface NotifRowView {
  key: string;
  name: string;
  delivery: "aninda" | "ozetlenebilir" | null;
  deliveryLabel: string;
  cells: NotifCellView[];
}

interface NotifCategoryView {
  id: string;
  title: string;
  countText: string;
  open: boolean;
  gridClass: string;
  bulkLabel: string;
  cols: { ch: NotifUserChannel; label: string }[];
  bulks: { ch: NotifUserChannel; text: string }[];
  rows: NotifRowView[];
}

interface NotifConsentView {
  targetText: string;
  targetMissing: boolean;
  verified: boolean;
  verifyLabel: string;
  granted: boolean;
  locked: boolean;
  state: NotifConsentState;
  strong: string;
  rest: string;
  tone: string;
  action: "retry" | "update" | "verify" | null;
  actionLabel: string;
  actionHref: string;
  /** Son izin isteğinin reddi (ör. hedef doğrulanmamış). */
  error: string;
}

/** Sessiz saat alanları; 422 `field_errors` anahtarları bunlara bağlanır. */
const QUIET_FIELDS = ["quiet.start", "quiet.end", "quiet.enabled", "quiet"] as const;

const BOS_TASLAK: NotifDraft = {
  events: {},
  frequency: "daily",
  quietEnabled: false,
  quietStart: "",
  quietEnd: "",
};

const TON: Record<NotifConsentState, string> = {
  onayli: "text-[#166534]",
  bekliyor: "text-[#92400e]",
  basarisiz: "text-[#b91c1c]",
  "geri-cekildi": "text-text-secondary",
  yok: "text-text-secondary",
  "hedef-eksik": "text-[#92400e]",
  "hedef-dogrulanmadi": "text-[#92400e]",
};

Alpine.data("settingsNotifications", () => ({
  phase: "idle" as "idle" | "loading" | "ready" | "error",
  prefs: null as NotifPreferences | null,
  draft: notifCloneDraft(BOS_TASLAK),
  saved: notifCloneDraft(BOS_TASLAK),
  saveState: "temiz" as NotifSaveState,
  saveError: "" as "" | "generic" | "conflict" | "validation",
  /** 409 yanıtındaki güncel sunucu hâli; "Güncel hâlini yükle" bunu uygular. */
  conflictTheirs: null as NotifPreferences | null,
  /** 422 `field_errors` (nokta yollu anahtar → sunucu metni). */
  fieldErrors: {} as Record<string, string>,
  openCats: {} as Record<string, boolean>,
  historyOpen: false,
  localPush: null as NotifPushDeviceState | null,
  pushBusy: false,
  /** Son "izin ver" denemesi başarısızsa nedeni; başarılıysa boş. */
  pushIssue: "" as "" | Exclude<PushEnableOutcome, "registered">,
  consentBusy: { email: false, sms: false } as Record<NotifConsentChannel, boolean>,
  consentError: { email: "", sms: "" } as Record<NotifConsentChannel, string>,
  currentJump: 0,
  stickyTop: 0,
  bottomOffset: 0,
  pendingHref: "",
  pollTries: 0,
  pollTimer: null as ReturnType<typeof setTimeout> | null,
  spyQueued: false,

  init() {
    if (this.isActive()) void this.load();

    window.addEventListener("beforeunload", (e) => {
      if (this.dirty > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    });
    // Yakalama aşaması: bağlantı, kendi dinleyicisi çalışmadan önce durdurulur.
    document.addEventListener("click", (e) => this.guardLink(e), true);
    window.addEventListener("scroll", () => this.queueSpy(), { passive: true });
    window.addEventListener("resize", () => this.measure());
  },

  isActive(): boolean {
    return window.location.hash === NOTIF_SECTION_HASH;
  },

  // ── Yükleme ─────────────────────────────────────────────────────────

  async load() {
    this.phase = "loading";
    this.saveError = "";
    try {
      const [prefs, local] = await Promise.all([getNotifPreferences(), getPushDeviceState()]);
      this.localPush = local;
      this.apply(prefs);
      this.initOpenCats();
      this.phase = "ready";
      this.$nextTick(() => {
        this.measure();
        this.spy();
      });
      this.schedulePoll();
    } catch {
      this.phase = "error";
    }
  },

  /** Sunucu yanıtını ekrana alır: taslak ve "kayıtlı" kopya aynı yanıttan kurulur. */
  apply(prefs: NotifPreferences) {
    this.prefs = prefs;
    this.saved = notifDraftFrom(prefs);
    this.draft = notifCloneDraft(this.saved);
    this.saveState = "temiz";
    this.saveError = "";
    this.conflictTheirs = null;
    this.fieldErrors = {};
  },

  /** İzin uçlarının yanıtı: yalnız izin ve geçmiş değişir, tercih taslağına dokunulmaz. */
  applyConsent(res: NotifConsentResult) {
    if (!this.prefs) return;
    this.prefs.consent = res.consent;
    this.prefs.consent_history = res.consent_history;
  },

  /** Mobilde yalnız ilk kategori açık gelir; 768+ hepsi açık. */
  initOpenCats() {
    const wide = window.matchMedia("(min-width: 768px)").matches;
    const open: Record<string, boolean> = {};
    notifGroupByCategory(this.prefs?.events ?? []).forEach((g, i) => {
      open[g.id] = wide || i === 0;
    });
    this.openCats = open;
  },

  // ── Türetilenler ────────────────────────────────────────────────────

  get dirty(): number {
    return notifDiffCount(this.draft, this.saved);
  },

  get saving(): boolean {
    return this.saveState === "kaydediliyor";
  },

  /** Sunucuda push sağlayıcısı yoksa cihaz izni ne olursa olsun `saglayici-yok`. */
  get pushState(): NotifPushView {
    return notifPushView(this.prefs?.push_device, this.localPush);
  },

  get pushReady(): boolean {
    return this.pushState === "hazir";
  },

  get statusText(): string {
    if (this.phase === "ready") return t("notifPrefs.loaded");
    return this.phase === "loading" ? t("notifPrefs.loading") : "";
  },

  get pushGrantLabel(): string {
    return t(
      this.pushState === "cihaz-yok" ? "notifPrefs.push.grantHere" : "notifPrefs.push.grant"
    );
  },

  get pushTitle(): string {
    return t("notifPrefs.push.title", { state: t(`notifPrefs.push.state.${this.pushState}`) });
  },

  get pushText(): string {
    return t(`notifPrefs.push.text.${this.pushState}`);
  },

  get pushIssueText(): string {
    return this.pushIssue ? t(`notifPrefs.push.issue.${this.pushIssue}`) : "";
  },

  channelLabel(ch: NotifUserChannel | "inapp"): string {
    return t(`notifPrefs.channel.${ch}`);
  },

  get cats(): NotifCategoryView[] {
    const prefs = this.prefs;
    if (!prefs) return [];
    const draft = this.draft;
    const pushReady = this.pushReady;
    const pushNoProvider = this.pushState === "saglayici-yok";
    return notifGroupByCategory(prefs.events).map((g) => {
      const cols = notifCategoryChannels(g.events);
      const counts = cols
        .map((ch) => ({ ch, ...notifCategoryCount(g.events, ch, draft) }))
        .filter((c) => c.total > 0)
        .map((c) => `${this.channelLabel(c.ch)} ${c.on}/${c.total}`)
        .join(" · ");
      const title = t(`notifPrefs.category.${g.id}`, { defaultValue: g.id });
      const bulks: NotifCategoryView["bulks"] = [];
      for (const ch of cols) {
        const action = notifBulkAction(g.events, ch, draft);
        if (action) bulks.push({ ch, text: t(`notifPrefs.bulk.${action}.${ch}`) });
      }
      return {
        id: g.id,
        title,
        countText: t("notifPrefs.catCount", { parts: counts }),
        open: this.openCats[g.id] === true,
        gridClass: cols.length === 3 ? GRID_3 : GRID_2,
        bulkLabel: t("notifPrefs.bulk.groupLabel", { category: title }),
        cols: cols.map((ch) => ({ ch, label: this.channelLabel(ch) })),
        bulks,
        rows: g.events.map((ev) => {
          const sendsEmail = notifSends(ev, "email");
          return {
            key: ev.key,
            name: ev.name,
            delivery: sendsEmail ? ev.delivery : null,
            deliveryLabel: sendsEmail ? t(`notifPrefs.delivery.${ev.delivery}`) : "",
            cells: cols.map((ch) => {
              const kind = notifControlKind(ev.channels[ch]);
              const on = notifIsOn(ev, ch, draft);
              let valueText: string;
              if (kind === "locked") valueText = t("notifPrefs.value.locked");
              else if (kind === "none") valueText = t("notifPrefs.value.none");
              else if (on && ch === "push" && pushNoProvider)
                valueText = t("notifPrefs.value.noProvider");
              else if (on && ch === "push" && !pushReady) valueText = t("notifPrefs.value.pending");
              else valueText = t(on ? "notifPrefs.value.on" : "notifPrefs.value.off");
              return {
                ch,
                kind,
                on,
                channelLabel: this.channelLabel(ch),
                valueText,
                ariaLabel: t("notifPrefs.switchLabel", {
                  event: ev.name,
                  channel: this.channelLabel(ch),
                }),
                padOnly: ch === "sms" && kind === "none",
              };
            }),
          };
        }),
      };
    });
  },

  get mandatory(): { key: string; name: string; meta: string; why: string }[] {
    return (this.prefs?.events ?? [])
      .filter((ev) => ev.mandatory)
      .map((ev) => {
        const chans = (["inapp", "email", "push", "sms"] as const)
          .filter((ch) => ev.channels[ch] === "zorunlu")
          .map((ch) => this.channelLabel(ch))
          .join(", ");
        return {
          key: ev.key,
          name: ev.name,
          meta: `${chans} · ${t(`notifPrefs.delivery.${ev.delivery}`)}`,
          why: ev.why ?? "",
        };
      });
  },

  get mandatoryCount(): string {
    return t("notifPrefs.mandatory.count", { count: this.mandatory.length });
  },

  get stats() {
    return notifSummaryStats(this.prefs?.events ?? [], this.draft);
  },

  get sumEmail(): string {
    return t("notifPrefs.summary.count", { count: this.stats.emailOn });
  },

  get sumPush(): string {
    return t("notifPrefs.summary.count", { count: this.stats.pushOn });
  },

  get sumPushBlocked(): boolean {
    return !this.pushReady && this.stats.pushOn > 0;
  },

  /**
   * Sıradaki özet, TASLAKTAKİ sıklığa göre: sunucu günlük ve haftalık zamanı ayrıca
   * verir (`digest.daily/weekly`), böylece kaydetmeden önce de doğru zaman görünür.
   */
  get nextDigest(): string {
    const at = notifDigestPreview(this.prefs?.digest, this.draft.frequency);
    return at ? tarihSaatBicimle(at, TARIH) : "";
  },

  get sumDigest(): string {
    if (this.draft.frequency === "instant") return t("notifPrefs.summary.digestOff");
    if (!this.stats.digestible) return t("notifPrefs.summary.digestNone");
    return this.nextDigest || t("notifPrefs.summary.digestAfterSave");
  },

  get freqDisabled(): boolean {
    return this.stats.optionalEmailOn === 0;
  },

  get freqEffect(): string {
    const s = this.stats;
    if (this.freqDisabled) {
      return (
        t("notifPrefs.frequency.effectNone") +
        (s.urgent ? " " + t("notifPrefs.frequency.effectNoneUrgent", { count: s.urgent }) : "")
      );
    }
    if (this.draft.frequency === "instant") {
      return t("notifPrefs.frequency.effectInstant", {
        on: s.emailOn,
        digestible: s.digestible,
        urgent: s.urgent,
      });
    }
    if (!s.digestible) return t("notifPrefs.frequency.effectNoDigestible", { urgent: s.urgent });
    const base = t("notifPrefs.frequency.effectDigest", {
      digestible: s.digestible,
      urgent: s.urgent,
    });
    return this.nextDigest
      ? `${base} ${t("notifPrefs.frequency.effectNext", { at: this.nextDigest })}`
      : base;
  },

  /** Sessiz saat hataları: sunucunun 422 yanıtı varsa o, yoksa anlık yerel denetim. */
  get quiet() {
    const d = this.draft;
    const info = notifQuietInfo(d.quietEnabled, d.quietStart, d.quietEnd);
    const serverStart = notifFieldError(this.fieldErrors, "quiet.start");
    const serverEnd =
      notifFieldError(this.fieldErrors, "quiet.end") ||
      notifFieldError(this.fieldErrors, "quiet.enabled");
    let summary = "";
    if (!d.quietEnabled) summary = t("notifPrefs.quiet.summaryOff");
    else if (info.minutes !== null) {
      const h = Math.floor(info.minutes / 60);
      const m = info.minutes % 60;
      const sure = [
        h ? t("notifPrefs.quiet.hours", { count: h }) : "",
        m ? t("notifPrefs.quiet.minutes", { count: m }) : "",
      ]
        .filter(Boolean)
        .join(" ");
      const gun = t(info.overnight ? "notifPrefs.quiet.overnight" : "notifPrefs.quiet.sameDay");
      summary = `${d.quietStart}–${d.quietEnd} · ${sure} · ${gun}`;
    }
    const localEnd =
      info.endError === "equal"
        ? t("notifPrefs.quiet.errorEqual")
        : info.endError
          ? t("notifPrefs.quiet.errorEndEmpty")
          : "";
    return {
      startError: serverStart || (info.startError ? t("notifPrefs.quiet.errorStartEmpty") : ""),
      endError: serverEnd || localEnd,
      /** Gösterilen hata sunucudan mı (422) geldi. */
      fromServer: Boolean(serverStart || serverEnd),
      summary,
    };
  },

  get quietHelp(): string {
    return t("notifPrefs.quiet.help", { timezone: this.prefs?.quiet.timezone ?? "" });
  },

  consentView(ch: NotifConsentChannel): NotifConsentView {
    const prefs = this.prefs;
    const entry = prefs?.consent[ch];
    if (!prefs || !entry) {
      return {
        targetText: "",
        targetMissing: false,
        verified: false,
        verifyLabel: "",
        granted: false,
        locked: true,
        state: "yok",
        strong: "",
        rest: "",
        tone: TON.yok,
        action: null,
        actionLabel: "",
        actionHref: "",
        error: "",
      };
    }
    const state = entry.state;
    const kind = t(`notifPrefs.consent.targetKind.${ch}`);
    const when = entry.updated_at ? tarihSaatBicimle(entry.updated_at, TARIH) : "";
    const issue = notifConsentSyncIssue(entry);
    let rest = "";
    let action: NotifConsentView["action"] = null;
    if (state === "onayli" || state === "geri-cekildi") {
      rest = [when, this.sourceLabel(entry.source)].filter(Boolean).join(" · ");
      // Geri çekme yerelde hemen geçerlidir; aktarılamadıysa bunu saklamayız.
      if (issue === "unavailable") rest += ` · ${t("notifPrefs.consent.rest.unsynced")}`;
      if (issue === "failed") action = "retry";
    } else if (state === "hedef-eksik") {
      rest = t("notifPrefs.consent.rest.hedef-eksik", { kind });
      action = "update";
    } else if (state === "hedef-dogrulanmadi") {
      rest = t(
        entry.granted
          ? "notifPrefs.consent.rest.hedef-dogrulanmadiGranted"
          : "notifPrefs.consent.rest.hedef-dogrulanmadi",
        { kind }
      );
      action = "verify";
    } else if (state === "basarisiz") {
      // Sağlayıcı yoksa "yeniden dene" sunulmaz: sonuç değişmeyecek.
      rest = t(
        issue === "unavailable"
          ? "notifPrefs.consent.rest.basarisizUnavailable"
          : "notifPrefs.consent.rest.basarisiz"
      );
      if (issue === "failed") action = "retry";
    } else {
      rest = t(`notifPrefs.consent.rest.${state}`);
    }
    return {
      targetText: entry.target ?? t("notifPrefs.consent.targetMissing", { kind }),
      targetMissing: !entry.target,
      verified: entry.target_verified,
      verifyLabel: entry.target_verified
        ? t("notifPrefs.consent.verified")
        : t("notifPrefs.consent.state.hedef-dogrulanmadi"),
      granted: notifConsentGranted(entry),
      locked: notifConsentLocked(entry) || this.consentBusy[ch],
      state,
      strong: t(`notifPrefs.consent.state.${state}`),
      rest,
      tone: TON[state],
      action,
      actionLabel: action ? t(`notifPrefs.consent.${action}`) : "",
      actionHref: ch === "email" ? "#eposta-degistir" : "#telefon",
      error: this.consentError[ch],
    };
  },

  sourceLabel(source: string | null | undefined): string {
    return source ? t(`notifPrefs.consent.source.${source}`, { defaultValue: source }) : "";
  },

  get historyRows() {
    return (this.prefs?.consent_history ?? []).map((row, i) => ({
      id: `${row.at}-${row.channel}-${i}`,
      date: tarihSaatBicimle(row.at, TARIH),
      channel: this.channelLabel(row.channel),
      grant: row.action === "grant",
      action: t(row.action === "grant" ? "notifPrefs.history.grant" : "notifPrefs.history.revoke"),
      source: this.sourceLabel(row.source),
      sync: row.sync_state,
      syncLabel: t(`notifPrefs.history.sync.${row.sync_state}`),
    }));
  },

  get countText(): string {
    return t(this.saving ? "notifPrefs.save.savingCount" : "notifPrefs.save.dirtyCount", {
      count: this.dirty,
    });
  },

  get saveLabel(): string {
    if (this.saving) return t("notifPrefs.save.saving");
    if (this.saveError === "conflict") return t("notifPrefs.save.reload");
    if (this.saveState === "basarisiz") return t("notifPrefs.save.retry");
    return t("notifPrefs.save.save");
  },

  get saveErrorText(): string {
    if (this.saveError === "conflict") return t("notifPrefs.save.errorConflict");
    if (this.saveError === "validation") {
      // Ekranda alanı olmayan hatalar (ör. bilinmeyen olay) burada metin olarak görünür.
      const other = Object.entries(this.fieldErrors)
        .filter(([key]) => !(QUIET_FIELDS as readonly string[]).includes(key))
        .map(([key, msg]) => `${key}: ${msg}`);
      return [t("notifPrefs.save.errorValidation"), ...other].join(" ");
    }
    return t("notifPrefs.save.errorGeneric");
  },

  get leaveText(): string {
    return t("notifPrefs.leave.text", { count: this.dirty });
  },

  // ── Düzenleme ───────────────────────────────────────────────────────

  transition(event: NotifSaveEvent) {
    this.saveState = notifNextSaveState(this.saveState, event);
    if (this.saveState === "temiz") this.saveError = "";
    this.$nextTick(() => this.measure());
  },

  edited() {
    this.transition({ type: "edit", dirty: this.dirty });
  },

  /** Kullanıcı sessiz saati değiştirdi: o alanların eski sunucu hatası artık geçerli değil. */
  quietEdited() {
    if (QUIET_FIELDS.some((k) => k in this.fieldErrors)) {
      const next = { ...this.fieldErrors };
      for (const k of QUIET_FIELDS) delete next[k];
      this.fieldErrors = next;
    }
    this.edited();
  },

  toggleCat(id: string) {
    this.openCats[id] = !this.openCats[id];
  },

  toggleEvent(key: string, ch: NotifUserChannel) {
    if (this.saving) return;
    const choice = this.draft.events[key];
    if (!choice || choice[ch] === undefined) return; // zorunlu/kapalı kanal: taslakta yok
    choice[ch] = !choice[ch];
    this.edited();
  },

  bulk(catId: string, ch: NotifUserChannel) {
    if (this.saving) return;
    const events = (this.prefs?.events ?? []).filter(
      (ev) => !ev.mandatory && ev.category === catId
    );
    const action = notifBulkAction(events, ch, this.draft);
    if (!action) return;
    this.draft = notifApplyBulk(this.draft, events, ch, action === "on");
    this.edited();
  },

  toggleQuiet() {
    if (this.saving) return;
    this.draft.quietEnabled = !this.draft.quietEnabled;
    this.quietEdited();
  },

  // ── Kayıt ───────────────────────────────────────────────────────────

  /**
   * Kayıt. Doğrulamanın sahibi sunucudur: yerel denetim alanın altında anında ipucu
   * verir, ama isteği engellemez; 422 gelirse `field_errors` ilgili alana bağlanır.
   */
  async save() {
    if (this.saving || this.saveState === "temiz" || !this.prefs) return;
    if (this.saveError === "conflict") {
      this.loadTheirs();
      return;
    }
    this.transition({ type: "save-start" });
    try {
      const next = await saveNotifPreferences(notifBuildSavePayload(this.draft, this.prefs));
      this.apply(next);
      this.$nextTick(() => this.measure());
      showToast({ message: t("notifPrefs.save.saved"), type: "success" });
    } catch (e) {
      if (e instanceof NotifConflictError) {
        this.saveError = "conflict";
        this.conflictTheirs = e.theirs;
      } else if (e instanceof NotifValidationError) {
        this.saveError = "validation";
        this.fieldErrors = e.fieldErrors;
      } else {
        this.saveError = "generic";
      }
      this.transition({ type: "save-fail" });
      if (this.saveError === "validation") this.$nextTick(() => this.focusFieldError());
    }
  },

  /** 422 sonrası odak: hatalı ilk sessiz saat alanı. */
  focusFieldError() {
    const q = this.quiet;
    const el = q.startError ? this.$refs.quietStart : q.endError ? this.$refs.quietEnd : null;
    (el as HTMLElement | null | undefined)?.focus();
  },

  /**
   * 409 sonrası: sunucudaki güncel hâli (yanıttaki `theirs`) yükler; yerel taslak atılır.
   * `theirs` gelmediyse yeniden okunur.
   */
  loadTheirs() {
    const theirs = this.conflictTheirs;
    if (!theirs) {
      void this.load();
      return;
    }
    this.apply(theirs);
    this.$nextTick(() => this.measure());
    showToast({ message: t("notifPrefs.save.theirsLoaded"), type: "info" });
  },

  discard(silent = false) {
    if (this.saving) return; // kayıt sürerken vazgeçilemez: çift mesaj olmaz
    this.draft = notifCloneDraft(this.saved);
    this.transition({ type: "discard" });
    if (!silent) showToast({ message: t("notifPrefs.save.discarded"), type: "info" });
  },

  // ── Push cihazı ─────────────────────────────────────────────────────

  /**
   * "İzin ver": sunucuda sağlayıcı yoksa tarayıcı izni HİÇ istenmez (izin verilse de
   * bildirim gitmeyecek). Aksi hâlde sonuç yalnız kayıt sunucuda tamamlanınca başarıdır.
   */
  async grantPush() {
    if (this.pushBusy) return;
    if (this.pushState === "saglayici-yok") {
      this.pushIssue = "provider-unavailable";
      return;
    }
    this.pushBusy = true;
    try {
      const res = await enablePushOnThisDevice();
      this.localPush = res.state;
      this.pushIssue = res.outcome === "registered" ? "" : res.outcome;
    } finally {
      this.pushBusy = false;
    }
  },

  // ── Ticari ileti izni: kayıt çubuğundan BAĞIMSIZ, ayrı uçtan geçer ──

  async toggleConsent(ch: NotifConsentChannel) {
    const prefs = this.prefs;
    if (!prefs) return;
    const view = this.consentView(ch);
    if (view.locked) return;
    this.consentBusy[ch] = true;
    this.consentError[ch] = "";
    try {
      this.applyConsent(await setNotifCommercialConsent(ch, !view.granted));
      this.pollTries = 0;
      this.schedulePoll();
    } catch (e) {
      // 422: hedef yok / doğrulanmamış. Satırın altında kalıcı metin; toast kaybolur.
      this.consentError[ch] =
        e instanceof NotifValidationError
          ? t("notifPrefs.consent.errorTarget", {
              kind: t(`notifPrefs.consent.targetKind.${ch}`),
            })
          : t("notifPrefs.consent.errorSet");
    } finally {
      this.consentBusy[ch] = false;
    }
  },

  async retryConsent(ch: NotifConsentChannel) {
    const prefs = this.prefs;
    if (!prefs || this.consentBusy[ch]) return;
    this.consentBusy[ch] = true;
    this.consentError[ch] = "";
    try {
      const res = await retryNotifConsentSync(ch);
      prefs.consent = res.consent;
      const son = prefs.consent_history.find((row) => row.channel === ch);
      if (son && res.consent[ch].state === "bekliyor") son.sync_state = "bekliyor";
      this.pollTries = 0;
      this.schedulePoll();
      (this.$refs[`consent-${ch}`] as HTMLElement | undefined)?.focus({ preventScroll: true });
    } catch (e) {
      this.consentError[ch] = t(
        e instanceof NotifProviderUnavailableError
          ? "notifPrefs.consent.errorUnavailable"
          : "notifPrefs.consent.errorSet"
      );
    } finally {
      this.consentBusy[ch] = false;
    }
  },

  /**
   * Aktarım `bekliyor`ken sonucu `get_consent_status` ile yoklar (tercihleri değil).
   * Yalnız izin ve geçmiş güncellenir; kaydedilmemiş taslağa DOKUNULMAZ. Aktarım bu
   * kurulumda yapılamıyorsa (`sync_available: false`) hiç yoklanmaz.
   */
  schedulePoll() {
    if (this.pollTimer) clearTimeout(this.pollTimer);
    if (!notifConsentNeedsPoll(this.prefs?.consent) || this.pollTries >= POLL_MAX) return;
    this.pollTimer = setTimeout(async () => {
      this.pollTries++;
      try {
        this.applyConsent(await getNotifConsentStatus());
      } catch {
        // Yoklama hatası sessiz: bir sonraki turda yeniden denenir.
      }
      this.schedulePoll();
    }, POLL_MS);
  },

  // ── Çıkış uyarısı ───────────────────────────────────────────────────

  guardLink(e: MouseEvent) {
    if (!this.isActive() || this.dirty === 0 || e.defaultPrevented) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
    const href = a.getAttribute("href") ?? "";
    if (href === NOTIF_SECTION_HASH || href.startsWith("javascript:")) return;
    e.preventDefault();
    e.stopPropagation();
    this.askLeave(a.href);
  },

  /** Tarayıcının geri tuşu gibi bağlantı dışı bölüm değişimi. */
  onHash() {
    if (this.isActive()) {
      if (this.phase === "idle") void this.load();
      else this.$nextTick(() => this.measure());
      return;
    }
    this.clearScrollPadding();
    if (this.dirty > 0 && !this.saving) {
      const hedef = window.location.href;
      window.location.hash = NOTIF_SECTION_HASH;
      this.askLeave(hedef);
    }
  },

  askLeave(href: string) {
    this.pendingHref = href;
    (this.$refs.leaveDialog as HTMLDialogElement | undefined)?.showModal();
  },

  stay() {
    (this.$refs.leaveDialog as HTMLDialogElement | undefined)?.close();
  },

  leave() {
    (this.$refs.leaveDialog as HTMLDialogElement | undefined)?.close();
    if (this.saving) return;
    this.discard(true);
    const href = this.pendingHref;
    this.pendingHref = "";
    if (href) window.location.href = href;
  },

  // ── Yerleşim ölçüleri, bölüm gezinmesi ──────────────────────────────

  /**
   * Yapışkan başlığın ve mobil alt menünün yüksekliği: gezinme şeridi başlığın
   * altına, kayıt çubuğu alt menünün üstüne oturur; odaklanan öğe ikisinin de altında kalmaz.
   */
  measure() {
    if (!this.isActive()) return;
    this.stickyTop = document.getElementById("sticky-header")?.offsetHeight ?? 0;
    const nav = document.getElementById("bottom-nav");
    this.bottomOffset = nav && nav.offsetParent !== null ? nav.offsetHeight : 0;
    const bar = this.$refs.savebar as HTMLElement | undefined;
    const barH = bar && this.saveState !== "temiz" ? bar.offsetHeight : 0;
    const root = document.documentElement;
    root.style.scrollPaddingTop = `${this.stickyTop + 64}px`;
    root.style.scrollPaddingBottom = `${this.bottomOffset + barH + 8}px`;
  },

  clearScrollPadding() {
    const root = document.documentElement;
    root.style.scrollPaddingTop = "";
    root.style.scrollPaddingBottom = "";
  },

  jumpTo(index: number) {
    const el = document.getElementById(JUMP_IDS[index]);
    if (!el) return;
    if (index === 0) {
      const key = Object.keys(this.openCats)[0];
      if (key && !Object.values(this.openCats).some(Boolean)) this.openCats[key] = true;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    this.currentJump = index;
  },

  queueSpy() {
    if (this.spyQueued || this.phase !== "ready" || !this.isActive()) return;
    this.spyQueued = true;
    requestAnimationFrame(() => this.spy());
  },

  spy() {
    this.spyQueued = false;
    let current = 0;
    const esik = this.stickyTop + 72;
    JUMP_IDS.forEach((id, i) => {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= esik) current = i;
    });
    this.currentJump = current;
  },
}));
