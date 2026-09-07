/**
 * Sevkiyat takibi sayfası — alıcı.
 *
 * Dört ekranı bir arada taşıyor çünkü alıcı için hepsi tek soru: **"kargom
 * nerede ve ne yapmam gerekiyor?"** Ayrı sayfalara bölmek, alıcıyı takip →
 * randevu → onay arasında gezdirmek olurdu.
 *
 *   S5 · Takip çizelgesi   — her zaman
 *   S4 · Teslim onayı      — teslim edilmemişse
 *   S10 · Teslim özeti     — teslim edilmişse
 *
 * VERİ DURUMU (ölçüldü): sevkiyat detayı GERÇEK uçtan geliyor. Olay geçmişi
 * (`Shipment Event`) ayrı DocType ve listeleyen uç yok; teslim kanıtı için
 * DocType bile yok. `?mock=1` ile bu ikisi örnek veriyle çiziliyor
 * (bkz. `services/logisticsMock.ts`).
 */
// T-123: RUM montajı — MPA ortak boot (çift başlatmaya karşı korumalı).
import "../lib/rum/boot";
import "../style.css";
import "../alpine/sidebar";
// Randevu formu (S3) örnek veri modunda çiziliyor — Alpine kaydı gerekli.
import "../alpine/logisticsBuyer";
/**
 * Teslim onayı davranışı (`deliveryConfirm`) ayrı modülde ve BU SATIR EKSİKTİ.
 *
 * Ölçüldü (2026-08-26, E2E): `DeliveryConfirm` bileşeni sayfada çiziliyordu
 * ama `x-data="deliveryConfirm(...)"` kayıtlı olmadığı için form hiç
 * çalışmıyordu — kod girilebiliyor, düğmeye basılabiliyor, hiçbir şey
 * olmuyordu. Build, tip denetimi ve birim testleri bunu görmüyordu; ancak
 * tarayıcıda ortaya çıktı.
 */
import "../alpine/logisticsDelivery";
import { startAlpine } from "../alpine";
import { DeliveryConfirm } from "../components/logistics/DeliveryConfirm";
import { NotWiredNotice } from "../components/logistics/NotWiredNotice";
import { PickupAppointment } from "../components/logistics/PickupAppointment";
import {
  ProofOfDelivery,
  type ProofOfDeliveryRow,
} from "../components/logistics/ProofOfDelivery";
import { ShipmentGroupList } from "../components/logistics/ShipmentGroupList";
import { TrackingTimeline } from "../components/logistics/TrackingTimeline";
import { t } from "../i18n";
import {
  isMockMode,
  mockBannerHtml,
  mockShipmentDetail,
  mockShipmentList,
  mockTrackingEvents,
} from "../services/logisticsMock";
import {
  getProofOfDelivery,
  installNotificationMock,
} from "../services/logisticsNotificationMock";
import {
  MOCK as PICKUP_MOCK,
  installPickupMock,
  listAppointmentSlots,
  pickupMockBarHtml,
  readState,
  type PickupState,
} from "../services/logisticsPickupMock";
// Kanal koşulunun tek tanımı orada — sipariş listesindeki giriş düğmesi de
// aynı kuralı kullanıyor, iki yerde ayrı liste tutmak ikisini sürüklerdi.
import { TESLIM_ALMA_TIPLERI } from "../services/pickupEntry";
import { getShipment, listShipments, type ShipmentDetail } from "../services/shipmentService";
import type { ShipmentDetail as SozlesmeShipmentDetail } from "../types/logistics";
import { requireAuth } from "../utils/auth-guard";
import { escapeHtml } from "../utils/sanitize";

import { mountDashboardShell, shellCard } from "./dashboardShell";

await requireAuth();

const mock = isMockMode();

/**
 * Randevu ve teslim onayı düğmeleri `window.__thRequestAppointment` /
 * `__thConfirmDelivery` fonksiyonlarını arıyor. 07-BE'nin uçları yazılana
 * kadar onları bu mock sağlıyor; kurulmazsa ekran açılıyor ama hiçbir düğme
 * iş yapmıyor — "ekran render oluyor, iş akışı kapanmıyor" durumu.
 */
if (mock) {
  installPickupMock();
  // POD kartı da köprü üzerinden besleniyor (12-FE).
  installNotificationMock();
}
const shipmentName = new URLSearchParams(window.location.search).get("name") ?? "";

