import { getBaseUrl } from "./url";

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

// Alpine component'leri window.API_BASE üzerinden erişir
(window as any).API_BASE = BASE_URL;

// ─── CSRF Token Cache ─────────────────────────────────────────────────────────
// Frappe CSRF token cookie'de tutulmaz — session'da sunucu tarafında saklanır.
// get_session_user endpoint'inden çekip cache'leriz.

let _csrfToken: string | null = null;
let _csrfFetchPromise: Promise<string | null> | null = null;

export async function fetchCsrfToken(): Promise<string | null> {
  if (_csrfToken) return _csrfToken;
  if (!_csrfFetchPromise) {
    _csrfFetchPromise = fetch(`${BASE_URL}/method/tradehub_core.api.v1.auth.get_session_user`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((d) => {
        _csrfToken = d?.message?.csrf_token || null;
        _csrfFetchPromise = null;
        return _csrfToken;
      })
      .catch(() => {
        _csrfFetchPromise = null;
        return null;
      });
  }
  return _csrfFetchPromise;
}

export function getCsrfToken(): string {
  return _csrfToken ?? "None";
}

export function clearCsrfCache(): void {
  _csrfToken = null;
  _csrfFetchPromise = null;
}

/** Extract a human-readable error message from a Frappe JSON error body. */
function extractFrappeError(raw: string): string {
  try {
    const body = JSON.parse(raw);
    if (body._server_messages) {
      const msgs = JSON.parse(body._server_messages);
      const first = typeof msgs[0] === "string" ? JSON.parse(msgs[0]) : msgs[0];
      if (first.message) return first.message;
    }
    if (body.message) return body.message;
  } catch {
    /* not JSON or unexpected structure */
  }
  return "";
}

/** Read backend `error_code` field from a Frappe error body (401/403 etc). */
function extractErrorCode(raw: string): string | null {
  try {
    const body = JSON.parse(raw);
    if (typeof body.error_code === "string") return body.error_code;
  } catch {
    /* not JSON */
  }
  return null;
}

/**
 * Read backend `attempts_remaining` from an OTP error body.
 *
 * The three OTP verify endpoints (``verify_registration_otp``,
 * ``confirm_email_change``, ``verify_email_otp``) include this field on the
 * 422 wrong-code branch and the 429 lockout branch so the staged "Kalan
 * deneme" UX can render without a second round-trip.
 */
function extractAttemptsRemaining(raw: string): number | null {
  try {
    const body = JSON.parse(raw);
    if (typeof body.attempts_remaining === "number") return body.attempts_remaining;
  } catch {
    /* not JSON */
  }
  return null;
}

/**
 * Error subclass that carries the OTP attempt counter alongside the message.
 * Callers do ``catch (err) { if (err instanceof OtpVerifyError) ... }`` or
 * read ``err.attemptsRemaining`` directly (it is also attached to plain
 * ``Error`` instances for backwards compat below).
 */
export class OtpVerifyError extends Error {
  attemptsRemaining: number | null;
  status: number;
  constructor(message: string, status: number, attemptsRemaining: number | null) {
    super(message);
    this.name = "OtpVerifyError";
    this.status = status;
    this.attemptsRemaining = attemptsRemaining;
  }
}

/**
 * Error subclass for the *generic* rate-limit decorator (Frappe ``@rate_limit``).
 *
 * This is distinct from ``OtpVerifyError``: that one fires when the user has
 * exhausted the 5 OTP attempts on a single code (handled by the staged UX);
 * ``RateLimitError`` fires when Frappe's decorator-level limiter (e.g. 5 send
 * requests / 5 minutes per email) kicks in. The frontend renders a countdown
 * with the supplied ``retryAfter`` seconds.
 *
 * Frappe's 429 path strips the ``Retry-After`` header in our gateway, so we
 * default to the decorator window length (300s) — pessimistic but truthful as
 * an upper bound; client-side persistence (localStorage) keeps the counter
 * stable across reloads.
 */
export class RateLimitError extends Error {
  retryAfter: number;
  constructor(message: string, retryAfter: number) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

/**
 * EMAIL_NOT_VERIFIED gating'inde fırlatılan özel hata.
 *
 * Caller'lar generic catch'lerde ``instanceof EmailNotVerifiedError`` ile
 * bu hatayı yakalayıp **erken return** edebilir; api wrapper zaten i18n'lı
 * toast gösterdiği için tekrar ek toast göstermek (raw "EMAIL_NOT_VERIFIED"
 * mesajı) gerekmez.
 */
export class EmailNotVerifiedError extends Error {
  constructor() {
    super("EMAIL_NOT_VERIFIED");
    this.name = "EmailNotVerifiedError";
  }
}

/** Helper — bir error EMAIL_NOT_VERIFIED gating'inden mi? */
export function isEmailNotVerifiedError(err: unknown): boolean {
  return err instanceof EmailNotVerifiedError;
}

/**
 * Direct ``fetch`` kullanan caller'lar (api()/callMethod yerine raw fetch yapanlar)
 * için yardımcı: response 401/403 ise ve error_code EMAIL_NOT_VERIFIED ise
 * i18n toast gösterir + ``EmailNotVerifiedError`` fırlatır.
 *
 * Kullanım:
 *   const res = await fetch(...);
 *   await checkEmailNotVerifiedResponse(res);
 *   if (!res.ok) { ... generic error ... }
 */
export async function checkEmailNotVerifiedResponse(res: Response): Promise<void> {
  if (res.status !== 401 && res.status !== 403) return;
  const raw = await res.clone().text();
  const errorCode = extractErrorCode(raw);
  if (errorCode === "EMAIL_NOT_VERIFIED") {
    void notifyEmailNotVerified();
    throw new EmailNotVerifiedError();
  }
}

// Email-not-verified toast — debounced (3 sn) ki ardı ardına 403 gelse bile
// kullanıcı tek bir uyarı görsün.
let _lastEmailNotVerifiedToast = 0;
async function notifyEmailNotVerified(): Promise<void> {
  const now = Date.now();
  if (now - _lastEmailNotVerifiedToast < 3000) return;
  _lastEmailNotVerifiedToast = now;
  try {
    const [{ showToast }, { t }] = await Promise.all([import("./toast"), import("../i18n")]);
    showToast({
      message: t("auth.emailNotVerifiedAction"),
      type: "error",
    });
  } catch {
    /* toast/i18n yüklenemediyse sessizce geç */
  }
}

export async function api<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const needsCsrf = ["POST", "PUT", "DELETE", "PATCH"].includes(method);

  const doFetch = async (csrf: string) =>
    fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Frappe-CSRF-Token": csrf,
        ...options.headers,
      },
    });

  let csrf = needsCsrf ? ((await fetchCsrfToken()) ?? "None") : "None";
  let res = await doFetch(csrf);

  // Stale CSRF retry: 403'te cache'i temizle, yeni token ile 1 kez yeniden dene
  if (res.status === 403 && needsCsrf) {
    clearCsrfCache();
    csrf = (await fetchCsrfToken()) ?? "None";
    res = await doFetch(csrf);
  }

  if (res.status === 401 || res.status === 403) {
    const raw = await res.text();
    const errorCode = extractErrorCode(raw);
    // EMAIL_NOT_VERIFIED — gating decorator'dan geliyor. Banner/modal yok;
    // kullanıcıya yalnızca dile uygun bir toast göster.
    if (errorCode === "EMAIL_NOT_VERIFIED") {
      void notifyEmailNotVerified();
      throw new EmailNotVerifiedError();
    }

    // Pre-auth endpoint'lerde (kayıt, OTP, şifre sıfırlama) login'e yönlendirme
    const isPreAuth = endpoint.includes(".identity.") || endpoint.includes(".auth.check_email");
    if (!isPreAuth) {
      window.location.href = `${getBaseUrl()}pages/auth/login.html`;
      throw new Error("Unauthorized");
    }
    // Pre-auth endpoint'lerde hatayı çağıran koda dönder
    const msg = extractFrappeError(raw);
    throw new Error(msg || `HTTP ${res.status}`);
  }

  if (res.status === 429) {
    // OTP lockout (429 + attempts_remaining=0) ile generic rate-limit'i ayır:
    // OTP endpoint'leri body'de attempts_remaining gönderir; varsa OtpVerifyError,
    // yoksa Frappe @rate_limit decorator'undan gelen RateLimitError.
    const raw = await res.text();
    const ar = extractAttemptsRemaining(raw);
    if (ar !== null) {
      const msg = extractFrappeError(raw) || "OTP_LOCKED";
      throw new OtpVerifyError(msg, 429, ar);
    }
    // Frappe @rate_limit reject — backend Retry-After'ı response body'sine
    // koymadığı için decorator penceresinin tamamını (300s) pessimist olarak
    // varsayıyoruz. Gerçek kalan süre daha kısa olabilir; sayaç dolduğunda
    // kullanıcı yine deneyebilir.
    const retryAfterHeader = res.headers.get("Retry-After");
    const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) || 300 : 300;
    throw new RateLimitError(extractFrappeError(raw) || "RATE_LIMIT", retryAfter);
  }

  if (!res.ok) {
    const raw = await res.text();
    const msg = extractFrappeError(raw);
    const ar = extractAttemptsRemaining(raw);
    if (ar !== null) {
      throw new OtpVerifyError(msg || `HTTP ${res.status}`, res.status, ar);
    }
    throw new Error(msg || `HTTP ${res.status}`);
  }

  return res.json();
}

