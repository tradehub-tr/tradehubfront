/**
 * **S12-alıcı · İade takibi** (TUR-116) — 15-FE'de sıfırdan yazıldı.
 *
 * NEDEN YENİ EKRAN: alıcının kendi talebini izleyebileceği hiçbir yer yoktu.
 * `buyer-returns.ts` SATICI bileşenini (`SellerReturnQueue`) çiziyordu; alıcı
 * satıcı başlığını, "Karara bağla" düğmelerini ve BAŞKA alıcıların kayıtlarını
 * görüyordu (analiz §3.3). Fixture'ın `detail` bloğunu — karar gerekçesi,
 * iade etiketi, kontrol sonucu, tutar — hiçbir ekran çizmiyordu.
 *
 * SATICI BİLEŞENİNDEN FARKI: burada karar YOK, bekleme süresi YOK, başkasının
 * kaydı YOK. Alıcının sorusu "talebim ne durumda ve benim ne yapmam gerekiyor"
 * — kuyruk yönetmek değil.
 */
import { t } from "../../i18n";
import { escapeHtml } from "../../utils/sanitize";

import { emptyState, formatDateTime, money, returnStatusBadge } from "./presentation";

interface TakipKalemi {
  item_name: string;
  requested_qty: number;
  received_qty?: number | null;
  accepted_qty?: number | null;
  uom?: string;
}

export interface BuyerReturnTrackingProps {
  name: string;
  order: string;
  shipment?: string | null;
  status: string;
  reason: string;
  requested_at: string;
  decided_at?: string | null;
  decision_note?: string | null;
  return_shipment?: string | null;
  return_label_url?: string | null;
  refund_amount?: number | null;
  refund_triggered_at?: string | null;
  closed_at?: string | null;
  is_closed?: number | null;
  items?: TakipKalemi[];
}

/**
 * Durum → zaman çizgisindeki adım sırası.
 *
 * Reddedilen iade çizgiyi ERKEN bitiriyor: "depoda kontrol" adımı hiç
 * gelmeyecek ve onu soluk göstermek alıcıya boşuna bekleme hissi verirdi.
 */
const ADIM_SIRASI: Record<string, number> = {
  requested: 0,
  rejected: 1,
  approved: 1,
  in_transit: 2,
  inspecting: 3,
  closed: 4,
};

function adimlar(props: BuyerReturnTrackingProps): string {
  const suanki = ADIM_SIRASI[props.status] ?? 0;
  const reddedildi = props.status === "rejected";

  const tanimlar: { key: string; baslik: string; alt: string }[] = [
    {
      key: "requested",
      baslik: t("shipment.returnTrack.stepRequested"),
      alt: `${formatDateTime(props.requested_at)} · ${t(`shipment.returnReason.${props.reason}`, {
        defaultValue: props.reason,
      })}`,
    },
    {
      key: "decided",
      baslik: reddedildi
        ? t("shipment.returnTrack.stepRejected")
        : t("shipment.returnTrack.stepApproved"),
      alt: props.decided_at
        ? [formatDateTime(props.decided_at), props.decision_note].filter(Boolean).join(" · ")
        : t("shipment.returnTrack.stepAwaitingDecision"),
    },
  ];

  // Red kararından sonra iade kargosu, kontrol ve para iadesi HİÇ olmuyor.
  if (!reddedildi) {
    tanimlar.push(
      {
        key: "transit",
        baslik: t("shipment.returnTrack.stepInTransit"),
        alt: props.return_shipment ?? t("shipment.returnTrack.stepInTransitHint"),
      },
      {
        key: "inspecting",
        baslik: t("shipment.returnTrack.stepInspecting"),
        alt: t("shipment.returnTrack.stepInspectingHint"),
      },
      {
        key: "closed",
        baslik: t("shipment.returnTrack.stepClosed"),
        alt: props.refund_triggered_at
          ? t("shipment.returnTrack.refundSent", {
              at: formatDateTime(props.refund_triggered_at),
            })
          : t("shipment.returnTrack.stepClosedHint"),
      }
    );
  }

  return tanimlar
    .map((adim, i) => {
      const gecti = i < suanki;
      const aktif = i === suanki;
      const nokta = gecti
        ? "bg-gray-500"
        : aktif
          ? "bg-amber-500 ring-4 ring-amber-100"
          : "bg-gray-200";
      return `
        <li class="relative ps-6 pb-4 last:pb-0">
          <!-- Bağlayıcı çizgi: adımlar arası. Son adımda çizilmiyor, yoksa
               çizgi boşluğa doğru uzayıp "devamı var" izlenimi bırakıyor. -->
          <span class="absolute start-[4px] top-4 h-[calc(100%-0.5rem)] w-px bg-gray-200 last:hidden"
                aria-hidden="true"></span>
          <span class="absolute start-0 top-1.5 h-2.5 w-2.5 rounded-full ${nokta}"
                aria-hidden="true"></span>
          <p class="text-sm ${gecti || aktif ? "font-medium text-gray-900" : "text-gray-400"}">
            ${escapeHtml(adim.baslik)}
          </p>
          <p class="mt-0.5 text-xs text-gray-500">${escapeHtml(adim.alt)}</p>
        </li>`;
    })
    .join("");
}

