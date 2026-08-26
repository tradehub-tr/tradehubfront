/**
 * Alıcı teslim alma mock'u — 07-FE.
 *
 * NE İŞE YARIYOR: 07-BE'nin uçları henüz yazılmadı (`api.v1.pickup.*` yok).
 * Bu modül o uçların yerine geçen **çalışan bir taklit**: randevu alınır,
 * kod girilir, yanlış kod sayılır, süre dolar, kilit gelir — hepsi gerçekten.
 * Sayfa yenilendiğinde iş kaybolmaz.
 *
 * `FE-MOCK-DISIPLINI.md` §2'nin dört zorunluluğu:
 *   §2.1 kalıcılık        → `localStorage`, + "Demo verisini sıfırla"
 *   §2.2 durum geçişleri  → tek kaynak: `readState()`; ekran ondan türer
 *   §2.3 gerçek çıktı     → bu ekranda üretilen belge yok (etiket 13-FE'nin işi)
 *   §2.4 tetiklenebilir hata → `?senaryo=` anahtarları
 *
 * ── NEDEN VERİ BURADA, FIXTURE'DA DEĞİL (K-G, 2026-08-26) ──
 *
 * `src/mocks/logistics/*.json` **üretilmiş** dosyalar: kaynakları
 * `tradehub_core/logistics/contract.py`, üreteçleri `gen_logistics_types.py`.
 * Oraya elle eklenen bir kayıt bir sonraki `--sync`'te sessizce silinir.
 *
 * Doğru çözüm örneği sözleşmeye eklemek olurdu, ama bu 07-FE'nin repo
 * sınırını (yalnız `tradehubfront`) aşıyor ve `--sync` üçüncü bir repoya
 * (`admin-panel`) da yazıyor. Bu yüzden temel kayıt üretilmiş fixture'dan
 * alınıyor, teslim alma alanları burada üzerine yazılıyor.
 *
 * **BORÇ:** Bu override tablosu sözleşme değişirse elle güncellenmeli.
 * 07-BE'de gerçek uçlar gelince modül tamamen silinecek; kalıcı çözüm
 * örneğin `contract.py`'ye taşınmasıdır. Bkz. `07-FE-VERI-SOZLESMESI.md` §8.
 */
import { t } from "../i18n";

import { mockShipmentDetail } from "./logisticsMock";
import * as pickupApi from "./shipmentService";

/**
 * Ucu yazıldıkça `false` olur; hepsi `false` olunca bu dosya silinir.
 *
 * Bayrak SADECE bir yorum değil: `false` olduğunda aşağıdaki fonksiyonlar
 * gerçek ucu (`shipmentService`) çağırıyor. Eskiden bu vaat belgede yazılıydı
 * ama mekanizması yoktu — bayrağı kapatan kişi hiçbir şeyin değişmediğini
 * görürdü.
 */
export const MOCK = {
  slots: true,
  appointment: true,
  confirm: true,
  resend: true,
};

const STORAGE_KEY = "istoc_pickup_mock";

/**
 * Örnek teslim kodu.
 *
 * Gerçek akışta kod alıcıya SMS/e-posta ile gider ve ekranda **hiç
 * görünmez** (sözleşme §6.1). Mock'ta bir yerden öğrenilmesi gerekiyor,
 * yoksa akış denenemez — bu yüzden sıfırlama şeridinde yazıyor.
 */
export const ORNEK_KOD = "482913";

/** Sözleşme §1.2 · B2 — alan gelmezse FE bunu varsayar. */
const MAX_ATTEMPTS = 3;

/** Kodun ömrü. Gerçekte sunucu belirler (sözleşme §10 açık kalem 2). */
const CODE_TTL_MS = 5 * 60 * 1000;

export interface PickupState {
  /** Durumu kuran senaryo — aynı senaryoda yenileme onu SIFIRLAMASIN diye. */
  senaryo?: string | null;
  shipment: string;
  shipment_type: string;
  status: string;
  pickup_location: string | null;
  appointment_at: string | null;
  appointment_window: string | null;
  delivery_code_required: 0 | 1;
  delivery_code_status: "not_required" | "pending" | "verified" | "failed";
  delivery_code_attempts: number;
  /** Sözleşme §1.2 · B1 — `null` ise ekran süre bölümünü HİÇ çizmez. */
  delivery_code_expires_at: string | null;
  max_delivery_attempts: number;
  payment_required_before_delivery: 0 | 1;
  payment_status: "unpaid" | "paid" | "waived";
}

