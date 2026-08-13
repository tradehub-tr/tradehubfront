/**
 * Sevkiyat servisi — storefront tarafı.
 *
 * BU DOSYANIN EN ÖNEMLİ İŞİ: hangi verinin GERÇEKTEN gelebildiğini, hangisinin
 * daha yazılmamış bir ucu beklediğini tek yerde tutmak.
 *
 * Ölçüldü (2026-08-13, `tradehub_core/api/v1/`):
 *
 *   VAR   shipment.list_shipments        → sevkiyat listesi
 *   VAR   shipment.get_shipment_detail   → sevkiyat + items/packages/documents
 *   VAR   shipment.update_shipment_status
 *   VAR   shipment.cancel_shipment
 *   VAR   logistics.track_shipment_public → takip no ile genel sorgu
 *
 *   YOK   teslim kanıtı           (Proof of Delivery DocType'ı bile yok)
 *   YOK   iade talepleri          (Return Request DocType'ı yok)
 *   YOK   bildirim tercihleri     (uç yok)
 *   YOK   koli kaydetme / etiket  (uç yok)
 *   YOK   randevu talebi          (uç yok)
 *
 * Olmayan uçlar için `NotWiredError` fırlatılıyor. Sayfa bunu yakalayıp
 * "bu bölüm henüz bağlı değil" diyor. Sessizce boş dizi döndürmek YANLIŞ
 * olurdu: alıcı "iade talebim yok" sanır, oysa sistem hiç bakmadı.
 */
import { callMethod } from "../utils/api";

/** Ucu henüz yazılmamış bir işlem çağrıldı. */
export class NotWiredError extends Error {
  /** Beklenen ucun adı — hata mesajında değil, kayıtta işe yarıyor. */
  readonly endpoint: string;

  constructor(endpoint: string) {
    super("Bu bölüm henüz sunucuya bağlı değil.");
    this.name = "NotWiredError";
    this.endpoint = endpoint;
  }
}

/** Backend zarfını açar: `{ok:true,data}` → `data`, `{ok:false,error}` → throw. */
function unwrap<T>(response: unknown): T {
  const envelope = response as { ok?: boolean; data?: T; error?: { message?: string } };
  if (envelope?.ok === false) {
    throw new Error(envelope.error?.message || "İstek başarısız oldu.");
  }
  return (envelope?.data ?? response) as T;
}

export interface ShipmentSummary {
  name: string;
  order: string;
  status: string;
  carrier?: string | null;
  tracking_number?: string | null;
  package_count?: number | null;
  ship_date?: string | null;
  estimated_delivery?: string | null;
  actual_delivery?: string | null;
}

export interface ShipmentDetail extends ShipmentSummary {
  items?: Record<string, unknown>[];
  packages?: Record<string, unknown>[];
  documents?: Record<string, unknown>[];
  address_snapshots?: Record<string, unknown>[];
}

/**
 * Siparişin sevkiyatları.
 *
 * Tenant izolasyonu backend'de (`shipment_query_conditions`) — alıcı yalnız
 * kendi siparişlerinin sevkiyatını görüyor. Burada filtre YOK; olsaydı
 * yanlış bir güvenlik hissi verirdi.
 */
export async function listShipments(params: { order?: string; status?: string } = {}) {
  const data = unwrap<{ shipments?: ShipmentSummary[]; total?: number }>(
    await callMethod("tradehub_core.api.v1.shipment.list_shipments", {
      ...(params.order ? { order: params.order } : {}),
      ...(params.status ? { status: params.status } : {}),
      limit_page_length: 50,
    })
  );
  // Uç `shipments` diyor, ekranlar `items` bekliyor — köprü burada, tek satır.
  return { items: data?.shipments ?? [], total: data?.total ?? 0 };
}

export async function getShipment(name: string): Promise<ShipmentDetail> {
  return unwrap<ShipmentDetail>(
    await callMethod("tradehub_core.api.v1.shipment.get_shipment_detail", { name })
  );
}

/** Takip no ile genel sorgu — giriş gerektirmiyor (`logistics.track_shipment_public`). */
export async function trackByNumber(trackingNumber: string) {
  return unwrap<Record<string, unknown>>(
    await callMethod("tradehub_core.api.v1.logistics.track_shipment_public", {
      tracking_number: trackingNumber,
    })
  );
}

// ── Ucu henüz olmayan işlemler ───────────────────────────────────────────
//
// Bunlar birer yer tutucu DEĞİL: çağrıldıklarında açıkça hata veriyorlar ki
// sayfa "bağlı değil" diyebilsin. Boş veri döndürmek, olmayan bir cevabı
// varmış gibi göstermek olurdu.

export async function getProofOfDelivery(_shipment: string): Promise<never> {
  throw new NotWiredError("api.v1.logistics.get_proof_of_delivery");
}

export async function listReturnRequests(): Promise<never> {
  throw new NotWiredError("api.v1.logistics.list_return_requests");
}

export async function createReturnRequest(_payload: Record<string, unknown>): Promise<never> {
  throw new NotWiredError("api.v1.logistics.create_return_request");
}

export async function decideReturnRequest(_payload: Record<string, unknown>): Promise<never> {
  throw new NotWiredError("api.v1.logistics.decide_return_request");
}

export async function listNotificationPreferences(): Promise<never> {
  throw new NotWiredError("api.v1.logistics.list_notification_preferences");
}

export async function setNotificationPreference(_payload: {
  template: string;
  enabled: boolean;
}): Promise<never> {
  throw new NotWiredError("api.v1.logistics.set_notification_preference");
}

export async function saveShipmentPackage(_payload: Record<string, unknown>): Promise<never> {
  throw new NotWiredError("api.v1.logistics.save_shipment_packages");
}

export async function requestPickupAppointment(_payload: Record<string, unknown>): Promise<never> {
  throw new NotWiredError("api.v1.logistics.request_pickup_appointment");
}
