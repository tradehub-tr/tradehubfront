/**
 * Alıcı bildirim + teslim kanıtı mock'u — 12-FE.
 *
 * NE İŞE YARIYOR: 12-BE'nin uçları henüz yazılmadı ve 14-BE'nin POD DocType'ı
 * yok. Bu modül o uçların yerine geçen **çalışan bir taklit**: tercih
 * kapatılır, kilitli olan reddedilir, kayıt hata verince eski değere dönülür,
 * bildirim okundu işaretlenir, teslim kanıtı üç ayrı hâliyle gelir — hepsi
 * gerçekten. Sayfa yenilendiğinde iş kaybolmaz.
 *
 * NEDEN VAR OLMASI GEREKİYORDU: bildirim tercihleri ekranı bu modül yazılana
 * kadar **hiçbir modda çalışmıyordu**. `alpine/logisticsBuyer.ts`
 * `window.__thSetNotificationPref` arıyordu, hiçbir yerde tanımlı değildi;
 * anahtar çevriliyor, hiçbir şey olmuyordu. Aynı kalıp 07-FE'de teslim onayı
 * formunda vardı (`logisticsDelivery` kaydı eksikti) ve yalnız tarayıcıda
 * görülebilmişti — build, `tsc` ve birim testleri görmüyor.
 *
 * `FE-MOCK-DISIPLINI.md` §2'nin dört zorunluluğu:
 *   §2.1 kalıcılık        → `localStorage`, + "Demo verisini sıfırla"
 *   §2.2 durum geçişleri  → tek kaynak: `readState()`; ekran ondan türer
 *   §2.3 gerçek çıktı     → POD belgesi açılabilir bir `blob:` URL'i
 *   §2.4 tetiklenebilir hata → `?senaryo=` anahtarları
 *
 * ── VERİ NEREDEN GELİYOR ──
 *
 * Tercihler ve bildirim akışı **üretilmiş fixture'dan** okunuyor:
 * `notification_preference.json` ve `notification_log.json`. İkincisi
 * 2026-08-28'de `contract.py`'ye eklendi (12-FE, sözleşme §1.2) — yani
 * 07-FE'nin K-G borcu burada tekrarlanmıyor, veri sözleşmeden akıyor.
 *
 * **Tek istisna POD (K-F).** `proof_of_delivery` sözleşmede yalnız 8 alan
 * taşıyor; ekranın gösterdiği yük (`14-FE-VERI-SOZLESMESI.md` §2.2) ~20 alan.
 * Varlık 14-BE'ye ait olduğu için genişletilMEDİ; eksik alanlar aşağıdaki
 * override tablosunda. **Borç:** 14-BE gerçek alanları eklediğinde tablo
 * silinir. Bkz. `12-FE-VERI-SOZLESMESI.md` §1.3.
 */
import { t } from "../i18n";
import notificationLogJson from "../mocks/logistics/notification_log.json";
import notificationPreferenceJson from "../mocks/logistics/notification_preference.json";
import proofOfDeliveryJson from "../mocks/logistics/proof_of_delivery.json";

import { isMockMode } from "./logisticsMock";
import { POD_ORNEK_ALANLAR } from "./podMediaSeed";
import * as api from "./shipmentService";

/**
 * Ucu yazıldıkça `false` olur; hepsi `false` olunca bu dosya silinir.
 *
 * Bayrak SADECE bir yorum değil: `false` olduğunda aşağıdaki fonksiyonlar
 * gerçek ucu (`shipmentService`) çağırıyor.
 */
export const MOCK = {
  prefs: true,
  setPref: true,
  feed: true,
  markRead: true,
  pod: true,
};

/**
 * Mock YALNIZ örnek veri ortamlarında devreye girer.
 *
 * 🔴 Bu kapı olmadan **canlıda örnek veri görünüyordu**: fonksiyonlar yalnız
 * `MOCK` bayrağına bakıyordu ve o bayrak üretimde de `true`. Yani
 * `istoc.com`'daki bir alıcı, "Mehmet Yıldız"ın teslim aldığı sahte bir
 * sevkiyatı kendi kanıtı sanacaktı.
 *
 * `logisticsMock.ts` bu iddiayı zaten koruyordu — *"canlı ortamlarda mock
 * veri asla görünmez"* — ama o koruma `isMockMode()` çağıran ekranlar için
 * geçerliydi; bu modül onu hiç sormuyordu. Kapı artık burada, çağıran
 * ekranın dikkatine bırakılmıyor.
 *
 * Kapalıyken gerçek uç çağrılıyor; uç yoksa `NotWiredError` fırlıyor ve ekran
 * "henüz bağlı değil" çiziyor — doğru davranış bu.
 */
function mockAcik(bayrak: boolean): boolean {
  return bayrak && isMockMode();
}

