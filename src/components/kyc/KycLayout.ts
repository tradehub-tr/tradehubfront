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
  return `
		<div class="bg-white rounded-2xl border border-gray-200 p-4 mb-4">
			<label class="text-sm text-gray-600 mb-2 block">Hesap türü</label>
			<div id="${TOGGLE_ID}" class="inline-flex rounded-full bg-gray-100 p-1" role="radiogroup" aria-label="Hesap türü">
				<button type="button" data-kyc-type="Individual"
					class="kyc-toggle-btn px-5 py-2 text-sm font-medium rounded-full transition-all bg-gray-900 text-white"
					role="radio" aria-checked="true">Bireysel</button>
				<button type="button" data-kyc-type="Business"
					class="kyc-toggle-btn px-5 py-2 text-sm font-medium rounded-full transition-all text-gray-600 hover:bg-gray-200"
					role="radio" aria-checked="false">Kurumsal</button>
			</div>
		</div>
	`;
}

function renderCorporateOnlySection(): string {
  // Sadece Kurumsal iken görünür. Şirket Ünvanı.
  return `
		<section data-kyc-section="corporate" class="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
			<h3 class="text-base font-semibold mb-1">Şirket Bilgileri</h3>
			<p class="text-xs text-gray-500 mb-4">Kurumsal hesap için zorunlu</p>
			<div>
				<label class="block text-xs font-medium mb-1.5 text-gray-600">Şirket Ünvanı <span class="text-red-500">*</span></label>
				<input type="text" name="company_name" class="th-input th-input-md" placeholder="Örn: ACME Ltd. Şti." />
			</div>
		</section>
	`;
}

function renderCommonSection(): string {
  // Hem Kurumsal hem Bireysel için ortak alanlar.
  return `
		<section class="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
			<h3 class="text-base font-semibold mb-1">Kimlik & İletişim Bilgileri</h3>
			<p class="text-xs text-gray-500 mb-4">Tüm alanlar zorunlu</p>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label class="block text-xs font-medium mb-1.5 text-gray-600">
						<span data-kyc-tax-label>Vergi Numarası (TCKN)</span> <span class="text-red-500">*</span>
					</label>
					<input type="text" name="tax_id" class="th-input th-input-md"
						minlength="10" maxlength="11" pattern="\\d{10,11}" inputmode="numeric"
						placeholder="10-11 hane" />
				</div>
				<div>
					<label class="block text-xs font-medium mb-1.5 text-gray-600">Telefon <span class="text-red-500">*</span></label>
					<input type="tel" name="phone" class="th-input th-input-md" placeholder="+90 5xx xxx xx xx" />
				</div>
				<div>
					<label class="block text-xs font-medium mb-1.5 text-gray-600">E-Posta <span class="text-red-500">*</span></label>
					<input type="email" name="email_field" class="th-input th-input-md bg-gray-50 cursor-not-allowed" readonly />
				</div>
				<div class="md:col-span-2"></div>
				<div class="md:col-span-2">
					<label class="block text-xs font-medium mb-1.5 text-gray-600">Adres <span class="text-red-500">*</span></label>
					<textarea name="address" rows="2" class="th-input th-input-md"></textarea>
				</div>
				<div class="md:col-span-2">
					<label class="block text-xs font-medium mb-1.5 text-gray-600">Fatura Adresi <span class="text-red-500">*</span></label>
					<textarea name="billing_address" rows="2" class="th-input th-input-md"></textarea>
				</div>
			</div>
		</section>
	`;
}

function renderDocumentSection(): string {
  // SlotDropzone (tradehub-upload-ui) — autoUpload, multipart Frappe upload_file.
  return `
		<section class="bg-white rounded-2xl border border-gray-200 p-6 mb-4">
			<h3 class="text-base font-semibold mb-1">Kimlik Belgesi</h3>
			<p class="text-xs text-gray-500 mb-4">PDF, JPG, JPEG, PNG, WEBP, DOCX · Maks 10 MB · Zorunlu</p>
			<div id="kyc-document-slots"></div>
		</section>
	`;
}

