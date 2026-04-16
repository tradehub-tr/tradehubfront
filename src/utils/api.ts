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
    // Pre-auth endpoint'lerde (kayıt, OTP, şifre sıfırlama) login'e yönlendirme
    const isPreAuth = endpoint.includes(".identity.") || endpoint.includes(".auth.check_email");
    if (!isPreAuth) {
      window.location.href = `${getBaseUrl()}pages/auth/login.html`;
      throw new Error("Unauthorized");
    }
    // Pre-auth endpoint'lerde hatayı çağıran koda dönder
    const raw = await res.text();
    const msg = extractFrappeError(raw);
    throw new Error(msg || `HTTP ${res.status}`);
  }

  if (res.status === 429) {
    throw new Error("RATE_LIMIT");
  }

  if (!res.ok) {
    const raw = await res.text();
    const msg = extractFrappeError(raw);
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
