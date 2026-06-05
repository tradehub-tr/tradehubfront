/**
 * KYB Page Alpine State
 * Status fetch + belge yükleme + Yeniden Gönder akışı.
 *
 * Submit kuralları (backend'de uygulanır):
 *   - Sadece status="Rejected" iken belge değişikliğiyle Pending'e döner
 *   - Throttle: 5 dk'da 1 resubmit (rate_limit decorator)
 */

import Alpine from "alpinejs";
import { SlotDropzoneController, type SlotDef } from "../lib/upload-ui";
import { t } from "../i18n";
import { api, RateLimitError } from "../utils/api";
import { queueToast } from "../utils/toast";
import { KYB_DOCUMENT_FIELDS } from "../components/kyb/KybLayout";

interface KybData {
  exists: boolean;
  name?: string;
  status?: string;
  company_title?: string;
  business_type?: string;
  authorized_person?: string;
  tax_id_type?: string;
  tax_id?: string;
  tax_office?: string;
  trade_registry_number?: string;
  identity_document?: string;
  imza_sirkuleri?: string;
  ticaret_sicil_gazetesi?: string;
  faaliyet_belgesi?: string;
  vergi_levhasi?: string;
  bank_account_document?: string;
  document_expiry_date?: string;
  rejection_reason?: string;
  verified_at?: string;
}

const DOCUMENT_KEYS = [
  "identity_document",
  "imza_sirkuleri",
  "ticaret_sicil_gazetesi",
  "faaliyet_belgesi",
  "vergi_levhasi",
  "bank_account_document",
] as const;

/* ────────── Karma C preview helpers ────────── */

// Inline SVG ikonlar (lucide pattern). PREVIEW_ICONS storefront genelinde
// kullanılan inline SVG yaklaşımına uyumlu.
const KYB_PREVIEW_ICONS = {
  image: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.5-3.5a2 2 0 0 0-2.83 0L4 22"/></svg>`,
  pdf: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  eye: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
};

function kybIsImageUrl(url: string): boolean {
  return /\.(jpe?g|png|webp|gif)$/i.test(url);
}

function kybGetFileName(url: string): string {
  if (!url) return "";
  try {
    const decoded = decodeURIComponent(url);
    return decoded.split("/").pop() || decoded;
  } catch {
    return url.split("/").pop() || url;
  }
}

function kybGetExtUpper(url: string): string {
  const name = kybGetFileName(url);
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toUpperCase() : t("kycUi.fileFallback");
}

/**
 * Karma C: SlotDropzone'un slot card'ının ÜSTÜNE preview kartı inject eder.
 * SlotDropzone re-render olduğunda preview kaybolur — bu yüzden onSlotUploaded
 * callback'i ve init() sonu döngüsü preview'ları yeniden basar.
 */
function updateKybSlotPreview(slotId: string, fileUrl: string): void {
  const slotCard = document.querySelector<HTMLElement>(`[data-slot-id="${slotId}"]`);
  if (!slotCard) return;

  // Önceki preview varsa kaldır (slot-card'ın içine inject ediyoruz).
  const existing = slotCard.querySelector(".kyb-slot-preview");
  if (existing) existing.remove();

  if (!fileUrl) return;

  const isImage = kybIsImageUrl(fileUrl);
  const iconHtml = isImage
    ? `<span class="text-blue-600">${KYB_PREVIEW_ICONS.image}</span>`
    : `<span class="text-red-600">${KYB_PREVIEW_ICONS.pdf}</span>`;
  const filename = kybGetFileName(fileUrl);
  const ext = kybGetExtUpper(fileUrl);

  const previewDiv = document.createElement("div");
  previewDiv.className = "kyb-slot-preview mb-2";
  previewDiv.innerHTML = `
    <div class="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200">
      <div class="w-10 h-10 rounded-md bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
        ${iconHtml}
      </div>
      <div class="flex-1 min-w-0">
        <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500 text-white uppercase tracking-wider">
          ${t("kycUi.uploaded")}
        </span>
        <div class="text-[12px] font-semibold text-gray-900 truncate">${filename}</div>
        <div class="text-[10px] text-gray-600">${t("kycUi.fileExt", { ext })}</div>
      </div>
      <a href="${fileUrl}" target="_blank" rel="noopener" class="px-2 py-1 rounded-md text-[11px] font-medium bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-100 inline-flex items-center gap-1 flex-shrink-0">
        ${KYB_PREVIEW_ICONS.eye}
        <span>${t("kycUi.view")}</span>
      </a>
    </div>
  `;
  // slot-card'ın ilk çocuğu olarak ekle (label'in de üstünde) — slot zone'unun üstünde.
  slotCard.insertBefore(previewDiv, slotCard.firstChild);
}

