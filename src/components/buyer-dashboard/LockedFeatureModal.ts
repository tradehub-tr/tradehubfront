/**
 * LockedFeatureModal — Sprint 2.6
 *
 * Sidebar'da locked durumda olan KYC/KYB linklerine tıklanınca açılan modal.
 * - KYC locked → "Alıcı olmak için KYC doldur" CTA + /pages/dashboard/kyc.html
 * - KYB locked → "Satıcı başvurusu yap" CTA + Seller Application sayfası
 *
 * data-locked-feature="kyc" veya "kyb" attribute'una sahip butonları
 * dinler ve modal'ı açar. DOM'a tek bir modal yerleştirilir, içerik
 * tıklamaya göre güncellenir.
 */

import { t } from "../../i18n";
import { routeToSellerFlow } from "../../utils/sellerRouter";

const MODAL_ID = "locked-feature-modal";

type LockType = "kyc" | "kyb";

interface ModalContent {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
}

function getModalContent(lockType: LockType): ModalContent {
  if (lockType === "kyc") {
    return {
      title: t("lockedFeature.kycTitle"),
      description: t("lockedFeature.kycDesc"),
      ctaLabel: t("lockedFeature.kycCta"),
      ctaHref: "/pages/dashboard/kyc.html",
    };
  }
  // KYB locked → smart routing (Draft varsa application-pending'e gönder).
  // href "#" — click handler routeToSellerFlow çağırır.
  return {
    title: t("lockedFeature.kybTitle"),
    description: t("lockedFeature.kybDesc"),
    ctaLabel: t("lockedFeature.kybCta"),
    ctaHref: "#kyb-smart-route",
  };
}

function renderModalShell(): string {
  return `
		<div
			id="${MODAL_ID}"
			class="hidden fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
			role="dialog"
			aria-modal="true"
			aria-labelledby="${MODAL_ID}-title"
		>
			<div class="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
				<div class="flex items-start gap-4">
					<div class="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="text-amber-600 dark:text-amber-400">
							<rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" stroke-width="1.6"/>
							<path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
						</svg>
					</div>
					<div class="flex-1 min-w-0">
						<h3 id="${MODAL_ID}-title" class="text-base font-semibold text-gray-900 dark:text-white mb-2"></h3>
						<p id="${MODAL_ID}-desc" class="text-sm text-gray-600 dark:text-gray-300"></p>
					</div>
				</div>
				<div class="flex gap-3 mt-6 justify-end">
					<button
						type="button"
						data-locked-modal-close
						class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
					>
						${t("lockedFeature.close")}
					</button>
					<a
						id="${MODAL_ID}-cta"
						href="#"
						class="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors"
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
  }
  return modal!;
}

function openModal(lockType: LockType): void {
  const modal = ensureModalInDOM();
  const content = getModalContent(lockType);
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
}

function closeModal(): void {
  const modal = document.getElementById(MODAL_ID);
  if (!modal) return;
  modal.classList.add("hidden");
  document.body.style.overflow = "";
}

/**
 * LockedFeatureModal trigger'larını başlatır. data-locked-feature="kyc|kyb"
 * attribute'una sahip butonlar dinlenir. Tek seferlik bind — page bootstrap
 * sonunda bir kez çağrılmalı.
 */
export function initLockedFeatureModal(): void {
  // Click delegation — yeni eklenen butonlar da çalışsın
  document.body.addEventListener("click", async (e) => {
    const target = e.target as HTMLElement;

    // Close butonu veya backdrop tıklaması
    if (target.matches("[data-locked-modal-close]") || target.id === MODAL_ID) {
      closeModal();
      return;
    }

    // KYB modal CTA — smart routing (Draft varsa application-pending)
    const cta = target.closest<HTMLAnchorElement>(`#${MODAL_ID}-cta`);
    if (cta && cta.getAttribute("href") === "#kyb-smart-route") {
      e.preventDefault();
      closeModal();
      await routeToSellerFlow();
      return;
    }

    // Trigger butonu (sidebar locked item)
    const trigger = target.closest<HTMLElement>("[data-locked-feature]");
    if (!trigger) return;
    const lockType = trigger.getAttribute("data-locked-feature") as LockType;
    if (lockType !== "kyc" && lockType !== "kyb") return;
    e.preventDefault();
    openModal(lockType);
  });

  // ESC tuşu kapatır
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}
