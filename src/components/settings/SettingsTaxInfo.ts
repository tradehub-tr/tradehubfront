/**
 * SettingsTaxInfo Component
 * Turkish B2B tax information page with view/edit cards.
 * Sections: Tax Identity, Invoice Info, VAT Exemption, FAQ.
 */

import { t } from "../../i18n";
import {
  validateTCKN,
  validateVKN,
  TR_TAX_OFFICES,
  getCityForTaxOffice,
} from "../../utils/tr-validation";

// ── Icons ───────────────────────────────────────────────────────

const ICONS = {
  info: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#2563eb" stroke-width="1.2"/><path d="M8 7v4M8 5h0" stroke="#2563eb" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  identity: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="3" width="14" height="12" rx="2" stroke="#6366f1" stroke-width="1.3"/><path d="M2 7h14" stroke="#6366f1" stroke-width="1.3"/><circle cx="7" cy="11" r="1.5" fill="#6366f1"/><path d="M10 10h3M10 12.5h2" stroke="#6366f1" stroke-width="1.1" stroke-linecap="round"/></svg>`,
  invoice: `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M5 2h8a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V4a2 2 0 012-2z" stroke="#f59e0b" stroke-width="1.3"/><path d="M6 6h6M6 9h6M6 12h3" stroke="#f59e0b" stroke-width="1.3" stroke-linecap="round"/></svg>`,
  edit: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M10.5 1.5l2 2L4.5 11.5H2.5v-2l8-8z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

// ── Data Model ──────────────────────────────────────────────────

interface TaxInfoData {
  taxpayer_type: "individual" | "corporate";
  tax_id: string;
  tax_office: string;
  city: string;
  trade_name: string;
  verification_status: "verified" | "pending" | "not_verified";
  invoice_address: string;
  e_invoice_registered: boolean;
  invoice_type_preference: "e_fatura" | "e_arsiv";
}

const EMPTY_DATA: TaxInfoData = {
  taxpayer_type: "corporate",
  tax_id: "",
  tax_office: "",
  city: "",
  trade_name: "",
  verification_status: "not_verified",
  invoice_address: "",
  e_invoice_registered: false,
  invoice_type_preference: "e_arsiv",
};

// ── Helpers ─────────────────────────────────────────────────────

function viewRow(label: string, value: string): string {
  return `
    <div class="flex items-start gap-4 py-2 max-sm:flex-col max-sm:gap-0.5">
      <span class="w-[200px] max-sm:w-full flex-shrink-0 text-[13px]" style="color:var(--color-text-tertiary)">${label}</span>
      <span class="text-sm" style="color:var(--color-text-primary)">${value || "—"}</span>
    </div>
  `;
}

function statusBadge(status: TaxInfoData["verification_status"]): string {
  const map = {
    verified: { label: t("settings.statusVerified"), color: "#16a34a", bg: "#f0fdf4" },
    pending: { label: t("settings.statusPending"), color: "#d97706", bg: "#fffbeb" },
    not_verified: { label: t("settings.statusNotVerified"), color: "#dc2626", bg: "#fef2f2" },
  };
  const s = map[status];
  return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style="background:${s.bg};color:${s.color}">${s.label}</span>`;
}

function taxOfficeOptions(selected: string): string {
  return ["", ...TR_TAX_OFFICES]
    .map(
      (o) =>
        `<option value="${o}" ${o === selected ? "selected" : ""}>${o || `-- ${t("settings.taxOfficePlaceholder")} --`}</option>`
    )
    .join("");
}

// ── Card Renderer (matches SettingsAccountEdit pattern) ─────────

function renderCard(
  cardId: string,
  title: string,
  icon: string,
  viewHtml: string,
  editHtml: string | null,
  hint?: string
): string {
  return `
    <div class="bg-white rounded-lg overflow-hidden" id="card-${cardId}">
      <div class="flex items-center justify-between p-6 max-sm:p-4 pb-0">
        <h3 class="text-base font-semibold m-0 flex items-center gap-2" style="color:var(--color-text-primary)">
          ${icon} ${title}
        </h3>
        ${
          editHtml !== null
            ? `
          <button class="card-edit-btn inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 cursor-pointer transition-all hover:bg-gray-50" style="color:var(--color-text-secondary)" data-card="${cardId}" title="${t("common.edit")}">
            ${ICONS.edit}
          </button>
        `
            : ""
        }
      </div>
      ${hint ? `<div class="mx-6 max-sm:mx-4 mt-3 flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-[13px] text-blue-700"><span class="flex-shrink-0 mt-0.5">${ICONS.info}</span><span>${hint}</span></div>` : ""}
      <div class="p-6 max-sm:p-4" id="card-${cardId}-view">${viewHtml}</div>
      ${
        editHtml !== null
          ? `
        <div class="p-6 max-sm:p-4 hidden" id="card-${cardId}-edit">
          ${editHtml}
          <div class="pt-4 mt-4 border-t border-gray-100 flex items-center gap-3 max-sm:flex-col">
            <button class="th-btn px-6 max-sm:w-full card-save-btn" type="button" data-card="${cardId}">${t("common.save") || "Kaydet"}</button>
            <button class="text-[13px] font-medium bg-none border-none cursor-pointer hover:underline card-cancel-btn" style="color:var(--color-text-secondary)" type="button" data-card="${cardId}">${t("common.cancel") || "Vazgeç"}</button>
          </div>
          <div class="mt-3 text-sm hidden card-message" data-card="${cardId}"></div>
        </div>
      `
          : ""
      }
    </div>
  `;
}

// ── Section 1: Tax Identity ─────────────────────────────────────

function taxIdentityView(d: TaxInfoData): string {
  const typeLabel =
    d.taxpayer_type === "corporate"
      ? t("settings.taxpayerCorporate")
      : t("settings.taxpayerIndividual");
  const idLabel =
    d.taxpayer_type === "corporate" ? t("settings.taxIdLabelVKN") : t("settings.taxIdLabelTCKN");
  let html = `
    <div class="flex items-center justify-between mb-3">
      <span></span>
      ${statusBadge(d.verification_status)}
    </div>
  `;
  html += viewRow(t("settings.taxpayerTypeLabel"), typeLabel);
  html += viewRow(idLabel, d.tax_id);
  html += viewRow(t("settings.taxTaxOffice"), d.tax_office);
  html += viewRow(t("settings.taxCity"), d.city);
  if (d.taxpayer_type === "corporate") {
    html += viewRow(t("settings.tradeNameLabel"), d.trade_name);
  }
  return html;
}

function taxIdentityEdit(d: TaxInfoData): string {
  const isCorp = d.taxpayer_type === "corporate";
  const idLabel = isCorp ? t("settings.taxIdLabelVKN") : t("settings.taxIdLabelTCKN");
  const maxLen = isCorp ? 10 : 11;

  return `
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="sm:col-span-2">
        <label class="block text-[13px] font-medium mb-1.5" style="color:var(--color-text-secondary)">${t("settings.taxpayerTypeLabel")}</label>
        <div class="flex items-center gap-6">
          <label class="flex items-center gap-2 cursor-pointer text-sm">
            <input type="radio" name="taxpayer_type" value="individual" data-field="taxpayer_type" ${!isCorp ? "checked" : ""} class="accent-[var(--color-primary-500)]" />
            ${t("settings.taxpayerIndividual")}
          </label>
          <label class="flex items-center gap-2 cursor-pointer text-sm">
            <input type="radio" name="taxpayer_type" value="corporate" data-field="taxpayer_type" ${isCorp ? "checked" : ""} class="accent-[var(--color-primary-500)]" />
            ${t("settings.taxpayerCorporate")}
          </label>
        </div>
      </div>

      <div>
        <label class="block text-[13px] font-medium mb-1.5 tax-id-label" style="color:var(--color-text-secondary)">${idLabel} *</label>
        <input type="text" class="th-input th-input-md w-full" data-field="tax_id" value="${d.tax_id}" maxlength="${maxLen}" inputmode="numeric" pattern="[0-9]*" required />
        <p class="text-xs text-red-500 mt-1 hidden tax-id-error"></p>
      </div>

      <div>
        <label class="block text-[13px] font-medium mb-1.5" style="color:var(--color-text-secondary)">${t("settings.taxTaxOffice")} *</label>
        <select class="th-input th-input-md w-full" data-field="tax_office">
          ${taxOfficeOptions(d.tax_office)}
        </select>
      </div>

      <div>
        <label class="block text-[13px] font-medium mb-1.5" style="color:var(--color-text-secondary)">${t("settings.taxCity")}</label>
        <input type="text" class="th-input th-input-md w-full bg-gray-50" data-field="city" value="${d.city}" readonly />
      </div>

      <div class="trade-name-field" ${!isCorp ? 'style="display:none"' : ""}>
        <label class="block text-[13px] font-medium mb-1.5" style="color:var(--color-text-secondary)">${t("settings.tradeNameLabel")}</label>
        <input type="text" class="th-input th-input-md w-full" data-field="trade_name" value="${d.trade_name}" placeholder="${t("settings.tradeNamePlaceholder")}" />
      </div>
    </div>
  `;
}

// ── Section 2: Invoice Info ─────────────────────────────────────

function invoiceInfoView(d: TaxInfoData): string {
  const eStatus = d.e_invoice_registered
    ? t("settings.eInvoiceRegistered")
    : t("settings.eInvoiceNotRegistered");
  const invoiceType =
    d.invoice_type_preference === "e_fatura"
      ? t("settings.invoiceTypeEFatura")
      : t("settings.invoiceTypeEArsiv");
  let html = "";
  html += viewRow(t("settings.invoiceAddressLabel"), d.invoice_address);
  html += viewRow(t("settings.eInvoiceStatusLabel"), eStatus);
  html += viewRow(t("settings.invoiceTypeLabel"), invoiceType);
  return html;
}

function invoiceInfoEdit(d: TaxInfoData): string {
  return `
    <div class="flex flex-col gap-4">
      <div>
        <label class="block text-[13px] font-medium mb-1.5" style="color:var(--color-text-secondary)">${t("settings.invoiceAddressLabel")}</label>
        <textarea class="th-input th-input-md w-full min-h-[80px]" data-field="invoice_address" placeholder="${t("settings.invoiceAddressPlaceholder")}">${d.invoice_address}</textarea>
      </div>

      <div>
        <label class="block text-[13px] font-medium mb-1.5" style="color:var(--color-text-secondary)">${t("settings.eInvoiceStatusLabel")}</label>
        <div class="flex items-center gap-6">
          <label class="flex items-center gap-2 cursor-pointer text-sm">
            <input type="radio" name="e_invoice" value="true" data-field="e_invoice_registered" ${d.e_invoice_registered ? "checked" : ""} class="accent-[var(--color-primary-500)]" />
            ${t("settings.eInvoiceRegistered")}
          </label>
          <label class="flex items-center gap-2 cursor-pointer text-sm">
            <input type="radio" name="e_invoice" value="false" data-field="e_invoice_registered" ${!d.e_invoice_registered ? "checked" : ""} class="accent-[var(--color-primary-500)]" />
            ${t("settings.eInvoiceNotRegistered")}
          </label>
        </div>
      </div>

      <div>
        <label class="block text-[13px] font-medium mb-1.5" style="color:var(--color-text-secondary)">${t("settings.invoiceTypeLabel")}</label>
        <div class="flex items-center gap-6">
          <label class="flex items-center gap-2 cursor-pointer text-sm">
            <input type="radio" name="invoice_type" value="e_fatura" data-field="invoice_type_preference" ${d.invoice_type_preference === "e_fatura" ? "checked" : ""} class="accent-[var(--color-primary-500)]" />
            ${t("settings.invoiceTypeEFatura")}
          </label>
          <label class="flex items-center gap-2 cursor-pointer text-sm">
            <input type="radio" name="invoice_type" value="e_arsiv" data-field="invoice_type_preference" ${!d.invoice_type_preference || d.invoice_type_preference === "e_arsiv" ? "checked" : ""} class="accent-[var(--color-primary-500)]" />
            ${t("settings.invoiceTypeEArsiv")}
          </label>
        </div>
      </div>
    </div>
  `;
}

// ── Section 3: FAQ ──────────────────────────────────────────────

interface FaqItem {
  title: string;
  description: string;
  linkText?: string;
}

function renderFaqCard(faq: FaqItem): string {
  return `
    <div class="p-5 max-sm:p-4 border border-border-default rounded-lg">
      <h4 class="text-sm max-sm:text-[13px] font-bold mb-2 m-0" style="color:var(--color-text-primary)">${faq.title}</h4>
      <p class="text-[13px] max-sm:text-xs leading-normal mb-2 m-0" style="color:var(--color-text-secondary)">${faq.description}</p>
      ${faq.linkText ? `<a href="#" class="text-[13px] max-sm:text-xs text-blue-600 underline">${faq.linkText}</a>` : ""}
    </div>
  `;
}

function getFaqItems(): FaqItem[] {
  return [
    {
      title: t("settings.faqTaxIdTitle"),
      description: t("settings.faqTaxIdDesc"),
      linkText: t("settings.faqTaxIdLink"),
    },
    {
      title: t("settings.faqEInvoiceTitle"),
      description: t("settings.faqEInvoiceDesc"),
      linkText: t("settings.faqEInvoiceLink"),
    },
    {
      title: t("settings.faqInvoiceTitle"),
      description: t("settings.faqInvoiceDesc"),
      linkText: t("settings.faqInvoiceLink"),
    },
  ];
}

// ── Main Content Builder ────────────────────────────────────────

function buildContent(data: TaxInfoData): string {
  const faqItems = getFaqItems();

  return `
    <div class="bg-white rounded-lg p-8 max-md:p-5 max-sm:p-3.5">
      <h2 class="text-xl max-sm:text-lg font-bold mb-5 m-0" style="color:var(--color-text-primary)">${t("settings.taxInfoTitle")}</h2>

      <div class="flex border-b-2 border-border-default mb-5">
        <button class="tax-info__tab py-2.5 px-5 max-sm:px-3 text-sm max-sm:text-[13px] font-medium bg-none border-none border-b-2 -mb-[2px] cursor-pointer transition-all" style="color:var(--color-text-primary); border-bottom-color:var(--color-text-primary)" data-tab="vergi">${t("settings.taxInfoTab")}</button>
      </div>

      <div class="flex items-start gap-2.5 py-3 px-4 max-sm:px-3 bg-blue-50 rounded-md text-[13px] max-sm:text-xs text-blue-800 mb-6 max-sm:mb-4">
        <span class="flex-shrink-0 mt-0.5">${ICONS.info}</span>
        <div class="flex-1 min-w-0">
          <span>${t("settings.taxBannerText")}</span>
          <a href="#" class="text-blue-600 font-medium no-underline hover:underline ml-1">${t("settings.taxBannerLink")}</a>
        </div>
      </div>

      <div class="flex flex-col gap-5" id="tax-tab-vergi">
        ${renderCard("tax-identity", t("settings.taxIdentityTitle"), ICONS.identity, taxIdentityView(data), taxIdentityEdit(data))}
        ${renderCard("invoice-info", t("settings.invoiceInfoTitle"), ICONS.invoice, invoiceInfoView(data), invoiceInfoEdit(data))}

        <h3 class="text-lg max-sm:text-base font-bold mt-3 mb-1 m-0" style="color:var(--color-text-primary)">${t("settings.faqTitle")}</h3>
        <div class="grid grid-cols-3 gap-4 max-lg:grid-cols-2 max-md:grid-cols-1 max-sm:gap-3">
          ${faqItems.map(renderFaqCard).join("")}
        </div>
      </div>

    </div>
  `;
}

// ── Exported Render ─────────────────────────────────────────────

export function SettingsTaxInfo(): string {
  return `<div id="tax-info-root">${buildContent({ ...EMPTY_DATA })}</div>`;
}

// ── Init & Event Binding ────────────────────────────────────────

export function initSettingsTaxInfo(): void {
  const rootEl = document.getElementById("tax-info-root");
  if (!rootEl) return;
  const root = rootEl;

  const current: TaxInfoData = { ...EMPTY_DATA };

  function render(): void {
    root.innerHTML = buildContent(current);
    bindEvents();
  }

  function showCardMessage(cardId: string, text: string, isError: boolean): void {
    const msgEl = root.querySelector<HTMLElement>(`.card-message[data-card="${cardId}"]`);
    if (!msgEl) return;
    msgEl.textContent = text;
    msgEl.style.color = isError ? "#dc2626" : "#16a34a";
    msgEl.classList.remove("hidden");
    setTimeout(() => msgEl.classList.add("hidden"), 4000);
  }

  function collectCardData(cardId: string): Record<string, string> {
    const editEl = document.getElementById(`card-${cardId}-edit`);
    if (!editEl) return {};
    const data: Record<string, string> = {};
    editEl
      .querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("[data-field]")
      .forEach((el) => {
        const field = el.dataset.field!;
        if (el instanceof HTMLInputElement && el.type === "radio") {
          if (el.checked) data[field] = el.value;
        } else {
          data[field] = el.value;
        }
      });
    return data;
  }

  function toggleCard(cardId: string, showEdit: boolean): void {
    const viewEl = document.getElementById(`card-${cardId}-view`);
    const editEl = document.getElementById(`card-${cardId}-edit`);
    if (viewEl) viewEl.classList.toggle("hidden", showEdit);
    if (editEl) editEl.classList.toggle("hidden", !showEdit);
  }

  function bindEvents(): void {
    // Tab switching
    root.querySelectorAll<HTMLButtonElement>(".tax-info__tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        root.querySelectorAll<HTMLButtonElement>(".tax-info__tab").forEach((t) => {
          t.style.color = "var(--color-text-secondary)";
          t.style.borderBottomColor = "transparent";
        });
        tab.style.color = "var(--color-text-primary)";
        tab.style.borderBottomColor = "var(--color-text-primary)";
      });
    });

    // Edit buttons
    root.querySelectorAll<HTMLButtonElement>(".card-edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const cardId = btn.dataset.card!;
        toggleCard(cardId, true);
      });
    });

    // Cancel buttons
    root.querySelectorAll<HTMLButtonElement>(".card-cancel-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const cardId = btn.dataset.card!;
        toggleCard(cardId, false);
      });
    });

    // Save buttons
    root.querySelectorAll<HTMLButtonElement>(".card-save-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const cardId = btn.dataset.card!;

        if (cardId === "tax-identity") {
          saveTaxIdentity(cardId);
        } else if (cardId === "invoice-info") {
          saveInvoiceInfo(cardId);
        }
      });
    });

    // Taxpayer type radio change
    const taxIdentityEdit = document.getElementById("card-tax-identity-edit");
    if (taxIdentityEdit) {
      taxIdentityEdit
        .querySelectorAll<HTMLInputElement>('input[name="taxpayer_type"]')
        .forEach((radio) => {
          radio.addEventListener("change", () => {
            const isCorp = radio.value === "corporate";
            const tradeNameField = taxIdentityEdit.querySelector<HTMLElement>(".trade-name-field");
            const taxIdInput =
              taxIdentityEdit.querySelector<HTMLInputElement>('[data-field="tax_id"]');
            const taxIdLabel = taxIdentityEdit.querySelector<HTMLElement>(".tax-id-label");

            if (tradeNameField) tradeNameField.style.display = isCorp ? "" : "none";
            if (taxIdInput) taxIdInput.maxLength = isCorp ? 10 : 11;
            if (taxIdLabel)
              taxIdLabel.textContent =
                (isCorp ? t("settings.taxIdLabelVKN") : t("settings.taxIdLabelTCKN")) + " *";
          });
        });

      // Tax office change → auto-fill city
      const taxOfficeSelect = taxIdentityEdit.querySelector<HTMLSelectElement>(
        '[data-field="tax_office"]'
      );
      const cityInput = taxIdentityEdit.querySelector<HTMLInputElement>('[data-field="city"]');
      if (taxOfficeSelect && cityInput) {
        taxOfficeSelect.addEventListener("change", () => {
          const city = getCityForTaxOffice(taxOfficeSelect.value);
          if (city) cityInput.value = city;
        });
      }
    }
  }

  function saveTaxIdentity(cardId: string): void {
    const data = collectCardData(cardId);
    const isCorp = data.taxpayer_type === "corporate";

    // Validate tax_id
    if (!data.tax_id?.trim()) {
      showCardMessage(cardId, t("settings.taxIdRequired"), true);
      return;
    }

    if (isCorp) {
      if (!validateVKN(data.tax_id)) {
        showCardMessage(cardId, t("settings.invalidVKN"), true);
        return;
      }
    } else {
      if (!validateTCKN(data.tax_id)) {
        showCardMessage(cardId, t("settings.invalidTCKN"), true);
        return;
      }
    }

    // Validate tax_office
    if (!data.tax_office?.trim()) {
      showCardMessage(cardId, t("settings.taxOfficeRequired"), true);
      return;
    }

    // Apply to current data
    current.taxpayer_type = data.taxpayer_type as TaxInfoData["taxpayer_type"];
    current.tax_id = data.tax_id;
    current.tax_office = data.tax_office;
    current.city = data.city || getCityForTaxOffice(data.tax_office) || "";
    current.trade_name = isCorp ? data.trade_name || "" : "";

    showCardMessage(cardId, t("settings.taxInfoSaved"), false);
    setTimeout(() => {
      render();
    }, 1500);
  }

  function saveInvoiceInfo(cardId: string): void {
    const data = collectCardData(cardId);

    current.invoice_address = data.invoice_address || "";
    current.e_invoice_registered = data.e_invoice_registered === "true";
    current.invoice_type_preference =
      (data.invoice_type_preference as TaxInfoData["invoice_type_preference"]) || "e_arsiv";

    showCardMessage(cardId, t("settings.invoiceInfoSaved"), false);
    setTimeout(() => {
      render();
    }, 1500);
  }

  // Initial bind
  bindEvents();
}
