/**
 * KYB Layout Component
 * Status'a göre 6 farklı görünüm (henüz başvurulmadı, Pending, Under Review,
 * Verified, Rejected, Expired). Belge yükleme + Yeniden Gönder akışı.
 */

import { t } from "../../i18n";

const ICONS = {
  shield: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l9 4v6c0 5-3.5 9-9 10C6.5 21 3 17 3 12V6l9-4z"/></svg>`,
  paperclip: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>`,
  pdf: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke-linejoin="round"/><path d="M14 2v6h6"/></svg>`,
  check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  alert: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  refresh: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>`,
};

// Belge alanları (backend ile birebir field name). Sprint 2.6: faaliyet_belgesi opsiyonel.
export const KYB_DOCUMENT_FIELDS: Array<{ key: string; labelKey: string; required?: boolean }> = [
  { key: "identity_document", labelKey: "kyb.docIdentity", required: true },
  { key: "imza_sirkuleri", labelKey: "kyb.docSignatureCirculars", required: true },
  { key: "ticaret_sicil_gazetesi", labelKey: "kyb.docTradeRegistryGazette", required: true },
  { key: "faaliyet_belgesi", labelKey: "kyb.docActivityCertificate", required: false },
  { key: "vergi_levhasi", labelKey: "kyb.docTaxCertificate", required: true },
  { key: "bank_account_document", labelKey: "kyb.docBankAccount", required: true },
];

// Belge thumbnail (PDF kart, image thumbnail veya boş upload)
function renderEmptyState(): string {
  return `
    <div class="bg-white rounded-xl p-12 text-center border border-gray-200">
      <div class="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style="background:linear-gradient(135deg, var(--color-primary-400, #e6b212) 0%, var(--color-primary-500, #cc9900) 100%);color:white">
        ${ICONS.shield}
      </div>
      <h2 class="text-xl font-bold mb-2">${t("kyb.notStartedTitle")}</h2>
      <p class="text-sm mb-6 max-w-md mx-auto" style="color:var(--color-text-tertiary)">${t("kyb.notStartedDesc")}</p>
      <button type="button" @click="startApplication()" class="th-btn px-8">${t("kyb.applyNow")}</button>
    </div>
  `;
}

function renderRejectedAlert(): string {
  return `
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-5">
      <span class="text-red-500 flex-shrink-0 mt-0.5">${ICONS.alert}</span>
      <div class="flex-1">
        <div class="font-semibold text-red-800 mb-1">${t("kyb.rejectedTitle")}</div>
        <div class="text-sm text-red-700 mb-2">
          <b>${t("kyb.rejectionReason")}:</b>
          <span x-text="kybData.rejection_reason || '—'"></span>
        </div>
        <div class="text-xs text-red-600">${t("kyb.rejectedHint")}</div>
      </div>
    </div>
  `;
}

function renderExpiredAlert(): string {
  return `
    <div class="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3 mb-5">
      <span class="text-orange-500 flex-shrink-0 mt-0.5">${ICONS.alert}</span>
      <div class="flex-1">
        <div class="font-semibold text-orange-800 mb-1">${t("kyb.expiredTitle")}</div>
        <div class="text-xs text-orange-700">${t("kyb.expiredHint")}</div>
      </div>
    </div>
  `;
}

function renderPendingInfo(): string {
  return `
    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3 mb-5">
      <span class="text-yellow-600 flex-shrink-0">${ICONS.alert}</span>
      <div>
        <div class="font-semibold text-yellow-800 mb-1">${t("kyb.pendingTitle")}</div>
        <div class="text-xs text-yellow-700">${t("kyb.pendingHint")}</div>
      </div>
    </div>
  `;
}

function renderDraftInfo(): string {
  return `
    <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-start gap-3 mb-5">
      <span class="text-gray-500 flex-shrink-0">${ICONS.alert}</span>
      <div>
        <div class="font-semibold text-gray-800 mb-1">${t("kyb.draftTitle")}</div>
        <div class="text-xs text-gray-600">${t("kyb.draftHint")}</div>
      </div>
    </div>
  `;
}

function renderUnderReviewInfo(): string {
  return `
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3 mb-5">
      <span class="text-blue-600 flex-shrink-0">${ICONS.alert}</span>
      <div>
        <div class="font-semibold text-blue-800 mb-1">${t("kyb.underReviewTitle")}</div>
        <div class="text-xs text-blue-700">${t("kyb.underReviewHint")}</div>
      </div>
    </div>
  `;
}

function renderVerifiedInfo(): string {
  return `
    <div class="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3 mb-5">
      <span class="text-green-600 flex-shrink-0">${ICONS.check}</span>
      <div>
        <div class="font-semibold text-green-800 mb-1">${t("kyb.verifiedTitle")}</div>
        <div class="text-xs text-green-700">${t("kyb.verifiedHint")}</div>
      </div>
    </div>
  `;
}

function renderHeader(): string {
  return `
    <div class="flex items-center justify-between gap-4 mb-5 flex-wrap">
      <div>
        <h1 class="text-2xl font-bold mb-1">${t("kyb.title")}</h1>
        <p class="text-sm" style="color:var(--color-text-tertiary)">${t("kyb.subtitle")}</p>
      </div>
      <template x-if="kybData.exists">
        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide"
              :class="statusBadgeClass">
          <!-- x-html güvenli: statusBadgeIcon kaynağı sabit Lucide SVG string (kyb.ts), kullanıcı içeriği değil. Emoji yasağı (memory) için SVG'ye geçildi. -->
          <span x-html="statusBadgeIcon"></span>
          <span x-text="statusBadgeLabel"></span>
        </span>
      </template>
    </div>
  `;
}

function renderForm(): string {
  return `
    <!-- Status'a göre üst uyarı -->
    <template x-if="kybData.status === 'Draft'">${renderDraftInfo()}</template>
    <template x-if="kybData.status === 'Rejected'">${renderRejectedAlert()}</template>
    <template x-if="kybData.status === 'Expired'">${renderExpiredAlert()}</template>
    <template x-if="kybData.status === 'Pending'">${renderPendingInfo()}</template>
    <template x-if="kybData.status === 'Under Review'">${renderUnderReviewInfo()}</template>
    <template x-if="kybData.status === 'Verified'">${renderVerifiedInfo()}</template>

    <!-- Şirket bilgileri -->
    <div class="bg-white rounded-2xl p-6 border border-gray-200 mb-4">
      <h2 class="text-base font-bold mb-4">${t("kyb.companyInfoTitle")}</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-medium mb-1.5" style="color:var(--color-text-secondary)">
            ${t("kyb.companyTitle")} <span class="text-red-500">*</span>
          </label>
          <input type="text" class="th-input th-input-md" x-model="formData.company_title"
                 :disabled="!isEditable" placeholder="${t("kyb.companyTitlePlaceholder")}" />
        </div>
        <div>
          <label class="block text-xs font-medium mb-1.5" style="color:var(--color-text-secondary)">${t("kyb.authorizedPerson")}</label>
          <input type="text" class="th-input th-input-md" x-model="formData.authorized_person"
                 :disabled="!isEditable" />
        </div>
        <div>
          <label class="block text-xs font-medium mb-1.5" style="color:var(--color-text-secondary)">${t("kyb.tradeRegistryNumber")}</label>
          <input type="text" class="th-input th-input-md" x-model="formData.trade_registry_number"
                 :disabled="!isEditable" />
        </div>
        <div>
          <label class="block text-xs font-medium mb-1.5" style="color:var(--color-text-secondary)">${t("kycUi.mersisNumber")}</label>
          <input type="text" class="th-input th-input-md" x-model="formData.mersis_no"
                 :disabled="!isEditable" placeholder="${t("kycUi.mersisPlaceholder")}" maxlength="16" pattern="\\d{16}" />
        </div>
        <div>
          <label class="block text-xs font-medium mb-1.5" style="color:var(--color-text-secondary)">${t("kycUi.kepAddress")}</label>
          <input type="email" class="th-input th-input-md" x-model="formData.kep_address"
                 :disabled="!isEditable" placeholder="${t("kycUi.kepPlaceholder")}" />
        </div>
      </div>
    </div>

    <!-- Belgeler (tradehub-upload-ui SlotDropzone — autoUpload + custom JSON base64) -->
    <div class="bg-white rounded-2xl p-6 border border-gray-200 mb-4">
      <h2 class="text-base font-bold mb-1">${t("kyb.documentsTitle")}</h2>
      <p class="text-xs mb-4" style="color:var(--color-text-tertiary)">${t("kyb.documentsHint")}</p>
      <div id="kyb-document-slots"></div>
    </div>

    <!-- Action bar -->
    <div class="bg-white rounded-xl p-4 border border-gray-200 flex items-center justify-between gap-3 flex-wrap"
         x-show="isEditable">
      <p class="text-xs" style="color:var(--color-text-tertiary)" x-text="actionBarHint"></p>
      <button type="button" @click="resubmit()" :disabled="submitting || !canSubmit"
              class="th-btn px-6 inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
        ${ICONS.refresh}
        <span x-text="submitting ? '${t("kyb.submitting")}' : (kybData.status === 'Rejected' ? '${t("kyb.resubmit")}' : kybData.status === 'Verified' ? '${t("kycUi.updateInfo")}' : '${t("kyb.submit")}')"></span>
      </button>
    </div>
  `;
}

export function KybLayout(): string {
  return `
    <div class="container-boxed py-6" x-data="kybPage">
      <div x-show="loading" class="bg-white rounded-xl p-12 text-center">
        <div class="text-sm" style="color:var(--color-text-tertiary)">${t("kyb.loading")}</div>
      </div>

      <div x-show="!loading && !kybData.exists">
        ${renderEmptyState()}
      </div>

      <div x-show="!loading && kybData.exists">
        ${renderHeader()}
        ${renderForm()}
      </div>
    </div>
  `;
}