/** `YYYY-MM-DD HH:mm:ss` — sözleşmedeki Datetime biçimi. */
function toContractDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/**
 * Temel kayıt — üretilmiş fixture + teslim alma alanları.
 *
 * Fixture `Standard`/`CARGO` bir sevkiyat; teslim alma ekranı onda hiç
 * çizilmezdi (kanal koşulu, K-D). Aşağıdaki override onu `Buyer Pickup`
 * yapıyor. Alan adları sözleşmeyle birebir — uydurulan bir ad gerçek uca
 * bağlanınca ekranı bozar.
 */
function seed(): PickupState {
  const base = mockShipmentDetail() as Record<string, unknown>;
  return {
    shipment: String(base.name ?? "SHP-2026-00035"),
    shipment_type: "Buyer Pickup",
    status: "Ready for Pickup",
    pickup_location: "İkitelli OSB, Bağcılar Cad. No:12 — Depo girişi",
    appointment_at: null,
    appointment_window: null,
    delivery_code_required: 1,
    delivery_code_status: "pending",
    delivery_code_attempts: 0,
    delivery_code_expires_at: toContractDate(new Date(Date.now() + CODE_TTL_MS)),
    max_delivery_attempts: MAX_ATTEMPTS,
    payment_required_before_delivery: 0,
    payment_status: "paid",
  };
}

/**
 * `?senaryo=` anahtarları — `FE-MOCK-DISIPLINI` §2.4.
 *
 * Hata ekranları en az mutlu yol kadar tasarım kararı içeriyor ve yalnız
 * hata gerçekleştiğinde görülebiliyor. Tetiklenemezlerse gözden geçirilemezler.
 *
 * Anahtar geldiğinde saklanan durum o senaryoya **sıfırlanır** — yarı yarıya
 * uygulamak, hangi durumun ekranda olduğunu belirsizleştirirdi.
 */
const SENARYOLAR: Record<string, () => PickupState> = {
  /** S4-4 · deneme hakkı bitmiş */
  kilitli: () => ({
    ...seed(),
    delivery_code_status: "failed",
    delivery_code_attempts: MAX_ATTEMPTS,
  }),
  /** S4-5 · kodun süresi geçmiş */
  "sure-doldu": () => ({
    ...seed(),
    delivery_code_expires_at: toContractDate(new Date(Date.now() - 60_000)),
  }),
  /** S4-6 · ödeme şartlı, ödeme yapılmamış */
  "odeme-bekliyor": () => ({
    ...seed(),
    payment_required_before_delivery: 1,
    payment_status: "unpaid",
  }),
  /** S3-3 · o gün hiç yer yok — slot üretimi buna bakıyor */
  "slot-dolu": () => seed(),
  /** M-1 · kargo sevkiyatı: iki blok da çizilmemeli */
  kargo: () => ({
    ...seed(),
    shipment_type: "Standard",
    status: "In Transit",
    pickup_location: null,
    delivery_code_required: 0,
    delivery_code_status: "not_required",
  }),
  /** S4-1 · kod istemeyen teslim alma */
  kodsuz: () => ({
    ...seed(),
    delivery_code_required: 0,
    delivery_code_status: "not_required",
    delivery_code_expires_at: null,
  }),
  /** S4-7 · teslim alınmış */
  tamamlandi: () => ({
    ...seed(),
    delivery_code_status: "verified",
    status: "Picked Up",
    appointment_at: "2026-08-27 09:00:00",
    appointment_window: "09:00-12:00",
  }),
};

export function aktifSenaryo(): string | null {
  const s = new URLSearchParams(window.location.search).get("senaryo");
  return s && s in SENARYOLAR ? s : null;
}

// ── Durum: tek doğruluk kaynağı (§2.2) ──────────────────────────────────

let bellek: PickupState | null = null;