const STORAGE_KEY = "istoc_notification_mock";

/**
 * Bu ekranların rolü.
 *
 * Sözleşme §6.1: sunucu çağıranın rolüne ait olmayan satırı döndürmemeli.
 * Mock aynı kapıyı taklit ediyor — yoksa alıcı, satıcının ve operasyon
 * ekibinin tercihlerini görüyor (28 Ağustos'ta ölçülen kusur: fixture'ın
 * beş kaydından ikisi alıcıya ait değil).
 */
const ROL = "buyer";

export interface PreferenceRow {
  template: string;
  event: string;
  channel: string;
  recipient_role: string;
  enabled: number;
  is_mandatory: number;
  locked_reason: string | null;
}

export interface NotificationRow {
  name: string;
  template: string;
  event: string;
  channel: string;
  recipient_role: string;
  title: string;
  body: string | null;
  shipment: string | null;
  sent_at: string;
  read_at: string | null;
  status: string;
  failure_reason: string | null;
}

export interface PodRow {
  shipment: string;
  delivered_at: string;
  received_by: string;
  received_by_title: string | null;
  delivery_code_used: number;
  signature_url?: string | null;
  photo_url?: string | null;
  document_url?: string | null;
  location_source: string | null;
  location_recorded_at: string | null;
  delivered_package_count: number;
  total_package_count: number;
  has_discrepancy: number;
  exception_code: string | null;
  discrepancy_note: string | null;
  waybill_number: string | null;
  delivery_point: string | null;
}

/**
 * Depoda tutulan tam kayıt.
 *
 * `recipient` burada VAR ama `listNotifications` onu dışarı vermiyor
 * (sözleşme §2.3: "zaten çağıranın kendisi"). Tenant izolasyonunun dayanağı
 * olduğu için saklanıyor — mock, sunucunun kimlik kontrolünü taklit ediyor.
 */
type NotificationKaydi = NotificationRow & { recipient?: string };

interface NotificationState {
  senaryo?: string | null;
  prefs: PreferenceRow[];
  feed: NotificationKaydi[];
  pod: PodRow | null;
  /** `false` ise POD medya alanları yanıttan HİÇ çıkarılır (sözleşme §6.3). */
  podMedya: boolean;
  /** `true` ise `setNotificationPreference` genel hata döner (senaryo). */
  kayitHatasi: boolean;
  /** `true` ise tercih listesi `PERMISSION_DENIED` ile reddedilir. */
  yetkisiz: boolean;
}

let bellek: NotificationState | null = null;

function fixturePrefs(): PreferenceRow[] {
  return notificationPreferenceJson.default.data.items.map((r) => ({
    ...r,
    locked_reason: r.locked_reason ?? null,
  })) as PreferenceRow[];
}

function fixtureFeed(): NotificationKaydi[] {
  return notificationLogJson.default.data.items.map((r) => ({
    ...r,
    body: r.body ?? null,
    shipment: r.shipment ?? null,
    read_at: r.read_at ?? null,
    failure_reason: r.failure_reason ?? null,
  })) as NotificationKaydi[];
}

function fixturePod(): PodRow {
  const temel = proofOfDeliveryJson.default.data.items[0];
  return { ...temel, ...POD_ORNEK_ALANLAR } as unknown as PodRow;
}

function seed(): NotificationState {
  return {
    senaryo: null,
    prefs: fixturePrefs(),
    feed: fixtureFeed(),
    pod: fixturePod(),
    podMedya: true,
    kayitHatasi: false,
    yetkisiz: false,
  };
}

// ── Senaryolar (§2.4) ───────────────────────────────────────────────────

const SENARYOLAR: Record<string, () => NotificationState> = {
  /** S7-5 sol · hiç tercih yok */
  bos: () => ({ ...seed(), prefs: [], feed: [] }),
  /** S7-2 · hepsi kilitli — anahtarların tamamı devre dışı olmalı */
  "hepsi-zorunlu": () => ({
    ...seed(),
    prefs: seed().prefs.map((p) => ({ ...p, is_mandatory: 1, enabled: 1 })),
  }),
  /** S7-3 · kayıt reddediliyor — anahtar eski hâline dönmeli */
  "kayit-hatasi": () => ({ ...seed(), kayitHatasi: true }),
  /** S7-5 sağ · liste yetkisiz */
  yetkisiz: () => ({ ...seed(), yetkisiz: true }),
  /** S10-2 · kanıt yok — `null`, hata DEĞİL */
  "pod-yok": () => ({ ...seed(), pod: null }),
  /** S10-3 · medya yetkisi yok — alanlar yanıttan çıkarılır */
  "pod-medyasiz": () => ({ ...seed(), podMedya: false }),
  /** S10-4 · eksik teslim */
  "pod-eksik": () => ({
    ...seed(),
    pod: {
      ...fixturePod(),
      delivered_package_count: 6,
      has_discrepancy: 1,
      // Kod SÖZLEŞMEDEN: `shipment_exception_code` fixture'ında sekiz kod var
      // ve `DAMAGED_PACKAGE` onlardan biri DEĞİL. Uydurulmuş kod ekranda ham
      // metin olarak görünüyordu (i18n karşılığı da yoktu) —
      // `FE-MOCK-DISIPLINI` §2'nin "sözleşmedeki yükü birebir üret" kuralı.
      exception_code: "DAMAGED",
      discrepancy_note: "İki koli ıslanmış, şubede tutuldu.",
    },
  }),
};

