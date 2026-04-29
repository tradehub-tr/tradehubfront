/**
 * EmailVerification Component
 * 6-digit OTP input with auto-focus progression, paste support,
 * and countdown timer for resend functionality.
 * Used in registration flow after email submission.
 */

import { t } from "../../i18n";
import { OtpVerifyError, RateLimitError } from "../../utils/api";

/* ── Types ──────────────────────────────────────────── */

export interface EmailVerificationOptions {
  /** Email address being verified */
  email?: string;
  /** Container element ID */
  containerId?: string;
  /** Callback when OTP is completed (all 6 digits entered) — sync, fires immediately */
  onComplete?: (otp: string) => void;
  /** Async callback to verify OTP against backend. If provided, disables inputs during verification. */
  onVerify?: (otp: string) => Promise<void>;
  /** Callback when resend is clicked */
  onResend?: () => void;
  /** Callback when back/change email is clicked */
  onBack?: () => void;
  /** Initial countdown seconds for resend (default: 60) */
  resendCountdown?: number;
}

export interface EmailVerificationState {
  /** Current OTP digits */
  otp: string[];
  /** Whether resend is available */
  canResend: boolean;
  /** Seconds remaining until resend available */
  countdownSeconds: number;
  /** Current countdown interval ID */
  countdownInterval: number | null;
  /**
   * Last server-reported attempts remaining (5 → fresh code, 0 → locked).
   * ``null`` until the user makes the first wrong submission.
   */
  attemptsRemaining: number | null;
  /**
   * Wall-clock time (ms) at which the rate-limit cooldown ends. ``null`` when
   * no cooldown is active. Persisted in localStorage so the countdown
   * survives page reloads.
   */
  cooldownEndAt: number | null;
  /** setInterval handle for the cooldown ticker (so we can clear it). */
  cooldownInterval: number | null;
}

/* ── Component HTML ─────────────────────────────────── */

/**
 * Renders the email verification component with 6-digit OTP input
 * @param email - The email address being verified
 */
export function EmailVerification(email: string = ""): string {
  const maskedEmail = maskEmail(email);

  return `
    <div id="email-verification" class="w-full">
      <!-- Header -->
      <div class="mb-6 text-center lg:text-left">
        <h1 class="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-2">
          ${t("auth.verifyEmail")}
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          <span id="verification-email-display">${maskedEmail || t("auth.otpSentFallback")}</span> ${t("auth.otpSentTo")}
        </p>
      </div>

      <!-- OTP Input Fields -->
      <div class="mb-6">
        <div id="otp-input-container" class="flex justify-center lg:justify-start gap-2 sm:gap-3">
          ${renderOTPInputs()}
        </div>

        <!-- Staged feedback container (silent → informational → critical → lockout) -->
        <div id="otp-feedback" class="mt-3 min-h-0" aria-live="polite"></div>
      </div>

      <!-- Resend Section -->
      <div class="mb-6 text-center lg:text-left">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          ${t("auth.otpDidntReceive")}
          <button
            type="button"
            id="otp-resend-btn"
            class="ml-1 font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
            disabled
          >
            <span id="otp-resend-text">${t("auth.otpResend")}</span>
            <span id="otp-countdown" class="text-gray-400 dark:text-gray-500">(60s)</span>
          </button>
        </p>
      </div>

      <!-- Continue Button -->
      <button
        type="button"
        id="otp-continue-btn"
        class="th-btn w-full py-3 text-base font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        disabled
      >
        ${t("auth.otpVerifyAndContinue")}
      </button>

      <!-- Back/Change Email Link -->
      <div class="mt-4 text-center lg:text-left">
        <button
          type="button"
          id="otp-back-btn"
          class="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:underline transition-colors"
        >
          ${t("auth.otpChangeEmail")}
        </button>
      </div>
    </div>
  `;
}

/**
 * Renders the 6 OTP input fields
 */
