/**
 * KYB Page Alpine State
 * Status fetch + belge yükleme + Yeniden Gönder akışı.
 *
 * Submit kuralları (backend'de uygulanır):
 *   - Sadece status="Rejected" iken belge değişikliğiyle Pending'e döner
 *   - Throttle: 5 dk'da 1 resubmit (rate_limit decorator)
 */

import Alpine from "alpinejs";
import { t } from "../i18n";
import { api, RateLimitError } from "../utils/api";
import { queueToast } from "../utils/toast";

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
    // Verified ise kullanıcı dokunmaz; diğer durumlarda düzenleyebilir
    return this.kybData.status !== "Verified";
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
    const map: Record<string, string> = {
      Verified: "✓",
      Rejected: "✗",
      "Under Review": "👁",
      Pending: "⏳",
      Expired: "⏱",
    };
    return map[this.kybData.status || ""] || "—";
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
    return DOCUMENT_KEYS.some(
      (k) => (this.formData[k] || "") !== (this.initialDocs[k] || "")
    );
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
      return this.hasDocumentChanges
        ? t("kyb.hintReadyResubmit")
        : t("kyb.hintNeedDocChange");
    }
    return t("kyb.hintReady");
  },

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
