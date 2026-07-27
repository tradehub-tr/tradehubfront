import type { SupportedLang } from "../i18n";
import { getStaticPageHtmlPath } from "../utils/staticPageUrl";
import { applyServerSeo, type ServerSeoPayload } from "./setPageMeta";

const ENDPOINT = "/api/method/tradehub_core.seo.page_resolver.get_static_page_meta";

export function normalizeStaticSeoPath(pathname: string): {
  path: string;
  langFromPath?: "en";
} {
  if (pathname === "/en") return { path: "/", langFromPath: "en" };
  if (pathname.startsWith("/en/")) {
    return { path: pathname.slice(3) || "/", langFromPath: "en" };
  }
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

  const lang = normalized.langFromPath || normalizeStaticSeoLanguage(activeLang);
  const query = new URLSearchParams({ path: normalized.path, lang });
  try {
    const response = await fetch(`${ENDPOINT}?${query}`, {
      cache: "no-store",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return;
    const body = (await response.json()) as { message?: ServerSeoPayload | null };
    applyServerSeo(body.message);
  } catch {
    // Build-time SEO remains the safe fallback when the API is unavailable.
  }
}
