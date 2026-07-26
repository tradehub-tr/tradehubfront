/**
 * Storefront SPA-style sayfalar için client-side meta tag helper.
 *
 * İki kullanım:
 *
 * 1) Basit SPA meta (dashboard, cart, checkout vb.):
 *      setPageMeta({ title: 'Sepetim — İstoç', noindex: true });
 *
 * 2) Backend page_resolver payload'unu DOM'a uygula (Faz 4d):
 *    Pretty URL'ler (/urun, /marka, /kategori, /magaza) backend tarafından
 *    server-rendered. Dev'de Vite client storefront'u re-render edip <head>'i
 *    eziyor — bu helper backend'in döndürdüğü `seo` payload'ını alıp DOM
 *    head'ini canonical formata getirir (title, description, OG, canonical,
 *    hreflang, robots, JSON-LD).
 *
 *      applyServerSeo(product.seo);
 */

export interface PageMetaOptions {
  title: string;
  description?: string;
  noindex?: boolean;
}

export interface ServerSeoPayload {
  title?: string;
  description?: string;
  canonical?: string;
  robots?: string;
  og_type?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  og_url?: string;
  site_name?: string;
  twitter_handle?: string;
  hreflang_links?: Array<{ hreflang: string; href: string }>;
  lang?: string;
  json_ld?: Array<Record<string, unknown>>;
}

function schemaIdentity(schema: Record<string, unknown>): string | null {
  const id = schema["@id"];
  if (typeof id === "string" && id) return id;
  const type = schema["@type"];
  if (typeof type === "string" && type) return `type:${type}`;
  return null;
}

function stableScriptId(identity: string): string {
  let hash = 2166136261;
  for (let i = 0; i < identity.length; i += 1) {
    hash ^= identity.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `istoc-jsonld-${(hash >>> 0).toString(36)}`;
}

function parsedSchema(script: HTMLScriptElement): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(script.textContent || "");
    return value !== null && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/**
 * Backend kaynaklı JSON-LD'yi kalıcı @id üzerinden günceller. Bot SSR scriptleri
 * data attribute taşımadığında içeriği okunarak sahiplenilir; böylece hydration
 * sonrası aynı şemanın ikinci bir kopyası oluşturulmaz.
 */
export function syncStructuredData(schemas: Array<Record<string, unknown>>): void {
  for (const schema of schemas) {
    const identity = schemaIdentity(schema);
    if (!identity) continue;
    const incomingType = schema["@type"];

    let scripts = Array.from(
      document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]')
    );

    // Filtre/pagination sonucu değiştiğinde önceki sayfanın ürünleri DOM'da
    // kalmamalı. ItemList sayfa başına tekil ve değiştirilebilir bir şemadır.
    if (incomingType === "ItemList") {
      for (const script of scripts) {
        const existingSchema = parsedSchema(script);
        if (
          existingSchema?.["@type"] === "ItemList" &&
          schemaIdentity(existingSchema) !== identity
        ) {
          script.remove();
        }
      }
      scripts = scripts.filter((script) => script.isConnected);
    }

    const matches = scripts.filter((script) => {
      if (script.dataset.istocJsonld === identity) return true;
      const existingSchema = parsedSchema(script);
      if (!existingSchema) return false;
      if (schemaIdentity(existingSchema) === identity) return true;

      // CDN'de eski bot HTML'i kalmış olabilir: eski markup @id taşımıyorsa
      // aynı sayfadaki aynı schema türünü sahiplenip güncelle.
      return (
        typeof schema["@id"] === "string" &&
        typeof existingSchema["@id"] !== "string" &&
        existingSchema["@type"] === incomingType
      );
    });

    const script = matches.shift() || document.createElement("script");
    for (const duplicate of matches) duplicate.remove();

    script.type = "application/ld+json";
    script.id = stableScriptId(identity);
    script.dataset.istocJsonld = identity;
    script.textContent = JSON.stringify(schema).replace(/</g, "\\u003c");
    if (!script.isConnected) document.head.appendChild(script);
  }
}

