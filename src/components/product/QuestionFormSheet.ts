/**
 * QuestionFormSheet — mobil ürün detay "Soru gönder" tam ekran formu (Faz 4).
 *
 * Yeni bir sohbet/soru altyapısı YOK — form gönderimi mevcut chat popup'ı
 * (`chat-popup:open` event'i) `initialMessage`/`initialFile` ile açar; mesaj
 * normal bir chat mesajı olarak backend'e gider (bkz. alpine/chatPopup.ts).
 *
 * Alt bardaki "Soru gönder" butonu (#pdm-bar-ask) bu sheet'i açar.
 */

import { getCurrentProduct } from "../../alpine/product";
import { t } from "../../i18n";
import { escapeHtml } from "../../utils/sanitize";
import { isLoggedIn } from "../../utils/auth";
import { openLoginModal } from "./LoginModal";
import { getSelectionSummary } from "./OptionsSheet";
import { buildPinnedProduct } from "../chat-popup/chatTriggerAttrs";
import { acquireScrollLock, releaseScrollLock } from "../../utils/scrollLock";

const FORM_ID = "pdmqf-form";
const MAX_LEN = 8000;

const closeSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>`;
const chevronSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`;
const paperclipSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>`;

/* ── State (tek instance — module-scoped) ─────────────────────────── */

let selectedFile: File | null = null;
/** init() içinde textarea'nın başlangıç değerinden okunur; kapanış onayı
 *  ve reset bunu referans alır. */
let initialMessage = "";

/* ── Public HTML ──────────────────────────────────────────────────── */

export function QuestionFormSheet(): string {
  const defaultMessage = t("product.questionDefaultMessage");

  return `
    <div id="${FORM_ID}" class="pdmqf-hidden [&.pdmqf-hidden]:hidden fixed inset-0 z-[215] bg-surface-raised flex flex-col translate-y-full transition-transform duration-300 [cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none motion-reduce:translate-y-0 [&.pdmqf-visible]:translate-y-0"
      role="dialog" aria-modal="true" aria-label="${t("product.questionFormTitle")}" aria-hidden="true">
      <div class="h-[52px] shrink-0 flex items-center gap-2.5 px-3.5 bg-surface border-b border-border-default">
        <button type="button" id="pdmqf-close" class="th-no-press appearance-none focus:outline-none w-8 h-8 flex items-center justify-center text-text-body" aria-label="${t("prodUi.close")}">${closeSvg}</button>
        <h2 class="flex-1 text-center text-base font-bold text-text-heading me-8">${t("product.questionFormTitle")}</h2>
      </div>

      <div class="flex-1 overflow-y-auto p-3.5">
        <label for="pdmqf-textarea" class="block text-[13px] font-semibold text-text-heading mb-2">
          <em class="not-italic text-red-600">*</em> ${t("product.questionDetailsLabel")}
        </label>
        <textarea id="pdmqf-textarea" maxlength="${MAX_LEN}" rows="6"
          class="w-full min-h-40 rounded-md border-none bg-surface p-3.5 text-sm text-text-body resize-y focus:outline focus:outline-2 focus:outline-[rgba(204,153,0,0.35)]"
        >${escapeHtml(defaultMessage)}</textarea>
        <div class="text-end text-[11.5px] text-text-tertiary tabular-nums mt-1.5 mb-3.5"><span id="pdmqf-count">0</span>/${MAX_LEN}</div>

        <div class="bg-surface rounded-md p-3.5 mb-3">
          <button type="button" id="pdmqf-qty-toggle" class="th-no-press appearance-none focus:outline-none w-full flex items-center justify-between text-sm font-bold text-text-heading [&.pdmqf-qty-open_svg]:rotate-180">
            <span>${t("product.questionQuantitySummary")}</span>
            ${chevronSvg}
          </button>
          <div id="pdmqf-qty-body" class="hidden pt-2.5 text-[13px] text-text-secondary space-y-1"></div>
        </div>

        <div class="bg-surface rounded-md p-3.5 flex items-center gap-2.5">
          <button type="button" id="pdmqf-file-trigger" class="th-no-press appearance-none focus:outline-none flex items-center gap-2 flex-1 min-w-0 text-start text-[13px] font-medium text-text-secondary">
            ${paperclipSvg}
            <span id="pdmqf-file-label" class="truncate">${escapeHtml(t("product.attachFilePrompt"))}</span>
          </button>
          <button type="button" id="pdmqf-file-remove" class="th-no-press hidden appearance-none focus:outline-none w-7 h-7 shrink-0 flex items-center justify-center text-text-tertiary" aria-label="${t("common.clear")}">${closeSvg}</button>
          <input type="file" id="pdmqf-file-input" accept="image/*,application/pdf" class="hidden" />
        </div>
      </div>

      <div class="shrink-0 p-3.5 pb-4 bg-surface border-t border-border-default">
        <button type="button" id="pdmqf-send" class="th-btn w-full h-[46px] rounded-full text-[15px] disabled:opacity-45" disabled>${t("messages.send")}</button>
      </div>

      <!-- Ayrılma onayı -->
      <div id="pdmqf-dlg" class="hidden fixed inset-0 z-10 bg-black/45 items-center justify-center p-7" role="dialog" aria-modal="true" aria-label="${t("product.leaveFormConfirm")}">
        <div class="bg-surface rounded-md p-5 pb-3 max-w-[300px] shadow-modal">
          <p class="text-[14.5px] font-semibold leading-relaxed text-text-heading">${escapeHtml(t("product.leaveFormConfirm"))}</p>
          <div class="flex justify-end gap-5 mt-4">
            <button type="button" id="pdmqf-dlg-no" class="th-no-press appearance-none focus:outline-none text-sm font-bold text-[#b45309] py-2">${t("common.no")}</button>
            <button type="button" id="pdmqf-dlg-yes" class="th-no-press appearance-none focus:outline-none text-sm font-bold text-[#b45309] py-2">${t("common.yes")}</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ── DOM helpers ──────────────────────────────────────────────────── */

