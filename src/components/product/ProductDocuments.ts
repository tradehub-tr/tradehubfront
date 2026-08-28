/**
 * ProductDocuments — ilana eklenmiş dokümanlar bloğu (Task 5, 2026-08-27
 * dosya-yöneticisi-seo brief'i).
 *
 * `ProductCertificates.ts` ile AYNI desen: liste boşsa "" döner, blok DOM'a
 * hiç girmez. `ProductTabs.ts`'in "attributes" sekmesine, sertifikaların
 * hemen altına eklenir (`AttributesTabContent() + ProductCertificates() +
 * ProductDocuments()`).
 *
 * Güvenlik (brief'in "Not" bölümü): tüm görünür metinler `escapeHtml`'den,
 * bağlantı adresi `sanitizeUrl`'den geçiyor — admin panelinden gelen serbest
 * metin/URL, kullanıcı girdisi kadar güvenilmez sayılıyor.
 */

import { getCurrentProduct } from "../../alpine/product";
import { t } from "../../i18n";
import { escapeHtml, sanitizeUrl } from "../../utils/sanitize";
import { getLucideIcon } from "../icons/lucideIcons";

/**
 * `Listing Document.doc_type` — backend'in gönderdiği sabit Türkçe Select
 * değerleri (`tradehub_core/tradehub_core/tradehub_core/doctype/
 * listing_document/listing_document.json`). Dört dilde de doğru etiket
 * göstermek için i18n anahtarına eşleniyor; haritada olmayan/boş bir değer
 * ham haliyle basılır (backend'e yeni bir tür eklenirse sessizce kırılmaz).
 */
const DOC_TYPE_I18N_KEYS: Record<string, string> = {
  Katalog: "product.docTypeCatalog",
  Sertifika: "product.docTypeCertificate",
  Kılavuz: "product.docTypeManual",
  "Teknik Föy": "product.docTypeDatasheet",
  Diğer: "product.docTypeOther",
};

function docTypeLabel(docType: string): string {
  const key = DOC_TYPE_I18N_KEYS[docType];
  return key ? t(key) : docType;
}

function formatSize(bytes: number): string {
  if (!bytes || bytes <= 0) return "";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  const kb = bytes / 1024;
  return `${Math.max(1, Math.round(kb))} KB`;
}

export function ProductDocuments(): string {
  const docs = getCurrentProduct().documents ?? [];
  if (docs.length === 0) return "";

  const rows = docs
    .map((doc) => {
      // Boş/güvensiz URL (`sanitizeUrl` fallback `""`) → satır atlanır; indirme
      // adresi olmayan bir "doküman" listelenecek bir şey değil.
      const href = escapeHtml(sanitizeUrl(doc.url, ""));
      if (!href) return "";
      const title = escapeHtml(doc.title || doc.url.split("/").pop() || "");
      const metaParts = [docTypeLabel(doc.docType), formatSize(doc.sizeBytes)].filter(Boolean);
      const meta = escapeHtml(metaParts.join(" · "));
      return `
        <a
          href="${href}"
          target="_blank"
          rel="noopener noreferrer"
          class="th-no-press flex items-center gap-3 px-4 py-3 rounded-md border border-[var(--pd-spec-border,#e5e5e5)] hover:border-[var(--color-primary-500,#ff8600)] transition-colors"
        >
          ${getLucideIcon("file-text", "w-5 h-5 shrink-0 text-[#6b7280]")}
          <div class="min-w-0 flex-1">
            <div class="text-sm font-medium text-[#111827] truncate">${title}</div>
            ${meta ? `<div class="text-xs text-[#6b7280] mt-0.5">${meta}</div>` : ""}
          </div>
        </a>
      `;
    })
    .filter(Boolean)
    .join("");

  // Tüm satırlar güvensiz/boş URL yüzünden elendiyse blok da girmemeli.
  if (!rows) return "";

  return `
    <div id="pd-documents" class="relative mt-[32px] pt-[32px] border-t border-[#DDDDDD]">
      <div class="flex items-center gap-1.5 mb-[16px]">
        <span class="text-[18px] font-bold text-[#222222]" data-i18n="product.documents">${t("product.documents")}</span>
      </div>
      <div class="grid gap-2 sm:grid-cols-2">
        ${rows}
      </div>
    </div>
  `;
}
