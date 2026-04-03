/**
 * FloatingPanel Component
 * Alibaba-style fixed right sidebar toolbar with:
 * - Mesajlarım (messages) button
 * - Görsel Arama (visual search lens) button
 * - En üste çık (scroll-to-top) button
 * Also includes the global CookieBanner overlay.
 *
 * Reactivity handled by Alpine.js via x-data="floatingPanel".
 * Alpine.data('floatingPanel') is registered in src/alpine.ts.
 */

import { CookieBanner } from '../legal/CookieBanner';

/**
 * Generates the messages sidebar item.
 * Uses @click to set chatOpen=true on the parent Alpine component.
 */
function renderMessagesItem(): string {
  return `
    <button
      type="button"
      @click="chatOpen = true"
      class="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
      aria-label="Mesajlarım"
    >
      <svg class="shrink-0" width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g clip-path="url(#clip0_fp_msg)">
          <path d="M6.99996 9.33335H21V10.9375H6.99996V9.33335Z" fill="#222222"></path>
          <path d="M12.8333 13.125H6.99996V14.7292H12.8333V13.125Z" fill="#222222"></path>
          <path d="M3.79163 21.5834C3.30838 21.5834 2.91663 21.1916 2.91663 20.7084V5.54169C2.91663 5.05844 3.30838 4.66669 3.79163 4.66669H24.2083C24.6915 4.66669 25.0833 5.05844 25.0833 5.54169V20.7084C25.0833 21.1916 24.6915 21.5834 24.2083 21.5834H13.1833L8.92204 24.2466C8.33925 24.6109 7.58329 24.1919 7.58329 23.5046V21.5834H3.79163ZM9.18746 19.9792V22.189L12.7232 19.9792H23.4791V6.27085H4.52079V19.9792H9.18746Z" fill="#222222"></path>
        </g>
        <defs>
          <clipPath id="clip0_fp_msg">
            <rect width="28" height="28" fill="white"></rect>
          </clipPath>
        </defs>
      </svg>
      <span class="hidden group-hover:inline text-xs text-gray-700 whitespace-nowrap">Mesajlarım</span>
    </button>
  `;
}

/**
 * Generates the visual search lens sidebar item.
 * Uses @click to set lensOpen=true on the parent Alpine component.
 */
function renderLensItem(): string {
  return `
    <button
      type="button"
      @mouseenter="lensOpen = true"
      @mouseleave="lensOpen = false"
      class="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
      aria-label="Görsel Arama"
    >
      <svg class="shrink-0" width="28" height="28" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path stroke="#ffc000" stroke-linecap="round" stroke-width="12" d="M74 30H62c-17.673 0-32 14.327-32 32v12m88-44h12c17.673 0 32 14.327 32 32v12m-88 88H62c-17.673 0-32-14.327-32-32v-12"/>
        <circle cx="96" cy="96" r="28" stroke="#ffc000" stroke-width="12"/>
        <circle cx="145" cy="145" r="17" fill="#ffc000"/>
      </svg>
      <span class="hidden group-hover:inline text-xs text-gray-700 whitespace-nowrap">Görsel Arama</span>
    </button>
  `;
}

/** Lens popup - sidebar'ın solunda bağlantılı dikdörtgen, mobilde gizli */
function renderLensPopup(): string {
  return `
    <div
      x-show="lensOpen"
      x-cloak
      x-transition:enter="transition ease-out duration-200"
      x-transition:enter-start="opacity-0 translate-x-4"
      x-transition:enter-end="opacity-100 translate-x-0"
      x-transition:leave="transition ease-in duration-150"
      x-transition:leave-start="opacity-100 translate-x-0"
      x-transition:leave-end="opacity-0 translate-x-4"
      @mouseenter="lensOpen = true"
      @mouseleave="lensOpen = false"
      class="hidden md:block absolute bottom-0 right-full mr-2 w-72 bg-gradient-to-b from-amber-50 to-white rounded-[12px] shadow-[0_2px_6px_2px_rgba(0,0,0,0.12)] p-5"
    >
      <!-- Header -->
      <div class="flex items-center gap-2 mb-3">
        <svg class="shrink-0" width="24" height="24" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path stroke="#ffc000" stroke-linecap="round" stroke-width="12" d="M74 30H62c-17.673 0-32 14.327-32 32v12m88-44h12c17.673 0 32 14.327 32 32v12m-88 88H62c-17.673 0-32-14.327-32-32v-12"/>
          <circle cx="96" cy="96" r="28" stroke="#ffc000" stroke-width="12"/>
          <circle cx="145" cy="145" r="17" fill="#ffc000"/>
        </svg>
        <img src="/images/istoc-logo.png" alt="istoc" class="h-5" />
      </div>

      <!-- Description -->
      <p class="text-sm text-gray-600 leading-relaxed mb-4">
        Benzer ürünleri daha ucuza bulmak için <span class="font-semibold">ÜCRETSİZ</span> fiyat karşılaştırma eklentimizle zamandan ve paradan tasarruf edin
      </p>

      <!-- CTA Button -->
      <button
        type="button"
        class="inline-flex items-center px-5 py-2.5 bg-[#ffc000] hover:bg-[#e6ad00] text-white text-sm font-semibold rounded-full transition-colors duration-150"
      >
        Uzantıyı İndir
      </button>
    </div>
  `;
}

