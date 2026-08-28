/**
 * **S10 · Teslim kanıtı — ALICI görünümü** (TUR-115, 12-FE).
 *
 * Alıcı burada yalnız **görür**; kanıt kaydetme satıcı/operatör tarafıdır ve
 * 14-FE'nin işidir. Bu ayrım bileşenin sınırı: hiçbir düzenleme eylemi yok.
 *
 * ── NEDEN SIFIRDAN YAZILDI ──
 *
 * Burada eskiden örnek veri modunda **sahte** bir teslim kanıtı çiziliyordu:
 * imza, fotoğraf, teslim alan kişi. `Proof of Delivery` DocType'ı yoktu ve
 * gerçek modda blok boş geliyordu — yani alıcı, var olmayan bir kaydın
 * ayrıntısını görüyordu. 14-FE karar defteri (K-E) o gösterimi kaldırdı;
 * yerine bu bileşen geldi.
 *
 * ── ÜÇ HÂL, ÜÇ AYRI ANLAM ──
 *
 * `pod === null`   → "kanıt yok". **Hata değil, eksik veri** (sözleşme §2.5).
 *                    Uç `404` değil `null` döndürüyor; ekran hata kutusu
 *                    göstermez, bilgi verir.
 * medya alanı yok  → görme yetkisi yok. Alanlar yanıttan **çıkarılmış**
 *                    (`null` atanmamış) — `null` gelseydi "kanıt yok" ile
 *                    "yetkin yok" aynı ekrana düşerdi.
 * `has_discrepancy`→ eksik teslim. Uyarı kartın EN ÜSTÜNDE: alıcının ilk
 *                    görmesi gereken bilgi teslim saati değil, eksik koliler.
 *
 * Alıcıya **gösterilmeyen** alanlar (K-E): `source`, `recorded_by` — iç
 * operasyon damgaları. Sunucu döndürse bile bu bileşen basmaz.
 */
import { t } from "../../i18n";
import { escapeHtml } from "../../utils/sanitize";

import { formatDateTime } from "./presentation";

export interface ProofOfDeliveryRow {
  delivered_at?: string | null;
  received_by?: string | null;
  received_by_title?: string | null;
  delivery_code_used?: number | null;
  signature_url?: string | null;
  photo_url?: string | null;
  document_url?: string | null;
  delivered_package_count?: number | null;
  total_package_count?: number | null;
  has_discrepancy?: number | null;
  exception_code?: string | null;
  discrepancy_note?: string | null;
  waybill_number?: string | null;
  delivery_point?: string | null;
}

function satir(etiket: string, deger: string, mono = false): string {
  return `
    <div>
      <dt class="text-xs text-gray-500">${escapeHtml(etiket)}</dt>
      <dd class="text-sm ${mono ? "font-mono" : "font-medium"} text-gray-900">${escapeHtml(deger)}</dd>
    </div>`;
}

/** Teslim alan kişi + varsa unvanı — tek satırda okunur. */
function teslimAlan(pod: ProofOfDeliveryRow): string {
  const ad = pod.received_by?.trim();
  if (!ad) return "";
  const unvan = pod.received_by_title?.trim();
  return `
    <div>
      <dt class="text-xs text-gray-500">${escapeHtml(t("shipment.pod.receivedBy"))}</dt>
      <dd class="text-sm font-medium text-gray-900">
        ${escapeHtml(ad)}${unvan ? ` <span class="font-normal text-gray-600">· ${escapeHtml(unvan)}</span>` : ""}
      </dd>
    </div>`;
}

