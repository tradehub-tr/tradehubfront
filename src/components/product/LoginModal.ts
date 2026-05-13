/**
 * LoginModal Component
 * Sadeleştirilmiş giriş popup'ı: e-posta + şifre formu.
 * Başarılı girişte `login-success` event yayınlanır ve modal kapanır.
 *
 * Reactivity Alpine.js `x-data="loginModal"` ile yönetilir
 * (src/alpine/product.ts içinde kayıtlıdır).
 */

import { t } from "../../i18n";

/* ── Modal HTML ──────────────────────────────────────── */

export function LoginModal(): string {
  // Register/forgot-password linkleri için base URL (seller-shop gibi alt dizinli sayfalardan çalışır)
  const path = window.location.pathname;
  const parts = path.split("/").filter(Boolean);
  // /pages/seller/seller-shop.html → ../../  (2 kadem yukarı)
  const depth = Math.max(0, parts.length - 1);
  const baseUrl = depth > 0 ? "../".repeat(depth) : "./";

  return `
    <div
      id="rv-login-modal"
      x-data="loginModal"
      x-show="open"
      x-cloak
      x-transition:enter="transition ease-out duration-300"
      x-transition:enter-start="opacity-0"
      x-transition:enter-end="opacity-100"
      x-transition:leave="transition ease-in duration-200"
      x-transition:leave-start="opacity-100"
      x-transition:leave-end="opacity-0"
      @click.self="close()"
      @keydown.escape.window.capture="if (open) { $event.stopImmediatePropagation(); close() }"
      @login-modal-show.window="show()"
      @login-modal-hide.window="close()"
      class="rv-login-overlay fixed inset-0 bg-black/50 z-[60] flex items-center justify-center"
    >
      <div
        x-show="open"
        x-transition:enter="transition ease-out duration-300"
        x-transition:enter-start="opacity-0 scale-95"
        x-transition:enter-end="opacity-100 scale-100"
        x-transition:leave="transition ease-in duration-200"
        x-transition:leave-start="opacity-100 scale-100"
        x-transition:leave-end="opacity-0 scale-95"
        class="rv-login-modal max-w-[420px] w-[95%] p-0 rounded-md bg-surface shadow-modal overflow-hidden relative max-sm:!w-full max-sm:!max-w-full max-sm:!rounded-none max-sm:!min-h-screen"
      >
        <!-- Close Button -->
        <button
          type="button"
          @click="close()"
          class="rv-login-close absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full border-none bg-transparent cursor-pointer text-secondary-400 hover:bg-black/5 hover:text-secondary-900 transition-colors z-[1]"
          id="rv-login-close"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        <!-- Content -->
        <div class="px-8 pt-8 pb-8">
          <div class="text-2xl font-bold text-center text-secondary-900">${t("auth.login.title")}</div>
          <div class="text-sm text-secondary-400 text-center mt-2 mb-6">
            İletişim bilgilerini görüntülemek için giriş yapın
          </div>

          <!-- Error -->
          <p x-show="errorMsg" x-text="errorMsg" class="text-sm text-red-600 mb-4"></p>

          <!-- Form -->
          <form @submit.prevent="submit()" class="space-y-4">
            <div>
              <input
                type="email"
                x-model="email"
                required
                placeholder="${t("auth.login.email")}"
                class="w-full h-12 px-4 border border-border-default rounded-lg text-[15px] bg-surface focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div class="relative">
              <input
                :type="showPassword ? 'text' : 'password'"
                x-model="password"
                required
                placeholder="${t("auth.login.password")}"
                class="w-full h-12 px-4 pr-10 border border-border-default rounded-lg text-[15px] bg-surface focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-900"
                tabindex="-1"
              >
                <svg x-show="!showPassword" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
                <svg x-show="showPassword" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                </svg>
              </button>
            </div>

            <div class="text-right">
              <a
                :href="'${baseUrl}' + 'pages/auth/forgot-password.html'"
                class="text-sm font-medium text-secondary-900 hover:underline"
              >${t("auth.login.forgotPassword")}</a>
            </div>

            <button
              type="submit"
              :disabled="loading"
              class="w-full h-12 bg-(--btn-bg,#f5b800) hover:bg-(--btn-hover-bg,#d39c00) active:bg-(--btn-hover-bg,#d39c00) text-(--btn-text,#1a1a1a) text-[15px] font-semibold border border-(--btn-border-color,#d39c00) rounded-lg shadow-[var(--btn-shadow,0_1px_0_#d39c00,inset_0_1px_0_rgba(255,255,255,0.3))] hover:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2),inset_-1px_-1px_2px_rgba(255,255,255,0.25)] active:shadow-[inset_3px_3px_7px_rgba(0,0,0,0.3),inset_-1px_-1px_2px_rgba(255,255,255,0.18)] active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg x-show="loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <span x-text="loading ? '${t("common.loading")}' : '${t("auth.login.submit")}'"></span>
            </button>
          </form>

          <!-- Create Account -->
          <div class="text-center text-[13px] text-secondary-400 mt-5">
            ${t("auth.login.newUser")}
            <a
              :href="'${baseUrl}' + 'pages/auth/register.html'"
              class="text-primary-500 font-semibold no-underline hover:underline ml-1"
            >${t("auth.login.createAccount")}</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ── Init logic ──────────────────────────────────────── */

/**
 * @deprecated Alpine.js `x-data="loginModal"` yönetir.
 */
export function initLoginModal(): void {
  // No-op
}

/**
 * Modalı aç.
 */
export function showLoginModal(): void {
  window.dispatchEvent(new CustomEvent("login-modal-show"));
}

/**
 * Modalı kapat.
 */
export function hideLoginModal(): void {
  window.dispatchEvent(new CustomEvent("login-modal-hide"));
}

/** Geriye dönük uyumluluk için alias */
export const openLoginModal = showLoginModal;
