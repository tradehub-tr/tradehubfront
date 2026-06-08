/**
 * KycLayout — Sprint 2.6 (2026-05-15 güncellemesi)
 *
 * Alıcı KYC doğrulama formu. Kurumsal ⇄ Bireysel toggle.
 * - Boxed white card layout (Image #8 referans, th-input class'ı)
 * - Bireysel default seçili (kullanıcı talebi)
 * - Kimlik Belgesi: resim thumbnail / PDF kart preview (KYB pattern'i)
 * - Ortak alanlar (her iki toggle için): tax_id, phone, email_field, address, billing_address
 * - Kurumsal-only: company_name
 * - tax_id label dinamik: Bireysel=TCKN(11), Kurumsal=VKN(10-11)
 * - Prefill: get_prefill_data + get_kyc_status
 * - Status badge + banner (Pending/Verified/Rejected/Suspended)
 */

import { api } from "../../utils/api";
import { SlotDropzoneController } from "../../lib/upload-ui";
import { renderSegmented } from "../../utils/ui/toggle";
import { t } from "../../i18n";
import { escapeHtml, sanitizeUrl } from "../../utils/sanitize";

const FORM_ID = "kyc-form";
const TOGGLE_ID = "kyc-account-type-toggle";

interface PrefillData {
  email?: string;
  first_name?: string;
  last_name?: string;
  account_type?: string;
  company_name?: string;
  tax_id?: string;
  phone?: string;
  address?: string;
  billing_address?: string;
  identity_document?: string;
}

interface KycStatusData {
  exists: boolean;
  status?: string;
  rejection_reason?: string;
  rejection_category?: string;
  account_type?: string;
  company_name?: string;
  tax_id?: string;
  phone?: string;
  email_field?: string;
  address?: string;
  billing_address?: string;
  identity_document?: string;
}

function renderToggle(): string {
  // Hesap türü chip-radiogroup → ortak segmented helper. Value'lar
  // (Individual/Business) ve TOGGLE_ID korunur; seçim native radio change
  // event'iyle setAccountType()'a bağlanır.
  return `
		<div class="bg-white rounded-2xl border border-gray-200 p-4 mb-4">
			<label class="text-sm text-gray-600 mb-2 block">${t("kycUi.accountType")}</label>
			<div id="${TOGGLE_ID}" class="max-w-xs">
				${renderSegmented({
          name: "kyc_account_type",
          value: "Individual",
          options: [
            { value: "Individual", label: t("kycUi.individual") },
            { value: "Business", label: t("kycUi.corporate") },
          ],
        })}
			</div>
		</div>
	`;
}

function renderCorporateOnlySection(): string {
  // Sadece Kurumsal iken görünür. Şirket Ünvanı.
  return `
		<section data-kyc-section="corporate" class="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
			<h3 class="text-base font-semibold mb-1">${t("kycUi.companyInfoTitle")}</h3>
			<p class="text-xs text-gray-500 mb-4">${t("kycUi.corporateRequired")}</p>
			<div>
				<label class="block text-xs font-medium mb-1.5 text-gray-600">${t("kycUi.companyTitleLabel")} <span class="text-red-500">*</span></label>
				<input type="text" name="company_name" class="th-input th-input-md" placeholder="${t("kycUi.companyTitlePlaceholder")}" />
			</div>
		</section>
	`;
}