export function aktifSenaryo(): string | null {
  const s = new URLSearchParams(window.location.search).get("senaryo");
  return s && s in SENARYOLAR ? s : null;
}

// ── Durum: tek doğruluk kaynağı (§2.2) ──────────────────────────────────

/**
 * Saklanan durumu okur; yoksa tohumdan üretip yazar.
 *
 * `localStorage` erişimi patlayabiliyor (gizli sekme, site verisi kapalı) —
 * o durumda bellek içi kopyayla devam ediliyor. Ekranın çalışmaması,
 * kalıcılığın çalışmamasından daha kötü.
 */
export function readState(): NotificationState {
  if (bellek) return bellek;

  const senaryo = aktifSenaryo();
  let saklanan: Partial<NotificationState> | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) saklanan = JSON.parse(raw) as Partial<NotificationState>;
  } catch {
    // yut — aşağıda tohumdan devam
  }

  /**
   * Senaryo YALNIZ İLK GİRİŞTE durumu kuruyor.
   *
   * 07-FE'de ölçülen tuzak: anahtar URL'de kaldığı için her `reload()` durumu
   * senaryoya geri alıyor ve kalıcılık iddiası (§2.1) senaryo altında
   * çalışmıyordu.
   */
  if (senaryo && saklanan?.senaryo !== senaryo) {
    bellek = { ...SENARYOLAR[senaryo](), senaryo };
    writeState(bellek);
    return bellek;
  }

  if (saklanan) {
    bellek = { ...seed(), ...saklanan };
    return bellek;
  }
  bellek = seed();
  return bellek;
}

function writeState(next: NotificationState): void {
  bellek = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Kalıcılık yok ama ekran çalışmaya devam ediyor.
  }
}

/** "Demo verisini sıfırla" — `FE-MOCK-DISIPLINI` §2.1 şartı. */
export function resetNotificationMock(): void {
  bellek = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* yok sayılır */
  }
}

// ── Uçların taklidi ─────────────────────────────────────────────────────

/**
 * Sözleşme §2.1 · `list_notification_preferences`
 *
 * Rol süzgeci burada uygulanıyor (§6.1). Sunucu da uygulamalı — bu bir
 * gösterim tercihi değil, yetki kapısı.
 */
export async function listNotificationPreferences(): Promise<PreferenceRow[]> {
  if (!mockAcik(MOCK.prefs)) return api.listNotificationPreferences();

  const s = readState();
  if (s.yetkisiz) throw new Error(t("shipment.notifyPref.permissionDenied"));
  return s.prefs.filter((p) => p.recipient_role === ROL);
}

/**
 * Sözleşme §2.2 · `set_notification_preference`
 *
 * Güncellenmiş satırın TAMAMI döner — ekran dönen satırı yerine koyuyor,
 * böylece sunucunun düzelttiği bir değer sessizce kaybolmuyor.
 */
export async function setNotificationPreference(payload: {
  template: string;
  enabled: boolean;
}): Promise<PreferenceRow> {
  if (!mockAcik(MOCK.setPref)) return api.setNotificationPreference(payload);

  const s = readState();
  const satir = s.prefs.find((p) => p.template === payload.template);

  if (!satir) throw new Error(t("shipment.notifyPref.notFound"));
  // Sunucu da reddeder (§6.2): FE anahtarı `disabled` çiziyor ama bu bir
  // kolaylık, kapı değil — API'ye doğrudan istek atan biri kapatamamalı.
  if (satir.is_mandatory === 1) throw new Error(t("shipment.notifyPref.mandatoryBlocked"));
  if (satir.recipient_role !== ROL) throw new Error(t("shipment.notifyPref.permissionDenied"));
  if (s.kayitHatasi) throw new Error(t("shipment.notifyPref.failed"));

  const guncel: PreferenceRow = { ...satir, enabled: payload.enabled ? 1 : 0 };
  writeState({
    ...s,
    prefs: s.prefs.map((p) => (p.template === payload.template ? guncel : p)),
  });
  return guncel;
}