// ─── Frappe API Helpers ───────────────────────────────────────────────────────

/**
 * Frappe whitelist endpoint'i çağırır (cookie session + CSRF).
 *
 * @param method  - tam method yolu: 'tradehub_core.api.seller.get_my_profile'
 * @param params  - GET parametreleri veya POST body
 * @param post    - true ise POST, false ise GET (varsayılan: false)
 *
 * @example
 *   const user = await callMethod('tradehub_core.api.auth.get_current_user')
 *   const result = await callMethod('tradehub_core.api.seller.become_seller', { seller_name: 'Test' }, true)
 */
export async function callMethod<T = unknown>(
  method: string,
  params: Record<string, unknown> = {},
  post = false
): Promise<T> {
  const url = `${BASE_URL}/method/${method}`;

  const doFetch = async (csrf: string): Promise<Response> => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "X-Frappe-CSRF-Token": csrf,
    };
    if (post) {
      return fetch(url, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify(params),
      });
    }
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
    ).toString();
    return fetch(qs ? `${url}?${qs}` : url, {
      method: "GET",
      credentials: "include",
      headers,
    });
  };

  let csrf = post ? ((await fetchCsrfToken()) ?? "None") : "None";
  let res = await doFetch(csrf);

  // Stale CSRF retry: 403'te cache'i temizle, yeni token ile 1 kez yeniden dene
  if (res.status === 403 && post) {
    clearCsrfCache();
    csrf = (await fetchCsrfToken()) ?? "None";
    res = await doFetch(csrf);
  }

  if (res.status === 403) {
    const raw = await res.text();
    const errorCode = extractErrorCode(raw);
    if (errorCode === "EMAIL_NOT_VERIFIED") {
      void notifyEmailNotVerified();
      throw new EmailNotVerifiedError();
    }
    window.location.href = `${getBaseUrl()}pages/auth/login.html`;
    throw new Error("Oturum süresi doldu");
  }

  if (!res.ok) {
    const raw = await res.text();
    const msg = extractFrappeError(raw);
    throw new Error(msg || `HTTP ${res.status}`);
  }

  const data = (await res.json()) as { message: T };
  return data.message;
}

/** Frappe native login endpoint'i */
export async function frappeLogin(email: string, password: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/method/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usr: email, pwd: password }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message || "Giriş başarısız");
  }
}

/** Frappe native logout endpoint'i */
export async function frappeLogout(): Promise<void> {
  const csrf = (await fetchCsrfToken()) ?? "None";
  clearCsrfCache();
  await fetch(`${BASE_URL}/method/logout`, {
    method: "POST",
    credentials: "include",
    headers: { "X-Frappe-CSRF-Token": csrf },
  });
}