function els() {
  return {
    form: document.getElementById(FORM_ID),
    textarea: document.getElementById("pdmqf-textarea") as HTMLTextAreaElement | null,
    count: document.getElementById("pdmqf-count"),
    send: document.getElementById("pdmqf-send") as HTMLButtonElement | null,
    dlg: document.getElementById("pdmqf-dlg"),
    fileInput: document.getElementById("pdmqf-file-input") as HTMLInputElement | null,
    fileLabel: document.getElementById("pdmqf-file-label"),
    fileRemove: document.getElementById("pdmqf-file-remove"),
    qtyBody: document.getElementById("pdmqf-qty-body"),
    qtyToggle: document.getElementById("pdmqf-qty-toggle"),
  };
}

function isVisible(): boolean {
  return !!document.getElementById(FORM_ID)?.classList.contains("pdmqf-visible");
}

function hasChanges(): boolean {
  const { textarea } = els();
  return (textarea ? textarea.value !== initialMessage : false) || selectedFile !== null;
}

function updateCharCount(): void {
  const { textarea, count, send } = els();
  if (!textarea) return;
  if (count) count.textContent = String(textarea.value.length);
  if (send) send.disabled = textarea.value.trim().length === 0;
}

function renderQtySummary(): void {
  const { qtyBody } = els();
  if (!qtyBody) return;
  const rows = getSelectionSummary();
  if (rows.length === 0) {
    qtyBody.innerHTML = `<div>${t("product.noSelectionYet")}</div>`;
    return;
  }
  const unit = getCurrentProduct().unit || t("common.unit");
  qtyBody.innerHTML = rows
    .map((r) => `<div>${escapeHtml(r.label)} — ${r.qty} ${escapeHtml(unit)}</div>`)
    .join("");
}

function clearSelectedFile(): void {
  selectedFile = null;
  const { fileInput, fileLabel, fileRemove } = els();
  if (fileInput) fileInput.value = "";
  if (fileLabel) fileLabel.textContent = t("product.attachFilePrompt");
  fileRemove?.classList.add("hidden");
}

function resetFormFields(): void {
  const { textarea } = els();
  if (textarea) textarea.value = initialMessage;
  updateCharCount();
  clearSelectedFile();
}

/* ── Open / close ─────────────────────────────────────────────────── */

function openForm(): void {
  const { form } = els();
  if (!form) return;
  renderQtySummary();
  form.classList.remove("pdmqf-hidden");
  form.setAttribute("aria-hidden", "false");
  acquireScrollLock();
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      form.classList.add("pdmqf-visible");
      document.getElementById("pdmqf-close")?.focus();
    })
  );
}

