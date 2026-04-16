/**
 * Theme Storage - localStorage persistence for theme overrides
 *
 * İki kanal vardır:
 *   1. `STORAGE_KEY` — yerel geliştirici override'ları (in-browser drawer ile ayarlanan)
 *   2. `REMOTE_CACHE_KEY` — backend'den gelen site geneli tema (admin panelden gelen)
 *      Remote tema, HEAD inline script tarafından ilk paint'ten önce uygulanır.
 */

const STORAGE_KEY = "tradehub-theme-overrides";
const REMOTE_CACHE_KEY = "tradehub-theme-remote";
const REMOTE_ENDPOINT = "/api/method/tradehub_core.api.theme.get_public_theme";

/**
 * Load saved theme overrides from localStorage
 */
export function loadTheme(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

/**
 * Save theme overrides to localStorage
 */
export function saveTheme(overrides: Record<string, string>): void {
  try {
    if (Object.keys(overrides).length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    }
  } catch {
    // localStorage may be full or disabled
  }
}

/**
 * Clear all saved theme overrides
 */
export function clearTheme(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Apply saved theme overrides to the document root
 */
export function applyTheme(overrides: Record<string, string>): void {
  const root = document.documentElement;
  for (const [cssVar, value] of Object.entries(overrides)) {
    root.style.setProperty(cssVar, value);
  }
}

/**
 * Collect all currently applied inline CSS variable overrides from the root
 */
export function collectOverrides(varNames: string[]): Record<string, string> {
  const root = document.documentElement;
  const overrides: Record<string, string> = {};
  for (const varName of varNames) {
    const val = root.style.getPropertyValue(varName).trim();
    if (val) overrides[varName] = val;
  }
  return overrides;
}

/**
 * Backend'den site geneli tema override'larını getirir.
 * Başarılı olursa localStorage'a cache'ler (HEAD inline script'i bir sonraki
 * sayfa yüklenişinde bu cache'i anında kullanacak — FOUC önleme).
 */
export async function fetchRemoteTheme(): Promise<Record<string, string>> {
  try {
    const res = await fetch(REMOTE_ENDPOINT, {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return {};
    const data = await res.json();
    const overrides = (data?.message?.overrides || {}) as Record<string, string>;
    // Sadece -- ile başlayan key'leri kabul et (güvenlik)
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(overrides)) {
      if (typeof k === "string" && k.startsWith("--") && typeof v === "string") {
        clean[k] = v;
      }
    }
    try {
      localStorage.setItem(REMOTE_CACHE_KEY, JSON.stringify(clean));
    } catch {
      // localStorage dolu / devre dışı — sessiz geç
    }
    return clean;
  } catch {
    return {};
  }
}

/**
 * HEAD inline script ile aynı mantığın TS karşılığı — cache'ten remote tema okur.
 */
export function loadRemoteThemeCache(): Record<string, string> {
  try {
    const raw = localStorage.getItem(REMOTE_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}