/**
 * Tüm slot preview'larını formData'ya göre senkronize eder.
 * SlotDropzone re-render'ı sonrası çağrılır (yüklenmiş URL'leri görsel olarak kaybetmeyelim).
 */
function refreshAllKybSlotPreviews(formData: Record<string, string>): void {
  for (const key of DOCUMENT_KEYS) {
    const url = (formData[key] || "").trim();
    if (url) updateKybSlotPreview(key, url);
  }
}

/**
 * Verified/Suspended status'larda SlotDropzone'un yükleme alanını gizler.
 * Preview kartı ve slot label görünür kalır — sadece "Tıkla veya sürükle" zone'u
 * kapatılır. Backend Verified KYB için resubmit'e izin vermediğinden 403 → login
 * redirect sorununu UI tarafında engelleriz.
 */
function applyKybSlotsReadOnlyState(status: string): void {
  const readOnly = status === "Verified" || status === "Suspended";
  for (const key of DOCUMENT_KEYS) {
    const slotCard = document.querySelector(`[data-slot-id="${key}"]`);
    if (!slotCard) continue;
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
}

Alpine.data("kybPage", () => ({
  loading: true,
  submitting: false,
  kybData: { exists: false } as KybData,
  formData: {
    company_title: "",
    business_type: "",
    authorized_person: "",
    tax_id_type: "",
    tax_id: "",
    tax_office: "",
    trade_registry_number: "",
    identity_document: "",
    imza_sirkuleri: "",
    ticaret_sicil_gazetesi: "",
    faaliyet_belgesi: "",
    vergi_levhasi: "",
    bank_account_document: "",
    document_expiry_date: "",
  } as Record<string, string>,
  // Init sonrası snapshot — değişiklik takibi için referans
  initialDocs: {} as Record<string, string>,

  // Hesaplananlar — UI binding'leri (template'lerden çağrılır)
  get isEditable(): boolean {
    // Sprint 2.6: Verified iken bile yeni eklenen opsiyonel alanlar (MERSİS, KEP)
    // doldurulabilmeli. Sadece Suspended hesap askıda iken kilitli.
    // Verified iken submit edilirse backend status'u korur.
    return this.kybData.status !== "Suspended";
  },
  get statusBadgeClass(): string {
    const map: Record<string, string> = {
      Verified: "bg-green-100 text-green-800",
      Rejected: "bg-red-100 text-red-800",
      "Under Review": "bg-blue-100 text-blue-800",
      Pending: "bg-yellow-100 text-yellow-800",
      Expired: "bg-orange-100 text-orange-800",
    };
    return map[this.kybData.status || ""] || "bg-gray-100 text-gray-800";
  },
  get statusBadgeIcon(): string {
    // Lucide SVG — emoji yasağı (memory: feedback_no_emoji)
    const map: Record<string, string> = {
      Verified: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
      Rejected: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
      "Under Review": `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
      Pending: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
      Suspended: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    };
    return map[this.kybData.status || ""] || "";
  },
  get statusBadgeLabel(): string {
    const map: Record<string, string> = {
      Verified: t("kyb.statusVerified"),
      Rejected: t("kyb.statusRejected"),
      "Under Review": t("kyb.statusUnderReview"),
      Pending: t("kyb.statusPending"),
      Expired: t("kyb.statusExpired"),
    };
    return map[this.kybData.status || ""] || t("kyb.statusNone");
  },
  get allDocumentsUploaded(): boolean {
    return DOCUMENT_KEYS.every((k) => (this.formData[k] || "").trim().length > 0);
  },
  get hasDocumentChanges(): boolean {
    return DOCUMENT_KEYS.some((k) => (this.formData[k] || "") !== (this.initialDocs[k] || ""));
  },
  get canSubmit(): boolean {
    if (this.submitting) return false;
    if (this.kybData.status === "Verified") return false;
    if (!(this.formData.company_title || "").trim()) return false;
    if (!this.allDocumentsUploaded) return false;
    // Rejected/Expired: yeniden inceleme için en az bir belge değişmeli
    if (this.kybData.status === "Rejected" || this.kybData.status === "Expired") {
      return this.hasDocumentChanges;
    }
    // Pending (ilk başvuru) / Under Review: ilk kez gönderme veya yine güncelleme
    return true;
  },
  get actionBarHint(): string {
    if (!this.allDocumentsUploaded) return t("kyb.hintMissingDocs");
    if (this.kybData.status === "Rejected" || this.kybData.status === "Expired") {
      return this.hasDocumentChanges ? t("kyb.hintReadyResubmit") : t("kyb.hintNeedDocChange");
    }
    return t("kyb.hintReady");
  },

  slotController: null as SlotDropzoneController | null,

  async init() {
    this.loading = true;
    try {
      const res = await api<{
        message: KybData & {
          tax_id_type?: string;
          tax_id?: string;
          tax_office?: string;
        };
      }>("/method/tradehub_core.api.v1.kyb.get_kyb_status");
      const data = res.message || ({ exists: false } as KybData);
      this.kybData = data;
      // formData'ya mevcut değerleri yükle
      const allKeys = Object.keys(this.formData);
      const dataAny = data as unknown as Record<string, unknown>;
      for (const k of allKeys) {
        const val = dataAny[k];
        if (typeof val === "string") {
          this.formData[k] = val;
        }
      }
      // Snapshot: hasDocumentChanges karşılaştırma için referans
      this.initialDocs = {};
      for (const k of DOCUMENT_KEYS) {
        this.initialDocs[k] = this.formData[k] || "";
      }
    } catch {
      this.kybData = { exists: false };
    } finally {
      this.loading = false;
    }

    // SlotDropzone mount — Alpine reactive olmayan DOM'a render eder.
    // kybData yüklendikten sonra (mevcut file URL'ler varsa preview etmek için)
    await new Promise((r) => requestAnimationFrame(r));
    const container = document.getElementById("kyb-document-slots");
    if (!container) return;

    const slots: SlotDef[] = KYB_DOCUMENT_FIELDS.map((f) => ({
      id: f.key,
      label: t(f.labelKey),
      required: f.required !== false,
      accept: ".pdf,.jpg,.jpeg,.png,.webp,.docx",
      maxFileSizeBytes: 10 * 1024 * 1024,
    }));

    this.slotController = new SlotDropzoneController({
      containerId: "kyb-document-slots",
      slots,
      autoUpload: true,
      autoCustomUploader: async (slotId, file) => {
        // KYB base64 + JSON akışı
        try {
          const filedata = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = () => reject(new Error("read_failed"));
            reader.readAsDataURL(file);
          });
          const res = await api<{ message: { success: boolean; file_url: string } }>(
            "/method/tradehub_core.api.v1.kyb.upload_kyb_document",
            {
              method: "POST",
              body: JSON.stringify({ filename: file.name, filedata, field: slotId }),
            }
          );
          return { success: true, fileUrl: res.message?.file_url || "" };
        } catch (err) {
          const msg = err instanceof Error ? err.message : t("kyb.errUploadFailed");
          return { success: false, error: msg };
        }
      },
      onSlotUploaded: (slotId, fileUrl) => {
        this.formData[slotId] = fileUrl;
        // Karma C: yeni dosya yüklenince ilgili slot preview'ını güncelle.
        updateKybSlotPreview(slotId, fileUrl);
      },
      onSlotUploadError: (_slotId, error) => {
        queueToast({ message: error || t("kyb.errUploadFailed"), type: "error", duration: 6000 });
      },
      onValidationError: (_slotId, _kind, file) => {
        queueToast({
          message: t("kyb.errTooLarge", { fileName: file.name }),
          type: "error",
          duration: 5000,
        });
      },
    });
    this.slotController.mount();

    // Karma C: mount sonrası, init'te yüklenen URL'ler için preview'ları render et.
    // SlotDropzone yeni mount edildi ve initial render bitti — DOM hazır.
    refreshAllKybSlotPreviews(this.formData);

    // Verified/Suspended → slot zone'ları gizle (resubmit 403'ü engellemek için)
    applyKybSlotsReadOnlyState(this.kybData.status || "");
  },

  startApplication() {
    // İlk başvuru — formu göster (kayıt henüz yok)
    this.kybData = {
      exists: true,
      status: "Pending", // UI'de status badge'i gösterir; backend'de yeni kayıt oluşur
    };
  },

  isImage(field: string): boolean {
    const url = this.formData[field] || "";
    const ext = url.split(".").pop()?.toLowerCase() || "";
    return ["jpg", "jpeg", "png", "webp", "gif"].includes(ext);
  },

  getFileName(field: string): string {
    const url = this.formData[field] || "";
    return decodeURIComponent(url.split("/").pop() || url);
  },

  openPreview(field: string) {
    const url = this.formData[field];
    if (url) window.open(url, "_blank");
  },

  async uploadDocument(field: string, event: Event, done: () => void) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      done();
      return;
    }

    // Pre-validation
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!["pdf", "jpg", "jpeg", "png", "webp", "docx"].includes(ext)) {
      queueToast({ message: t("kyb.errInvalidType"), type: "error", duration: 5000 });
      done();
      input.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      queueToast({ message: t("kyb.errTooLarge"), type: "error", duration: 5000 });
      done();
      input.value = "";
      return;
    }

    try {
      const filedata = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("read_failed"));
        reader.readAsDataURL(file);
      });

      const res = await api<{ message: { success: boolean; file_url: string } }>(
        "/method/tradehub_core.api.v1.kyb.upload_kyb_document",
        {
          method: "POST",
          body: JSON.stringify({ filename: file.name, filedata }),
        }
      );
      const url = res.message?.file_url || "";
      if (url) {
        this.formData[field] = url;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      queueToast({
        message: msg || t("kyb.errUploadFailed"),
        type: "error",
        duration: 6000,
      });
    } finally {
      done();
      input.value = "";
    }
  },

  async resubmit() {
    if (!this.canSubmit) return;
    this.submitting = true;
    try {
      const res = await api<{
        message: { success: boolean; status: string; resubmitted: boolean };
      }>("/method/tradehub_core.api.v1.kyb.submit_kyb_documents", {
        method: "POST",
        body: JSON.stringify(this.formData),
      });
      const result = res.message;
      // Yeni status'u fetch et (UI sayfasını fresh data ile yenile)
      await this.init();
      // Submit bitti, state'i temizle
      this.submitting = false;
      // Toast (queueToast non-blocking; init sonrası gösterilir, buton geri açılır)
      if (result?.resubmitted) {
        queueToast({ message: t("kyb.toastResubmitted"), type: "success", duration: 5000 });
      } else {
        queueToast({ message: t("kyb.toastSaved"), type: "success", duration: 5000 });
      }
    } catch (err) {
      // Frappe @rate_limit decorator → RateLimitError class fırlar
      if (err instanceof RateLimitError) {
        queueToast({ message: t("kyb.errRateLimit"), type: "warning", duration: 6000 });
      } else {
        const msg = err instanceof Error ? err.message : "";
        queueToast({
          message: msg || t("kyb.errSubmitFailed"),
          type: "error",
          duration: 6000,
        });
      }
      this.submitting = false;
    }
  },
}));
