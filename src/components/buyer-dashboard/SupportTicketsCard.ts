/**
 * SupportTicketsCard — Buyer dashboard right panel widget.
 *
 * Açık + yanıt bekleyen ticket sayılarını gösterir, "Yeni Talep Aç" CTA'sı
 * ve "Tümünü Gör" linki içerir. Alpine kullanmadan vanilla TS — dashboard
 * zaten karma yapı; mount sonrası counts fetch edilip DOM'a inject edilir.
 */

import { fetchTicketStatusCounts } from "../../services/supportService";
import { getBaseUrl } from "../auth/AuthLayout";

export function SupportTicketsCard(): string {
  return `
    <div class="bg-(--color-surface,#ffffff) rounded-(--radius-card) p-4 transition-shadow duration-300 hover:shadow-[0_0_12px_0_rgba(0,0,0,0.12)]" data-support-tickets-card>
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-base font-bold text-(--color-text-body,#333333) m-0">Destek Taleplerim</h3>
        <a href="${getBaseUrl()}pages/help/help-tickets.html" class="text-[13px] text-(--color-text-placeholder,#999999) no-underline inline-flex items-center gap-0.5 transition-colors hover:text-(--color-cta-primary)">
          Tümü
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>
      </div>

      <div data-stc-loading class="py-4 flex justify-center">
        <div class="w-5 h-5 border-2 border-gray-200 border-t-violet-500 rounded-full animate-spin"></div>
      </div>

      <div data-stc-empty class="hidden py-3 text-center">
        <p class="text-xs text-gray-400 mb-2">Henüz destek talebiniz yok.</p>
        <a href="${getBaseUrl()}pages/help/help-ticket-new.html" class="inline-flex items-center gap-1 text-[12px] font-semibold text-violet-600 hover:text-violet-700">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M6 2v8M2 6h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          Yeni Talep Aç
        </a>
      </div>

      <div data-stc-counts class="hidden space-y-2">
        <a href="${getBaseUrl()}pages/help/help-tickets.html?tab=open" class="flex items-center justify-between p-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors group">
          <span class="flex items-center gap-2 text-xs font-medium text-blue-700">
            <span class="w-2 h-2 rounded-full bg-blue-400"></span>
            Açık
          </span>
          <span class="text-base font-bold text-blue-700" data-stc-open>0</span>
        </a>
        <a href="${getBaseUrl()}pages/help/help-tickets.html?tab=pending" class="flex items-center justify-between p-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors group">
          <span class="flex items-center gap-2 text-xs font-medium text-amber-700">
            <span class="w-2 h-2 rounded-full bg-amber-400"></span>
            Yanıt Bekleyen
          </span>
          <span class="text-base font-bold text-amber-700" data-stc-pending>0</span>
        </a>
        <a href="${getBaseUrl()}pages/help/help-ticket-new.html" class="block text-center text-[12px] font-semibold text-violet-600 hover:text-violet-700 mt-2 py-1.5 border border-dashed border-violet-200 rounded-lg hover:border-violet-400">
          + Yeni Talep Aç
        </a>
      </div>

      <div data-stc-error class="hidden py-3 text-center text-xs text-gray-400">
        Bilgi alınamadı.
      </div>
    </div>
  `;
}

export async function initSupportTicketsCard(): Promise<void> {
  const root = document.querySelector<HTMLDivElement>("[data-support-tickets-card]");
  if (!root) return;

  const loadingEl = root.querySelector<HTMLDivElement>("[data-stc-loading]");
  const emptyEl = root.querySelector<HTMLDivElement>("[data-stc-empty]");
  const countsEl = root.querySelector<HTMLDivElement>("[data-stc-counts]");
  const errorEl = root.querySelector<HTMLDivElement>("[data-stc-error]");
  const openEl = root.querySelector<HTMLSpanElement>("[data-stc-open]");
  const pendingEl = root.querySelector<HTMLSpanElement>("[data-stc-pending]");

  const show = (el: HTMLElement | null) => el?.classList.remove("hidden");
  const hide = (el: HTMLElement | null) => el?.classList.add("hidden");

  try {
    const counts = await fetchTicketStatusCounts();
    hide(loadingEl);

    const total = counts.all || 0;
    if (total === 0) {
      show(emptyEl);
      return;
    }

    if (openEl) openEl.textContent = String(counts.Open || 0);
    if (pendingEl) pendingEl.textContent = String(counts.Replied || 0);
    show(countsEl);
  } catch {
    hide(loadingEl);
    show(errorEl);
  }
}
