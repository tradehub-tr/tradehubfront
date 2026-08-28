import Alpine from "alpinejs";

import { t } from "../i18n";

/**
 * S11 iade talebi.
 *
 * Açıklama zorunlu ve en az 10 karakter: tek kelimelik "bozuk", satıcının
 * karar vermesine yetmiyor ve karşı tarafta "neden?" sorusuna dönüşüyor.
 */
const MIN_NOTE = 10;

interface ReturnRequestState {
  shipment: string;
  selected: string[];
  reason: string;
  note: string;
  submitting: boolean;
  error: string;
  readonly canSubmit: boolean;
  clampQty(event: Event, max: number): void;
  submit(): Promise<void>;
}

Alpine.data("returnRequest", (options: { shipment: string }) => ({
  shipment: options.shipment,
  selected: [] as string[],
  reason: "damaged",
  note: "",
  submitting: false,
  error: "",

  get canSubmit(): boolean {
    return this.selected.length > 0 && this.note.trim().length >= MIN_NOTE;
  },

  clampQty(this: ReturnRequestState, event: Event, max: number): void {
    const input = event.target as HTMLInputElement;
    const value = Number(input.value);
    if (Number.isNaN(value) || value < 1) input.value = "1";
    else if (value > max) input.value = String(max);
  },

  async submit(this: ReturnRequestState): Promise<void> {
    if (this.submitting) return;
    if (!this.canSubmit) {
      this.error = t("shipment.return.noteTooShort", { min: MIN_NOTE });
      return;
    }
    this.submitting = true;
    this.error = "";
    try {
      const fn = (window as unknown as Record<string, unknown>).__thCreateReturn as
        | ((payload: Record<string, unknown>) => Promise<{ name: string }>)
        | undefined;
      if (!fn) {
        this.error = t("shipment.return.notAvailable");
        return;
      }
      const created = await fn({
        shipment: this.shipment,
        reason: this.reason,
        note: this.note.trim(),
        items: this.selected,
      });
      window.location.href = `/pages/dashboard/returns.html?name=${encodeURIComponent(created.name)}`;
    } catch (e) {
      this.error = (e as Error)?.message || t("shipment.return.failed");
    } finally {
      this.submitting = false;
    }
  },
}));

/**
 * S3 randevu talebi.
 *
 * Geçmiş tarih İKİ kat engelleniyor: `min` niteliği (takvim arayüzü) ve
 * buradaki kontrol (elle yazılan değer). Tarayıcı `min`'i elle girişte
 * uygulamıyor, yalnız form doğrulamasında şikâyet ediyor.
 */
interface PickupAppointmentState {
  shipment: string;
  today: string;
  date: string;
  slot: string;
  submitting: boolean;
  error: string;
  readonly canSubmit: boolean;
  submit(): Promise<void>;
}

Alpine.data("pickupAppointment", (options: { shipment: string; today: string }) => ({
  shipment: options.shipment,
  today: options.today,
  date: options.today,
  slot: "",
  submitting: false,
  error: "",

  get canSubmit(): boolean {
    return Boolean(this.date) && Boolean(this.slot) && this.date >= this.today;
  },

  async submit(this: PickupAppointmentState): Promise<void> {
    if (this.submitting) return;
    if (this.date < this.today) {
      this.error = t("shipment.appointment.pastDate");
      return;
    }
    if (!this.canSubmit) {
      this.error = t("shipment.appointment.incomplete");
      return;
    }
    this.submitting = true;
    this.error = "";
    try {
      const fn = (window as unknown as Record<string, unknown>).__thRequestAppointment as
        | ((payload: Record<string, unknown>) => Promise<void>)
        | undefined;
      if (!fn) {
        this.error = t("shipment.appointment.notAvailable");
        return;
      }
      await fn({ shipment: this.shipment, date: this.date, slot: this.slot });
      window.location.reload();
    } catch (e) {
      this.error = (e as Error)?.message || t("shipment.appointment.failed");
    } finally {
      this.submitting = false;
    }
  },
}));

/**
 * S6 bildirim akışı — okundu işareti.
 *
 * Okunmamış satıra tıklandığında kayıt okundu işaretleniyor. Köprü yoksa
 * SESSİZCE hiçbir şey yapmıyor: bu ikincil bir kolaylık, akışın kendisi
 * (bildirimi görmek, sevkiyata gitmek) köprüsüz de çalışıyor.
 */
interface NotificationFeedState {
  okundu(name: string, el: HTMLElement): Promise<void>;
}

Alpine.data("notificationFeed", () => ({
  async okundu(this: NotificationFeedState, name: string, el: HTMLElement): Promise<void> {
    const fn = (window as unknown as Record<string, unknown>).__thMarkNotificationRead as
      | ((name: string) => Promise<unknown>)
      | undefined;
    if (!fn) return;
    try {
      await fn(name);
      // Rozet anında sönüyor; liste yeniden çekilmiyor çünkü kullanıcı
      // okuduğu satırın yerinden oynamasını beklemiyor.
      el.dataset.read = "1";
      el.classList.remove("border-indigo-200", "bg-indigo-50/40");
      el.classList.add("border-gray-200", "opacity-70");
    } catch {
      // Okundu işareti başarısızsa kullanıcıyı rahatsız etmeye değmez.
    }
  },
}));

/**
 * S7 bildirim tercihleri.
 *
 * Zorunlu bildirimler buraya HİÇ gelmiyor — şablonda `disabled` olduğu için
 * `change` olayı tetiklenmiyor. Yine de savunma amaçlı: gelen bir istek
 * sunucuya gönderilmeden önce burada da durur.
 */
interface NotificationPreferencesState {
  /** Kaydedilmekte olan şablonun adı; boş dize = boşta. */
  saving: string;
  error: string;
  toggle(template: string, enabled: boolean, el?: HTMLInputElement): Promise<void>;
}

Alpine.data("notificationPreferences", () => ({
  saving: "",
  error: "",

  /**
   * İyimser güncelleme + GERİ ALMA.
   *
   * Anahtar tıklandığı anda dönüyor (tarayıcı öyle yapıyor); istek
   * başarısızsa eski hâline döndürülüyor. Bunu yapmazsak kullanıcı kapattığını
   * sandığı bildirimi almaya devam eder — sessiz başarısızlık, görünür
   * başarısızlıktan kötüdür (12-FE sözleşmesi §4.3).
   */
  async toggle(
    this: NotificationPreferencesState,
    template: string,
    enabled: boolean,
    el?: HTMLInputElement
  ): Promise<void> {
    if (this.saving) return;
    this.saving = template;
    this.error = "";
    try {
      const fn = (window as unknown as Record<string, unknown>).__thSetNotificationPref as
        | ((payload: { template: string; enabled: boolean }) => Promise<unknown>)
        | undefined;
      if (!fn) {
        this.error = t("shipment.notifyPref.notAvailable");
        if (el) el.checked = !enabled;
        return;
      }
      await fn({ template, enabled });
    } catch (e) {
      this.error = (e as Error)?.message || t("shipment.notifyPref.failed");
      if (el) el.checked = !enabled;
    } finally {
      this.saving = "";
    }
  },
}));