export function KycLayout(): string {
  return `
		<div class="max-w-4xl mx-auto px-4 py-4">
			<header class="mb-4 flex items-start justify-between gap-4 flex-wrap">
				<div class="flex-1 min-w-0">
					<h1 class="text-2xl font-semibold text-gray-900">KYC Doğrulama</h1>
					<p class="text-sm text-gray-600 mt-1">
						Ürün satın alabilmek için kimlik doğrulamanızı tamamlayın.
						Belgeleriniz süper admin tarafından onaylandıktan sonra alışveriş yapabilirsiniz.
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
						Gönder
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
    taxLabel.textContent = type === "Business" ? "Vergi Numarası (VKN)" : "Vergi Numarası (TCKN)";
  }
  const taxInput = form.querySelector<HTMLInputElement>('[name="tax_id"]');
  if (taxInput) {
    taxInput.placeholder = type === "Business" ? "10-11 hane" : "11 hane";
  }
  // Toggle button styles
  const buttons = form.querySelectorAll<HTMLButtonElement>(".kyc-toggle-btn");
  for (const btn of buttons) {
    const btnType = btn.getAttribute("data-kyc-type");
    const active = btnType === type;
    btn.classList.toggle("bg-gray-900", active);
    btn.classList.toggle("text-white", active);
    btn.classList.toggle("text-gray-600", !active);
    btn.classList.toggle("hover:bg-gray-200", !active);
    btn.setAttribute("aria-checked", active ? "true" : "false");
  }
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

function showDocumentPreview(url: string): void {
  const empty = document.getElementById("kyc-doc-empty");
  const preview = document.getElementById("kyc-doc-preview");
  const img = document.getElementById("kyc-doc-image") as HTMLImageElement | null;
  const pdf = document.getElementById("kyc-doc-pdf");
  const fname = document.getElementById("kyc-doc-filename");
  if (!empty || !preview || !img || !pdf || !fname) return;

  empty.classList.add("hidden");
  preview.classList.remove("hidden");

  if (isImageUrl(url)) {
    img.src = url;
    img.classList.remove("hidden");
    pdf.classList.add("hidden");
  } else {
    img.classList.add("hidden");
    pdf.classList.remove("hidden");
    fname.textContent = getFileName(url);
  }
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

function mountKycSlotDropzone(): void {
  if (kycSlotController) return; // tek mount
  kycSlotController = new SlotDropzoneController({
    containerId: "kyc-document-slots",
    slots: [
      {
        id: "identity_document",
        label: "Kimlik Belgesi",
        required: true,
        accept: ".pdf,.jpg,.jpeg,.png,.webp,.docx",
        maxFileSizeBytes: 10 * 1024 * 1024,
        hint: "PDF, JPG, PNG, WEBP, DOCX · maks. 10MB",
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
    },
    onSlotUploadError: (_slotId, error) => {
      showMessage(error || "Dosya yüklenemedi.", "error");
    },
    onValidationError: (_slotId, _kind, file) => {
      showMessage(`${file.name} 10MB üzerinde.`, "error");
    },
  });
  kycSlotController.mount();
}

async function handleSubmit(e: SubmitEvent): Promise<void> {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  const accountType = form.dataset.kycAccountType || "Individual";

  // Dosya zaten autoUpload ile yüklendi (SlotDropzone) — currentIdentityUrl set.
  const identityUrl = currentIdentityUrl;
  if (!identityUrl) {
    showMessage("Kimlik belgesi zorunludur.", "error");
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

  try {
    await api("/method/tradehub_core.api.v1.kyc.submit_kyc_documents", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    showMessage(
      "KYC başvurunuz alındı. Süper admin onayından sonra alışveriş yapabileceksiniz.",
      "success"
    );
    // 2 saniye sonra reload — status badge yenilenir
    setTimeout(() => window.location.reload(), 2000);
  } catch (err) {
    showMessage((err as Error).message || "Gönderim başarısız.", "error");
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
      label: "Onay Bekliyor",
      tone: "bg-amber-100 text-amber-800 border-amber-200",
      icon: STATUS_ICONS.clock,
    },
    Verified: {
      label: "Doğrulandı",
      tone: "bg-green-100 text-green-800 border-green-200",
      icon: STATUS_ICONS.check,
    },
    Rejected: {
      label: "Reddedildi",
      tone: "bg-red-100 text-red-800 border-red-200",
      icon: STATUS_ICONS.x,
    },
    Suspended: {
      label: "Askıya Alındı",
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
      title: "Başvurunuz İnceleniyor",
      desc: "Belgeleriniz süper admin tarafından inceleniyor. Genellikle 1-2 iş günü içinde sonuçlanır.",
    },
    Verified: {
      tone: "bg-green-50 border-green-200 text-green-900",
      title: "KYC Doğrulamanız Onaylandı",
      desc: "Artık alışveriş yapabilirsiniz. Bilgilerinizi güncellemek isterseniz formu düzenleyip 'Bilgileri Güncelle' butonuna basın.",
    },
    Rejected: {
      tone: "bg-red-50 border-red-200 text-red-900",
      title: "Başvurunuz Reddedildi",
      desc: status.rejection_reason || "Belgelerinizi düzeltip yeniden gönderin.",
    },
    Suspended: {
      tone: "bg-gray-100 border-gray-300 text-gray-800",
      title: "Hesabınız Askıya Alındı",
      desc: status.rejection_reason || "Destek ile iletişime geçin.",
    },
  };
  const bcfg = banners[status.status || ""];
  if (bcfg) {
    banner.className = `mb-4 border rounded-2xl p-4 ${bcfg.tone}`;
    banner.innerHTML = `
			<div class="font-semibold mb-1">${bcfg.title}</div>
			<div class="text-sm">${bcfg.desc}</div>
		`;
    banner.classList.remove("hidden");
  }

  if (submitBtn) {
    if (status.status === "Verified") {
      submitBtn.textContent = "Bilgileri Güncelle";
    } else if (status.status === "Rejected") {
      submitBtn.textContent = "Düzelt + Tekrar Gönder";
    } else if (status.status === "Suspended") {
      submitBtn.textContent = "Kilitli";
      submitBtn.disabled = true;
    }
  }
}

export function initKycLayout(): void {
  const form = document.getElementById(FORM_ID) as HTMLFormElement | null;
  if (!form) return;

  // Bireysel default — Kurumsal-only section gizli, tax label TCKN
  setAccountType("Individual");

  // Toggle click delegation
  const toggleContainer = document.getElementById(TOGGLE_ID);
  if (toggleContainer) {
    toggleContainer.addEventListener("click", (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-kyc-type]");
      if (!btn) return;
      const type = btn.getAttribute("data-kyc-type") as "Business" | "Individual";
      setAccountType(type);
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

    updateStatusUI(status);
  });
}