function closeForm(): void {
  const { form } = els();
  if (!form) return;
  form.classList.remove("pdmqf-visible");
  form.setAttribute("aria-hidden", "true");
  releaseScrollLock();
  hideLeaveDialog();
  const onEnd = () => form.classList.add("pdmqf-hidden");
  form.addEventListener("transitionend", onEnd, { once: true });
  setTimeout(onEnd, 320);
}

function showLeaveDialog(): void {
  els().dlg?.classList.replace("hidden", "flex");
}

function hideLeaveDialog(): void {
  els().dlg?.classList.replace("flex", "hidden");
}

function isLeaveDialogVisible(): boolean {
  return !els().dlg?.classList.contains("hidden");
}

/** X / ESC — değişiklik varsa ayrılma onayı ister, yoksa doğrudan kapanır. */
function requestClose(): void {
  if (hasChanges()) {
    showLeaveDialog();
  } else {
    closeForm();
  }
}

/* ── Send flow ────────────────────────────────────────────────────── */

function dispatchChatOpen(text: string): void {
  const p = getCurrentProduct();
  window.dispatchEvent(
    new CustomEvent("chat-popup:open", {
      detail: {
        sellerId: p.supplier?.id || undefined,
        pinnedProduct: buildPinnedProduct(p),
        initialMessage: text,
        initialFile: selectedFile ?? undefined,
      },
    })
  );
  closeForm();
  resetFormFields();
}

function onLoginSuccess(): void {
  // Kullanıcı login modalını doldurmadan kapatıp sonradan başka bir yerden
  // giriş yaparsa sürpriz mesaj gönderilmesin — form hâlâ açıksa devam et
  // (bkz. OptionsSheet.onOrderLoginSuccess aynı guard deseni).
  if (!isVisible()) return;
  const { textarea } = els();
  const text = textarea?.value.trim();
  if (text) dispatchChatOpen(text);
}

function handleSend(): void {
  const { textarea } = els();
  const text = textarea?.value.trim();
  if (!text) return;

  if (!isLoggedIn()) {
    openLoginModal();
    window.removeEventListener("login-success", onLoginSuccess);
    window.addEventListener("login-success", onLoginSuccess, { once: true });
    return;
  }
  dispatchChatOpen(text);
}

/* ── Init ─────────────────────────────────────────────────────────── */

export function initQuestionFormSheet(): void {
  const { form, textarea } = els();
  if (!form || !textarea) return;

  initialMessage = textarea.value;
  updateCharCount();

  document.getElementById("pdm-bar-ask")?.addEventListener("click", openForm);
  document.getElementById("pdmqf-close")?.addEventListener("click", requestClose);
  document.getElementById("pdmqf-send")?.addEventListener("click", handleSend);
  textarea.addEventListener("input", updateCharCount);

  document.getElementById("pdmqf-qty-toggle")?.addEventListener("click", () => {
    const { qtyBody, qtyToggle } = els();
    qtyBody?.classList.toggle("hidden");
    qtyToggle?.classList.toggle("pdmqf-qty-open");
  });

  document.getElementById("pdmqf-file-trigger")?.addEventListener("click", () => {
    els().fileInput?.click();
  });
  document.getElementById("pdmqf-file-input")?.addEventListener("change", (e) => {
    const file = (e.target as HTMLInputElement).files?.[0] ?? null;
    selectedFile = file;
    if (!file) return clearSelectedFile();
    const { fileLabel, fileRemove } = els();
    if (fileLabel) fileLabel.textContent = file.name;
    fileRemove?.classList.remove("hidden");
  });
  document.getElementById("pdmqf-file-remove")?.addEventListener("click", (e) => {
    e.stopPropagation();
    clearSelectedFile();
  });

  document.getElementById("pdmqf-dlg-no")?.addEventListener("click", hideLeaveDialog);
  document.getElementById("pdmqf-dlg-yes")?.addEventListener("click", () => {
    closeForm();
    resetFormFields();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (isLeaveDialogVisible()) {
      hideLeaveDialog();
    } else if (isVisible()) {
      requestClose();
    }
  });
}