function renderCommonSection(): string {
  // Hem Kurumsal hem Bireysel için ortak alanlar.
  return `
		<section class="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
			<h3 class="text-base font-semibold mb-1">${t("kycUi.identityContactTitle")}</h3>
			<p class="text-xs text-gray-500 mb-4">${t("kycUi.allFieldsRequired")}</p>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label class="block text-xs font-medium mb-1.5 text-gray-600">
						<span data-kyc-tax-label>${t("kycUi.taxNumberTckn")}</span> <span class="text-red-500">*</span>
					</label>
					<input type="text" name="tax_id" class="th-input th-input-md"
						minlength="10" maxlength="11" pattern="\\d{10,11}" inputmode="numeric"
						placeholder="${t("kycUi.taxDigits1011")}" />
				</div>
				<div>
					<label class="block text-xs font-medium mb-1.5 text-gray-600">${t("kycUi.phone")} <span class="text-red-500">*</span></label>
					<input type="tel" name="phone" class="th-input th-input-md" placeholder="+90 5xx xxx xx xx" />
				</div>
				<div>
					<label class="block text-xs font-medium mb-1.5 text-gray-600">${t("kycUi.email")} <span class="text-red-500">*</span></label>
					<input type="email" name="email_field" class="th-input th-input-md bg-gray-50 cursor-not-allowed" readonly />
				</div>
				<div class="md:col-span-2"></div>
				<div class="md:col-span-2">
					<label class="block text-xs font-medium mb-1.5 text-gray-600">${t("kycUi.address")} <span class="text-red-500">*</span></label>
					<textarea name="address" rows="2" class="th-input th-input-md"></textarea>
				</div>
				<div class="md:col-span-2">
					<label class="block text-xs font-medium mb-1.5 text-gray-600">${t("kycUi.billingAddress")} <span class="text-red-500">*</span></label>
					<textarea name="billing_address" rows="2" class="th-input th-input-md"></textarea>
				</div>
			</div>
		</section>
	`;
}

function renderDocumentSection(): string {
  // SlotDropzone (tradehub-upload-ui) — autoUpload, multipart Frappe upload_file.
  // kyc-identity-preview: Karma C preview kartı container'ı.
  // formData yüklendiğinde JS preview HTML basar; boşsa hidden kalır.
  return `
		<section class="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
			<h3 class="text-base font-semibold mb-1">${t("kycUi.identityDocument")}</h3>
			<p class="text-xs text-gray-500 mb-4">${t("kycUi.documentFormatsHint")}</p>
			<div id="kyc-identity-preview" class="hidden mb-3"></div>
			<div id="kyc-document-slots"></div>
		</section>
	`;
}

export function KycLayout(): string {
  return `
		<div class="max-w-4xl mx-auto px-4 py-4">
			<header class="mb-4 flex items-start justify-between gap-4 flex-wrap">
				<div class="flex-1 min-w-0">
					<h1 class="text-2xl font-semibold text-gray-900">${t("kycUi.pageTitle")}</h1>
					<p class="text-sm text-gray-600 mt-1">
						${t("kycUi.pageDescription")}
					</p>
				</div>
				<span id="kyc-status-badge" class="hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border">
					<span class="kyc-status-icon"></span>
					<span class="kyc-status-text"></span>
				</span>
			</header>

			<div id="kyc-status-banner" class="hidden mb-4"></div>

			<form id="${FORM_ID}" data-kyc-account-type="Individual">
				${renderToggle()}
				${renderCorporateOnlySection()}
				${renderCommonSection()}
				${renderDocumentSection()}

				<div class="flex justify-end gap-3">
					<button type="submit" id="kyc-submit-btn" class="th-btn px-6 py-2.5 text-sm font-semibold">
						${t("kycUi.submit")}
					</button>
				</div>

				<div id="kyc-form-message" class="mt-4 text-sm hidden"></div>
			</form>
		</div>
	`;
}

/* ────────── Init Logic ────────── */

async function fetchPrefill(): Promise<PrefillData | null> {
  try {
    const res = await api<{ message: PrefillData }>(
      "/method/tradehub_core.api.v1.kyc.get_prefill_data"
    );
    return res.message || null;
  } catch (e) {
    console.warn("KYC prefill fetch failed", e);
    return null;
  }
}

async function fetchKycStatus(): Promise<KycStatusData | null> {
  try {
    const res = await api<{ message: KycStatusData }>(
      "/method/tradehub_core.api.v1.kyc.get_kyc_status"
    );
    return res.message || null;
  } catch (e) {
    console.warn("KYC status fetch failed", e);
    return null;
  }
}

