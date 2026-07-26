import { callMethod } from "../utils/api";
import type { ServerSeoPayload } from "../seo/setPageMeta";

type PublicSeoPageType = "home" | "category";

/**
 * Detay API'si olmayan public sayfaların SEO payload'unu backend'in mevcut
 * meta/schema üreticisinden alır. Client'ta Organization/WebSite hardcode edilmez.
 */
export function getPublicPageSeo(
  pageType: PublicSeoPageType,
  slug?: string
): Promise<ServerSeoPayload> {
  return callMethod<ServerSeoPayload>("tradehub_core.api.seo.get_public_page_seo", {
    page_type: pageType,
    ...(slug ? { slug } : {}),
  });
}
