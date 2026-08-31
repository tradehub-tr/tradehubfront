/**
 * Lojistik sunum yardımcıları — storefront tarafı.
 *
 * admin-panel'deki `components/logistics/constants.js` ile AYNI ton dilini
 * kullanıyor: aynı durum aynı renkte görünsün. Ama küme daha dar — alıcı ve
 * satıcı platform içi durumları (entegrasyon, fiyat kuralı) hiç görmüyor.
 *
 * Durum listesi ve sırası backend sözleşmesinden gelir
 * (`tradehub_core/logistics/constants.py` → ShipmentStatus). Burada YALNIZ
 * görsel karşılıkları var — durum eklemek/çıkarmak bu dosyanın işi değil.
 */
import { getCurrentLang, t } from "../../i18n";
import { escapeHtml } from "../../utils/sanitize";

export type Tone = "neutral" | "info" | "progress" | "success" | "warning" | "danger";

/** Sevkiyat durumu → ton. */
export const SHIPMENT_STATUS_TONE: Record<string, Tone> = {
  Draft: "neutral",
  Pending: "info",
  "Ready for Pickup": "info",
  "Picked Up": "progress",
  "In Transit": "progress",
  "At Warehouse": "progress",
  "Out for Delivery": "progress",
  Delivered: "success",
  Returned: "warning",
  Cancelled: "neutral",
  Failed: "danger",
};

/** İade talebi durumu → ton. */
export const RETURN_STATUS_TONE: Record<string, Tone> = {
  requested: "warning",
  approved: "info",
  rejected: "neutral",
  in_transit: "progress",
  inspecting: "progress",
  closed: "success",
};

/** Ton → Tailwind sınıfları. Tek yerde ki rozet ve satır aynı dili konuşsun. */
const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-gray-100 text-gray-700",
  info: "bg-sky-100 text-sky-800",
  progress: "bg-indigo-100 text-indigo-800",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-800",
};

/** Terminal durumlar — ileri geçiş yok (constants.py TERMINAL_STATUSES). */
export const TERMINAL_STATUSES = ["Delivered", "Returned", "Cancelled"];

/**
 * Durum rozeti.
 *
 * Metin `escapeHtml`'den geçiyor: durum değeri sözleşmeden gelse de bu
 * fonksiyon iade nedeni gibi serbest metinlerle de çağrılabiliyor.
 */
export function statusBadge(status: string, tone?: Tone, label?: string): string {
  const resolved = tone ?? SHIPMENT_STATUS_TONE[status] ?? "neutral";
  const text = label ?? t(`shipment.status.${status}`, { defaultValue: status });
  return `<span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${TONE_CLASSES[resolved]}">${escapeHtml(text)}</span>`;
}

/** İade durumu rozeti — ayrı sözlük, ayrı ton haritası. */
export function returnStatusBadge(status: string): string {
  return statusBadge(
    status,
    RETURN_STATUS_TONE[status] ?? "neutral",
    t(`shipment.returnStatus.${status}`, { defaultValue: status })
  );
}

/**
 * Biçimlendirme yereli — ARAYÜZ dilinden, tarayıcı dilinden DEĞİL.
 *
 * 🔴 Ölçüldü (15-FE görsel turu, 31 Ağu): `toLocaleString(undefined, …)`
 * tarayıcının dilini kullanıyordu. Arayüzü Türkçe seçmiş ama tarayıcısı
 * İngilizce olan bir alıcı, Türkçe ekranda **"Aug 09, 2026, 10:00 AM"** ve
 * **"TRY 2,480.00"** görüyordu. Kusur tüm lojistik yüzeyini etkiliyordu
 * (07/12/13/14-FE ekranları dahil) ve hiçbir test yakalamamıştı — hepsi
 * "değer basıldı mı" diye bakıyordu, "hangi dilde" diye değil.
 *
 * Sabit bir biçim yazmak da yanlış olurdu: storefront dört dil destekliyor
 * ve tarih düzeni dile göre gerçekten değişiyor. Doğrusu yereli ARAYÜZ
 * dilinden almak.
 */
function bicimYereli(): string {
  return getCurrentLang();
}

/** Tarih/saat — biçim arayüz diline göre (bkz. `bicimYereli`). */
export function formatDateTime(value: unknown, withTime = true): string {
  if (!value) return "—";
  const parsed = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return escapeHtml(value);
  return parsed.toLocaleString(bicimYereli(), {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

/** Para birimi — değer yoksa "—", sıfır DEĞİL. */
export function money(value: unknown, currency = "TRY"): string {
  if (value === null || value === undefined) return "—";
  return Number(value).toLocaleString(bicimYereli(), { style: "currency", currency });
}

/** Boş durum kutusu — dört ekranda tekrar ediyor. */
/**
 * @param actionHtml Sonraki adıma götüren düğme — **çağıranın ürettiği**
 *   güvenilir işaretleme, kullanıcı içeriği DEĞİL (bu yüzden kaçırılmıyor).
 *   Boş durum yalnız "kayıt yok" demekle kalmayıp ne yapılacağını da
 *   söylemeli (`GOREV-TAMAMLAMA-SOZLESMESI` §2).
 */
export function emptyState(message: string, hint?: string, actionHtml?: string): string {
  return `
    <div class="rounded-md border border-dashed border-gray-300 py-10 text-center">
      <p class="text-sm font-medium text-gray-700">${escapeHtml(message)}</p>
      ${hint ? `<p class="mt-1 text-xs text-gray-500">${escapeHtml(hint)}</p>` : ""}
      ${actionHtml ?? ""}
    </div>`;
}
