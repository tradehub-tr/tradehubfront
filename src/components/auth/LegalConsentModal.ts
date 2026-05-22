/**
 * LegalConsentModal
 * Hesap oluşturma formundaki "Kullanım Koşulları" ve "Gizlilik Politikası"
 * onay checkbox'larında turuncu metne tıklayınca açılan popup.
 *
 * Promise tabanlı API: open() çağrısı modal kapanana kadar resolve olmaz.
 *   true  → "Kabul Et" basıldı
 *   false → "Reddet", X, backdrop click veya Esc
 *
 * Kabul Et / Reddet butonları kullanıcı içeriği sonuna kadar okuyana kadar
 * gizli kalır; scroll bottom'a yaklaşınca yerlerine hint metni yerine butonlar
 * görünür olur.
 */

import { t } from "../../i18n";
import { termsContent, privacyContent } from "../../data/legalContent";
import type { LegalSection } from "../legal/LegalPageLayout";

export type LegalConsentKind = "terms" | "privacy";

const MODAL_ID = "legal-consent-modal";
const SCROLL_BOTTOM_TOLERANCE = 16; // px — son satır underflow için

let pendingResolve: ((accepted: boolean) => void) | null = null;

/* ── HTML ────────────────────────────────────────────── */

export function LegalConsentModal(): string {
  return `
    <div
      id="${MODAL_ID}"
      class="fixed inset-0 z-[70] hidden items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-consent-title"
    >
      <div class="flex w-full max-w-[720px] max-h-[90vh] flex-col overflow-hidden rounded-md bg-white shadow-xl max-sm:max-h-full max-sm:rounded-none">
        <header class="flex items-center justify-between gap-4 border-b border-gray-200 px-6 py-4">
          <h2 id="legal-consent-title" class="text-base font-semibold text-gray-900 sm:text-lg"></h2>
          <button
            type="button"
            data-legal-consent-action="dismiss"
            class="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            aria-label="${t("common.close") || "Kapat"}"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </header>

        <div
          id="legal-consent-body"
          class="flex-1 overflow-y-auto px-6 py-5 text-sm leading-relaxed text-gray-700"
        ></div>

        <footer class="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 min-h-[64px]">
          <div
            id="legal-consent-actions"
            class="hidden gap-2 sm:gap-3 sm:items-center"
          >
            <button
              type="button"
              data-legal-consent-action="reject"
              class="th-btn-outline px-5 py-2 text-sm font-medium"
            >${t("auth.legalConsent.reject")}</button>
            <button
              type="button"
              data-legal-consent-action="accept"
              class="th-btn px-5 py-2 text-sm font-semibold"
            >${t("auth.legalConsent.accept")}</button>
          </div>
        </footer>
      </div>
    </div>
  `;
}

/* ── Init ────────────────────────────────────────────── */

export function initLegalConsentModal(): void {
  const modal = document.getElementById(MODAL_ID);
  if (!modal) return;

  // Action delegation (dismiss / reject / accept)
  modal.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const action = target.closest<HTMLElement>("[data-legal-consent-action]")
      ?.dataset.legalConsentAction;
    if (action === "accept") resolveAndClose(true);
    else if (action === "reject" || action === "dismiss") resolveAndClose(false);
  });

  // Backdrop click closes (treated as reject)
  modal.addEventListener("click", (e) => {
    if (e.target === modal) resolveAndClose(false);
  });

  // Esc closes (reject)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen()) resolveAndClose(false);
  });

  // Scroll bottom reveals action buttons
  const body = document.getElementById("legal-consent-body");
  body?.addEventListener("scroll", () => {
    if (!body) return;
    const atBottom =
      body.scrollTop + body.clientHeight >= body.scrollHeight - SCROLL_BOTTOM_TOLERANCE;
    if (atBottom) revealActions();
  });
}

/* ── Public API ──────────────────────────────────────── */

export function openLegalConsentModal(kind: LegalConsentKind): Promise<boolean> {
  // Eğer önceki bir promise yarım kaldıysa reddet et — yeni bir aşama başlıyor.
  if (pendingResolve) {
    pendingResolve(false);
    pendingResolve = null;
  }

  const modal = document.getElementById(MODAL_ID);
  const titleEl = document.getElementById("legal-consent-title");
  const body = document.getElementById("legal-consent-body");
  if (!modal || !titleEl || !body) return Promise.resolve(false);

  const page = kind === "terms" ? termsContent() : privacyContent();
  titleEl.textContent = page.pageTitle;
  body.innerHTML = renderSections(page.sections);

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  document.body.style.overflow = "hidden";

  // Modal display:none iken scrollTop=0 etki etmez ve scrollHeight=0 olur.
  // Layout hesaplandıktan sonra scroll'u başa al ve buton state'ini ölç.
  requestAnimationFrame(() => {
    body.scrollTop = 0;
    resetAcceptState(body);
  });

  return new Promise<boolean>((resolve) => {
    pendingResolve = resolve;
  });
}

/* ── Internal ────────────────────────────────────────── */

function renderSections(sections: LegalSection[]): string {
  return sections
    .map(
      (s) => `
        <section class="mb-6 last:mb-0">
          <h3 class="mb-2 text-base font-semibold text-gray-900">${s.title}</h3>
          <div class="space-y-2">${s.content}</div>
        </section>
      `
    )
    .join("");
}

function isOpen(): boolean {
  return document.getElementById(MODAL_ID)?.classList.contains("hidden") === false;
}

function revealActions(): void {
  const actions = document.getElementById("legal-consent-actions");
  if (!actions) return;
  actions.classList.remove("hidden");
  actions.classList.add("flex");
}

function resetAcceptState(body: HTMLElement): void {
  const actions = document.getElementById("legal-consent-actions");
  if (!actions) return;
  // İçerik viewport'a sığıyorsa scroll event tetiklenmez — butonları hemen göster.
  const shorterThanViewport = body.scrollHeight <= body.clientHeight + SCROLL_BOTTOM_TOLERANCE;
  actions.classList.toggle("hidden", !shorterThanViewport);
  actions.classList.toggle("flex", shorterThanViewport);
}

function resolveAndClose(accepted: boolean): void {
  const modal = document.getElementById(MODAL_ID);
  if (!modal) return;
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  document.body.style.overflow = "";
  if (pendingResolve) {
    pendingResolve(accepted);
    pendingResolve = null;
  }
}
