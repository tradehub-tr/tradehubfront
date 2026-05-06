/**
 * KYB Status Widget — Buyer Dashboard'a gömülü kart.
 * Sadece satıcı kullanıcılar (veya pending application) için render edilir.
 * Verified durumunda küçük badge yeterli; aksiyon gerektiren state'lerde
 * vurgulu kart + CTA.
 */

import { t } from "../../i18n";
import type { AuthUser } from "../../utils/auth";

interface KybStatusInfo {
  status?: string;
  rejection_reason?: string | null;
}

const ICONS = {
  shield: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l9 4v6c0 5-3.5 9-9 10C6.5 21 3 17 3 12V6l9-4z"/><polyline points="9 12 11 14 15 10"/></svg>`,
  alert: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  arrow: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`,
};

const KYB_HREF = "/pages/dashboard/kyb.html";

/**
 * Render conditions:
 * - Sadece is_seller || has_pending_seller_application olanlarda
 * - Verified ise küçük badge (yer kaplamasın)
 * - Diğer state'lerde vurgulu kart
 *
 * KYB status kullanıcı objesinden okunur (get_session_user response'u).
 * Eğer bağlama kullanıcı objesinde kyb_status yoksa "henüz başvurulmadı" kabul edilir.
 */
export function KybStatusWidget(
  user: AuthUser | null,
  kybInfo?: KybStatusInfo
): string {
  if (!user) return "";

  const isSeller = Boolean(user.is_seller);
  const hasPending = Boolean(user.pending_seller_application);
  if (!isSeller && !hasPending) return "";

  const status = kybInfo?.status || "";

  // Verified — küçük badge
  if (status === "Verified") {
    return `
      <a href="${KYB_HREF}"
         class="block bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 mb-4 flex items-center gap-2 text-sm text-green-800 hover:bg-green-100 transition-colors no-underline">
        <span class="text-green-600">${ICONS.shield}</span>
        <span class="font-medium">${t("kyb.statusVerified")}</span>
        <span class="text-xs text-green-600 ml-auto">${t("kyb.viewDetails")}</span>
      </a>
    `;
  }

  // Rejected — kırmızı, vurgulu, gerekçe ile
  if (status === "Rejected") {
    const reason = (kybInfo?.rejection_reason || "").trim();
    return `
      <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3">
        <span class="text-red-500 flex-shrink-0 mt-0.5">${ICONS.alert}</span>
        <div class="flex-1 min-w-0">
          <div class="font-semibold text-red-800 mb-1">${t("kyb.widgetRejectedTitle")}</div>
          ${reason ? `<div class="text-sm text-red-700 mb-2 break-words">${reason}</div>` : ""}
          <a href="${KYB_HREF}" class="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 hover:text-red-900 no-underline">
            ${t("kyb.widgetFixDocuments")} ${ICONS.arrow}
          </a>
        </div>
      </div>
    `;
  }

  // Expired — turuncu
  if (status === "Expired") {
    return `
      <div class="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4 flex items-start gap-3">
        <span class="text-orange-500 flex-shrink-0 mt-0.5">${ICONS.alert}</span>
        <div class="flex-1">
          <div class="font-semibold text-orange-800 mb-1">${t("kyb.widgetExpiredTitle")}</div>
          <a href="${KYB_HREF}" class="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-700 hover:text-orange-900 no-underline">
            ${t("kyb.widgetRenew")} ${ICONS.arrow}
          </a>
        </div>
      </div>
    `;
  }

  // Pending — sarı, bilgi
  if (status === "Pending") {
    return `
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-center gap-3">
        <span class="text-yellow-600 flex-shrink-0">${ICONS.shield}</span>
        <div class="flex-1 text-sm text-yellow-800">${t("kyb.widgetPendingMsg")}</div>
        <a href="${KYB_HREF}" class="text-xs font-semibold text-yellow-800 hover:text-yellow-900 no-underline whitespace-nowrap">
          ${t("kyb.widgetView")} →
        </a>
      </div>
    `;
  }

  // Under Review — mavi, bilgi
  if (status === "Under Review") {
    return `
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center gap-3">
        <span class="text-blue-600 flex-shrink-0">${ICONS.shield}</span>
        <div class="flex-1 text-sm text-blue-800">${t("kyb.widgetUnderReviewMsg")}</div>
        <a href="${KYB_HREF}" class="text-xs font-semibold text-blue-800 hover:text-blue-900 no-underline whitespace-nowrap">
          ${t("kyb.widgetView")} →
        </a>
      </div>
    `;
  }

  // Default: henüz başvurulmadı — mavi CTA
  return `
    <div class="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-lg p-4 mb-4 flex items-center gap-3">
      <span class="text-violet-600 flex-shrink-0">${ICONS.shield}</span>
      <div class="flex-1">
        <div class="font-semibold text-violet-900 mb-0.5">${t("kyb.widgetNotStartedTitle")}</div>
        <div class="text-xs text-violet-700">${t("kyb.widgetNotStartedDesc")}</div>
      </div>
      <a href="${KYB_HREF}" class="th-btn px-4 py-2 text-sm whitespace-nowrap no-underline">
        ${t("kyb.widgetApplyNow")}
      </a>
    </div>
  `;
}
