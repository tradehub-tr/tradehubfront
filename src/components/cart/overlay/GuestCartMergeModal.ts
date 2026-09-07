/**
 * GuestCartMergeModal — giriş sonrası "sepetleri birleştirelim mi?" penceresi.
 *
 * Alpine'a bağlı değil (TopBar düz TS): body'ye eklenir, seçim yapılınca ya da
 * kapatılınca kendini kaldırır. Seçenekler (bkz. state/guestCartMerge.ts):
 *   birleştir · hesap sepetini boşalt + yenileri ekle · şimdi değil.
 * Stil: OrderReviewModal ile aynı dil (koyu perde, beyaz kart, th-btn / th-btn-outline).
 */
import { t } from "../../../i18n";
import { escapeHtml } from "../../../utils/sanitize";
import type { GuestCartPromptContext } from "../state/guestCartMerge";

const ROOT_ID = "guest-cart-merge-modal";

const cartIcon = `<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M2 3h2.2l2.2 12.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.2L21 7H5"/></svg>`;

export function openGuestCartMergeModal(ctx: GuestCartPromptContext): void {
  if (document.getElementById(ROOT_ID)) return;

  const vars = { guest: String(ctx.guestCount), account: String(ctx.accountCount) };
  const root = document.createElement("div");
  root.id = ROOT_ID;
  root.className = "fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-3 sm:p-4";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-labelledby", `${ROOT_ID}-title`);
  root.innerHTML = `
    <div class="w-full max-w-[460px] bg-white rounded-md shadow-2xl overflow-hidden" data-card>
      <div class="flex items-start gap-3 px-5 sm:px-6 pt-5 sm:pt-6 pb-4">
        <div class="w-11 h-11 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">${cartIcon}</div>
        <div class="min-w-0 flex-1">
          <h2 id="${ROOT_ID}-title" class="text-[17px] sm:text-[19px] font-bold text-[#222222] leading-snug">${escapeHtml(t("cart.guestMergeTitle"))}</h2>
          <p class="mt-1.5 text-[13px] sm:text-sm text-[#6b7280] leading-relaxed">${escapeHtml(t("cart.guestMergeDesc", vars))}</p>
        </div>
        <button type="button" data-action="later" class="w-8 h-8 -me-2 -mt-1 flex items-center justify-center rounded-full text-[#9ca3af] hover:text-[#111827] hover:bg-gray-100 transition-colors cursor-pointer shrink-0" aria-label="${escapeHtml(t("cart.guestMergeLater"))}">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="flex flex-col gap-2.5 px-5 sm:px-6 pb-5 sm:pb-6">
        <button type="button" data-action="merge" class="th-btn w-full flex flex-col items-center justify-center gap-0.5 !h-auto py-2.5 text-sm font-semibold">
          <span>${escapeHtml(t("cart.guestMergeKeepBoth"))}</span>
          <span class="text-[11px] font-normal opacity-80">${escapeHtml(t("cart.guestMergeKeepBothHint"))}</span>
        </button>
        <button type="button" data-action="replace" class="th-btn-outline w-full flex flex-col items-center justify-center gap-0.5 !h-auto py-2.5 text-sm font-semibold">
          <span>${escapeHtml(t("cart.guestMergeReplace"))}</span>
          <span class="text-[11px] font-normal text-[#6b7280]">${escapeHtml(t("cart.guestMergeReplaceHint", vars))}</span>
        </button>
        <button type="button" data-action="later" class="w-full py-1.5 text-[13px] text-[#6b7280] hover:text-[#111827] underline-offset-2 hover:underline cursor-pointer">${escapeHtml(t("cart.guestMergeLater"))}</button>
      </div>
    </div>
  `;

  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  let busy = false;

  const close = () => {
    document.removeEventListener("keydown", onKey);
    document.body.style.overflow = prevOverflow;
    root.remove();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && !busy) {
      ctx.dismiss();
      close();
    }
  };
  const setBusy = (on: boolean) => {
    busy = on;
    root.querySelectorAll<HTMLButtonElement>("button[data-action]").forEach((b) => {
      b.disabled = on;
      b.classList.toggle("opacity-60", on);
      b.classList.toggle("pointer-events-none", on);
    });
  };

  root.addEventListener("click", async (e) => {
    const target = e.target as HTMLElement;
    const btn = target.closest<HTMLButtonElement>("button[data-action]");
    if (!btn) {
      // Perdeye tıklama = şimdi değil
      if (target === root && !busy) {
        ctx.dismiss();
        close();
      }
      return;
    }
    if (busy) return;
    const action = btn.dataset.action;
    if (action === "later") {
      ctx.dismiss();
      close();
      return;
    }
    if (action === "merge" || action === "replace") {
      setBusy(true);
      const ok = await ctx.choose(action);
      if (ok) close();
      else setBusy(false); // hata: toast basıldı, kullanıcı tekrar deneyebilir
    }
  });
  document.addEventListener("keydown", onKey);
  document.body.appendChild(root);
  root.querySelector<HTMLButtonElement>('button[data-action="merge"]')?.focus();
}