export function ProofOfDelivery(props: { pod: ProofOfDeliveryRow | null }): string {
  const { pod } = props;
  const baslik = `<h2 class="text-base font-semibold text-gray-900">${escapeHtml(t("shipment.pod.title"))}</h2>`;

  // ── Kanıt yok: hata DEĞİL ──
  if (!pod) {
    return `
      <section class="space-y-3" data-testid="pod-card" data-state="empty">
        ${baslik}
        <div class="rounded-md border border-gray-200 bg-gray-50 p-4">
          <p class="text-sm font-medium text-gray-800">${escapeHtml(t("shipment.pod.none"))}</p>
          <p class="mt-1 text-xs text-gray-600">${escapeHtml(t("shipment.pod.noneHint"))}</p>
        </div>
      </section>`;
  }

  const eksik = Number(pod.has_discrepancy) === 1;
  const teslimEdilen = pod.delivered_package_count;
  const toplam = pod.total_package_count;

  // Medya alanları YANITTA YOKSA hiç çizilmiyor — kırık görsel gösterilmez.
  const medya = [
    pod.signature_url
      ? `<figure class="rounded-md border border-gray-200 p-2">
           <img src="${escapeHtml(pod.signature_url)}" alt="${escapeHtml(t("shipment.pod.signature"))}"
                class="h-[70px] w-auto max-w-full" loading="lazy" />
           <figcaption class="mt-1 text-center text-xs text-gray-500">${escapeHtml(t("shipment.pod.signature"))}</figcaption>
         </figure>`
      : "",
    pod.photo_url
      ? `<figure class="rounded-md border border-gray-200 p-2">
           <img src="${escapeHtml(pod.photo_url)}" alt="${escapeHtml(t("shipment.pod.photo"))}"
                class="h-[70px] w-auto max-w-full" loading="lazy" />
           <figcaption class="mt-1 text-center text-xs text-gray-500">${escapeHtml(t("shipment.pod.photo"))}</figcaption>
         </figure>`
      : "",
  ]
    .filter(Boolean)
    .join("");

  const medyaVar = Boolean(pod.signature_url || pod.photo_url || pod.document_url);

  return `
    <section class="space-y-4" data-testid="pod-card" data-state="${eksik ? "discrepancy" : "ok"}">
      ${baslik}

      ${
        eksik
          ? `<div class="rounded-md border border-amber-300 bg-amber-50 p-3" role="alert"
                  data-testid="pod-discrepancy">
               <p class="text-sm font-medium text-amber-900">
                 ${escapeHtml(
                   t("shipment.pod.discrepancy", {
                     delivered: teslimEdilen ?? 0,
                     total: toplam ?? 0,
                     missing: Math.max(0, (toplam ?? 0) - (teslimEdilen ?? 0)),
                   })
                 )}
               </p>
               ${
                 pod.exception_code || pod.discrepancy_note
                   ? `<p class="mt-1 text-xs text-amber-800">
                        ${
                          pod.exception_code
                            ? `${escapeHtml(t("shipment.pod.reason"))}: <b>${escapeHtml(
                                t(`shipment.exception.${pod.exception_code}`, {
                                  defaultValue: pod.exception_code,
                                })
                              )}</b>`
                            : ""
                        }
                        ${pod.discrepancy_note ? ` · ${escapeHtml(pod.discrepancy_note)}` : ""}
                      </p>`
                   : ""
               }
             </div>`
          : ""
      }

      <dl class="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        ${teslimAlan(pod)}
        ${pod.delivered_at ? satir(t("shipment.pod.deliveredAt"), formatDateTime(pod.delivered_at)) : ""}
        ${
          typeof toplam === "number" && typeof teslimEdilen === "number"
            ? satir(
                t("shipment.pod.packages"),
                t("shipment.pod.packageCount", { delivered: teslimEdilen, total: toplam })
              )
            : ""
        }
        ${pod.waybill_number ? satir(t("shipment.pod.waybill"), pod.waybill_number, true) : ""}
        ${pod.delivery_point ? satir(t("shipment.pod.deliveryPoint"), pod.delivery_point, true) : ""}
        ${
          Number(pod.delivery_code_used) === 1
            ? `<div>
                 <dt class="text-xs text-gray-500">${escapeHtml(t("shipment.pod.code"))}</dt>
                 <dd class="text-sm font-medium text-emerald-700">${escapeHtml(t("shipment.pod.codeVerified"))}</dd>
               </div>`
            : ""
        }
      </dl>

      ${medya ? `<div class="flex flex-wrap gap-3">${medya}</div>` : ""}

      ${
        pod.document_url
          ? `<a href="${escapeHtml(pod.document_url)}" target="_blank" rel="noopener"
                class="th-btn-outline th-no-press th-btn-sm inline-flex" data-testid="pod-document">
               ${escapeHtml(t("shipment.pod.openDocument"))}
             </a>`
          : ""
      }

      ${
        medyaVar
          ? ""
          : `<p class="text-xs text-gray-500" data-testid="pod-media-hidden">
               ${escapeHtml(t("shipment.pod.mediaHidden"))}
             </p>`
      }
    </section>`;
}
