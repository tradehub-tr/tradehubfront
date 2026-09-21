import type { SupportedLang } from "../i18n";
import { getStaticPageHtmlPath } from "../utils/staticPageUrl";
import { applyServerSeo, type ServerSeoPayload } from "./setPageMeta";

const ENDPOINT = "/api/method/tradehub_core.seo.page_resolver.get_static_page_meta";

/**
 * Yol artık dil öneki taşımaz — dil `?hl=` ile gelir (K7). Eski `/en/...`
 * adresleri nginx'te 301 ile önekiz karşılığına döner, yani tarayıcı bu
 * fonksiyona hiç `/en/` vermez. Fonksiyon korunuyor çünkü sondaki `/`
 * ve boş yol normalizasyonu hâlâ gerekli.
 */
export function normalizeStaticSeoPath(pathname: string): { path: string } {
  return { path: pathname || "/" };
}

function normalizeStaticSeoLanguage(lang: SupportedLang): "tr" | "en" {
  return lang === "en" ? "en" : "tr";
}

export async function loadStaticPageSeo(
  activeLang: SupportedLang,
  pathname = window.location.pathname
): Promise<void> {
  const normalized = normalizeStaticSeoPath(pathname);
  if (!getStaticPageHtmlPath(normalized.path)) return;

  const effectiveUiLang = activeLang;
  const apiLang = normalizeStaticSeoLanguage(effectiveUiLang);
  const query = new URLSearchParams({ path: normalized.path, lang: apiLang });
  try {
    const response = await fetch(`${ENDPOINT}?${query}`, {
      cache: "no-store",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return;
    const body = (await response.json()) as { message?: ServerSeoPayload | null };
    applyServerSeo(body.message ? { ...body.message, lang: effectiveUiLang } : body.message);
  } catch {
    // Build-time SEO remains the safe fallback when the API is unavailable.
  }
}