function upsertMetaTag(attr: "name" | "property", key: string, content: string): void {
  let tag = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

/**
 * Mutlak URL'in path'ini koruyup host'unu mevcut origin'e (istoc.com) çevirir.
 * Backend SEO payload'u canonical/og:url'i kendi domain'iyle (istoc.cronbi.com)
 * üretebiliyor; müşteri Safari'de "Paylaş" deyince DOM'daki canonical'ı okuduğu
 * için backend domaini görünüyordu. Origin'e sabitleyince rc/beta/prod'da
 * otomatik doğru domain çıkar. Dış URL'lere (og:image CDN) UYGULANMAZ.
 */
function toCurrentOrigin(url: string): string {
  try {
    const u = new URL(url, window.location.origin);
    return `${window.location.origin}${u.pathname}${u.search}${u.hash}`;
  } catch {
    return url;
  }
}

function upsertLinkTag(rel: string, href: string, hreflang?: string): void {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let tag = document.querySelector<HTMLLinkElement>(selector);
  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", rel);
    if (hreflang) tag.setAttribute("hreflang", hreflang);
    document.head.appendChild(tag);
  }
  tag.setAttribute("href", href);
}

export function setPageMeta(opts: PageMetaOptions): void {
  document.title = opts.title;

  if (opts.description !== undefined) {
    upsertMetaTag("name", "description", opts.description);
  }

  upsertMetaTag("name", "robots", opts.noindex ? "noindex,nofollow" : "index,follow");
}

/**
 * Backend SEO payload'ını DOM head'ine uygula. Pretty URL'lerde server-render
 * edilen meta'lar Vite client tarafından ezildiği için dev'de zorunlu.
 */
export function applyServerSeo(seo: ServerSeoPayload | null | undefined): void {
  if (!seo) return;

  if (seo.title) document.title = seo.title;

  if (seo.description) upsertMetaTag("name", "description", seo.description);
  if (seo.robots) upsertMetaTag("name", "robots", seo.robots);
  if (seo.site_name) upsertMetaTag("name", "site_name", seo.site_name);

  // Open Graph
  if (seo.og_type) upsertMetaTag("property", "og:type", seo.og_type);
  if (seo.og_title) upsertMetaTag("property", "og:title", seo.og_title);
  if (seo.og_description) upsertMetaTag("property", "og:description", seo.og_description);
  if (seo.og_image) upsertMetaTag("property", "og:image", seo.og_image);
  if (seo.og_url) upsertMetaTag("property", "og:url", toCurrentOrigin(seo.og_url));

  // Twitter
  upsertMetaTag("name", "twitter:card", "summary_large_image");
  if (seo.twitter_handle) upsertMetaTag("name", "twitter:site", seo.twitter_handle);

  // Canonical
  if (seo.canonical) upsertLinkTag("canonical", toCurrentOrigin(seo.canonical));

  // Hreflang annotations (Faz 7)
  if (seo.hreflang_links?.length) {
    for (const alt of seo.hreflang_links) {
      if (alt.hreflang && alt.href) {
        upsertLinkTag("alternate", toCurrentOrigin(alt.href), alt.hreflang);
      }
    }
  }

  // HTML lang attribute
  if (seo.lang) document.documentElement.lang = seo.lang;

  if (seo.json_ld?.length) syncStructuredData(seo.json_ld);
}

/**
 * FE-4: hreflang client fallback — backend payload'ı hreflang üretmediyse
 * `/` ↔ `/en/` alternates + x-default ekler.
 *
 * Kurallar:
 * - DOM'da zaten hreflang'lı alternate varsa (server payload uygulanmış) NO-OP.
 * - Sayfa noindex ise NO-OP (indexlenmeyecek sayfaya hreflang yatırımı yok).
 * - Yalnız pathname kullanılır (parametresiz self-alternate — ?page/?q
 *   duplicate'leri crawl budget'ı yemesin).
 * - Asıl SEO kanalı backend `hreflang_links` payload'ıdır; bu yalnız fallback.
 */
export function applyHreflangFallback(): void {
  if (document.querySelector('link[rel="alternate"][hreflang]')) return;
  const robots = document
    .querySelector<HTMLMetaElement>('meta[name="robots"]')
    ?.getAttribute("content");
  if (robots?.includes("noindex")) return;

  const path = window.location.pathname;
  const trPath = path.replace(/^\/en(\/|$)/, "/") || "/";
  const enPath = trPath === "/" ? "/en/" : `/en${trPath}`;
  const origin = window.location.origin;

  upsertLinkTag("alternate", `${origin}${trPath}`, "tr");
  upsertLinkTag("alternate", `${origin}${enPath}`, "en");
  upsertLinkTag("alternate", `${origin}${trPath}`, "x-default");
}