/**
 * İstenen → ulaşan → kabul edilen. Aradaki her düşüş tutarı açıklıyor.
 *
 * 🔴 DEPO KONTROLÜ BAŞLAMADAN "ulaşan/kabul edilen" gösterilmiyor.
 *
 * Kırma turunda ölçüldü (31 Ağu): önce red senaryosunda, sonra "kargo yolda"
 * senaryosunda ekran *"6 ulaştı · 4 kabul"* yazıyordu — biri reddedilmiş,
 * diğeri henüz yola çıkmış bir iadeydi; hiçbir koli depoya ulaşmamıştı.
 * Sayılar kaydın kontrol alanlarından geliyordu ve alıcıya, olmamış bir depo
 * kontrolünü olmuş gibi anlatıyordu.
 *
 * İlk düzeltme yalnız `rejected`'ı kapatıyordu; ikinci görüntü aynı kusurun
 * KONTROL ÖNCESİ HER durumda olduğunu gösterdi. Kapı artık duruma bağlı.
 *
 * Kapı BURADA, veride değil: gerçek uç da bu alanları erken doldurmamalı ama
 * ekran ona güvenmemeli.
 */
/** `received/accepted` yalnız bu durumlarda anlamlı — öncesinde koli depoda değil. */
const KONTROL_GORULEN = ["inspecting", "closed"];

function kalemler(props: BuyerReturnTrackingProps): string {
  const rows = props.items ?? [];
  if (!rows.length) return "";

  const kontrolBasladi = KONTROL_GORULEN.includes(props.status);

  const satirlar = rows
    .map(
      (row) => `
      <li class="flex flex-wrap items-center gap-2 border-b border-gray-100 py-1.5 last:border-0">
        <span class="flex-1 text-sm text-gray-800">${escapeHtml(row.item_name)}</span>
        <span class="text-xs tabular-nums text-gray-500">
          ${escapeHtml(
            !kontrolBasladi
              ? t("shipment.returnTrack.qtyRequestedOnly", {
                  requested: row.requested_qty,
                  uom: row.uom ?? "",
                })
              : t("shipment.returnTrack.qtyLine", {
                  requested: row.requested_qty,
                  received: row.received_qty ?? "—",
                  accepted: row.accepted_qty ?? "—",
                  uom: row.uom ?? "",
                })
          )}
        </span>
      </li>`
    )
    .join("");

  return `
    <section class="rounded-md border border-gray-200 p-4">
      <ul>${satirlar}</ul>
      ${
        props.refund_amount != null
          ? `<div class="mt-2 flex items-center gap-2 border-t border-gray-100 pt-2">
               <span class="flex-1 text-xs text-gray-500">
                 ${escapeHtml(
                   props.is_closed
                     ? t("shipment.returnTrack.refundFinal")
                     : t("shipment.returnTrack.refundExpected")
                 )}
               </span>
               <strong class="tabular-nums text-gray-900">${money(props.refund_amount)}</strong>
             </div>`
          : ""
      }
    </section>`;
}

