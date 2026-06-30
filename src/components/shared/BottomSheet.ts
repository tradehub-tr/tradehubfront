/**
 * BottomSheet — paylaşılan mobil alttan-açılır panel (Alibaba tarzı).
 *
 * Chrome (overlay + panel + drag handle + başlık + kapat + swipe-to-dismiss)
 * tek yerde toplanır; içerik (`body`) çağıran tarafça slot olarak verilir.
 *
 * Kullanım:
 *   HTML:  ${BottomSheet({ id: "x", titleKey: "mfr.allCategories" }, `<ul ...></ul>`)}
 *   Init:  const sheet = initBottomSheet("x"); openBtn.onclick = () => sheet.open();
 *
 * `titleKey` i18n anahtarıdır (değer değil) — `data-i18n` ile canlı dil
 * değişimini korur (i18n/index.ts runtime'da bu attribute'leri günceller).
 */

import { t } from "../../i18n";

export interface BottomSheetProps {
  /** Benzersiz kök id; overlay `${id}-overlay`, panel `${id}-panel` olur. */
  id: string;
  /** Başlık i18n anahtarı (örn. "mfr.allCategories"). */
  titleKey: string;
  /** Hangi breakpoint'te gizlensin — varsayılan "lg:hidden". */
  hiddenAt?: string;
}

export function BottomSheet({ id, titleKey, hiddenAt = "lg:hidden" }: BottomSheetProps, body: string): string {
  return `
    <!-- Overlay -->
    <div id="${id}-overlay" data-bs-overlay class="fixed inset-0 z-(--z-backdrop) bg-black/50 opacity-0 pointer-events-none transition-opacity duration-300 ${hiddenAt}"></div>

    <!-- Panel -->
    <div id="${id}-panel" data-bs-panel class="fixed inset-x-0 bottom-0 z-(--z-modal) transition-transform duration-300 ease-out ${hiddenAt}" style="transform: translateY(100%)">
      <div class="bg-white dark:bg-gray-800 rounded-t-md max-h-[85vh] flex flex-col shadow-2xl">
        <!-- Drag handle + başlık (swipe-to-dismiss hedefi) -->
        <div class="flex-shrink-0" data-bs-drag>
          <div class="flex items-center justify-center pt-3 pb-2">
            <div class="w-9 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></div>
          </div>
          <div class="flex items-center px-4 sm:px-5 border-b border-gray-100 dark:border-gray-700/50">
            <button
              type="button"
              data-bs-back
              class="hidden th-no-press -ms-2 me-1 p-1.5 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 bg-transparent border-0 cursor-pointer transition-colors"
              aria-label="${t("common.goBack")}" data-i18n-aria-label="common.goBack"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <span class="text-[14px] sm:text-[15px] font-bold text-gray-900 dark:text-white" data-bs-title data-i18n="${titleKey}">${t(titleKey)}</span>
            <button
              type="button"
              data-bs-close
              class="th-no-press ms-auto p-1.5 -me-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              aria-label="${t("common.close")}" data-i18n-aria-label="common.close"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
        ${body}
      </div>
    </div>
  `;
}

export interface BottomSheetController {
  open(): void;
  close(): void;
  /** Başlık metnini değiştir (drill-down navigasyonu için). data-i18n'i kaldırır. */
  setTitle(text: string): void;
  /** Geri tuşunu göster/gizle (kök seviyede gizli). */
  showBack(show: boolean): void;
  /** Geri tuşuna tıklama handler'ı bağla. */
  onBack(handler: () => void): void;
  readonly panel: HTMLElement | null;
}

export function initBottomSheet(id: string): BottomSheetController {
  const overlay = document.getElementById(`${id}-overlay`);
  const panel = document.getElementById(`${id}-panel`);

  function open(): void {
    if (!overlay || !panel) return;
    overlay.style.opacity = "1";
    overlay.style.pointerEvents = "auto";
    panel.style.transform = "translateY(0)";
    document.body.style.overflow = "hidden";
  }

  function close(): void {
    if (!overlay || !panel) return;
    overlay.style.opacity = "0";
    overlay.style.pointerEvents = "none";
    panel.style.transform = "translateY(100%)";
    document.body.style.overflow = "";
  }

  overlay?.addEventListener("click", close);
  panel?.querySelector("[data-bs-close]")?.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  // Swipe-down-to-dismiss
  if (panel) {
    const dragTarget = panel.querySelector<HTMLElement>("[data-bs-drag]") || panel;
    let startY = 0;
    let currentY = 0;
    let dragging = false;

    dragTarget.addEventListener(
      "touchstart",
      (e: TouchEvent) => {
        startY = e.touches[0].clientY;
        currentY = startY;
        dragging = true;
        panel.style.transition = "none";
      },
      { passive: true }
    );

    dragTarget.addEventListener(
      "touchmove",
      (e: TouchEvent) => {
        if (!dragging) return;
        currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;
        if (deltaY > 0) panel.style.transform = `translateY(${deltaY}px)`;
      },
      { passive: true }
    );

    dragTarget.addEventListener("touchend", () => {
      if (!dragging) return;
      dragging = false;
      panel.style.transition = "";
      const deltaY = currentY - startY;
      if (deltaY > panel.offsetHeight * 0.3) close();
      else panel.style.transform = "translateY(0)";
    });
  }

  function setTitle(text: string): void {
    const el = panel?.querySelector<HTMLElement>("[data-bs-title]");
    if (!el) return;
    el.textContent = text;
    // Runtime i18n çevirmeni dinamik başlığı ezmesin (kategori adı i18n anahtarı değil)
    el.removeAttribute("data-i18n");
  }

  function showBack(show: boolean): void {
    panel?.querySelector("[data-bs-back]")?.classList.toggle("hidden", !show);
  }

  function onBack(handler: () => void): void {
    panel?.querySelector("[data-bs-back]")?.addEventListener("click", handler);
  }

  return { open, close, setTitle, showBack, onBack, panel };
}