function renderOTPInputs(): string {
  const inputs: string[] = [];

  for (let i = 0; i < 6; i++) {
    inputs.push(`
      <input
        type="text"
        inputmode="numeric"
        pattern="[0-9]*"
        maxlength="1"
        id="otp-input-${i}"
        data-otp-index="${i}"
        class="otp-input w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold
               rounded-md border-2 border-gray-200 dark:border-gray-600
               bg-white dark:bg-gray-800 text-gray-900 dark:text-white
               focus:border-orange-500 dark:focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20
               transition-all duration-200 outline-none
               placeholder:text-gray-300 dark:placeholder:text-gray-600"
        placeholder="·"
        autocomplete="one-time-code"
        aria-label="OTP digit ${i + 1} of 6"
      />
    `);
  }

  return inputs.join("");
}

/* ── Helper Functions ────────────────────────────────── */

/**
 * Mask email address for display (e.g., "t***@example.com")
 */
function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return email;

  const [local, domain] = email.split("@");
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local[0]}${local[1]}***@${domain}`;
}

/* ── Init Logic ──────────────────────────────────────── */

/**
 * Initialize EmailVerification interactivity
 * Sets up OTP input handlers, countdown timer, and button states
 */
export function initEmailVerification(
  options: EmailVerificationOptions = {}
): EmailVerificationState {
  const { email = "", onComplete, onVerify, onResend, onBack, resendCountdown = 60 } = options;

  // Initialize state
  const state: EmailVerificationState = {
    otp: ["", "", "", "", "", ""],
    canResend: false,
    countdownSeconds: resendCountdown,
    countdownInterval: null,
    attemptsRemaining: null,
    cooldownEndAt: null,
    cooldownInterval: null,
  };

  const container = document.getElementById("email-verification");
  if (!container) return state;

  // Get all OTP inputs
  const otpInputs = container.querySelectorAll<HTMLInputElement>("[data-otp-index]");
  const continueBtn = document.getElementById("otp-continue-btn") as HTMLButtonElement | null;
  const resendBtn = document.getElementById("otp-resend-btn") as HTMLButtonElement | null;
  const backBtn = document.getElementById("otp-back-btn") as HTMLButtonElement | null;
  const countdownSpan = document.getElementById("otp-countdown");
  const feedbackEl = document.getElementById("otp-feedback");

  // Helper to handle OTP submission (sync onComplete + async onVerify)
  let verifying = false;

  function setInputsDisabled(disabled: boolean): void {
    otpInputs.forEach((inp) => {
      inp.disabled = disabled;
    });
    if (continueBtn) {
      continueBtn.disabled = disabled;
      continueBtn.textContent = disabled ? t("auth.otpVerifying") : t("auth.otpVerifyAndContinue");
    }
  }

  async function handleOTPSubmit(): Promise<void> {
    if (!isOTPComplete(state) || verifying) return;

    const otp = state.otp.join("");

    // Fire sync callback if provided
    if (onComplete && !onVerify) {
      onComplete(otp);
      return;
    }

    // Fire async verify callback if provided
    if (onVerify) {
      verifying = true;
      setInputsDisabled(true);
      clearFeedback(feedbackEl);

      try {
        await onVerify(otp);
        // Success — caller (alpine/auth.ts) handles navigation
      } catch (err) {
        // Three error shapes:
        //   OtpVerifyError    → staged "attempts remaining" UX
        //   RateLimitError    → countdown UX (decorator-level rate limit)
        //   anything else     → generic "wrong code" inline message
        if (err instanceof OtpVerifyError) {
          state.attemptsRemaining = err.attemptsRemaining;
          renderFeedback(state, feedbackEl, resendBtn, countdownSpan);
        } else if (err instanceof RateLimitError) {
          startCooldown(state, err.retryAfter, email, feedbackEl, otpInputs, continueBtn, resendBtn, countdownSpan);
        } else {
          renderInlineMessage(feedbackEl, t("auth.otpInvalidCode"));
        }
        clearOTPInputs();
        state.otp = ["", "", "", "", "", ""];
        updateContinueButton(state, continueBtn);
      } finally {
        verifying = false;
        // Restore the "verifying" affordance (button text + enabled state).
        setInputsDisabled(false);
        // If we just entered lockout (attempts_remaining=0) OR a cooldown,
        // keep the inputs and submit button disabled — buton metni
        // değiştirilmeden. Resend butonunun durumu ayrı; renderFeedback /
        // startCooldown onu kendi içinde yönetiyor.
        if (state.attemptsRemaining === 0 || state.cooldownEndAt) {
          otpInputs.forEach((inp) => {
            inp.disabled = true;
          });
          if (continueBtn) continueBtn.disabled = true;
        }
      }
    }
  }

  // Setup OTP input handlers
  otpInputs.forEach((input, index) => {
    // Handle input
    input.addEventListener("input", (e) => {
      const target = e.target as HTMLInputElement;
      const value = target.value.replace(/\D/g, ""); // Only digits

      if (value.length === 1) {
        state.otp[index] = value;
        target.value = value;

        // Auto-focus next input
        if (index < 5) {
          const nextInput = otpInputs[index + 1];
          nextInput?.focus();
        }
      } else if (value.length === 0) {
        state.otp[index] = "";
        target.value = "";
      }

      // Don't clear the staged feedback while the user is still mid-typing —
      // wait until the next submission attempt so they can see the previous
      // "Kalan deneme" message until they actually re-submit.

      // Check if OTP is complete
      updateContinueButton(state, continueBtn);

      // Auto-submit when all digits entered
      if (isOTPComplete(state)) {
        handleOTPSubmit();
      }
    });

    // Handle paste (support pasting full 6-digit code)
    input.addEventListener("paste", (e) => {
      e.preventDefault();
      const pastedData = e.clipboardData?.getData("text") || "";
      const digits = pastedData.replace(/\D/g, "").slice(0, 6);

      if (digits.length > 0) {
        // Fill all inputs with pasted digits
        for (let i = 0; i < 6; i++) {
          state.otp[i] = digits[i] || "";
          const otpInput = otpInputs[i];
          if (otpInput) {
            otpInput.value = digits[i] || "";
          }
        }

        // Focus last filled input or first empty
        const lastFilledIndex = Math.min(digits.length - 1, 5);
        otpInputs[lastFilledIndex]?.focus();

        // Update button state
        updateContinueButton(state, continueBtn);

        // Auto-submit if complete
        if (isOTPComplete(state)) {
          handleOTPSubmit();
        }
      }
    });

    // Handle backspace - move to previous input
    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !input.value && index > 0) {
        const prevInput = otpInputs[index - 1];
        prevInput?.focus();
      }

      // Handle arrow keys for navigation
      if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault();
        otpInputs[index - 1]?.focus();
      }
      if (e.key === "ArrowRight" && index < 5) {
        e.preventDefault();
        otpInputs[index + 1]?.focus();
      }
    });

    // Select all on focus
    input.addEventListener("focus", () => {
      input.select();
    });
  });

  // Continue button handler
  if (continueBtn) {
    continueBtn.addEventListener("click", () => {
      handleOTPSubmit();
    });
  }

  // Resend button handler
  if (resendBtn) {
    resendBtn.addEventListener("click", async () => {
      if (!state.canResend || !onResend) return;
      try {
        await onResend();
        // New OTP → backend cache resets attempts to 0; mirror that locally
        // so the staged feedback (and any disabled inputs from a lockout)
        // clear immediately for the user.
        state.attemptsRemaining = null;
        state.otp = ["", "", "", "", "", ""];
        clearOTPInputs();
        otpInputs.forEach((inp) => { inp.disabled = false; });
        clearFeedback(feedbackEl);
        updateContinueButton(state, continueBtn);
        // Reset countdown
        startCountdown(state, resendCountdown, resendBtn, countdownSpan);
      } catch (err) {
        // ``onResend`` re-throws RateLimitError specifically so we can paint
        // the countdown UX. Generic errors are already toasted upstream.
        if (err instanceof RateLimitError) {
          startCooldown(state, err.retryAfter, email, feedbackEl, otpInputs, continueBtn, resendBtn, countdownSpan);
        }
      }
    });
  }

  // Back button handler
  if (backBtn && onBack) {
    backBtn.addEventListener("click", () => {
      onBack();
    });
  }

  // Start initial countdown
  startCountdown(state, resendCountdown, resendBtn, countdownSpan);

  // If we were in an active rate-limit cooldown when the page reloaded,
  // pick up the countdown from where it left off (localStorage persisted it).
  rehydrateCooldown(state, email, feedbackEl, otpInputs, continueBtn, resendBtn, countdownSpan);

  // Focus first input
  otpInputs[0]?.focus();

  return state;
}

/**
 * Start or restart the resend countdown timer
 */
function startCountdown(
  state: EmailVerificationState,
  seconds: number,
  resendBtn: HTMLButtonElement | null,
  countdownSpan: HTMLElement | null
): void {
  // Clear existing interval
  if (state.countdownInterval) {
    clearInterval(state.countdownInterval);
  }

  state.countdownSeconds = seconds;
  state.canResend = false;

  // Update UI immediately
  updateCountdownUI(state, resendBtn, countdownSpan);

  // Start countdown
  state.countdownInterval = window.setInterval(() => {
    state.countdownSeconds--;

    if (state.countdownSeconds <= 0) {
      // Countdown complete
      if (state.countdownInterval) {
        clearInterval(state.countdownInterval);
        state.countdownInterval = null;
      }
      state.canResend = true;
    }

    updateCountdownUI(state, resendBtn, countdownSpan);
  }, 1000);
}

/**
 * Update countdown UI elements
 */
function updateCountdownUI(
  state: EmailVerificationState,
  resendBtn: HTMLButtonElement | null,
  countdownSpan: HTMLElement | null
): void {
  if (resendBtn) {
    resendBtn.disabled = !state.canResend;
  }

  if (countdownSpan) {
    if (state.canResend) {
      countdownSpan.classList.add("hidden");
    } else {
      countdownSpan.classList.remove("hidden");
      countdownSpan.textContent = `(${state.countdownSeconds}s)`;
    }
  }
}

/**
 * Check if all OTP digits are entered
 */
function isOTPComplete(state: EmailVerificationState): boolean {
  return state.otp.every((digit) => digit !== "");
}

/**
 * Update continue button disabled state based on OTP completeness
 */
function updateContinueButton(
  state: EmailVerificationState,
  continueBtn: HTMLButtonElement | null
): void {
  if (continueBtn) {
    continueBtn.disabled = !isOTPComplete(state);
  }
}

/* ── Staged OTP feedback ────────────────────────────────────────────────────
   Kademeli (silent → informational → critical → lockout) gösterim. Backend
   her yanlış denemede ``attempts_remaining`` döner; aşağıdaki şablonlar onay
   verilen mockup ile birebir aynı CSS sınıflarını kullanır.
   ─────────────────────────────────────────────────────────────────────────── */

const OTP_TOTAL_ATTEMPTS = 5;

function clearFeedback(el: HTMLElement | null): void {
  if (el) el.innerHTML = "";
}

/** Tek satır kırmızı helper text (Aşama 1 + generic non-OTP errors). */
function renderInlineMessage(el: HTMLElement | null, msg: string): void {
  if (!el) return;
  el.innerHTML = `
    <p class="text-sm text-red-600 dark:text-red-400 text-center lg:text-left">${escapeText(msg)}</p>
  `;
}

/** 5-segment thin meter — mockup ile aynı genişlik/renk tonu. */
function meterMarkup(remaining: number, fill: "warning" | "error"): string {
  const total = OTP_TOTAL_ATTEMPTS;
  const filledClass =
    fill === "warning"
      ? "bg-amber-500"
      : "bg-red-500";
  let segments = "";
  for (let i = 0; i < total; i++) {
    const on = i < remaining;
    segments += `<span class="inline-block w-[26px] h-1 rounded-sm ${on ? filledClass : "bg-gray-200 dark:bg-gray-700"}"></span>`;
  }
  return `<span class="inline-flex items-center gap-[3px]" aria-hidden="true">${segments}</span>`;
}

function svgWarning(): string {
  return `<svg class="w-5 h-5 text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 10.4 18H1.6L12 3z"/><path d="M12 9v5"/><path d="M12 18h.01"/></svg>`;
}
function svgLock(): string {
  return `<svg class="w-5 h-5 text-red-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
}

