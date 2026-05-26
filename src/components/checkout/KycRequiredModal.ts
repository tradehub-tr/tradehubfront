/**
 * KycRequiredModal — Sprint 2.6 (revised)
 *
 * Checkout ödeme aşamasında backend KYC gate hatası geldiğinde açılır.
 * Backend hata mesajı [KYC_<STATE>] prefix'i ile gelir; state'e göre
 * uygun mesaj ve CTA gösterilir.
 *
 * Sepet korunur — modal sadece görsel uyarı, network yan etkisi yok.
 *
 * Kullanım:
 *   import { openKycRequiredModal } from "../components/checkout/KycRequiredModal";
 *   openKycRequiredModal(err.message);
 */

import { t } from "../../i18n";

const MODAL_ID = "kyc-required-modal";

type KycState = "LOCKED" | "PENDING" | "REJECTED" | "SUSPENDED";

interface ModalContent {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
}

const KYC_PREFIX_RE = /\[KYC_(LOCKED|PENDING|REJECTED|SUSPENDED)\]/;

/**
 * Backend hata mesajındaki [KYC_<STATE>] prefix'ini çözer.
 * Prefix bulunamazsa null döner — modal açılmaz, çağıran toast/fallback gösterir.
 */
export function parseKycState(message: string | undefined | null): KycState | null {
  if (!message) return null;
  const match = message.match(KYC_PREFIX_RE);
  return match ? (match[1] as KycState) : null;
}

function getModalContent(state: KycState): ModalContent {
  if (state === "SUSPENDED") {
    return {
      title: t("cart.kycRequiredTitle"),
      description: t("cart.kycSuspendedDesc"),
      ctaLabel: t("cart.kycCtaSupport"),
      ctaHref: "/destek/yeni",
    };
  }
  if (state === "REJECTED") {
    return {
      title: t("cart.kycRequiredTitle"),
      description: t("cart.kycRejectedDesc"),
      ctaLabel: t("cart.kycCta"),
      ctaHref: "/pages/dashboard/kyc.html",
    };
  }
  if (state === "PENDING") {
    return {
      title: t("cart.kycRequiredTitle"),
      description: t("cart.kycPendingDesc"),
      ctaLabel: t("cart.kycCta"),
      ctaHref: "/pages/dashboard/kyc.html",
    };
  }
  return {
    title: t("cart.kycRequiredTitle"),
    description: t("cart.kycLockedDesc"),
    ctaLabel: t("cart.kycCta"),
    ctaHref: "/pages/dashboard/kyc.html",
  };
}

function renderModalShell(): string {
  return `
		<div
			id="${MODAL_ID}"
			class="hidden fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-3 sm:p-4"
			role="dialog"
			aria-modal="true"
			aria-labelledby="${MODAL_ID}-title"
		>
			<div class="bg-white rounded-md max-w-md w-full p-4 sm:p-6 shadow-2xl">
				<div class="flex items-start gap-3 sm:gap-4">
					<div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="w-5 h-5 sm:w-6 sm:h-6 text-amber-600">
							<path d="M12 9v4M12 17h.01" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
							<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
						</svg>
					</div>
					<div class="flex-1 min-w-0">
						<h3 id="${MODAL_ID}-title" class="text-[14px] sm:text-base font-semibold text-gray-900 mb-1.5 sm:mb-2"></h3>
						<p id="${MODAL_ID}-desc" class="text-[12px] sm:text-sm text-gray-600 leading-relaxed"></p>
					</div>
				</div>
				<div class="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
					<button
						type="button"
						data-kyc-modal-close
						class="flex-1 th-btn-outline h-10 sm:h-auto text-[13px] sm:text-[14px]"
					>
						${t("cart.kycCtaCancel")}
					</button>
					<a
						id="${MODAL_ID}-cta"
						href="#"
						class="flex-1 th-btn h-10 sm:h-auto text-[13px] sm:text-[14px] text-center no-underline"
					></a>
				</div>
			</div>
		</div>
	`;
}

function ensureModalInDOM(): HTMLElement {
  let modal = document.getElementById(MODAL_ID);
  if (!modal) {
    const container = document.createElement("div");
    container.innerHTML = renderModalShell();
    document.body.appendChild(container.firstElementChild as HTMLElement);
    modal = document.getElementById(MODAL_ID);
    bindGlobalHandlers();
  }
  return modal!;
}

function closeModal(): void {
  const modal = document.getElementById(MODAL_ID);
  if (!modal) return;
  modal.classList.add("hidden");
  document.body.style.overflow = "";
}

let handlersBound = false;

function bindGlobalHandlers(): void {
  if (handlersBound) return;
  handlersBound = true;
  document.body.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target.matches("[data-kyc-modal-close]") || target.id === MODAL_ID) {
      closeModal();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}

/**
 * KYC required modal'ı açar. State backend [KYC_<STATE>] prefix'inden parse edilir.
 * Prefix bulunamazsa false döner — çağıran fallback gösterir (toast vb.).
 */
export function openKycRequiredModal(errorMessage: string | undefined | null): boolean {
  const state = parseKycState(errorMessage);
  if (!state) return false;
  const modal = ensureModalInDOM();
  const content = getModalContent(state);
  const titleEl = modal.querySelector(`#${MODAL_ID}-title`);
  const descEl = modal.querySelector(`#${MODAL_ID}-desc`);
  const ctaEl = modal.querySelector(`#${MODAL_ID}-cta`) as HTMLAnchorElement | null;
  if (titleEl) titleEl.textContent = content.title;
  if (descEl) descEl.textContent = content.description;
  if (ctaEl) {
    ctaEl.textContent = content.ctaLabel;
    ctaEl.href = content.ctaHref;
  }
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  return true;
}