/**
 * Sözleşme §2.3 · `list_notifications`
 *
 * Yalnız `status = "sent"` kayıtlar dönüyor: gönderilmemiş bir bildirimi
 * "geldi" diye göstermek yanlış bilgi olur. `recipient` alanı yanıtta
 * dönmüyor — zaten çağıranın kendisi.
 */
export async function listNotifications(): Promise<NotificationRow[]> {
  if (!mockAcik(MOCK.feed)) return api.listNotifications();

  const s = readState();
  return s.feed
    .filter((n) => n.recipient_role === ROL && n.status === "sent")
    .sort((a, b) => b.sent_at.localeCompare(a.sent_at))
    .map(({ recipient: _r, ...gorunur }) => gorunur as NotificationRow);
}

/** Sözleşme §2.4 · `mark_notification_read` — idempotent. */
export async function markNotificationRead(name: string): Promise<NotificationRow> {
  if (!mockAcik(MOCK.markRead)) return api.markNotificationRead(name);

  const s = readState();
  const satir = s.feed.find((n) => n.name === name);
  if (!satir) throw new Error(t("shipment.notifyPref.notFound"));
  if (satir.recipient_role !== ROL) throw new Error(t("shipment.notifyPref.permissionDenied"));
  if (satir.read_at) return satir;

  const guncel: NotificationKaydi = { ...satir, read_at: simdi() };
  writeState({ ...s, feed: s.feed.map((n) => (n.name === name ? guncel : n)) });
  return guncel;
}

/**
 * Sözleşme §2.5 · `get_proof_of_delivery` — tanım `14-FE-VERI-SOZLESMESI.md` §2.2.
 *
 * İki kural bu fonksiyonda görünür hâlde:
 *   · POD yoksa **`null`** döner, hata fırlatmaz — eksik veri, hata değil.
 *   · Medya yetkisi yoksa üç URL alanı yanıttan **silinir**; `null` atanmaz,
 *     çünkü `null` "kanıt yok" ile "görme yetkin yok"u aynı ekrana düşürürdü.
 */
export async function getProofOfDelivery(shipment: string): Promise<PodRow | null> {
  if (!mockAcik(MOCK.pod)) return api.getProofOfDelivery(shipment);

  const s = readState();
  if (!s.pod) return null;
  if (s.podMedya) return s.pod;

  const { signature_url: _s, photo_url: _p, document_url: _d, ...medyasiz } = s.pod;
  return medyasiz as PodRow;
}

function simdi(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

// ── Köprüler ────────────────────────────────────────────────────────────

/**
 * Ekranın aradığı `window.__th*` fonksiyonlarını kurar.
 *
 * `alpine/logisticsBuyer.ts` bu köprüyü 13 Ağustos'tan beri arıyordu ve
 * bulamıyordu; `ekranKalitesi.test.ts` eksikliği `it.fails` ile kayıtlı
 * tutuyordu. Bu satır bağlandığı gün o test "beklenen başarısızlık
 * gerçekleşmedi" diyerek uyarır ve `it`'e çevrilir — mekanizmanın çalıştığının
 * kanıtı 26 Ağustos'ta `__thCreateShipment` ile görüldü.
 */
export function installNotificationMock(): void {
  const w = window as unknown as Record<string, unknown>;
  if (MOCK.setPref) w.__thSetNotificationPref = setNotificationPreference;
  if (MOCK.markRead) w.__thMarkNotificationRead = markNotificationRead;

  // Sıfırlama düğmesi şeritte duruyor ama şerit her render'da yeniden
  // çiziliyor. Tek tek dinleyici yerine delegasyon: handler feature
  // modülünde kalıyor, sayfa init'i bunu bilmiyor (kök CLAUDE.md §4.7).
  if (!w.__thNotificationResetBound) {
    w.__thNotificationResetBound = true;
    document.addEventListener("click", (e) => {
      const hedef = (e.target as HTMLElement | null)?.closest(
        '[data-testid="notification-mock-reset"]'
      );
      if (!hedef) return;
      resetNotificationMock();
      window.location.reload();
    });
  }
}

/** Sıfırlama şeridi — kalıcılığın görünür kanıtı ve geri dönüş yolu. */
export function notificationMockBarHtml(): string {
  return `
    <div class="flex flex-wrap items-center gap-3 rounded-md border border-dashed border-gray-300 bg-gray-50 p-3"
         data-testid="notification-mock-bar">
      <span class="text-xs font-semibold text-gray-700">Örnek veri modu</span>
      <span class="text-xs text-gray-500">
        Tercih değişiklikleriniz tarayıcınızda saklanır.
      </span>
      <button type="button" class="th-btn-outline th-btn-sm ms-auto"
              data-testid="notification-mock-reset">
        Demo verisini sıfırla
      </button>
    </div>`;
}