/**
 * Generates the scroll-to-top sidebar item.
 * Uses x-show with x-transition for visibility based on scroll position.
 */
function renderScrollTopItem(): string {
  return `
    <button
      type="button"
      x-show="showScrollTop"
      x-cloak
      x-transition:enter="transition ease-out duration-200"
      x-transition:enter-start="opacity-0 scale-95"
      x-transition:enter-end="opacity-100 scale-100"
      x-transition:leave="transition ease-in duration-150"
      x-transition:leave-start="opacity-100 scale-100"
      x-transition:leave-end="opacity-0 scale-95"
      @click="scrollToTop()"
      class="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
      aria-label="En üste çık"
    >
      <svg class="shrink-0" width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M24.5 4.66663H3.5V6.27079H24.5V4.66663Z" fill="#222222"></path>
        <path d="M14 8.19898L5.84953 16.3495L6.98385 17.4838L13.1979 11.2697L13.1979 24.5H14.8021L14.8021 11.2697L21.0162 17.4838L22.1505 16.3495L14 8.19898Z" fill="#222222"></path>
      </svg>
      <span class="hidden group-hover:inline text-xs text-gray-700 whitespace-nowrap">En üste çık</span>
    </button>
  `;
}

/**
 * Generates the chat support drawer template.
 * Replaces the imperative openChatDrawer() createElement pattern.
 * Hidden by default via x-show="chatOpen" (chatOpen starts as false).
 * x-cloak prevents brief flash before Alpine processes the directives.
 */
function renderChatDrawer(): string {
  return `
    <!-- Chat Drawer Backdrop -->
    <div
      x-show="chatOpen"
      x-cloak
      x-transition:enter="transition ease-out duration-300"
      x-transition:enter-start="opacity-0"
      x-transition:enter-end="opacity-100"
      x-transition:leave="transition ease-in duration-300"
      x-transition:leave-start="opacity-100"
      x-transition:leave-end="opacity-0"
      @click="chatOpen = false"
      class="fixed inset-0 z-(--z-popover) bg-black/50"
      aria-hidden="true"
    ></div>

    <!-- Chat Drawer Panel -->
    <div
      x-show="chatOpen"
      x-cloak
      x-transition:enter="transition ease-out duration-300"
      x-transition:enter-start="translate-x-full"
      x-transition:enter-end="translate-x-0"
      x-transition:leave="transition ease-in duration-300"
      x-transition:leave-start="translate-x-0"
      x-transition:leave-end="translate-x-full"
      @keydown.escape.window="chatOpen = false"
      class="fixed top-0 right-0 z-(--z-toast) h-full w-full max-w-sm bg-white dark:bg-gray-800 shadow-2xl flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Chat Support"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Chat Support</h2>
        <button
          type="button"
          @click="chatOpen = false"
          class="flex items-center justify-center w-9 h-9 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400"
          aria-label="Close chat"
        >
          <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <!-- Message Area -->
      <div class="flex-1 flex items-center justify-center p-6">
        <div class="text-center">
          <div class="mx-auto mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30">
            <svg class="w-8 h-8 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
            </svg>
          </div>
          <p class="text-gray-500 dark:text-gray-400 text-sm">Chat functionality coming soon...</p>
        </div>
      </div>
    </div>
  `;
}


/**
 * FloatingPanel Component
 * Renders Alibaba-style sidebar toolbar at the right edge of the viewport.
 * Card-style panel with icon + text labels (text hidden on mobile).
 *
 * All interactivity is handled declaratively via Alpine.js x-data="floatingPanel".
 * Body scroll lock is managed via x-effect when chat drawer or lens modal is open.
 */
export function FloatingPanel(): string {
  return `
    <div
      x-data="floatingPanel"
      x-effect="document.body.style.overflow = chatOpen ? 'hidden' : ''"
    >
      <!-- Floating Sidebar Toolbar (Alibaba style) -->
      <div
        id="floating-panel"
        class="group fixed bottom-16 md:bottom-15 right-0 z-35"
        aria-label="Quick actions panel"
      >
        <!-- Lens Popup (sidebar'ın soluna yapışık dikdörtgen) -->
        ${renderLensPopup()}

        <!-- Sidebar butonları -->
        <div class="inline-flex flex-col gap-2 bg-white rounded-l-[8px] shadow-[0_2px_6px_2px_rgba(0,0,0,0.12)] p-2">
          <!-- Mesajlarım -->
          ${renderMessagesItem()}

          <!-- Görsel Arama -->
          ${renderLensItem()}

          <!-- En üste çık (shown on scroll > 300px via x-show) -->
          ${renderScrollTopItem()}
        </div>
      </div>

      <!-- Chat Support Drawer (hidden by default, toggled by chatOpen) -->
      ${renderChatDrawer()}

    </div>

    <!-- Global Cookie Consent Banner -->
    ${CookieBanner()}
  `;
}

/**
 * @deprecated Replaced by Alpine.js x-data="floatingPanel" directives.
 * Alpine handles scroll-to-top visibility, chat drawer, and lens modal.
 * Remove this call from page entry files and use startAlpine() instead.
 */
export function initFloatingPanel(): void {
  // No-op: All interactivity is now handled by Alpine.js via x-data="floatingPanel"
}