const root = mountDashboardShell({
  breadcrumb: [
    { label: t("header.myAccount"), href: "/pages/dashboard/buyer-dashboard.html" },
    { label: t("dashboard.myOrders"), href: "/pages/dashboard/orders.html" },
    { label: t("shipment.page.tracking") },
  ],
  contentId: "shipment-tracking-root",
  heading: t("shipment.page.tracking"),
  initialContent: shellCard(
    `<p class="text-sm text-gray-500">${escapeHtml(t("shipment.page.loading"))}</p>`
  ),
});

const DELIVERED = "Delivered";


/**
 * Randevu formunun `min` değeri.
 *
 * Bileşen `new Date()` çağırmıyor ki Storybook her gün aynı ekranı göstersin;
 * "bugün"ü veren taraf sayfa. Eskiden burada `"2026-08-13"` sabiti yazıyordu
 * ve zamanla geçmiş bir tarihe dönüşmüştü.
 */
function bugununTarihi(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * Ekranın okuduğu teslim alma alanları.
 *
 * Gerçek modda **sözleşmeden üretilmiş** tipten (`types/logistics.d.ts`)
 * geliyor; `shipmentService.ts`'in kendi dar arayüzü bu alanları taşımıyor ve
 * oraya elle eklemek ikinci bir kaynak yaratırdı. Alanlar 07-BE'de gelene
 * kadar `undefined` — o zaman bloklar hiç çizilmiyor, doğru davranış bu.
 *
 * Örnek veri modunda mock'un tek doğruluk kaynağından okunuyor.
 */
function teslimAlmaAlanlari(
  shipment: ShipmentDetail
): Partial<PickupState> & { shipment_type?: string } {
  if (mock) return readState();
  const s = shipment as unknown as Partial<SozlesmeShipmentDetail>;
  return {
    shipment_type: s.shipment_type,
    status: shipment.status,
    pickup_location: s.pickup_location ?? null,
    appointment_at: s.appointment_at ?? null,
    appointment_window: s.appointment_window ?? null,
    delivery_code_required: (s.delivery_code_required ?? 0) as 0 | 1,
    delivery_code_status:
      (s.delivery_code_status as PickupState["delivery_code_status"]) ?? "not_required",
    delivery_code_attempts: s.delivery_code_attempts ?? 0,
    // B1/B2 — sözleşmede yok; gelmedikleri sürece süre bölümleri çizilmiyor.
    delivery_code_expires_at: null,
    max_delivery_attempts: undefined,
    payment_required_before_delivery: (s.payment_required_before_delivery ?? 0) as 0 | 1,
    payment_status: (s.payment_status as PickupState["payment_status"]) ?? "paid",
  };
}

interface EkVeri {
  /** `null` = kanıt yok (uç `null` döndürdü). `undefined` = hiç sorulmadı. */
  pod?: ProofOfDeliveryRow | null;
  /** Siparişin diğer sevkiyatları — gerçek uçtan da gelebiliyor (S1). */
  kardesler?: { name: string; status: string }[];
}

function render(shipment: ShipmentDetail, ek: EkVeri = {}): void {
  const isDelivered = shipment.status === DELIVERED;
  const blocks: string[] = [];

  if (mock) blocks.push(mockBannerHtml());

  const pickup = teslimAlmaAlanlari(shipment);
  const teslimAlmaKanali = TESLIM_ALMA_TIPLERI.includes(pickup.shipment_type ?? "");

  /**
   * Uçlar bağlı mı?
   *
   * Örnek veri modunda mock köprüsü sağlıyor. Gerçek modda ancak `MOCK`
   * bayrağı kapalıysa — yani 07-BE ucu yazıp bayrağı `false` yaptıysa — bağlı.
   * Bağlı değilken bileşenler form yerine "henüz bağlı değil" çiziyor;
   * eskiden ölü bir "Teslim aldım" düğmesi ve yanlış bir "uygun randevu
   * kalmadı" cümlesi çıkıyordu.
   */
  const randevuBagli = mock || !PICKUP_MOCK.appointment;
  const onayBagli = mock || !PICKUP_MOCK.confirm;

  /**
   * İş kapandı mı?
   *
   * `Buyer Pickup` akışı `Delivered`'a hiç geçmiyor (sözleşme §1.3 · B3),
   * o yüzden tek güvenilir işaret kodun doğrulanmış olması.
   */
  const teslimAlindi =
    pickup.delivery_code_status === "verified" ||
    (pickup.status ?? shipment.status) === DELIVERED;

  // Sıfırlama şeridi yalnız teslim alma akışında — mock'un kalıcı durumu
  // (randevu, deneme sayacı) yalnız burada üretiliyor. Kargo sevkiyatında
  // göstermek, sıfırlanacak bir şey yokken düğme çizmek olurdu.
  if (mock && teslimAlmaKanali) blocks.push(shellCard(pickupMockBarHtml()));

  /**
   * ── S1 · Siparişin sevkiyatları ── (yalnız örnek veri modunda)
   *
   * Bu ekranın asıl yeri sipariş DETAY sayfası — ama öyle bir sayfa henüz
   * yok (`pages/order/` altında yalnız checkout ve ödeme sonucu var).
   * Sipariş detayı açılınca buradan oraya taşınacak; şimdilik alıcının
   * "siparişimin ne kadarı yolda" sorusunu sorduğu tek yer burası.
   */
  const kardesler = mock ? mockShipmentList() : (ek.kardesler ?? []);
  if (kardesler.length) {
    blocks.push(
      shellCard(
        ShipmentGroupList({
          orderName: mock
            ? mockShipmentDetail().order
            : ((shipment as unknown as { order?: string }).order ?? ""),
          shipments: kardesler as never,
        })
      )
    );
  }

  // ── S5 · Takip çizelgesi ──
  blocks.push(
    shellCard(
      mock
        ? TrackingTimeline({
            shipmentName: shipment.name,
            trackingNumber: shipment.tracking_number,
            carrier: shipment.carrier,
            events: mockTrackingEvents(),
          })
        : `
          <h2 class="mb-3 text-base font-semibold text-gray-900">
            ${escapeHtml(t("shipment.page.trackingTitle"))}
          </h2>
          ${NotWiredNotice({
            title: t("shipment.page.timelineNotWired"),
            endpoint: "api.v1.logistics.list_shipment_events",
          })}`
    )
  );

  // ── S10 · teslim özeti  /  S4 · teslim onayı ──
  if (isDelivered) {
    /**
     * ── S10 · Teslim kanıtı ── (12-FE, 2026-08-28)
     *
     * 14-FE karar defteri K-E burada sahte POD gösterimini kaldırmıştı; yerini
     * `ProofOfDelivery` bileşeni aldı. Üç hâl AYRI ekran:
     *   · `pod === null`     → "kanıt yok" (uç `null` döndü, hata değil)
     *   · medya alanı yok    → görme yetkisi yok
     *   · `undefined`        → uç hiç bağlı değil (14-BE)
     */
    blocks.push(
      shellCard(
        ek.pod === undefined
          ? NotWiredNotice({
              title: t("shipment.page.proofNotWired"),
              endpoint: "api.v1.logistics.get_proof_of_delivery",
            })
          : ProofOfDelivery({ pod: ek.pod })
      )
    );
  } else if (teslimAlmaKanali) {
    /**
     * ── S3 · Randevu talebi ──
     *
     * Yalnız teslim alma / satıcı teslimatı kanallarında; kargo sevkiyatında
     * randevu diye bir şey yok (K-D). Eskiden bu blok `mock` bayrağına
     * bakıyordu ve saat aralıkları, adres, "bugün" değeri sayfaya elle
     * yazılmıştı — yani örnek veri modundaki HER sevkiyatta aynı randevu
     * görünüyordu. Şimdi tek doğruluk kaynağından geliyor.
     */
    /**
     * İş bittiyse randevu bloğu ÇİZİLMİYOR.
     *
     * Teslim alınmış bir sevkiyatın randevusu değiştirilemez; "Randevuyu
     * değiştir" düğmesi tıklanabilir duruyordu ve tıklayınca geçmiş bir işi
     * düzenlemeye çalışıyordu (2026-08-26 kapanış denetimi).
     */
    if (!teslimAlindi) {
      blocks.push(
        shellCard(
          PickupAppointment({
          shipmentName: shipment.name,
          appointmentAt: pickup.appointment_at ?? null,
          appointmentWindow: pickup.appointment_window ?? null,
          pickupLocation: pickup.pickup_location ?? null,
          slots: mock ? listAppointmentSlots(bugununTarihi()) : [],
          today: bugununTarihi(),
            wired: randevuBagli,
          })
        )
      );
    }

    // ── S4 · Teslim onayı ──
    blocks.push(
      shellCard(
        DeliveryConfirm({
          shipmentName: shipment.name,
          status: pickup.status ?? shipment.status,
          deliveryCodeStatus: pickup.delivery_code_status ?? "not_required",
          deliveryCodeAttempts: pickup.delivery_code_attempts ?? 0,
          maxAttempts: pickup.max_delivery_attempts,
          expiresAt: pickup.delivery_code_expires_at ?? null,
          paymentRequired: pickup.payment_required_before_delivery === 1,
          paymentStatus: pickup.payment_status ?? "paid",
          appointmentAt: pickup.appointment_at ?? null,
          pickupLocation: pickup.pickup_location ?? null,
          wired: onayBagli,
        })
      )
    );
  }

  root.innerHTML = blocks.join("");
  startAlpine();
}

function renderError(message: string): void {
  root.innerHTML = shellCard(`
    <p class="text-sm font-medium text-red-700">${escapeHtml(message)}</p>
    <a href="/pages/dashboard/orders.html" class="th-btn-outline th-no-press th-btn-sm mt-3 inline-flex">
      ${escapeHtml(t("shipment.page.backToOrders"))}
    </a>
  `);
}

/**
 * POD ve kardeş sevkiyatlar — ikisi de ekranı ENGELLEMEZ.
 *
 * Sevkiyat detayı geldiyse sayfa çizilir; bu iki blok gelirse eklenir,
 * gelmezse kendi "bağlı değil" / boş hâlini gösterir. Tek bir `await`
 * zincirinde toplamak, POD ucu düştüğünde takip çizelgesini de karartırdı.
 */
async function ekVeriTopla(shipment: ShipmentDetail): Promise<EkVeri> {
  const ek: EkVeri = {};

  // Teslim kanıtı yalnız teslim edilmiş sevkiyatta sorulur.
  if (shipment.status === DELIVERED) {
    try {
      ek.pod = await getProofOfDelivery(shipment.name);
    } catch {
      // Uç bağlı değil → `undefined` kalır → ekran "bağlı değil" çizer.
      // `null` ile karıştırılmamalı: `null` "kanıt yok" demek.
    }
  }

  // S1 gerçek modda da çizilebiliyor: `list_shipments` var olan bir uç.
  if (!mock) {
    const order = (shipment as unknown as { order?: string }).order;
    if (order) {
      try {
        const { items } = await listShipments({ order });
        ek.kardesler = items as unknown as EkVeri["kardesler"];
      } catch {
        // Liste alınamazsa blok hiç çizilmiyor — boş bir kart göstermek,
        // "siparişinizin başka sevkiyatı yok" demek olurdu ki bilmiyoruz.
      }
    }
  }

  return ek;
}

async function ac(shipment: ShipmentDetail): Promise<void> {
  render(shipment, await ekVeriTopla(shipment));
}

/**
 * Örnek veri modunda istenen sevkiyatı bulur.
 *
 * Eskiden mock modda `?name=` YOK SAYILIYORDU: hangi sevkiyata tıklanırsa
 * tıklansın aynı kayıt (`SHP-2026-00042`, "Yolda") açılıyordu. Yani S1'deki
 * "Takip et" bağlantıları ölü bağlantıydı ve teslim edilmiş bir sevkiyatın
 * kanıtı hiç görülemiyordu.
 *
 * Liste satırı detay kadar zengin değil (alt tablolar yok); detayın ÜZERİNE
 * yazılıyor ki ekran eksik alanla patlamasın.
 */
function mockSevkiyat(name: string): ShipmentDetail {
  const detay = mockShipmentDetail();
  if (!name || name === detay.name) return detay as unknown as ShipmentDetail;

  const satir = mockShipmentList().find((s) => s.name === name);
  return (satir ? { ...detay, ...satir } : detay) as unknown as ShipmentDetail;
}

if (mock) {
  // Mock modda sevkiyat adı şart değil — adsız giriş örnek kayda düşer.
  await ac(mockSevkiyat(shipmentName));
} else if (!shipmentName) {
  renderError(t("shipment.page.missingName"));
} else {
  try {
    await ac(await getShipment(shipmentName));
  } catch (e) {
    // Mock modda gerçek uç hata verirse örnek kayda düş — inceleme durmasın.
    if (mock) await ac(mockSevkiyat(shipmentName));
    else renderError((e as Error)?.message || t("shipment.page.loadFailed"));
  }
}