function escapeText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Pick the right stage from ``attemptsRemaining`` and paint the feedback
 * container. Staying in sync with the mockup:
 *   remaining 4–3 → silent (Aşama 1)
 *   remaining 2   → informational (Aşama 2)
 *   remaining 1   → critical (Aşama 3)
 *   remaining 0   → lockout (Aşama 4)
 */
function renderFeedback(
  state: EmailVerificationState,
  el: HTMLElement | null,
  resendBtn: HTMLButtonElement | null,
  countdownSpan: HTMLElement | null,
): void {
  if (!el) return;
  const remaining = state.attemptsRemaining;
  if (remaining === null) {
    el.innerHTML = "";
    return;
  }

  const counterLabel = `${escapeText(t("auth.otpAttemptsRemaining"))} · ${remaining}/${OTP_TOTAL_ATTEMPTS}`;

  // Aşama 4 — lockout
  if (remaining === 0) {
    el.innerHTML = `
      <div class="mt-3 rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 p-4 flex gap-3 items-start">
        ${svgLock()}
        <div class="flex-1 min-w-0">
          <div class="text-sm font-semibold text-red-800 dark:text-red-200">${escapeText(t("auth.otpLockoutTitle"))}</div>
          <div class="text-[13px] text-red-700 dark:text-red-300 mt-1 leading-relaxed">${escapeText(t("auth.otpLockoutBody"))}</div>
        </div>
      </div>
    `;
    // Lockout: enable the resend button immediately, hide the cooldown text.
    if (resendBtn) resendBtn.disabled = false;
    state.canResend = true;
    if (state.countdownInterval) {
      clearInterval(state.countdownInterval);
      state.countdownInterval = null;
    }
    if (countdownSpan) countdownSpan.classList.add("hidden");
    return;
  }

  // Aşama 3 — critical (last attempt)
  if (remaining === 1) {
    el.innerHTML = `
      <div class="mt-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 p-4 flex gap-3 items-start">
        ${svgWarning()}
        <div class="flex-1 min-w-0">
          <div class="text-sm font-semibold text-amber-800 dark:text-amber-200">${escapeText(t("auth.otpLastAttemptTitle"))}</div>
          <div class="text-[13px] text-amber-700 dark:text-amber-300 mt-1 leading-relaxed">${escapeText(t("auth.otpLastAttemptBody"))}</div>
          <div class="flex flex-wrap items-center gap-3 mt-2.5">
            ${meterMarkup(remaining, "error")}
            <span class="text-xs font-semibold text-red-700 dark:text-red-300 tabular-nums">${counterLabel}</span>
          </div>
        </div>
      </div>
    `;
    return;
  }

  // Aşama 2 — informational (3rd wrong → remaining 2)
  if (remaining === 2) {
    el.innerHTML = `
      <div class="mt-3 space-y-2">
        <p class="text-sm text-red-600 dark:text-red-400 m-0">${escapeText(t("auth.otpInvalidCode"))}</p>
        <div class="flex items-center gap-2">
          ${meterMarkup(remaining, "warning")}
          <span class="text-xs font-semibold text-gray-600 dark:text-gray-300 tabular-nums">${counterLabel}</span>
        </div>
      </div>
    `;
    return;
  }

  // Aşama 1 — silent (1st & 2nd wrong → remaining 4 or 3)
  el.innerHTML = `
    <p class="mt-3 text-sm text-red-600 dark:text-red-400 text-center lg:text-left">${escapeText(t("auth.otpInvalidCode"))}</p>
  `;
}