/**
 * Saklanan durumu okur; yoksa tohumdan üretip yazar.
 *
 * `localStorage` erişimi patlayabiliyor (gizli sekme, site verisi kapalı) —
 * o durumda bellek içi kopyayla devam ediliyor. Ekranın çalışmaması,
 * kalıcılığın çalışmamasından daha kötü.
 */
export function readState(): PickupState {
  if (bellek) return bellek;

  const senaryo = aktifSenaryo();
  let saklanan: Partial<PickupState> | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) saklanan = JSON.parse(raw) as Partial<PickupState>;
  } catch {
    // yut — aşağıda tohumdan devam
  }

  /**
   * Senaryo YALNIZ İLK GİRİŞTE durumu kuruyor.
   *
   * Ölçüldü (2026-08-26, E2E): anahtar URL'de kaldığı için her `reload()`
   * durumu senaryoya geri alıyordu — kod doğrulanıyor, sayfa yenileniyor ve
   * ekran yine "teslim alınmadı" diyordu. Kalıcılık iddiası (§2.1) senaryo
   * altında çalışmıyordu.
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

function writeState(next: PickupState): void {
  bellek = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Kalıcılık yok ama ekran çalışmaya devam ediyor.
  }
}

/** "Demo verisini sıfırla" — `FE-MOCK-DISIPLINI` §2.1 şartı. */
export function resetPickupMock(): void {
  bellek = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* yok sayılır */
  }
}

function kodSuresiDoldu(s: PickupState): boolean {
  if (!s.delivery_code_expires_at) return false;
  return new Date(s.delivery_code_expires_at.replace(" ", "T")).getTime() < Date.now();
}

// ── Uçların taklidi ─────────────────────────────────────────────────────

/** Sözleşme §2.1 · `list_appointment_slots` */
export function listAppointmentSlots(date: string): {
  value: string;
  label: string;
  available: boolean;
}[] {
  const hepsiDolu = aktifSenaryo() === "slot-dolu";
  // Hafta sonu deponun kapasitesi yarı yarıya — sabit bir liste, günden
  // bağımsız olsaydı "neden bu gün seçilemiyor" sorusu doğardı.
  const gun = new Date(date.replace(" ", "T")).getDay();
  const haftaSonu = gun === 0 || gun === 6;

  return [
    { value: "09-12", label: "09:00 – 12:00", available: !hepsiDolu },
    { value: "12-15", label: "12:00 – 15:00", available: !hepsiDolu && !haftaSonu },
    { value: "15-18", label: "15:00 – 18:00", available: !hepsiDolu && !haftaSonu },
  ];
}

/** Sözleşme §2.2 · `request_appointment` — hem oluşturur hem değiştirir. */
export async function requestAppointment(payload: {
  shipment: string;
  date: string;
  slot: string;
}): Promise<void> {
  if (!MOCK.appointment) return pickupApi.requestAppointment(payload);

  const slots = listAppointmentSlots(payload.date);
  const secilen = slots.find((s) => s.value === payload.slot);

  // Sunucu da reddeder (sözleşme §2.2) — istemci kontrolü kolaylık, kapı değil.
  if (!secilen) throw new Error(t("shipment.appointment.slotNotFound"));
  if (!secilen.available) throw new Error(t("shipment.appointment.slotTaken"));
  if (payload.date < bugun()) throw new Error(t("shipment.appointment.pastDate"));

  const [bas] = secilen.label.split(" – ");
  writeState({
    ...readState(),
    appointment_at: `${payload.date} ${bas}:00`,
    appointment_window: secilen.label.replace(" – ", "-"),
  });
}