function applyPrefill(form: HTMLFormElement, data: PrefillData): void {
  const fields: Array<keyof PrefillData> = [
    "company_name",
    "tax_id",
    "phone",
    "address",
    "billing_address",
  ];
  for (const field of fields) {
    const input = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${field}"]`);
    if (input && data[field] && !input.value) {
      input.value = String(data[field]);
    }
  }
  const emailInput = form.querySelector<HTMLInputElement>('[name="email_field"]');
  if (emailInput && data.email) emailInput.value = data.email;
}

function setAccountType(type: "Business" | "Individual"): void {
  const form = document.getElementById(FORM_ID) as HTMLFormElement | null;
  if (!form) return;
  form.dataset.kycAccountType = type;
  // Kurumsal-only section
  const corporateSection = form.querySelector<HTMLElement>('[data-kyc-section="corporate"]');
  if (corporateSection) {
    corporateSection.style.display = type === "Business" ? "" : "none";
  }
  // Tax ID label dinamik
  const taxLabel = form.querySelector("[data-kyc-tax-label]");
  if (taxLabel) {
    taxLabel.textContent = type === "Business" ? t("kycUi.taxNumberVkn") : t("kycUi.taxNumberTckn");
  }
  const taxInput = form.querySelector<HTMLInputElement>('[name="tax_id"]');
  if (taxInput) {
    taxInput.placeholder = type === "Business" ? t("kycUi.taxDigits1011") : t("kycUi.taxDigits11");
    // Bireysel = TCKN tam 11 hane (mod-10 backend doğrulaması), Kurumsal = VKN 10-11 hane
    if (type === "Business") {
      taxInput.setAttribute("pattern", "\\d{10,11}");
      taxInput.setAttribute("minlength", "10");
      taxInput.setAttribute("maxlength", "11");
    } else {
      taxInput.setAttribute("pattern", "\\d{11}");
      taxInput.setAttribute("minlength", "11");
      taxInput.setAttribute("maxlength", "11");
    }
  }
  // Segmented radio'yu seçili tipe senkronla (programatik prefill için de).
  const radio = form.querySelector<HTMLInputElement>(
    `#${TOGGLE_ID} input[name="kyc_account_type"][value="${type}"]`
  );
  if (radio) radio.checked = true;
}

function isImageUrl(url: string): boolean {
  return /\.(jpe?g|png|webp|gif)$/i.test(url);
}

function getFileName(url: string): string {
  if (!url) return "";
  try {
    const decoded = decodeURIComponent(url);
    return decoded.split("/").pop() || decoded;
  } catch {
    return url.split("/").pop() || url;
  }
}

// Preview kart ikonları — inline SVG (lucide pattern).
const PREVIEW_ICONS = {
  image: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.5-3.5a2 2 0 0 0-2.83 0L4 22"/></svg>`,
  pdf: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  eye: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
};

function getFileExtUpper(url: string): string {
  const name = getFileName(url);
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toUpperCase() : t("kycUi.fileFallback");
}

function showDocumentPreview(url: string): void {
  const container = document.getElementById("kyc-identity-preview");
  if (!container) return;
  if (!url) {
    container.classList.add("hidden");
    container.innerHTML = "";
    return;
  }

  const isImage = isImageUrl(url);
  const iconHtml = isImage
    ? `<span class="text-blue-600">${PREVIEW_ICONS.image}</span>`
    : `<span class="text-red-600">${PREVIEW_ICONS.pdf}</span>`;
  const filename = getFileName(url);
  const ext = getFileExtUpper(url);

  container.innerHTML = `
		<div class="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
			<div class="w-14 h-14 rounded-md bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
				${iconHtml}
			</div>
			<div class="flex-1 min-w-0">
				<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500 text-white uppercase tracking-wider mb-0.5">
					${t("kycUi.uploaded")}
				</span>
				<div class="text-[13px] font-semibold text-gray-900 truncate">${filename}</div>
				<div class="text-[11px] text-gray-600">${t("kycUi.fileExt", { ext })}</div>
			</div>
			<a href="${escapeHtml(sanitizeUrl(url))}" target="_blank" rel="noopener" class="px-3 py-1.5 rounded-md text-[12px] font-medium bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-100 inline-flex items-center gap-1">
				${PREVIEW_ICONS.eye}
				<span>${t("kycUi.view")}</span>
			</a>
		</div>
	`;
  container.classList.remove("hidden");
}