/**
 * @deprecated Old single-line error API. Kept for any external caller that
 * still imports it; new code should rely on the staged ``renderFeedback``
 * which is driven by the typed ``OtpVerifyError``.
 */
export function showOTPError(message?: string): void {
  const el = document.getElementById("otp-feedback");
  renderInlineMessage(el, message || t("auth.otpInvalidCode"));
}

/* ── Rate-limit cooldown ────────────────────────────────────────────────────
   Frappe @rate_limit decorator 429 fırlattığında çalışır. Sayaç M:SS
   formatında gösterilir, OTP input + submit + resend disabled, sayaç
   bittiğinde tüm UI normalleşir. ``localStorage`` ile persist edilir; sayfa
   yenilense de aynı sayaç devam eder.
   ─────────────────────────────────────────────────────────────────────────── */

// Storage key for the registration-flow cooldown. Value is JSON
// ``{email, until}``: we tag the email so that another user typing in a
// fresh address on the same device doesn't inherit a stale lockout.
export const REGISTER_COOLDOWN_STORAGE_KEY = "otp_cooldown_register";

export interface RegisterCooldownState {
  email: string;
  until: number;
}

export function readRegisterCooldown(): RegisterCooldownState | null {
  try {
    const raw = localStorage.getItem(REGISTER_COOLDOWN_STORAGE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw) as RegisterCooldownState;
    if (!obj || typeof obj.until !== "number" || obj.until <= Date.now()) {
      localStorage.removeItem(REGISTER_COOLDOWN_STORAGE_KEY);
      return null;
    }
    return obj;
  } catch {
    return null;
  }
}