export function BuyerReturnTracking(props: BuyerReturnTrackingProps): string {
  return `
    <section class="space-y-4">
      <header>
        <div class="flex flex-wrap items-center gap-2">
          <code class="font-mono text-sm font-semibold text-gray-900">${escapeHtml(props.name)}</code>
          ${returnStatusBadge(props.status)}
          <span class="ms-auto text-xs text-gray-500">
            ${escapeHtml(t("shipment.returnTrack.openedAt", { at: formatDateTime(props.requested_at) }))}
          </span>
        </div>
        <p class="mt-1 text-xs text-gray-500">
          ${escapeHtml(props.order)}${props.shipment ? ` · ${escapeHtml(props.shipment)}` : ""}
        </p>
      </header>

      <ol class="relative">${adimlar(props)}</ol>

      ${
        props.return_label_url
          ? `<section class="rounded-md border border-gray-200 bg-gray-50 p-4">
               <div class="flex flex-wrap items-center gap-3">
                 <span class="flex-1 text-sm font-semibold text-gray-800">
                   ${escapeHtml(t("shipment.returnTrack.label"))}
                 </span>
                 <a href="${escapeHtml(props.return_label_url)}" target="_blank" rel="noopener"
                    class="th-btn-outline th-no-press th-btn-sm"
                    data-testid="return-label-link">
                   ${escapeHtml(t("shipment.returnTrack.openLabel"))}
                 </a>
               </div>
               <p class="mt-1.5 text-xs text-gray-500">
                 ${escapeHtml(t("shipment.returnTrack.labelHint"))}
               </p>
             </section>`
          : ""
      }

      ${kalemler(props)}
    </section>`;
}

/** Alıcının iade listesi — kendi kayıtları, karar düğmesi YOK. */
export function BuyerReturnList(rows: BuyerReturnTrackingProps[]): string {
  if (!rows.length) {
    return emptyState(
      t("shipment.returnTrack.empty"),
      t("shipment.returnTrack.emptyHint"),
      `<a href="/pages/dashboard/orders.html" class="th-btn-outline th-no-press th-btn-sm mt-3 inline-flex">
         ${escapeHtml(t("shipment.returnTrack.emptyAction"))}
       </a>`
    );
  }

  const kartlar = rows
    .map(
      (row) => `
      <li class="rounded-md border p-4 ${row.is_closed ? "border-gray-200 opacity-70" : "border-gray-200"}">
        <a class="group flex flex-wrap items-center gap-2"
           href="/pages/dashboard/returns.html?name=${encodeURIComponent(row.name)}"
           data-testid="return-row-link">
          <code class="font-mono text-sm font-medium text-gray-800 underline-offset-2 group-hover:underline">
            ${escapeHtml(row.name)}
          </code>
          ${returnStatusBadge(row.status)}
          <span class="text-xs text-gray-500">
            ${escapeHtml(t(`shipment.returnReason.${row.reason}`, { defaultValue: row.reason }))}
          </span>
          <span class="ms-auto text-xs text-gray-500">${formatDateTime(row.requested_at)}</span>
          <!-- Satırın tıklanabilir olduğunu söyleyen tek işaret. Görsel turda
               ölçüldü: kart hiçbir affordance taşımıyordu, kullanıcı detaya
               gidilebildiğini bilemiyordu. Ok yön duyarlı (RTL'de döner). -->
          <svg class="h-3.5 w-3.5 shrink-0 text-gray-400 rtl:rotate-180" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="m9 5 7 7-7 7" />
          </svg>
        </a>
        <p class="mt-1 text-xs text-gray-500">${escapeHtml(row.order)}</p>
      </li>`
    )
    .join("");

  return `<ul class="space-y-2">${kartlar}</ul>`;
}