function getCsrfToken(): string {
  return localStorage.getItem("_csrf_token") || "";
}

function showMessage(text: string, tone: "success" | "error" | "info"): void {
  const el = document.getElementById("kyc-form-message");
  if (!el) return;
  const toneClasses = {
    success: "text-green-700 bg-green-50 border-green-200",
    error: "text-red-700 bg-red-50 border-red-200",
    info: "text-blue-700 bg-blue-50 border-blue-200",
  };
  el.className = `mt-4 text-sm border rounded-lg px-4 py-3 ${toneClasses[tone]}`;
  el.textContent = text;
  el.classList.remove("hidden");
}

/** Yüklenmiş dosya URL'i — submit anında payload'a koyulur */
let currentIdentityUrl = "";

let kycSlotController: SlotDropzoneController | null = null;

/**
 * Verified/Suspended status'larda SlotDropzone'un yükleme alanını gizler.
 * Preview kartı görünür kalır — sadece "Tıkla veya sürükle" zone'u kapatılır.
 * Backend Verified KYC için resubmit'e izin vermediğinden 403 → login redirect
 * sorununu UI tarafında engelleriz.
 */
function applyKycSlotReadOnlyState(status: string): void {
  const readOnly = status === "Verified" || status === "Suspended";
  const slotCard = document.querySelector('[data-slot-id="identity_document"]');
  if (!slotCard) return;
  const slotZone = slotCard.querySelector(".slot-zone");
  const fileInput = slotCard.querySelector('input[type="file"]');
  if (readOnly) {
    if (slotZone instanceof HTMLElement) slotZone.style.display = "none";
    if (fileInput instanceof HTMLInputElement) fileInput.disabled = true;
  } else {
    if (slotZone instanceof HTMLElement) slotZone.style.display = "";
    if (fileInput instanceof HTMLInputElement) fileInput.disabled = false;
  }
}

function mountKycSlotDropzone(): void {
  if (kycSlotController) return; // tek mount
  kycSlotController = new SlotDropzoneController({
    containerId: "kyc-document-slots",
    slots: [
      {
        id: "identity_document",
        label: t("kycUi.identityDocument"),
        required: true,
        accept: ".pdf,.jpg,.jpeg,.png,.webp,.docx",
        maxFileSizeBytes: 10 * 1024 * 1024,
        hint: t("kycUi.slotHint"),
      },
    ],
    autoUpload: true,
    autoUploadConfig: {
      endpoint: "/api/method/upload_file",
      formDataPerSlot: () => ({ is_private: "1" }),
      headers: { "X-Frappe-CSRF-Token": getCsrfToken() },
    },
    onSlotUploaded: (_slotId, fileUrl) => {
      currentIdentityUrl = fileUrl;
      // Karma C: yeni dosya yüklenince preview kartını da yenile.
      showDocumentPreview(fileUrl);
    },
    onSlotUploadError: (_slotId, error) => {
      showMessage(error || t("kycUi.errUploadFailed"), "error");
    },
    onValidationError: (_slotId, _kind, file) => {
      showMessage(t("kycUi.errTooLarge", { fileName: file.name }), "error");
    },
  });
  kycSlotController.mount();
}

/**
 * TCKN client-side doğrulama — backend `_validate_tckn` ile birebir aynı kural:
 * 11 hane, '0' ile başlayamaz, 10. hane (odd*7 - even) %10, 11. hane sum(d[:10]) %10.
 * Backend HTTP 417 dönmeden hatayı önden yakalar.
 */