/** Sözleşme §2.3 · `confirm_delivery` */
export async function confirmDelivery(payload: { shipment: string; code: string }): Promise<void> {
  const s = readState();

  // Ödeme kapısı sunucuda da var (§6.3): form çizilmese bile istek gelebilir.
  if (s.payment_required_before_delivery === 1 && s.payment_status === "unpaid") {
    throw new Error(t("shipment.confirm.paymentBlocked"));
  }
  if (s.delivery_code_attempts >= s.max_delivery_attempts) {
    throw new Error(t("shipment.confirm.lockedOut"));
  }

  if (s.delivery_code_required === 0) {
    writeState({ ...s, delivery_code_status: "verified", status: "Picked Up" });
    return;
  }

  // Süre kontrolü koddan ÖNCE: süresi dolmuş kodu "yanlış" saymak deneme
  // hakkını yakardı, oysa alıcının hatası değil (sözleşme §2.4).
  if (kodSuresiDoldu(s)) {
    const err = new Error(t("shipment.confirm.codeExpired"));
    err.name = "DELIVERY_CODE_EXPIRED";
    throw err;
  }

  if (payload.code.trim() !== ORNEK_KOD) {
    writeState({
      ...s,
      delivery_code_status: "failed",
      delivery_code_attempts: s.delivery_code_attempts + 1,
    });
    // Yanlış kod bir SİSTEM hatası değil, beklenen bir sonuç — ekran sayacı
    // gösterip formu açık tutuyor (sözleşme §2.3).
    throw new Error(t("shipment.confirm.codeInvalid"));
  }

  writeState({ ...s, delivery_code_status: "verified", status: "Picked Up" });
}

/** Sözleşme §2.4 · `resend_delivery_code` — deneme hakkını SIFIRLAMAZ. */
export async function resendDeliveryCode(): Promise<void> {
  const s = readState();
  if (!MOCK.resend) return pickupApi.resendDeliveryCode({ shipment: s.shipment });

  writeState({
    ...s,
    delivery_code_status: "pending",
    delivery_code_expires_at: toContractDate(new Date(Date.now() + CODE_TTL_MS)),
  });
}

function bugun(): string {
  return toContractDate(new Date()).slice(0, 10);
}

// ── Alpine'ın aradığı global köprüler ───────────────────────────────────

/**
 * `logisticsBuyer.ts` ve `logisticsDelivery.ts` bu üç fonksiyonu `window`
 * üzerinde arıyor; bulamazlarsa "bu özellik henüz kullanıma açılmadı" diyorlar.
 *
 * Global köprü deseni benim seçimim değil — Alpine modülleri 13 Ağustos'ta
 * böyle yazıldı ve gerçek uç geldiğinde de aynı yere bağlanacak. Değiştirmek
 * 07-FE'nin işi değil; **kurmak** işi.
 */
export function installPickupMock(): void {
  const w = window as unknown as Record<string, unknown>;
  if (MOCK.appointment) w.__thRequestAppointment = requestAppointment;
  if (MOCK.confirm) w.__thConfirmDelivery = confirmDelivery;
  if (MOCK.resend) w.__thResendDeliveryCode = resendDeliveryCode;

  // Sıfırlama düğmesi şeritte duruyor ama şerit her render'da yeniden
  // çiziliyor. Düğmeye tek tek dinleyici bağlamak yerine delegasyon:
  // handler feature modülünde kalıyor, sayfa init'i bunu bilmiyor
  // (kök CLAUDE.md §4.7).
  if (!w.__thPickupResetBound) {
    w.__thPickupResetBound = true;
    document.addEventListener("click", (e) => {
      const hedef = (e.target as HTMLElement | null)?.closest('[data-testid="pickup-mock-reset"]');
      if (!hedef) return;
      resetPickupMock();
      window.location.reload();
    });
  }
}

/**
 * Sıfırlama şeridi.
 *
 * Örnek kodu burada yazıyor: gerçek akışta kod SMS ile gelir ve ekranda hiç
 * görünmez (§6.1). Mock'ta bir yerden öğrenilmesi gerek, yoksa teslim alma
 * akışı hiç denenemez.
 */
export function pickupMockBarHtml(): string {
  return `
    <div class="flex flex-wrap items-center gap-3 rounded-md border border-dashed border-gray-300 bg-gray-50 p-3"
         data-testid="pickup-mock-bar">
      <span class="text-xs font-semibold text-gray-700">Örnek veri modu</span>
      <span class="text-xs text-gray-500">
        Yaptığınız işlemler tarayıcınızda saklanır. Örnek teslim kodu:
        <b class="font-mono text-gray-800">${ORNEK_KOD}</b>
      </span>
      <button type="button" class="th-btn-outline th-btn-sm ms-auto"
              data-testid="pickup-mock-reset">
        Demo verisini sıfırla
      </button>
    </div>`;
}