function writeRegisterCooldown(email: string, until: number): void {
  try {
    localStorage.setItem(
      REGISTER_COOLDOWN_STORAGE_KEY,
      JSON.stringify({ email, until }),
    );
  } catch {
    /* localStorage unavailable — fall through to in-memory only */
  }
}

function clearRegisterCooldown(): void {
  try {
    localStorage.removeItem(REGISTER_COOLDOWN_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function formatMmSs(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function renderCooldownPanel(el: HTMLElement | null, secondsLeft: number): void {
  if (!el) return;
  const time = formatMmSs(secondsLeft);
  const retryLine = t("auth.otpRetryIn", { time });
  el.innerHTML = `
    <div class="mt-3 rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 p-4 flex gap-3 items-start">
      <svg class="w-5 h-5 text-red-700 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-semibold text-red-800 dark:text-red-200">${escapeText(t("auth.otpCooldownTitle"))}</div>
        <div class="text-[13px] text-red-700 dark:text-red-300 mt-1 leading-relaxed">${escapeText(t("auth.otpCooldownBody"))}</div>
        <div class="text-[13px] font-semibold text-red-800 dark:text-red-200 mt-2 tabular-nums">${escapeText(retryLine)}</div>
      </div>
    </div>
  `;
}

function startCooldown(
  state: EmailVerificationState,
  retryAfterSec: number,
  email: string,
  feedbackEl: HTMLElement | null,
  otpInputs: NodeListOf<HTMLInputElement>,
  continueBtn: HTMLButtonElement | null,
  resendBtn: HTMLButtonElement | null,
  countdownSpan: HTMLElement | null,
): void {
  // Persist {email, until} so a reload picks up where we left off — and so
  // the register page Alpine component can reroute back into the OTP step.
  const endAt = Date.now() + retryAfterSec * 1000;
  state.cooldownEndAt = endAt;
  writeRegisterCooldown(email, endAt);

  // Stop any prior cooldown ticker so we don't double-tick.
  if (state.cooldownInterval) {
    clearInterval(state.cooldownInterval);
    state.cooldownInterval = null;
  }
  // Stop the resend cooldown timer too — cooldown owns the UI now.
  if (state.countdownInterval) {
    clearInterval(state.countdownInterval);
    state.countdownInterval = null;
  }

  const tick = () => {
    const left = Math.ceil(((state.cooldownEndAt ?? 0) - Date.now()) / 1000);
    if (left <= 0) {
      // Cooldown expired — restore the form to a clean state.
      state.cooldownEndAt = null;
      clearRegisterCooldown();
      if (state.cooldownInterval) {
        clearInterval(state.cooldownInterval);
        state.cooldownInterval = null;
      }
      if (feedbackEl) feedbackEl.innerHTML = "";
      otpInputs.forEach((inp) => { inp.disabled = false; });
      if (continueBtn) continueBtn.disabled = false;
      if (resendBtn) resendBtn.disabled = false;
      state.canResend = true;
      if (countdownSpan) countdownSpan.classList.add("hidden");
      return;
    }
    renderCooldownPanel(feedbackEl, left);
  };

  // Lock the form for the duration of the cooldown.
  otpInputs.forEach((inp) => { inp.disabled = true; });
  if (continueBtn) continueBtn.disabled = true;
  if (resendBtn) resendBtn.disabled = true;
  state.canResend = false;
  if (countdownSpan) countdownSpan.classList.add("hidden");

  tick();
  state.cooldownInterval = window.setInterval(tick, 1000);
}

/** Re-arm cooldown UI after a reload (consumes localStorage). */
function rehydrateCooldown(
  state: EmailVerificationState,
  email: string,
  feedbackEl: HTMLElement | null,
  otpInputs: NodeListOf<HTMLInputElement>,
  continueBtn: HTMLButtonElement | null,
  resendBtn: HTMLButtonElement | null,
  countdownSpan: HTMLElement | null,
): void {
  const persisted = readRegisterCooldown();
  if (!persisted) return;
  // If the persisted cooldown belongs to a different address (user came back
  // and started a fresh registration with another email), don't surface it.
  if (email && persisted.email && persisted.email !== email) return;
  const left = Math.ceil((persisted.until - Date.now()) / 1000);
  if (left <= 0) return;
  startCooldown(state, left, persisted.email || email, feedbackEl, otpInputs, continueBtn, resendBtn, countdownSpan);
}

/**
 * Clear all OTP inputs
 */
export function clearOTPInputs(): void {
  const container = document.getElementById("email-verification");
  if (!container) return;

  const otpInputs = container.querySelectorAll<HTMLInputElement>("[data-otp-index]");
  otpInputs.forEach((input) => {
    input.value = "";
  });

  // Focus first input
  const firstInput = container.querySelector<HTMLInputElement>('[data-otp-index="0"]');
  firstInput?.focus();
}

/**
 * Get the current OTP value
 */
export function getOTPValue(): string {
  const container = document.getElementById("email-verification");
  if (!container) return "";

  const otpInputs = container.querySelectorAll<HTMLInputElement>("[data-otp-index]");
  return Array.from(otpInputs)
    .map((input) => input.value)
    .join("");
}

/**
 * Update the displayed email address
 */
export function updateVerificationEmail(email: string): void {
  const emailDisplay = document.getElementById("verification-email-display");
  if (emailDisplay) {
    emailDisplay.textContent = maskEmail(email);
  }
}

/**
 * Cleanup function to clear intervals when component is removed
 */
export function cleanupEmailVerification(state: EmailVerificationState): void {
  if (state.countdownInterval) {
    clearInterval(state.countdownInterval);
    state.countdownInterval = null;
  }
}