function isValidTckn(value: string): boolean {
  const digits = value.trim();
  if (!/^\d{11}$/.test(digits)) return false;
  if (digits[0] === "0") return false;
  const d = digits.split("").map(Number);
  const odd = d[0] + d[2] + d[4] + d[6] + d[8];
  const even = d[1] + d[3] + d[5] + d[7];
  if ((odd * 7 - even) % 10 !== d[9]) return false;
  if (d.slice(0, 10).reduce((s, n) => s + n, 0) % 10 !== d[10]) return false;
  return true;
}

async function handleSubmit(e: SubmitEvent): Promise<void> {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  const accountType = form.dataset.kycAccountType || "Individual";

  // Dosya zaten autoUpload ile yüklendi (SlotDropzone) — currentIdentityUrl set.
  const identityUrl = currentIdentityUrl;
  if (!identityUrl) {
    showMessage(t("kycUi.errIdentityRequired"), "error");
    return;
  }

  const fd = new FormData(form);
  const payload: Record<string, string> = {
    account_type: accountType,
    identity_document: identityUrl,
    tax_id: String(fd.get("tax_id") || ""),
    phone: String(fd.get("phone") || ""),
    address: String(fd.get("address") || ""),
    billing_address: String(fd.get("billing_address") || ""),
  };
  if (accountType === "Business") {
    payload.company_name = String(fd.get("company_name") || "");
  }

  // Bireysel hesapta TCKN client-side doğrula — backend HTTP 417 dönmeden önle.
  // VKN için HTML5 pattern (10-11 hane) yeterli; ek client-side check yok.
  if (accountType !== "Business" && !isValidTckn(payload.tax_id)) {
    showMessage(t("kycUi.errInvalidTckn"), "error");
    return;
  }

  try {
    await api("/method/tradehub_core.api.v1.kyc.submit_kyc_documents", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    showMessage(t("kycUi.submitSuccess"), "success");
    // 2 saniye sonra reload — status badge yenilenir
    setTimeout(() => window.location.reload(), 2000);
  } catch (err) {
    console.error("[KYC submit failed]", err);
    showMessage((err as Error).message || t("kycUi.errSubmitFailed"), "error");
  }
}

// Lucide SVG ikon set — emoji yasağı (memory: feedback_no_emoji)
const STATUS_ICONS = {
  clock: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  x: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  lock: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
};

function updateStatusUI(status: KycStatusData): void {
  const badge = document.getElementById("kyc-status-badge");
  const banner = document.getElementById("kyc-status-banner");
  const submitBtn = document.getElementById("kyc-submit-btn") as HTMLButtonElement | null;
  if (!badge || !banner) return;

  const stateMap: Record<string, { label: string; tone: string; icon: string }> = {
    Pending: {
      label: t("kycUi.statusPending"),
      tone: "bg-amber-100 text-amber-800 border-amber-200",
      icon: STATUS_ICONS.clock,
    },
    Verified: {
      label: t("kycUi.statusVerified"),
      tone: "bg-green-100 text-green-800 border-green-200",
      icon: STATUS_ICONS.check,
    },
    Rejected: {
      label: t("kycUi.statusRejected"),
      tone: "bg-red-100 text-red-800 border-red-200",
      icon: STATUS_ICONS.x,
    },
    Suspended: {
      label: t("kycUi.statusSuspended"),
      tone: "bg-gray-200 text-gray-800 border-gray-300",
      icon: STATUS_ICONS.lock,
    },
  };
  const cfg = stateMap[status.status || ""];
  if (cfg) {
    badge.className = `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border ${cfg.tone}`;
    const iconEl = badge.querySelector(".kyc-status-icon");
    const textEl = badge.querySelector(".kyc-status-text");
    // SVG için innerHTML (trusted Lucide markup, kullanıcı içeriği değil)
    if (iconEl) iconEl.innerHTML = cfg.icon;
    if (textEl) textEl.textContent = cfg.label;
    badge.classList.remove("hidden");
  }

  const banners: Record<string, { tone: string; title: string; desc: string }> = {
    Pending: {
      tone: "bg-amber-50 border-amber-200 text-amber-900",
      title: t("kycUi.bannerPendingTitle"),
      desc: t("kycUi.bannerPendingDesc"),
    },
    Verified: {
      tone: "bg-green-50 border-green-200 text-green-900",
      title: t("kycUi.bannerVerifiedTitle"),
      desc: t("kycUi.bannerVerifiedDesc"),
    },
    Rejected: {
      tone: "bg-red-50 border-red-200 text-red-900",
      title: t("kycUi.bannerRejectedTitle"),
      desc: status.rejection_reason || t("kycUi.bannerRejectedDesc"),
    },
    Suspended: {
      tone: "bg-gray-100 border-gray-300 text-gray-800",
      title: t("kycUi.bannerSuspendedTitle"),
      desc: status.rejection_reason || t("kycUi.bannerSuspendedDesc"),
    },
  };
  const bcfg = banners[status.status || ""];
  if (bcfg) {
    banner.className = `mb-4 border rounded-2xl p-4 ${bcfg.tone}`;
    banner.innerHTML = `
			<div class="font-semibold mb-1">${bcfg.title}</div>
			<div class="text-sm">${escapeHtml(bcfg.desc)}</div>
		`;
    banner.classList.remove("hidden");
  }

  if (submitBtn) {
    if (status.status === "Verified") {
      submitBtn.textContent = t("kycUi.updateInfo");
    } else if (status.status === "Rejected") {
      submitBtn.textContent = t("kycUi.fixAndResubmit");
    } else if (status.status === "Suspended") {
      submitBtn.textContent = t("kycUi.locked");
      submitBtn.disabled = true;
    }
  }
}

export function initKycLayout(): void {
  const form = document.getElementById(FORM_ID) as HTMLFormElement | null;
  if (!form) return;

  // Bireysel default — Kurumsal-only section gizli, tax label TCKN
  setAccountType("Individual");

  // Segmented radio change → hesap türü değişimi
  const toggleContainer = document.getElementById(TOGGLE_ID);
  if (toggleContainer) {
    toggleContainer.addEventListener("change", (e) => {
      const radio = e.target as HTMLInputElement;
      if (radio.name !== "kyc_account_type" || !radio.checked) return;
      setAccountType(radio.value as "Business" | "Individual");
    });
  }

  // SlotDropzone mount — autoUpload, multipart Frappe upload_file
  mountKycSlotDropzone();

  form.addEventListener("submit", handleSubmit);

  // Prefill (async, non-blocking)
  fetchPrefill().then((data) => {
    if (!data) return;
    applyPrefill(form, data);
    if (data.account_type === "Business") setAccountType("Business");
  });

  // Mevcut KYC kaydı varsa form'u doldur + status UI render
  fetchKycStatus().then((status) => {
    if (!status?.exists) return;
    applyPrefill(form, {
      account_type: status.account_type,
      company_name: status.company_name,
      tax_id: status.tax_id,
      phone: status.phone,
      address: status.address,
      billing_address: status.billing_address,
    });
    if (status.email_field) {
      const emailInput = form.querySelector<HTMLInputElement>('[name="email_field"]');
      if (emailInput) emailInput.value = status.email_field;
    }
    if (status.account_type === "Business") setAccountType("Business");
    else if (status.account_type === "Individual") setAccountType("Individual");

    // Mevcut yüklü kimlik belgesi var → preview göster (server URL)
    if (status.identity_document) {
      currentIdentityUrl = status.identity_document;
      showDocumentPreview(status.identity_document);
    }

    // Verified/Suspended → slot zone'unu gizle (resubmit 403'ü engellemek için)
    applyKycSlotReadOnlyState(status.status || "");

    updateStatusUI(status);
  });
}
